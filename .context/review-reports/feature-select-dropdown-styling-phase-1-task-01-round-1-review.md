Agent: reviewer

# Review: feature-select-dropdown-styling · phase-1-task-01 · round 1

> Ghi bởi primary: guard hook chặn reviewer `Write` vào `.context/review-reports/**` trong worktree (path resolve theo repo chính). Nội dung nguyên văn từ report reviewer.

- Task: `tasks/feature-select-dropdown-styling/phase-1-task-01.md` (change doc `spec/changes/2026-10-19-select-dropdown-styling.md`, BL-016)
- Diff: working tree (`git diff` + untracked `src/components/ui/option-select.tsx`, `src/components/careers/JobFilters.test.tsx`). `src/payload-types.ts` ignored (line endings only).

## Review level
**STRICT**

## Reason
The diff changes shared UI building blocks: `src/components/ui/select.tsx`, the new `src/components/ui/option-select.tsx`, and `FormField`. It also changes filter behaviour on 3 public list pages, including the no-JS fallback and the URL contract. Both count as risk-red ("shared component").

## Blast radius
- `ui/select.tsx` (trigger/content classes, `collisionPadding`) affects every future Select user.
- `ui/option-select.tsx` (new) is used by ProjectFilters, JobFilters, rentals FilterFields/SortSelect, FloorPlans and FormField.
- Affected pages: /du-an (+ category), /tuyen-dung, /cho-thue (+ category and the mobile Sheet), and project detail (FloorPlans on small screens with 6 or more plans).
- `FormField` `as:"select"`: its prop type is narrowed. Only tests use it today.
- No API, schema, query-param, i18n or migration change. No forbidden file touched.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run --project ui --project unit` | PASS: 202 files, 1970 tests |
| integration project | not run (primary runs it separately) |
| `pnpm build` | not run (as instructed) |

## Focus checks
| Check | Result | Evidence |
|---|---|---|
| Sentinel never reaches URL/state/FormData | OK | `option-select.tsx:16-17,64-67,98`. Radix Root gets no `name`, so Radix's hidden `<select>` (radix-select 2.4.1 `index.mjs:165`) is not submitted. Tests cover RentalFilters, ProjectFilters/JobFilters and the server-rendered HTML. |
| No-JS filtering on ProjectFilters/JobFilters | OK | The server-rendered HTML has `<select id name>` with the right option `selected` (tests). Both components are still Server Components. |
| No auto-submit on change | OK | Submit spy is not called (test). The "Lọc" button is still `type=submit`. |
| Hydration mismatch / duplicate `name` | OK | `useSyncExternalStore` uses the server value (false) during hydration, so it matches the server HTML, then switches to Radix. The native select and the hidden input are never rendered together (`option-select.tsx:69-100`). |
| Rentals: apply immediately, province change resets ward, ward disabled | OK | `FilterFields.tsx` keeps `onChange({province, ward:""}, "now")` and `disabled={wardDisabled}`. Tests pass. |
| FormField id/aria-*/submit | OK except placeholder (MAJOR-1) | The trigger keeps id and the aria attributes, and the hidden input submits the value. `required` was never forwarded as an attribute before either, so no regression. |
| Label ↔ trigger | OK | `htmlFor` matches the trigger `id`. Labels no longer wrap the button. |
| Touch targets | OK | Trigger is `h-12` (48px), items are `min-h-11` (44px). |
| Mobile list scroll | OK (CSS) | The list has `max-h-(--radix-select-content-available-height) overflow-y-auto` and `collisionPadding={8}`. |

## Responsive Checklist Gate (no browser; checked from the CSS)
- No horizontal scroll: OK. Trigger and fallback use `w-full min-w-0`; text truncates and the icon doesn't shrink.
- Mobile-first / grid: OK, parent grids unchanged.
- Container not fixed px: OK. Only `lg:w-56`/`lg:w-48`, which were already there.
- Typography uses rem/tokens: OK (`text-body` / `text-small`).
- Media: N/A. Touch target ≥ 44px: OK. Nav hamburger: N/A. Table wrapper: N/A. 100vh: N/A.
- prefers-reduced-motion: N/A. The fade animation was already in `select.tsx` before this change; out of scope.
- No `overflow:hidden` masking: OK.

## Skill gates
- aislop: skip, not installed. oxlint: skip, not configured (ESLint passes). ocr: skip, not installed.
- AI-readable: OK. 1 indicator: the comment on `placeholder` describes behaviour the code can't produce (under the 3-indicator limit).
- ai-friendly-web: N/A. blitzstrike: N/A.

## Findings

### [MAJOR-1] `placeholder` can never show (shared `OptionSelect` + `FormField`)
- `src/components/ui/option-select.tsx:27,86-88`: `toRadix("")` always passes `"__tami_empty__"` to Radix. Radix only shows the placeholder, and sets `data-placeholder`, when the value is `""` or `undefined` (radix-select 2.4.1 `index.mjs:1206-1208`, used at `:218`, `:266`, `:986`).
- Result: when the value is `""` and no option has `value:""`, the trigger is **empty**. The `data-[placeholder]:text-muted-foreground` style in `select.tsx:21` can never apply.
- `FormField` exposes this prop (`FormField.tsx:23-26,69`), so the first real form using it would get a blank required field.
- Fails the acceptance item "disabled/placeholder/aria-invalid rõ".
- **Fix:** `const hasEmptyOption = options.some((o) => o.value === ""); const radixValue = current === "" && !hasEmptyOption ? "" : toRadix(current);` + test (placeholder text shows with `data-placeholder`, FormData gives `""`). Or remove `placeholder` from both APIs and record in the decision log.

### [MINOR-1] A value that matches no option leaves the trigger blank and still submits that value
- `option-select.tsx:86,98`. A native select used to fall back to its first option. Rentals `ward` from the URL is the case that can hit this; ProjectFilters is safe because it only passes a resolved slug (`ProjectListPage.tsx:107`). Suggest falling back to `""` (or the placeholder).

### [MINOR-2] A choice made before hydration may be lost (progressive mode)
- `option-select.tsx:59,72`. The native select is controlled (`value=`) and the state starts from `defaultValue`, so a pick made before hydration can be reset. Optional: use `defaultValue` in the native branch, or read the current DOM value when hydrating.

### [MINOR-3] The dropdown list has no maximum width
- `select.tsx:48`. Suggest `max-w-(--radix-select-content-available-width)` so a very long label can't run past a 375px screen.

### [MINOR-4] No hydration test
- Nothing runs `hydrateRoot` with `onRecoverableError` to prove there is no hydration mismatch.

## Residual risk
- No real browser was used. Not verified: keyboard typeahead and Esc, scrolling at 375px, Select inside the rentals mobile Sheet (z-index and focus trap), and dark-mode contrast.
- Reviewer did not run the integration test project (primary: 55/56 files PASS; jobs-email `beforeAll` timeout under parallel load, PASS 5/5 when run alone).

## Verdict
**FAIL**: 1 MAJOR (MAJOR-1). Fixing MAJOR-1 and adding a test should be enough for round 2. The MINOR items are optional.
