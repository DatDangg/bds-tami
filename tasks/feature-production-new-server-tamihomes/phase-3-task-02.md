# feature-production-new-server-tamihomes · phase-3-task-02 — Smoke acceptance production tamihomes.vn + backup sau cắt chuyển (BL-112)

- Phụ thuộc: phase-3-task-01. Chỉ đọc + 1 lần gửi form thử (user đồng ý).
- Trạng thái: `done` — reviewer NORMAL PASS round 1. Follow-up giao user: kiểm đăng nhập admin + tải CV private trên https://tamihomes.vn/admin; theo dõi RAM/swap 24h; SMTP thật (backlog riêng ở close-out cùng Turnstile).

## Classification / Risk
- Risk: MEDIUM. Review: NORMAL (STRICT nếu phải sửa vhost).

## Việc / Verify
- `https://tamihomes.vn/` 200, cert hợp lệ (Let's Encrypt, SAN apex + www), HSTS 1 năm, **không** `X-Robots-Tag`; `http://` → 301 https; `www` → 301 apex.
- `/robots.txt` không `Disallow: /`, có `Sitemap: https://tamihomes.vn/sitemap.xml`; sitemap + `<link rel=canonical>` + og:url dùng `https://tamihomes.vn`.
- `/api/metrics`, `/api/internal/x` → 404; trên server `curl 127.0.0.1:3010/api/health` 200.
- Rate limit IP thật: gửi form liên hệ thử → cột đầu `/var/log/nginx/tami-prod.access.log` là IP thật; log app không có cảnh báo "không xác định IP khách".
- Ảnh media hiển thị (bucket public), file CV private tải được qua admin.
- Backup: `pg-backup.sh info` có full sau giờ cắt chuyển; `OK wal` trong log `tami-backup`; restic snapshot mới.
- Hostname lạ → TLS reject (`tami-default-reject.conf`); outfitai vẫn 200.
- `certbot renew --dry-run --cert-name tamihomes.vn --no-random-sleep-on-renew` PASS.
- Theo dõi RAM/swap 24h đầu (`free -h`, OOMKilled = false).

## Acceptance
- [ ] Toàn bộ acceptance "HTTPS / dữ liệu / rate limit / robots-sitemap-canonical" của change doc PASS.

## Retry / Escalation
FAIL nghiêm trọng (mất dữ liệu, không vào được) → rollback P3.T01. 3 attempt fail → `architecture_review_needed`.

## Evidence (builder, 2026-11-06 08:47–08:52Z) — PASS toàn bộ acceptance; 5 residual không chặn
Máy kiểm: IP public `14.248.69.150`; server `ssh server` (179.197.242.57).

| # | Mục | Kết quả |
|---|---|---|
| 1 | `https://tamihomes.vn/` | 200; cert Let's Encrypt `YE1`, SAN `tamihomes.vn` + `www.tamihomes.vn`, hạn 2027-02-04; `Strict-Transport-Security: max-age=31536000`; KHÔNG có `X-Robots-Tag` |
| 2 | Redirect | `http://tamihomes.vn/du-an?x=1` → 301 `https://tamihomes.vn/du-an?x=1`; `https://www…/du-an/abc?q=1&z=2` → 301 `https://tamihomes.vn/du-an/abc?q=1&z=2`; `http://www…/du-an?q=1` → 301 apex https (giữ path+query) |
| 3 | `/robots.txt` | `Allow: /`, `Disallow: /admin`, `Disallow: /api/` (không `Disallow: /`); `Sitemap: https://tamihomes.vn/sitemap.xml` |
| 4 | Sitemap | index 8 con toàn `https://tamihomes.vn`; `<loc>`: static 14 / projects 10 / rentals 8 / news 16 (số cũ 56/40/32/64 đếm cả link hreflang — review MINOR-1), 0 domain khác |
| 5 | canonical/og:url/hreflang (`/`, `/du-an`, `/du-an/maison-privee`, `/en`, `/en/projects/maison-privee`) | đều `https://tamihomes.vn…`; hreflang vi/en/x-default đúng; og:image cùng domain; 0 chuỗi `genieplatform`/`sslip` trong HTML 5 trang. `/thue` 404 (route không tồn tại) |
| 6 | Ảnh media | GET `/api/media/file/…-800x450.webp` 200 `image/webp` 43 912 B, `Cache-Control: public, max-age=31536000, immutable`; og:image 1200x630 200 107 380 B |
| 7 | `/api/metrics`, `/api/internal/x` | 404; `/api/health` 200; trên server `curl 127.0.0.1:3010/api/health` 200 |
| 8 | Hostname lạ | `curl --resolve foo.example.org:443:179.197.242.57` → TLS handshake fail (rc 35, tami-default-reject) |
| 9 | `tami.genieplatform.cloud` | `http://…/du-an/x?a=1` → 301 https cùng host → 301 `https://tamihomes.vn/du-an/x?a=1`; `https://…/` → 301 `https://tamihomes.vn/` |
| 10 | IP thật (không gửi form) | `tami-prod.access.log` cột đầu của GET builder = `14.248.69.150` (69 dòng, khớp ipify); các IP crawler khác nhau → không gộp 1 bucket. `docker logs tami-app --since 08:33Z`: 0 dòng "khách/bucket/không xác định IP" |
| 11 | Backup | `pg-backup.sh info`: stanza `tami` ok; full `20261106-153347F` (15:33:47+07 = 08:33:47Z, sau cắt chuyển), repo `/tami-prod-s2`; log `tami-backup` `OK wal` 08:38:11Z + 08:48:12Z; prom `tami_backup.prom` `last_run_ok`=1 cả wal/pg_full/pg_diff/files (pg_full 08:41:19Z, files 08:41:25Z); restic snapshot mới `d1620215` 08:41:20Z 245.351 MiB |
| 12 | certbot | `renew --dry-run --cert-name tamihomes.vn --no-random-sleep-on-renew`: "all simulated renewals succeeded" (không chạy renew trần) |
| 13 | RAM/OOM | RAM 7.7Gi (used 3.6, available 4.1Gi), swap 4.0Gi used 1.4Gi; mọi container `tami-*` `OOMKilled=false`, `RestartCount=0`; tami-app/jobs/backup start 08:33:09Z, app healthy |
| 14 | Staging | `https://179-197-242-57.sslip.io/` 200 + `X-Robots-Tag: noindex, nofollow, noarchive`, robots `Disallow: /`; `tami-staging-*` Up healthy |
| 15 | Dự án khác | `outfitai.genieplatform.cloud` đi qua nginx→Caddy, `/` 404 JSON do chính app (đã ghi ở P2.T01; không do TAMI), `outfit-changer-api-1` healthy; supabase-storage/supabase-rest/airoom-b1-api `unhealthy` uptime 4–10 ngày → có trước, không liên quan |

## Residual (không chặn acceptance)
1. **Admin + file CV private**: không có tài khoản → CHƯA kiểm. User tự đăng nhập `https://tamihomes.vn/admin` (cookie cũ thuộc domain cũ, phải đăng nhập lại), thử tải 1 file CV và upload 1 ảnh nhỏ.
2. **SMTP chưa cấu hình** (`SMTP_HOST=smtp.invalid`, `SMTP_USER` giữ chỗ): tami-app cảnh báo lúc khởi động → email thông báo lead/newsletter sẽ lỗi tới khi điền SMTP thật vào `/opt/tami/prod.env`. Có từ trước cắt chuyển.
3. **IP thật ở tầng app/rate-limit bằng form**: không gửi form (tránh lead thật); bằng chứng gián tiếp = nginx `$remote_addr` thật + 0 cảnh báo IP trong app. Muốn trực tiếp: user tự gửi 1 form thử rồi xoá lead.
4. **RAM/swap 24h**: mới 1 điểm đọc; đọc lại sau ~24h (host chung supabase/airoom/outfitai).
5. `HEAD /api/media/file/<id>` trả 404 (GET 200) — đặc tính Payload; trình duyệt dùng GET nên ảnh hiển thị bình thường.

Không phát hiện FAIL; không sửa server/code; không commit/push.
