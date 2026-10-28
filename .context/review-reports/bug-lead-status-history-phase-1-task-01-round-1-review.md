Agent: reviewer

# Review — bug-lead-status-history · phase-1-task-01 · round 1

- Review level: **STRICT**
- Reason: the change shows lead PII and activity history in admin. Sale should only see activity on leads assigned to them (PERMISSION §3.3). The task file also marks it STRICT.
- Blast radius: `src/collections/Leads.ts` (the `activities` join field, admin config only). Only the "Lịch sử chăm sóc" tab in the Lead form is affected, for admin and sale. Nothing changes in schema, DB, access, API or `payload-types.ts`, because a join's `admin.defaultColumns` does not go into generated types. The list view of `lead-activities` is not affected. It is hidden and still uses its own `defaultColumns`.
- Scope: `git diff src/collections/Leads.ts` and the new file `tests/unit/lead-activities-join-columns.test.ts`. Other dirty files are not part of this task and were not reviewed.

## Root cause check
- The repro in the task file holds. `recordStatusChange` writes `fromStatus`/`toStatus`. The join had no `admin.defaultColumns`, so it fell back to `LeadActivities.admin.defaultColumns = ["lead","type","content","actor","createdAt"]` (`src/collections/LeadActivities.ts:85`), which has no from/to columns. The cause is in display, not data. The fix targets that cause, not just the symptom.
- Vietnamese labels: `fromStatus`/`toStatus` are selects with `options` built from `STATUS_LABELS` (`LeadActivities.ts:59-68`). The column headers are "Trạng thái trước" and "Trạng thái sau". The e2e run shows "Đã liên hệ" in the history row.

## Access / PII
- Access is unchanged. `fromStatus`/`toStatus`/`actor` keep `access: systemOnly` (only create/update are blocked; read follows the collection), and `readOwnLeadActivities` is untouched.
- The table loads its data with `overrideAccess: false, user: req.user` (`@payloadcms/ui` `buildTableState.js:129-140`), and columns are filtered by `permissions.collections[slug].fields` (`:161`). A sale still only sees activity on their own leads.
- Nothing new leaks to sale. `fromStatus`/`toStatus` are status values of a lead the sale is already assigned to, and could already be read through the activity drawer or API. `actor` was already in the old columns. `fromAssignee`/`toAssignee` were not added, so no other sale's details become visible.

## Column preference / URL query
- `RelationshipTable/index.js:110` sends `columns: transformColumnsToPreferences(query?.columns) || defaultColumns`. `query` is local React state that holds column toggles from the current session. It is not read from the URL.
- `buildTableState.js:74-83` takes `columnsFromArgs` and **upserts** it into the preference (key `leads-activities`). A saved preference from before therefore cannot hide the new `defaultColumns`. The columns come from the arguments and overwrite the old value. There is no residual risk here and nothing in the DB needs cleanup.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` (whole repo) | PASS, exit 0 |
| `pnpm typecheck` | PASS, no errors |
| `pnpm test` | PASS: 456 files / 4808 tests |
| `E2E_BASE_URL=http://localhost:3100 npx playwright test --project=admin-content tests/e2e/admin/inbox.spec.ts -g "lead gửi từ form" --reporter=list` | PASS: 3/3, including test "20 lead gửi từ form Liên hệ…" (15.1s) |
| `generate:types` | Not run, because it writes to source. By reasoning: a join's `admin.defaultColumns` is UI config that Payload does not include in the TS types, so there is no diff in `payload-types.ts`. |

## Responsive Checklist Gate
N/A. This is a Payload admin column config. It adds no route, component or CSS, and the table is the built-in Payload table.

## Skill gates
- aislop: skip. The `aislop` CLI is not among the reviewer's allowed verify commands. The diff is 12 lines of config plus a 24-line test, with no slop pattern.
- oxlint (anti-slop): skip, oxlint not configured. ESLint passes on the whole repo.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. 0 indicators. The constant has a clear name, the comment explains WHY (BL-078), and functions are under 50 lines.
- ai-friendly-web: N/A, internal admin.
- blitzstrike: N/A. The access and API surface did not change.

## Findings
- **[MINOR]** `tests/e2e/admin/inbox.spec.ts:135` checks only `toContainText(/Đã liên hệ/)`, which is the after-status. It does not check the before-status "Mới". If the `fromStatus` column were missing, this assertion would still pass, and the unit test would be the only guard. Suggestion: also assert `/Mới/` on the same row. This file is outside the builder's allowed scope, so change-request should decide.
- **[MINOR]** `tests/unit/lead-activities-join-columns.test.ts:21` checks the column names but not that they exist in `LeadActivities.fields`. A typo such as `fromStatuss` would pass the test, and Payload would silently drop the column. Suggestion: add an assertion that every column is a field name in `LeadActivities` (or `id`/`createdAt`).
- **[MINOR]** `src/collections/Leads.ts:215` keeps the column list as an untyped `string[]`. Optional: use `satisfies readonly (keyof LeadActivity)[]` so typecheck catches typos. This is the same fix as the previous finding, applied at compile time.

No CRITICAL or MAJOR findings.

## Verdict
✅ **PASS** (3 MINOR, none blocking)
