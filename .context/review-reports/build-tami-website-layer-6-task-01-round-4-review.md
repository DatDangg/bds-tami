Agent: reviewer

# Review: build/tami-website layer-6-task-01, phase A (repo side), round 4

- **Review level:** STRICT
- **Reason:** the production and staging deploy script (`deploy.sh` `deploy()` call site, which runs before migrations), the backup e2e harness built on the production compose file, client-IP trust used by rate limiting, a shared-host Nginx config, and backup/restore runbooks with data-loss risk.
- **Scope:** the uncommitted diff against HEAD `ba64fd3`, plus the untracked `docker/nginx/tami-staging-sslip*.conf`. Excluded: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`. Phase B (the server itself) is not reviewed.
- **Blast radius:**
  - `scripts/deploy/deploy.sh` `deploy()` and `base_services()`, which every staging and prod deploy runs.
  - `scripts/deploy/lib/release.sh`: COMPOSE_FILE on rollback.
  - `docker/docker-compose.{prod,staging}.yml`, the e2e overlay and `e2e.sh`.
  - `.env.example`, `docs/runbooks/{deploy,restore}.md`.
  - `src/lib/env.ts` and `client-ip.ts`: unchanged since round 2.

## Verify commands + result
| Command | Result |
|---|---|
| `bash scripts/deploy/deploy.test.sh` (Windows Git Bash) | PASS: 58 PASS, 0 FAIL, "Tất cả test PASS". 1 SKIP: the activate/restore/prune symlink test, because Windows has no real symlinks. This is expected |
| `deploy.test.sh` in `debian:bookworm-slim` (copy of `scripts/deploy`, mounted read-only) | PASS, with 0 SKIP and 0 FAIL |
| Old-code check (scratch copy outside the repo, call site reverted to round 3's `run compose up -d $(base_services)`) | The new test **FAILS** on the old code. 3 FAILs: exit non-zero, no `compose up`, no migrate. So the new test really catches the round 3 bug |
| `pnpm lint` | PASS (eslint clean) |
| `pnpm typecheck` | PASS (tsc clean) |
| `pnpm test` | PASS: 141 files, 1538 tests |
| `e2e.sh` / `nginx -t` / `docker compose config` | Not run by the reviewer. Listed under Residual risk |

## Responsive Checklist Gate
N/A. The diff has no route, component or CSS changes.

## Skill gates
- aislop: skip, aislop is not installed.
- oxlint (anti-slop): skip, oxlint is not configured. eslint and tsc pass.
- ocr: skip, ocr is not installed.
- AI-readable: OK. Comments explain WHY (the subshell/die trap, the staging no-backup decision). There are no new AI-chaos indicators. MINOR-1 is cosmetic.
- ai-friendly-web: N/A. Internal staging, with noindex and basic auth.
- blitzstrike: skip. There is no authorised environment, because phase A is repo only.

## Independent checks
| Check | Result | Evidence |
|---|---|---|
| Round 3 MAJOR-1 call site | CLOSED | deploy.sh:268-272: `base_list="$(base_services)" \|\| die`, then `read -r -a`, a die on an empty list, and `run compose up -d "${base_array[@]}"`. A die inside the subshell gives base_services rc=1, and the outer `\|\| die` then exits the main shell. The `cleanup` EXIT trap (main:293) restores `current`. Traps are not inherited by `$(...)`, so cleanup does not run twice. |
| stdout pollution of `$(base_services)` | OK | `compose config --services` output is captured into `declared` and not echoed. `die`/`log` write to stderr. Only the final `echo` reaches stdout. |
| Other `$(fn)`-as-argument with die inside (deploy.sh, lib/*.sh) | OK (audit confirmed) | Every function substitution is an assignment (`found=`, `target_line=`, `link=`, …), sits inside a `die` message string, or sits inside a `[[ ]]` test. None passes an argument to a command whose correctness depends on failure. |
| Deploy-level test quality | OK | `run_base_services_deploy` runs the real `deploy()` in a `set -e` subshell. Only the side-effecting helpers are stubbed, and `compose` is stubbed to record calls. The failure case asserts rc≠0, no `compose up`, no migrate. The success case asserts the exact line `compose up -d postgres redis seaweedfs backup` and no bare `compose up -d`. It fails against the old code (see above). |
| Round 3 MINOR-1 (restore.md drill target) | CLOSED | restore.md:3-4 now say the drill runs in the `drill-pg` container on the prod host (§3.1), and not on staging. §8 is consistent. |
| Round 3 MINOR-2 (`.env.example` queue example) | CLOSED | `.env.example`: `# BACKUP_ARCHIVE_PUSH_QUEUE_MAX=8GiB`, which matches the prod default. |
| Rounds 1-3 fixes | Still hold | (1) No `http2`, no `default_server` and no repeated `ipv6only` in `tami-staging-sslip.conf:21-25`. (2) The runbook stays shared-host safe (unchanged since round 3). (3) Staging has no backup service or `BACKUP_ENV_DIR` (staging.yml:9,13,132-134). (4) The e2e overlay renames all 8 containers and the network to `tami-bk-e2e-*` (e2e.yml:32-57), `-p tami-bk-e2e` is kept, and the stale-container guard is at e2e.sh:57. (5) TRUST flags: prod forces CF=true and XRI=false (prod.yml:32-33), staging defaults to CF=false and XRI=true (staging.yml:34-35), and dev `.env.example` keeps both false. (6) Rollback COMPOSE_FILE goes through the `current` symlink (release.sh:48-50), covered by a test. |

## Findings

### [MINOR-1] Literal newlines inside string quotes in `test_base_services`
- **Where:** `scripts/deploy/deploy.test.sh:258-265`.
- **Problem:** The code reads `compose() { printf '%s<LF>' …; }` and `COMPOSE_SERVICES=$'app<LF>postgres<LF>…'`, with real line breaks instead of `\n`. It works as intended, but it is hard to read and reads like an editor artifact. The new test at :305 correctly uses `$'…\n…'`.
- **Fix:** Use `printf '%s\n'` and `$'app\npostgres\nbackup\nredis'`. This is optional and does not block.

There are no CRITICAL or MAJOR findings.

## Verdict
**PASS (phase A).** Round 3 MAJOR-1 is fixed at the call site, and the new deploy-level regression test fails on the old code and passes on the new code. Round 3 MINOR-1 and MINOR-2 are closed. The rounds 1-3 fixes still hold. deploy.test.sh passes on Windows (1 expected symlink SKIP) and on Debian bookworm (0 SKIP). Lint, typecheck and tests (141/1538) pass.

## Residual risk
- The backup e2e was not re-run by the reviewer. The builder has s3 evidence. **sftp has never been run.** Run `bash docker/backup/test/e2e.sh sftp` before the first prod backup enablement, or record a deferral in the task file.
- `nginx -t` on 1.24 and `docker compose config` against the real staging/prod env files were not run by the reviewer. They belong to phase B on the server.
- `pnpm build` was not re-run. No app build code changed apart from the env schema, and typecheck passes.
