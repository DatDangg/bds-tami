# feature-production-new-server-tamihomes · phase-1-task-01 — Repo: vhost tamihomes.vn, redirect tên miền cũ, RAM postgres prod, runbook nháp (BL-112)

- Change doc: `spec/changes/2026-11-06-production-new-server-tamihomes.md`
- Phụ thuộc: không. Không chạm server.
- Trạng thái: `done` — reviewer STRICT PASS round 1 (3 MINOR runbook §12.1 đã sửa trước commit).

## Classification / Risk
- Type: MODIFY (config hạ tầng). Risk: **MEDIUM** (vhost production, header bảo mật, IP khách cho rate limit). Review: **STRICT** (security header / IP thật).

## Việc
1. `docker/nginx/tami-prod-tamihomes-http.conf` (cổng 80): `server_name tamihomes.vn www.tamihomes.vn`; ACME webroot `/var/www/certbot`; còn lại `301 https://tamihomes.vn$request_uri`. Không `default_server`.
2. `docker/nginx/tami-prod-tamihomes.conf` (cổng 443), dựa trên `tami-prod-direct.conf` + mẫu host mới `tami-staging-sslip-179.conf`:
   - server chính `tamihomes.vn`, `http2 on;`, upstream `127.0.0.1:3010`, cert `/etc/letsencrypt/live/tamihomes.vn/`.
   - server riêng `www.tamihomes.vn` (cùng cert, SAN gồm www) → `301 https://tamihomes.vn$request_uri`.
   - **Không** `X-Robots-Tag`; HSTS `max-age=31536000` (không includeSubDomains/preload); nosniff, X-Frame-Options, Referrer-Policy.
   - Ghi đè `X-Real-IP $remote_addr`, xoá `CF-Connecting-IP`; `/api/metrics` + `/api/internal/` → 404; giữ Cache-Control ảnh của app; `client_max_body_size 25m`.
   - log_format riêng tên `tami_prod` (tránh trùng tên `log_format` với file staging trên cùng host — nginx báo duplicate).
3. `docker/nginx/tami-prod-genieplatform-redirect.conf` (cài trên **server cũ** ở P3): `tami.genieplatform.cloud` 443 → `301 https://tamihomes.vn$request_uri`, giữ cert cũ; cổng 80 giữ nguyên `tami-prod-direct-http.conf` (ACME gia hạn cert cũ vẫn chạy, cert này có SAN sslip của staging cũ).
4. `docker/docker-compose.prod.yml`: host mới 7.7 GB dùng chung → postgres `mem_limit 1g`, `shared_buffers=256MB`, `effective_cache_size=768MB` (DB 166 MB). Giữ app 1g, jobs 384m, backup 384m. Ghi lý do trong comment.
5. `docs/runbooks/deploy.md` §12 (nháp, hoàn thiện ở P4.T02): production trên server mới — thứ tự P2–P3, lệnh, rollback.

## Verify
- `docker run --rm nginx:1.28 nginx -t` với 3 file + cert tự ký giả (mount) → PASS; không trùng `log_format`/upstream với `tami-staging-sslip-179.conf` (nạp chung khi test).
- `docker compose --env-file <env giả> -f docker/docker-compose.prod.yml config -q` PASS.
- Diff vhost prod mới so với `tami-prod-direct.conf`: chỉ khác server_name/cert/http2/www/log_format.

## Acceptance
- [ ] 3 file vhost + compose + runbook nháp; nginx -t PASS; không đổi file staging.
- Doc impact: runbook §12 (nháp). ARCHITECTURE ở P4.T02.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Decision log (builder)
- Upstream đặt tên `tami_prod_app` (không dùng `tami_app` của prod cũ) và log_format `tami_prod`: host mới nạp chung file staging (`tami_staging*`), tránh trùng tên với bất kỳ file nào.
- Server `www.tamihomes.vn` (443) riêng, `access_log off`, chỉ HSTS + 301 apex; cùng cert (SAN gồm www). Cổng 80 gom apex+www trong 1 server, 301 thẳng về apex https (1 hop).
- File redirect tên miền cũ: không khai log_format/upstream (file `tami-prod-direct.conf` bị thay mang `tami_direct`/`tami_app` đi), `access_log off`, không `http2` (nginx 1.24), giữ HSTS 1 năm cũ, 301 `https://tamihomes.vn$request_uri`.
- Postgres: `mem_limit 2g→1g`, `shared_buffers 512MB→256MB`, `effective_cache_size 1536MB→768MB`; app 1g/jobs 384m/backup 384m giữ nguyên. Comment lý do trong compose.
- Runbook §12 đánh dấu NHÁP (ghi rõ hoàn thiện ở P4.T02); thêm 1 dòng trỏ §12 trong §10; không sửa §1/§11 (job record-staging-pass thuộc P4.T01). Không đụng ARCHITECTURE/docs khác.
- Tooling: máy dev không có python; verify bằng docker (openssl cài trong container nginx để sinh cert giả).

## Evidence
- Files: `docker/nginx/tami-prod-tamihomes-http.conf`, `docker/nginx/tami-prod-tamihomes.conf`, `docker/nginx/tami-prod-genieplatform-redirect.conf` (mới); `docker/docker-compose.prod.yml`, `docs/runbooks/deploy.md` (§12 + 1 dòng ở §10) (sửa). File staging/reject không đổi.
- `nginx:1.28.3-alpine nginx -t` nạp chung 5 file (tami-default-reject, tami-staging-sslip-179{,-http}, tami-prod-tamihomes{,-http}) + cert tự ký giả: syntax ok, test successful (không trùng log_format/upstream).
- `nginx:1.24.0-alpine nginx -t` nạp tami-prod-genieplatform-redirect.conf + tami-prod-direct-http.conf (+ cert giả): syntax ok, test successful.
- `docker compose --env-file <env giả> -f docker/docker-compose.prod.yml config -q`: rc=0; config render có `shared_buffers=256MB`, `effective_cache_size=768MB`, postgres `mem_limit` 1073741824.
- Diff vhost 443 prod mới vs `tami-prod-direct.conf` (bỏ comment): chỉ khác log_format/upstream tên, `http2 on;`, server_name, cert path, access/error log path, thêm server www; header/proxy/location y nguyên.
- Chưa kiểm: chạy thực (curl) vhost, chưa chạm server.
