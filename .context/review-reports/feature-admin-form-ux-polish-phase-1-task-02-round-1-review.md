Agent: reviewer

> Saved by dispatcher (change-request): reviewer's Write was blocked by guard.mjs (path resolved against main repo root, worktree path). Content verbatim from reviewer hand-back.

# Review: feature-admin-form-ux-polish · phase-1-task-02 · round 1 (BL-058)

- **Task:** `tasks/feature-admin-form-ux-polish/phase-1-task-02.md`
- **Code:** worktree `.worktrees/feature-admin-form-ux-polish__phase-1-task-02`, uncommitted. `src/payload-types.ts` EOL-only → ignored.
- **Diff:** changed `importMap.js` (+2), `custom.scss` (+1 `@use`), `payload.config.ts` (provider); new `FormErrorFocus.tsx`, `form-error-focus.ts`, `styles/_field-errors.scss`, `FormErrorFocus.test.tsx`, `field-errors-style.test.ts`.

## Review level: STRICT
**Reason:** client provider + shared CSS applying to every admin form (all collections/globals, DocumentDrawer, EditMany, BulkUpload); changes how save errors are shown → risk of no feedback on failed save.

## Blast radius
- Every edit/create screen, DocumentDrawer, EditMany, BulkUpload.
- Every `FieldErrorsToast` hidden by CSS (raised from `forms/Form/index.js:399-403`, `BulkUpload/FormsManager/index.js:421-425`).
- Layout of every `.field-error`; a MutationObserver on every admin screen.
- No schema/API/access/server validation/migration change.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (0 errors; 2 old warnings outside task) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project unit --project ui --maxWorkers=2` | PASS 336 files / 3190 tests |
| `pnpm build` | Skipped (shared Postgres in crash-recovery); builder reported PASS, not re-checked |
| integration / dev server | Skipped as instructed |

## Forbidden scope: OK
`_forms.scss`, `RetranslateButton.tsx`, schema, server validation, `spec/**`, `progress.json`, migrations untouched. `followingFieldsInvalid_*` unchanged.

## Screenshots
| File | Shows |
|---|---|
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-before-1440-light.jpg` | combined "(4)" toast + small red tooltip per field — matches root cause |
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-after-1440-light.jpg` | error text under fields, tab badges "Nội dung 2" / "Thông tin tin đăng 1", "Nâng cao" open with badge, no toast |
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-after-1440-dark.jpg` | error text readable in dark |
| `.context/review-reports/feature-admin-form-ux-polish/screens/t02-after-390-light.jpg` | correct tab opens, error under field, no horizontal scroll |
~800px JPGs, accepted as supporting evidence only.

## Responsive Checklist Gate: no FAIL
No horizontal scroll OK (`max-width:100%`, `white-space:normal`, `position:static`; scrollWidth 390) · media queries/grid N/A · rem font OK (`0.9375rem`) · spacing nit (`margin-top: 4px`, MINOR-4) · no vh, no smooth scroll · overrides Payload `mid-break {display:none}` so errors show on narrow screens · 768px residual (no screenshot; no breakpoint rules).

## Skill gates
aislop skipped · oxlint skipped (eslint PASS) · ocr skipped · AI-readable OK (0 indicators) · ai-friendly-web N/A · blitzstrike N/A.

## Findings

### [MAJOR-1] Toast hidden by marker → a failed save can be completely silent
`src/components/admin/styles/_field-errors.scss:58-60`
- `FieldErrorsToast` (`@payloadcms/ui/dist/elements/Toasts/fieldErrors.js:27-47,63-70`) adds `data-testid="field-error(s)"` whenever the message contains ":" → every `ValidationError` gets the marker even when its path matches no field on screen; path-less `APIError` with ":" too. `forms/Form/index.js:387-403` sends every `err.message` through this toast.
- Real case (code reading, not browser-reproduced): `src/hooks/staff/last-admin-guard.ts:108-111` (`rejectBulkChangeOfActiveAdmins`, `beforeOperation` at `src/collections/Staff.ts:129`) throws `ValidationError` with `path: "where"`; EditMany saves via `submit()` (`elements/EditMany/DrawerContent.js:44,89,137`). Bulk-edit Staff with an active admin selected → 400, no field error shown, toast "Trường sau chưa hợp lệ: where" hidden → no feedback. Breaks acceptance "lỗi không gắn ô vẫn có toast". Same for field errors on hidden/unrendered fields.
- Checked fine: current path-less APIErrors have no ":" (`slug.ts:57`, `sync-privacy-version.ts:5-6`, `validate-file.ts`, guard-delete hooks); network/500/`json.message` toasts unaffected.
- Fix: hide only when a field error is actually visible — e.g. when `focusFirstFieldError` ends without any `.field-error` (plan `wait`), set `data-field-errors-unmatched` on the `[data-sonner-toast]`, CSS `…:has(…):not([data-field-errors-unmatched])`; unit test for marker-but-no-field-error; update decision log/residual.

### [MINOR-1] `root = document` — `FormErrorFocus.tsx:24`, `form-error-focus.ts:67-69`
In DocumentDrawer/BulkUpload the background form may carry old errors; a failed drawer save may click a tab / focus a field in the background form. Suggest: topmost open drawer as root.

### [MINOR-2] Only the first `--has-error` tab checked — `form-error-focus.ts:68-72`
Nested tabs: child tab never opened (none today). Suggest: first `--has-error` tab that is not active.

### [MINOR-3] Hidden toasts still count in Sonner stacking until expiry; MutationObserver on whole body subtree. Small; residual.

### [MINOR-4] `_field-errors.scss:28` `margin-top: 4px` → rem/token.

## Checked OK
Observer disconnects on unmount; runs only on toast appearance (no effect on typing/successful save); opens tab + nested collapsibles outside-in, focuses first error in visible order; CSS scoped to `.field-error` (`FieldError` renders only with error); AA light ~7.6:1 (#9f1239), dark >9:1 (#fda4af); tests 12 + 3 (missing: marker present but no field error).

## Residual risk
Depends on Payload 3.91 `data-testid` markers + tab/collapsible class names; `pnpm build` not re-run independently; no 768px screenshot; Dự án/Cho thuê/Tin tức scenarios not run by hand; MAJOR-1 from code reading.

## Verdict: FAIL
Cause: MAJOR-1. Fix MAJOR-1 + test, then round 2.
