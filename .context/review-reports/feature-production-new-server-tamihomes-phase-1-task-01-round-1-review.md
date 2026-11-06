Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-1-task-01 · round 1 (BL-112)

- **Review level:** STRICT
- **Reason:** vhost production (security headers, HSTS, indexing), IP thật cho rate limit (X-Real-IP / CF-Connecting-IP), host nginx dùng chung (staging + outfitai), cấu hình RAM postgres production, runbook cắt chuyển dữ liệu production.
- **Blast radius:** nginx host mới 179.197.242.57 (cổng 80/443 dùng chung với `tami-staging-sslip-179*`, `tami-default-reject`, outfitai); nginx 1.24 server cũ 187.52.119.50 (thay `tami-prod-direct.conf` bằng file redirect ở P3); container `tami-postgres` prod (mem_limit/shared_buffers); runbook `docs/runbooks/deploy.md` §10 (1 dòng) + §12 (mới, NHÁP). Không đụng app code/API/schema.

## Verify commands + result
- `nginx:1.28.3-alpine nginx -t` nạp chung 5 file (tami-default-reject, tami-staging-sslip-179, tami-staging-sslip-179-http, tami-prod-tamihomes, tami-prod-tamihomes-http) + cert tự ký giả cho `tamihomes.vn` và `179-197-242-57.sslip.io` → **syntax ok, test successful** (reviewer tự chạy lại). Chứng minh không trùng `log_format`/`upstream` với file staging trên cùng host.
- `nginx:1.24.0-alpine nginx -t` cho `tami-prod-genieplatform-redirect.conf` + `tami-prod-direct-http.conf`: reviewer **không chạy được** (lệnh bị safety check của Claude Code chặn vì `sh -c` có `rm`; theo Tool Loop Guard không thử biến thể). Dựa vào evidence builder + đọc tay: file không có `http2`, không `default_server`, không `ipv6only`, không tham chiếu `log_format`/`upstream` nào → Residual risk thấp.
- `docker compose ... config -q`: không chạy lại (diff chỉ đổi 2 giá trị `-c` + `mem_limit`, YAML đọc tay hợp lệ; `name: tami` ở dòng 18). Evidence builder rc=0.
- App test/lint/typecheck: `skip, no app code in diff` (chỉ config nginx/compose/doc).

## Checklist yêu cầu của primary
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| HSTS prod `max-age=31536000`, không includeSubDomains/preload | OK | `tami-prod-tamihomes.conf:57`, server www `:34` |
| Không `X-Robots-Tag` ở prod | OK | không có trong `tami-prod-tamihomes.conf` (staging vẫn có ở file staging, không đổi) |
| nosniff / X-Frame-Options / Referrer-Policy | OK | `:58-60`; không location nào có `add_header` → kế thừa đúng, Cache-Control ảnh của app giữ nguyên (`:88-91`) |
| X-Real-IP ghi đè `$remote_addr`, xoá CF-Connecting-IP | OK | `:72`, `:74`; `X-Forwarded-For $remote_addr` (ghi đè, không append) `:69`; compose prod bắt buộc khai `TRUST_*` (compose `:34-35`) |
| `/api/metrics` + `/api/internal/` → 404 | OK | `:78-85` (`= /api/metrics`, `^~ /api/internal/` thắng `^~ /api/` vì prefix dài hơn) |
| www → apex 301 giữ path | OK | 443: `:36` `return 301 https://tamihomes.vn$request_uri`; 80: `-http.conf:23` (1 hop) |
| ACME cổng 80 | OK | `-http.conf:16-19` webroot `/var/www/certbot` |
| Không `default_server` | OK | grep: chỉ `tami-default-reject.conf` có |
| Không trùng log_format/upstream với `tami-staging-sslip-179.conf` | OK | `tami_prod`/`tami_prod_app` vs `tami_staging`/`tami_staging_app`; nginx -t nạp chung PASS |
| Redirect file cho nginx 1.24 không http2 socket-level | OK | `tami-prod-genieplatform-redirect.conf:10-11` chỉ `listen 443 ssl`; HSTS cũ giữ; 301 giữ `$request_uri`; cổng 80 cũ (`tami-prod-direct-http.conf`) vẫn phục vụ ACME → cert cũ gia hạn được |
| Compose postgres mem/shared_buffers | OK | `shared_buffers=256MB` (25% của 1g), `effective_cache_size=768MB`, `max_connections=100`, work_mem mặc định; DB 166 MB; comment lý do `:156-157` |
| Runbook §12 khớp P2–P4 (README) | OK (có ghi chú MINOR) | 12.1 bước 1–6 ánh xạ đúng P2.T01…P4 trong README |
| certbot renew --dry-run có `--cert-name` | OK | `deploy.md` §12.1 bước 1: `renew --dry-run --cert-name tamihomes.vn --no-random-sleep-on-renew`, ghi rõ cấm dry-run trần |
| Lệnh nguy hiểm cho host dùng chung | OK | không `down -v`, không xoá volume/`/opt/tami`, nginx dùng `reload` không restart; `DROP DATABASE` chỉ trong container `tami-postgres` prod mới (project `tami`), có gate đối chiếu 100% trước khi bật 301 |
| Surgical diff | OK | §10 chỉ thêm 1 dòng trỏ §12; file staging/reject không đổi |

## Responsive Checklist Gate
N/A — diff không đụng UI (chỉ nginx/compose/runbook).

## Skill gates
- aislop: N/A (không có code TS/JS/app trong diff).
- oxlint (anti-slop): N/A (diff không đụng TS/JS).
- ocr (open-code-review): skip, ocr not installed / diff chỉ là config.
- AI-readable: OK — tên rõ (`tami_prod`, `tami_prod_app`), comment giải thích WHY (http2 socket-level 1.24, trùng log_format, không Cloudflare); 0 indicator.
- ai-friendly-web: N/A cho task này (vhost không chặn crawler, không X-Robots-Tag; robots/sitemap/llms do app phục vụ, kiểm ở smoke P3.T02).
- blitzstrike: skip — không có môi trường được phép (chưa chạy trên server).

## Findings
Không có CRITICAL / MAJOR.

- **[MINOR]** `docs/runbooks/deploy.md` §12.1 bước 4 (P3.T01): sau `pg_restore` dùng `docker start tami-app tami-jobs` (không tạo lại container). Rootfs app là cache disk của Next (compose `:72`: "mất khi tạo lại container") và redis còn cache từ bản dữ liệu thử P2.T02 → trang ISR/cache có thể phục vụ nội dung cũ của bản thử cho tới khi revalidate. Đề xuất (khi hoàn thiện P3.T01/P4.T02): `$C up -d --force-recreate app jobs` (hoặc xoá cache Next + flush redis của project `tami`) thay cho `docker start`, rồi mới health/đối chiếu.
- **[MINOR]** §12.1 bước 4: chưa ghi dừng sidecar `tami-backup` trong lúc DROP/CREATE + restore DB (lịch pgBackRest diff/check có thể chạy giữa chừng). Đề xuất `docker stop tami-backup` cùng lúc với app/jobs, `docker start` sau đối chiếu, rồi `pg-backup.sh full`.
- **[MINOR]** §12.1 bước 1: `ssh server-old cat … | ssh server 'install -m 600 -o deploy …'` — `install` không đọc stdin nếu không chỉ rõ `/dev/stdin`; ghi đầy đủ lệnh ở P2.T01 (vd `install -m 600 -o deploy -g deploy /dev/stdin /opt/tami/prod.env`). Đồng thời nên thêm bước kiểm (chỉ in tên khoá, không in giá trị) `TRUST_CF_CONNECTING_IP=false` + `TRUST_X_REAL_IP=true` trong `prod.env` mới, vì rate limit phụ thuộc cặp này.
- **[MINOR — ngoài scope]** `docs/runbooks/deploy.md:306` ghi "production `true`/`false` (ép trong compose)" mâu thuẫn với §10/§12 (prod direct = `false`/`true`, compose bắt buộc khai, không ép). Không thuộc diff; đề xuất sửa ở P4.T02 close-out.

## Residual risk
- nginx 1.24 `nginx -t` cho file redirect chưa được reviewer chạy lại (bị safety check chặn); dựa trên evidence builder + đọc tay.
- Chưa có curl thực trên server (đúng phạm vi P1); header/301/IP thật sẽ kiểm ở P2.T02/P3.T02.
- Tổng mem_limit prod (~3.2 GB khi migrate chạy) + staging trên host 7.7 GB (available ~4.8 GB, swap đang dùng 1.4 GB): là trần, không phải đặt trước; cần theo dõi OOM/swap như runbook P3.T02 đã ghi.

## Verdict
✅ PASS — không còn CRITICAL/MAJOR; 3 MINOR (runbook nháp) đề xuất xử lý khi hoàn thiện ở P2.T01/P3.T01/P4.T02.
