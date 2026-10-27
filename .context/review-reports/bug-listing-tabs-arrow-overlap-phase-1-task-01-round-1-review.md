Agent: reviewer

# Review — bug-listing-tabs-arrow-overlap · phase-1-task-01 · round 1 (BL-086)

- **Review level:** STRICT
- **Reason:** shared listing component (`ListingTabsScroller` via `ListingCategoryTabs`) on `/cho-thue`, `/du-an`, `/tin-bds` + category sub-pages; shared `SliderArrow` (`src/components/layout/use-snap-slider.tsx`) gets a new prop; keyboard/focus a11y behaviour changes.
- **Blast radius:** `src/components/listing/ListingTabsScroller.tsx` (all listing category tab bars); `SliderArrow` consumers `CardSlider.tsx`, `home/RentalsTabs.tsx`, `home/OffersSlider.tsx` (they don't pass `disabled`, so they render the same as before: `aria-disabled` is omitted and `onClick` is unchanged); `.context/design-spec.md` (1 as-built line). No API, schema or data changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm test` | PASS: 4666/4666 |
| `pnpm exec eslint` on the 3 changed source/test files | PASS (exit 0, no output). Repo-wide `pnpm lint` has known pre-existing errors, so I only checked the changed files. |
| `pnpm build` | PASS (exit 0; dev server untouched) |

## Repro Verification (bug closure)
- The task file reports Status `PASS`. Its Playwright bounding-rect evidence says `overlap: false` at every width and every scroll position. There are before/after screenshots for 3 routes × 6 widths × start/end (`.context/review-reports/assets/bl086-*.png`). I checked `after-cho-thue-1320-start` and `after-cho-thue-768-end`: the arrows sit in their own lanes outside the tab area, the disabled arrow is faded, and the fade is at the inner edge. The original overlap is fixed.
- Acceptance "Ở MỌI vị trí cuộn không tab nào có pixel nằm dưới nút" is OK.

## Responsive Checklist Gate (diff touches UI; only the diff is assessed)
- Layout / no horizontal scroll: **OK**. The frame is `flex w-full max-w-container` and the scroll area is `min-w-0 flex-1`. Screenshots at 390/768 show no page h-scroll (builder also measured this).
- Mobile-first: **OK**. Lanes use `hidden ... md:flex` (min-width) and there are no fixed px containers. The lane is `w-12` (3rem), which is a token, not px.
- Typography/Spacing: **N/A** (no type changes). The fade went from `w-12` to `w-8` (scale token).
- Media: **N/A**.
- Touch/Interaction: **OK**. Arrows are `size-11` (44px) and only show at ≥ md. Below md it is swipe + fade only (390 screenshots).
- Nav/table: **N/A**.
- Viewport/A11y: **OK**, but MAJOR-1 below is an interaction defect. Reduced motion still works (`reducedMotion` → `behavior:auto`). There is no `100vh` and no `overflow:hidden` masking.
- No-overflow layout unchanged: **OK**. `/du-an` and `/tin-bds` at ≥ 1280 have no lanes, and the test `vừa khung → không ... nút` passes.
- Boundary oscillation: **OK**. "Tràn" is measured as content `scrollWidth` against the OUTER frame `clientWidth`, and showing the lanes does not change the frame width. CSS math: the lanes appear exactly when W > frame, and the narrowed scroller then still overflows. No feedback loop. The builder sweep 1500→1100 confirms this.

## Skill gates
- aislop: **skip**, `aislop` is not in the allowed verify commands for the reviewer.
- oxlint (anti-slop): **skip**, oxlint not configured. The ESLint check on the changed files is clean.
- ocr (open-code-review): **skip**, ocr not installed.
- AI-readable: **OK**. Names are clear, the comments explain WHY, and there is no indirection deeper than 3. One indicator: the coupled magic value `FADE_WIDTH_PX = 32` duplicates `w-8` (MINOR-1). That is well below the threshold of 3.
- ai-friendly-web: **N/A** (internal UI behaviour, no route or SEO surface change).
- blitzstrike: **N/A** (no auth, API or input surface).

## Findings

### [MAJOR-1] `onFocus` nudge also runs on mouse focus, so a mouse click on a partly hidden edge tab can be lost — `src/components/listing/ListingTabsScroller.tsx:85-93` (`keepFocusedLinkClearOfFade`) and `:103` (`onFocus=`)
Chrome and Firefox (Windows) focus an `<a href>` on **mousedown**. The handler runs on every `focusin`, keyboard or pointer, and changes `scrollLeft` immediately. Take the exact repro case: the last tab ("Mặt bằng kinh doanh") is only partly visible under the end fade (see `bl086-after-cho-thue-1320-start.png`, where its icon peeks out at the right edge). If the user clicks it:
1. mousedown focuses the link.
2. `overshootEnd` = hidden part + 32px, and the scroller jumps left by that amount.
3. mouseup now lands somewhere else (the fade gap or the next tab).
4. `click` is dispatched to the common ancestor, not the anchor, so **no navigation**.

By analysis, this fails for any click inside the last 32px of the visible part of a cut-off tab, which is exactly the faded area users are invited to click. The same happens at the start edge. Even when the click does land, the tab jumps visibly under the cursor. The task's evidence covers keyboard Tab only, not a pointer click on an edge tab.
- **Fix:** only nudge for keyboard focus. Either return early when `!(event.target instanceof HTMLElement) || !event.target.matches(":focus-visible")`, or set a ref in `onPointerDown` on the scroller and skip the nudge when it is set (clear it on `pointerup`/after the frame). Add a jsdom test that a pointer-initiated focus does not change `scrollLeft`. Add Playwright evidence: a real mouse click on the partly visible last tab at 1320 navigates to its URL on the first click.

### [MINOR-1] Duplicated magic value — `ListingTabsScroller.tsx:10-11`
`FADE_WIDTH_PX = 32` must stay in sync by hand with `w-8` in `FADE_CLASS`, and `scroll-px-8` repeats it a third time. Suggestion: set the width once as an inline style or CSS var (`--tabs-fade: 2rem`) and read it from there, or at least keep the coupling comment next to every use.

### [MINOR-2] Horizontal layout shift after hydration when the bar overflows at ≥ md — `ListingTabsScroller.tsx:96-115`
SSR renders no lanes. After mount `overflowing=true` adds 2 × 48px lanes, so every tab moves right by 48px (counts toward CLS). The centering effect can also jump `scrollLeft`. There is no hydration mismatch, because the initial client state equals SSR. The shift cannot be avoided without knowing the width on the server, so this is not blocking. If CLS is measured, note it in residual risk. A possible mitigation is to reserve the lanes via CSS when the tab count is high, or to accept the shift.

### [MINOR-3] Focus-nudge test covers only the end edge — `ListingTabsScroller.test.tsx` ("focus link sát mép phải")
There is no start-edge case (`overshootStart`) and no case for a tab wider than the area minus 2 × fade. The latter is fine by analysis: the start alignment wins and there is no loop, because the handler only runs on focus.

### Checked OK
- `SliderArrow` `disabled` uses `aria-disabled` and drops `onClick`. The button stays focusable and is announced as disabled. The `aria-disabled:hover:*` overrides beat `hover:bg-text` on specificity. The other 3 consumers are unchanged.
- MINOR-1 from BL-084 is fixed: the button stays mounted and keeps focus at the edge (the test checks `toHaveFocus` and that the same node is kept).
- Centering of the `aria-current` tab: it runs once after the lanes render (the scroller is already narrowed), sets `scrollLeft` only, and has no vertical page scroll.
- `event.target` in `onFocus` can only be a link, because the scroller has focusable children and Chrome's keyboard-focusable-scroller does not apply.
- Hydration: no mismatch.
- Diff is surgical. The design-spec as-built line matches the code.

## Residual risk
- The reviewer cannot run a browser, so MAJOR-1 comes from analysing the code and Chrome/Firefox focus-on-mousedown behaviour, not from a runtime test. The builder should confirm it with Playwright. If a real mouse click on the edge tab provably navigates first time at 1320/1280/768, MAJOR-1 can be downgraded, but the pointer-focus guard is still recommended.

## Verdict
**FAIL**: 1 MAJOR (MINOR-1/2/3 are not blocking). Send back to builder for MAJOR-1 (keyboard-only focus nudge + test + Playwright click evidence).
