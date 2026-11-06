Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-3-task-01 · round 1 (BL-111)

- Review level: **STRICT**
- Reason: client-IP rate limiting (X-Real-IP trust), public exposure and security headers, TLS/cert renewal, and a shared production-class host (another project's nginx site and certbot cert now live on the same host).
- Blast radius: nginx on 179.197.242.57 (TAMI vhosts + `tami-default-reject.conf` default_server 443, which now also covers the foreign site `outfitai.genieplatform.cloud`); global certbot deploy hook `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`, which runs for every cert on the host; containers `tami-staging-app`/`jobs`; operator docs (runbook §11, Decision 12, ARCHITECTURE §6, project-config, `.env.example`, compose comments).

## Verify commands + result
- Project verify commands (typecheck/lint/test): skipped. BL-111 changes nothing under `src/`; the diff is only nginx conf, docs, YAML comments and `.env.example` comments. Other dirty `src/**` files belong to other work and were not reviewed.
- aislop / oxlint: N/A (no TS/JS in scope). ocr: skipped, not installed / not needed. blitzstrike: skipped, not installed. Instead, handshake, header and path checks were done by hand from outside.
- AI-readable: OK (only renames and literal text replacements). ai-friendly-web: N/A, because this is staging and is meant to be `noindex` + `Disallow: /`.
- Responsive Checklist Gate: **N/A**, the diff does not touch UI.

### Repo
| Check | Result |
|---|---|
| `git diff -M HEAD` of the 443 conf vs `HEAD:docker/nginx/tami-staging-tamihomes.conf` | OK. Only comments, `server_name` and the 2 `ssl_certificate*` paths changed. Headers, X-Real-IP override, CF-Connecting-IP clear, 404 locations, 25m limit and media no-store are unchanged. |
| 80 conf rename | OK. Comments + `server_name` only. |
| `tami-staging-sslip{,-http}.conf` | OK. Only line 1 comment changed. |
| `git grep staging.tamihomes.vn` (live docs/config) | OK. Remaining hits are only the history note in decisions.md:115, progress.json (title/blockedReason, to be updated at close-out), the change doc (has the "user changed decision" section) and the BACKLOG row. None are config. |
| ARCHITECTURE BL-111 lines | Lines 572/580 are literal replacements. The "Tên miền" table row (~650) is NOT literal (drops "chưa Cloudflare — 2026-10-23" and "server mới 179.197.242.57, BL-111"). This looks like part of the unrelated restructure; see MINOR-3. |
| runbook §1 | OK. It refers to the server by IP / two-server model, with no hostname. |

### Server (read-only, `ssh server`)
| Check | Result |
|---|---|
| sha256 (CR stripped) of the 3 confs, repo vs `/etc/nginx/sites-available` | Equal: 54323ffe…, 2b6f15a1…, a11af230… |
| sites-enabled | `default`, `outfitai.genieplatform.cloud` (04:21), `tami-staging-sslip-179-http.conf` (05:15), `tami-staging-sslip-179.conf` (05:18), `tami-default-reject.conf` (05:18). The old `tami-staging-tamihomes*` files are gone. |
| `nginx -t` / `nginx -T` | OK. No duplicate server_name. `default_server` exists only on :80 (package `default`) and :443 (TAMI reject). outfitai uses `listen [::]:443 ssl ipv6only=on` + `listen 443 ssl` with no default_server. |
| Cert | CN/SAN `179-197-242-57.sslip.io`, issuer LE YE2, valid until 2027-02-04. |
| Renewal conf | `authenticator = webroot`, `webroot_path = /var/www/certbot`, no hook in the conf. **`account = 9a2194ce…`, the account created 04:27:34 by the outfitai certbot run** (see MAJOR-1). No contact email: regr body `{}`. |
| Hook | `reload-nginx.sh` is root:root 755 and contains `nginx -t && systemctl reload nginx`. Last dry-run: "all simulated renewals succeeded" (05:18:39). |
| certbot.timer | enabled + active, next run 17:50 UTC. |
| staging.env | `grep -c ^NEXT_PUBLIC_SITE_URL=` = 1, exact new value = 1, `tamihomes` = 0, deploy:deploy 600. |
| Containers | app and jobs started 05:15:42, image `sha256:d900ca9e…` = `state/staging.current`. postgres/redis started 04:09:09 and seaweedfs 04:12:48, all unchanged. printenv in app and jobs = new URL; `TRUST_X_REAL_IP=true`, `TRUST_CF_CONNECTING_IP=false`. |
| Client bundle | `grep staging.tamihomes.vn /app/.next` = 0 files. |
| `free -h` | used 3.8Gi / 7.7Gi, available 4.0Gi, swap 52Mi used. |

### From outside (dev machine, a few GETs + one 27 MB POST)
| Check | Result |
|---|---|
| HTTPS without `-k` | 200, `ssl_verify_result=0`. |
| Headers on `/` | `X-Robots-Tag: noindex, nofollow, noarchive`, `Strict-Transport-Security: max-age=86400`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`. No `WWW-Authenticate`. |
| `/en` | 200 |
| robots | `User-Agent: *` / `Disallow: /` |
| sitemap / canonical / og | All 11 `<loc>` entries, the canonical, `og:url` and `og:image` use `https://179-197-242-57.sslip.io`. |
| `/api/metrics`, `/api/internal/x` | 404 / 404 |
| `http://` | 301 → `https://179-197-242-57.sslip.io/` |
| Unknown SNI (`--resolve x.invalid`) and `https://179.197.242.57/` | TLS handshake rejected (curl 35). |
| Media GET | 200 image/webp, `Cache-Control: private, no-store` + repeated security headers. HEAD returns 404 because Payload doesn't handle HEAD; this is not related to this task. |
| POST 27 MB to `/api/public/job-applications` | 413 |
| Real IP | Access-log column 1 shows only real IPs (14.248.69.150 dev, 187.52.119.50 old server, a few external). App logs since 05:15 contain 0 lines matching "không xác định IP / chung 1 bucket". 1 warn line is the builder's intentional bad-body 400 test. |
| outfitai | 502 with a valid cert (SNI). This is their upstream crash-loop and not caused by TAMI. |

## Findings

### [MAJOR-1] Docs and evidence still say "only TAMI uses 443/certbot", but the host now has another project's site and cert, and TAMI changed that site's default behaviour
What the server shows:
1. `outfitai.genieplatform.cloud` was enabled at 04:21 with a 443 server and got a certbot cert (`--nginx`) at 04:27. TAMI's `tami-default-reject.conf` (443 `default_server`, `ssl_reject_handshake`) was enabled **later, at 05:18**.
   - Before that, outfitai was the implicit default server for :443.
   - Now clients without SNI, and HTTPS requests to the bare IP, can no longer reach outfitai (handshake rejected).
   - Real-world impact is small (modern clients send SNI), but TAMI changed another project's behaviour on a shared host without that being documented.
   - Builder Evidence 10 ("xuất hiện… sau lúc TAMI cài") is wrong for the 443/reject part.
2. TAMI's cert was issued under the **existing ACME account `9a2194ce…`, which outfitai's certbot run created**. `--register-unsafely-without-email` did nothing because certbot reused that account.
   - Both projects' renewals now depend on one account directory.
3. The global deploy hook `reload-nginx.sh` also runs after outfitai renewals. That is harmless: one extra graceful reload after `nginx -t`, and their nginx installer reloads anyway. It still needs to be documented as shared.
4. Runbook §11.3 step 3 tells the operator to run `sudo certbot renew --dry-run` with **no `--cert-name`**. That also dry-runs outfitai's nginx-authenticator cert, which temporarily edits nginx config and reloads it. This breaks the shared-host rule "không đụng dự án khác". The builder actually used `--cert-name`.

Stale claims to fix:
- `docs/runbooks/deploy.md:365` ("không ai dùng 80/443")
- `docs/runbooks/deploy.md:387` ("host này chỉ TAMI dùng certbot"; dry-run without `--cert-name`)
- `.context/decisions.md:109` (Context "không ai dùng 80/443") and `:112` (Rationale "Host mới chưa site 443 nào")
- `docs/ARCHITECTURE.md:401`, `:443` ("chỉ TAMI dùng 443")
- `docker/nginx/tami-staging-sslip-179.conf:3`, `:22`
- `docker/nginx/tami-default-reject.conf:2` ("host mà TAMI là chủ duy nhất của nginx cổng 443")

Suggested fix (docs/comments only, no server change needed):
- Record the coexistence in runbook §11.1/§11.3 + Decision 12 Consequences + ARCHITECTURE §6.1, and add the same to the conf comments:
  - `outfitai.genieplatform.cloud` site (443, certbot `--nginx`);
  - TAMI's reject site is the 443 default for every vhost on the host;
  - the deploy hook is shared;
  - the ACME account is shared;
  - adding or removing a `default_server` must be coordinated with that project.
- Change the dry-run line to `sudo certbot renew --dry-run --cert-name 179-197-242-57.sslip.io --no-random-sleep-on-renew`.
- Fix task Evidence 10 so it states the real timeline (outfitai at 04:21/04:27, before TAMI's 443/reject at 05:18).
- Tell the user and the outfit-changer owner (already listed under Residual): TAMI's default-reject now applies to their non-SNI/IP clients, and the ACME account and hook are shared.

### [MINOR-1] The header nav (CMS data) still links to the old staging host
`/`, `/du-an` and `/lien-he` HTML contain `https://187-52-119-50.sslip.io/du-an/maison-privee`, `…/the-windsor-collection` and `…/the-president-park-444`. These are absolute links in the Header global ("Dự án 1/2"), copied over with the staging data. Visitors leave the new staging for the old backup server, and the links break when the old staging is shut down.
- Fix: a content editor changes them to relative `/du-an/<slug>`. This is a data change; no code change and no repo diff needed. Add it to Residual / user tasks.

### [MINOR-2] Close-out text still says `staging.tamihomes.vn`
- `.context/progress.json:3411` (title) and `:3489` (blockedReason)
- `spec/changes/BACKLOG.md:121` (title)
- change doc acceptance line 44, plus the task title (line 1) and Việc 1–3

Fix: update them at close-out to `179-197-242-57.sslip.io` and remove U1/U4 from blockedReason. Historical text can stay if it is clearly marked as superseded.

### [MINOR-3] One ARCHITECTURE line is not a literal replacement
The ARCHITECTURE "Tên miền" row (diff ~648→650) is not only the literal `staging.tamihomes.vn` → `179-197-242-57.sslip.io` replacement the task file promised: it also drops wording. I can't tell whether this comes from BL-111 or from the unrelated ARCHITECTURE restructure in the working tree.
- Fix: confirm who owns that edit before committing BL-111. Commit only the BL-111 hunks (e.g. `git add -p`).

### Non-blocking residuals (no finding)
- Acceptance item 3: Turnstile is still waiting for U2 (user to add the hostname). The 413 limit was confirmed by the reviewer.
- The 6 screenshots under Việc 3 were not taken. There is no UI change, so this is acceptable as residual.
- outfit-changer is crash-looping (502). That belongs to the other project.
- Not verified by the reviewer: HTTP/2 negotiation (schannel curl used HTTP/1.1; `http2 on` is present in `nginx -T`); IPv6 path (no AAAA record via sslip for this name).

## Verdict: FAIL
1 MAJOR (MAJOR-1: wrong operational docs and evidence about the shared host, plus a runbook command that touches another project's cert). It is a docs/comments-only fix. Everything else checked on the server and from outside passes: certificate, headers, real client IP, 413, isolation, image digest, data containers untouched.
