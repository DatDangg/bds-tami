Agent: reviewer

# Review — bug-projects-slider-pagination · phase-1-task-01 · round 1 (BL-038)

- **Review level:** STRICT
- **Reason:** The diff changes the shared hook `useSnapSlider`, which ProjectsSlider, OffersSlider and RentalsTabs all use. Per AGENTS.md, a change to a shared hook requires STRICT. There is no auth, schema or API risk.
- **Blast radius:** Home page `/vi` and `/en`. Affected areas:
  - "Dự án nổi bật" slider (`ProjectsSlider`): dot count, active dot, arrows.
  - `OffersSlider.tsx:18` and `RentalsTabs.tsx:20`: both call `useSnapSlider(n, false)` and use only `listRef` + `scrollByPage`. With `observe=false` the effect returns early. `scrollByPage` is unchanged, so neither slider changes behavior.
  - No API, data or i18n key changes.
- **Scope reviewed:** `src/components/home/use-snap-slider.tsx`, `src/components/home/ProjectsSlider.tsx`, `src/components/home/ProjectsSlider.test.tsx`. Other dirty files were ignored as instructed.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/home` | PASS — 9 files, 82/82 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — 0 errors |
| `pnpm lint` (`eslint .`) | PASS — 0 errors. 2 old warnings in `tools/task-dashboard/server.mjs`, outside scope |

## Root cause closure
- **Old code (`use-snap-slider.tsx`, removed lines 21-33):** in the IntersectionObserver callback, the last intersecting entry won. So `current` pointed at the right-most visible card, and `current ± 1` skipped cards. The task file proves this with the 1280px geometry.
- **New code removes the observer.** Each item below was checked:
  - **`current`:** set to the nearest scroll position by `scrollLeft` (`:39-43`). When `scrollLeft ≥ max-1` it becomes `pages-1` (`:38`), so the last dot is active at the end.
  - **Dot count:** `pageCount` is the first index whose offset is `≥ max-1`, plus 1 (`:55-56`). That is the number of reachable scroll positions. If everything fits, `max ≤ 0`, so index 0 and pageCount 1, and the controls are hidden.
  - **Wrap at both ends:** `((t % p) + p) % p` (`:84`).
  - **Scroll target:** `min(offset, max)` (`:87`).
- **Offsets match snap positions:** `ProjectsSlider.tsx:59` uses `px-gutter` together with `[scroll-padding-inline:var(--spacing-gutter)]`. So `offset_i = left_i - left_0` equals the snap scrollLeft of card i. Snap positions past `max` are clamped by the browser, which matches `min(offset, max)`.
- **Repro Verification:** status is PASS with automated evidence. The BL-038 test runs the 1280px geometry and asserts:
  - 5 dots;
  - dot 1 active at scroll 0;
  - › scrolls to 488, and dot 2 is active at scroll 488;
  - clicking dot 3 scrolls to 976;
  - dot 5 is active at scroll 1702;
  - › at the end scrolls to 0;
  - ‹ at the start scrolls to 1702.

  The claim "FAIL before the fix" is confirmed by reading the code: the old code rendered `slides.map` = 6 dots, so `toHaveLength(5)` must fail. The not-measured fallback (clientWidth 0 → 3 dots, `scrollIntoView` on the next card) is covered by its own test. The original repro was itself a geometric simulation, so automated evidence is enough here.

## Specific checks
- **Cleanup:** the scroll listener is removed, `ResizeObserver.disconnect()` is called, and a pending rAF is cancelled (`:73-77`). OK.
- **SSR/hydration:** the first render uses `pageCount = count` (measuredPages is null) on both server and client. The dot count only changes after the effect runs, so there is no hydration mismatch. OK.
- **a11y:** `aria-current="true"` is kept on the active dot. The `goTo` label uses `position+1`, and the dot group keeps its `aria-label`. OK. Dots use `key={position}`, which is fine because the list is static by index.
- **Mobile swipe:** the snap and overflow CSS are unchanged. The scroll listener is passive and batched with rAF. Arrows are still `md:inline-flex` only. OK.
- **Re-measure:** `ResizeObserver(list)` fires when the viewport changes and the `w-[82%]` cards resize. It also fires when the list goes from `clientWidth 0` (hidden) to visible. OK.

## Responsive Checklist Gate
The diff touches UI logic only: the dot count comes from `pageCount`. There are no CSS, class or layout changes. Checked by reading the code and doing the math, without a browser.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Wrapper/list CSS is unchanged. The dot row has fewer or equal dots, so it cannot get wider |
| Mobile-first / grid / container | N/A | No CSS changes |
| Typography rem / clamp | N/A | No changes |
| Media (img aspect / srcset) | N/A | No changes |
| Touch target ≥ 44px | OK | Dot buttons keep their existing classes (unchanged in the diff). Arrows are `size-11` (44px) |
| Nav / table on mobile | N/A | — |
| 100vh / reduced-motion | OK | `behavior` still uses `prefers-reduced-motion` (`:23`), and `motion-reduce:scroll-auto` is kept |
| Not hidden by overflow:hidden | OK | No overflow changes |

## Skill gates
- **aislop:** skip. The CLI is not in the reviewer's allowed verify commands. A manual slop review found nothing significant.
- **oxlint (anti-slop):** skip, oxlint not configured. No `.oxlintrc*` exists; eslint has 0 errors.
- **ocr (open-code-review):** skip, ocr not installed / not allowed.
- **AI-readable:** OK. 1–2 indicators were found, below the threshold of 3:
  - The `useSnapSlider` hook is about 90 lines (`:15-105`), over the 50-line guideline.
  - The comparison on `:41` is long and hard to read.

  The JSDoc was updated to describe the new mechanism, and there are no WHAT-style comments.
- **ai-friendly-web:** N/A. This is an internal UI bug fix and does not touch llms.txt, robots or sitemap.
- **blitzstrike:** N/A. No auth, input or API surface.

## Findings
- **[MINOR] `src/components/home/use-snap-slider.tsx:15-105`:** the hook is about 90 lines and the effect alone is about 50. **Fix:** extract `measureOffsets(list)` and `nearestPage(offsets, max, pages, scrollLeft)` as pure functions at module level. They could then also be unit-tested directly.
- **[MINOR] `src/components/home/use-snap-slider.tsx:41`:** the line computing `Math.abs(Math.min(offsets[index] ?? 0, max) - scrolled)` twice is long and hard to read. **Fix:** add a local `const distance = (i) => Math.abs(Math.min(offsets[i] ?? 0, max) - scrolled)`.
- **[MINOR] `src/components/home/ProjectsSlider.test.tsx` (BL-038 test, `Element.prototype.scrollTo = scrollTo`):** the prototype is assigned and never restored, so it leaks to later tests in the same file. It does not cause a false pass today, because the "not measured" test still takes the `scrollIntoView` path when offsets are empty. **Fix:** save and restore it in `afterEach`, or use `vi.spyOn` with a defined property.
- **[MINOR] Test coverage:** the `ResizeObserver` re-measure path and the unmount cleanup are not tested, because jsdom has no ResizeObserver. These are recorded as residual risk only.

There are no CRITICAL or MAJOR findings.

## Residual risk
- Not checked in a real browser:
  - smooth scroll combined with snap-mandatory when › is clicked several times quickly (`current` updates during the scroll);
  - subpixel `scrollLeft` at browser zoom levels (there is a 1px tolerance).
- If a card's width changes while the list width does not (not the case today, since cards are fixed at `sm:w-[464px]` / `w-[82%]`), the hook will not re-measure.
- With 5 dots for 6 cards, the label "Chuyển tới dự án 5" covers the last position, which shows both card 5 and card 6. This is acceptable and matches the design spec patch in the task's Doc impact.

## Verdict
✅ **PASS**: the root cause is fixed, the repro is verified by an automated test, and the 3 verify commands pass. The 4 MINOR findings do not block.
