# feature-production-new-server-tamihomes · phase-2-task-01 — Server mới: prod.env, backup env, image, Nginx 80 + cert tamihomes.vn (BL-112)

- Phụ thuộc: phase-1-task-01 đã commit. Mỗi bước chạm server: `[XÁC NHẬN]` của user trong chat.
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z.

## Classification / Risk
- Risk: **HIGH** (secret production, host dùng chung, certbot ACME account chung với outfitai). Review: **STRICT**.

## Việc (server mới `server`, không đụng gì của dự án khác)
1. Kiểm (đọc): `ss -ltnp | grep :3010` trống; `docker volume ls | grep '^tami_'` trống; `free -h`, `df -h /`.
2. `/opt/tami/prod.env`: **chép thẳng server cũ → server mới qua pipe SSH** (`ssh server-old cat … | ssh server 'install -m 600 -o deploy … '`), không lưu file trên máy dev, không in giá trị.
   Chỉ đổi: `NEXT_PUBLIC_SITE_URL=https://tamihomes.vn`. Giữ nguyên mật khẩu DB/Redis/S3/`PAYLOAD_SECRET` (dữ liệu restore + phiên đăng nhập admin vẫn hợp lệ), `TRUST_CF_CONNECTING_IP=false`, `TRUST_X_REAL_IP=true`, `BACKUP_ENV_DIR=/opt/tami/backup/production`.
   Kiểm `DATABASE_URL_PROD` ≠ `DATABASE_URL_STAGING` (khác mật khẩu/host service — khác project compose).
3. `/opt/tami/backup/production/{pgbackrest.env,restic.env,ssh/}`: chép tương tự (cùng R2 bucket + khoá + mật khẩu mã hoá), **đổi path kho**:
   `PGBACKREST_REPO1_PATH=/tami-prod-s2`, `RESTIC_REPOSITORY=…/tami-prod-backup/tami-prod-files-s2` — để cluster mới (system-id khác) không ghi lẫn vào kho đang chạy của server cũ. Kho cũ giữ nguyên tới khi tắt hẳn server cũ. `chown 999:999 ssh/`.
4. Image: chép release `docker/` của commit sẽ deploy vào `/opt/tami/releases/production/<sha>/` (như staging P2.02) rồi `$C build postgres backup` (2 vCPU, vài phút; không pull image lạ).
5. Nginx 80: `tami-prod-tamihomes-http.conf` → sites-available + symlink, `nginx -t`, `systemctl reload nginx` (không restart).
6. Cert: `certbot certonly --webroot -w /var/www/certbot --cert-name tamihomes.vn -d tamihomes.vn -d www.tamihomes.vn --agree-tos --register-unsafely-without-email --non-interactive`.
   Kiểm `certbot renew --dry-run --cert-name tamihomes.vn --no-random-sleep-on-renew` PASS (KHÔNG `renew --dry-run` trần — chạm cert outfitai). Hook reload dùng chung đã có.
7. 443 **chưa** bật ở task này (app chưa chạy → 502); bật ở P2.T02.

## Verify
- `stat -c '%a %U' /opt/tami/prod.env` = `600 deploy`; danh sách tên biến khớp server cũ (so `cut -d= -f1`), chỉ `NEXT_PUBLIC_SITE_URL` khác (so hash từng dòng, không in giá trị).
- `$C config -q` PASS; `docker images | grep tami-postgres:17-3.5-bookworm-pgbackrest2.59`.
- `curl -sI http://tamihomes.vn/` → 301 https; cert có SAN tamihomes.vn + www; dry-run PASS.
- Site khác (outfitai) vẫn 200 sau reload: `curl -sI https://outfitai.genieplatform.cloud/` (chỉ đọc).

## Acceptance
- [ ] prod.env + backup env đúng quyền, kho path mới; cert tamihomes.vn cấp xong; không đụng dự án khác.

## Retry / Escalation
certbot lỗi (rate limit / DNS) → dừng, không thử lại liên tục (Let's Encrypt giới hạn 5 lỗi/giờ). 3 attempt fail → `architecture_review_needed`.
