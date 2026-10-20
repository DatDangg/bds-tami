Agent: reviewer

# Review: feature-detail-pages-unified-layout, phase-1-task-01, round 2 (BL-027, MODIFY)

- **Review level:** STRICT
- **Reason:** The change touches the shared header (`.site-header`) on every `(frontend)` route and the shared `--sticky-top` variable, which drives sticky positions and scroll-margins. It also touches `LeadFormSlot` (used on several pages) and the new shared `src/components/detail/*` components, which T02 will reuse. Round 1 failed on a navigation/visibility bug.
- **Blast radius:**
  - The header on all public pages. The new behaviour only applies when `html:has([data-detail-page])` matches, which today means only `/du-an/[slug]` and `/en/projects/[slug]`.
  - Every anchor on the project detail page: `#overview…#faq`, `#documents` (hero "Tải tài liệu"), `#lead-form` (hero "Nhận tư vấn", bottom CTA, `ProjectStickyCta`), and the sticky consult card.
  - `LeadFormSlot` on other pages: `--sticky-top` equals `--header-offset` there, so nothing changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/projects src/components/detail src/components/layout src/components/forms` | PASS: 26 files, 236 tests |
| `pnpm lint` | PASS: 0 errors. 2 old warnings in `tools/task-dashboard/server.mjs`, outside scope |
| `pnpm typecheck` | PASS (`tsc --noEmit`, no output) |

Diff check (`git diff --ignore-space-at-eol --stat` plus the untracked files in `src/components/detail/`):
- Files with real content changes: `globals.css`, `DetailSection`, `DetailSubNav`, `LeadFormSlot`, `HeaderFrame` (comment only), `Documents`, `LegalPolicy`, `PriceTable`, `ProjectAmenities`, `ProjectDetail`, `ProjectFaq`, `ProjectHighlights`, `ProjectListings`, `ProjectLocation`, `ProjectOverview`, `project-detail.test`.
- New files: `DetailLayout.tsx`, `DetailLayout.test.tsx`, `detail-header-css.test.ts`.
- The other `M` files have EOL-only changes, as noted in round 1.
- No leftover `ProjectSubNav` or `ProjectSection` file or import.

## Check of the round-1 findings
| Finding | Status | Evidence |
|---|---|---|
| M-1 (`:focus-within` keeps the header over the sub-nav) | **FIXED** | `globals.css:259` uses `.site-header[data-scrolled]:not(:has(:focus-visible))`. Radix returning focus to the hamburger after a mouse or touch close does not match `:focus-visible` (browsers apply the focus-visible heuristic to the previous pointer interaction), so the header hides. Closing with Escape or Tabbing into the header matches, so keyboard users see the header, as intended. The specificity is high enough to override the base rule. The test `detail-header-css.test.ts:7-10` pins the selector. |
| m-1 (no JS / before hydration the header covers the sub-nav) | Fixed, but the fix **causes a regression**. See M-2 | `globals.css:246-253`: `html:has([data-detail-page]):has(.site-header[data-scrolled])` |
| m-2 (`OBSERVER_MARGIN` wrong without `:has()`) | Not changed. Acceptable as residual risk, but the task's Residual risk section does not name it explicitly | `DetailSubNav.tsx:14` |
| m-3 (D1 text vs `transform`) | **FIXED** | The task's D1 text now says `translateY(-100%)` only, no visibility/opacity. The globals.css comment matches. |
| m-4 (EOL noise) | Still open; handle at close-out | The real-change file list is above. At commit time, stage only those files. |

## Is the new `:has()` combination a regression?

### Selector logic and fallback
- `:root` has specificity (0,1,0). `html:has([data-detail-page]):has(.site-header[data-scrolled])` has (0,3,1), so it wins.
- The lg media query overrides correctly.
- Without `:has()` support, every rule is dropped: the header floats and `--sticky-top` equals `--header-offset`. This is consistent. OK.

### Other pages
- No `data-detail-page`, so `--sticky-top` equals `--header-offset` and nothing changes.
- The rental detail page has not been migrated yet (T02), so it is not affected. OK.

### The 104→16px switch
`--sticky-top` now changes at the moment `data-scrolled` is set, and every `scroll-margin` on the detail page depends on it. That causes two effects.

1. **Wrong anchor landing position when jumping from the top of the page (scrollY < 4px).**
   - Whether the jump is native (`#lead-form`) or JS (`LegalPolicy.tsx:91`, `DetailSubNav.tsx:72`), the browser computes the scroll target with the margin in effect at that moment, which is the 104px value (80px below lg).
   - Once the jump crosses 4px, `data-scrolled` is set, the header slides away and the sub-nav moves up to 16/8px.
   - The heading stays where it landed. That leaves an empty gap of about 88px at ≥ lg (72px below lg) between the sub-nav and the heading. See M-2.
2. **Sub-nav jump while it is already stuck.**
   - This happens on load with a restored scroll position or a deep link `/du-an/x#faq`.
   - The sub-nav jumps from 104px to 16px immediately (`top` has no transition), while the header takes `--duration-slow` to slide out.
   - For that moment the header (z-header) overlaps the sub-nav.
   - It happens once and is cosmetic, so it is MINOR. The builder already recorded it.

## Responsive Checklist Gate (375 / 768 / 1280)
Attempt 2 did not change layout, grid or typography, only the header CSS selectors. The round-1 results still hold.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Unchanged from round 1. The builder measured 375 and 1280 in attempt 1. 768 not measured (residual) |
| Mobile-first min-width | OK | `@media (min-width: 64rem)` |
| Grid without fixed columns | OK | `minmax(0,1fr)_22rem`, only at ≥ lg |
| Container not fixed px | OK | `max-w-container px-gutter` |
| Typography rem/clamp | OK | Tokens only, nothing new |
| Spacing scale | OK | Unchanged |
| Media | N/A | No new media |
| Touch target ≥ 44 | OK | Sub-nav items `min-h-11` |
| Nav on mobile | OK | Sub-nav scrolls horizontally; hamburger unchanged |
| Table wrapper | OK | PriceTable `role=region` scroll |
| 100vh | OK | `100dvh` |
| prefers-reduced-motion | OK | `transition: none` (`globals.css:262-266`) |
| overflow:hidden to mask bugs | OK | Not used |

## Skill gates
- **aislop:** skip. Not among the allowed verify commands.
- **oxlint (anti-slop):** skip, oxlint not configured. eslint gave 0 errors.
- **ocr:** skip, ocr not installed / not in allowed commands.
- **AI-readable:** OK. The new test is short and clear, and the CSS comments explain WHY. Fewer than 3 indicators.
- **ai-friendly-web:** N/A. robots/sitemap/llms are not touched.
- **blitzstrike:** N/A. No auth, input or API changes.

## Findings

### [CRITICAL]
- None.

### [MAJOR]
- **M-2. Regression introduced by the m-1 fix: anchors jumped to from the top of the page land about 88px (lg) / 72px (< lg) too low, leaving a gap where the old header was.**
  - **Location:** `src/app/(frontend)/globals.css:246-253`, combined with every `scroll-mt-[calc(var(--sticky-top)+…)]` (`DetailSection.tsx:29`, `Documents.tsx:14`, `LegalPolicy.tsx:43`, `DetailLayout.tsx:9`, `LeadFormSlot.tsx:28`).
  - **Common trigger:** the two hero buttons "Nhận tư vấn" → `#lead-form` and "Tải tài liệu" → `#documents` (`ProjectHero.tsx:37,41`). They are visible at scrollY 0, before `data-scrolled` is set. Deep links with a hash, where the browser scrolls to the fragment before hydration, also trigger it.
  - **What happens:**
    - At that moment `--sticky-top` is still 104/80px. The target lands at 104 + 54 + 18 = 176px.
    - Then the header hides and the sub-nav moves up to 16px. The heading stays at 176px, so there is an empty band of about 88px.
    - The browser does not recompute the scroll position when `scroll-margin` changes afterwards.
  - **Impact:**
    - This breaks the acceptance item "Neo … `#documents`, `#lead-form`: … không thừa khoảng trống cũ của header" (no leftover gap from the old header).
    - In round 1, with a fixed `--sticky-top`, this path landed correctly at 88px.
    - The task's Residual risk section only mentions the sub-nav jump, not this gap.
  - **Fix (pick one):**
    - (a) **Recommended.** Go back to the round-1 rule `html:has([data-detail-page]) { --sticky-top: .5rem }` (lg `1rem`) and accept m-1 (no JS / before hydration) as residual risk, as round 1 suggested.
    - (b) Keep the condition but compute `scroll-margin` from a fixed value that does not depend on `data-scrolled` (for example a separate `--detail-anchor-top: .5rem/1rem` variable used only for scroll-mt), so only the sub-nav's sticky `top` changes.
  - Either way:
    - Update the `detail-header-css.test.ts:12-15` test to match.
    - Update the D2 text in the task file to match.

### [MINOR]
- **m-5. Sub-nav jumps 104→16px immediately while the header is still sliding out** (deep link or restored scroll position). The header overlaps the sub-nav for about `--duration-slow`. Fix (a) above removes this; fix (b) keeps it, so record it as residual risk.
- **m-6. Stale text in the task file.** The Residual risk section still says "Tab-focus hiện header (`:focus-within`)" (`phase-1-task-01.md:64`). Change it to `:has(:focus-visible)`. Also add m-2 (`OBSERVER_MARGIN` without `:has()`) to Residual risk.
- **m-4 (carried over).** At close-out, stage only the files with real changes (list above).

## Residual risk
- Not verified in a browser, because the reviewer does not run the app:
  - real focus-visible behaviour after Radix closes the menu in each browser (Safari, Firefox)
  - the 768px width
  - reduced motion
  - fallback without `:has()`
  - anchor landing positions after attempt 2 (the builder also has not re-checked this visually)
- M-2 comes from CSS analysis: the scroll target is computed with the `scroll-margin` in effect at scroll time, and the browser does not re-target when it changes later. A browser run would confirm the exact pixel gap.
- The round budget is "review tối đa 2 vòng" (at most 2 review rounds). This is round 2. M-2 is a small, mechanical fix (option a reverts 2 selectors), so the primary agent should ask the user to choose: allow a third round, or escalate to `architecture_review_needed`.

## Verdict
**FAIL.** M-1 and m-3 are truly fixed. However, the m-1 fix introduces 1 new MAJOR (M-2: anchors jumped to from the top of the page, including both hero buttons, land with a leftover ~88px gap from the old header, which breaks an acceptance item). There are no CRITICAL findings.
