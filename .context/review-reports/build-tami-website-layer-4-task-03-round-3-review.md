Agent: reviewer

# Review: build/tami-website layer-4-task-03, round 3

- **Review level:** STRICT
- **Reason:** Cache-Control policy for a shared CDN (cache poisoning / leaking data through the CDN). Shared config (`next.config.ts` `headers()`, catch-all REST route `api/[...slug]`, `Media` collection). This round re-checks a security MAJOR from round 2.
- **Blast radius:** every public page (`/`, `/en`, `/[locale]/*`), paths with a file extension (robots/sitemap/llms/favicon, `public/`), `/admin`, every REST endpoint under `/api/[...slug]` (default `no-store`), media images `/api/media/file/*` (immutable), `src/lib/content/public-queries.ts` (used by later public-page tasks), and the Cloudflare rule in layer-6-task-01.
- **Diff:** working tree vs HEAD `fcf5b30` (tracked + untracked: `src/lib/http/cache-policy.ts(+test)`, `src/lib/content/{public-queries,pagination}.ts(+test)`, `tests/integration/public-queries*.test.ts`).

## Verify commands + result (re-run by reviewer, from `.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK (0 errors) |
| `pnpm typecheck` | OK |
| `pnpm test` | 73 files / 778 tests PASS |
| `pnpm build` | OK (`/vi`, `/en` SSG; `/admin`, `/api/*` dynamic) |
| `next start -p 3987` (header measurement) | Measurements below. Process stopped with `taskkill /PID 28620`; port confirmed free |

### Headers measured on `next start` (reviewer)

| Request | Status | Cache-Control | Notes |
|---|---|---|---|
| `/`, `/en`, `HEAD /` | 200 html | `public, s-maxage=60, stale-while-revalidate=300` | Plain HTML keeps its header (the `has` rules do not leak onto it) |
| `/` + `RSC: 1` (uppercase) | 307 → `/?_rsc` | `no-store` | `has` lowercases the key (prepare-destination.js:65) |
| `/` + `rsc: 0` / `rsc: 2` | 200 html (same body hash as `/`) | `no-store` | Response is not RSC; only loses caching, no poisoning |
| `/` + `rsc:` (empty) | 200 html (same body) | public | Next only treats `rsc === '1'` as RSC (`is-rsc-request.js:15`), so this is HTML. Safe |
| `/?_rsc=abc` (no RSC) | 200 html | `no-store` | |
| `/?_rsc=` / `/?_rsc` (empty, no RSC) | 200 html (same body) | public | `matchHas` does not match an empty value; the response is still HTML, see MINOR-3 |
| `/?_rsc=abc` + RSC | 307 → `/?_rsc` | `no-store` | |
| `/?_rsc=` + RSC | 200 `text/x-component` | `no-store` | |
| `/en` + RSC | 307 → `/en?_rsc` | `no-store` | |
| `/vi` + RSC, `/vi/abc` + RSC | 301 | `no-store` | 301 redirect from the proxy also gets the rule |
| `/vi` (plain) | 301 → `/` | public s-maxage=60 | Same for every client. OK |
| `/` + only `Next-Router-Prefetch` / only `Next-Router-State-Tree` | 200 html | `no-store` | |
| `/` + `Next-Action` (GET), `Next-Url`, `Next-Hmr-Refresh`, `next-test-proxy-port`, `x-prerender-revalidate`, `Purpose: prefetch`, cookie `__prerender_bypass=abc` | 200 html, **same body hash** as `/` | public | Next 16 does not change the response for these headers without `rsc: 1` or a valid preview secret. No poisoning |
| `/` + `x-middleware-prefetch` | 200 `{}` | `private, no-cache, no-store…` (Next) | OK |
| `/` + `x-now-route-matches` + RSC | 307 | `no-store` | OK |
| `POST /` + `Next-Action` | 400 | `no-cache, no-store…` | POST is not cached by the CDN |
| `/khong-co` (with/without RSC), `/en/x.y` + RSC | 404 | `private, no-cache, no-store…` | |
| **`/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/abc.def` + `RSC: 1`** | **307 → `<path>?_rsc`** | **`public, max-age=0, s-maxage=60`** | See MINOR-1 |
| `/robots.txt?_rsc` + RSC | 404 `text/x-component` | public, s-maxage=60 | Cache key contains `_rsc`. See MINOR-1 |
| `/brand/tami-logo-gold.png` (with/without RSC) | 200 image/png | `public, max-age=0, s-maxage=60` | Static file is served before the RSC check. OK |
| `/admin` | 200 | `no-store` | |
| `/api/health`, `/api/categories` | 200 | `no-store` | |
| `/api/monitoring-config` | 200 | `private, max-age=300` | Not overridden by the config |

**Header list read from Next 16.4.2:** `app-router-headers.js` → `FLIGHT_HEADERS = [rsc, next-router-state-tree, next-router-prefetch, next-hmr-refresh, next-router-segment-prefetch]`, plus `next-action`, `next-url`, `_rsc`.
- `next-hmr-refresh` only affects dev (`parse-request-headers.js:25`). Measured on prod: response unchanged.
- `next-url` / `next-action` only take effect alongside `rsc: 1` or a POST.
- The path-based RSC normalizers (`.rsc`, `.segments`) only run in `minimalMode` (`base-server.js:372-373`). They do not apply to `next start`.
- The rule list covers every header that makes the server return something other than HTML.

**`no-store` without `private` (RFC 9111 §5.2.2.5):** `no-store` forbids **every** cache (private and shared) from storing any part of the request or response. That is enough to stop the CDN storing it. Cloudflare respects `no-store` unless a Cache Rule overrides the Edge TTL. layer-6-task-01 already has an AC to bypass on `rsc`/`_rsc` and not override the TTL.

## Responsive Checklist Gate

N/A: the diff does not touch UI (route/component/CSS). Only HTTP headers and the query layer change.

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip: `aislop` is not installed (`which aislop` returned empty) |
| oxlint (anti-slop) | skip: oxlint is not configured (no `.oxlintrc.json`). ESLint `pnpm lint` passes |
| ocr (open-code-review) | skip: `ocr` is not installed |
| AI-readable | OK: `cache-policy.ts` is 86 lines, every function is under 50 lines, constants are named, and the comments explain why (Cloudflare ignores `Vary`, rule order). ARCHITECTURE §5.1 is updated. 0 indicators (the comment/doc mismatch is listed under MINOR-2) |
| ai-friendly-web | N/A for this task: robots/sitemap/llms.txt belong to the SEO task in a later layer. This task only sets their TTL |
| blitzstrike | skip: not installed and no permitted environment. The reviewer probed header variants by hand on `next start` (table above) |

## Findings

### Round 2 items
- **MAJOR-1 (RSC variants of public pages getting `public`): CLOSED.** The 5 `has` rules are at `src/lib/http/cache-policy.ts:45-54` and come after the public rule (`:62-64`).
  - Measured: uppercase header, `rsc` with odd values, `_rsc` with a value, prefetch, state-tree, `/en`, and the 301 for `/vi` + RSC all return `no-store`.
  - Plain HTML keeps `public, s-maxage=60, stale-while-revalidate=300`.
  - The unit test locks the order and conditions (`cache-policy.test.ts:79-96`).
- **MINOR-A: CLOSED.** `PublicCollectionSlug = Extract<CollectionSlug, "categories" | "developers">` (`src/lib/content/public-queries.ts:11`). Typecheck and the integration tests `public-queries*.test.ts` pass, so it does not break any caller.
- **MINOR-B:** accepted as residual (recorded in the task file).

### New items

**[MINOR-1] The `DOTTED_PATH_SOURCE` group did not get the RSC rules. A request with `RSC: 1` to a dotted path that renders through a page returns a 307 with `public, s-maxage=60`.**
- Where: `src/lib/http/cache-policy.ts:51-52` (`rscVariantNoStoreRules` only uses `PUBLIC_PAGE_SOURCE`) and `:65`.
- Evidence: `/robots.txt`, `/sitemap.xml`, `/favicon.ico`, `/abc.def` + `RSC: 1` → `307 Location: <path>?_rsc`, `Cache-Control: public, max-age=0, s-maxage=60`. Without the RSC header the same URL returns 404 html.
- This is the same class as round 2 MAJOR-1: a shared-cacheable response that differs by header at the same URL.
- **Why MINOR, not MAJOR:**
  1. Every dotted path that goes through a page today is a 404 anyway. Poisoning only turns a 404 into a 307 that leads to a 404 for 60s.
  2. Real files in `public/` are served before the RSC check (measured on the png: 200, no 307).
  3. Edge mitigation: the layer-6-task-01 AC bypasses the cache when the request has `rsc` / `_rsc`, for every path.
- **Suggested fix (one line):** in `rscVariantNoStoreRules`, generate the same `has` rules for `DOTTED_PATH_SOURCE`, placed after the `DOTTED_PATH_SOURCE` rule. Alternatively, record a residual so the SEO task (robots/sitemap/llms) measures `+ RSC: 1` on the real routes.

**[MINOR-2] Comments, docs and test title say `private, no-store` but the actual value is `no-store`.**
- Where:
  - `src/lib/http/cache-policy.ts:43` ("Nên các biến thể này `private, no-store`")
  - `src/lib/http/cache-policy.test.ts:79` (test title)
  - `docs/ARCHITECTURE.md` §5.1 as-built paragraph ("nhận `private, no-store`")
  - `tasks/tami-website/layer-6-task-01.md` new AC ("origin đã trả `private, no-store`")
- The as-built doc does not match the code. Security is unaffected, because `no-store` alone is enough.
- **Fix:** change all four places to `no-store`.

**[MINOR-3] The `has` query rule `_rsc` does not match an empty value (`/?_rsc`, `/?_rsc=`).**
- Cause: `matchHas` requires a truthy value (`prepare-destination.js:97-100`).
- Not exploitable: without `rsc: 1` the response is HTML (same body as `/`), and with `rsc: 1` the header rule catches it. The Next client always sends a non-empty hash.
- **Fix:** none needed in code. Add one line to the comment / ARCHITECTURE saying the empty-value case is handled at the edge (the Cloudflare rule bypasses whenever the `_rsc` query is present, already in the layer-6 AC).

**[MINOR-4] Task file bookkeeping: `## Retry / Error Memory` still says `Attempt: 2` and the last failure is the round 1 one, while the body records attempt 3 (round 2 FAIL).**
- Where: `tasks/tami-website/layer-4-task-03.md` (Retry block).
- Also: the "Doc impact result" line does not mention the new AC in `layer-6-task-01.md`.
- **Fix:** update to `Attempt: 3`, last failure = round 2 MAJOR-1, and add the layer-6 AC to doc impact.

### Residual risk
- Not measured on a real Cloudflare. Correctness depends on the layer-6-task-01 AC: bypass on `rsc` / `next-router-*` / `_rsc`, and no Edge TTL override.
- Draft mode / Live Preview: today `__prerender_bypass` with a wrong secret does not change HTML (measured). When the draft/preview task is added, it needs an AC for `no-store` on draft responses, or a Cloudflare bypass by cookie, because the config `headers()` would put `public, s-maxage=60` on draft HTML.
- Route handlers for robots/sitemap/llms (SEO task) have not been measured with `RSC: 1` (related to MINOR-1).
- Integration media 200/304 immutable: ran in `pnpm test` (PASS). It depends on `DATABASE_URL` / SeaweedFS in the environment; the suite passed all 778 tests with nothing skipped.

## Verdict

**PASS**

There are no CRITICAL or MAJOR findings. Round 2 MAJOR-1 is closed (independently measured on `next start`, including uppercase headers, empty `_rsc`, every header Next 16 uses for RSC, the `/vi` 301 + RSC redirect, and dotted paths). MINOR-A is closed. MINOR-1 to 4 can be fixed in the close-out or recorded as residual; none of them blocks the commit.
