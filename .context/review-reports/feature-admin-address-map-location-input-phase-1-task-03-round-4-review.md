Agent: reviewer

# Review: feature-admin-address-map-location-input, phase-1-task-03, round 4 (follow-up for the 3 MINOR findings from round 3, BL-131)

- **Review level:** FAST
- **Reason:** The diff is small: 1 type cast, 1 CSS rule and 2 tests, about 30 lines in 3 files. It does not touch API, schema, auth or server validation, and runtime behavior is the same apart from the disabled background. Round 3 already reviewed `MapLocationField` at STRICT level. This round only checks the follow-up.
- **Blast radius:** the "Toạ độ bản đồ" field in 6 admin forms (CSS for the disabled state), plus `MapLocationField.tsx:52` (a type-only change with no runtime effect) and the component's test file. No API, data or other client is affected.
- **Scope:** only `git diff` of `src/components/admin/MapLocationField.tsx`, `src/components/admin/styles/_map-location.scss` and `src/components/admin/MapLocationField.test.tsx`. Other dirty files in the working tree are unrelated and were ignored.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | PASS, 0 errors (reviewer re-ran it) |
| `pnpm vitest run src/components/admin/MapLocationField.test.tsx src/fields/map-location.test.ts` | PASS: 2 files, 50 tests (48 before plus 2 new; reviewer re-ran it) |
| eslint on 2 tsx files | primary reports clean. Reviewer did not re-run it because it is not in the allowed verify commands |

## Check of each MINOR finding

1. **MINOR-1 (missing regression test): fixed.**
   - The `useField` mock is now a hoisted `vi.fn` that records its args.
   - Test (a): with no client validate, the passed `validate` returns `toBeUndefined()`.
   - Test (b): when a client validate is passed, it is called with options that include `required: true`, and its return value is passed back.
   - Primary did a mutation check: changing the return back to `true` makes test (a) fail. That is real protection, not false confidence.
   - Detail: test (b) sets `fieldState.value = null` and does not reset it, but every other test calls `renderField(...)`, which sets the value first. No leak.
2. **MINOR-2 (`as never` cast too broad): fixed.**
   - The cast is now `value as Parameters<typeof validate>[0]`. TypeScript narrows `validate` to a function in the `typeof validate === "function"` branch, so `Parameters` resolves correctly.
   - typecheck is clean.
3. **MINOR-3 (disabled field has the same background as an editable one): fixed.**
   - Adds `&:disabled { background: var(--theme-elevation-100); }` inside `.tami-map-location input`.
   - The component sets `disabled={locked}`, where `locked = readOnly || disabled` (`MapLocationField.tsx:69,131,150`). So `:disabled` covers both the read-only and no-permission cases, and is more accurate than the `&.read-only input` I suggested in round 3.

## Specificity: disabled background vs error background (CSS math)

| Selector | Specificity | Property |
|---|---|---|
| `.tami-map-location input` | (0,1,1) | `background` (shorthand) |
| `.tami-map-location input:disabled` | (0,2,1) | `background` |
| `.tami-map-location.error .tami-map-location__coords input` | (0,3,1) | `background-color` |
| `html[data-theme="dark"] .tami-map-location.error .tami-map-location__coords input` | (0,4,2) | `background-color` |

- Disabled and no error: the disabled rule (0,2,1) beats the base rule, so the background is elevation-100. This matches the primary's browser check (rgb 41,37,36 in dark mode).
- Disabled and showing an error: the error rule (0,3,1)/(0,4,2) beats disabled (0,2,1), so the error background shows. These rules do not "fight": the error background wins by specificity.
  - Payload's own rule `.field-type.text:not(.has-many) input:disabled` is (0,4,1), which beats `.field-type.text.error input` (0,3,1). So for a text field that is both disabled and in error, Payload shows grey and we show the error colour. This is a small difference (see MINOR-A).
  - In practice it is almost unreachable: a locked field cannot be edited, so it cannot trigger a "reversed coordinates" or "outside Vietnam" error on save. A wrong old value could only show an error if the server validated it while the user lacks edit permission. Showing the error colour in that case is arguably more useful, because the user can see the error.
- The paste box (`__paste`) also gets the disabled background when locked (it is covered by `input:disabled`). This is consistent and has no side effects.

## Responsive Checklist Gate

The diff only adds a background colour for the disabled state. It adds no layout, size or media query. Breakpoints come from the profile.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Diff does not change width or layout |
| Mobile-first / min-width MQ | N/A | No media query |
| Grid auto-fit/minmax | N/A | No grid |
| Container not fixed px | OK | No px size added |
| Font-size rem / clamp / spacing | N/A | Not changed |
| Media | N/A | None |
| Touch target ≥ 44px | OK | Not changed (44px on mobile from `_controls.scss`, verified in round 3) |
| Nav / table mobile | N/A | None |
| 100vh / reduced-motion | N/A | None (the rule adds no transition) |
| overflow:hidden hiding errors | OK | Not used |

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip: not in the allowed verify commands |
| oxlint (anti-slop) | skip: oxlint not configured in the profile. typecheck PASS and eslint clean (reported by primary) |
| ocr | skip: ocr not installed |
| AI-readable | OK, 0 indicators. Clear names and no long functions. The new comments explain why: why validate is tested, and that the background mirrors Payload |
| ai-friendly-web | N/A: internal admin |
| blitzstrike | N/A: does not touch auth or public input |

## Findings

**[CRITICAL]:** none.

**[MAJOR]:** none.

**[MINOR-A] Disabled + error shows the error colour, unlike Payload (grey).**
- Location: `_map-location.scss:17-19`.
- If you want an exact match with Payload, raise the specificity of the disabled rule, for example `&.error &__coords input:disabled`, or move the rule after the error rule using a selector with matching specificity.
- I do not recommend the change: the case is nearly unreachable, and showing the error colour helps the user see the error. Not blocking.

**[MINOR-B] Test (b) leaves `fieldState.value = null` without resetting it.**
- Location: `MapLocationField.test.tsx` (new test).
- It is harmless today because other tests set the value through `renderField`. A `beforeEach` reset would make the tests more independent. Not blocking.

## Residual risk

- The reviewer has no browser. The disabled colour is based on CSS math plus the primary's browser report (dark, elevation-100). The disabled + error combination was not observed in a browser.
- Did not run the full `pnpm test`. Risk is low because the change only affects this component and its test file.

## Verdict

✅ **PASS**: no CRITICAL or MAJOR findings. All 3 MINOR findings from round 3 are fixed correctly. typecheck is clean and 50/50 related tests pass (re-run by the reviewer). Only 2 small optional MINORs remain.
