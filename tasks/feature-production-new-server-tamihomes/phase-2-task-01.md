# feature-production-new-server-tamihomes · phase-2-task-01 — Server mới: prod.env, backup env, image, Nginx 80 + cert tamihomes.vn (BL-112)

- Phụ thuộc: phase-1-task-01 đã commit. Mỗi bước chạm server: `[XÁC NHẬN]` của user trong chat.
- Trạng thái: `done` — reviewer STRICT PASS round 1.

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

## Decision log (builder, 2026-11-06)
- **Release dir:** `ssh-deploy` action chỉ tạo `<sha>` nếu CHƯA có (có rồi thì giữ nguyên, không ghi đè) và `deploy.sh` chỉ đòi script nằm đúng `releases/production/<sha>`. Chọn: bootstrap `/opt/tami/releases/production/b75ff984540748a54dced24b87285d6512799bda/` bằng `cp -a docker scripts` từ release staging cùng SHA đã có trên server (CI đã upload đúng thư mục này), symlink tuyệt đối `releases/production/current` → release (khớp `activate_release`: `ln -sfn $REPO_DIR`). Đã đối chiếu sha256 từng file (35 file) với `git show b75ff984:<path>` = IDENTICAL. Nên P2.T02 dựng postgres/redis/seaweedfs bằng `docker/docker-compose.prod.yml` của chính SHA sẽ deploy => guard `guard_postgres_image` (tag đang chạy == tag compose khai) khớp, CI deploy sau không lỗi. **Deploy production PHẢI dùng đúng SHA b75ff984 (hoặc bootstrap lại nếu đổi SHA).**
- Compose của b75ff984 còn postgres `mem_limit 2g` / shared_buffers 512MB; mức 1g/256MB (commit 884e0ae2) chỉ áp dụng khi deploy commit >= 884e0ae2 (đổi mem_limit không đổi image tag nên guard không chặn). Ghi nhận cho P2.T02/P4.
- Env: không lưu file trên máy dev (pipe server-old -> sed -> server). `sed` có neo `^KEY=` chỉ đổi 3 dòng: `NEXT_PUBLIC_SITE_URL`, `PGBACKREST_REPO1_PATH=/tami-prod-s2`, `RESTIC_REPOSITORY` thêm đuôi `-s2`. Mọi dòng khác (28/48/27 dòng) trùng hash từng dòng.
- `ssh/` rỗng ở server cũ (kho là S3/R2, không SFTP). Tạo `ssh/` mode 700 owner uid/gid 999; trên host mới uid 999 đang là user `nextlevel-tunnel` (chỉ hiển thị tên khác; container backup dùng uid số 999 nên đọc được; thư mục rỗng).
- certbot: 1 lần duy nhất, thành công (ACME account có sẵn của outfitai nên `--register-unsafely-without-email` không có tác dụng — như §11.1).
- Không kiểm prefix kho R2 mới (`/tami-prod-s2`, `tami-prod-files-s2`) tồn tại hay chưa: chưa chạy lệnh nào dùng khoá R2; `stanza-create`/`restic init` ở P2.T03 sẽ báo lỗi nếu kho đã có dữ liệu khác.

## Evidence (builder, 2026-11-06)
- Bước 1: `ss -ltnp | grep :3010` = 0; volume `tami_*` = 0; `free`: available 4.7 GiB, swap dùng 1.4/4.0 GiB; `df /`: 57 GB trống (41%). Cuối task: available 4.8 GiB, không OOM.
- `stat`: `prod.env` `600 deploy:deploy`; `backup/production` `750 deploy:deploy`; `pgbackrest.env`/`restic.env` `600 deploy:deploy`; `ssh/` `700 uid999`. `TRUST_CF_CONNECTING_IP=false`, `TRUST_X_REAL_IP=true`, `BACKUP_ENV_DIR=/opt/tami/backup/production`, `NEXT_PUBLIC_SITE_URL=https://tamihomes.vn`; `PGBACKREST_REPO1_PATH=/tami-prod-s2`, bucket `tami-prod-backup`, type s3; `RESTIC_REPOSITORY` kết thúc `/tami-prod-backup/tami-prod-files-s2`.
- Hash từng dòng cũ vs mới: prod.env chỉ dòng 12 (NEXT_PUBLIC_SITE_URL) khác; pgbackrest.env chỉ dòng 14 (REPO1_PATH); restic.env chỉ dòng 11 (REPOSITORY). Tên biến khớp. Hash toàn dòng `POSTGRES_PASSWORD`/`DATABASE_URL_PROD`/`PAYLOAD_SECRET`/`REDIS_PASSWORD`/`S3_BUCKET_PUBLIC` prod khác staging.env (không in giá trị).
- `$C config -q` PASS (project `tami`, `TAMI_IMAGE=placeholder@sha256:000…`); `$C build postgres backup` thành công (cache layer, vài chục giây, RAM không đổi đáng kể); images: `tami-postgres:17-3.5-bookworm-pgbackrest2.59` (5e32c35b2f13), `tami-backup:bookworm-pgbackrest2.59-restic0.17.3` (8444229ccecd).
- Nginx: symlink `sites-enabled/tami-prod-tamihomes-http.conf` (file = 884e0ae2), `nginx -t` OK, `systemctl reload nginx`, active. `curl -sI http://tamihomes.vn/` -> 301 `https://tamihomes.vn/`; `http://www.tamihomes.vn/x?y=1` -> 301 `https://tamihomes.vn/x?y=1`.
- Cert `tamihomes.vn`: SAN `tamihomes.vn, www.tamihomes.vn`, hết hạn 2027-02-04; `certbot renew --dry-run --cert-name tamihomes.vn --no-random-sleep-on-renew` PASS; `certbot.timer` enabled; hook `reload-nginx.sh` có sẵn.
- Không đụng: container dự án khác, 443 chưa bật, không `up` container TAMI prod. Staging `https://179-197-242-57.sslip.io/` vẫn 200; `tami-staging-*` vẫn healthy.
- Lưu ý: `https://outfitai.genieplatform.cloud/` hiện 404 (`{"error":{"code":"not_found"...}}`), nhưng app của họ (127.0.0.1:8088/8089) cũng trả 404 trực tiếp khi bỏ qua nginx và container `outfit-changer-api-1` mới restart ~5 phút trước => do dự án đó, không do reload nginx của TAMI (vhost/cert outfitai không đổi). Trước đó (07:19Z) log có GET / 200 từ cùng IP; khuyến nghị reviewer kiểm lại nếu muốn.
