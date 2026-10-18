Agent: reviewer

# Review: build/tami-website layer-6-task-01, phase A (repo side), round 3

- **Review level:** STRICT
- **Reason:** the production deploy script (`deploy.sh` `base_services` call site), the backup e2e harness that is now built on the **production** compose file, client-IP trust used by rate limiting, a shared-host Nginx config, and data-loss risk around backup/restore docs.
- **Scope:** the uncommitted diff against HEAD `ba64fd3`, plus the untracked `docker/nginx/tami-staging-sslip*.conf`. Excluded: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`. Phase B (the server itself) is not reviewed.
- **Blast radius:**
  - `scripts/deploy/deploy.sh` `deploy()`. This is the production and staging deploy path, and it runs before migrations.
  - `docker/backup/test/e2e.sh` plus its overlay, now applied on top of `docker-compose.prod.yml`, and the local Docker host where it runs.
  - `docker-compose.prod.yml`: one added line.
  - `.env.example`, which developers copy.
  - `docs/runbooks/restore.md` and `docs/runbooks/deploy.md`.
  - `src/lib/env.ts` and `client-ip.ts`: unchanged since round 2.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint clean) |
| `pnpm typecheck` | PASS (tsc clean) |
| `pnpm test` | PASS: 141 files, 1538 tests |
| `bash scripts/deploy/deploy.test.sh` | PASS ("Tất cả test PASS"), including all 5 `base_services` asserts |
| `bash docker/backup/test/e2e.sh s3` | Not run by the reviewer (optional, and it needs Docker). The builder's evidence is E2E PASS for s3, with sftp not run. Listed under Residual risk |
| `nginx -t` / `docker compose config` | Not runnable by the reviewer. Listed under Residual risk |

## Responsive Checklist Gate
N/A. The diff has no route, component or CSS changes.

## Skill gates
- aislop: skip, aislop is not installed.
- oxlint (anti-slop): skip, oxlint is not configured. eslint and tsc pass.
- ocr: skip, ocr is not installed.
- AI-readable: OK. Comments explain WHY. There is 1 indicator, a stale "staging" drill wording (MINOR-1), which is below the threshold of 3.
- ai-friendly-web: N/A. Internal staging, with noindex and basic auth.
- blitzstrike: skip. There is no authorised environment, because phase A is repo only.

## Independent checks requested
| Check | Result | Evidence |
|---|---|---|
| The e2e overlay cannot touch real prod or dev containers | OK | The prod compose sets 8 `container_name`s (app, jobs, migrate, postgres, backup, redis, seaweedfs, seaweedfs-init: prod.yml:70-262). The overlay overrides all 8 to `tami-bk-e2e-*` (e2e.yml:31-48). |
| Project name | OK | The prod file has a top-level `name: tami` (prod.yml:18). `dc()` always passes `-p tami-bk-e2e` (e2e.sh:22,35), and the CLI `-p` overrides the top-level `name:`. |
| Volumes | OK | The prod volumes (prod.yml:288-294) have no explicit `name:`, so they become `tami-bk-e2e_*`. The cleanup filters are `name=tami-bk-e2e` and `name=tami-bk-e2e-` (e2e.sh:47-49). Neither matches `tami_postgres-data` or the dev volumes. `down -v` is scoped to `-p tami-bk-e2e`. |
| Network | OK | The overlay sets `networks.internal.name: tami-bk-e2e-net`, overriding prod's `tami-net`. `pg-restore.sh` and the restore containers use `tami-bk-e2e-net` (e2e.sh:182,186). No `external` network is used. |
| Host bind mounts and ports | OK | The backup bind mounts come from `BACKUP_ENV_DIR`, which is set to `$WORK` (e2e.sh:96). App port `127.0.0.1:3010` is never started (only `postgres seaweedfs target-*` and `seaweedfs-init` are brought up, e2e.sh:155-156). |
| Stale-container guard | OK | Line 57 refuses to run if `^tami-bk-e2e-` containers exist. Image tags `tami-postgres:…`/`tami-backup:…` are rebuilt locally from the same context. This is pre-existing behaviour, and the script is documented as dev-only. |
| Dummy secrets are not committed | OK | They are generated at runtime with `rand` into `docker/backup/test/.work/compose.env`. `git check-ignore` confirms `docker/backup/test/.gitignore:1:.work/`. There are no literal secrets in the diff. |
| Metric label and queue default | OK | prod.yml:196 has `BACKUP_ENV_NAME: production`, which matches the `env="production"` asserts. prod.yml:141 has the `8GiB` default, which matches the e2e.sh:448 assert. |
| Prod compose unchanged except the trust flag | OK | The only change to `docker-compose.prod.yml` is `+TRUST_X_REAL_IP: "false"`. |
| `base_services` dry-run semantics | OK | Dry-run runs no docker: production lists backup and staging does not. This matches deploy runbook :135 (`--dry-run`) and the tests. |
| `base_services` failure semantics at the call site | **FAIL** | See MAJOR-1. |
| Round 2 MINOR-2 (`.env.example` TRUST lines) | CLOSED | The staging TRUST lines are commented out. Dev keeps both flags false, which agrees with runbook step 3. |
| Round 2 MINOR-3 (restore.md) | Mostly CLOSED | Scope is now prod only, along with `E`/`C`, the network, mem_limit, queue default and the §10 e2e text. A leftover remains, see MINOR-1. |
| Round 2 MINOR-4 (conf comment, certbot dir) | CLOSED | conf:3 now says `systemctl reload nginx`. Runbook :246 checks `ls -ld /var/www/certbot` and keeps the mode and owner, using `mkdir -p` only if the directory is missing. |
| Round 1 and round 2 items (listen/http2, HSTS, certbot hook, apt, env/client-IP, rollback COMPOSE_FILE) | Still hold | Unchanged since round 2. The http2 follow-up for prod is recorded in `layer-15-task-01.md`. The task file paths are fixed (`/opt/tami/staging.env`, `tami-staging-sslip*.conf`). |

## Findings

### [MAJOR-1] `die` inside `$(base_services)` does not stop the deploy. A failed compose read now starts **every** service, including app/jobs on the new image, before migrations
- **Where:** `scripts/deploy/deploy.sh:268` (`run compose up -d $(base_services)`), together with `:249` (`declared="$(compose config --services)" || die …`).
- **Problem:**
  - `base_services` runs in a command-substitution subshell, so `die` (`exit 1`, deploy.sh:58-61) only exits that subshell.
  - `set -e` does not fire when a command substitution fails inside the arguments of a simple command. It only fires for assignments.
  - The outer command therefore still runs, as `compose up -d` with **no service list**. That starts every non-profile service in prod (`app`, `jobs`, `postgres`, `redis`, `seaweedfs`, `seaweedfs-init`, `backup`), with `TAMI_IMAGE=$ACTIVE_IMAGE` set to the new image.
  - This happens **before** `run_migrations`, and outside `switch_app_and_jobs`, which is the only place a rollback is triggered.
  - The new code is meant to handle exactly this transient compose/daemon failure (round 2 MINOR-1). In that case the result is now worse than before: an error line is printed, the new app runs against the old schema, and there is no rollback.
- **Why the tests miss it:** `test_base_services` calls `(base_services)` in isolation (deploy.test.sh:270-271), so it proves the function exits non-zero. It never tests the `deploy()` call site.
- **Fix:**
  - Capture the result in an assignment so `set -e` and `die` apply in the main shell: `local svcs; svcs="$(base_services)" || die "…"; read -ra svcs_arr <<<"$svcs"; run compose up -d "${svcs_arr[@]}"`. Alternatively, have `base_services` fill a global array instead of echoing.
  - Add a deploy-level test: a fake `compose` where `config --services` fails must cause deploy to exit non-zero, and no `compose up -d` may be recorded.

### [MINOR-1] restore.md still says drills restore "lên staging"
- **Where:** `docs/runbooks/restore.md:4` ("diễn tập khôi phục lên staging 6 tháng/lần") and `:3` ("staging chỉ là nơi diễn tập khôi phục").
- **Problem:** §8 (`:211`) and §3.1 now drill into a `drill-pg` container on `tami-net` on the production host. The intro still names staging as the drill target, and staging has no backup credentials or stack.
- **Fix:** Reword both lines to say drills restore into the `drill-pg` container (§3.1), not into the staging stack.

### [MINOR-2] `.env.example:103` example value `4GiB` next to "mặc định prod 8GiB"
- **Problem:** The commented example `# BACKUP_ARCHIVE_PUSH_QUEUE_MAX=4GiB` would halve the prod cap if someone uncommented it as-is.
- **Fix:** Change the example to `8GiB`, or note that the value is only an illustration.

## Verdict
**FAIL (phase A)** because of 1 MAJOR finding: the production deploy path regression in MAJOR-1. Round 2 MAJOR-1 (the e2e harness) is **CLOSED**. The overlay isolates containers, the project, volumes and the network from the real prod and dev stacks, and the dummy secrets are gitignored. Round 2 MINOR-2, MINOR-3 and MINOR-4 are closed, apart from the small restore.md leftover. All verify commands pass. There are no CRITICAL findings.

Minimum for round 4: fix MAJOR-1 at the call site and add a deploy-level test. MINOR-1 and MINOR-2 are cheap to fix in the same round.

## Residual risk
- The backup e2e was not re-run by the reviewer. I am relying on the builder's s3 PASS evidence. The **sftp scenario was not run** by anyone this round. Recommend running `bash docker/backup/test/e2e.sh sftp` before close-out, or recording a deferral in the task file.
- `nginx -t` on 1.24 and `docker compose config` for staging/prod were not run by the reviewer.
- `pnpm build` was not re-run. No app build code changed apart from the env schema, and typecheck passes.
