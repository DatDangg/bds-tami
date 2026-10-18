Agent: reviewer

# Review — build/tami-website · layer-9-task-08 · round 1

- Worktree: `D:\prj\bds-wt9-t08` (branch `wt/l9-t08` from `b527146`, uncommitted)
- Task: `tasks/tami-website/layer-9-task-08.md` (S05 `/cho-thue/danh-muc/[category]` + `loading.tsx` skeleton D5)

## Review level
**STRICT**

## Reason
New public route. Shared canonical, sitemap and 404 code (`MISSING_PAGE_RULES`, `sitemap-data`). The shared `RentalListPage` and filter components changed. The `page.tsx` of 5 public list routes moved into a route group, and new `loading.tsx` Suspense boundaries now sit in front of 8 force-dynamic list routes. That boundary changes HTTP status and streaming behaviour.

## Blast radius
- Routes: `/cho-thue`, `/du-an`, `/tin-tuc`, `/tin-bds`, `/tuyen-dung` (+ `/en/*` pathnames), plus `/cho-thue|tin-tuc|tin-bds/danh-muc/[category]` and the new `/cho-thue/danh-muc/[category]` ↔ `/en/for-rent/category/[category]`.
- Shared: `RentalListPage.tsx`, `RentalFilters.tsx`, `RentalFilterSheet.tsx`, `FilterFields.tsx`, `rental-list-queries.ts`, `resolve-missing-page.ts` (proxy 404), `sitemap-data.ts` (new section `categories-rentals`), i18n `vi.json`/`en.json`, `docs/ARCHITECTURE.md`.
- Not affected (checked): detail routes `[slug]`. They have no `loading.tsx`, and the guard test `list-loading.test.ts` blocks route-level `loading.tsx`. Revalidate hooks (`revalidatePath(<concrete internal URL>)`) don't depend on the route-group folder.

## Verify commands + result (run by reviewer in the worktree)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint, no output) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, no output) |
| `pnpm test` | 179/180 files, **1938/1938 tests PASS**. Only `src/lib/contrast.test.ts` fails (known CRLF worktree issue, BL-004, outside this diff) |
| `pnpm build` | PASS. Route table: `● /[locale]/cho-thue`, `● /[locale]/du-an`, `● /[locale]/tin-tuc`, `● /[locale]/tin-bds`, `● /[locale]/tuyen-dung` (same symbols as baseline reports L6-T04/T06), `ƒ /[locale]/cho-thue/danh-muc/[category]`. URLs show no `(list)` segment. |
| moved `page.tsx` ×5 vs `HEAD` | `git diff --no-index` gives **byte-identical** files (same `dynamic`, metadata, imports by alias) |
| `pnpm install --frozen-lockfile` | skip (lockfile unchanged) |

## Responsive Checklist Gate (diff touches UI: S05 + `ListSkeleton`)
Breakpoints 375 / 768 / 1280. No browser was available, so this is checked by CSS math.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | S05 reuses S04 markup. Skeleton containers are `w-full max-w-container px-gutter`. The skeleton chip row is `overflow-hidden` (4×96px + gaps = 408px > 375 is clipped, by design for an `aria-hidden` placeholder; the real chip row uses `overflow-x-auto`) |
| Mobile-first `min-width` | OK | Tailwind `sm:`/`lg:`/`2xl:` only |
| Grid not fixed px | OK | Skeleton grid `sm:grid-cols-2 lg:grid-cols-3 (2xl:4 when wide)` matches the real card grid (`RentalListPage.tsx:557`). 375→1 column, 768→2, 1280→3 |
| Typography rem / fluid | N/A | No new text styles (only an sr-only status line) |
| Media aspect-ratio | OK | Skeleton card `aspect-[4/3] w-full`, same as the real cards |
| Touch target ≥ 44px | OK | Skeleton chips `h-11` (decorative). S05 reuses S04 controls unchanged |
| Nav/table on mobile | N/A | No new nav or table |
| No `100vh` | OK | None in diff |
| `prefers-reduced-motion` | OK | `Skeleton` `animate-pulse` is disabled by globals.css (`src/components/ui/skeleton.tsx:4`) |
| No error-masking `overflow:hidden` | OK | Only the decorative skeleton chip row (see above) |
| Desktop panel 12 cols without the Category field | OK (MINOR cosmetic) | Row 1 = 3+2+2+3 = 10/12, then the next span-3 item wraps. That leaves a 2-column gap. Nothing overflows. Builder recorded and accepted this |

Residual: the skeleton → content swap has not been measured for CLS/LCP in a browser.

## Skill gates
| Gate | Result | Evidence |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` → none |
| oxlint (anti-slop) | skip, oxlint not configured | no `.oxlintrc.json`/`oxlint.json`; eslint PASS |
| open-code-review (ocr) | skip, ocr not installed | — |
| AI-readable | OK (2 indicators < 3) | (1) `RentalListPage.tsx` is now **337 lines** (> 300; HEAD was 266). (2) `buildRentalListMetadata` is about 58 lines and `RentalListPage` about 80 lines (> 50). Comments explain WHY. ARCHITECTURE updated |
| ai-friendly-web | OK | Sitemap gains `categories-rentals`. robots/llms unchanged (L8-T05) |
| blitzstrike | skip, not installed / no permitted environment | — |

## Security / data exposure
- `findRentalCategory` → `findPublicBySlug` (publicWhere, scope `rental`, `depth:1`). The 404 rule uses the same scope. The sitemap section reads as a guest (`overrideAccess:false`, `trash:false`, test `sitemap-data.test.ts`). No unpublished, soft-deleted or EN-not-approved category is exposed.
- No new production SQL. Listings still go through `SearchService` (parameterised). The only raw SQL is in the integration test (`$1`).
- Filter inputs reuse `parseRentalFilters`/`dropUnknownSlugs`. The `category` path param only goes through the parameterised Payload query.

## Canonical vs 301 decision
Reasonable. `/cho-thue?category=<real slug>` → canonical to the category page with the same `?page=n`. An unknown slug gets canonical `/cho-thue`, which matches the page ignoring it. There is no hreflang on S04 filter URLs. S05 gets hreflang only when `hasEnglish` && the category has an EN slug && the URL is not noindex. Tests cover vi/en/page/noise/`seo.noindex`.

## Findings

### [MAJOR] M1 — `loading.tsx` turns page-level `notFound()` into a soft-404 (HTTP 200) on 8 force-dynamic list routes (regression, not verified)
- Files: `src/app/(frontend)/[locale]/{cho-thue,du-an,tin-tuc,tin-bds,tuyen-dung}/(list)/loading.tsx`, `{cho-thue,tin-tuc,tin-bds}/danh-muc/loading.tsx`.
- Affected `notFound()` calls inside the new Suspense boundary:
  - `RentalListPage.tsx:122` (page out of range; and `:118` safety net)
  - `ProjectListPage.tsx:85`
  - `NewsListPage.tsx:38,45`
  - `PostListPage.tsx:38,45`
  - `JobListPage.tsx:109`
- Why: all these routes are `dynamic = "force-dynamic"` (no ISR). With `loading.tsx`, Next.js (16.4.2) flushes the layout plus fallback shell first. Per the Next docs (loading.js, "Status Codes"), headers are already sent, so `notFound()` thrown later inside the boundary can't change the status. The response stays **200** with the not-found UI and an injected `noindex`.
- Before this task the same requests (for example `/cho-thue?page=999`, `/du-an?page=999`, `/tin-tuc?page=999`, `/tuyen-dung?page=999`, and `/tin-tuc/danh-muc/x` if the proxy misses) returned 404. That was the "trang vượt số trang → notFound" behaviour from L6/L8, and the CDN now caches these 200s (`s-maxage`).
- The builder's smoke test covered only proxy-rewritten slugs (`/cho-thue/danh-muc/khong-co`), which run before the page, so it doesn't cover this path. The unit tests call the component directly and can't see the HTTP status.
- Fix (choose one, record the decision in the task file):
  - (a) Run `next start` and record `curl -s -o /dev/null -w "%{http_code}"` for `/cho-thue?page=999`, `/en/for-rent?page=999`, `/du-an?page=999`, `/tin-tuc?page=999`, `/tin-bds?page=999`, `/tuyen-dung?page=999`, `/cho-thue/danh-muc/<real>?page=999`. If they are all 404, M1 closes with that evidence.
  - (b) If 200: don't use a route-level `loading.tsx` for these force-dynamic lists. Show the skeleton on client navigation instead, for example with a pending state in the link/`PendingRegion` (already used for filter transitions) or `useLinkStatus`. That keeps the server render blocking, so the 404 status survives.
  - (c) Move the out-of-range check ahead of streaming, in proxy or metadata, only if it can be done cheaply.
  - (d) Accept the soft-404 (+ noindex) as an explicit trade-off. D5 asked for `loading.tsx`, so this needs user approval and a note in ARCHITECTURE §5.1.

### [MINOR] m1 — `RentalListPage.tsx` is 337 lines (> 300); `buildRentalListMetadata` about 58 lines and `RentalListPage` about 80 lines (> 50)
- `src/components/rentals/RentalListPage.tsx:465`, `:581`.
- Suggestion: move the metadata builder (`buildRentalListMetadata` + `lookupCategory`) to `rental-list-metadata.ts`, and split the S04/S05 branches of the metadata into small helpers. Not blocking (AI-readable: 2 indicators).

### [MINOR] m2 — Each S05 request runs the category lookup twice
- `RentalListPage.tsx:474` (page) and `:584` (`generateMetadata` → `lookupCategory`), plus `findLocalizedSlugs`.
- Suggestion: wrap `findRentalCategory` in React `cache()` so the page and metadata share one query per request.

### [MINOR] m3 — Breadcrumb parent link doesn't check that the parent is still public
- `RentalListPage.tsx:486-489`: `visibleCategory` (`news-view.ts:24`) checks `slug/name/hasEnglish` but not `deletedAt`/publish status of the populated parent.
- If the parent is soft-deleted (child still public), the breadcrumb links to a 404 page. This matches the existing pattern in the news category page, so it was not introduced here. Suggestion: verify that Payload population excludes trashed docs, or add a check; otherwise make it a follow-up task.

### [MINOR] m4 — Desktop panel on S05 leaves a 2-column gap at the end of row 1
- `FilterFields.tsx:126-151`: grid `lg:grid-cols-12` without the Category field (span 2). Cosmetic, and recorded by the builder. Suggestion: when `categories` is empty, give `q` `lg:col-span-5`.

### [MINOR] m5 — `src/payload-types.ts` appears in `git status` but has no content diff (line endings only)
- Exclude it from the commit (or normalise it) so the commit diff stays surgical.

## Residual risk
- CLS/LCP of the skeleton has not been measured in a browser. The skeleton banner is fixed `h-12` + `h-6`, while the real `PageBanner` uses fluid type plus an optional description. Small shift risk on hard loads of force-dynamic pages (ISR detail pages have no skeleton).
- Behaviour of `loading.tsx` on searchParams-only navigation (filter typing on S04/S05) hasn't been checked in a browser: whether the skeleton replaces the filter panel and focus is lost. Expected not to (the transition keeps the old UI), but this is unverified.
- Merge with L9-T01: `D:\prj\bds-wt9-t01` has no `loading.tsx` under `[locale]` (Glob empty), so there's no boundary conflict. Text conflicts are likely in `src/i18n/messages/{vi,en}.json` (new `page.loading` key near line 174) and `docs/ARCHITECTURE.md` §5.1. Resolve both by keeping both sides. Future S06 `/cho-thue/khu-vuc/[province]` (L13-T03) needs its own `khu-vuc/loading.tsx` (not inside `(list)`).
- Tool-read cap: 21/25 used.

## Verdict
❌ **FAIL** — 1 MAJOR (M1: unverified HTTP-status regression from `loading.tsx` on force-dynamic list routes). Builder: close M1 with curl evidence (a), or fix it with (b)/(c), or get user approval for (d). Fixing the MINORs is optional.
