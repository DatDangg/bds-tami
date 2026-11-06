# feature-staging-new-server-nginx-tamihomes · phase-1-task-01 — Repo: vhost Nginx staging.tamihomes.vn + docs/config hạ tầng staging mới (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md` (BACKLOG BL-111).
- Phụ thuộc: không. Không cần DNS. Không chạm server.
- Trạng thái: `awaiting_review` (builder xong 2026-11-06) — plan duyệt 2026-11-06; Q1 = KHÔNG basic auth (giữ mở công khai + noindex, 2 dòng auth_basic để comment).

## Classification / Risk
- Type: **MODIFY** (hạ tầng deploy/runbook; không đổi code app, không schema/API).
- Risk: **MEDIUM** — cấu hình Nginx quyết định IP thật cho rate limit (`X-Real-IP`), header bảo mật, chặn `/api/internal/` + `/api/metrics`, noindex.
- Expected review level: **NORMAL** (STRICT nếu builder đụng `docker-compose.staging.yml` ngoài comment hoặc `src/`).
- Blast radius: chỉ file mới trong `docker/nginx/` + tài liệu. Production (`tami-prod-direct*.conf`, server cũ) KHÔNG đổi.

## Việc
1. `docker/nginx/tami-staging-tamihomes-http.conf` (cổng 80): copy từ `tami-staging-sslip-http.conf`, `server_name staging.tamihomes.vn;`, ACME webroot `/var/www/certbot` + 301 HTTPS. Không `default_server`.
2. `docker/nginx/tami-staging-tamihomes.conf` (cổng 443): copy từ `tami-staging-sslip.conf`, giữ nguyên: upstream `127.0.0.1:3011`, `X-Real-IP $remote_addr` ghi đè, xoá `CF-Connecting-IP`, `Authorization ""`, `X-Robots-Tag noindex`, HSTS (giữ 1 ngày, không includeSubDomains — `tamihomes.vn` gốc để dành production), `client_max_body_size 25m`, 404 cho `/api/metrics` + `/api/internal/`, ghi đè cache `/api/media/file/` (lặp header).
   Đổi: `server_name staging.tamihomes.vn;`, cert `/etc/letsencrypt/live/staging.tamihomes.vn/{fullchain,privkey}.pem`, log `tami-staging.access.log` giữ tên.
   Host MỚI chỉ có TAMI dùng 443 + nginx 1.28 → bỏ các comment "host dùng chung nginx 1.24 / crm-dhp…" không còn đúng, được phép `http2 on;` (directive riêng từng server ở ≥ 1.25.1) — tuỳ builder, ghi Decision log.
   Basic auth: theo trả lời Q1 (mặc định = như hiện tại: **tắt**, comment sẵn 2 dòng để bật).
3. `docker/nginx/tami-default-reject.conf` (mới, tuỳ chọn — builder đề xuất, reviewer duyệt): server `listen 443 ssl default_server; ssl_reject_handshake on;` để truy cập HTTPS bằng IP/hostname lạ không rơi vào vhost staging (host mới chưa site 443 nào khác). Cổng 80 giữ site `default` của gói nginx.
4. Giữ nguyên `tami-staging-sslip*.conf` (server cũ vẫn chạy song song); thêm comment đầu file: "server cũ 187.52.119.50, dự phòng tới khi user tắt".
5. Docs (as-built, không đổi intent):
   - `docs/runbooks/deploy.md`: mục mới **§11 Staging trên server mới (179.197.242.57, staging.tamihomes.vn)** — bố cục server, nguyên tắc host dùng chung mới (không ufw/upgrade/reboot/sshd, không đụng container dự án khác, nginx do TAMI cài nên được `systemctl reload`), cài nginx/certbot (`--no-upgrade`, `NEEDRESTART_MODE=l`), chuyển dữ liệu (phase-2-task-02), certbot, smoke. §3.4 + §9 đánh dấu "server cũ, dự phòng". Đường dẫn cert / known_hosts / fingerprint ED25519 `SHA256:5uzqgi5o4/BsMUm9/Fy39nXoMNQP/x1MvzYtJKXIs94`.
   - `docs/ARCHITECTURE.md` §6.1: thêm bảng server staging mới (Ubuntu 26.04, 2 vCPU, 7.7 GB RAM + swap, 96 GB, Docker 29.9/Compose 5.6, Nginx host do TAMI cài; dự án khác ra ngoài bằng cloudflared). **File đang dirty từ việc khác → chỉ sửa §6.1, commit bằng `git add -p`/hunk riêng, không cuốn hunk lạ.**
   - `.context/project-config.md`: `deploy_platform` ghi rõ staging = server mới + Nginx/LE `staging.tamihomes.vn`, production = server cũ `tami.genieplatform.cloud`.
   - `.context/decisions.md`: Decision mới "Staging dùng Nginx host + Let's Encrypt trên server mới, không Cloudflare Tunnel" (lý do: user 2026-11-06; IP thật qua `$remote_addr`; tunnel quick của dự án khác không ổn định/không giữ hostname).
   - `.env.example` dòng 61/108/114 + comment `docker-compose.staging.yml` (dòng `NEXT_PUBLIC_SITE_URL` ví dụ): thay ví dụ sslip bằng `https://staging.tamihomes.vn` (chỉ comment/ví dụ — không đổi giá trị mặc định/biến bắt buộc).
   - Comment `src/lib/env.ts:24`, `src/lib/security/client-ip.ts:19`, test name `client-ip.test.ts:31`: "staging sslip.io" → "staging sau Nginx host" (chỉ chữ, không đổi logic) — tuỳ chọn, chỉ nếu builder thấy cần để acceptance "không còn tham chiếu sslip.io cho staging" (ngoại trừ phần mô tả server cũ).
6. KHÔNG đụng file dirty của việc khác: `docs/API_SPEC.md`, `docs/DESIGN.md`, `docs/ERD.md`, `docs/INDEX.md`, `docs/PERMISSION.md`, `docs/SPEC_VERSIONING.md`, `src/endpoints/**`, `src/hooks/**`, `src/jobs/**`, `src/lib/revalidate/**`, `src/lib/translation/**`, `tools/**`, `package.json`, `pnpm-lock.yaml`, `.gitignore`, `.claude/settings.json`, `.context/design-spec.md`, `spec/changes/BACKLOG.md`.

## Verify
- `docker run --rm -v <conf>:/etc/nginx/conf.d/x.conf:ro nginx:1.28-alpine nginx -t` với cert tự ký giả (như §9.2 đã làm cho sslip) cho cả 2–3 file → PASS.
- `git grep -n -i sslip -- docker/docker-compose.staging.yml .env.example docs/ARCHITECTURE.md .context/project-config.md` chỉ còn chỗ mô tả server cũ.
- `bash scripts/deploy/deploy.test.sh` PASS (không đổi script nhưng chạy lại để chắc).
- Có đổi `src/` (comment) → `pnpm typecheck` + `pnpm test src/lib/security/client-ip.test.ts`.

## Acceptance
- [ ] 2 file conf mới `nginx -t` PASS, giữ đủ hành vi bảo mật của bản sslip (diff chỉ server_name/cert/comment/http2 có lý do).
- [ ] Runbook §11 đủ để người khác dựng lại staging trên server mới.
- [ ] ARCHITECTURE §6.1, project-config, decisions, .env.example cập nhật.
- Doc impact: liệt kê ở trên; `docs/API_SPEC.md`/`ERD.md`/`DESIGN.md`: no impact.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Decision log (builder)
- `http2 on;` BẬT ở vhost 443 mới (host mới chỉ TAMI dùng 443, nginx 1.28 ≥ 1.25.1, directive riêng từng server). Bản sslip giữ HTTP/1.1.
- `log_format` đổi tên `tami_staging_sslip` → `tami_staging` (file mới; không trùng tên khi cả hai conf bị cài trên cùng host).
- Thêm `tami-default-reject.conf` (default_server 443 + `ssl_reject_handshake on`); chỉ cho host mới, comment cảnh báo không cài lên server cũ. Chạy `nginx -t` chung với 2 vhost: PASS.
- Giữ nguyên toàn bộ hành vi bảo mật (X-Real-IP ghi đè, xoá CF-Connecting-IP, Authorization "", noindex, HSTS 1 ngày, 25m, 404 metrics/internal, ghi đè cache media). Basic auth tắt, 2 dòng auth_basic comment sẵn (Q1).
- Không có AAAA: ghi vào runbook 11.1.
- Không đổi `src/` (comment `sslip` ở env.ts/client-ip.ts/test không nằm trong grep acceptance, task cho phép bỏ qua) → không chạy typecheck/test.
- ARCHITECTURE: ngoài §6.1 còn sửa 2 dòng §6.2/§6.3 (bảng Nginx, ô Tên miền staging) vì đang nói sai staging; nên reviewer/primary tách hunk.
- Decision mới đánh số 12 trong `.context/decisions.md`.

## Evidence / Verification summary
- `docker run nginx:1.28-alpine nginx -t` với cert tự ký giả (scratchpad ngoài repo), 3 file conf cùng nạp trong conf.d: "syntax is ok / test is successful".
- `bash scripts/deploy/deploy.test.sh`: "Tất cả test PASS" (1 SKIP do không có flock).
- `git grep -i sslip` trên compose staging / `.env.example` / ARCHITECTURE / project-config: chỉ còn chỗ mô tả server cũ.
- Files: docker/nginx/{tami-staging-tamihomes-http,tami-staging-tamihomes,tami-default-reject}.conf (mới); tami-staging-sslip{,-http}.conf (1 dòng comment đầu); docs/runbooks/deploy.md (dòng 108, banner §9, §11 mới ở cuối); docs/ARCHITECTURE.md; .context/project-config.md (deploy_platform); .context/decisions.md; .env.example (61/108/114); docker/docker-compose.staging.yml (comment dòng 30-31 + message dòng 61).
