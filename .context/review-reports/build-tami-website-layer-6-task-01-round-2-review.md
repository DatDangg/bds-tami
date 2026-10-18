Agent: reviewer

# Review: build/tami-website layer-6-task-01, phase A (repo side), round 2

- **Review level:** STRICT
- **Reason:** shared-host Nginx config (other companies' production sites on 187.52.119.50), client-IP trust for rate limiting (security), deploy script shared by staging and production, removal of the backup/WAL-archive stack from a compose file (data-loss domain), env validation.
- **Scope:** the uncommitted diff against HEAD `ba64fd3`, plus the untracked `docker/nginx/tami-staging-sslip*.conf`. Excluded: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`. Phase B (the server itself) is not reviewed.
- **Blast radius:**
  - The host Nginx sockets on 0.0.0.0/[::] ports 80 and 443, shared by every site.
  - `scripts/deploy/deploy.sh` → `base_services()` runs on the **production** deploy path too.
  - Staging compose: postgres image and config, removed `backup` service and volumes.
  - The backup e2e harness `docker/backup/test/e2e.sh`, which is built on the staging compose (see MAJOR-1).
  - `src/lib/env.ts` and `client-ip.ts` (rate limiting on every public form).
  - `.env.example`, which developers copy (`README.md:9`).
  - Docs: deploy runbook §9, ARCHITECTURE §6.3, restore.md (stale).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc clean) |
| `pnpm lint` | PASS (eslint clean) |
| `pnpm test` | PASS: 141 files, 1538 tests |
| `bash scripts/deploy/deploy.test.sh` | PASS ("Tất cả test PASS"), including both new `base_services` asserts and the rollback COMPOSE_FILE assert |
| `pnpm build` | not re-run. The diff touches no app build code (env.ts schema only; typecheck passes) |
| `nginx -t` (1.24) / `docker compose config` | not runnable by the reviewer. The builder claims both PASS (runbook §9.2 preamble). Listed under Residual risk |

## Responsive Checklist Gate
N/A. The diff has no route, component or CSS changes.

## Skill gates
- aislop: skip, aislop is not installed.
- oxlint (anti-slop): skip, oxlint is not configured. eslint and tsc pass.
- ocr: skip, ocr is not installed.
- AI-readable: OK. The round-1 naming nit is fixed: `trustFlagSchema` plus `parseTrustFlag(name, value)`. Comments explain WHY. 2 indicators (MINOR-2 and MINOR-3: docs that contradict each other or are stale), which is below the threshold of 3.
- ai-friendly-web: N/A. Internal staging; noindex plus basic auth are intentional.
- blitzstrike: skip, there is no authorised environment (phase A is repo only).

## Round-1 findings: closure
| Round-1 finding | Status | Evidence |
|---|---|---|
| MAJOR-1: `http2` on a shared socket | CLOSED | `tami-staging-sslip.conf:24-25` is `listen 443 ssl;` / `listen [::]:443 ssl;`, with no `http2`, `default_server` or `ipv6only`. This matches the host facts: one site already holds `[::]:443 ipv6only=on`, and repeating it would be a duplicate listen option. The comment at :21-23 explains why. |
| MAJOR-2: apt upgrade of nginx/certbot | CLOSED | Runbook §9.2 step 2: no nginx/certbot install. `apt-get install -y --no-upgrade apache2-utils` runs only if `command -v htpasswd` fails. Explicit rule "không restart; nginx -t PASS rồi systemctl reload". |
| MINOR-1: global renewal hook | CLOSED | Step 6 uses a single `-d 187-52-119-50.sslip.io` with a per-cert `--deploy-hook "nginx -t && systemctl reload nginx"` (certbot runs hooks through a shell, so `&&` works). It explicitly says not to write to `renewal-hooks/deploy/`, and dry-runs with `--cert-name`. |
| MINOR-2: HSTS for 1 year | CLOSED | `max-age=86400` at :43 and :78, with no includeSubDomains/preload. |
| MINOR-3: IPv6 implicit default | CLOSED | Step 1 has read-only `nginx -T` / `ip -6` checks, plus a rule to drop the `[::]` listens if no other site uses them. The host already has a `[::]:443` listener, so TAMI joins it without becoming the default. |
| MINOR-4: task file env path | not re-checked (task file not read this round) |
| MINOR-5: TRUST_* copied from `.env.example` | CLOSED for staging (step 3 grep check). The fix adds a new dev side effect, see MINOR-2 |
| MINOR-6: code nits | CLOSED: `parseTrustFlag` dedupe; `afterEach(vi.unstubAllEnvs)` |

## Independent checks requested by the primary
| Check | Result | Evidence |
|---|---|---|
| Prod compose unchanged except the trust flag | OK | The only change to `docker-compose.prod.yml` is `+TRUST_X_REAL_IP: "false"` (line 33). |
| `deploy.sh` prod path is behaviour-preserving | OK, with MINOR-1 | `base_services` calls the same `compose()` wrapper (`--env-file $ENV_FILE -f $COMPOSE_FILE`, after `activate_release`). Prod `backup` (prod.yml:182) has no `profiles:`, so `config --services` lists it and prod still runs `up -d postgres redis seaweedfs backup`, as before. The earlier `run compose config -q` (:256) dies under `set -e` on an invalid config before `base_services` runs. |
| Staging Postgres without archive config | OK | `archive_mode=off`; `wal_level` falls back to the PG default (replica). There is no `archive_command`, pgbackrest env or socket volume. The healthcheck is plain `pg_isready`. App `/api/health` checks DB, Redis and S3, not backup. Migrations are unaffected. `postgis/postgis:17-3.5` is the same base the custom image used, and the volume is new (first staging deploy). |
| Empty `ANTHROPIC_API_KEY` with budget 0 | OK | `env.ts:37` turns empty into undefined and makes it optional; budget is `nonnegative()`. The new test is at `env.test.ts` "staging tắt dịch AI". Compose defaults are `${ANTHROPIC_API_KEY:-}` and `${…BUDGET_USD:-0}`. |
| Translation no-ops safely | OK | `translation-service.ts:96` throws `TranslationError("not_configured")` before creating the client, so no network call is made and no cost is recorded. This is the pre-existing designed path. |
| Runbook safe on a shared host | OK | Steps 1-12 are all `[XÁC NHẬN]`; step 13 only collects evidence. Every reload is preceded by `nginx -t`. There is no restart, no firewall change and no edit to another site's file. Certbot uses a single `-d`, with no global hooks. Secrets are never put on the command line (htpasswd prompts). |
| Conf security (auth, X-Real-IP override, CF header cleared, noindex) | OK | Unchanged since round 1 apart from the listen and HSTS lines. |

## Findings

### [MAJOR-1] Removing backup from the staging compose breaks the backup e2e suite (the only automated test of the production backup stack)
- **Where:** `docker/backup/test/e2e.sh:3,36,447` and `docker/backup/test/docker-compose.e2e.yml:31`.
- **Problem:**
  - e2e.sh builds its temporary project from `-f docker/docker-compose.staging.yml -f docker/backup/test/docker-compose.e2e.yml` ("postgres tuỳ biến + sidecar backup").
  - The overlay only patches `backup:`. With the base service gone, that service has no image/build, so compose config fails.
  - Postgres no longer has pgbackrest or `archive_command`, so every WAL, restore and queue-max scenario breaks.
  - Line 447 asserts the staging default is `PGBACKREST_ARCHIVE_PUSH_QUEUE_MAX: 4GiB`, which no longer exists.
  - The suite validates the backup system that production still depends on (RPO/RTO, data loss). The builder did not update or mention it, so the backup e2e suite is now silently dead.
- **Fix (pick one):**
  - (a) Point e2e.sh and the overlay at `docker/docker-compose.prod.yml`. Adjust the container-name guard (`^tami-`, carefully, without touching the real prod stack: keep the separate project name plus label filter), the network `tami-net`, the `env="prod"` metric labels and the queue default `8GiB` assert.
  - (b) Move the backup-enabled postgres and backup blocks into a dedicated `docker/backup/test/docker-compose.base.yml` used only by e2e.
  - Either way, record in the task file that the backup e2e must be re-run (manual docker run) or is deferred, with a reason.

### [MINOR-1] `base_services` swallows `compose config --services` failures, and dry-run now executes docker
- **Where:** `scripts/deploy/deploy.sh:242`
- **Problem:**
  - Inside the `if` condition, `set -e` does not apply. If `compose config --services` fails, for example because of a transient daemon or socket error after line 256, grep sees an empty string and production silently deploys **without starting `backup`**, with no warning.
  - In `--dry-run`, which previously ran no docker commands, this now invokes a real (read-only) `docker compose config`. With a missing or incomplete env file, the plan prints without `backup` and leaves compose stderr noise.
- **Fix:** `local list; list="$(compose config --services)" || die "không đọc được danh sách dịch vụ compose"`, then `grep -qx backup <<<"$list"`. Optionally, in dry-run, print `[dry-run] compose config --services` and include `backup` for production. Add one test asserting the failure path dies.

### [MINOR-2] Duplicate `TRUST_*` lines in `.env.example` make dev end up with `TRUST_X_REAL_IP=true`, and contradict runbook step 3
- **Where:** `.env.example:91-92` vs `:123-124`. Related: `README.md:9` (`cp .env.example .env.local`) and runbook §9.2 step 3.
- **Problem:**
  - dotenv and compose both use the last value, so anyone who copies the whole file for dev gets `TRUST_X_REAL_IP=true`. This contradicts the comment at :86 ("mặc định / dev: cả hai false"). In dev a client can spoof `X-Real-IP` to bypass the rate limit; the impact is low because it is dev only, but it is a trap.
  - The comment at :121 says copying the block into `staging.env` "vẫn đúng". Runbook step 3 requires `grep '^TRUST_'` to return nothing and says to delete any such lines. The two documents disagree.
- **Fix:** Comment out the staging block (`# TRUST_CF_CONNECTING_IP=false` / `# TRUST_X_REAL_IP=true`), and say there that staging relies on the compose defaults (matching runbook step 3).

### [MINOR-3] restore.md still describes staging as having the backup stack (doc reconcile)
- **Where:** `docs/runbooks/restore.md:3` (scope "docker-compose.{staging,prod}.yml … postgres tuỳ biến + backup"), `:9` (`E=staging`), `:63` and `:221` ("staging 4GiB"), and `:212` ("Diễn tập đầu tiên: ngay sau khi bật backup trên staging").
- **Problem:** These are as-built statements that are now false. Under the AGENTS Doc Impact rule they must be reconciled before close-out. An operator following them would hit "no such service backup" on staging.
- **Fix:**
  - Mark staging as having no backup (decision 2026-10-18).
  - Make the drill target use the separate `drill-pg` container flow, which still works.
  - Drop the staging 4GiB references and point to deploy runbook §9.5.

### [MINOR-4] Small inconsistencies in the Nginx conf comments and runbook
- **Where:**
  - `tami-staging-sslip.conf:3` says `nginx -s reload`, while the runbook uses `systemctl reload nginx` (round 1 asked for consistency).
  - Runbook step 5 has `sudo install -d -m 755 /var/www/certbot`. If another site already uses this webroot, `install -d` re-applies mode and ownership to the existing directory.
- **Fix:**
  - Change the comment to `systemctl reload nginx`.
  - In step 5, check `ls -ld /var/www/certbot` first and only create the directory if it is missing.

## Ruling: pre-existing `http2` in `tami.conf` / `tami-staging.conf`
These files are outside this diff (pre-existing), so this does **not** count against phase A. The runbook now explicitly forbids enabling them on this host, which is enough for staging.

However, ARCHITECTURE §6 places production on the same host Nginx ("có sẵn, thêm `tami.conf`"). Enabling `tami.conf` on nginx 1.24 there would turn on h2 for every other site's :443 socket. **Open a separate backlog item now and treat it as a blocker before the production go-live:**
- Remove `http2` from `listen` in both Cloudflare variants.
- Or gate it on a read-only check that every 443 listener already has it, or on nginx ≥ 1.25.1 with `http2 on;` per server.

Do not leave it until the prod deploy day.

## Verdict
**FAIL** because of 1 MAJOR finding (MAJOR-1: the backup e2e harness, which depended on the staging compose's backup stack, is now broken and untested, while production still relies on that stack). All round-1 MAJOR findings are closed. Conf, runbook, env, client-IP, deploy-script and test changes are otherwise correct, and all verify commands pass. No CRITICAL findings.

Minimum for round 3: fix MAJOR-1. MINOR-1, MINOR-2 and MINOR-3 are cheap and recommended in the same round. MINOR-4 is optional.

## Residual risk
- `nginx -t` on 1.24 and `docker compose config` for staging/prod were not run by the reviewer; I am relying on the builder's evidence. Phase B must run `nginx -t` on the server before every reload.
- MINOR-4 from round 1 (the task file path) was not re-checked this round.
- Let's Encrypt rate limits on sslip.io are covered by the runbook fallback.
- `pnpm build` was not re-run by the reviewer.
