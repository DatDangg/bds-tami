Agent: reviewer

# Review: build/tami-website, layer-5-task-08 (SEO foundation), round 2

- **Review level:** STRICT
- **Reason:** shared SEO helpers used by every public page, indexing decisions (noindex, robots.txt), CDN cache rules, and a rendering-mode change on the root `[locale]` layout (prerender removed). Every page under `[locale]` inherits that change. The task file also requires STRICT.
- **Scope:** uncommitted diff vs HEAD `7f7f721`, ignoring `.claude/launch.json`. Files: `src/lib/seo/{site-url,metadata,robots}.ts` (+tests), `src/app/robots.ts`, `src/components/seo/JsonLd.tsx` (+test), `src/lib/seo/json-ld.ts` (+test), `src/components/layout/Breadcrumb.tsx`, `src/lib/http/cache-policy.ts` (+test), `src/app/(frontend)/[locale]/layout.tsx`, `docker/Dockerfile` (comment only), `tasks/tami-website/layer-8-task-05.md` (follow-up note), `.context/progress.json`.

## Blast radius
- **Every route under `[locale]`.** `page.tsx` (home) and `[...rest]` (404 catch-all) now render on the first request, then are cached by ISR (`revalidate = 60`). Nothing is prerendered at build time anymore.
- **Layout `generateMetadata`.** It sets `metadataBase` and adds noindex outside production.
- **`/robots.txt`.** Production keeps a media exception.
- **Every future page that calls `buildPageMetadata`.** This covers the robots/follow policy.
- **CDN cache rules for dotted paths when the request is an RSC request.**
- **Breadcrumb JSON-LD.**
- **The on-demand revalidation hooks** (`revalidatePath`/`revalidateTag`, from L5-T03/T05) now act on pages that were generated on demand, not on build-time pages.

## Verify commands + result
| Command (`.context/project-config.md`) | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS, 99 files / 1029 tests |
| `pnpm build` | PASS (exit 0). Route table: `● /[locale]` has **no child paths** (round 1 listed `/vi` and `/en`), `ƒ /[locale]/[...rest]`, `ƒ /robots.txt`, `○ /_not-found`, Proxy present |
| `pnpm install --frozen-lockfile` | not re-run (lockfile untouched) |

Build artifact check, done by reading files rather than starting a server:
- `.next/server/app/*.html` contains only `_global-error.html` and `_not-found.html`. There is no `vi.html`, `en.html` or `index.html`.
- Grep of every built HTML file for `name="robots"`, `rel="canonical"` and `localhost:3000` finds only `_not-found.html: name="robots" content="noindex"`. That is Next's default for 404 pages. It does not depend on the environment and is correct on every environment.

I did not start a server, and port 3000 was left alone. The builder's `next start :3220` curl evidence (staging returns `noindex, nofollow`, production has no robots meta, `x-nextjs-cache: MISS` on the first request, HTML Cache-Control unchanged, RSC returns `no-store`) is consistent with the code and the build artifacts. I accept it as corroboration.

## Round 1 findings: closure
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1: forced noindex emitted `nofollow` | **CLOSED** | `metadata.ts:111-119`: `follow = isIndexingAllowed()`, so `seo.noindex` and `forceNoindex` in production give `{index:false, follow:true}`. Non-production gives `{index:false, follow:false}`. Tests at `metadata.test.ts:116-128` cover both. Matches `docs/DESIGN.md:305` |
| MAJOR-2: robots.txt blocked `/api/media/file/` | **CLOSED** | `robots.ts:10`: `allow: ["/", "/api/media/file/"]`, `disallow: ["/admin", "/api/"]`. Test at `robots.test.ts:13`. Follow-up note added to `layer-8-task-05.md:97-98` |
| MAJOR-3: build-time noindex/canonical baked into prerendered HTML | **CLOSED** | `layout.tsx:15-17`: `generateStaticParams()` returns `[]`, and `revalidate = 60` is kept. The build table and `.next/server/app` confirm no locale HTML at build. The first render happens at runtime with the real `APP_ENV`/`NEXT_PUBLIC_SITE_URL`. `getSiteUrl()` still guards the build phase (`site-url.ts:16`) as defense in depth |
| MINOR-1: rent unit | CLOSED | `json-ld.ts` offers include `UnitPriceSpecification` with `unitText: "MONTH"` |
| MINOR-2: `"VN"` literal | CLOSED | `json-ld.ts:5` `DEFAULT_COUNTRY` |
| MINOR-3: siteName computed twice | CLOSED | `metadata.ts:105` computes it once and reuses it at lines 106 and 125. No more `as string` cast |

## Impact of `generateStaticParams: []` (checked as requested)
- **`dynamicParams`.** It is not set anywhere (Grep of `src` and `next.config.ts`), so it keeps the default `true`. Any locale is rendered on demand. An invalid locale still hits `hasLocale` and calls `notFound()` at runtime (`layout.tsx:43-44`). This is unchanged.
- **Child routes.** `[locale]/page.tsx` is a placeholder and reads no params. `[...rest]/page.tsx` only calls `notFound()` and was already `ƒ`. Neither one relied on build-time locale params, and `setRequestLocale` is still called per request.
- **not-found (L5-T06).** `[locale]/not-found.tsx` renders inside the layout at runtime, so it gets the correct locale and the env-correct metadata. The build-time `_not-found` comes from Next's own default and carries only `noindex`.
- **On-demand revalidation / e2e (L5-T05).** `tests/e2e/revalidate-globals.ts` loads the page, edits a global, then reloads. It does not assume a build-time prerender: the first visit populates the ISR cache, and `revalidateTag`/`revalidatePath` invalidate it as before. Calling `revalidatePath("/vi")` before any visit is a harmless no-op. I did not run the e2e because it needs a running server and a database, which is outside the allowed commands (see Residual risk).
- **Env baked anywhere else.** No source file reads `process.env.NEXT_PUBLIC_SITE_URL` or `APP_ENV` directly for SEO. SEO goes only through `site-url.ts`, which uses dynamic keys. `robots.ts` is `force-dynamic`. The other `APP_ENV` readers (`logger`, `monitoring-config`, email allowlist, jobs) run at runtime and are not SEO. No other `generateStaticParams` or `force-static` exists.

## Builder residual risks: assessment
1. **Canonical/hreflang not emitted until pages call `buildPageMetadata`: ACCEPTABLE.** The layout deliberately does not set a canonical, because child pages would inherit the wrong one. The home page is still a placeholder. Pages are wired up in L6-T01/T04-08, L7-T03, L8 and later. Production pages without a canonical are not harmful (self-canonical is implied). Staging is protected by noindex plus `Disallow: /`.
2. **On-disk ISR cache per container: ACCEPTABLE, pre-existing.** ISR caching was already on disk before this task (L5-T05 design). This task only changes when a page first enters the cache. With more than one app replica, each replica renders on its own and the webhook revalidation only reaches the replica that receives it. That is an existing architectural concern, not a new one. Track it as an L13/deploy note if the app scales out.
3. **First-request latency after deploy: ACCEPTABLE.** Each new image renders `/vi` and `/en` on the first hit (the `loadShell` queries use cached globals). The CDN `s-maxage=60, stale-while-revalidate=300` absorbs most traffic. An optional warm-up in `deploy.sh` is now a performance nicety, not a correctness requirement.

## Responsive Checklist Gate
N/A. The diff has no visual UI change. `Breadcrumb.tsx` only swaps the inline `<script>` for `<JsonLd>` and reads the site URL through `getSiteUrl()`; markup and classes are unchanged. The layout change affects only metadata and rendering mode.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip, not installed (per round 1; not re-probed, to stay inside the allowed commands) |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint and tsc PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK. Names are clear, functions are under 50 lines, files are under 300 lines, and comments explain WHY (`layout.tsx:13-14`, `metadata.ts:112`, `robots.ts:9`). Magic literals are now named. 0 indicators |
| ai-friendly-web | N/A for this task. Production robots.txt allows all crawlers, including AI crawlers and media. `sitemap.xml`/`llms.txt` belong to L8-T05 (follow-up note present) |
| blitzstrike | skip, not installed / no authorized environment |
| Security (manual) | OK. Unchanged since round 1: `serializeJsonLd` escapes `<`, `seo.canonical` must be http(s), and `getSiteUrl` keeps only the http(s) origin |
| Cache safety | OK. RSC `no-store` rules come after both base sources (`cache-policy.ts:64-71`), and the order is tested |

## Findings
- No CRITICAL.
- No MAJOR.
- **[MINOR-1] The task file has no record of attempt 2.** `tasks/tami-website/layer-5-task-08.md:57` still says `Attempt: 0`, and the task file is not in the diff. **Fix:** at close-out, the primary should record Attempt 2, the round 1 FAIL and round 2 results, the MAJOR-3 direction it chose (no build-time prerender), and residual risks 1-3 above. Non-blocking for review.
- **[MINOR-2] (note) Nothing tests the layout rendering mode.** No test checks that `generateStaticParams()` returns `[]`, or checks the layout's `generateMetadata` noindex outside production. A future change could quietly bring back the locale prerender, which would also bring back MAJOR-3. **Fix:** add a small unit test for `layout.tsx`: `generateStaticParams()` returns `[]`; `generateMetadata()` with `APP_ENV=staging` returns `{index:false, follow:false}`; with `production` there is no `robots` key. Non-blocking.

## Residual risk
- The runtime HTML and header behavior was checked through the build artifacts, the code, and the builder's curl evidence. The reviewer started no server.
- `tests/e2e/revalidate-globals.ts` was not run (it needs a server and a database). I checked its logic by reading it: it does not depend on build-time prerender.
- schema.org validity was checked by reading the code. The Rich Results Test was not run.

## Verdict
**PASS**. All 3 round-1 MAJORs and 3 MINORs are closed, verified by code, tests, the build route table and the `.next` artifacts. Remaining items are MINOR only (task-file close-out record, and an optional layout test).
