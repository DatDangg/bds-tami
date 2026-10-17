Agent: reviewer

# Review — build/tami-website · layer-6-task-03 · round 2

- **Review level:** STRICT
- **Reason:** `src/proxy.ts` runs on every public request; open-redirect surface (round-1 M1); shared factory hook `withContentDefaults` → `create-slug-redirect` (every slugged content collection, same transaction as save) now takes a Postgres advisory lock; new DB table + migration; root 404 restructure; in-memory cache on the hot path; DB pool config change.
- **Scope:** uncommitted diff vs HEAD `ed37f66`, not counting primary tracking edits (`spec/changes/BACKLOG.md`, `.context/progress.json`, appended Follow-up/Quyết định sections in `tasks/tami-website/layer-6-task-0{4..8}.md`, `layer-7-task-03.md`) or `.claude/launch.json`. Focus: attempt-2 fixes for M1, m1, m2, m4, plus a re-check of round-1 rulings.

## Blast radius
- `src/proxy.ts`: every non-dotted public URL. Detail-shaped URLs do one cached lookup (process-local Map, 60 s TTL) bounded by a 400 ms race.
- `src/lib/content/internal-path.ts` (new, shared): the validator for `redirects.from`/`to` (`redirects-plugin.ts`) and the read filter in `find-redirect.ts`.
- `src/hooks/create-slug-redirect.ts`: `pg_advisory_xact_lock(726002)` inside the content-save transaction whenever a published slug changes. This serializes concurrent slug-change saves across all content collections until each commits.
- `src/payload.config.ts`: pool `connectionTimeoutMillis: 5000` applies to the whole app (admin, API, proxy). Before, a pool exhausted of connections waited forever. Now it fails after 5 s.
- Unchanged from round 1: the `redirects` table and migration, global-not-found, `PublicDocument`, rewrites, fixtures, and the docs ARCH §5.1, ERD §4.13, API_SPEC §5.

## Verify commands + result (`.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint exit 0) |
| `pnpm typecheck` | PASS (tsc exit 0) |
| `pnpm test` | PASS: 108 files, 1174 tests (DB integration ran: "Pulling schema from database") |
| `pnpm build` | PASS, re-run after the builder's final test-only edit. Routes `/_not-found` (ƒ), `/[locale]` (●), `/robots.txt`, `Proxy (Middleware)` |

I did not run curl or the app (reviewers do not run the app). The real 301 and 404 SSR rely on the builder's curl evidence on `next start :3222` in the journal (`.context/runs/build-tami-website-layer-6-task-03.md`, line 29).

## Round-1 findings: closure
| ID | Status | Evidence |
|---|---|---|
| M1 open redirect `/\evil.com` | **CLOSED** | `internal-path.ts:9` `/^\/(?![/\\]\|%2f\|%5c)[^\\\s\u0000-\u001f\u007f]*$/i`. Layer 1 is one shared module, used by `redirects-plugin.ts:7-8,26,32` and `find-redirect.ts:22`. Layer 2 is in `proxy.ts:20`: it redirects only when `location.origin === request.nextUrl.origin`, and otherwise logs a warning and falls through to i18n. Tests: `internal-path.test.ts` (22 reject / 6 accept cases), `content-redirects.test.ts:205-213` (bad rows inserted with raw SQL → `findRedirectTarget` returns null), `:224-235` (400 on both `from` and `to`), `proxy.test.ts:70-86` (origin check with `resolveRedirect` mocked to return evil targets) |
| m1 hot-path DB without timeout or cache | CLOSED (one residual, see r2-m2) | `resolve-redirect.ts`: 400 ms race, a 60 s cache for hits and misses, a 1000-entry cap that clears the whole map when full, and no caching of timeouts or errors. Pool `connectionTimeoutMillis: 5000` (`payload.config.ts:87`). Tests in `resolve-redirect.test.ts` (TTL, timeout not cached, error not cached) |
| m2 Cache-Control on 301 | ACCEPTED as documented | `proxy.ts:21` comment. RSC variant stays `no-store` according to the builder's curl evidence |
| m3 dangling redirects after hard delete | Follow-up (primary tracking) | — |
| m4 race on unique `from` | CLOSED (test weak, see r2-m1) | `create-slug-redirect.ts:20-30,35` |
| m5 feature-verification evidence | Still a primary close-out duty | Copy the curl evidence into the task's `## Feature Verification` |

## Independent checks
- **Validator edge cases:**
  - `/%2f`, `/%2F`, `/%5c`, `/%5C` are rejected (`i` flag).
  - `/\t…` and `/\n…` are rejected by `\s`. This matters because WHATWG strips ASCII tab and newline anywhere, so `/\t/evil.com` would otherwise become `//evil.com`.
  - `\s` in JS also covers Unicode spaces (NBSP, U+2028/2029, U+FEFF), and C0 and DEL are covered explicitly.
  - Mid-path `%5C` is allowed. The URL parser does not decode it, so it stays a path segment. This is safe.
  - Unicode lookalikes such as fullwidth `／` or `。` stay inside the path because the URL parser does not normalize them in the path. In any case, layer 2 (the origin comparison on the parsed URL) is authoritative for any input that parses.
  - `new URL(target, base)` cannot throw for strings that start with `/`, and only validated targets reach it.
- **Origin check covers all:** it compares the parsed `URL.origin` (scheme + host + port) with `request.nextUrl.origin`, after `search` is assigned. Any parser quirk that resolves to another host or scheme is caught. OK.
- **Unhandled rejections in the timeout race:**
  - `lookup.catch(() => undefined)` is attached before `Promise.race`, so a late rejection after a timeout is swallowed.
  - `timeout.promise` never rejects.
  - A `getPayload` rejection lands in the `try/catch`.
  - `finally` clears the timer, so no timer leaks on fast paths.
  - OK.
- **Cache keying and bounds:**
  - The key is the raw `pathname`, which includes the locale prefix (`/en/news/x` vs `/tin-tuc/x`), so entries are per locale and per path.
  - Size is bounded by the clear-all at 1000 entries.
  - Expired entries are only replaced, not proactively evicted, but the cap still bounds memory.
  - The query string is not part of the key. That is correct because lookup is by path only.
  - OK.
- **Advisory lock:**
  - Key `726_002` is distinct from `last-admin-guard.ts:14` `726_001`. Those are the only `pg_advisory*` uses in `src/`.
  - It uses the single-bigint form in both places, so there is no overlap with the two-int keyspace.
  - Scope is the transaction (`_xact_`), so the lock is released on commit or rollback, and it runs on the request's transaction session (`adapter.sessions[transactionID].db`).
  - When there is no transaction, it skips the lock without breaking anything.
  - Deadlock with last-admin-guard requires one transaction holding both keys in opposite orders. Staff saves never run the content slug hook, and content saves never touch the admin roster, so this is not possible.
  - Under READ COMMITTED, each statement after the lock takes a fresh snapshot, so the waiter's `find({from})` sees the committed row. Find-then-create is therefore correct under the lock.
  - The raw SQL is a constant (no injection).
  - OK.

## Findings

No CRITICAL. No MAJOR.

### [MINOR] r2-m1: the parallel-save test does not exercise lock contention (false confidence)
`tests/integration/content-redirects.test.ts:215-222` saves two **different** docs with distinct old and new slugs. The redirect `from` values differ, so no unique violation is possible, and the test passes with or without `lockRedirectWrites`. Correctness of the lock is established by reasoning above, not by the test.
**Fix (optional):** save the same doc concurrently to two different slugs (both runs try to create the same `from`), or spy on `adapter.execute` and assert the `pg_advisory_xact_lock(726002)` call. Alternatively, rename the test so it does not claim to verify the lock.

### [MINOR] r2-m2: the 400 ms budget does not cover `getPayload` init
In `resolve-redirect.ts:41-45`, the timer starts before `await getPayload({ config })`, but the race only begins after it. On a cold start, or if Payload init stalls, the request waits for init, which is bounded only by the pool's 5 s connect timeout or init errors. After init, `getPayload` is cached on `global`, so this affects only the first requests per process.
**Fix (optional):** race `getPayload(...).then((p) => findRedirectTarget(p, pathname))` as a single promise.

### [MINOR] r2-m3: process-local cache is not invalidated on redirect writes
When a slug is reused or reverted, the hook deletes the redirect, but each instance may keep serving the cached 301 for up to 60 s. The CDN may also cache that 301 (`s-maxage=60, swr=300`). The reverse case also applies: a fresh slug change leaves the old URL rendering its 404 for up to 60 s because the miss is cached. This is in line with the m2 ruling and the content refresh SLA, so it is accepted. Suggest one line in ARCH §5.1 noting the ≤60 s per-instance staleness.

### [MINOR] r2-m4: a query string in a stored `to` is overwritten
`proxy.ts:18` replaces `location.search` with the request's query. Targets from the hook never carry a query, but an admin-entered `to` like `/a?x=1` (accepted by the validator) would lose `?x=1`. Low impact. Merge the queries or document the behavior.

### Carry-over (primary)
- m3: follow-up for dangling redirects after hard delete.
- m5: copy the curl evidence (301 + Location + query, evil targets not followed, RSC `no-store`, 404 SSR `h1`/header/footer for vi/en/invalid locale/`wp-login.php`, 404 `no-store`) into `## Feature Verification` at close-out.

## Responsive Checklist Gate
Attempt 2 makes no UI changes (all changes are in lib, hook, proxy, config and tests). The round-1 structural UI change (`PublicDocument`, `global-not-found`) is unchanged.
| Item | Result | Evidence |
|---|---|---|
| Layout (no h-scroll / mobile-first / grid / container) | N/A | no styling change in diff |
| Typography / spacing | N/A | no new styles |
| Media | N/A | none added |
| Touch targets / mobile nav / tables | N/A | same `PublicShell`/MobileMenu |
| Viewport / A11y | N/A | no new styles; `lang` set from locale |
Residual: I did not check in a browser at 375/768/1280 (same as round 1).

## Skill gates
- aislop: skip, not installed.
- oxlint (anti-slop): skip, oxlint not configured. eslint PASS, tsc PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK. New and changed files are ≤90 lines, functions ≤30 lines, names are clear, magic numbers are named constants (`REDIRECT_LOOKUP_TIMEOUT_MS`, `REDIRECT_CACHE_TTL_MS`, `REDIRECT_CACHE_MAX_ENTRIES`, `REDIRECT_WRITE_LOCK_KEY`), and comments explain WHY. 0 indicators.
- ai-friendly-web: N/A (no public crawl surface changed; `robots.txt` route intact in the build).
- blitzstrike: skip, not installed and no permitted environment. The open-redirect closure was verified statically and by the unit/integration tests.

## Residual risk
- The real 301, the origin-check fall-through and the 404 SSR on `next start` were verified only through the builder's curl (journal).
- The lock under true same-`from` contention is verified by reasoning only (r2-m1).
- Possible separate Payload instance or pool in the proxy bundle (carried from round 1, not statically verifiable). `connectionTimeoutMillis` now bounds the impact.

## Verdict
**PASS**. M1 is closed with two layers plus tests. All 4 verify commands pass. The remaining items are MINOR (r2-m1..m4) and optional or follow-up. m5 (evidence in the task file) is a close-out duty for the primary.
