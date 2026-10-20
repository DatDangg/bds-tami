Agent: reviewer

# Review: feature-detail-pages-unified-layout, phase-1-task-01, round 1 (BL-027, MODIFY)

- **Review level:** STRICT
- **Reason:** The change touches the shared header used on every `(frontend)` route (`.site-header` via `globals.css`), adds a new shared variable `--sticky-top` used by sticky elements and scroll-margins, changes `LeadFormSlot`, which other pages also use, and creates new shared components in `src/components/detail/` that T02 (rental detail) will reuse.
- **Blast radius:**
  - The header on every public page. The new behaviour only applies when `html:has([data-detail-page])` matches.
  - `/du-an/[slug]` and `/en/projects/[slug]`: the whole layout, the sub-nav, the sticky consult card, and the anchors `#overview…#faq`, `#documents`, `#lead-form`, `#related-listings`.
  - `LeadFormSlot`, whose default scroll-mt changed. It is used by the contact page, `ApplyFormSlot` and `SaleContactBox`. `ApplyFormSlot` and `SaleContactBox` override the class themselves.
  - The other files that use `--header-offset` were not changed and keep their behaviour: `JobDetail`, `TableOfContents`, `RichText`, `HeroSlider`, `HeroSearch`, `RentalDetail`, `PostShare`, `SaleContactBox`, `ApplyFormSlot`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/projects src/components/detail src/components/layout src/components/forms` | PASS: 25 files, 233 tests |
| `pnpm lint` | PASS: 0 errors. 2 old warnings in `tools/task-dashboard/server.mjs`, outside scope |
| `pnpm typecheck` | PASS |

Other diff notes:
- Many files show `M` in `git status` but have no content diff (`git diff --ignore-all-space --ignore-cr-at-eol` is empty). This is stat/EOL noise only: FloorPlans, NearbyTabs, ProjectCard, ProjectFilters, ProjectHero, ProjectListPage(+test), project-components/filter-params/market-blocks tests. At close-out, stage only the files with real changes.
- I found no remaining reference to `ProjectSubNav` or `ProjectSection`, and there is no leftover re-export file.

## Checks by focus area
1. **Other pages are unchanged:**
   - `:root { --sticky-top: var(--header-offset) }` sits inside the `:root` block that already defines `--header-offset`. The lg breakpoint only redefines `--header-offset`, and `--sticky-top` resolves through `var()`, so it follows. OK.
   - `LeadFormSlot` on other pages: `--sticky-top` equals `--header-offset`, so behaviour is the same. OK.
   - Every other place that uses `--header-offset` was left alone. OK.
2. **`:has()` fallback:**
   - A browser without `:has()` drops every `html:has(...)` rule, including the ones inside `@media`. The header then floats as on normal pages and `--sticky-top` equals `--header-offset`, so the sub-nav sits right under the header. This is consistent. OK.
   - Only `OBSERVER_MARGIN` (-88px) is wrong in that fallback. See m-2.
3. **Hidden header:**
   - It uses only `transform`. The element keeps its in-flow height `h-(--header-offset)`, so there is no CLS. OK.
   - Reduced motion: the `transition: none` override in `globals.css` (unlayered CSS) wins over the `transition-[padding]` utility. OK.
   - Using `transform` instead of `visibility` is reasonable, because Tab must still reach the header. The header is off-screen but still in the accessibility tree, which is low risk.
   - `MobileMenu` renders through a Radix Portal, so the transform does not create a containing block for the fixed overlay. OK.
   - **Problem: `:focus-within` also matches focus that did not come from the keyboard.** See M-1.
4. **Anchors and observer margin:**
   - At ≥ lg the numbers work out: scroll-mt = `--sticky-top` + 4.5rem = 16 + 54 + 18 = 88px, and the aside card has `top` = `--sticky-top` + 4.5rem with `max-h` = `100dvh - --sticky-top - 5.5rem` (1rem bottom margin). OK.
   - Below lg the margin is 8px too large, which is harmless (already noted by the builder). OK.
   - Without JS or before hydration, the header never gets `data-scrolled`. See m-1.
5. **Reuse in T02:**
   - `DetailLayout` takes `before`, `subNav{items,label}`, `children`, `aside`, `asideLabelledBy` and `after`. It is a server component with no project-specific dependency.
   - `DetailSubNav` takes its label as a prop and no longer depends on the `page.projectDetail` namespace.
   - `DETAIL_ASIDE_CARD_CLASS` is exported for reuse.
   - OK.
6. **Colours and contrast:**
   - Active item: #141414 on #e0bf89 is about 10:1. OK.
   - Breadcrumb `text-muted` #6b6b6b on `primary-subtle` #f8f3eb is about 4.8:1. OK.
   - The focus ring #8c6733 is about 4.6:1 on #f8f3eb and about 5.1:1 on the white pill (which is where the ring is drawn, outline-offset 2). Both meet the 3:1 non-text minimum. OK.
   - No new hex values. The background uses the `bg-primary-subtle` token. OK.
7. **375px:**
   - The grid only applies at ≥ lg. Below lg the card is `p-5` inside `px-gutter`.
   - The price table already has a scroll wrapper.
   - The sub-nav has `max-w-full overflow-x-auto`.
   - The builder measured scrollWidth = clientWidth at 375. OK, with residual risk at 768.
8. **Tests:** The new `DetailLayout.test.tsx` covers structure, ordering, optional nav/aside, and `DetailSection` attributes. `project-detail.test.tsx` checks `data-detail-page`, the white card, `--sticky-top`, the active colour and the label prop. The CSS behaviour (header hide, `:has`, focus-within) cannot be tested in jsdom, which is acceptable.

## Responsive Checklist Gate (widths 375 / 768 / 1280)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Builder measured scrollWidth = clientWidth at 375 and 1280. CSS: the grid only exists at ≥ lg (`minmax(0,1fr)_22rem`) and the main column has `min-w-0`. 768 is not measured; see Residual risk |
| Mobile-first min-width | OK | `md:`, `lg:`, `xl:` utilities. The CSS `@media (min-width: 64rem)` |
| Grid without fixed columns | OK | `minmax(0,1fr)` plus a fixed 22/24rem side column, same as before, only at ≥ lg |
| Container not fixed px | OK | `max-w-container px-gutter w-full` |
| Typography rem/clamp | OK | Uses the `text-h2` and `text-small` tokens. Nothing new |
| Spacing scale | OK | `p-5 md:p-8 xl:p-10`, `py-4 lg:py-8`. The 28px radius is an arbitrary value, as documented in the design |
| Media | N/A | No new media |
| Touch target ≥ 44 | OK | Sub-nav items are `min-h-11`, unchanged |
| Nav on mobile | OK | The sub-nav scrolls horizontally (unchanged). The header hamburger is unchanged |
| Table wrapper | OK | PriceTable `role=region` scroll, unchanged |
| 100vh | OK | Uses `100dvh` |
| prefers-reduced-motion | OK | `transition: none` for the detail-page header |
| overflow:hidden to mask bugs | OK | Not used |

## Skill gates
- **aislop:** skip. The reviewer is only allowed to run the configured verify commands; `aislop` is not among them.
- **oxlint (anti-slop):** skip, oxlint not configured. `pnpm lint` (eslint) gave 0 errors.
- **ocr:** skip, ocr not installed / not in allowed commands.
- **AI-readable:** OK.
  - The new functions are short, there is no indirection deeper than 3 levels, and names are clear.
  - The comments explain WHY (the 88px value, `:has` fallback, `transform` vs `visibility`).
  - Magic numbers (4.5rem, 88px) are explained in comments.
  - Doc updates (SPECIFICATIONS, design-spec, decisions) are planned for close-out.
  - Fewer than 3 indicators.
- **ai-friendly-web:** N/A. This is a layout change; robots/sitemap/llms are not touched.
- **blitzstrike:** N/A. No auth, input or API changes.

## Findings

### [CRITICAL]
- None.

### [MAJOR]
- **M-1. Header stays visible and covers the sticky sub-nav after a mouse or touch interaction with the header.**
  - Location: `src/app/(frontend)/globals.css:257`, rule `.site-header[data-scrolled]:not(:focus-within)`.
  - `:focus-within` also matches focus that did not come from the keyboard. A common case: at the top of the page, the user taps the hamburger and then closes `MobileMenu`. Radix Dialog returns focus to the Trigger by default (`MobileMenu.tsx:44-50` has no `onCloseAutoFocus` override). On Android Chrome a tap also focuses the button.
  - When the user then scrolls down, the header has `data-scrolled` but still has focus-within. It does not hide, and it stays as a floating pill at 8–72px (16–88px at lg).
  - The `DetailSubNav` sits at `top: var(--sticky-top)` = 8/16px. It is therefore completely covered by the header bar (`z-header` > `z-sticky`), and it stays covered until the user clicks somewhere else.
  - This breaks two acceptance items: "cuộn > 4px → header ẩn hẳn" (header fully hidden after scrolling > 4px) and "tiêu đề không bị thanh mục con che" (headings not covered by the sub-nav). The anchor scroll-margins are calculated assuming the header is hidden.
  - **Fix:** reveal the header only for keyboard focus, using `html:has([data-detail-page]) .site-header[data-scrolled]:not(:has(:focus-visible))`. This still meets the requirement that Tab/Shift+Tab into the header shows it. Alternatively, keep `:focus-within` and blur in HeaderFrame on scroll, but the `:focus-visible` approach is simpler and needs no JS.
  - Update the comment in `globals.css` and the decision text in D1 to match.

### [MINOR]
- **m-1. Without JS, or before hydration, the header never hides.**
  - `data-scrolled` is set only by HeaderFrame's JS. So the flat 80/104px sticky header permanently covers the sub-nav, which is stuck at 8/16px. The sub-nav claims to work as real anchors without JS (comment in `DetailSubNav`).
  - Suggestion: accept this as residual risk and record it in the task. If you want to cover it, apply the `--sticky-top` override only when JS has run (for example `html:has([data-detail-page]):has(.site-header[data-scrolled])`). Note that this makes the value change at the 4px threshold, which causes sticky jitter, so weigh it carefully.
- **m-2. `OBSERVER_MARGIN` is wrong in browsers without `:has()`.**
  - `OBSERVER_MARGIN = "-88px …"` (`DetailSubNav.tsx:14`) is hard-coded for the hidden-header case. In the fallback, the header covers 80–104px plus the sub-nav, so a section hidden under the bar can still be marked `aria-current`.
  - Few browsers are affected. Note it as residual risk.
- **m-3. Small deviation from D1.**
  - D1 specifies `opacity 0` / `visibility hidden` after the transition; the implementation uses only `transform`. The trade-off is sound and the builder recorded it under Residual risk.
  - However, the D1 text in the task file and in the design-spec at close-out must be updated to describe the actual implementation, so the docs don't contradict the code.
- **m-4. EOL/stat noise on about 10 files with no content changes.**
  - Listed above. At commit time, stage only the files with real changes (or run `git add` and confirm the diff is empty) so the commit doesn't pick up unrelated files.

## Residual risk
- Not verified in a browser, because the reviewer does not run the app:
  - the 768px width
  - real Tab-focus behaviour
  - reduced motion
  - fallback without `:has()`
  - the header's `shadow-md` possibly showing about 1px at the top edge when the header is hidden (the bar has only 8px of bottom padding)
- The `DetailSubNav` / `DetailLayout` contract for T02 is checked only by reading the code. T02 must confirm it in practice.

## Verdict
**FAIL.** There is 1 MAJOR (M-1: `:focus-within` keeps the header visible over the sticky sub-nav after the mobile menu is closed). There are no CRITICAL findings. Once M-1 is fixed (for example with `:not(:has(:focus-visible))`) and the D1 comment/doc text is updated, the change can PASS in round 2. m-1 to m-4 should be recorded or handled at close-out.
