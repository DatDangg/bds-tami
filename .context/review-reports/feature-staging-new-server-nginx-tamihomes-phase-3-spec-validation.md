Agent: spec-validator

# Spec validation — BL-111 `feature-staging-new-server-nginx-tamihomes` (phase 3 / all phases, round 1)

- Mode: phase review after build plus a check of the uncommitted spec-publish (SPECIFICATIONS 1.62.1, spec/updates, CHANGELOG, test-scope v108).
- Date: 2026-11-06.
- Inputs:
  - change doc `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`, including "Quyết định khi duyệt plan" and "Đổi quyết định"
  - tasks P1.01–P3.02
  - review reports P1.01–P3.01 (P3.01 round 2 PASS)
  - commits 940ab50c, fd524e26, e49d01f2, 55e52730, 0bcab51d, 98c08b2a
  - working-tree diff of the spec-publish files

## Verdict: PASS (2 minor gaps that do not block; close-out items remain for P3.02)

- No ❌ and no HIGH conflict. There are 2 ⚠️, which is under the FAIL threshold of 3.
- All 4 acceptance items in the amended change doc are met, or their remaining parts are tracked as user dependencies.
- The spec publish is correct: PATCH bump, base URL, known blockers, and the intent text is not lowered.

## Live check (read-only, 2026-11-06)
- `curl -sI https://179-197-242-57.sslip.io/` returned `HTTP/1.1 200 OK`, `X-Robots-Tag: noindex, nofollow, noarchive` and `Strict-Transport-Security: max-age=86400`. There was no `WWW-Authenticate`, so no basic auth.
- `/robots.txt` returned `User-Agent: *` / `Disallow: /`.
- `/api/health` returned 200.

## Coverage matrix

| # | Requirement (as amended) | Source | Status | Evidence / note |
|---|---|---|---|---|
| A1 | `https://179-197-242-57.sslip.io` has valid HTTPS, is public with no basic auth, is noindex and points to the new server | change doc Acceptance:44, Q1:50, Đổi quyết định:58 | ✅ | P3.01 Evidence 4–7 (LE YE2, expires 2027-02-04, ssl_verify_result=0); live curl above; review P3.01 r2 PASS |
| A2 | CI deploy to staging runs on the new server and the health check passes | Acceptance:45 | ✅ | P2.03: run 42163804119 green on all 3 jobs (commit 0bcab51d); runbook §11.3 step 6 |
| A3 | Rate limit uses the real client IP through Nginx | Acceptance:46 | ✅ | P3.01 Evidence 8: IP 14.248.69.150 got 429 while 187.52.119.50 got 400, so there are 2 buckets; the access log shows the real IPs; no "chung 1 bucket" log lines |
| A4 | Runbook, ARCHITECTURE and project-config updated; no reference to the old sslip host as the current staging | Acceptance:47 + Đổi quyết định:60 | ✅ / ⚠️ | runbook §11 (deploy.md:355–400), project-config:45, Decision 12 (decisions.md:107–115) and ARCHITECTURE §6.1/§6.3 are updated. `git grep` shows no live config or source pointing at `staging.tamihomes.vn`. The old sslip host appears only in "server cũ / dự phòng" sections. One conflict remains, see G1. |
| R3 | Nginx vhost (noindex, HSTS, X-Real-IP overwrite, body size) proxies to 127.0.0.1:3011; HTTPS renews automatically | change doc §Phải làm 3 | ✅ | `docker/nginx/tami-staging-sslip-179{,-http}.conf`; repo and server conf sha256 match (review r2); `certbot renew --dry-run --cert-name` PASS; certbot.timer is active; hook `renewal-hooks/deploy/reload-nginx.sh` |
| R4 | `deploy` user, CI key, deploy directory, swap | §Phải làm 4 | ✅ | P2.01 (commit e49d01f2): swap 4G, user deploy. The backup-env part does not apply to staging (change doc:54). |
| R5 | Ports 80/443 reachable from outside | §Phải làm 5 | ✅ | P2.01 curl from outside; P3.01 smoke from outside |
| R6 | `NEXT_PUBLIC_SITE_URL` plus everything that uses the URL (sitemap, robots, email link, Zalo share) | §Phải làm 6 | ✅ (partly residual) | staging.env has exactly 1 line with the new value; sitemap `<loc>`, canonical, og:url and og:image use the new host (Evidence 7). The Zalo/FB share link was not smoked directly, but `ShareButtons.tsx:83` takes the `url` prop, which comes from the same runtime env as canonical. Low risk; it is in test-scope `impact.dependents`. |
| R7 | GitHub env `staging` (DEPLOY_HOST, KNOWN_HOSTS fingerprint) | §Phải làm 7 | ✅ | runbook §11.1 fingerprint and §11.3 step 6; P2.03 |
| R8 | Smoke: VI/EN, health, noindex, 2 IPs give 2 buckets, image/CV upload | §Phải làm 8 | ✅ / residual | 413 for 26 MB passes. A real image/CV upload and admin login with a real CV download are still **waiting on the user** (progress.json:3481, "Chờ user: login admin + tải CV thật"). This is listed in test-scope dependents. |
| Q2 | Production gate holds across 2 servers (`record-staging-pass`) | Q2:51 | ✅ | commit fd524e26 (deploy.yml, ssh-deploy action, deploy.sh `record-staging`, state.sh, deploy.test.sh); P2.03 shows a new `staging.history` line on the old server |
| Q3 | Data moved from old staging; old staging kept running as a fallback | §Phải làm 2, Q3 | ✅ | P2.02 (55e52730): 185 tables match, public and private media match; runbook §11 line 358 says it keeps running until the user turns it off |
| T | Turnstile: add hostname `179-197-242-57.sslip.io` to the staging site key (U2) | Đổi quyết định:60 | Residual, tracked | P3.01 Acceptance:31 and Residual; progress.json:3494; test-scope `knownBlockers`. Not yet in BACKLOG (see close-out). |
| S1 | Spec delta is a PATCH with no requirement change, and intent is not lowered | P3.02 step 1; AGENTS.md Doc Impact | ✅ | `SPECIFICATIONS.md:346` keeps "Staging chặn truy cập công khai + noindex" and the Cloudflare line. The new as-built sub-bullet at :347 records the deviation as a user decision (Decision 12). Intent is not rewritten. |
| S2 | spec-publisher: 1.62.0 → 1.62.1, spec/updates, CHANGELOG, test-scope +1 | P3.02 step 2 | ✅ / ⚠️ | header `spec_version: 1.62.1`, `updated_at 2026-11-06`; `spec/updates/2026-11-06-…md`; CHANGELOG row 1.62.1 → scope v108; `previousScope` archive `test-scope-1.62.0-107.json` exists; `environment.stagingBaseUrl` = new host; old staging marked frozen and not to be tested; Turnstile known blocker; nav-link content note. See G2. |
| S3 | test-scope base URL is the new one (not `staging.tamihomes.vn` as written in the old P3.02 text) | P3.02:13 vs Đổi quyết định | ✅ | test-scope correctly uses `https://179-197-242-57.sslip.io`; the P3.02 task text is stale (close-out) |

## Gaps

### ⚠️ G1 [PARTIAL] ARCHITECTURE §6.1 gives the SSH alias `server` to both servers
- Requirement: A4 / §Phải làm 6, which needs ARCHITECTURE §6 to match the as-built state.
- Task: P3.02 step 3 (doc reconcile).
- Detail:
  - `docs/ARCHITECTURE.md:380` (working tree) still says the old server is "SSH alias `server` (`root@187.52.119.50`)". At HEAD, line 248 adds key `id_ed25519_trungpq`.
  - `:397`, runbook §11.1:364 and project-config:45 all say alias `server` = 179.197.242.57.
  - The change doc (:12) says the old IP is alias `server-old`. No live doc mentions `server-old`.
- Risk: an operator could run a production or old-server command on the new staging host.
- Fix: change :380 to `server-old`. Add the alias to runbook §9/§10, where the commands assume `server`.
- Related item in the same file: `docs/ARCHITECTURE.md:459` "Runbook: … §9 (staging)" should point to §11 (current staging), with §9 as the old-server fallback.

### ⚠️ G2 [PARTIAL] test-scope v108 metadata is incomplete
- Requirement: S2.
- Task: P3.02 step 2.
- Detail:
  - `spec/test-scope/current.json` `changed.files` leaves out files the commits changed:
    - `docker/docker-compose.staging.yml`
    - `.env.example`
    - `scripts/deploy/deploy.test.sh`
    - the comment edits in `docker/nginx/tami-staging-sslip{,-http}.conf`
  - It has no `reviewReport` / `specValidation` field. Earlier scopes have these (v107 did).
- Impact on testers is low: there is no app code and the base URL is correct. The gap is in traceability only.
- Fix: add the missing files, `reviewReport` (P3.01 r2) and `specValidation` (this report).

### Close-out checklist (P3.02 is still `in_progress`; not counted as gaps, but must be done before commit)
1. Change doc Acceptance:47 still says "không còn tham chiếu sslip.io cho staging". After "Đổi quyết định" this contradicts itself. Reword it to "không còn tham chiếu staging cũ `187-52-119-50.sslip.io` / `staging.tamihomes.vn` như staging hiện hành", tick the boxes, set `status: done`, and move the file to `spec/changes/archive/`.
2. `tasks/…/phase-3-task-02.md:12-13` still says `staging.tamihomes.vn`. Add an "Đổi quyết định" note, or update the lines and tick Acceptance.
3. The `spec/changes/BACKLOG.md:121` BL-111 title still says "tên miền staging.tamihomes.vn". Set the status to done and add these residuals: Turnstile U2; admin login + real CV download (user); tell the outfitai owner; turning off old staging waits on the user. BL-105 note: new domain (P3.02 step 3).
4. `progress.json`: P3.02 done; work item done.
5. Commit hygiene (reviewer MINOR-3 residual): the working tree has an unrelated large ARCHITECTURE restructure (+498/−318 across ARCHITECTURE/INDEX/BACKLOG), plus `src/**` changes not related to BL-111. Stage only BL-111 hunks and the spec-publish files, and check with `git diff --cached`.

### Residual risk (tracked, needs the user)
- Turnstile: contact, apply and newsletter forms are expected to fail on the new host until U2 is done. This is in test-scope `knownBlockers` and the P3.01 Residual. Runbook §11 has no explicit Turnstile hostname step, while §10.1 step 3 has one for production. It is worth adding to §11.3 step 1.
- Admin login and private CV download on the new staging have not been verified by the user (progress.json:3481).
- The share link was not smoked directly (it derives from the same runtime env as canonical).
- The CMS header nav links to the old sslip host. This is a content issue, noted in test-scope `testNotes`.
- outfitai shared host: the default-reject 443, shared ACME account and shared hook are documented (runbook §11.1, Decision 12), but the owner has not been told yet.
- HTTP/2 and IPv6 were not checked from outside (reviewer r2).

## Doc impact
- As-built docs (runbook §11, ARCHITECTURE §6, project-config, Decision 12) are reconciled, apart from G1.
- Intent docs: SPECIFICATIONS keeps its intent text and only an as-built sub-bullet was added, which is correct.
- No gap register exists (`docs/changes/*GAP*` returned no files). The intent-vs-as-built deviation ("staging chặn truy cập công khai") is recorded by Decision 12 and the as-built bullet.
