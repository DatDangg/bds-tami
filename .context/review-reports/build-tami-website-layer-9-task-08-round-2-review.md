Agent: reviewer

# Review: build/tami-website, layer-9-task-08, round 2

- Task: `tasks/tami-website/layer-9-task-08.md` (S05 `/cho-thue/danh-muc/[category]`; D5 `loading.tsx` removed in round 1, see M1)
- Worktree: `D:\prj\bds-wt9-t08` (uncommitted, base HEAD `b527146`)
- Previous round: `.context/review-reports/build-tami-website-layer-9-task-08-round-1-review.md` (FAIL, M1)

## Review level
STRICT

## Reason
The task touches shared list code (`RentalListPage`, `RentalFilters`, `FilterFields`, `RentalFilterSheet`), shared routing/404 rules (`MISSING_PAGE_RULES`), the sitemap, and SEO metadata (canonical/hreflang/noindex). Round 1 found an HTTP-status regression (soft-404) on 8 public routes.

## Blast radius
- Routes: `/cho-thue`, `/en/for-rent`, new `/cho-thue/danh-muc/[category]` (↔ `/en/for-rent/category/[category]`). `/du-an`, `/tin-tuc`, `/tin-tuc/danh-muc/[category]`, `/tin-bds`, `/tin-bds/danh-muc/[category]` and `/tuyen-dung` were affected in round 1 by `loading.tsx`. This round they are back to HEAD.
- Modules: `src/components/rentals/*`, `src/components/rentals/rental-list-metadata.ts` (new), `src/lib/rentals/rental-list-queries.ts` (`findRentalCategory` + `cache()`), `src/lib/content/resolve-missing-page.ts`, `src/lib/seo/sitemap-data.ts` (group `categories-rentals`), i18n `page.rentals.empty.noListingsInCategory`.
- No schema/migration/API contract change. `src/payload-types.ts` differs only in EOL (m5, kept out of commit).

## Verify commands + result (reviewer, cwd `D:\prj\bds-wt9-t08`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (full) | 1,930 tests: 1,862 passed, 67 skipped, 1 failed; 5 files failed. Breakdown: 3 integration suites (`audit-staff`, `job-applications`, `leads`) failed with `cannot connect to Postgres: Connection terminated due to connection timeout` (shared dev DB is unstable). `Header.test.tsx` focus trap timed out at 5,055 ms (flaky under load). `contrast.test.ts` hit the known CRLF issue. None of these are in the task's files. |
| `pnpm test` rerun on its own: the 3 integration suites + `Header.test.tsx` + `rental-search`/`sitemap-rentals` integration + `list-no-loading.test.ts` + `src/components/rentals/` + `sitemap-data.test.ts` + `resolve-missing-page.test.ts` + `src/app/(frontend)/[locale]/cho-thue` | **14/14 files, 228/228 tests PASS** |
| `pnpm build` | PASS (exit 0). `ƒ /[locale]/cho-thue/danh-muc/[category]` (dynamic). |

The reviewer did not run curl or `next start` (outside the allowed verify commands). For the HTTP status the reviewer relies on the builder's before/with/after table in the task file (§ Round 1, M1) plus the static check below that no `loading.tsx` remains.

## Checks requested by primary
1. **M1 closed: OK.** `find src/app -name loading.tsx` returns nothing: no `loading.tsx` at any level under `src/app`, including the `[locale]` and `(frontend)` ancestors. The `(list)` route group no longer exists. `ListSkeleton` and the `page.loading` i18n key are gone (grep found no references). The detail pages (`cho-thue/[slug]`, etc.) have no diff and still build as before.
2. **5 `page.tsx` back at their old location: OK.** For `cho-thue`, `du-an`, `tin-bds`, `tin-tuc` and `tuyen-dung`, the working-tree file sha1 equals the `HEAD:` blob sha1 (byte-identical), and `git diff HEAD --ignore-cr-at-eol` on all 5 is 0 bytes. They show as `M` in `git status` only because of stat/EOL. They will not enter the commit.
3. **`cache()`: OK.** `findRentalCategory = cache((payload, locale, slug) => findPublicBySlug(...))`. React `cache` compares each argument by `Object.is`: `locale` and `slug` are primitives, so there is no cross-locale or cross-slug collision. The memo is scoped to the RSC request, so nothing leaks between requests. `payload` is the `getPayload` singleton. If two calls got different instances it would only be a cache miss, never a wrong result. Outside an RSC request (tests, route handlers) it passes through without memoizing, so behaviour is unchanged.
4. **Metadata split: OK.** `rental-list-metadata.ts` has 112 lines, each helper is ≤ 50 lines, and `RentalListPage.tsx` keeps `export { buildRentalListMetadata }` so the import paths of the page and its test are unchanged. The metadata tests in `RentalListPage.test.tsx` pass: S04 root, S04 `?category=` canonical to S05, unknown slug, S05 hreflang/noindex, and S05 slug not found → `{}`.
5. **Rest of the task intact: OK.** Chips link to S05 (`categoryPath`) and keep the other filters, page 1. On S05 the category is locked (`filterOptions.categories = []`, so `FilterFields` hides the dropdown), and the sheet count uses `fixedCategory`. Canonical/hreflang per (4). Sitemap group `categories-rentals` scope `rental` is covered by `sitemap-data.test.ts` + `sitemap-rentals` integration. 404 comes from `MISSING_PAGE_RULES` `/cho-thue/danh-muc/[category]` → `categories` scope `rental`, with page-level `notFound()` as the safety net. Breadcrumb and empty state (`noListingsInCategory` + back link) are in place. All related tests are green.
6. **D5 reduced scope recorded as a gap: OK.** The task file shows AC D5 as `[~]` (line 41) with an explanation (§ Round 1, line 123: "Cần user xác nhận D5 giảm phạm vi"). ARCHITECTURE §5.1 as-built (4) records "D5 giảm phạm vi", the reason and the guard test. **The primary must take this to the user at the human checkpoint** (approve dropping skeletons, or open a separate `useLinkStatus` task). It is not a code defect.

## Responsive Checklist Gate
Scope: UI changes in the diff (S05 reuses the S04 layout, banner/breadcrumb from the category, chips are links, the category dropdown is hidden on S05, empty state). This round only removes `ListSkeleton` and adds no new UI. No browser was available, so the reviewer checked the CSS by reading the classes.
- Layout, no horizontal scroll: **OK**. The chip row is `overflow-x-auto snap-x` inside its own container (< sm) and `sm:flex-wrap` from sm upward. The page container is `max-w-container px-gutter` (token, not fixed px).
- Layout, mobile-first grid: **OK**. The result grid is unchanged from HEAD (`sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`, min-width media queries). On S05 the desktop panel loses one field, leaving a 2-column gap (m4, cosmetic only, no overflow).
- Typography/spacing: **OK**. Only the existing Tailwind/token scale is used; no hard-coded px font sizes.
- Media: **N/A**. No new images in the diff (`RentalCard` unchanged).
- Touch target / nav: **OK**. Chips and breadcrumb links reuse the existing components (checked in round 1). The mobile sheet is unchanged.
- Table: **N/A**.
- Viewport/A11y: **OK**. The sheet still uses `90svh` (unchanged). `PendingRegion` keeps `aria-busy`. No `overflow:hidden` is used to hide problems (the chips use `overflow-x-auto`).
- Not verified (residual): actual rendering at 375/768/1280.

## Skill gates
- aislop: **skip, aislop not installed** (`command -v aislop` empty).
- oxlint (anti-slop): **skip, oxlint not configured** (no `.oxlintrc.json`/`oxlint.json`). ESLint + `tsc` PASS.
- ocr (open-code-review): **skip, ocr not installed**.
- AI-readable: **OK**. 1 indicator: the `RentalListPage` function is still about 75 lines (> 50, see n4). Below the threshold of 3. ARCHITECTURE §5.1 is updated.
- ai-friendly-web: **OK**. The new route is in the sitemap (`categories-rentals`). `robots.txt`/`llms.txt` were not touched.
- blitzstrike: **skip, not installed / no permitted environment**. Security: input is only the slug + searchParams, both going through `parseRentalFilters` and `findPublicBySlug` (always `publicWhere`). No new data reaches the client.

## Findings
No CRITICAL. No MAJOR.

- **[MINOR] n1: guard test `list-no-loading.test.ts` misses the most likely placements for the 3 category routes.** `src/app/(frontend)/[locale]/list-no-loading.test.ts:12-20` only checks `cho-thue/danh-muc`, `tin-tuc/danh-muc` and `tin-bds/danh-muc`. The page actually lives at `.../danh-muc/[category]/page.tsx`, so a `loading.tsx` at `danh-muc/[category]/` (the most natural place) would bring back the soft-404 and the test would stay green. It also does not check ancestors (`[locale]/loading.tsx`, `(frontend)/loading.tsx`), which would wrap every route. Today's code is correct (no `loading.tsx` exists at all). The weakness is only in the regression protection. Fix: add the `.../danh-muc/[category]` entries plus the ancestor directories (`.`, `..`) to the check, or walk up from each list `page.tsx` to `src/app`.
- **[MINOR] n2: stale comment.** `src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx:9` points to `cho-thue/(list)/page.tsx`, which was removed. Change it to `cho-thue/page.tsx`.
- **[MINOR] n3: task file still lists `loading.tsx` as deliverable.** `tasks/tami-website/layer-9-task-08.md:1` (title), `:16` (blast radius) and `:99` (Files to Create/Modify) still include `loading.tsx`. Update them to match option b (or mark them "đã bỏ, xem Round 1").
- **[MINOR] n4 (carry-over m1, partial): the `RentalListPage` function is still about 75 lines (> 50).** `src/components/rentals/RentalListPage.tsx` (from `export async function RentalListPage` to the end of the JSX). The file is now 255 lines (≤ 300), which is fine. Optional: move the breadcrumb/`filterOptions` assembly into a helper.
- m3/m4 left as-is with reasons (same pattern as the news category page; cosmetic only). The reviewer accepts this; it does not block.

## Residual risk
- The reviewer did not measure the HTTP status directly (no `next start`/curl inside the allowed commands). Evidence is the builder's 9-URL table plus the static check that no `loading.tsx` exists anywhere under `src/app`.
- `pnpm build` shows `/[locale]/cho-thue` as `●` even though `page.tsx` declares `force-dynamic`. The file is byte-identical to HEAD, so this predates the task and is outside its scope. If needed, open a separate task to confirm `/cho-thue` actually renders per request (the builder's curl table shows 404 on `?page=50`, which suggests it does).
- Shared Postgres dev DB is unstable. Integration tests needed a separate rerun to pass.
- D5 waits for the user's decision (see item 6).

## Verdict
✅ **PASS**. M1 is closed (no `loading.tsx` remains, the 5 `page.tsx` are byte-identical to HEAD), `cache()` is correct, the metadata split does not change behaviour, and the rest of the task is intact. lint/typecheck/build PASS, and related tests plus the rerun 228/228 PASS. The 4 MINORs (n1–n4) are worth fixing, especially n1, but do not block. **Before close-out the primary must get the user's confirmation on D5 reduced scope.**
