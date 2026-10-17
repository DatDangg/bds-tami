Agent: reviewer

# Review — build/tami-website · layer-6-task-03 · round 1

- **Review level:** STRICT
- **Reason:** shared factory hook (`withContentDefaults`, every slugged content collection), `src/proxy.ts` (every public request), new DB table and migration, root 404 restructure (every public route), redirect target handling (open-redirect surface), cache headers, new dependency.
- **Scope:** uncommitted diff vs HEAD `ed37f66`, not counting the primary's tracking edits (`spec/changes/BACKLOG.md`, `tasks/tami-website/layer-6-task-04.md`, `layer-6-task-08.md`, `.context/progress.json`) or `.claude/launch.json`.

## Blast radius
- `src/proxy.ts`: every non-dotted public URL. Detail-shaped URLs (`<detail prefix>/<slug>`, vi and en) now run one indexed DB query before next-intl.
- `src/collections/_shared/content-defaults.ts`: `afterChange` of every content collection that has a route and a slug (news, projects, rentals, services, job-postings…). Runs in the same transaction as the save (`req`).
- `redirects` table plus the `payload_locked_documents_rels.redirects_id` column (additive migration).
- Root rendering: `[locale]/[...rest]` removed, `experimental.globalNotFound` on, `app/global-not-found.tsx`, `PublicDocument` pulled out of `[locale]/layout.tsx`, `rewrites.afterFiles` for single-segment dotted paths.
- 5 test fixtures, `proxy.test.ts`, and the docs ARCHITECTURE §5.1, ERD §4.13, API_SPEC §5.
- New dependency `@payloadcms/plugin-redirects@3.91.0`, pinned to the same version as the other Payload packages.

## Verify commands + result (from `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 106 files, 1134 tests. The DB integration tests ran ("Pulling schema", test DB), including `tests/integration/content-redirects.test.ts` |
| `pnpm build` | PASS: Next 16.4.2, `✓ globalNotFound` experiment, routes `/_not-found` (dynamic), `/[locale]` (SSG with `[]`), `Proxy (Middleware)` |
| `pnpm install --frozen-lockfile` | not re-run (the lockfile diff matches the single new dependency, and test/build ran against the installed tree) |

I did not curl the app (reviewers do not run the app). The 404 SSR and real-301 checks rely on the builder's curl evidence in `.context/runs/build-tami-website-layer-6-task-03.md` (see Residual risk).

## Acceptance Criteria
| AC | Status | Evidence |
|---|---|---|
| Changing the vi slug of a published post gives `/tin-tuc/cu → /tin-tuc/moi`; changing the en slug gives `/en/news/old → /en/news/new`; changing a draft's slug creates no redirect | OK | `content-redirects.test.ts:113-150` |
| No chains (A→B, B→C ⇒ A→C) and no loops | OK | `:152-170`, plus the slug-reuse case `:172-180`. Logic in `create-slug-redirect.ts:25-34` and `:60-67` |
| Old URL returns 301 to the new URL | OK (partly unit/mocked) | `proxy.test.ts` "proxy redirect slug cũ" (`resolveRedirect` mocked) plus `findRedirectTarget` against the real DB. There is no automated end-to-end test; the builder's curl in the journal is the only end-to-end evidence |
| Only admins can view/edit `redirects` | OK | `content-redirects.test.ts:189-203` (sale and anonymous get 403), `redirects-plugin.ts:23-24` |
| G15(a): server HTML for 404 has `h1` in the right language plus header/footer | OK (curl evidence from builder) | `global-not-found.tsx`, ARCH §5.1 as-built note |
| G15(b): redirect is looked up BEFORE `notFound()` and returns a real 301 | OK | Lookup happens in `proxy.ts:14-20`, not in `not-found.tsx` |
| G15: wrong locale at layout level gives 404 with content | OK by construction | Non-dotted paths are rewritten by next-intl to `/vi/<x>` and match no route, so they reach global-not-found. Dotted single-segment paths are handled by `rewrites.afterFiles` → `/__not-found__/…` |
| R16: ARCHITECTURE §5.1 note | OK | diff of `docs/ARCHITECTURE.md` |

## Findings

### [MAJOR] M1: the open-redirect guard can be bypassed with a backslash (`/\evil.com`)
- `src/lib/content/find-redirect.ts:6` `INTERNAL_PATH = /^\/(?!\/)\S*$/` and `src/collections/redirects-plugin.ts:7` `SITE_PATH` (same regex) both accept `"/\\evil.com"`, because the lookahead only rejects a second `/`.
- `src/proxy.ts:16` then builds `new URL(target, request.nextUrl)`. The WHATWG URL parser treats `\` as `/` for http(s), so `new URL("/\\evil.com", "https://site")` → `https://evil.com/`. The proxy answers with a 301 to an external host from the site's own domain.
- Writing `redirects` requires an admin (the hook encodes slugs with `encodeURIComponent`, so `\` becomes `%5C`). But the stated invariant ("dữ liệu `redirects` không được dẫn khách ra ngoài") is broken in both layers, and this is the exact vector named in the review brief. The test `content-redirects.test.ts:205-212` only covers `https://` and `//`.
- **Fix:**
  1. Change both regexes to reject `\` anywhere and a leading `//` or `/\`. For example `/^\/(?![\/\\])[^\s\\]*$/`, shared from one module instead of duplicated (DRY).
  2. Defense in depth in `proxy.ts`: after building `location`, return the redirect only if `location.origin === request.nextUrl.origin`.
  3. Add test cases for `/\\evil.com`, `/\\/evil.com` and `\\\\evil.com` (validator rejects with 400, `findRedirectTarget` returns `null`), and a proxy unit test where `resolveRedirect` returns `"/\\evil.com"` and the expected result is no external `Location`.

### [MINOR] m1: proxy DB lookup on the hot path has no timeout or cache
`src/proxy.ts:14`, `src/lib/content/resolve-redirect.ts:13`. Every detail-shaped request, including RSC prefetch and ISR-cached pages that previously needed no DB, now waits on one indexed query (unique `redirects_from_idx`). Errors are caught and logged, which is good. But the pool has no `connectionTimeoutMillis` (`payload.config.ts:86`; pg default 0 means wait forever), so a hung or exhausted DB blocks pages that could have been served from ISR. Suggest racing the query against a short timeout (around 200–300 ms → treat as no redirect) and/or an in-memory cache with a short TTL. Not blocking at the current traffic profile.

### [MINOR] m2: Cache-Control on the 301 (ruling on deviation 4)
The 301 inherits `public, s-maxage=60, stale-while-revalidate=300` (RSC variant `no-store`). If a redirect is removed (slug reused or reverted), the CDN can serve the stale 301 for about 6 minutes. That is roughly in line with the content-refresh SLA (≤1 min plus SWR), so it is accepted. Browsers may also cache a 301 heuristically, and `public` allows heuristic caching, which is inherent to 301 semantics under BR-05. Optional: set `public, max-age=0, s-maxage=60` explicitly on the redirect response so browsers do not cache it indefinitely.

### [MINOR] m3: redirects left pointing at removed content (ruling on residual 2)
Hard delete or trash of a doc leaves `A → <its URL>` redirects in place, so visitors get a 301 to a 404. This is not a loop and not a security issue. Suggest a follow-up: in `afterDelete` (purge), and optionally when the doc is trashed or unpublished, delete redirects whose `to` is one of the doc's public URLs, so that old URLs return 404/410 directly. Add it to the gap register.

### [MINOR] m4: creating the redirect can race with a concurrent save
`create-slug-redirect.ts:31-34` does find-then-create on a unique `from`. Two concurrent saves can hit a unique violation, which rolls back the whole content save because it shares the transaction. Rare (admin edits). An upsert or catch-and-update would remove the risk.

### [MINOR] m5: feature verification in the task file is still `pending`, and there is no automated end-to-end test for the 404 SSR or the real 301
G15 evidence is curl-only (journal). At close-out the primary must copy the curl evidence (status, `Location`, `Cache-Control`, presence of `h1`/header/footer in raw HTML for `/khong-ton-tai`, `/en/khong-ton-tai`, `/wp-login.php`, and an old slug) into `## Feature Verification`. Recommended: an e2e check in `tests/e2e` (needs `next start`) in a later task.

## Rulings on builder deviations
1. **`afterChange` instead of `beforeChange`: ACCEPT.** The hook sees the final slug after field hooks, and the work shares the transaction via `req`. API_SPEC §5 has been updated to match.
2. **Lookup in the proxy: ACCEPT.** This is required by G15(b); only the proxy can return a real HTTP 301 here. Conditions: fix M1, and m1 is recommended.
3. **`to` as text: ACCEPT.** Slugs differ per locale, so the plugin's `reference` field cannot express the target. ERD §4.13 has been updated. Validation must be fixed per M1.
4. **No explicit Cache-Control on the 301: ACCEPT** (see m2).
5. **Residual: detail pages that call `notFound()` still render an empty shell: ACCEPT** as a documented Next 16 limitation (ARCH §5.1 "Giới hạn còn lại"). Every later task that adds a detail page (news, projects, rentals, services, careers detail; the `/en` missing-English case) **must** carry an AC that server HTML for an unknown slug has 404 content, for example by resolving existence in the proxy or a rewrite. The primary should record this as a gap entry and attach it to those tasks.
6. **Residual: hard delete leaves dangling redirects: ACCEPT** as a follow-up (m3).
7. **Residual: changing a slug during public→draft still creates a redirect: ACCEPT.** The old URL was public, so redirecting it keeps link equity. It lands on a 404 only until the doc is republished. Same remedy family as m3 if the product wants it.

## Other gates
- **Open-redirect variants:** `https://`, `//`: blocked. `/\`: **bypass (M1)**. `%2F%2F`, `%5C`: stay as path segments (the URL parser does not decode them), so they are safe. Tab/newline: rejected by `\S`.
- **Chains and loops:** correct for the tested cases. Inbound redirects are repointed, a redirect whose `from` is the new URL is deleted before re-pointing, and redirects whose `from` equals the current public URL are deleted on every public save.
- **Locale (`as-needed`):** `from` and `to` are public URLs, and the lookup runs before next-intl. `/vi/tin-tuc/cu` takes two hops (next-intl 301, then the slug 301), which is acceptable.
- **Edge/node runtime:** in Next 16, `proxy.ts` runs on Node. The build succeeds with `@payload-config` imported into the proxy. Residual: the proxy bundle may hold its own Payload instance and DB pool if module graphs are not shared (I could not verify that statically). `getPayload` caches on `global`, which should dedupe within one process.
- **`experimental.globalNotFound`:** an experiment flag on a pinned Next version (16.4.2). Accepted with the rationale in ARCH §5.1. Recheck on any Next upgrade.
- **`rewrites.afterFiles` `/:segment([^/]*[.][^/]*)` → `/__not-found__/:segment`:** only single-segment dotted paths, applied after `public/` files and static routes (`/robots.txt` is listed in the build). Future metadata routes such as `/sitemap.xml` and `/llms.txt` are static, so they are matched first. These responses keep `DOTTED_PATH_CACHE_CONTROL` (s-maxage=60), so CDN shields bot traffic to `/wp-login.php`. OK.
- **404 cache:** `private, no-cache, no-store`. This matches the L4-T03 as-built behavior for page 404s, so it is not a regression. Origin cost per 404 is one SSR with the cached shell (`unstable_cache`). Acceptable.
- **New dependency (ponytail):** ERD §4.13 names the plugin, and it supplies the collection plus the admin UI that FR-ADM-15 will use later. The overrides replace most fields, so a hand-written collection would have been similarly small, but the spec decision stands. ACCEPT.
- **Migration safety:** additive only (new enum, new table, nullable column plus FK on `payload_locked_documents_rels`, indexes). The UNIQUE constraint is on a new empty table. Not `HIGH_RISK_MIGRATION`. `migrations/index.ts` is registered. OK.
- **Tests:** happy, error and edge cases are covered (draft, en without English, reuse, revert, no-change, ACL, validation). Gaps: M1 cases, end-to-end 301/404 (m5), delete cleanup (m3).
- **Surgical diff:** every change traces to the task or G15. The fixture plugin additions are required because the factory hook now writes `redirects`. OK.

## Responsive Checklist Gate
UI touched: yes, structurally only. `PublicDocument` is the same `<html>`/font/`NextIntlClientProvider`/`PublicShell` markup moved out of `[locale]/layout.tsx`. `global-not-found` reuses the existing `[locale]/not-found.tsx` content. There are no CSS or class changes.
| Item | Result | Evidence |
|---|---|---|
| Layout: no horizontal scroll / mobile-first / grid / container | N/A | no styling change; markup identical to the pre-diff layout |
| Typography / spacing (rem, clamp) | N/A | no new styles |
| Media (max-width, aspect-ratio, srcset) | N/A | no media added |
| Touch targets ≥44px / mobile nav / tables | N/A | same `PublicShell` (MobileMenu unchanged) |
| Viewport/A11y (100dvh, reduced-motion, overflow) | N/A | no new styles; `lang` set from locale in both paths |
Residual: I did not check the 404 in a browser at 375/768/1280. It reuses the existing S17 layout reviewed earlier.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured. eslint PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK. Every file is ≤75 lines, functions are ≤30 lines, names are clear, comments explain WHY, and ARCH/ERD/API_SPEC are updated. 0 indicators.
- ai-friendly-web: N/A for this task. `robots.txt` is unaffected (static route served before the rewrite).
- blitzstrike: skip, not installed and no permitted environment. M1 was found by static analysis, not STRIKE-validated. It is still rated MAJOR because the URL parser behavior is deterministic and the guard explicitly aims to block it.

## Residual risk
- 404 SSR content and the real 301 on `next start` were verified only through the builder's curl (journal). I did not run them.
- Possible duplicate Payload instance or pool in the proxy bundle (not verified statically).
- The read cap was respected. Some source reads went through `cat` in Bash in one batch (process deviation, no impact on findings).

## Verdict
**FAIL**: 1 MAJOR (M1, open-redirect bypass via `/\`). The builder fixes M1 (shared regex, same-origin check in the proxy, tests). The MINORs are recommended or can go to follow-ups; m5 is a close-out duty for the primary.
