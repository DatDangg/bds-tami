Agent: reviewer

# Review: build-tami-website, layer-5-task-04, round 2 (`job-postings` + `job-applications`, PII)

- **Review level:** STRICT
- **Reason:** a new migration (`cv_id DROP NOT NULL`) was added since round 1. The task also touches PII deletion: a cascade delete of `private-files` plus an S3 object, inside a transaction. The audit trail is involved too. Any of these requires STRICT. Code already passed in round 1 was only re-checked for regressions.
- **Blast radius:** `src/hooks/job-applications/delete-cv-and-audit.ts` (new), `src/collections/JobApplications.ts` (hooks, `cv` validate), `migrations/20261017_132020_job_applications_cv_nullable.{ts,json}` + `migrations/index.ts`, `private-files` (cascade delete; S3 plugin `afterDelete`), `audit-logs` (new `content.purge` rows for `job-applications`), `docs/ERD.md` §4.10/§5, `docs/PERMISSION.md` §3.3. Downstream: L6-T09 (apply endpoint), L6-T10 (CV download), L9-T06 (data-retention).
- **Scope:** uncommitted diff vs HEAD `9ababea` (`.claude/launch.json` ignored). Focus on the M1/m1/m2/m4 fixes and the new migration.

## Verify commands + result (`.context/project-config.md`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 104 files, 1101 tests (exit 0) |
| `pnpm test tests/integration/job-postings.test.ts` | PASS: 25/25 against a real temp DB (not skipped; "Pulling schema from database") |
| `pnpm build` | PASS (exit 0) |
| `pnpm payload migrate` | not run: it is not on the reviewer allow-list. Builder evidence says 16/16 applied on dev with `cv_id` nullable. Second migration checked by reading it and diffing its snapshot (below) |

I started no long-running processes, so there was nothing to stop.

## Round-1 findings: closure

| Finding | Status | Evidence |
|---|---|---|
| **M1** CV left behind after hard delete | **Closed** for the single-delete path | `delete-cv-and-audit.ts:11-24` is registered at `JobApplications.ts:73`. Test `job-postings.test.ts:478-503` deletes an application as admin (`overrideAccess: false`). It checks that the `job_applications` and `private_files` rows are both gone and that the `private-files` `afterDelete` chain ran (spy, which stands in for the S3 plugin). Test `:505-515` checks that an application whose `cv` was already nulled can still be deleted. Edge cases for the bulk path: see m5/m6 |
| **m1** `cv` required vs FK `SET NULL` | **Closed** | `JobApplications.ts:33-35` adds a conditional validate. The new migration drops `NOT NULL`. Test `:510-512`: clearing `cv` without `anonymizedAt` gives 400, and with `anonymizedAt` it is OK |
| **m2** admin cannot change `jobPosting`/`cv`/`consentAt`/`anonymizedAt` | **Closed** | Test `:419-445` sends all four fields and checks the stored values are unchanged |
| **m3** guest POST checked through Local API | Accepted in round 1 | No change |
| **m4** audit on PII delete | **Closed** | `auditApplicationPurge` writes `content.purge` with an id-only summary, using `writeAuditLog` (fail-closed, same `req`). Test `:494-502` asserts one log row and no name or email in the serialized row |

## Verification asks

### 1. Transaction semantics (Payload 3.91.0, read from `node_modules/payload/dist/collections/operations/*`)

- **Outer `deleteByID`** (admin edit view, `DELETE /api/job-applications/:id`):
  1. `initTransaction(req)` opens the transaction.
  2. `deleteOne` runs.
  3. The `afterDelete` hooks run in array order.
  4. On any throw, `killTransaction` runs.
  - The nested `payload.delete({ collection: 'private-files', where, req })` reuses `req.transactionID`, so `initTransaction` returns false and the nested call neither commits nor kills. Its per-doc errors are caught into `result.errors`. The hook turns those into a throw, and the outer catch then rolls back both rows. **The builder's claim holds for this path.**
- **Outer bulk `delete`** (admin list multi-select, `DELETE /api/job-applications?where=...`): `delete.js:222-230` **catches per-doc errors into `errors[]` and does not rethrow**. `delete.js:269-271` then commits the whole operation. So a throw from `deleteApplicationCv` does **not** roll back the application row in this path, unless the underlying error left the Postgres transaction aborted, in which case COMMIT becomes ROLLBACK. See m5.
- `where: { id }` instead of `id` is fine. It returns `{docs, errors}` and does not throw NotFound for a CV that is already gone.

### 2. Hook order and failure behaviour

The order is `[deleteApplicationCv, auditApplicationPurge]`, so the CV is deleted before the audit row is written. The S3 plugin deletes the object in the `private-files` `afterDelete` hook, which runs **before** the audit write. If `writeAuditLog` then fails, the DB rows are rolled back but the S3 object is already gone. The result is a `private_files` row pointing at a missing object, so the CV download (L6-T10) breaks. See m6.

### 3. Snapshot diff of the second migration

`git diff --no-index` of `20261017_130625_job_postings.json` against `20261017_132020_job_applications_cv_nullable.json` shows exactly one change: `job_applications.cv_id.notNull: true → false`, plus a new snapshot `id`. That matches the `up` SQL (`ALTER COLUMN "cv_id" DROP NOT NULL`) and the field config (no `required`). There is no drift. The migration only relaxes a constraint, so it is not `HIGH_RISK_MIGRATION`. Its `down` (`SET NOT NULL`) fails if any row has a NULL `cv_id`, and the comment acknowledges this. The comment's stated reason is wrong, though (m7). `migrations/index.ts` registers both migrations in order.

### 4. Ruling on the broken `down` pattern in 8 migrations

- **Not a blocker for this task.** The defect pre-exists in 7 committed migrations. It is a Payload generator pattern: `DROP TABLE ... CASCADE` already removes the FK, and the explicit `DROP CONSTRAINT` that follows then fails. It does not affect `up`, which is the only part applied in any environment, and the project's documented rollback strategy is fix-forward or revert (`.agent/rollback.md`), not `migrate:down`. I confirmed that the `job_postings` `down` has the same pattern.
- **Right follow-up:** a separate change request or tech-debt task (gap register entry), not a drive-by edit here.
  - Preferred: a **down-only fix under an explicit, user-approved exception** to "do not modify applied migrations". Change `DROP CONSTRAINT` to `DROP CONSTRAINT IF EXISTS` (and `DROP INDEX IF EXISTS`). Conditions: the `up` bytes stay identical, the `.json` snapshots stay untouched, the edit has its own commit, and `migrate:down` is verified step by step on a throwaway DB. This is safe because Payload stores only name and batch in `payload_migrations`, with no checksum, and no environment has ever executed these `down` functions.
  - Minimum alternative: a rollback runbook note in `.agent/rollback.md` / `docs/` saying that `migrate:down` is unsupported past batch X, and that rollback means fix-forward with a new migration.
  - The uncommitted `job_postings` migration can be included in the same follow-up. Keeping it unedited now matches the primary's decision.

## Gates

- **PII lifecycle on delete:** OK for single delete. The bulk path has edge cases (m5).
- **No PII in audit or logs:** OK. The summary is `Xoá hẳn job-applications <id>`, `meta` is empty, and the error message contains only the id.
- **Migration safety:** OK. Relaxing only, versioned, and the snapshot is consistent.
- **Docs reconcile:** OK. ERD §4.10 has the `cv` conditional-required note and the as-built bullets (delete hook, audit). ERD §5 has the `job_postings_list_idx` row. PERMISSION §3.3 has the admin row. ERD §4.10 says "cùng transaction", which is accurate only for the single-delete path (m5).
- **Responsive Checklist Gate:** N/A. No UI route, component, or CSS in the diff; only collection admin config.
- **aislop:** skip, `aislop` not installed (same as round 1).
- **oxlint (anti-slop):** skip, oxlint not configured. `pnpm lint` (eslint) PASS.
- **ocr:** skip, ocr not installed.
- **AI-readable:** OK. 1 indicator (m7, a misleading comment). The hook file is 37 lines, functions are 13 lines or fewer, names are clear, and comments explain why.
- **ai-friendly-web:** N/A. Not a public route.
- **blitzstrike:** skip. No endpoint in this task and no allowed environment.
- **Surgical diff:** OK. Every change traces to M1/m1/m2/m4 or the doc reconcile.

## Findings

### [CRITICAL]
None.

### [MAJOR]
None.

### [MINOR]

**m5. In the bulk-delete path, a CV-delete failure does not roll back the application row.**
- Where: `src/hooks/job-applications/delete-cv-and-audit.ts:20-22`, and the hook comment on line 8 ("lỗi thì rollback cả hai"). Payload `collections/operations/delete.js:222-230,269-271`.
- Problem: when an admin multi-selects and deletes from the list view, Payload catches the hook's throw per doc and still commits. With a non-DB failure (for example the S3 `DeleteObject` call in the plugin's `afterDelete`), the `job_applications` and `private_files` rows are committed as deleted. The PII S3 object is orphaned. The audit row is skipped because the audit hook never runs. The admin sees an error message even though the delete happened.
- This only happens on infrastructure failure, so it does not block.
- Fix (pick one):
  - (a) Set `disableBulkDelete: true` on `JobApplications`. Admin then deletes one record at a time, which is reasonable for a PII deletion request. Add a test that a bulk delete with `overrideAccess: false` returns 403.
  - (b) Keep bulk delete, but fix the comment and ERD §4.10 to say "rollback only for single delete", and record the S3-orphan risk for L9-T06.

**m6. Hook order deletes the S3 object before the fail-closed audit write.**
- Where: `src/collections/JobApplications.ts:73`.
- Problem: if `writeAuditLog` fails, the DB rolls back but the S3 object is already deleted, leaving a `private_files` row whose object is missing.
- Fix: swap the order to `[auditApplicationPurge, deleteApplicationCv]`. The audit insert shares the same transaction, so it still rolls back if the CV delete fails. The irreversible S3 call then becomes the last step. The existing test still covers both hooks.

**m7. The comment on the new migration's `down` gives the wrong reason.**
- Where: `migrations/20261017_132020_job_applications_cv_nullable.ts:8`.
- Problem: the comment says "cv is optional when the posting does not require it". `cv` is actually NULL only after anonymisation (`anonymizedAt` set) or after the CV is deleted.
- Fix: reword to "SET NOT NULL fails once any application was anonymised (cv_id NULL); dev rollback only." The migration is not committed yet, so editing a comment does not change the applied SQL. Alternatively, leave it and note it in the follow-up.

**m8. No test covers the failure or rollback branch of `deleteApplicationCv`.**
- Where: `tests/integration/job-postings.test.ts:478-515`.
- Problem: the round-1 fix request asked for "throws → rollback", but no test makes the `private-files` delete fail and then asserts the application row still exists.
- Fix (optional): add a spy that throws in `private-files` `afterDelete`, call single delete, expect a rejection, and assert both rows remain.

## Verdict

**PASS.** No CRITICAL or MAJOR findings. M1 is fixed and tested for the single-delete path. m1, m2, and m4 are closed with tests. The new migration only relaxes a constraint, and its snapshot diff is exactly the `cv_id` nullability change. Lint, typecheck, the full test suite (1101), the integration suite (25/25), and build are all green. m5–m8 do not block. I recommend fixing m6 (a one-line swap) and m5(a) before commit if cheap; otherwise record them in the task's Residual risk.

This is not a bug task, so repro closure does not apply.

## Residual risk

- I did not run the migration myself because `pnpm payload migrate` is not on the reviewer allow-list. The dev result (16/16, `cv_id` nullable) is builder evidence. Tests use `push: true`, not the migration SQL.
- The S3 deletion is simulated by a spy. The real `@payloadcms/storage-s3` `afterDelete` was not exercised (no S3 in the test environment).
- `migrate:down` is broken in 8 migrations (ruling 4). Until the follow-up lands, rollback means fix-forward only.
- aislop, ocr, and oxlint are not installed or configured.
