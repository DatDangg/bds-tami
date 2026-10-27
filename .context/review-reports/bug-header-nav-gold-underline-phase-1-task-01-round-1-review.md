Agent: reviewer

# Review — bug-header-nav-gold-underline · phase-1-task-01 · round 1 (BL-087)

- Task: `tasks/bug-header-nav-gold-underline/phase-1-task-01.md`
- Change doc: `spec/changes/2026-10-27-header-nav-gold-underline.md`
- Diff reviewed (uncommitted; other dirty files are out of scope): `src/components/layout/DesktopNav.tsx`, `src/components/layout/DesktopNav.test.tsx`, `.context/design-spec.md` §2.1 "Mục đang xem"

## Review level
**NORMAL**

## Reason
One presentational component (the horizontal header menu at xl and up), class changes only. No API, auth, schema, data or shared hook changes. `DesktopNav` is used only by the header. The root cause is clear from git (82979e4, BL-074 T02). There was no reason to raise the level to STRICT.

## Blast radius
- `DesktopNav` anchor for top-level items, and the `ul` gap. This is on every public page at 1280px and wider, in VI and EN.
- Not affected: the caret button (`hover:bg-text/10`), the child dropdown, the full-screen menu below xl, and other links and buttons. Their code is unchanged in the diff.
- Docs: `.context/design-spec.md` §2.1 (as-built note added).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm exec vitest run src/components/layout/DesktopNav.test.tsx` | PASS, 8/8 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS, no errors |
| `pnpm exec eslint src/components/layout/DesktopNav.tsx src/components/layout/DesktopNav.test.tsx` | PASS, no output |
| `pnpm lint` (repo-wide) / `pnpm build` / full `pnpm test` | Not re-run by the reviewer. Repo-wide lint has existing errors from other work, as noted in the task. The builder reports build and test results. |

## Acceptance coverage
| Acceptance | Result | Evidence |
|---|---|---|
| `aria-current="page"` item has a 2px gold underline | OK | `aria-[current=page]:border-accent-text` + `border-b-2 border-transparent` (DesktopNav.tsx:65). Seen in the after images. |
| Hover on another item shows a gold underline | OK | `hover:border-accent-text`. `after-hover-1920`: "CHO THUÊ" has the same gold line as the current item. |
| Pill background removed (hover and current) | OK | `rounded-pill`, `px-*`, `bg-text/*` are removed. The test asserts `bg-text` and `rounded-pill` are absent (the `px-` check is broken, see MINOR-1). |
| Only the header menu changes (below xl, dropdown, caret, other links unchanged) | OK | The diff only touches the anchor and `ul` in `DesktopNav`. The caret and the child dropdown lines are unchanged. |
| Focus-visible kept | OK | No focus class was removed. `.site-header-bar :focus-visible { outline-color: var(--color-text) }` (globals.css:301) still applies. |
| Transition uses `--duration-fast` and is off under reduced motion | OK | `transition-colors` covers border-color in Tailwind v4. `duration-(--duration-fast)` = 150ms. `motion-reduce:transition-none`. |
| Item spacing and header height unchanged | OK | Gap 4px + 2×10px padding = 24px, now `gap-6` = 24px. 8 + 2×12 = 32px, now `2xl:gap-8` = 32px. In the images the text x positions match exactly at 1280 and 1920. The builder measured header height 72px both before and after. |
| No overflow at 1280/1440/1920 | OK | The after images at 1280 and 1440 show all 7 items plus search and VI/EN with room to spare. |
| Child dropdown opens correctly | Not visually verified | The live nav has no child items. Dropdown code is unchanged and its existing tests pass. Recorded as residual risk. |
| design-spec §2.1 updated (as-built) | OK | BL-087 as-built note added. Intent text was not rewritten. |

## Screenshots reviewed + notes
- **before-home-1280 vs after-home-1280:** before, "TRANG CHỦ" has a grey rounded pill. After, the pill is gone and a brown-gold line sits under "TRANG CHỦ", spanning exactly the text width. It is easy to see. The text does not move horizontally. It moves up about 1px (see MINOR-3), which is not noticeable. Nothing overlaps or overflows, and the search icon and flags are in the same place.
- **before-home-1920 vs after-home-1920:** same as 1280. The pill becomes a gold line under "TRANG CHỦ". The 7 items are centred and keep their x positions.
- **before-hover-1920 vs after-hover-1920:** before, hovering "CHO THUÊ" showed a light grey pill. After, the current item ("TRANG CHỦ") and the hovered item ("CHO THUÊ") both have the same gold line. This is what the user asked for ("vừa active vừa hover"). Nothing is pushed or overlapped.
- **after-home-1440:** one row, no overflow, gold line under the current item, spacing the same as at 1920.
- **after-scrolled-1920:** the floating 56px bar. The gold line sits about 6px above the bottom edge of the bar and is not cut off by the rounded edge. It is still clearly visible. Note: the headless browser has reduced transparency on, so the bar is rendered solid white rather than glass. The builder measured glass separately by forcing glass styles (`glass-800`, `glass-3200` images); I did not open those two.

## Contrast (my own calculation, WCAG relative luminance)
- `border-accent-text` maps to `--color-accent-text` = **#8c6733** (globals.css:17, `@theme static`). Its luminance is about 0.155. The `.theme-dark-block` override (line 230) does not apply to the header.
- Glass `rgb(250 248 246 / .8)` over white comes out as about (251, 249.4, 247.8), luminance 0.953 → **4.89:1**. The builder reported 4.88:1, which matches.
- Glass 80% over pure black comes out as about (200, 198.4, 196.8), luminance 0.571 → **3.03:1**. The builder reported 3.01:1, so they match within rounding. It meets ≥ 3:1 for WCAG 1.4.11.
- Solid `--color-surface` #fff (reduced transparency or no backdrop-filter) → **5.12:1**. The builder wrote 4.88:1 here, which is understated (see MINOR-2). The real value is higher, so this has no impact.
- The values the builder measured over the hero (3.33–3.36:1) fall within my calculated range of 3.03–4.89, so they are consistent.

## Responsive Checklist Gate (diff touches UI)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | 1280/1440/1920 images. The component is `hidden xl:block`, so it is not rendered at 375 or 768 (N/A there). |
| Mobile-first / grid / container | N/A | Only the flex gap changed (`gap-6 2xl:gap-8` uses min-width). No fixed grid or container. |
| Typography rem / fluid heading | OK | Font size is the `text-xsmall` token and unchanged. No heading involved. |
| Spacing on a scale | OK | gap-6 / gap-8 are Tailwind scale values. |
| Media | N/A | No images or video. |
| Touch target ≥ 44px | OK | `min-h-11` (44px) kept and asserted in the test. Desktop-only menu. |
| Mobile nav | N/A | The menu below xl is unchanged. |
| Table | N/A | |
| 100vh / reduced-motion / overflow:hidden | OK | `motion-reduce:transition-none`. No vh units and no overflow:hidden added. |

## Skill gates
- aislop: skipped, `aislop` is not installed (`command -v aislop` found nothing).
- oxlint (anti-slop): skipped, oxlint is not configured (no `.oxlintrc.json` or `oxlint.json`). eslint on the changed files passed.
- ocr: skipped, ocr is not installed.
- AI-readable: OK. Class-only change, the comment was updated to explain why (contrast), and there is no magic number. 0 indicators.
- ai-friendly-web: N/A. This is a visual header change and does not touch robots, sitemap or llms.
- blitzstrike: N/A (not a STRICT task, no security surface).
- Surgical diff: OK. Every line traces back to BL-087. No refactoring outside the task.
- Not read: I skipped `.agent/FEATURE_WORKFLOW.md` to stay within the read budget, because the task file already contains the gates for this task. About 15 Read/Grep calls were used, 8 of them on the required images.

## Findings
- **[MINOR-1] The test regex for "no padding" can never fail.** `src/components/layout/DesktopNav.test.tsx:143`: `/bg-text|rounded-pill|(^|s)(2xl:)?px-/` is missing the backslash. `(^|s)` matches the start of the string or a literal letter "s", not whitespace. So `" px-2.5"` and `" 2xl:px-3"` are never caught. The `bg-text` and `rounded-pill` parts still lock the pill, so the core behaviour is protected. Only a regression that brings back padding alone would slip through. Fix: `/bg-text|rounded-pill|(^|\s)(2xl:)?px-/`.
- **[MINOR-2] One contrast number in the task is slightly wrong.** `tasks/.../phase-1-task-01.md:45` says solid white (reduced transparency) is 4.88:1. #8c6733 on #fff is actually 5.12:1. 4.88:1 is the value for glass over white. The correct value is higher, so nothing breaks. Fix the task text at close-out if convenient.
- **[MINOR-3] The text moves up about 1px.** `border-b-2` sits inside the `min-h-11` box (border-box sizing), and `items-center` centres the text in 42px instead of 44px. The images show the text 1px higher. This is not noticeable and it was the same before BL-074. No change is required. If you want exact alignment, use `border-y-2 border-t-transparent`.

There are no CRITICAL or MAJOR findings.

## Residual risk
- The child dropdown was not checked visually because the live data has no child items. The code is unchanged and the existing tests pass.
- I did not open the glass contrast images (`glass-800/3200`). The contrast conclusion relies on my own calculation plus the builder's pixel measurements.
- The reviewer did not re-run `pnpm build` or the full `pnpm test`.

## Verdict
**PASS.** All the change doc's acceptance criteria are met and contrast is ≥ 3:1 on every background. MINOR-1 should be fixed (one character) before or after the commit. It does not block.
