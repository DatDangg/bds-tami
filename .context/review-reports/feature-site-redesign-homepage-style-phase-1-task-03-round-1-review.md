Agent: reviewer

# Review: feature-site-redesign-homepage-style, phase-1-task-03, round 1 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-a901fed5a60cf7db4`, branch `worktree-agent-a901fed5a60cf7db4`, HEAD `ffc31b8` (base confirmed). Nothing committed; 28 modified files + 3 untracked (`ProjectSortControl.tsx`, `AmenityMultiSelect.tsx`, `load-project-strengths.ts`). `payload-types.ts` and `importMap.js` were skipped as instructed.
- **Review level: STRICT**
- **Reason:** the task changes the filter form, query and URL contract for `/du-an`, `/cho-thue` and `/cho-thue/danh-muc/*`, including the no-JS GET form. It also changes shared code: `CategoryListTemplate` (the `searchBar` prop is removed and `resultText`/`resultExtras`/`role=status` are added), `PageHero` (`h-*` becomes `min-h-*`), `Breadcrumb` overlay, `ListSearchBar` (rewritten; `keyword` is now required), and `secondaryFilterCount` (the badge now counts something different). SEO noindex/canonical behaviour must stay the same.
- **Blast radius:** `/du-an`, `/en/projects`, `/cho-thue`, `/en/for-rent`, and the rental category pages. Every subpage that uses `PageHero` or the `Breadcrumb` overlay is also affected: News, Posts, Jobs, Contact, Legal, Services, and the T04/T06 detail pages. `HeroSearch` on the homepage now re-exports `AREA_HINT_RANGES`. `vi.json` and `en.json` are shared with T04 and T06.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src` (full suite, not a subset) | PASS: **248 files / 2460 tests** |
| Integration (`tests/integration/*`) | skip. Glob in the worktree found no file matching rental/project/search. These pages read data through Payload and SearchService, which the unit tests mock. Recorded as residual risk |

## Checks the primary asked for
| Item | Result | Evidence |
|---|---|---|
| T01 MINOR #1: PageHero text overflowing at 375 | OK | `PageHero.tsx`: `HEIGHT = min-h-[360px] md:min-h-[440px]` / `min-h-[280px] md:min-h-[340px]`; test updated |
| T01 MINOR #5: remove `searchBar ??` | OK | `CategoryListTemplate.tsx`: prop and branch `data-search-overlay` removed, `hasOverlay = Boolean(filterCard)`. On staging (`d50319c`), `git grep searchBar` finds no consumer in news/posts/careers, so the merge does not break types. `compactBanner` is kept (deprecated, no-op) and T06 still passes it |
| T00 MINOR #3: keyword field `maxLength 100` | OK | `ListSearchBar.tsx:63` `maxLength={100}` on the shared field, so it applies to both `/du-an` and `/cho-thue` |
| Long overlay breadcrumb covering the eyebrow at 390 (T07) | OK (code); visual check NOT done | `Breadcrumb.tsx`: overlay `ol` uses `flex-nowrap`, non-last `li` uses `shrink-0`, last `li`/span uses `min-w-0` + inner `span.truncate`, and the "← parent" back link uses `truncate`. JSON-LD still renders `items` in full (new test checks the full label is in the `ld+json` script) |
| Keep filter/query/pagination | OK | Projects: `projectQueryString({category?, province, status, q, developer, sort})` is applied when "Tìm kiếm" is pressed (not on change, WCAG 3.2.2); `key` remounts when the URL changes. Rentals: `update(...,"now")` applies on change, typing waits 300ms. `preservedParams` keeps `category`/price/area/ward/amenities(`a,b`)/sort as hidden inputs and drops `q`/`province`/`bedrooms`/`furnishing`, which are sent by named fields (no duplicates). Pagination goes through the template with `buildHref` unchanged |
| noindex when filtered | OK | The ProjectListPage tests cover `q`/`developer`/`sort` (noindex + canonical `/du-an`, `sort=newest` stays indexed) and category/province/status. `rental-list-metadata` is unchanged |
| Exactly 1 h1 | OK | h1 lives only in `PageHero`; grid cards are h2. Tests "một h1" pass |
| vi/en i18n | OK | Same key set in both files (`page.projects.{keyword*,search,moreLabel,sortLabel,resultTotal,resultSuffix,chips.*,sort.*}`, `page.rentals.{moreLabel,resultTotal,resultSuffix,chips.*}`); `en` uses ICU plural |
| No custom hex | OK | New files use tokens only (`bg-primary-soft`, `border-input-border`, `text-text-muted`...); `no-raw-colors.test` is in the passing suite |
| Form a11y | OK (MINOR #2 below) | sr-only label for the keyword field; every `OptionSelect` has `aria-label`; "Tùy chọn khác" is `role=group aria-labelledby`; chip `nav` has a label; sort `label htmlFor`; touch targets `min-h-11`/`h-11` on mobile |

## Merge risk with staging `d50319c`
- The only file both branches touch is `src/i18n/messages/{vi,en}.json`. Staging (T04) inserts `page.rentals.detail` after the `rentals.card` block closes (old line 421). T03 changes line 420 (`}` becomes `},` plus new keys). The two hunks are adjacent, so a textual conflict is **likely** when merging these JSON files. It is easy to resolve: keep both, putting `moreLabel/resultTotal/resultSuffix/chips` inside `rentals` before `detail`. After merging, run `pnpm vitest run src/i18n` and the JSON parity check again.
- `CategoryListTemplate`, `PageHero`, `Breadcrumb`, `ListSearchBar`, `url-params` and the rentals/projects list files: `git diff ffc31b8 staging` does not touch any of them, so no conflict. T06 (News/Posts) and Jobs do not use `resultCount`, `sort` or `searchBar`, so the new `role=status` only affects T03's pages.
- The `min-h` hero change also reaches the T06 pages (news/posts): the hero is the same at minimum and only grows when the text is long.

## Responsive Checklist Gate (diff touches UI; checked with CSS math, no browser)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 375/768/1280 | OK (CSS) | Hàng 3: `ListOptionCell w-[calc(50%-0.25rem)]` ×2 + `gap-2` = 100% at <sm, `sm:w-44` (11rem) in `flex-wrap`. Search row is `flex-col` at <sm. Chip row scrolls horizontally inside `CHIP_SCROLL_CLASS` (unchanged). Result row is `flex-wrap`, and the sort control is `min-w-[11rem]` (176px < 343px) |
| Mobile-first `min-width` | OK | Only `sm:`/`md:`/`lg:`/`xl:` variants are used; the `max-sm:sr-only` label is a12y-only |
| Grid with no fixed columns | OK | `grid-cols-1 sm:2 lg:3 xl:4` (spec allows 4 columns at xl and above); container is `max-w-container`, not fixed px |
| Typography rem/token | OK | `text-small`/`text-body`/`text-h3` tokens; widths in rem (`w-44`, `md:w-40`, `w-72`) |
| Media | N/A (diff) | Hero image comes from `ResponsiveImage` in T01, which is not changed here |
| Touch ≥ 44px | OK | Chips `min-h-11`, Bộ lọc `h-11 md:h-10`, AmenityMultiSelect `h-11 md:h-10`, checkbox row `min-h-11`, Xoá bộ lọc `min-h-11` |
| Table/nav on mobile | N/A | No table; chip nav scrolls horizontally |
| 100vh / reduced-motion / overflow:hidden hiding bugs | OK | AmenityMultiSelect uses `max-h-[min(60dvh,420px)]`; `overflow-hidden` from `truncate` is used on purpose to cut the breadcrumb, not to hide an overflow bug |

## Skill gates
- aislop: skip, not in the verify command list in `project-config` (reviewer Bash may only run verify commands and git).
- oxlint (anti-slop): skip, oxlint not configured (repo uses eslint: 0 errors).
- ocr (open-code-review): skip, ocr not installed / not in allowed commands.
- AI-readable: OK, 1 indicator (< 3). `RentalListPage` and `ProjectListPage` are server functions over 50 lines; they were already over the limit and grew. Names are clear, no new magic numbers, comments explain WHY. Doc reconcile for design-spec S02/S04/S05 is assigned to T08 per the task.
- ai-friendly-web: N/A (list pages; robots/sitemap/llms not touched).
- blitzstrike: skip, not installed and no permitted environment. No new input path: `q` was already validated by T00 (≤ 100, schema).

## Findings
No CRITICAL. No MAJOR.

- **[MINOR #1] Mockup screenshots are missing for acceptance.** The task requires "ảnh chụp cạnh mockup từng phần" (screenshots next to the mockup, section by section) at 1440 and 390. The builder did not save any, and the reviewer has no browser. The structure was checked against the mockup in code: `.search` (input + "Tìm kiếm →"), `.frow` "Loại hình"/"Danh mục", `.frow` "Tùy chọn khác" (Tỉnh/thành · Tình trạng · Chủ đầu tư; Khu vực · Mức giá · Diện tích · Phòng ngủ · Nội thất · Tiện ích + Bộ lọc), `.toolbar` "**12 dự án** đang hiển thị" / "**27 căn** phù hợp" + sort, `.pager`, `.strengths` (Projects only), CTA. All match. Small difference: the "Tìm kiếm" button has a magnifier icon before the text plus an arrow; the mockup has only the arrow. Fix: the primary or T08 should take screenshots of `/du-an` and `/cho-thue` at 1440/390 into `.context/review-reports/assets/site-redesign-t03-*` before close-out, and check that the long overlay breadcrumb at 390 and at md (several non-last items are `shrink-0`) does not push the pill past the container.
- **[MINOR #2] `src/components/rentals/AmenityMultiSelect.tsx:772`**: `aria-label={label}` overrides the visible text "Tiện ích (2)". Screen readers only hear "Tiện ích" and miss the selection count. Fix: drop the `aria-label` (let the visible text name the button) or use `aria-label={selected.length > 0 ? selectedLabel : label}`.
- **[MINOR #3] `src/lib/content/load-project-strengths.ts:22` `resolveProjectStrengths` has no unit test.** The spec conditions (flag `showProjectStrengths=false`, `strengths.enabled=false`, fewer than 2 items in the current locale, read error leads to null) are only covered through a mock in `ProjectListPage.test`. Fix: add `load-project-strengths.test.ts` with 4 pure cases.
- **[MINOR #4] Spec says "chiều cao cố định (không CLS)" but the hero is now `min-h`.** This is a deliberate change from T01 MINOR #1, and text is server-rendered so there is no CLS. Fix: record the deviation and its reason in T08's doc reconcile (design-spec, SPECIFICATIONS BL-045 hero) so intent and code stay in sync.
- **[MINOR #5] Leftover i18n keys** that are no longer used (`page.projects.barAllProvinces`, `apply`, `page.rentals.fields.priceAny`, `allCategories`, `priceHintsLabel`...). The builder already noted this. Fix: clean them up in T08 or a separate task.
- **[MINOR #6] Sort on `/du-an` (`ProjectSortControl`) needs JS** because it is not `progressive`. Without JS the sort cannot be changed, though `sort` already in the URL is kept by a hidden input. This matches `/cho-thue` (whose sort also needed JS before), and the spec only requires no-JS for `q`/category/province/status/developer. Recorded so the decision is visible; no fix required.

## Residual risk
- No browser evidence for 1440/390 (see MINOR #1). The responsive gate was checked with CSS math only.
- Integration tests (DB) not run, because no matching file was found in the worktree. URL/noindex/query are covered by the unit tests in `ProjectListPage.test`, `RentalListPage.test`, `RentalFilters.test` and `url-params.test`.
- Likely i18n JSON conflict when merging into staging (adjacent hunks in `page.rentals`); resolve by hand and run the tests again.

## Verdict
**PASS**. No CRITICAL or MAJOR. Six MINORs; #1 (screenshots) and #2 (amenity aria-label) should be done before close-out.
