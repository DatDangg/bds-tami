Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-1-task-01 · round 1

Task: `tasks/feature-admin-ux-audit-2/phase-1-task-01.md` (BL-051 GĐ1: A1 hideAPIURL, A2 allowCreate:false for provinces/wards/staff relations, A3 upload button text "Tải lên").
Spec: `SPECIFICATIONS.md` F10, the "(BL-051" paragraph, items A1–A3.

## Review level
**NORMAL**

## Reason
The change touches shared config: `withAdminUxDefaults` now runs on every collection and global, and a new admin-wide provider was added. This is admin-only config plus display text. It does not change schema, migrations, access, API or DTOs (`src/payload-types.ts` and migrations are unchanged per `git diff --stat`), and it does not touch auth, tenant isolation or data, so no STRICT trigger applies. Builder reported tests PASS, and I re-ran them myself.

## Blast radius
- Every admin edit screen for all 21 collections and 4 globals: the API button/tab is hidden. `redirects` (created by the plugin) is hidden via `overrides.admin`.
- Every relationship field pointing to `provinces`/`wards`/`staff` (Projects, Rentals, PropertyPosts, JobPostings, Wards→Province, createdBy/sale, Media uploader…): the "+" button and the inline "Add new" option are gone.
- Every upload field in admin: the `.upload__createNewToggler` button now reads "Tải lên".
- `payload.config.ts`: `globals` now comes from `ADMIN_GLOBALS`. The spread keeps hooks/access/versions, so global revalidate behaves as before.
- BL-050: `afterNavLinks`/`actions` are unchanged. The providers list only gains one new entry and keeps its existing order.

## Verify commands + result
| Command (from `.context/project-config.md`) | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm test` | PASS: 347 files / 3549 tests (includes `master-data-relations.test.ts` and `UploadButtonLabel.test.tsx`) |
| `git diff --stat HEAD -- src/payload-types.ts migrations` | empty, so schema/types are unchanged |

I did not run the app or check it in a browser myself (reviewer permissions). The browser evidence comes from Builder's report in the task file.

## Responsive Checklist Gate
The diff touches the admin UI only by changing the upload button's text. It adds no CSS, layout, route or media changes.
- Layout (horizontal scroll, grid, container): **N/A**. No CSS/layout change. "Tải lên" is about as long as "Tạo mới" (7 characters each), so the pill button width stays essentially the same.
- Typography/Spacing: **N/A**. No font/spacing change.
- Media: **N/A**.
- Touch/Interaction: **OK**. The button element, its size and its click handler are unchanged. Only the text and `aria-label` change.
- Viewport/A11y: **OK**. The accessible name changes together with the visible text (`aria-label` = "Tải lên"). No `100vh`, no new motion, no `overflow:hidden`.
- Residual: I could not check 375/768/1280 in a browser. The CSS math does not apply because no CSS changed.

## Skill gates
- aislop: **skip**, `aislop` is not installed (`command -v` returned nothing).
- oxlint (anti-slop): **skip**, oxlint is not configured (no `.oxlintrc.json`/`oxlint.json`). ESLint `pnpm lint` reports 0 errors.
- ocr (open-code-review): **skip**, `ocr` is not installed.
- AI-readable: **OK**. Names are clear (`disableInlineCreateForMasterData`, `withAdminUxDefaults`, `MASTER_DATA_SLUGS`). Functions are under 50 lines and files are small. Indirection is at most 2 steps. No magic numbers. Comments explain WHY (the BL-051 reason and the narrow exception to BL-040). 0 indicators.
- ai-friendly-web: **N/A**, internal admin task.
- blitzstrike: **N/A**, not a STRICT task.

## Requirement check
- **A1**: `withAdminUxDefaults` sets `admin.hideAPIURL: true` while keeping the existing `admin` (spread). It is applied in `ADMIN_COLLECTIONS` (outermost wrapper, after `hideTechnicalListFields`/`withListSearchableFields`) and in `ADMIN_GLOBALS`. `redirects` gets it via `overrides`. The test scans every collection and global plus `redirects`. OK.
- **A2**: Recursive walk (`src/lib/admin/master-data-relations.ts:13-24`):
  - `tabs`: maps `tab.fields` for both named and unnamed tabs, and keeps `name`/`localized` of the tab.
  - `blocks`: maps `block.fields`. The repo has no `blockReferences` (grep is empty), so `field.blocks` always exists.
  - `row`/`collapsible`/`group`/`array`: handled by the `"fields" in field` branch.
  - `relationTo` arrays: the field is disabled only when every slug belongs to the set. Empty arrays are guarded.
  - Only `admin.allowCreate` changes. `filterOptions`, `validate`, `access` and stored values are untouched.
  - `allowCreate` is a real option: `payload/dist/fields/config/types.d.ts:935`, and `ui/dist/fields/Relationship/Input.js:764` uses `!readOnly && allowCreate && AddNewRelation`.
  - Tests check real config (`> 5` fields, so the test is not empty), confirm other relations stay `undefined`, and include a synthetic nested tabs/row/array/blocks/mixed case. These tests are meaningful.
- **A3**: Payload 3.91 hard-codes `t('general:createNew')` in `Upload/Input.js:571`, so option (b) was chosen correctly. `general:createNew` is not overridden globally, so the list's "Tạo mới" button is unaffected. The selector is limited to `.upload__createNewToggler`. Writes are idempotent (only when the value differs), so the observer does not loop forever. `disconnect` runs on unmount. The string lives in `payload-vi-overrides.ts` and has a test.
- Globals: no circular import (globals do not import `admin-collections`). The spread keeps `hooks.afterChange` (revalidate), `access` and `versions`.

## Findings
- **[MINOR]** `src/components/admin/UploadButtonLabel.tsx:12`: `button.textContent = …` replaces React's whole child subtree (`span.btn__content > span.btn__label`, from `@payloadcms/ui/dist/elements/Button/index.js:36-41`) with a bare text node.
  - Effects: the `.btn__content`/`.btn__label` styling is lost, and React keeps holding detached nodes. With the current structure (no tooltip/icon toggling) I found no crash path, and Builder confirmed it renders correctly in the browser.
  - Suggested fix (can be a follow-up): write into `button.querySelector(".btn__label") ?? button` instead of the whole button, and keep `aria-label` on the button.
- **[MINOR]** `src/components/admin/UploadButtonLabel.tsx:25`: `characterData: true` is not needed, because the replaced text node is no longer managed by React. It also makes the callback run on every keystroke in Lexical/inputs across the admin. The cost is low (one `querySelectorAll` by class), but it can be removed.
- **[MINOR]** `src/components/admin/UploadButtonLabel.test.tsx`: there is no test for `disconnect` on unmount, or for idempotence (the observer does not write again once the text is already correct). The first test also leaves `document.body` dirty for the second one (it is reset manually, which is acceptable). Suggestion: add an unmount test that inserts a button after unmounting and expects it to stay "Tạo mới".
- **[MINOR] / residual**: the provider changes the DOM in `useEffect`. If part of the admin tree hydrates later (Suspense), a hydration-mismatch warning could appear, and React would client-render that boundary again before the observer relabels it. This is low risk, and the task already notes that a Payload upgrade means re-checking the `.upload__createNewToggler` class.

No CRITICAL or MAJOR findings.

## Residual risk
- I did not check the browser or responsive layout myself; I relied on Builder's evidence.
- The A3 test locks the provider's behaviour but not Payload's class name.
- Plugins that add fields after `withAdminUxDefaults` runs are not walked. None of the current plugins add relations to provinces/wards/staff.

## Verdict
✅ **PASS**
