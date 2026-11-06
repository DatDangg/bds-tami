# feature-staging-new-server-nginx-tamihomes · phase-2-task-02 — Chuyển dữ liệu staging cũ → server mới (env, release, Postgres, SeaweedFS) (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md` (user chốt: chuyển DB + media public + CV private; staging cũ giữ chạy, không xoá).
- Phụ thuộc: phase-2-task-01. Không cần DNS.
- Trạng thái: `done` — STRICT PASS r1 (`.context/review-reports/feature-staging-new-server-nginx-tamihomes-phase-2-task-02-round-1-review.md`), 2026-11-06; dữ liệu chốt lúc ~04:09Z (DB) / 04:11Z (media). Thực thi qua SSH `server-old` (CHỈ ĐỌC + `pg_dump` + 1 lần dừng ngắn seaweedfs) và `server`.

## Classification / Risk
- Type: MODIFY hạ tầng — sao dữ liệu staging (KHÔNG phải staging→prod; prod không đụng).
- Risk: **HIGH** — dữ liệu cá nhân (CV private, lead), secret env, postgres image/collation, guard `deploy.sh`.
- Expected review level: **STRICT**.

## Số liệu (đo 2026-11-06, `docker system df -v` server cũ)
- `tami-staging_postgres-data` ≈ 147 MB · `tami-staging_seaweedfs-data` ≈ 457 MB · `tami-staging_redis-data` ≈ 0 (không chuyển — cache/rate limit).
- Image app hiện tại `ghcr.io/datdangg/bds-tami@sha256:c426f6de…` (≈ 406 MB), release `678b3568` (= HEAD `staging`).
- Postgres cũ: `tami-postgis:17-3.5-bookworm` (đã chuyển bookworm) → server mới build cùng Dockerfile ⇒ cùng glibc/collation.
- Dung lượng chuyển tổng < 1 GB; đĩa mới trống 73 GB → không phải rủi ro.

## Việc (thứ tự)
1. **Env:** sao `/opt/tami/staging.env` server cũ → `/opt/tami/staging.env` server mới bằng pipe `ssh server-old cat … | ssh server 'install -m 600 -o deploy -g deploy /dev/stdin /opt/tami/staging.env'` (KHÔNG in giá trị, không ghi file trung gian trong repo). Sửa duy nhất `NEXT_PUBLIC_SITE_URL=https://staging.tamihomes.vn` bằng `sed -i` có neo `^NEXT_PUBLIC_SITE_URL=`. Kiểm `grep -cE '^(TRUST_|BACKUP_|APP_ENV)'` = 0. Giữ `PAYLOAD_SECRET`/S3 keys/Turnstile như cũ (DB + object sao nguyên ⇒ phải cùng secret; đổi `PAYLOAD_SECRET` làm mất phiên + token nội bộ).
2. **Release bootstrap:** sao `/opt/tami/releases/staging/678b3568…` (docker/ + scripts/deploy/) → cùng đường dẫn server mới (tar qua pipe, chủ `deploy`), symlink `releases/staging/current`. Dùng để chạy compose cho postgres/seaweedfs theo **đúng project `tami-staging` + đúng đường dẫn bind mount** mà `deploy.sh` sẽ dùng (tránh guard postgres chặn ở lần deploy CI đầu).
3. **Dựng dịch vụ dữ liệu (rỗng):** trên server mới, user deploy, `export TAMI_IMAGE=placeholder@sha256:<64 số 0>` (chỉ để interpolate, không pull app):
   `C="docker compose --env-file /opt/tami/staging.env -f /opt/tami/releases/staging/current/docker/docker-compose.staging.yml"`; `$C build postgres`; `$C up -d postgres redis seaweedfs seaweedfs-init`. Chờ healthy. Kiểm `mem` + container dự án khác.
4. **Postgres:** `ssh server-old "docker exec tami-staging-postgres pg_dump -U <POSTGRES_USER> -d <POSTGRES_DB> -Fc"` → file tạm `/opt/tami/transfer/staging-<ts>.dump` (600, deploy) trên server mới; ghi `sha256sum` + kích thước. `pg_restore --no-owner --role=<user> -d <db> --exit-on-error` vào DB trống (init.sql đã tạo extension PostGIS/unaccent/pg_trgm — dùng `--clean --if-exists` KHÔNG cần vì DB trống; nếu xung đột extension → restore với `-n public` hoặc bỏ entry EXTENSION qua `pg_restore -l` list, ghi Decision log).
   Kiểm: số dòng các bảng chính (`listings`/`projects`/`news`/`media`/`private_files`/`users`/`payload_migrations`) cũ = mới; `SELECT max(name) FROM payload_migrations` bằng nhau; `amcheck` không bắt buộc (cùng collation).
5. **SeaweedFS:** cách đề xuất = sao volume khi dừng ngắn: `ssh server-old docker stop tami-staging-seaweedfs` (staging cũ mất ảnh/upload ~1–2 phút) → `docker run --rm -v tami-staging_seaweedfs-data:/data:ro alpine tar -C /data -cf - .` | `ssh server` (đã `$C stop seaweedfs`) → giải nén vào `tami-staging_seaweedfs-data` (xoá nội dung rỗng vừa khởi tạo trước) → `docker start tami-staging-seaweedfs` ở server cũ → `$C up -d seaweedfs` ở server mới. Bucket giữ tên `tami-staging-public`/`tami-staging-private`.
   Phương án không dừng (nếu user không muốn dừng): `rclone sync` S3→S3 qua SSH tunnel (cần image rclone + khoá S3 hai bên) — chậm hơn, nhiều bước.
   Kiểm: đếm object 2 bucket cũ = mới (`weed shell` `s3.bucket.list` / `fs.du`), tải thử 1 ảnh public + 1 CV private qua S3 nội bộ (không in nội dung CV).
6. Dọn: xoá file dump tạm sau khi phase-2-task-03 PASS (giữ tới khi đó); `chmod 700 /opt/tami/transfer`.
7. **Đồng bộ lại (nếu cần):** khoảng giữa bước 4–5 và lúc tester chuyển sang domain mới, ai sửa trên staging cũ sẽ KHÔNG có ở server mới. Bước 4–5 viết thành chuỗi lệnh lặp lại được; nếu user báo có sửa trên staging cũ, chạy lại (DB: `$C stop app jobs` → drop/recreate DB → restore; object: lặp bước 5) ngay trước phase-3.

## Verify / Evidence
Số dòng bảng cũ/mới, sha256 dump, số object/bucket, `docker ps` 2 server trước/sau (staging cũ vẫn healthy sau bước 5), không giá trị secret nào trong evidence.

## Acceptance
- [ ] DB server mới = dump staging cũ (đếm bảng chính khớp, migration cuối khớp).
- [ ] Object public + private khớp số lượng; tải được mẫu.
- [ ] Staging cũ vẫn chạy (app healthy, seaweedfs up lại) — không xoá gì ở server cũ.
- [ ] Không secret/PII xuất hiện trong log/chat/repo.

## Retry / Escalation
pg_restore/tar lỗi → dừng, báo; không thử biến thể quá 2 lần. 3 attempt fail → `architecture_review_needed`.

## Evidence (builder, 2026-11-06)
- Env: pipe server-old → server, `deploy:deploy 600`; `NEXT_PUBLIC_SITE_URL=https://staging.tamihomes.vn` (grep -c = 1); `TRUST_|BACKUP_|APP_ENV` = 0 dòng. Không in giá trị.
- Release: tar pipe `678b3568…` (docker/ + scripts/, 300K) → cùng đường dẫn, chủ deploy; `releases/staging/current` → symlink tuyệt đối `/opt/tami/releases/staging/678b3568…` (khớp `activate_release`: `ln -sfn $REPO_DIR`).
- Dựng: `TAMI_IMAGE=placeholder@sha256:000…` (chỉ interpolate); build `tami-postgis:17-3.5-bookworm`; up postgres/redis/seaweedfs/seaweedfs-init → healthy; init exit 0. Lưu ý: `sudo -u deploy docker compose` phải `cd /opt/tami` trước (cwd /root → "stat .: permission denied").
- Postgres: dump `-Fc` 2 248 713 B, sha256 `0587057a402e0d4d1b18a75166b183686f3379e7dd3011985fe430467ac7a963`, file `/opt/tami/transfer/staging-20261106110953.dump` (700/600 deploy; giữ tới sau phase-2-task-03).
  - Decision log: init.sql đã tạo 6 extension + schema tiger/tiger_data/topology → `pg_restore --exit-on-error` xung đột. Vì DB mới trống: `DROP EXTENSION … CASCADE` + `DROP SCHEMA tiger,tiger_data,topology CASCADE` rồi restore nguyên dump (extension do dump tạo lại, cùng image/phiên bản). Lần 2 restore OK, không lỗi.
  - Đếm hàng toàn bộ 157 bảng public cũ vs mới: IDENTICAL (diff rỗng). leads 34, media 829, news 38, private_files 2, projects 71, rentals 59, payload_migrations 43, spatial_ref_sys 8500. Migration cuối cả hai: `20261017_031052_categories_developers`. 7 extension giống nhau.
- SeaweedFS: dừng cũ lúc 04:11:35Z, start lại 04:12:41Z ⇒ **downtime ≈ 66 s** (+ ~vài giây health warmup; healthy sau ~40 s). Volume mới xoá nội dung khởi tạo trước, untar nguyên (tar rc 0/0).
  - `s3.bucket.list`/`fs.du` cũ = mới: public size 454412160 / logical 453069295 / 3540 chunk; private size 26696 / 2 chunk.
  - Tải thử 1 ảnh public qua filer nội bộ: cũ và mới cùng 469803 B, sha256 (16 đầu) `de3d958d86fc5555`. CV private: chỉ so chunk/size (không tải nội dung).
- Server mới sau cùng: tami-staging-postgres/redis/seaweedfs healthy (mem 110/5/152 MiB); `free`: used 3.4Gi, available 4.3Gi, swap dùng ít; đĩa 36%; container dự án khác: supabase/airoom như trước; RIÊNG outfit-changer-api-1 + worker-1 crash-loop (exit 1, ~17 restart) và caddy-1 created chưa start — do chủ dự án đó dựng lại /opt/outfit-changer lúc 04:01Z (thư mục cũ đổi tên outfit-changer-old-20261106-0401), KHÔNG do TAMI (reviewer r1 MINOR-1) (airoom-b1-api, supabase-storage, supabase-rest `unhealthy` có sẵn từ trước).
- Server cũ sau cùng: tami-staging-app healthy (`/api/health` 200), postgres/redis healthy, seaweedfs healthy sau start lại; prod không đụng; không xoá gì.
- Chưa chạy app/jobs/migrate trên server mới (phase-2-task-03).
