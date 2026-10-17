Agent: reviewer

# Review: build-tami-website, layer-5-task-04, round 3 (delta for round-2 MINORs m5–m8)

- **Review level:** STRICT
- **Reason:** the delta changes the PII delete path: hook order, bulk-delete policy, and the rollback of the CV (`private-files` + S3) together with the audit row. Data-loss and PII risk means STRICT is required. Code that passed in round 2 was only re-checked for regressions.
- **Blast radius:** `src/collections/JobApplications.ts` (`disableBulkDelete`, `afterDelete` order). Other files in the delta: `migrations/20261017_132020_job_applications_cv_nullable.ts` (comment only, SQL unchanged), `tests/integration/job-postings.test.ts` (one new test), `docs/ERD.md` §4.10. Affected flows: admin delete of `job-applications` (edit view and list view), REST `DELETE /api/job-applications?where=`, and the future L9-T06 `data-retention` job (uses the Local API).
- **Scope:** the uncommitted diff vs HEAD `9ababea`, focused on the m5–m8 delta.

## Verify commands + result (`.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint, no errors) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, no errors) |
| `pnpm test` | PASS, exit 0: 104 files, 1102 tests (+1 vs round 2), none skipped |
| `pnpm build` | PASS, exit 0 |

## Verification asks

### 1. With audit first, does a CV-delete failure also roll back the audit row?

**Yes, for single delete.**
- `afterDelete: [auditApplicationPurge, deleteApplicationCv]` is set at `JobApplications.ts:75`.
- `writeAuditLog` gets the same `req`, so its insert runs in the transaction that outer `deleteByID` opened.
- `deleteApplicationCv` throws in two cases: when the nested `private-files` delete reports `errors`, or when the S3/plugin `afterDelete` throws. That throw reaches `killTransaction`, which rolls back three things together: the `job_applications` delete, the `private_files` delete and the audit insert.
- New test `job-postings.test.ts:505-530` proves this against the real temp DB. It adds a throwing `private-files` `afterDelete` and calls single delete as admin (`overrideAccess: false`). The call rejects. Afterwards `job_applications` = 1 row, `private_files` = 1 row and the audit row count for this id is 0.
- The S3 call is now the last step, so a failure in the audit write can no longer leave a `private_files` row whose S3 object is already gone. m6 is closed.

### 2. Does `disableBulkDelete` block bulk delete via REST/Local API, not only the admin UI?

Source: `payload@3.91.0/dist/collections/operations/delete.js:24-26`:
```js
if (args.collection.config.disableBulkDelete && !args.overrideAccess) {
    throw new APIError(`Collection ${slug} has disabled bulk delete`, 403);
}
```
- **REST** `DELETE /api/job-applications?where=...` and the admin list multi-select go through this operation with `overrideAccess: false`, so both get **403**. The flag blocks more than the UI.
- **Local API** `payload.delete({ collection, where })` is **blocked only when the caller passes `overrideAccess: false`**. The Local API default is `overrideAccess: true`, and with that the guard is skipped, so bulk delete still runs. For that path the m5 behaviour is still there: errors are caught per doc and the operation still commits.
- Today no code calls bulk delete on `job-applications`. L9-T06 `data-retention` is designed to anonymise (set `anonymizedAt` and delete the CV), not to bulk-delete, so this is not a defect in this task. It is recorded as residual risk and as a note for L9-T06 (n2).
- Single delete (`deleteByID`) is not affected by the flag, which is the intended behaviour.

### 3. Other delta items

- **m7:** the migration comment now gives the correct reason (cv_id is NULL only after anonymisation). The `up`/`down` SQL is unchanged and the `.json` snapshot is untouched. Closed.
- **m8:** the new rollback test (above) covers it. Closed.
- **ERD §4.10 (line 407):** documents the hook order, rollback of application + audit when the CV delete fails, and `disableBulkDelete` with its reason. This matches the code. Closed.

## Gates

- **PII lifecycle on delete:** OK. Single delete is atomic across the DB rows and the audit row, and S3 is the last step. Bulk delete is closed for REST and the admin UI.
- **No PII in audit or logs:** OK, unchanged (id-only summary). The existing test `:478-503` still asserts this.
- **Migration safety:** OK. The delta changes only a comment and the SQL is unchanged. The migration is still uncommitted, so no applied migration was edited.
- **Docs reconcile:** OK (ERD §4.10).
- **Responsive Checklist Gate:** N/A. The delta has no UI route, component or CSS.
- **aislop:** skip, aislop not installed.
- **oxlint (anti-slop):** skip, oxlint not configured. `pnpm lint` (eslint) PASS.
- **ocr:** skip, ocr not installed.
- **AI-readable:** OK. 0 new indicators. Comments explain why. The hook-file docstring (line 8: "lỗi thì rollback cả hai") is still accurate because bulk delete is now disabled.
- **ai-friendly-web:** N/A, not a public route.
- **blitzstrike:** skip. This task adds no endpoint and there is no allowed environment.
- **Surgical diff:** OK. Every changed line traces to m5–m8.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]

**n1. No test asserts the bulk-delete 403.**
- Where: `tests/integration/job-postings.test.ts` (no test for this).
- The round-2 m5(a) fix suggested this test. The behaviour is guaranteed by Payload core (`delete.js:24`), so the gap is a regression guard only, not a correctness risk.
- Fix (optional): add `payload.delete({ collection: "job-applications", where: { id: { equals: x } }, user: asUser(admin), overrideAccess: false })`, expect status 403, and assert the row remains.

**n2. The Local API bulk delete with `overrideAccess: true` (the default) skips `disableBulkDelete`.**
- Where: Payload `delete.js:24`. This affects future code, such as L9-T06.
- Problem: a server-side job calling `payload.delete({ collection: "job-applications", where })` would bypass the flag. It would then hit the m5 behaviour: per-doc errors are swallowed, the operation commits, and the audit row may be skipped.
- Fix: carry a note into L9-T06. Delete by `id` in a loop, or anonymise only, as designed. Do not use `where`-bulk delete on this collection. Optionally add one sentence to ERD §4.10 or the collection comment.

## Verdict

**PASS.** Round-2 PASS still holds:
- m5 is closed through `disableBulkDelete`, which returns 403 for REST and the admin UI.
- m6 is closed by the hook order: audit first, S3 last.
- m7 (comment) and m8 (rollback test, proven on the real DB) are closed.

No CRITICAL or MAJOR findings. Lint, typecheck, test (1102/1102) and build all pass. This is not a bug task, so repro closure does not apply.

## Residual risk

- The real `@payloadcms/storage-s3` `afterDelete` is still simulated by a spy/throwing hook, because the test environment has no S3. The S3 object deletion cannot be undone: if a later DB failure occurred after the S3 call succeeded, the object would be gone. With S3 as the last hook, only a COMMIT failure remains in that window.
- Local API bulk delete with `overrideAccess: true` is not blocked (n2).
- `pnpm payload migrate` was not run because it is not on the reviewer allow-list. Builder evidence says it applied on dev, and the SQL is unchanged since round 2.
- aislop, ocr and oxlint are not installed or configured.
