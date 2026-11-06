# feature-production-new-server-tamihomes · phase-2-task-02 — Chạy thử: bản sao dữ liệu prod → server mới, CI deploy prod vào server mới, bật 443 (BL-112)

- Phụ thuộc: phase-2-task-01. `[XÁC NHẬN]` từng bước.
- Trạng thái: `done` — reviewer STRICT PASS round 1.
- Mục đích: dựng prod mới hoàn chỉnh **trong khi prod cũ vẫn chạy bình thường** (không khoá ghi). Dữ liệu ở đây là bản thử; bản thật lấy lại ở P3.T01.

## Classification / Risk
- Risk: **HIGH** (đổi secret Environment `production`, cổng "chỉ nhận bản đã qua staging", dữ liệu production). Review: **STRICT**.

## Việc
1. Dump thử prod cũ (chỉ đọc với prod): `pg_dump -Fc` trong `tami-postgres` → pipe sang server mới `/opt/tami/transfer/` (chmod 700, xoá sau P3). SeaweedFS 2 bucket prod: chép theo cách P2.02 BL-111 (đã chứng minh).
2. Server mới: `$C up -d postgres redis seaweedfs seaweedfs-init` (project `tami`, network `tami-net`, KHÔNG đụng `tami-staging`), `pg_restore` vào DB trống, chép object vào 2 bucket.
   **Không** bật `backup` ở bước này (archive WAL chưa có stanza → báo lỗi; bật ở P2.T03). Ghi chú: compose `up postgres` cùng project sẽ không tự bật backup.
3. Đếm đối chiếu (bản thử): số bảng (151), `count(*)` các bảng chính (projects, rentals, posts, media, leads, wards…), số object + tổng byte mỗi bucket.
4. GitHub Environment `production` (agent làm bằng `gh secret set -R DatDangg/bds-tami --env production`, giá trị đọc từ file/stdin, không in):
   `DEPLOY_HOST=179.197.242.57`, `DEPLOY_USER=deploy`, `DEPLOY_SSH_KEY` = `~/.ssh/tami_ci_deploy` (khoá CI đã có trên server mới; cùng user `deploy` nên khoá riêng cho prod không thêm cách ly), `DEPLOY_SSH_KNOWN_HOSTS` = `ssh-keyscan -t ed25519 179.197.242.57` đối chiếu fingerprint `SHA256:5uzqgi5o…` (runbook §11.1).
   Lưu ý: secret cũ (khoá `tami-ci-deploy-prod`) bị ghi đè, không lấy lại được — rollback không cần CI (xem Rollback).
5. Actions → **Deploy production** → SHA `b75ff984…` (có trong `staging.history` server mới; schema = prod cũ `678b3568`, không migration giữa hai commit). Guard postgres qua vì container đã chạy đúng image.
   `staging.history` cùng máy ⇒ cổng giữ nguyên tác dụng (production đọc chính file staging ghi).
6. Bật 443: `tami-prod-tamihomes.conf` → sites-available + symlink, `nginx -t`, reload.

## Verify
- (review P2.T01 MINOR) Bổ sung runbook §12: deploy prod đầu tiên PHẢI là SHA `b75ff984` (release dựng sẵn; đổi SHA thì dựng lại), compose b75ff984 còn postgres 2g/512MB — 1g/256MB áp dụng khi deploy commit ≥ 884e0ae2.
- Run Deploy production xanh; `curl -s http://127.0.0.1:3010/api/health` = 200 trên server; `/opt/tami/state/production.current` có digest đúng.
- `curl -sI https://tamihomes.vn/` 200, không `X-Robots-Tag`; `https://www.tamihomes.vn/x` → 301 `https://tamihomes.vn/x`; staging `https://179-197-242-57.sslip.io` vẫn 200 + noindex.
- `docker stats` tổng RAM tami (staging + prod) + `free -h` (swap không tăng liên tục sau 15 phút).
- Prod cũ vẫn 200 tại `tami.genieplatform.cloud`.

## Acceptance
- [ ] prod mới chạy bằng CI, tamihomes.vn HTTPS OK, đếm bản thử khớp, prod cũ không bị ảnh hưởng.

## Rollback
Gỡ symlink 443/80 tamihomes, `$C down` (KHÔNG `-v` nếu muốn giữ dữ liệu thử). Secret: đặt lại `DEPLOY_HOST=187.52.119.50` + known_hosts cũ + **cần thêm khoá `tami_ci_deploy.pub` vào `/home/deploy/.ssh/authorized_keys` server cũ** (chỉ khi thật sự cần deploy lại prod cũ).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Decision log (builder, 2026-11-06)
- Postgres restore: init.sql đã tạo extension + schema tiger/tiger_data/topology → như staging, `DROP EXTENSION … CASCADE` + `DROP SCHEMA tiger,tiger_data,topology` rồi `pg_restore --no-owner --role=tami --exit-on-error` nguyên dump (pipe từ file dump trên server mới vào stdin container). Không lỗi.
- Dump `pg_dump -Fc` pipe ssh→ssh (không qua máy dev) → `/opt/tami/transfer/prod-trial.dump` (700/600 deploy, 1 577 037 B, sha256 `22766bad…f36`). **Giữ lại** tới sau P2.T03 (như staging), xoá sau; P3 lấy dump mới. Mốc dữ liệu thử: ~07:43Z.
- SeaweedFS: dừng seaweedfs MỚI, xoá nội dung khởi tạo, tar volume `tami_seaweedfs-data` prod cũ chạy `:ro` (KHÔNG dừng container cũ) giải nén vào volume mới, start lại. Prod cũ không bị restart/stop.
- `deploy.sh` (CI) chạy `up -d` toàn stack ⇒ `tami-backup` TỰ BẬT dù task dặn chưa bật (không tránh được khi deploy bằng CI). Hệ quả tạm thời đến P2.T03: backup log `FileMissingError backup.info` / `restic repository does not exist` (không ghi gì lên R2 vì repo chưa init; mirror bucket chỉ ra local), postgres `archive_command` fail (`pg_stat_archiver.failed_count` 23→38 sau ~5 phút, WAL tồn trong pg_wal — dung lượng nhỏ, hết khi `stanza-create`). Đã ghi vào runbook §12.1a. Chưa dừng container backup (P2.T03 ngay sau cần bật).
- Dữ liệu thử có đối chiếu với prod cũ chạy thật: không có ghi trong khoảng dump→đếm nên khớp 100%.
- Runbook: thêm §12.1a (SHA b75ff984 bắt buộc, compose 2g/512MB, run id, backup tự bật). Không sửa docs khác.

## Evidence (builder, 2026-11-06)
Đối chiếu dữ liệu (cũ=`server-old` prod, mới=`server`):

| Hạng mục | cũ | mới |
|---|---|---|
| Bảng public (BASE TABLE) + view | 149 + 2 view (=151) | 149 + 2 view |
| `count(*)` toàn bộ 149 bảng (script so 2 danh sách) | — | **IDENTICAL** (diff rỗng) |
| leads / media / projects / rentals / news / wards / payload_migrations | 0 / 320 / 11 / 12 / 10 / 3321 / 43 | giống |
| `max(name)` payload_migrations | `20261023_030506_floor_distance_normalized` | giống |
| Extension | 7 | 7 (giống) |
| bucket tami-prod-public (`s3.bucket.list`) | size 257871920, logical 257357042, chunk 1595 | giống |
| `fs.du /buckets/tami-prod-public` | 1595 block, logical 257268967 | giống |
| tami-prod-private | size 0, chunk 0 | giống (rỗng) |

- Secret GitHub Environment `production` (DatDangg/bds-tami): DEPLOY_HOST/USER/SSH_KEY/KNOWN_HOSTS cập nhật 07:47:02–07:47:06Z (key từ file qua stdin, không in). known_hosts keyscan ed25519 đối chiếu `SHA256:5uzqgi5o…IXs94` KHỚP trước khi đặt.
- Deploy production run **42183151702** (ref staging, sha b75ff984…): success, 07:47:08Z→07:48:10Z, 1 job (~57s). Không phải retry. `production.current` = `ghcr.io/datdangg/bds-tami@sha256:edf4b3785fc98bde2393bf7020fc2e892469dab25da3edee666a1ab55d38c6a1` = image của `tami-app`. `127.0.0.1:3010/api/health` 200.
- Nginx 443: `tami-prod-tamihomes.conf` (nội dung = HEAD, file chưa bị sửa) → sites-available + symlink; `nginx -t` OK; reload; active.
- Smoke: `https://tamihomes.vn/` 200, 0 `X-Robots-Tag`; `https://www.tamihomes.vn/x?y=1` → 301 `https://tamihomes.vn/x?y=1`; staging `https://179-197-242-57.sslip.io/` 200 + `X-Robots-Tag: noindex, nofollow, noarchive`; prod cũ `tami.genieplatform.cloud` 200; `/api/metrics` 404, `/api/internal/x` 404, `/api/health` 200, `/robots.txt` 200. `https://outfitai.genieplatform.cloud/` 404 (như P2.T01: lỗi từ app của dự án đó, không do nginx TAMI).
- RAM (~6 phút sau deploy): app 220M/1G, jobs 173M/384M, postgres 108M/2G, redis 3.5M, seaweedfs 91M/256M, backup 12M; staging app 271M, jobs 178M, pg 98M, sw 125M. `free`: used 3.6Gi, available 4.2Gi, swap dùng 1.5/4.0 Gi (trước task 1.4) — chưa theo dõi đủ 15 phút. `OOMKilled=false`, `RestartCount=0` cho cả 6 container prod.
- Prod cũ: container `tami-*` không bị stop/restart (Up 4 ngày/2 tuần như trước), chỉ đọc (pg_dump, tar `:ro`).
- Còn lại cho reviewer: `pg_stat_archiver.failed_count` đang tăng đến P2.T03 (xem Decision log).
