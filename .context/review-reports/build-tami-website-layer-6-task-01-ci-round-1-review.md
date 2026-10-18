Agent: reviewer

# Review: build-tami-website layer-6-task-01, CI fix, round 1

- **Review level:** NORMAL
- **Reason:** The change only touches the CI workflow and the teardown of one integration test. No app source, schema, auth logic, API or shared module changed. The teardown skips a guard hook through raw SQL, so I checked it more closely (FK schema, where the guard is tested), but this does not need STRICT.
- **Scope:** uncommitted diff vs HEAD 8604da9: `.github/workflows/ci.yml` and `tests/integration/access.test.ts`. Ignored: `.claude/launch.json`, `.context/*`.
- **Blast radius:** CI job `verify` (step order, external container), and data cleanup in `tami_test` / the local dev DB for `access.test.ts`. No runtime or prod impact.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0, no output) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, no errors) |
| `pnpm vitest run tests/integration/access.test.ts` (local dev DB) | PASS: 1 file, 25/25 tests (ran, not skipped) |
| `pnpm test` full / CI simulation | Not rerun by me. I rely on Builder's evidence (141 files, 1,538 PASS on an empty `tami_test`). Shown as residual risk below. |

## Checks

- **Step order:** OK. `Tạo extension` (init.sql on tami_test) → migrate `tami_migrate` → **migrate tami_test** → **SeaweedFS + buckets** → importMap → lint → typecheck → test → build. Migrate runs after init.sql, and SeaweedFS is ready before `pnpm test`.
- **Image pin:** OK. `chrislusf/seaweedfs:4.48` matches dev, staging and prod compose. It is a tag, not a digest, which is the same as the existing `services:` images (postgis/redis).
- **Secrets:** OK. `s3.json` is written to `$RUNNER_TEMP` with `ci-dummy-access`/`ci-dummy-secret`, which match the job's dummy env. The port is bound to `127.0.0.1` only.
- **Readiness loop:** OK. Up to 60×2s (plus up to 3s per curl) ≈ 120s+. Inside the loop, failures are in an `&&` list, so `bash -e` does not stop the step early. After the loop, both checks run again outside the `&&` list, so a timeout fails the step clearly. `curl -s` without `-f` only checks that the HTTP listener is up, which is enough here (anonymous requests get 403).
- **Bucket creation:** acceptable. Each run uses a fresh container, so idempotency is not needed. See MINOR-1 about error detection.
- **Teardown SQL:** OK.
  - Parameterised (`ANY($1::uuid[])`). It only deletes ids pushed into `createdIds` by this file. `staff.id` is `uuid` (migrations/20261016_090115_init.ts:15).
  - FK check across all migrations: every FK to `staff(id)` is `ON DELETE cascade` (`staff_sessions`, `payload_locked_documents_rels`, `payload_preferences_rels`) or `set null` (audit_logs.actor, author/version_author of news/projects/rentals/job_postings, media.uploaded_by). The delete cannot be blocked by an FK.
- **Does skipping the last-admin guard hide a bug?** No. The guard (`src/collections/Staff.ts:127-128`, `hooks/staff/last-admin-guard`) is tested in `tests/integration/audit-staff.test.ts`, which runs on its own temporary DB because the admin count must be known exactly. In the shared `tami_test`, the old `payload.delete` loop depended on how many admins other files had created in parallel, so it could flake. Raw SQL makes cleanup deterministic. It skips `afterDelete` (audit) too, which is fine for test cleanup.
- **Surgical diff:** OK. Every line traces to the CI failure (no migrated schema / no S3). No drive-by changes.

## Skill gates

- Responsive Checklist Gate: N/A (diff does not touch UI).
- aislop: skip, not run (diff is CI YAML plus 3 lines of test, no app code).
- oxlint (anti-slop): skip, oxlint not configured (repo uses eslint; `pnpm lint` PASS).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. The comments explain WHY (why SQL is used, why `docker run`), names are clear, and no function exceeds 50 lines. Only `120s` is a magic number, and it is written explicitly in the loop. 0 indicators.
- ai-friendly-web: N/A (CI/test, not public-facing).
- blitzstrike: N/A (not STRICT).

## Findings

- **[MINOR-1]** `.github/workflows/ci.yml` (bucket loop). `echo "s3.bucket.create ..." | weed shell` usually returns exit 0 even when the command fails, so a failed bucket creation would only show up later as upload 500s inside the tests, which are harder to diagnose. Fix: capture the output and fail if it contains `error` (like `docker-compose.prod.yml:270`), or check after creation with `s3.bucket.list | grep -qx`.
- **[MINOR-2]** `tests/integration/access.test.ts:55-60`. If `beforeAll` fails before `payload` is assigned, `payload.db` throws a TypeError in `afterAll` and buries the original error. This existed before the change too. Fix: `if (!payload) return;` or use optional chaining like audit-staff.test.ts.
- **[MINOR-3]** The SeaweedFS image is pinned by tag only. The actions in the workflow are pinned by SHA. If supply-chain consistency matters, pin it by digest (`chrislusf/seaweedfs:4.48@sha256:...`), and the service images too. This is optional.

## Residual risk

- I did not run the full CI simulation on an empty DB (`pnpm test` on a freshly migrated tami_test, real S3), so I rely on Builder's evidence. The only proof will be the actual GitHub CI run after commit.
- `curl` readiness checks only the HTTP listener. If the filer is late, `s3.bucket.create` could fail without any signal (see MINOR-1).

## Verdict

PASS (no CRITICAL/MAJOR; 3 MINOR, can be handled later or in this round).
