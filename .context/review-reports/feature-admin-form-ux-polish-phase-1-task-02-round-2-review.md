Agent: reviewer

> Saved by dispatcher (change-request): reviewer's Write was blocked by guard.mjs (worktree path). Content from reviewer hand-back.

# Review: feature-admin-form-ux-polish · phase-1-task-02 · round 2 (BL-058)

- **Task:** `tasks/feature-admin-form-ux-polish/phase-1-task-02.md` (decision log + verification attempt 2)
- **Previous round:** `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-02-round-1-review.md` (FAIL: MAJOR-1, MINOR-1..4)
- **Code:** worktree `.worktrees/feature-admin-form-ux-polish__phase-1-task-02`, uncommitted; `src/payload-types.ts` EOL-only, ignored.
- **Diff:** changed `importMap.js` (+2), `custom.scss` (+1 `@use`), `payload.config.ts` (provider); new `FormErrorFocus.tsx`, `form-error-focus.ts`, `styles/_field-errors.scss`, `FormErrorFocus.test.tsx`, `field-errors-style.test.ts`.

## Review level: STRICT
**Reason:** client provider + shared CSS for every admin form (collections/globals, DocumentDrawer, EditMany, BulkUpload); changes save-error feedback (risk of silent failure — MAJOR-1).

## Blast radius
All edit/create screens + DocumentDrawer/EditMany/BulkUpload; every `FieldErrorsToast` (hiding now depends on `data-field-errors-unmatched`); layout of `.field-error`; one MutationObserver on `document.body`. No schema/API/access/server validation/migration change.

## Verify commands + result (reviewer, in worktree)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (0 error; 2 old warnings outside task) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project unit --project ui --maxWorkers=2` | PASS 336 files / 3195 tests |
| `pnpm build` | PASS |
| integration / dev server | not run (instruction) |

## Forbidden scope: OK
`_forms.scss`, `RetranslateButton.tsx`, schema, server validation, `spec/**`, `progress.json`, migrations untouched; `followingFieldsInvalid_*` unchanged.

## Round 1 findings
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1 silent failed save | **CLOSED** | `form-error-focus.ts:84-100` returns boolean; `FormErrorFocus.tsx:24-26` calls `markUnmatchedToasts` only when `!found && current === run`; CSS `_field-errors.scss:59` `:not([data-field-errors-unmatched]):has(marker)`; tests `FormErrorFocus.test.tsx:174-185` both branches |
| MINOR-1 drawer root | CLOSED | `resolveFocusRoot()` `form-error-focus.ts:43-46`; Payload renders `.drawer` only when open (`Drawer/index.js:76,93`); test `:87-96` |
| MINOR-2 nested tabs | CLOSED | `firstTabToOpen` `:34-40`; test `:50-57` |
| MINOR-3 | accepted as residual | — |
| MINOR-4 | CLOSED | `_field-errors.scss:28` `margin-top: 0.3rem` |

### MAJOR-1 edge cases (code reading)
- Field error rendering later than 0.7s: not possible — `forms/Form/index.js:407-414` dispatches `ADD_SERVER_ERRORS` before `errorToast`; unopened tab has `--has-error`, `idleWaits` only counts when no error tab (`:96`), up to 12 steps (~1.5s).
- Tab `--has-error` but `.field-error` never renders (draft save `setSubmitted(false)`, `Form/index.js:375-379`; `FieldError/index.js:41`): loop ends at `MAX_STEPS`, returns false, toast flagged and shown ~1.5s late — user still gets feedback.
- Toast expired before flag: harmless.
- Multiple toasts / second save: newest run wins (side effects MINOR-A/B).
- Sonner reusing the "submitting" toast: `ul[data-testid]` added to subtree, still detected; flag persists.

## Screenshots
| File | Shows |
|---|---|
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-before-1440-light.jpg` | combined "(4)" toast + small red tooltips |
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-after-1440-light.jpg` | error text under fields, tab counts, no toast |
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-after-1440-dark.jpg` | readable in dark |
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-after-390-light.jpg` | correct tab, error under field, no horizontal overflow |
No screenshot of the unmatched-flag case (builder described it).

## Responsive Checklist Gate: no FAIL
Layout OK (390 scrollWidth = 390); rem typography/spacing; no vh, no smooth scroll; overrides Payload narrow-screen `display:none` for tooltip; 768px residual (no breakpoint rules).

## Skill gates
aislop skip · oxlint skip (eslint PASS) · ocr skip · AI-readable OK · ai-friendly-web N/A · blitzstrike N/A.

## Findings
- [MINOR-A] `form-error-focus.ts:76-78` (called `FormErrorFocus.tsx:25`) flags every marker toast in the document, not only this save's toast → an earlier hidden field-error toast may reappear. Suggest: pass the mutated toast into the run and flag only it.
- [MINOR-B] `FormErrorFocus.tsx:23-26` — toast A (no field) then toast B (field errors) within ~0.6s: A's run cancelled before flagging, A stays hidden. Rare. Same fix.
- [MINOR-C] `_field-errors.scss:59-61` — sonner 1.7.4 measures toast height while `display:none` → stacking/hover expand may be off after unhide. Not browser-verified. Suggest `visibility:hidden` + `pointer-events:none`.
- [MINOR-D] Missing tests: `--has-error` tab without `.field-error` → false after `MAX_STEPS` + flag; superseded run must not flag.

## Residual risk
Depends on Payload 3.91 `data-testid` markers + tab/collapsible classes; MAJOR-1 verified by code + unit test + simulated 400 (real Staff EditMany not run by hand); MINOR-C not browser-checked; no 768px screenshot; Dự án / Cho thuê / Tin tức not run by hand.

## Verdict: PASS
No CRITICAL/MAJOR; MAJOR-1, MINOR-1/2/4 closed; no regression; lint/typecheck/unit+ui/build PASS. MINOR-A..D optional.
