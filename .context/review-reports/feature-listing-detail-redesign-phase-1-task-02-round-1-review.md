Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-02 · round 1

- Worktree: `D:\prj\bds\.claude\worktrees\agent-ac1778247aea60dd2` (branch `worktree-agent-ac1778247aea60dd2`, base `c26d69e`, uncommitted)
- Task: `tasks/feature-listing-detail-redesign/phase-1-task-02.md`
- Spec: SPECIFICATIONS.md 1.46.0, BL-052 "Trang danh sách (khung chung)" (line 39)
- Design: `docs/specs/listing-detail-redesign/list-du-an.webp` (read)

## Review level: STRICT
**Reason:** these are shared components and a shared hook (`useListingFilterNav`, the `listing-params` helper, the `ui/slider` primitive) used by at least 3 listing pages and by BL-054 later. The changes touch URL/navigation state and a11y.

## Blast radius
- New: `src/components/listing/{FilterFacets,FilterPanel,LearnMoreFaq,LearnMoreVideoButton,ListingCategoryTabs,ListingHero,ResultsBar,SpotlightSlider}.tsx`, `listing-params.ts`, `use-listing-filter-nav.ts`, `src/components/ui/slider.tsx` (new primitive), plus 4 test files.
- Changed: `src/i18n/messages/{vi,en}.json`. Keys were only added at the end of `page.listing` (`hero`, `filters`, `resultsMatching`, `spotlight`, `learnMore`). The vi and en key sets match exactly (checked with a node script).
- `src/app/(payload)/admin/importMap.js` and `src/payload-types.ts`: **CONFIRMED EOL-only.** `git diff --ignore-cr-at-eol --quiet` passes and the diff stat with `--ignore-all-space --ignore-cr-at-eol` does not list them. Do not include them in the commit.
- No current pages consume these components yet (assembly happens in P1-T05, P2-T02, P3-T03). There is no schema, API, or data change.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 existing warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src/components/listing` | PASS: 5 files, 47 tests (including the existing `ListSearchBar.test`) |
| `pnpm vitest run no-raw-colors i18n messages` | PASS: 7 files, 59 tests |
| i18n key parity vi/en `page.listing` | equal |
| I did not run the full `pnpm test`. Builder reports 3629 passed, with 4 integration files failing in the full run due to the environment and passing 55/55 when run alone. | not re-run (out of scope for this diff) |

## Responsive Checklist Gate (375 / 768 / 1280)
No browser available. Checked by reading the CSS/classes. The builder also reports `scrollWidth == clientWidth` at 3 widths on a temporary page, but I could not re-verify that.
- Layout, no horizontal scroll: **OK**. Tabs use `overflow-x-auto` inside the `ul` (only the tab list scrolls). The hero form is `flex-col` and becomes `sm:flex-row`. `FilterGroup` uses `min-w-0`. Spotlight uses `grid` with 1 column below lg and `minmax(0,1.1fr)_minmax(0,1fr)` at lg and up. LearnMoreFaq is 1 column and becomes `lg:grid-cols-[minmax(0,…)]`. No fixed-px containers.
- Mobile-first (`min-width` breakpoints): **OK**. Uses `sm:/md:/lg:`. `max-lg:hidden` is used only to hide the sidebar.
- Typography: **OK**. Uses token classes `text-small/xsmall/h3/h4/body/eyebrow`, no font sizes in px.
- Media: **OK**. `ResponsiveImage` with `sizes`. Spotlight image has a fixed height `h-60/md:h-72` with `absolute inset-0` (no CLS). Video sits in a Dialog with `VideoFacade`.
- Touch targets ≥ 44px at 375: **OK**. Chips, checkbox labels, "Xem thêm", the "Xoá tất cả" link, tabs, and arrows are `min-h-11`/`size-11`. The slider thumb is 20px plus `after:-inset-3`, which gives 44px. At ≥ md some targets drop to 36–40px (see MINOR m4).
- Mobile nav/filter: **OK**. Below lg there is a "Bộ lọc" button that opens a bottom Sheet (`90svh`, scrollable body, footer with safe-area padding).
- Table: N/A.
- Viewport, no bare `100vh`: **OK**. Uses `h-[90svh]`.
- `prefers-reduced-motion`: **OK**. `motion-reduce:transition-none` on the caret and play button. Remaining transitions are short colour changes.
- No `overflow:hidden` used to mask bugs: **OK**. `overflow-hidden` on Spotlight and LearnMore is only for rounded image corners.

## Skill gates
- aislop: **skip, aislop not installed**
- oxlint (anti-slop): **skip, oxlint not configured**. ESLint stands in and passes.
- ocr (open-code-review): **skip, ocr not installed**
- AI-readable: **OK**. Every file is ≤ 300 lines (largest is `FilterFacets.tsx` at 296). Functions are ≤ 50 lines, except the JSX of `CheckboxFacetList`/`RangeSliderFacet`, which is close to the limit but acceptable. Names are clear. Comments explain WHY. There is 1 indicator: magic offset `top-[11.75rem]` / `md:top-[14.75rem]` (SpotlightSlider.tsx:63). It is below the threshold of 3.
- ai-friendly-web: **N/A**. Internal component, not a public route.
- blitzstrike: **skip**. No environment, and the task has no auth or API.
- no-raw-colors: **OK**. Test passes. All colours are tokens (`dark/60`, `dark-deep/70`, `on-dark/40`, …).
- No heart icon: **OK**. Grep for `Heart` in `src/components/listing` found nothing.

## Findings

### [MAJOR] M1 — `useListingFilterNav` builds the URL from a stale `current`, so a filter can be silently dropped when two facets change quickly
`src/components/listing/use-listing-filter-nav.ts:17-19`: `navigate(patch)` always calls `listingHref(path, current, patch)` with the `current` the server passed down at the last render.

Scenario: the user picks the "Đang mở bán" chip (push A = `?status=selling`). Before the RSC response arrives, they tick "Hà Nội" (push B = `current + {province}`). B is built from the old `current`, which has no `status`, so B = `?province=ha-noi`. B supersedes A, and `status` is lost from the URL.

Worse, `useUrlBackedState` in `ChipChoice` (FilterFacets.tsx:27-35) only resyncs when the `value` prop changes. The value stays `""`, so the chip keeps showing "Đang mở bán" as selected while the list is not filtered by it. The UI and the URL disagree.

This hook is shared by every listing page (BL-052 and BL-054), and the pending state of a slow navigation makes the scenario easy to hit, especially since the slider commits on every key press.

**Fix:** keep a `useRef` of the "pending params", starting from `current` and reset whenever `current` changes (compare by object identity). Each `navigate` merges its patch into the ref and then builds the URL with `listingHref(path, ref.current, {})`. Add a test: two consecutive `navigate` calls with different keys must both appear in the second `push`.

### [MINOR] m1 — No-JS filtering below lg is missing, and this is not recorded in the task file
At `FilterPanel.tsx:33`, the sidebar is `max-lg:hidden`. `FilterSheet` (`FilterPanel.tsx:66-70`) only opens with JS. So without JS, users on 375/768 screens cannot filter. The spec (line 39) says "không JS thì form GET có nút 'Áp dụng'" without limiting it to a breakpoint.

The docstring says this is "ghi nhận ở báo cáo task", but the "Quyết định (builder)" section of the task file does not mention it.

**Fix:** either record the deviation in the task file so spec-validator can decide, or render the sidebar at every width while `!hydrated` (`!hydrated ? "" : "max-lg:hidden"`), which adds a layout shift at hydration on mobile, or use a `<noscript>` style.

### [MINOR] m2 — The slider commits on every arrow key press, causing a burst of `router.push` calls and server requests
`FilterFacets.tsx:278`: Radix's `onValueCommit` fires on each keydown, so holding ←/→ produces many navigations. Transitions supersede each other, so the result is correct but wasteful, and this makes M1 easier to trigger.

**Suggestion:** debounce the commit in `RangeSliderFacet` (about 300 ms) for keyboard input.

### [MINOR] m3 — WCAG 3.2.2 (On Input): advisory text exists only in the Sheet
Navigating immediately on change keeps focus and scroll position (`scroll:false`) and only changes content, not context. `ResultsBar` uses `aria-live`. So 3.2.2 is not violated.

However, the "danh sách cập nhật ngay" hint appears only in the Sheet (`sheetDescription`). The desktop sidebar has no hint.

**Suggestion:** add `aria-describedby` or a short sr-only line in the `FilterSidebar` header. This is optional.

### [MINOR] m4 — Touch targets ≥ md fall below 44px inside the Sheet (768–1023 is a tablet/touch range)
- `FilterFacets.tsx:82` (chip `md:min-h-10`)
- `FilterFacets.tsx:155` (checkbox label `md:min-h-10`)
- `FilterFacets.tsx:177` ("Xem thêm" `md:min-h-9`)
- `FilterPanel.tsx:39`
- `ListingHero.tsx:89` (`md:h-9`)

These sizes meet WCAG 2.5.8 AA (24px), and the gate's mobile requirement at 375 passes. Consider changing them to `lg:` so the sizes only shrink where the sidebar is shown.

### [MINOR] m5 — Hard-coded ids `listing-quick-search`, `listing-faq-title`, `listing-learn-more-title`
`ListingHero.tsx:83`, `LearnMoreFaq.tsx:60,99`. These will collide if a page renders the component twice. That is unlikely now, but these are shared components. **Fix:** use `useId()` (these are Server Components, and React 19 supports `useId` on the server).

### [MINOR] m6 — Magic offset for the Spotlight controls
`SpotlightSlider.tsx:63`: `top-[11.75rem]` / `md:top-[14.75rem]` are tied to `h-60`/`md:h-72` at line 53. Changing the image height will misplace the controls.

**Suggestion:** move the controls inside the image `div` (absolute `bottom-4 left-4`) so they anchor to it naturally.

### [MINOR] m7 — `RangeSliderFacet` does not normalise min > max from the URL
`FilterFacets.tsx:247`: with `?priceMin=30&priceMax=10`, the thumbs are passed in reverse order to Radix. **Suggestion:** sort `fromUrl`. The server must still normalise on its own side.

## Spot-check of the review focus areas
- Generic props API: OK. No Projects-specific details. Labels and counts are formatted by the page. Icons are a prop.
- a11y:
  - Tabs `aria-current="page"`: OK.
  - Slider `role=slider` plus `aria-label` and `aria-valuetext` per thumb, with Radix keyboard support: OK.
  - Sheet uses Radix Dialog with title, description and close label: OK.
  - Native checkbox/radio inside `label`: OK.
  - `aria-label` on arrow and play buttons: OK.
  - `fieldset`/`legend` for groups: OK.
- No-JS fallback (≥ lg): OK.
  - `form method=get` plus "Áp dụng" and the number inputs Từ/Đến, tested with `renderToString`.
  - Checkboxes send repeated keys, which `parseMultiValue` accepts.
  - `<select name>` is native.
  - Hero `next/form` is a GET form.
  - For < lg, see m1.
- `listing-params` helper: OK.
  - Accepts both `a,b` and repeated keys.
  - Drops empty, duplicate and unknown values.
  - Order follows `allowed`.
  - `listingHref` keeps other params, drops `page` and empty values.
  - `countActiveFilters` matches the spec.
- `useListingFilterNav`: keeps other params and drops `page` (tested), but has the stale-`current` bug (M1).
- JSON-LD `FAQPage` is emitted only when `emitJsonLd && hasFaqs`: OK (`LearnMoreFaq.tsx:54`).
- External CTA uses `rel="noopener"` and internal links use `next/link`: OK.
- i18n is only added at the end of `page.listing`, with no reordering: OK. EOL-only for importMap and payload-types: CONFIRMED.

## Residual risk
- Responsive behaviour and focus retention after `router.push` were not re-verified in a browser. I relied on the CSS and the builder's evidence.
- I did not re-run the full `pnpm test` suite.
- How `useSnapSlider.scrollToSlide` clamps at the boundaries was not read in full (it is an existing hook outside the diff).

## Verdict: ❌ FAIL
1 MAJOR (M1). Return to the builder:
1. Fix M1 and add a test for two consecutive `navigate` calls.
2. Record m1 in the task file, or fix it.
3. The MINOR items are recommended and do not block.

Do not commit `importMap.js` / `payload-types.ts` (EOL-only).
