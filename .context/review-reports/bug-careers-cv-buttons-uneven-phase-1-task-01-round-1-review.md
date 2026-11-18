Agent: reviewer

# Review — bug-careers-cv-buttons-uneven · phase-1-task-01 · round 1 (BL-124)

- Review level: **NORMAL**
- Reason: Small cosmetic UI fix in one leaf component (`CopyEmailButton`), only in the `tone="onDark"` branch. No API, auth, schema or shared layout changes, and `CtaBanner` is not touched. `CopyEmailButton` has 2 call sites, so the review goes above FAST.
- Blast radius: `src/components/careers/CopyEmailButton.tsx` → `CareersCvBanner` (`/tuyen-dung`, `/en/careers`, tone onDark, `CtaBanner align="start" size="compact"`) and `JobListPage` `NoJobsPanel` (tone light, line 146). Both pages render the same light-tone markup as before.
- Scope: `git diff src/components/careers/CopyEmailButton.tsx src/components/careers/CopyEmailButton.test.tsx` only. Other dirty files (BL-119/121/122/123) are out of scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm exec eslint src/components/careers/CopyEmailButton.tsx src/components/careers/CopyEmailButton.test.tsx` | PASS (exit 0, no output) |
| `pnpm vitest run src/components/careers src/components/layout/CtaBanner.test.tsx` | PASS — 5 files / 68 tests |
| Screenshots 375/390/768/1440 | skip — no dev server allowed or reachable in reviewer scope; judged from CSS math (see Residual risk) |

## Requirements coverage / CSS analysis
- **Mobile (<sm) width:** The CtaBanner button row is `flex w-full flex-col items-start` and the primary button is `w-full max-w-xs`, so it is min(row width, 320px). The CopyEmailButton wrapper is now `w-full max-w-xs`, which gives the same box. The inner Button is `w-full`, so it fills the wrapper. Both buttons are 320px at 375/390 (row width ≈ 375 − 2×gutter ≥ 320) and have the same width below 320 too. OK.
- **Height:** Both use `size="lg"` (52px), which is ≥ 44px. Unchanged. OK.
- **Empty aria-live span / stray gap-y:** The span has width 0 when `message` is empty, because `ms-3`/`sm:ms-3` only applies when there is a message. The wrapper has only `gap-y-2`, so column-gap is 0. Flex line breaking gives button 100% + span 0 = 100%, which fits. The span stays on line 1, so no second flex line forms and no 8px row-gap is added. The wrapper height stays 52px. OK.
- **Message line (copied/failed):** When the message is not empty, its width is > 0, so it wraps to line 2. It sits 8px below the button (intended `gap-y-2`) with no indent below `sm` (`sm:ms-3`) and is left-aligned. That matches the banner's `align="start"`. OK.
- **≥ sm:** The wrapper is `sm:w-auto sm:max-w-none` and the button is `sm:w-auto`, which matches the old intrinsic sizing in the `sm:flex-row` row. The message keeps `ms-3` (via `sm:ms-3`), so it behaves as before. OK.
- **Tone light (NoJobsPanel):** The wrapper class is unchanged. The button keeps `focus-visible:outline-focus-ring` with no width. The message keeps `ms-3` when it is not empty, the same as before. The BL-120 no-email state (no banner, "Liên hệ TAMI" link) does not render this component's onDark branch, so it is unaffected. OK.
- **Regression tests:** The 2 new tests check onDark classes (`w-full max-w-xs sm:w-auto sm:max-w-none`, button `w-full sm:w-auto`) and that light has no `w-full`. These are class-level assertions only, which is reasonable in jsdom (it has no layout). The existing copied/failed/focus-ring tests still pass.

## Responsive Checklist Gate (diff touches UI)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | `w-full max-w-xs` never exceeds the parent; `max-w-xs` = 20rem |
| Mobile-first (`min-width` breakpoints) | OK | only `sm:` overrides added |
| Grid auto-fit/minmax | N/A | no grid |
| Container not fixed px | OK | `max-w-xs` (rem), `w-full` |
| Font-size rem / fluid heading | N/A | no typography change (`text-small` token unchanged) |
| Spacing scale | OK | `gap-y-2`, `ms-3` tokens |
| Media | N/A | no media |
| Touch target ≥ 44×44 | OK | `size="lg"` 52px high, 320px wide on mobile; `min-w-11` kept |
| Nav / table on mobile | N/A | — |
| 100vh / reduced-motion / overflow-hidden masking | N/A | no change |

## Skill gates
- aislop: skip — `aislop` is not an allowed verify command. The 2-file diff was checked manually and has no slop patterns.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`). ESLint is clean.
- ocr (open-code-review): skip, ocr not installed or not allowed.
- AI-readable: OK — 0 indicators. The function is under 50 lines, the file is 60 lines, and the comment explains WHY (BL-124 aligns with the CtaBanner convention).
- ai-friendly-web: N/A — component-level styling, no route or crawler surface change.
- blitzstrike: N/A — not STRICT, no security surface.
- Surgical diff: OK — every line traces to BL-124, `CtaBanner` and i18n are untouched, and there is no drive-by refactor.

## Bug repro closure
Repro Verification status is `PASS`. The evidence is regression tests that the builder reports as FAIL before the fix and PASS after, and they pass in this review run. The original symptom (button narrower than the primary button) is a layout property. The reviewer confirmed it independently through the CSS math above. A browser measurement is not available; this is recorded as residual risk and is not unverifiable, because the fix is a deterministic class change that mirrors the sibling button's exact classes (`w-full max-w-xs sm:w-auto`).

## Findings
- [MINOR] `src/components/careers/CopyEmailButton.tsx:40,49` — The width is now split across two layers: the wrapper has `max-w-xs` and the button has `w-full`. It is correct, but if `CtaBanner` changes its primary button cap (`max-w-xs`), this component will drift silently. Optional suggestion: add a short comment in `CtaBanner.tsx:63`, or extract a shared class constant later. Not required for this task.
- No CRITICAL or MAJOR findings.

## Residual risk
- No real-browser bounding-box check at 375/390/768/1440 (no dev server). Equal width and height and the absence of a stray row-gap are proven only by CSS flex math. A visual QA pass on staging is recommended.

## Verdict
**PASS**
