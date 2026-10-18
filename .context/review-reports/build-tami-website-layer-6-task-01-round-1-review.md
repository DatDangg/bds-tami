Agent: reviewer

# Review: build/tami-website layer-6-task-01, phase A (repo side), round 1

- **Review level:** STRICT
- **Reason:** security (trust in the client IP header used for rate limiting), shared deploy/CI infrastructure (workflows, compose, Dockerfile, rollback script), and Nginx config that will be loaded into the **shared** host Nginx alongside other companies' production sites (ismartschool, nta, nhstar, crm-dhp, tmfoods).
- **Scope:** the uncommitted diff against HEAD `ba64fd3`, excluding `.claude/launch.json`, `.context/progress.json` and `.context/runs/*`. Phase B (the server itself) has not been done and is not reviewed here.
- **Blast radius:**
  - The host Nginx process that serves every site on 187.52.119.50, through the listen sockets 0.0.0.0/[::] on ports 80 and 443.
  - Rate limiting for every public form (`getClientIp`).
  - The staging/prod compose env. The prod change only adds an explicit `TRUST_X_REAL_IP=false`, so prod behaviour is unchanged.
  - The CI pipeline, the runtime image (now includes `seed/`, 2.6 MB, no secret-looking files), and automatic rollback in `release.sh`.
  - Publishing the privacy policy (`syncPrivacyPolicyVersion` now returns a 400 when `siteName` is missing).

## Verify commands + result
| Command (from project-config) | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc clean) |
| `pnpm lint` | PASS (eslint clean) |
| `pnpm test` | PASS: 141 files, 1537 tests |
| `pnpm test -- client-ip/env/pages-hooks` | PASS: 31 tests |
| `bash scripts/deploy/deploy.test.sh` | PASS ("Tất cả test PASS"), including the new assert that rollback reads COMPOSE_FILE through the `current` symlink |
| `pnpm build` | not re-run (the builder reports OK; the diff touches the Dockerfile and workflows, not app build code) |
| `nginx -t` | not runnable by the reviewer. The builder reports PASS on nginx 1.31 in a container, but **the server runs 1.24**, see MAJOR-1 |

## Responsive Checklist Gate
N/A. The diff has no route, component or CSS changes.

## Skill gates
- aislop: skip, aislop is not installed.
- oxlint (anti-slop): skip, oxlint is not configured (no `.oxlintrc.json`). eslint and tsc pass.
- ocr: skip, ocr is not installed.
- AI-readable: OK. One indicator only: `parseTrustRealIpFlag` reuses `trustCloudflareSchema`, which is a naming nit. Comments explain WHY, and ARCHITECTURE §6.3 and runbook §9 are updated.
- ai-friendly-web: N/A. This is internal staging, and noindex plus basic auth are intentional.
- blitzstrike: skip, there is no authorised environment (phase A is repo only).

## Security gate checklist
| Item | Result | Evidence |
|---|---|---|
| X-Real-IP is trusted only behind Nginx on the same host | OK | Compose binds only `127.0.0.1:3011:3000` (staging compose:77). The conf sets `proxy_set_header X-Real-IP $remote_addr` at server level (sslip.conf:55), and no location redefines `proxy_set_header`, so every location inherits it. |
| CF-Connecting-IP / X-Forwarded-For | OK | The conf clears `CF-Connecting-IP ""` (:57) and overwrites `X-Forwarded-For $remote_addr` (:52). The app never reads XFF (tested). If both trust flags are on, only the CF header is considered (tested). |
| Basic auth coverage | OK | `auth_basic` is set at server level (:32-33), so `/`, `/api/`, `/admin`, `/api/media/file/` and `_next` all inherit it, and there is no `auth_basic off` anywhere. The ACME path exists only on the :80 server, without auth (http.conf:17). `Authorization` is stripped before reaching the app (:35). |
| `server_name` exact, no `default_server` | OK | Both files use exactly `187-52-119-50.sslip.io` with no `default_server`. Caveats: the implicit default and socket-wide options are covered in MAJOR-1 and MINOR-3. |
| TLS | OK | TLSv1.2/1.3 with nginx default ciphers is acceptable for staging. |
| HSTS | MINOR-2 | `max-age=31536000` without `includeSubDomains`, so it is scoped to this one hostname and does not affect other sites. |
| Staging noindex | OK | `X-Robots-Tag` is set at server level, and repeated in the only location that uses `add_header`. The runbook states that robots returns `Disallow` when `APP_ENV=staging`. |
| Cache headers | OK | Media is overridden to `private, no-store` and every other header in that block is repeated. Admin and API cache headers are left to the app. |
| NEXT_PUBLIC_HOTLINE build-arg | OK | The value is public by design and documented as a Repository variable. |
| Seed in runtime image | OK | 2.6 MB, 22 tracked files, no `.env`/key/pem files. `seed-sample-services` refuses to run when `APP_ENV=production`. |
| CI migrate uses a separate DB | OK | `tami_migrate` is created separately. `payload.config.ts:90` reads `env.DATABASE_URL`, which the step env overrides, so the test DB `tami_test` is not touched. init.sql is applied first. |
| SHA pins | OK | All are 40-hex pins with version comments (checkout v4.2.2 `11bd719…`, setup-node v4.4.0 `49933ea…`, pnpm/action-setup v4.1.0 `a7487c7…`). |
| Rollback symlink logic | OK | `release.sh:50`: when there is a previous release, compose is read through `$link`, otherwise from `$REPO_DIR`. Asserted in `deploy.test.sh`. |
| Privacy-sync error | OK | `APIError(…, 400, …, isPublic=true)` is thrown before `updateGlobal`. Tests cover both the missing and present `siteName` cases. |
| Prod semantics unchanged | OK | The only change to `docker-compose.prod.yml` is the explicit `TRUST_X_REAL_IP: "false"`. |

## Findings

### [MAJOR-1] `listen 443 ssl http2` would turn on HTTP/2 for every other company's site on the shared host (nginx 1.24)
- **Where:** `docker/nginx/tami-staging-sslip.conf:21-22`
- **Problem:** The server runs nginx 1.24 (journal, 11:00). Before 1.25.1, the `http2` parameter on `listen` belongs to the listen socket (address:port), not to one virtual server. Enabling the TAMI site would therefore enable h2 via ALPN for every vhost on 0.0.0.0:443 and [::]:443: crm-dhp, ntasolution.vn, ntavietnam.tech, nhstar, tmfoods and ismartschool. Certbot-generated sites usually only have `listen 443 ssl`. This silently changes other companies' production sites, which breaks the "no change to other server blocks" constraint. `nginx -t` does not catch it, and the builder's `nginx -t` ran on 1.31, where `listen … http2` behaves differently.
- **Fix:** Remove `http2` from both `listen` lines. Plain `listen 443 ssl;` is fine for staging. Alternatively, add a read-only pre-check to runbook §9.2 step 1, `sudo nginx -T 2>/dev/null | grep -E 'listen .*443'`, and keep `http2` only if every existing 443 listener already has it. Update the conf comment at line 20 to match.

### [MAJOR-2] Runbook step 2 uses `apt-get install -y nginx certbot …`, which upgrades the shared Nginx/certbot
- **Where:** `docs/runbooks/deploy.md` §9.2 step 2
- **Problem:** nginx 1.24 and certbot 2.9 are already installed (journal). `apt-get install <pkg>` upgrades a package that is already installed whenever a newer candidate exists. That restarts or upgrades the Nginx serving every company's production site, which contradicts the step's own note ("không nâng cấp …").
- **Fix:**
  - Replace the command with `sudo apt-get install -y --no-upgrade apache2-utils`, after checking `dpkg -s apache2-utils`.
  - Do not list `nginx` or `certbot`. Just verify `nginx -v` and `certbot --version` in step 1.
  - Add an explicit line: "never upgrade/restart nginx; reload only after `nginx -t` PASS".

### [MINOR-1] The certbot renew hook goes in the global `renewal-hooks/deploy/` directory
- **Where:** runbook §9.2 step 6
- **Problem:** Other sites on the host already use certbot. A hook file in that directory runs for every certificate renewal on the host, and a file with the same name could overwrite another team's hook.
- **Fix:** Pass `--deploy-hook "systemctl reload nginx"` on the `certonly` command, so the hook is stored only in `/etc/letsencrypt/renewal/187-52-119-50.sslip.io.conf`. Check `ls /etc/letsencrypt/renewal-hooks/deploy/` first. Use `systemctl reload nginx` consistently, matching how the host Nginx is managed.

### [MINOR-2] HSTS for one year on a temporary hostname
- **Where:** `docker/nginx/tami-staging-sslip.conf:40` and `:74`
- **Problem:** The header is scoped to this hostname, so other sites are unaffected. But the runbook's fallback, a self-signed cert with `curl -k`, would become impossible to bypass in browsers for a year.
- **Fix:** For this temporary staging, use a short value such as `max-age=86400`, or drop HSTS. Never add `includeSubDomains`/`preload` on sslip.io.

### [MINOR-3] IPv6 listeners can make this site the implicit default server
- **Where:** `docker/nginx/tami-staging-sslip.conf:22`, `docker/nginx/tami-staging-sslip-http.conf:9`
- **Problem:** If no other site listens on `[::]:443`, this server becomes the implicit default for that socket.
- **Fix:** In phase B step 1, check `nginx -T | grep '\[::\]:443'` and confirm the host has IPv6. If nothing else uses it, either accept and document it, or drop the `[::]` listeners.

### [MINOR-4] The task file names the wrong env path
- **Where:** `tasks/tami-website/layer-6-task-01.md:16` and `:108`
- **Problem:** It says `/opt/tami-staging/.env`. `scripts/deploy/deploy.sh:108` defaults to `ENV_FILE=$TAMI_ROOT/staging.env`, which is `/opt/tami/staging.env`.
- **Fix:** Update the task file to the runbook path, which is the correct one.

### [MINOR-5] Copying `.env.example` with both trust flags set to false leaves staging with one shared bucket
- **Where:** `.env.example:86-87`
- **Problem:** Anyone who copies the general block of `.env.example` into `staging.env` gets both flags `false`, which overrides the compose default. Every visitor then shares one rate-limit bucket.
- **Fix:** Runbook step 3 already says not to set `TRUST_*`, and step 11 would catch the problem. Optionally add a check to step 3 that `staging.env` contains no `TRUST_` line.

### [MINOR-6] Small code nits
- **Where:** `src/lib/env.ts:20-24`, `src/lib/security/client-ip.test.ts:432`
- **Problem:** `parseTrustRealIpFlag` duplicates `parseTrustCloudflareFlag` with only the variable name changed, and `trustCloudflareSchema` is now used for X-Real-IP too. In the test, `vi.unstubAllEnvs()` at the end leaks stubbed env into later tests if an assertion fails first.
- **Fix:** Make one helper `parseBoolFlag(name, value)`, and move the unstub into `afterEach`. Non-blocking.

## Rulings on the builder's open items
1. **init.sql symlink check deferred to phase B: accepted.** It cannot be verified without a real Compose run. Runbook step 9 includes the `docker inspect` check (StartedAt and Mounts Source) and the fallback (fixed bind paths, L4-T05 MINOR-2).
2. **BACKUP_ENV_DIR / WAL archive: this blocks phase B, not phase A.**
   - Do not create a dummy `BACKUP_ENV_DIR` with an unreachable target.
   - The worst case is bounded by `BACKUP_ARCHIVE_PUSH_QUEUE_MAX` (staging default 4GiB, against 118 GB free).
   - Safe default: set up a real SFTP/S3 target and run `stanza-create` before the first deploy (task AC line 49).
   - If the user defers backups, set `BACKUP_ARCHIVE_PUSH_QUEUE_MAX=1GiB` in `staging.env`. In phase B, confirm that the queue-max drop really fires in the configured archive mode by watching `pg_wal` size and the pgbackrest log after a test switch-wal. Record the decision in the task file.
3. **Server path: `/opt/tami/staging.env` is correct.** It matches `deploy.sh:108` and `.env.example`. The task file is stale (MINOR-4).

## Verdict
**FAIL** for phase A, because of 2 MAJOR findings (MAJOR-1: a side effect on the shared Nginx socket; MAJOR-2: a runbook command that upgrades shared packages). Both are small edits, one to the conf and one to the runbook. All code, tests, CI and compose changes pass. No CRITICAL findings.

## Residual risk
- `nginx -t` was not run by the reviewer against nginx 1.24. Phase B must run `nginx -t` on the server before every reload.
- The behaviour of the pgBackRest queue-max drop on this deployment has not been checked.
- Let's Encrypt rate limits on sslip.io are handled by the runbook's fallback.
- `pnpm build` was not re-run by the reviewer.
