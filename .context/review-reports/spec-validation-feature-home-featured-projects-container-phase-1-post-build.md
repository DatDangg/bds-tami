Agent: spec-validator

# Spec Validation — feature/home-featured-projects-container · phase-1 · post-build (phase review, round 1)

- Work item: feature/home-featured-projects-container (BL-075, MODIFY, UI only)
- Mode: Phase review (after task PASS)
- Commit: `5b0b6cf` (phase-1-task-01), reviewer STRICT PASS round 1 — `.context/review-reports/feature-home-featured-projects-container-phase-1-task-01-round-1-review.md`
- Intent sources: `spec/changes/2026-10-24-home-featured-projects-container.md`; `SPECIFICATIONS.md` (spec_version 1.59.0, line 9) bullet "Khung + căn giữa (BL-075 …)" (line 136); `.context/design-spec.md:261`, `:313`, `:314`, `:363`; `spec/CHANGELOG.md:84`; `spec/updates/2026-10-24-home-featured-projects-container.md`; `spec/test-scope/current.json` (scopeVersion 79); `tasks/feature-home-featured-projects-container/phase-1-task-01.md`
- Unrelated dirty files (BL-077 collections/fields, BACKLOG BL-076..078, `.claude/**`, `tools/**`) were ignored.

## Verdict: ✅ COMPLETE (PASS)

There are no MISSING gaps and no code-level PARTIAL gaps. The open items are close-out documentation steps that change-request already plans, plus residual risks that are recorded and accepted.

## Coverage matrix

| # | Requirement | Source | Implementation / evidence | Status |
|---|---|---|---|---|
| R1 | The slider is no longer full-bleed. The card area sits in the same `max-w-container` + `px-gutter` as the other blocks. | SPEC:136; design-spec:313, :363; change doc §1; updates delta 1 | `FeaturedProjects.tsx` wraps `<ProjectsSlider>` in `div.mx-auto w-full max-w-container` (the SimilarCarousel pattern). The `ul` of `CardSlider` already has `px-gutter` + `scroll-padding-inline`, so the wrapper has no `px-gutter` and there is no double padding. Test: `FeaturedProjects.test.tsx` "BL-075: slider nằm trong khung…". | ✅ |
| R2 | At ≥ lg, the left/right edges of the scroll area match the frame of the block header / Về TAMI. While overflowing, the first card lines up with the frame's content edge. | SPEC:136; task acceptance (a)(b) | Builder measurements: 1920 head [313,1593] = ul [313,1593], first card 345 = 313+32. 1440 head [73,1353] = ul, first card 105 = 73+32. 1024 first card = gutter. | ✅ |
| R3 | When the cards exactly fit one row (no scrolling), the row is centred, with no arrows or dots. | SPEC:136; design-spec:314; updates delta 2 | Opt-in prop `CardSlider` `centerWhenFits` → `justify-center-safe`, with computed value `safe center` checked in the browser. Plain `justify-center` is not used, and the test asserts this. Arrows/dots are hidden by the existing `pageCount ≤ 1` logic (BL-038). Measured with the 4th card onward hidden in the DOM: left/right space 184/184 (1920), 216/216 (1440), 53/53 (1024), sw == cw. | ✅ (residual, see below) |
| R4 | More than one row: the slider behaves as before (first card at the frame edge, arrows ≥ md, dots, swiping, a11y carousel kept, horizontal swipe < md). | SPEC:136; updates delta 3 | `safe center` falls back to start alignment when content overflows. No change to `useSnapSlider`, arrows, dots, `SLIDE_WIDTH`, gap or `IMAGE_SIZES`. Measured at 768/390: first card = gutter, sw > cw. Existing CardSlider/ProjectsSlider tests pass (438 files / 4606). | ✅ |
| R5 | Only the home block changes. The shared `CardSlider` keeps its behaviour for its other consumers. | SPEC:136; updates delta 4; test-scope `dependents` | `centerWhenFits = false` by default, and the `cn()` output for the base string is the same as before. Test: "mặc định không có" justify-center. Only `ProjectsSlider` passes the prop. | ✅ |
| R6 | No broken layout and no horizontal page scroll at 390/768/1024/1440/1920. `/en` matches `/vi`. | change doc acceptance; task acceptance | docSW = viewport at every breakpoint. `/en` was measured at 1024/768. | ✅ |
| R7 | design-spec S01.3 is updated: "tràn viền" removed and the few-cards centring rule added. | change doc acceptance | design-spec:261 (as-built BL-044, frame 1280 fits 4), :313, :314, :363 updated. | ✅ |
| R8 | Comment in `CardSlider` changed from "~5 thẻ/khung desktop" to frame 1280 ≈ 4. | task acceptance | `CardSlider.tsx` comment now reads "272px ≥ lg (khung 1280 vừa 4 thẻ)". | ✅ |
| R9 | Tests for CardSlider (on/off), ProjectsSlider (prop passed) and FeaturedProjects (wrapper). | task acceptance | All 3 tests are in commit `5b0b6cf`. | ✅ |
| R10 | `pnpm lint` · `typecheck` · `test` PASS. | task acceptance; project-config | typecheck PASS, test PASS, eslint on `src/components/{layout,home}` clean. Full-repo `pnpm lint` fails only on generated build/report artifacts that existed before this change and are outside its scope. | ✅ (with note) |
| R11 | spec_version bump + CHANGELOG + spec/updates. | AGENTS Feature rule 3b | spec_version 1.59.0; CHANGELOG:84 1.59.0 MINOR → scope v79; updates file present and consistent with SPEC:136. | ✅ |
| R12 | test-scope file list/areas match what was actually built. | test-scope current.json | `changed.files` = the 6 files in the commit exactly (3 src + 3 tests). Nothing missing and nothing extra. Modules/screens/viewports/dependents are consistent. | ✅ (status needs flipping, see G1) |

## Gaps (by severity)

No HIGH or MEDIUM gaps.

- **[PARTIAL · LOW · doc, pending close-out] G1. test-scope v79 is still labelled as pre-build scope.**
  - `spec/test-scope/current.json:6-7`: `triggerNote` says "PHẠM VI DỰ KIẾN trước build", and `status` is "published — dự kiến trước build (chưa as-built)".
  - The file list already matches commit `5b0b6cf`, so only the status/note needs changing to as-built at close-out (no file-list change).
  - Owner: change-request close-out. Related task: phase-1-task-01.
- **[PARTIAL · LOW · doc, pending close-out] G2. `docs/DESIGN.md:292` still says "nội dung tối đa ~1280px, slider/hero tràn viền".**
  - This is an as-built doc. After BL-075 only the hero is full-bleed; the home featured-projects slider sits in the frame.
  - Reconcile it at close-out as planned (task Doc impact; commit trailer `Doc-Impact: DESIGN`). This is not a code gap.
- **[INFO · LOW] G3. The change doc's boundary wording differs slightly from the published spec.**
  - Change doc acceptance (`spec/changes/...:26-27`) says "< một hàng → căn giữa; ≥ một hàng → slider".
  - SPEC:136, design-spec:314 and the updates delta say "vừa hết một hàng (không cuộn được) → căn giữa; nhiều hơn một hàng → slider".
  - The implementation follows SPEC 1.59.0, which is authoritative: exactly 4 cards at 1440 → sw == cw → centred, no controls.
  - No code action needed. When the change doc is archived at close-out, ticking its checkboxes against the SPEC wording is enough.
- **[INFO] G4. Close-out housekeeping.**
  - The change doc is still `status: pending` with acceptance checkboxes unticked.
  - BACKLOG BL-075 still needs to be marked done and the change doc archived. This is a normal change-request close-out step.

## Residual risk (accepted, already recorded in task / commit trailer)

1. The few-cards case was only simulated by hiding DOM elements (dev has 6 featured projects). `pageCount = 1` is inferred from the `use-snap-slider` formula with sw == cw measured for real. The browser pane did not fire `ResizeObserver`, so the live disappearance of arrows/dots was not observed. Recommendation: re-check on staging/prod with 3 featured projects (the actual prod case) at 1440/1920 (centred, no arrows/dots) and 1024 (3 cards fit).
2. Safari < 17.6 does not support `safe` → cards align left (accepted fallback, recorded in SPEC:136 / design-spec:314).
3. Before hydration, arrows/dots show according to the card count and then hide once the cards fit one row, so the block below shifts up. This has existed since BL-038, is outside scope, and is recorded in design-spec:314.
4. Full-repo `pnpm lint` fails on generated artifacts (playwright-report / bundle), not on source. This is a separate repo-hygiene issue.

## Conclusion

Phase 1 delivers everything SPEC 1.59.0 / design-spec S01.3 require for BL-075 (R1–R12). Test-scope v79 lists exactly the 6 files in commit `5b0b6cf`. The remaining items (G1, G2, G4) are close-out doc reconcile steps for change-request. They do not block the phase.
