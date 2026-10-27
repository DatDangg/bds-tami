Agent: reviewer

# Review — bug-listing-tabs-arrow-overlap · phase-1-task-01 · round 2 (BL-086)

- **Review level:** STRICT
- **Reason:** same as round 1. The shared listing tab bar (`ListingTabsScroller` via `ListingCategoryTabs`) is used on `/cho-thue`, `/du-an`, `/tin-bds` and their category pages, the shared `SliderArrow` gets a new prop, and keyboard/focus/pointer a11y behaviour changes.
- **Blast radius:** `src/components/listing/ListingTabsScroller.tsx` (every listing category tab bar). `SliderArrow` in `src/components/layout/use-snap-slider.tsx` is also used by `CardSlider`, `home/RentalsTabs`, `home/OffersSlider`. Those don't pass `disabled`, so `aria-disabled` is omitted and `onClick` is unchanged; the diff to this file is identical to round 1. `.context/design-spec.md` has 1 as-built line. No API, schema or data changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, exit 0) |
| `pnpm test` | PASS: 4669/4669 (round 1 had 4666; +3 new nudge tests) |
| `pnpm exec eslint` on the 3 changed source/test files | PASS (exit 0, no output). Repo-wide `pnpm lint` has known pre-existing errors, so I only checked the changed files. |
| `pnpm build` | PASS (exit 0; dev server on :3000 untouched) |

## Round-1 findings: closure

### MAJOR-1 (mouse-focus nudge loses the click): RESOLVED
- `keepFocusedLinkClearOfFade` now returns early unless `isKeyboardFocus(target)` (`element.matches(":focus-visible")`). In Chrome and Firefox, a link focused on mousedown by a pointer does not match `:focus-visible`, so `scrollLeft` stays put between mousedown and mouseup and the click lands on the anchor.
  - The `try/catch` fallback (unsupported selector → treat as keyboard) only affects pre-2022 engines and is harmless.
  - Safari does not focus links on click at all.
- It also returns early when the target is the scroller itself, is not an HTMLElement, or is a tab wider than the viewport minus 2 × fade. That last guard prevents a jolt and also covers round-1 MINOR-3.
- Test: `focus bằng chuột (không :focus-visible) → KHÔNG cuộn` stubs `matches(':focus-visible')=false` and asserts `scrollLeft` is unchanged. It exercises the real guard branch, so this is not false confidence.
- Runtime evidence (task file, Repro Verification "Attempt 2 evidence"): Playwright (msedge) with a real mouse click in the visible part of the cut-off last tab navigates on the first click at 1320 (twice) and 1280. The first tab after scrolling to the end also navigates on the first click at 1320/1280. Keyboard Tab to the last tab still scrolls it clear of the fade (33px ≥ 32px).
- The reviewer cannot run a browser and is relying on the builder's evidence. That evidence is consistent with the code analysis.

### MINOR-1 (fade width duplicated): RESOLVED
`FADE_WIDTH_PX` is now the single source for the fade `style.width`, the scroller `style.scrollPaddingInline`, and the nudge math. The `w-8` and `scroll-px-8` classes were removed. A test asserts `scrollPaddingInline === "32px"`.

### MINOR-2 (layout shift after hydration): ACCEPTED, not fixed
The builder recorded this in the Decision log: the server cannot know whether the bar overflows, so the lanes appear once after mount and shift the tabs about 48px at ≥ md. This is non-blocking and remains residual risk.

### MINOR-3 (nudge tests): RESOLVED
Added tests for the start edge (`100 - (32 - 10)`), mouse focus (no scroll), and a tab too wide to clear the fades (no scroll). The end-edge test is kept.

## No regression from round 1 (checked in diff + tests)
- **Arrows in their own lanes, never covering tabs:** the structure is unchanged: `flex` [lane | `relative min-w-0 flex-1` scroll area + fade | lane]. The test `nút mũi tên nằm trong làn NGOÀI vùng cuộn` asserts the arrows are not inside the scroller and do sit inside `[data-tabs-lane]`.
- **No lanes when the bar fits:** `overflowing` is still measured against the outer frame `clientWidth`. The tests `vừa khung → không fade, không nút` and `chỉ tràn vùng cuộn đã thu hẹp nhưng vừa khung ngoài → không làn` both pass.
- **No oscillation:** the frame width does not change when the lanes appear, and the measurement logic is unchanged from round 1. The builder's 1500→1100 sweep still applies.
- **Mobile unchanged:** lanes are `hidden ... md:flex`, so below md there is swipe plus fade only. Fade width is still 32px.
- **Edge arrow keeps focus:** `SliderArrow` uses `aria-disabled` and drops `onClick`. The test `nút ở mép vẫn mounted + aria-disabled` asserts it is the same node, keeps focus, and does not call `scrollBy`.
- **Other `SliderArrow` consumers:** not affected (optional prop, same render when it is omitted).
- **Centering of the `aria-current` tab:** this effect is unchanged since round 1. It runs once after the lanes render and sets `scrollLeft` only.

## Responsive Checklist Gate (diff touches UI; only the diff is assessed)
- Layout / no horizontal scroll: **OK**. `flex w-full max-w-container`, scroller `min-w-0 flex-1`. Builder screenshots and measurements at 390/768 show no page h-scroll. Attempt 2 did not change the layout.
- Mobile-first: **OK**. Lanes use `md:flex` (min-width); there are no fixed-px containers.
- Typography/Spacing: **N/A** (no type changes). The fade is an inline 32px decorative overlay, which is the same value as the old `w-8` token. Not a container, so the gate is not affected.
- Media: **N/A**.
- Touch/Interaction: **OK**. Arrows are `size-11` (44px) at ≥ md; mobile uses swipe. A mouse click on an edge tab now works on the first click (MAJOR-1 resolved).
- Nav/table: **N/A**.
- Viewport/A11y: **OK**. Reduced motion is still handled (`behavior:auto`). The keyboard focus nudge stays (keyboard only). There is no `100vh` and no `overflow:hidden` masking.

## Skill gates
- aislop: **skip**, `aislop` is not in the allowed verify commands for the reviewer.
- oxlint (anti-slop): **skip**, oxlint not configured. The ESLint check on the changed files is clean.
- ocr (open-code-review): **skip**, ocr not installed.
- AI-readable: **OK**. Names are clear (`isKeyboardFocus`, `keepFocusedLinkClearOfFade`) and the comments explain WHY (mousedown focus, Chrome not scrolling partly visible links). The magic-number duplication is gone. Functions are under 50 lines and the file is about 135 lines. 0 indicators.
- ai-friendly-web: **N/A** (internal UI behaviour, no route or SEO change).
- blitzstrike: **N/A** (no auth, API or input surface).

## Findings

### [MINOR-1] The nudge test stubs `matches(':focus-visible')`, so real focus-visible heuristics are only covered by Playwright — `ListingTabsScroller.test.tsx` (`describe "đẩy link focus ra ngoài fade"`)
This is acceptable because jsdom has no focus-visible heuristics, and the builder's Playwright evidence covers the real browser path. No action needed.

### [MINOR-2] (carried over) Horizontal shift of about 48px after hydration when the bar overflows at ≥ md
Accepted by the builder and documented. If CLS budgets are tracked later, consider reserving the lanes via CSS when the tab count is high.

No CRITICAL or MAJOR findings.

## Repro Verification (bug closure)
- The original repro (arrows covering tabs at 1920/1440/1320/1280/768) has before/after Playwright bounding-rect evidence: `overlap: false` at every width and scroll position, with screenshots `bl086-{before,after}-*`. This was verified in round 1 and the layout is unchanged in attempt 2.
- The attempt-2 regression check (real mouse click navigates on the first click) is documented. Status is `PASS` with checkable evidence.

## Residual risk
- The reviewer cannot run a browser. The pointer-click behaviour is confirmed by the builder's Playwright (msedge/Chromium) evidence plus code analysis. Firefox was not tested at runtime, but Firefox also does not match `:focus-visible` on a mouse-focused link, so it should behave the same.
- MINOR-2 above (layout shift after hydration) remains.

## Verdict
**PASS**: MAJOR-1 is resolved, there are no regressions, and only non-blocking MINORs remain.
