Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-1-task-01 · round 1 (BL-111)

- Task: `tasks/feature-staging-new-server-nginx-tamihomes/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`
- Review level: **NORMAL**
- Reason: Infra config and docs only. No `src/`, schema, API or auth code changed. The compose change is limited to comments and the text of the `:?` error message (values and required vars were checked and are unchanged). The Nginx security behaviour (real IP for rate limiting, header stripping, 404 on internal routes) carries MEDIUM risk, so I covered it by diffing against the sslip conf plus nginx -t and an in-container runtime smoke test.
- Blast radius: new files `docker/nginx/tami-staging-tamihomes{,-http}.conf` and `tami-default-reject.conf`, which only take effect once installed on the new server 179.197.242.57. `tami-staging-sslip{,-http}.conf` gain only a header comment. `docker-compose.staging.yml` (comment + message). Docs: `docs/runbooks/deploy.md` §3.4/§9/§11, `docs/ARCHITECTURE.md` §6.1/§6.2/§6.3, `.context/project-config.md`, `.context/decisions.md`, `.env.example`. Production confs (`tami-prod-direct*`) are unchanged.
- Scope: I ignored the runbook §1 hunks (lines ~12, ~24-31), which belong to phase-1-task-02, and the other unrelated dirty hunks in ARCHITECTURE.

## Verify commands + result

| Command | Result |
|---|---|
| `diff tami-staging-sslip.conf tami-staging-tamihomes.conf` | Differences are limited to header comments, `log_format` name (`tami_staging_sslip`→`tami_staging`), listen comment, `http2 on;`, `server_name`, cert paths, and the basic-auth comment. Every security directive is identical. |
| `diff tami-staging-sslip-http.conf tami-staging-tamihomes-http.conf` | Only comments and `server_name` differ. ACME webroot and 301 are unchanged. |
| `docker run nginx:1.28-alpine nginx -t` (3 confs in conf.d + self-signed dummy cert under `/etc/letsencrypt/live/staging.tamihomes.vn/`) | `nginx/1.28.3` — syntax is ok / test is successful (rc=0) |
| Runtime smoke in the same container (curl) | Unknown SNI on 443 → TLS handshake rejected (curl rc=35). SNI `staging.tamihomes.vn` → `HTTP/2`. `/api/metrics` → 404 with `X-Robots-Tag`, HSTS `max-age=86400`, `X-Frame-Options`, `Referrer-Policy`. `/api/internal/x` → 404 over h2. `/api/media/file/x` (no upstream, 502) → `Cache-Control: private, no-store` plus repeated noindex/HSTS headers. Port 80 with Host staging → `301 https://staging.tamihomes.vn/a?b=1`. ACME file served as text. |
| `docker compose -f docker/docker-compose.staging.yml config -q` (17 required vars = dummy) | rc=0. With `NEXT_PUBLIC_SITE_URL` unset it still fails as required (new message: "vd https://staging.tamihomes.vn"). |
| `bash scripts/deploy/deploy.test.sh` | "Tất cả test PASS" (1 SKIP: no flock) |
| `git grep -n -i sslip -- docker/docker-compose.staging.yml .env.example docs/ARCHITECTURE.md .context/project-config.md` | 5 hits remain, all describing the old server / standby. Matches acceptance. |
| `pnpm typecheck` / test | skip — no `src/` change |

Test note: in the alpine container, port 80 with an unknown Host also returned 301. This is a test artefact: the image's `default.conf` has no `default_server`, so alphabetical order made the staging vhost the port-80 default. On Ubuntu, `sites-enabled/default` declares `listen 80 default_server` / `[::]:80 default_server`, and the new http vhost does not set `default_server`, so it does not take over port 80. The runbook already says "Cổng 80 giữ site `default` của gói nginx" (port 80 stays with the package's `default` site).

## Security preservation checklist (443 conf vs sslip)

| Behaviour | Result |
|---|---|
| `proxy_set_header X-Real-IP $remote_addr` (overwrite) | OK, identical |
| `proxy_set_header CF-Connecting-IP ""` | OK |
| `proxy_set_header Authorization ""` | OK |
| `X-Robots-Tag noindex, nofollow, noarchive` at server level + repeated in `/api/media/file/` | OK (verified at runtime) |
| HSTS `max-age=86400`, no includeSubDomains/preload | OK |
| `client_max_body_size 25m` | OK |
| 404 for `= /api/metrics` and `^~ /api/internal/` | OK (verified at runtime) |
| Media cache override (`proxy_hide_header Cache-Control` + `private, no-store`) + repeated security headers | OK |
| Upstream `127.0.0.1:3011`, keepalive, `X-Forwarded-For $remote_addr` | OK |
| Basic auth OFF, 2 lines commented (Q1) | OK |
| `http2 on;` valid on 1.28 (per-server ≥1.25.1); host has no other 443 site | OK — ALPN negotiates h2 for staging SNI |
| `tami-default-reject.conf`: `listen 443 ssl default_server` + `[::]:443`, `ssl_reject_handshake on`, no cert | OK — `nginx -t` PASS, handshake rejected. No duplicate listen options (no `ipv6only`). Port 80 untouched. Comment forbids installing on the old server. |

## Responsive Checklist Gate
N/A — no UI in the diff (nginx/docs/config only).

## Skill gates
- aislop: N/A — no app code (TS/JS) in the diff.
- oxlint (anti-slop): N/A — no TS/JS in the diff.
- ocr (open-code-review): skip, not run (no app code; infra conf verified by nginx -t + runtime smoke).
- AI-readable: OK — 0 AI-chaos indicators in new files. Comments explain WHY (http2, default_server, HSTS, cache). ARCHITECTURE and the runbook were updated with the flow change.
- ai-friendly-web: N/A — staging is deliberately noindex. Not a public production site.
- blitzstrike: N/A — NORMAL level, not an auth/API change.

## Findings

No CRITICAL. No MAJOR.

- **[MINOR] `docs/ARCHITECTURE.md:443`** — "`listen 443 ssl http2;` (không `http2 on;`) để chạy được nginx 1.18 và 1.24." This is now wrong: the new staging vhost uses `http2 on;` (and the sslip conf never had http2). Fix: change it to something like "prod/Cloudflare confs: `listen 443 ssl http2;` for nginx 1.18/1.24; new staging host (nginx 1.28): `http2 on;` per server; sslip: HTTP/1.1."
- **[MINOR] `docs/ARCHITECTURE.md:451`** (§6.3, row right below the edited "Tên miền" cell) — the Staging "Truy cập" cell still says "Basic auth + `noindex`". That contradicts Q1 / Decision 12 (public + noindex). Fix: "Công khai + `noindex` (không basic auth — Decision 12)".
- **[MINOR] `docs/runbooks/deploy.md` §11.2 step 2** — the heading says "không nâng cấp gói khác" (no other packages upgraded), but `apt-get install --no-upgrade` only stops upgrades of packages *named on the command line* that are already installed. Since nginx/certbot are not installed yet, the flag does nothing, and apt can still upgrade dependency libraries (e.g. libssl) on a shared host with 31 pending updates. Fix: add a dry-run first, `apt-get install -s --no-upgrade nginx certbot | grep -E '^Inst'`, and stop to ask the user if any already-installed package would be upgraded.
- **[MINOR] `docs/runbooks/deploy.md` §11.3 step 1** — it requires an owner `deploy`, but the new server has no `deploy` user (change doc: "Không có user `deploy`"). §11 never creates the user, its docker group membership, or `authorized_keys` for the CI key, and the reference to §3.1 covers directories only. The acceptance "đủ để người khác dựng lại" (enough for someone else to rebuild) is not fully met. Fix: add a step that points to §9.2 step 2 (create `deploy` + `docker` group + `install -d`), plus `authorized_keys` for the CI key.
- **[MINOR] `docs/runbooks/deploy.md` §11 intro (line ~357)** — "Production vẫn ở server cũ; cổng staging.history…" repeats the sentence just above it ("Production vẫn ở server cũ 187.52.119.50…"). If this line came from phase-1-task-02, merge it when that task closes. Otherwise merge it into the previous sentence.
- **[MINOR / follow-up, not this builder's file] `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md:30,35,44`** — the change doc still describes basic auth ("basic auth", "401 basic auth"), which conflicts with user decision Q1 recorded in the task and Decision 12. Primary/change-request should update the change doc when archiving, so smoke tests in later phases don't expect 401.

Notes (no fix needed): server facts in §11/ARCHITECTURE §6.1 match the brief: 179.197.242.57, Ubuntu 26.04, nginx 1.28.x / certbot 4.0.x, fingerprint `SHA256:5uzqgi5o4/BsMUm9/Fy39nXoMNQP/x1MvzYtJKXIs94`, shared-host prohibitions (ufw/apt upgrade/reboot/sshd/prune), no AAAA. Staging has no backup: ARCHITECTURE §6.2 (`backup` staging = none) and runbook §11.3 (do not set `BACKUP_ENV_DIR`) agree. No intent docs (BRD/PRD/SPECIFICATIONS) were touched. `.context/decisions.md` adds only Decision 12. `project-config.md` changes only the `deploy_platform` line.

## Residual risk
- Not tested on a real Ubuntu 26.04 host with the actual `sites-enabled/default` file, nor over IPv6 (the container smoke test used IPv4 loopback only). The real check is §11.4 smoke after deploy.
- I did not verify `X-Real-IP` reaching the app end to end (no upstream app in the container). The directive is identical to sslip, which runs in production-like use. §11.4 has a 2-IP → 2-bucket check.

## Verdict
✅ **PASS** — no CRITICAL/MAJOR. All 5 MINORs are doc accuracy issues. I recommend fixing the two ARCHITECTURE lines and the two runbook §11.2/§11.3 steps before phase-2 runs on the server (they can go in this commit if the builder has a quick round; they do not block PASS).
