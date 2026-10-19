Agent: reviewer

# Review — bug-admin-dashboard-list-mobile-overflow · phase-1-task-01 · round 1 (BL-024)

- Review level: **NORMAL**
- Reason: one unlayered admin CSS rule plus a static test. The rule is in a shared admin stylesheet (`_lists.scss`, used by every collection list) but it targets an element that Payload only renders at `smallBreak` (≤768px). No schema, API, auth or JS change.
- Blast radius: `.collection-list__list-selection` (the bulk-selection bar) on every admin collection list view at ≤768px, including list drawers that reuse `DefaultListView`. The diff touches nothing else. `next.config.ts` and `src/payload-types.ts` were ignored as instructed.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm test` | PASS — 3057/3057 tests (289 files) |
| `pnpm lint` | PASS — 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (not related to this change) |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — no output |

## 1. Root cause check (D1)
- `@payloadcms/next/dist/prod/styles.css` confirms the claim:
  - Before hydration, `.template-default{grid-template-columns:1fr auto}` (≤1440 block).
  - After hydration, `.template-default--nav-hydrated{grid-template-columns:0 auto}`.
  - `.template-default--nav-animate{transition:grid-template-columns var(--nav-trans-time) linear}`.
- `@payloadcms/ui/dist/elements/Nav/context.js:86-97` calls `setHydrated(true)` right away and `setShouldAnimate(true)` after `setTimeout(100)`.
  - In a page that renders frames, style is recalculated between the two class changes. The column is already `0` before the transition is turned on, so nothing animates.
  - In a page that does not render (hidden pane or background iframe), both class changes land in a single style recalc. The 1fr→0 transition then starts and stays at `currentTime 0`. That explains the 506/576px readings in the change doc exactly.
- **D1 is sound.** The extra width is a measurement artifact, not a steady-state overflow a user can see. Changing Payload's nav transition would alter upstream behaviour for no user benefit.
- The real defect is confirmed by CSS math. Payload's `.collection-list__list-selection{position:fixed;bottom:0;padding:16px 0;width:100%}` sets no `left`, so the bar sits at its static position (the 16px gutter) and is 100% of the viewport wide. It therefore spills 16px past the right edge, which matches the builder's "Xóa" r=391.

## 2. The fix
- `custom.scss` imports `_lists.scss` with `@use` at top level, and the new rule sits outside any `@layer`. It therefore beats `@layer payload-default` without `!important`. OK.
- With `left:0; right:0; width:auto` on a fixed box, the containing block is the viewport, so the bar spans exactly 0 to clientWidth. `padding-inline: var(--gutter-h)` keeps the content inside the gutter (343px at 375). The vertical padding (16px) is untouched. OK.
- `.list-selection` is nested only under `.collection-list__list-selection`, so the desktop `ListHeader` copy of `.list-selection` is not affected. In `ListHeader/index.js:66` it renders only when `!smallBreak`, outside the bar. OK.
- The bar renders only when `smallBreak` (`views/List/index.js:223-239`). The CSS is not media-gated, but the element does not exist above 768px, so there is no desktop or tablet (>768) regression. OK.
- Dark mode: `background-color: var(--theme-bg)` is not overridden and comes from Payload; `--theme-bg` is redeclared for dark in `_tokens.scss:134`. OK.
- `flex-wrap: wrap` handles the extra "Chọn tất cả (N)" button on paginated lists (the builder's extra finding). This is the same class of bug, the same element, and is justified in the task file. OK.

## 3. Browser check
- **Not run by the reviewer.** The Claude_Browser tools are not available to this subagent, so I relied on the builder's DOM measurements in the task's Verification summary plus the CSS math above.
- Builder's numbers after fix:
  - rentals: bar 0–375, max child right 359, scrollWidth 375.
  - leads: bar 0–375, max child right 359.
  - `/admin`: scrollWidth 375.
- These match the math: 375 − 16 gutter = 359.
- This is recorded as residual risk below.

## 4. Global overflow / tests
- No `overflow-x: hidden` was added. The extended test now also scans `_lists.scss` for html/body `overflow-x: hidden`. OK.
- The new tests are static SCSS regex assertions, the same pattern as BL-023. They pin the 4 declarations and the nested `flex-wrap`, and the builder records TDD (fail before, pass after). They are meaningful as regression guards but cannot prove rendered geometry (see MINOR-2).

## Responsive Checklist Gate (diff only)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Fixed bar now spans 0..clientWidth with content in the gutter. Builder: scrollWidth 375 and child right ≤359 on rentals/leads. |
| Mobile-first / no fixed px container | OK | `width:auto` with `left`/`right` pinned; no fixed-px width. |
| Grid auto-fit/minmax | N/A | No grid in the diff. |
| Typography rem / clamp | N/A | No font change. |
| Spacing scale | OK | Uses `var(--gutter-h)`. `row-gap:4px` matches the px convention of the existing admin files. |
| Media (img/video) | N/A | — |
| Touch target ≥44px | N/A | Button sizes come from Payload `.btn` and are unchanged by this diff (out of scope). |
| Nav hamburger | N/A | Not touched (D3 residual). |
| Table scroll wrapper | OK | Out of diff; confirmed existing `.table` has `overflow-x:auto`. |
| 100vh / reduced-motion | N/A | No viewport-height or animation in the diff. |
| No `overflow:hidden` masking | OK | None added. |

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip — `aislop` not run (no allowed command in the verify profile). The diff is 16 lines of CSS plus a test, with no slop indicators. |
| oxlint (anti-slop) | skip, oxlint not configured (`pnpm lint` ESLint PASS covers the TS test) |
| ocr | skip, ocr not installed |
| AI-readable | OK — 0 indicators. Comments explain WHY (Payload default, missing `left`), names are clear, no magic numbers beyond the 4px gap. |
| ai-friendly-web | N/A — internal admin |
| blitzstrike | N/A — not STRICT, not security-related |

## Findings
- **[CRITICAL]** none
- **[MAJOR]** none
- **[MINOR-1]** `_lists.scss:205` (`row-gap: 4px`): once the buttons wrap, the bar gets taller and the fixed bar covers more of the page bottom (page controls / last row). This is pre-existing Payload behaviour and is not caused by the overflow fix. Optional follow-up: add `padding-bottom` to the list at ≤768 equal to the bar height. Separate task, does not block.
- **[MINOR-2]** `admin-mobile-overflow.test.ts`: the static regex tests prove the declarations exist, not the rendered geometry. Acceptable and consistent with BL-023. A Playwright measurement at 375px would be stronger if e2e is ever added.

## Residual risk
- The reviewer did not reproduce the browser measurements because no browser tool was available in this subagent. Acceptance relies on the builder's recorded DOM numbers, which match the CSS math exactly.
- D3: `--nav-width: 100vw` with classic scrollbars on a narrow desktop window. This is upstream behaviour and remains a documented residual.
- List drawers (`ListDrawer`) at ≤768 reuse the bar. If a drawer ancestor has a `transform`, the fixed bar is positioned against the drawer, and `left/right:0` would then span the drawer, which is still correct. Not measured.

## Verdict
✅ **PASS** — no CRITICAL or MAJOR findings. The root cause is evidenced from the Payload sources, D1 is sound, the fix is scoped and wins over the Payload layer, and test, lint and typecheck all pass.
