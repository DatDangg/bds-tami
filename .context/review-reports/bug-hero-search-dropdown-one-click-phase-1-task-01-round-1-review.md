Agent: reviewer

# Review: bug-hero-search-dropdown-one-click, phase 1, task 01, round 1 (BL-085)

- **Review level:** STRICT
- **Reason:** The shared component `src/components/ui/option-select.tsx` gets new opt-in props (`open`/`onOpenChange`). It is used by HeroSearch, FilterFacets, ProjectFilters, JobFilters, FormField, *SortControl and FloorPlans. This is also a regression follow-up to BL-083 (cdfcdc2), which must not come back.
- **Blast radius:**
  - `OptionSelect`. The props are optional and passed straight to the Radix `Select` Root. When they are `undefined`, Radix stays uncontrolled, so other consumers behave exactly as before. A test covers this ("không truyền open: uncontrolled như cũ").
  - HeroSearch "Tùy chọn khác", rentals tab only. The projects tab uses 2 uncontrolled `OptionSelect`s and keeps the BL-083 click-outside behaviour, which is outside the acceptance scope.
  - The pre-hydrate native `<select>` branch does not use `open`, so it is unchanged.
  - No API, schema or doc impact.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm test -- HeroSearch.test.tsx option-select.test.tsx` | PASS, 2 files, 21 tests |
| `pnpm test` (full) | PASS, 4661/4661 tests |
| `pnpm lint` | Repo-wide 239 errors / 2825 warnings, all pre-existing. **0 problems** in the 4 changed files (grep `HeroSearch\|option-select` is empty). |
| `pnpm build` | PASS: route table printed. The builder did not run this; the reviewer did. Next 16 isolates dev in `.next/dev`, and the dev server at localhost:3000 still responds (HTTP 301 on `/vi`) after the build. |

## Bug repro closure
- Repro Verification status is `PASS`.
- Before: `bl085-before-1920.png` shows that one real click left 0 listboxes open.
- After: `bl085-after-1920.png` shows "Diện tích" open with exactly 1 listbox and "Mức giá" closed. The reviewer looked at the screenshot and it is consistent with the claim.
- The keyboard, Esc and click-outside checks are described in the task file. Their evidence is the builder's Playwright run plus the unit tests.
- Accepted, with the 390 residual risk noted below.

## Race / focus / pointer-events analysis
- **onOpenChange race.**
  - Mouse: the new trigger's React `onPointerDown` (root listener) queues `set(area)`. After that, the old layer's DismissableLayer document listener fires `onOpenChange(false)` and queues an updater, `current === "price" ? null : current`. That updater receives `area`, so the new chip stays open.
  - Touch: the trigger opens on `onClick`, and the outside listener waits for the document `click`. That also runs after the root handler, so the result is the same.
  - The updaters compose correctly whether React flushes in between or not. A single `string | null` state makes 2 open listboxes impossible by construction.
- **Clicking the already-open chip:** `set(price)` then `dismiss` gives `null`, so it toggles closed. That is acceptable.
- **Focus.** The old FocusScope's unmount auto-focus (setTimeout 0, then the old trigger) runs while the new Select FocusScope is `trapped`. The focusin guard pulls focus back inside the new content, and the builder confirmed in a real browser that focus is on the new dropdown's option. No `onCloseAutoFocus` hack was needed. OK.
- **`pointer-events-auto` on the chip grid only.** While the body is locked, the tabs, keyword input, submit button, chip-carousel and gutter still inherit `none`. Clicking the grid gap (the grid div itself) is still "outside", so it closes the dropdown. The SelectContent portal sits at `z-(--z-modal)`, above the grid. OK.

## Responsive Checklist Gate (diff touches UI: class only)
| Item | Result | Evidence |
|---|---|---|
| Layout / no horizontal scroll / grid | OK | Grid classes unchanged (`grid-cols-2` / `md:grid-cols-5`). Only `pointer-events-auto` was added, which has no layout effect. |
| Typography / spacing | N/A | Unchanged |
| Media | N/A | None |
| Touch target / interaction | OK (reasoned) | Chips unchanged. The touch path (`onClick` open plus document `click` dismiss) composes correctly with the conditional updater. Not browser-verified with real touch, see Residual risk. |
| Viewport / A11y / reduced-motion / overflow | OK | No vh, overflow or animation changes. Keyboard and Esc still work (test plus builder evidence). |

## Skill gates
- **aislop:** skip, `aislop` not installed (command not found).
- **oxlint (anti-slop):** skip, oxlint not configured. ESLint is clean on the changed files and tsc passes.
- **ocr:** skip, ocr not installed.
- **AI-readable:** OK.
  - The name `openOption` is clear.
  - No function is over 50 lines in the diff.
  - Comments give the WHY (BL-083/BL-085 rationale).
  - No magic numbers.
  - 0 indicators.
- **ai-friendly-web:** N/A, since this is an interaction fix with no route or crawl change. `llms.txt`/`robots.txt`/`sitemap.xml` routes still exist in the build output.
- **blitzstrike:** N/A, since this is not auth, API or input-sensitive.

## Findings
- **[MINOR] Test false-confidence for the BL-083 invariant.** In `src/components/home/HeroSearch.test.tsx`, the new test "BL-085 … không bao giờ 2 listbox cùng mở" uses `pointerEventsCheck: 0`. The builder documented that it also passes with the old uncontrolled code.
  - If someone later removes the `open`/`onOpenChange` wiring but keeps `pointer-events-auto` on the grid, BL-083 (2 listboxes open) returns in a real browser and no test fails.
  - What is guarded today: the conditional updater (an unconditional `next ? name : null` would fail the test, because the old dismiss arrives after the new open) and the `pointer-events-auto` class.
  - Suggested fix (follow-up): assert the wiring directly. Options:
    - Mock `OptionSelect` in one HeroSearch test and check that it receives `open`/`onOpenChange` with `open === true` for at most one field.
    - Extract the updater into a pure helper and unit-test the order "B true, then A false" so B stays open.
- **[MINOR] The 390 evidence is inconclusive.** `bl085-after-390.png` is a cropped zoom of the top of the card: the open dropdown is not visible, the pane is 349px CSS, and the click was a mouse click. Real touch on mobile was not exercised. The reviewer's reasoning on Radix event ordering says it is correct.
  - Suggested fix: when convenient, re-capture with Playwright `hasTouch`/`tap` at 390 and frame the open listbox.
- **[MINOR] Task file says `pnpm build` was not run.** The reviewer ran it and it passes; update the task's verification summary at close-out.

No CRITICAL or MAJOR findings.

## Residual risk
- Real touch on a mobile device is unverified in a browser (reasoned only).
- The tests do not guard the BL-083 wiring (see the first MINOR).

## Verdict
**PASS**
