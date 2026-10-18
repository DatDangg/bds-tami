Agent: reviewer

# Review — feature-layer9-minor-export-reminder · phase-1-task-02 · round 1

- Task: `tasks/feature-layer9-minor-export-reminder/phase-1-task-02.md` (index for the `remind-unassigned-leads` scan query, BR-14 / BL-009)
- Branch: `staging` (not committed)
- Diff reviewed: `src/collections/Leads.ts` (`indexes`), `migrations/20261018_212611_leads_remind_scan_index.ts` + `.json`, `migrations/index.ts`, `tests/integration/leads-remind-scan-index-migration.test.ts`, `docs/ERD.md`, `docs/ARCHITECTURE.md`. Out of scope and not reviewed: `.claude/**`, `.context/project-config.md`, `.context/runs/**`, `spec/changes/*`.

## Review level: STRICT
**Reason:** DB schema/migration. The change adds an index to `leads`, a table that the public lead form, the admin list and a cron job all write to or read from.

## Blast radius
- Table `public.leads`. Building the index takes a SHARE lock, which blocks INSERT/UPDATE/DELETE on leads (the public lead form, sale/admin updates, the reminder job) for as long as the build runs inside the migration transaction.
- Write cost: each INSERT, or UPDATE of `status`/`assigned_to_id`/`reminded_at`, now maintains one more btree. Lead volume is low, so the cost is negligible.
- Payload snapshot `.json`: the next `migrate:create` diffs against this file.
- No change to API, types (`src/payload-types.ts` unchanged), access control or app behaviour.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 2530 pass / 1 fail. The 1 fail is the known existing one, `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … -> 400", and is not counted |
| `pnpm build` | PASS (exit 0) |
| `pnpm vitest run --project integration tests/integration/leads-remind-scan-index-migration.test.ts tests/integration/remind-unassigned-leads.test.ts` | 2 files, 8/8 PASS. Not skipped, so `DATABASE_URL_TEST` is set |
| `pnpm payload migrate:status` (dev DB, read-only) | `20261018_212611_leads_remind_scan_index` batch 28 = Yes, last in the list. No reset, fresh or db push was run |

## Focus checks

1. **Additive only / not HIGH_RISK_MIGRATION: OK.**
   - `up` does exactly `CREATE INDEX IF NOT EXISTS "status_assignedTo_remindedAt_createdAt_idx" ON "leads" USING btree (...)`.
   - `down` does exactly `DROP INDEX IF EXISTS`.
   - There is no enum, column or other DROP.
   - `git diff --no-index` of the previous snapshot `20261018_203017_rentals_reindex_job.json` against the new `.json` shows only (a) the new index key in `leads.indexes`, with 4 columns asc / nulls last, btree, not unique, not concurrent, and (b) a new `id`.
   - `migrations/index.ts`: the import and entry come right after `20261018_203017_rentals_reindex_job`. The added trailing comma on the previous entry is Payload's own generator formatting.
2. **No CONCURRENTLY: OK, verified.**
   - `@payloadcms/drizzle@3.91.0/dist/migrate.js:62-90`: `runMigrationFile` runs `initTransaction(req)`, then `getTransaction`, then `migration.up`, then `commitTransaction`. `CREATE INDEX CONCURRENTLY` cannot run inside a transaction block.
   - This matches the existing precedent in `20261018_082231_rentals_search_trgm.ts`.
   - Lock impact: SHARE lock on `leads`, held per migration file until that file's commit. Leads is small, and the dev run took 14 ms. A large prod table would need a separate decision (residual risk below).
3. **Index serves `findDueLeads`: OK.**
   - Payload 3.91 turns `exists: false` into plain `IS NULL` (`sanitizeQueryValue.js:216-222` sets operator `isNull`) for both the relationship and the date field, so the predicates match the index columns.
   - Column order: `status` (equality), `assigned_to_id IS NULL`, `reminded_at IS NULL`, then `created_at` (range). All four columns appear in the Index Cond (EXPLAIN in the test and in the task).
   - Compared with the existing `leads_status_assignee_created_idx (status, assigned_to_id, created_at DESC)`: the old index cannot filter on `reminded_at`. Leads that are `new`, unassigned and already reminded therefore pile up and have to be scanned with a Filter. The new index removes that, so it is not redundant.
   - The old index stays because it serves the admin list. The two share the `(status, assigned_to_id)` prefix, which is acceptable.
   - The write cost of one extra btree is small next to lead volume.
4. **Index name with no table prefix: OK (MINOR note).**
   - This is Payload's naming convention: it joins the field keys and adds no table prefix, the same as `province_slug_idx` and `collection_docId_idx`.
   - A grep of `migrations/*.ts` finds no other index with this name. The chance of a collision is low because the 4-field combination exists only on leads.
   - Renaming it by hand would make the snapshot drift, so keeping the name is the right call.
5. **Migration test: OK.**
   - Uses a temporary DB (`CREATE DATABASE` + `DROP DATABASE … WITH (FORCE)` in `afterAll`) and runs the full migrate.
   - Covers up, then down twice, then up twice. It asserts the exact `indexdef` (column order) and that this migration runs after `leads_reminded_at`.
   - Before EXPLAIN it inserts 20,000 rows shaped like real data and runs `ANALYZE`.
   - EXPLAIN uses hand-written SQL that matches the Payload predicates. The difference is `now()` in place of a bound parameter; the btree Index Cond is the same with a parameter.
6. **As-built docs: OK.**
   - ERD §4.11 and the §5 index table each gain a correct row (name, columns, migration, not partial).
   - ARCHITECTURE §5.4 adds one sentence on the index for the reminder job.
   - No intent docs were touched.

## Responsive Checklist Gate
N/A. The diff has no UI (no route, component or CSS).

## Skill gates
- aislop: skip, not configured in `.context/project-config.md` (not on the reviewer's list of allowed commands). The diff is small; reading it by hand found no slop.
- oxlint (anti-slop): skip, oxlint not configured. `pnpm lint` (eslint) PASS.
- ocr (open-code-review): skip, ocr not installed / not configured.
- AI-readable: OK, 0 indicators. Names are clear, there are no functions over 50 lines, and the comments explain why: why no CONCURRENTLY, why the index is declared in `Leads.indexes`. Docs were updated.
- ai-friendly-web: N/A (internal DB change).
- blitzstrike: N/A (no auth, public API or input surface).

## Findings
- [CRITICAL] None.
- [MAJOR] None.
- [MINOR-1] `docs/ERD.md` / deploy notes: there is no note on the lock cost if `leads` is large at prod deploy time. Postgres would still build the index while holding a write-blocking lock. Suggested fix: add a line to the deploy checklist or runbook to check the row count of `leads` before migrating. Above roughly 1M rows, run `CREATE INDEX CONCURRENTLY IF NOT EXISTS …` by hand before deploying, and let the migration's `IF NOT EXISTS` turn into a no-op. Not blocking (it is a new system, so the table is small).
- [MINOR-2] `tests/integration/leads-remind-scan-index-migration.test.ts:86`: `SET enable_seqscan = off` is session-level on a pooled client and is never reset. Within this file there is no side effect because the temporary DB is dropped afterwards. If more tests are added to the file, use `SET LOCAL` inside a transaction or `RESET enable_seqscan` after EXPLAIN.
- [MINOR-3] (informational) The plan is Bitmap Index Scan followed by Sort, not an Index Scan already ordered by `created_at`. Postgres does not treat `IS NULL` as an equality for ordering, so it cannot rely on the index order. The Sort runs only on the leads that are actually due (a small set), so the cost is fine. No fix needed.

## Residual risk
- The migration has not been run on staging/prod. EXPLAIN has not been measured on real data with seqscan enabled (a small table is expected to use seqscan).
- The EXPLAIN SQL is hand-written to match Payload's output. Its equivalence was checked by reading `sanitizeQueryValue.js` / `parseParams.js`, not by capturing the drizzle log.

## Verdict: PASS
There are no CRITICAL or MAJOR findings. All acceptance items in the task are met and verified with the configured commands.
