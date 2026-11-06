# feature-production-new-server-tamihomes · phase-3-task-02 — Smoke acceptance production tamihomes.vn + backup sau cắt chuyển (BL-112)

- Phụ thuộc: phase-3-task-01. Chỉ đọc + 1 lần gửi form thử (user đồng ý).
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z.

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
