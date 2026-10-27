Agent: reviewer

# Review — bug-listing-category-tabs-overflow · phase-1-task-01 · round 1 (BL-084)

- **Review level:** STRICT
- **Reason:** `ListingCategoryTabs` is a shared navigation component used by `/cho-thue` (RentalListPage), `/du-an` (ProjectListPage) and the property-post list (PostListPage). Shared component + navigation means STRICT is required.
- **Blast radius:** `src/components/listing/ListingCategoryTabs.tsx` (markup: `ul` moved inside a new client wrapper, `snap-x`/`snap-start` removed), new `src/components/listing/ListingTabsScroller.tsx` (client), reuses `SliderArrow` from `src/components/layout/use-snap-slider.tsx` and `useMediaQuery` from `use-environment.ts` (both unchanged), i18n `page.listing.tabs.{previous,next}` vi/en, `.context/design-spec.md` (as-built line). There are 3 consumers (grep: RentalListPage:144, ProjectListPage:170, PostListPage:179) and none passes a className or depends on the inner `ul` structure. No e2e test selects this nav. No API, schema, auth or data impact.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run src/components/listing` | PASS: 7 files / 71 tests |
| `npx eslint` on the 4 changed/new listing files | PASS (exit 0) |
| `pnpm build` | PASS (exit 0) |
| Real-browser check (dev server + Playwright) | skip. The reviewer gate only allows the configured verify commands plus git, so I relied on the builder's Playwright measurements (sw/cw, scrollLeft, curVisible) and the screenshots `bl084-after-rent-{1920,1280,390}.png`. I opened the 1920 and 390 shots: the 1920 shot shows the end fade and the 44px "›" button, and the 390 shot shows the end fade with no button. |

## Bug repro closure
- Original repro: `/cho-thue` VI 1920, content 1414px > 1280px container, the last item is clipped and nothing hints at scrolling. The root cause has a file:line in the task.
- Repro Verification status: **PASS**. Evidence: Playwright measurements at 5 widths × 3 routes plus the `/danh-muc/mat-bang-kinh-doanh` case (current tab visible, scrollLeft > 0), the after screenshots, and 5 unit tests covering fits / fade+buttons by position / scrollBy / 44px md-only / centering the current tab.
- Note: the "before" screenshots are simulated (post-fix build with fade and buttons hidden), and the task file says so. This is acceptable because the root cause can be proven statically: the old `ul` had a hidden scrollbar and no hint.

## Acceptance check
| Item | Result | Evidence |
|---|---|---|
| Fits, or scroll hint shown (fade + arrows from md, swipe + fade on mobile) | OK | `ListingTabsScroller.tsx:73-84` renders fade/arrow only for the edge that still has content. `SliderArrow` base class is `hidden … md:inline-flex size-11` (use-snap-slider.tsx:108). Screenshots match. |
| Current tab in view, no vertical page scroll | OK | `:40-46` sets `scrollLeft` (no `scrollIntoView`), so the page does not scroll vertically. The centering math is correct (offset = left − (W − w)/2). Unit test `:82-91`. |
| SSR links kept (SEO, works without JS) | OK | `ListingCategoryTabs` is still a Server Component and the `PendingLink`s are passed as `children` into the client wrapper, so they are in the server HTML. Without JS it is still an `overflow-x-auto` area. |
| a11y | OK, with MINOR-1/2 | Buttons have `aria-label` from i18n. Fade is `aria-hidden` + `pointer-events-none`. Focus ring comes from `SliderArrow`. No tab trap: the buttons are plain `button`s after the list. |
| reduced-motion | OK | `scrollByPage` uses `behavior: reducedMotion ? "auto" : "smooth"`. Centering on mount sets `scrollLeft` directly, which is instant. |
| Hydration mismatch | OK | Initial state is `{false,false}` on both server and client, and fade/buttons only appear after the effect runs. `useMediaQuery` returns false on the server (`useSyncExternalStore` + `falseOnServer`). |
| ResizeObserver / listener cleanup | OK | `:53-57` removes the scroll listener, disconnects the observer and cancels any pending rAF. It observes both the scroller (container width) and the `ul` (content width). |
| Design tokens | OK | `from-surface`, `bg-surface`, `border-border`, `shadow-md`, `duration-(--duration-fast)` (in SliderArrow), `px-gutter`, `max-w-container`. No hard-coded colours. |
| i18n vi/en | OK | `page.listing.tabs.previous/next` exists in both vi.json and en.json at the same position. |
| `/du-an` and property-post list not broken | OK | Same component, props unchanged. Builder measurements: `/du-an` fits at 1920–1280 (no fade/button) and overflows at 768/390, where fade and button appear. `/tin-bds` overflows only at 390. |

## Responsive Checklist Gate (UI diff, widths 375/768/1280 plus 1920/1440/390 from the task)
- **Layout, no horizontal page scroll:** OK. The `ul` is `w-max min-w-full` inside an `overflow-x-auto` scroller that is `w-full max-w-container`. Builder measured "no page h-scroll" in every case.
- **Layout, mobile-first `min-width`:** OK. Only `md:` (min-width) is used.
- **Layout, grid auto-fit/minmax:** N/A (no grid).
- **Layout, container not fixed px:** OK (`w-full max-w-container` token).
- **Typography rem / fluid heading:** OK / N/A. Text uses the `text-small`/`text-xsmall` tokens and there is no heading.
- **Spacing scale:** OK (`gap-2 md:gap-6`, `w-12`, `left-1/right-1`).
- **Media:** N/A.
- **Touch target ≥ 44px:** OK. Links are `min-h-11` and arrows are `size-11`. Arrows are hidden below md, where the user swipes.
- **Nav on mobile does not overflow the page:** OK (scrolls inside its own area plus fade).
- **Table:** N/A.
- **No bare 100vh:** OK (not used).
- **prefers-reduced-motion:** OK (scrollBy uses auto).
- **No `overflow:hidden` hiding bugs:** OK (only `overflow-x-auto` with a hidden scrollbar, by design).
- **Residual:** not re-checked in a real browser by the reviewer (outside the allowed commands). The CSS math above agrees with the builder's measurements.

## Skill gates
- **aislop:** skip, `aislop` not installed.
- **oxlint (anti-slop):** skip, oxlint not configured (no oxlint config in the repo). ESLint PASS.
- **ocr (open-code-review):** skip, ocr not installed.
- **AI-readable:** OK, 1 indicator (< 3). `ListingTabsScroller` is about 70 lines including JSX, which is over the 50-line guideline (see MINOR-4). Names are clear, constants are named (`EDGE_TOLERANCE`, `FADE_CLASS`, `ARROW_CLASS`), there are no WHAT-comments, and design-spec was updated.
- **impeccable / frontend-checklist:** OK. Fade matches the surface colour, the arrow has a raised surface + border + shadow, there is a focus ring, and the hover state is inherited from `SliderArrow`.
- **ai-friendly-web:** N/A (internal component; SEO links unchanged).
- **blitzstrike:** N/A (no auth/input/API surface).

## Findings
No CRITICAL or MAJOR findings.

- **[MINOR-1] Focus is lost when an arrow unmounts.** `ListingTabsScroller.tsx:73-84`: the arrows are rendered conditionally. A keyboard user (≥ md) who presses Enter on "Danh mục sau" until the end has the button removed while it is focused, so focus falls to `body` and screen readers lose context. Chromium and Firefox keep the sequential-navigation starting point, so the next Tab still moves on. The task design allows "hide/disable", so this does not block. Suggested fix: keep the button mounted and use `disabled` + `aria-disabled` + `opacity-0 pointer-events-none` at the edge, or move focus to the other arrow or the last link when it unmounts.
- **[MINOR-2] A focused link at the edge can be partly covered by the arrow and fade.** `:75-82`: when tabbing through links, the browser scrolls the focused link to the nearest edge, which sits under the 3rem fade and the 44px arrow. The focus ring is only partly covered, so WCAG 2.4.11 is still met. Suggested fix: add `scroll-px-14` (scroll-padding-inline) to the scroller.
- **[MINOR-3] The test name claims coverage it does not have.** `ListingTabsScroller.test.tsx:67`: the title says "reduced-motion → auto", but there is no case that mocks `matchMedia` to reduce and asserts `behavior: "auto"`. Suggested fix: add that case or shorten the title.
- **[MINOR-4] Component length and an undocumented snap change.** `ListingTabsScroller.tsx:18-87`: the component is about 70 lines. Splitting the measure/centering logic into a `useOverflowEdges(ref)` hook would bring it under 50. Also, `ListingCategoryTabs.tsx` removed `snap-x`/`snap-start`, which changes swipe behaviour on mobile (no snap to a tab). The change is reasonable, because snap-start would fight with centering the current tab, but the Decision log does not mention it. Add one line there.
- **[MINOR-5] Centering only runs on mount.** `:58`: the effect has `[]` deps. With client-side navigation that keeps the instance (same segment) or with back/forward, the newly current tab is not re-centred. In practice the user just clicked a visible tab, so the risk is low. A fix is optional; one option is to use the `aria-current` href as a key or dependency.

## Verdict
**PASS.** There are no CRITICAL or MAJOR findings, the bug repro is PASS with checkable evidence, and typecheck/test/eslint/build all PASS. The MINOR items are optional for this task and can go into a follow-up.
