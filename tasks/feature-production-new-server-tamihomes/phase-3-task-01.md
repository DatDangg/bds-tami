# feature-production-new-server-tamihomes · phase-3-task-01 — Cắt chuyển: khoá ghi → dump cuối → restore → đối chiếu → tên miền cũ 301 (BL-112)

- Phụ thuộc: phase-2-task-03 PASS. **User chọn giờ** (đề xuất: ngay sau khi P2 xong, giờ ít người — traffic hiện rất thấp, chưa có lead).
- Trạng thái: `done` — reviewer STRICT PASS round 1; dump cuối đã xoá 08:46Z.

## Classification / Risk
- Risk: **HIGH** — `HIGH_RISK_DATA`: thay toàn bộ DB/object của prod mới (chỉ chứa bản thử) bằng bản cuối. Review: **STRICT**.

## Downtime ước tính
- `tami.genieplatform.cloud`: ~20–30 phút (khoá ghi tới khi bật 301). `tamihomes.vn`: ~10–15 phút (lúc restore, Nginx trả 502).
- Dữ liệu nhỏ (DB 166 MB, file ~250 MB) nên dump/restore/chép mỗi bước vài phút.
- User **không sửa nội dung trong /admin** từ lúc bắt đầu tới khi báo xong.

## Việc
0. (review P2.T02 MINOR) Trước khi restore: đếm `leads` + bảng có `updated_at` mới trên prod MỚI so với bản thử (P2.T02 Evidence) — có dữ liệu nhập trên tamihomes.vn sau 07:47Z thì báo/giữ lại trước khi ghi đè.
1. Server cũ — khoá ghi: `docker stop tami-app tami-jobs` (không `down`, không `-v`). Site cũ tạm lỗi 502.
2. Dump cuối `pg_dump -Fc` + chép 2 bucket prod → server mới (`/opt/tami/transfer`).
3. Server mới: `docker stop tami-app tami-jobs tami-backup`; DROP + CREATE database `tami` trong cùng cluster (giữ system-id ⇒ stanza backup vẫn hợp lệ) rồi `pg_restore`; xoá object cũ + chép object mới vào 2 bucket.
4. Đếm đối chiếu cũ ↔ mới: số bảng, `count(*)` toàn bộ bảng `public` (script so 2 danh sách), số object + byte mỗi bucket. Lệch → DỪNG, không bật 301.
5. Server mới: `FLUSHALL` redis prod + `$C up -d --force-recreate app jobs backup` (bỏ cache dữ liệu thử); health 200.
6. Server cũ: thay `sites-enabled/tami-prod-direct.conf` bằng `tami-prod-genieplatform-redirect.conf` (giữ bản sao), `nginx -t`, reload. Cổng 80 + cert cũ giữ nguyên.
7. `pg-backup.sh full` + `restic backup` ngay sau restore (P3.T02 kiểm).

## Verify
- Đếm khớp 100% (ghi bảng so sánh vào Evidence).
- `curl -sI https://tami.genieplatform.cloud/du-an/x` → 301 `https://tamihomes.vn/du-an/x`.
- Đăng nhập admin trên tamihomes.vn được (cùng `PAYLOAD_SECRET`; cookie cũ thuộc domain cũ nên phải đăng nhập lại — bình thường).

## Rollback (trong lúc prod cũ chưa bị dừng hẳn — P4.T02)
- Server cũ: trả `tami-prod-direct.conf`, reload nginx, `docker start tami-app tami-jobs` → `tami.genieplatform.cloud` chạy lại như trước (dữ liệu cũ nguyên vẹn).
- Dữ liệu nhập trên tamihomes.vn sau cắt chuyển sẽ **không** có ở bản cũ (chép ngược tay nếu cần).
- `tamihomes.vn`: gỡ symlink 443 hoặc để nguyên; DNS không cần đổi.

## Retry / Escalation
Lệch số liệu / restore lỗi → rollback ngay, không thử lại trong cùng cửa sổ. 3 attempt fail → `architecture_review_needed`.

## Decision log (builder, 2026-11-06)
- Bước 0 (08:27Z): `count(*)` 149 bảng prod MỚI == prod cũ đang chạy (diff rỗng), leads = 0; `max(updated_at)` trên prod mới chỉ `payload_jobs`/`payload_jobs_stats` (hệ thống) mới hơn 07:00Z → không có dữ liệu thật nhập trên tamihomes.vn, tiếp tục.
- DB mới tạo từ `template0` thay vì `template1`: `template1` đã có sẵn `pg_trgm`/`fuzzystrmatch` nên `pg_restore --exit-on-error` sẽ báo "already exists"; từ template0 restore tự tạo đủ 7 extension, không cần DROP EXTENSION/SCHEMA tiger/topology. Cùng owner `tami`, `UTF8 en_US.utf8`; cluster giữ nguyên ⇒ system-id/stanza không đổi.
- `DROP DATABASE` làm mất `ALTER DATABASE tami SET search_path`; postgis đặt lại `public, tiger, topology` → chỉnh về `"$user", public, topology, tiger` như server cũ.
- SeaweedFS: stop seaweedfs mới trước, `find /d -mindepth 1 -delete`, tar volume cũ (alpine, `:ro`, seaweedfs cũ đã dừng) pipe ssh→ssh giải nén vào volume mới (259 101 890 B), start 2 bên. Seaweedfs cũ chỉ dừng 08:30:12→08:32:30; postgres/redis/backup cũ không đụng.
- Nginx server cũ: gỡ symlink `tami-prod-direct.conf`, thêm symlink `tami-prod-genieplatform-redirect.conf` (script tự trả lại nếu `nginx -t` fail — không xảy ra). `tami-prod-direct.conf` còn nguyên trong sites-available. Chỉ `nginx -t` + `systemctl reload`.
- Dump cuối **giữ** `/opt/tami/transfer/prod-final.dump` (deploy, 700/600, 1 577 037 B, sha256 `f0baf271…18db`) tới khi reviewer duyệt, xoá sau. Không có dump/secret trên máy dev.
- Runbook: thêm §12.1b (mốc giờ, downtime, khác biệt). Không sửa docs khác.

## Evidence (builder, 2026-11-06, UTC)
| Bước | Giờ |
|---|---|
| 0 kiểm dữ liệu prod mới | 08:27 |
| 1 khoá ghi server cũ (stop tami-app, tami-jobs) | 08:28:18 → 08:28:40 |
| 2 dump cuối pg_dump -Fc → /opt/tami/transfer | 08:28:48 → 08:28:51 |
| 3 server mới stop app/jobs/backup/seaweedfs | 08:29:05 |
| 3 DROP+CREATE DB, pg_restore (rc=0) | 08:29:45 → 08:29:50 |
| 3 SeaweedFS cũ stop → tar → start cũ | 08:30:12 → 08:32:30 |
| 4 đối chiếu | 08:32:43 |
| 5 FLUSHALL + up -d --force-recreate app jobs backup | 08:33:08 → 08:33:12; health 200 lúc 08:33:17 |
| 6 nginx server cũ → 301 | 08:33:35 → 08:33:40 |
| 7 pg full + restic | 08:33:47 → 08:41:27 |

**Downtime thực tế**: tami.genieplatform.cloud 08:28:18 → 08:33:40 = ~5 phút 22 giây; tamihomes.vn (app mới) 08:29:05 → 08:33:17 = ~4 phút 12 giây.

Bảng đối chiếu (cũ = server-old sau khoá ghi, mới = sau restore):
| Hạng mục | cũ | mới |
|---|---|---|
| Bảng public / view | 149 / 2 | 149 / 2 |
| `count(*)` 149 bảng (danh sách `tên|count`, sha256 `a26d9b14f27cc89b…`) | — | **IDENTICAL** (diff rỗng) |
| Extension | fuzzystrmatch, pg_trgm, plpgsql, postgis, postgis_tiger_geocoder, postgis_topology, unaccent | giống |
| Last migration / số migration | `20261023_030506_floor_distance_normalized` / 43 | giống |
| `search_path` DB tami | `"$user", public, topology, tiger` | giống (đặt lại) |
| `s3.bucket.list` tami-prod-public | size 257871920, logical 257357042, chunk 1595 | giống (hiện sau ~30s khởi động seaweedfs) |
| `fs.du /buckets/tami-prod-public` | 1595 block, 257268967 | giống |
| tami-prod-private | 0 | 0 |
Dữ liệu cũ không đổi giữa bước 0 và sau khoá ghi (count diff rỗng).

Kiểm sau cắt chuyển: `127.0.0.1:3010/api/health` 200; `https://tamihomes.vn/` 200, 0 `X-Robots-Tag`; `/du-an` 200; `/api/media/file/55bacbf1-….jpg` 200 (213 686 B, đọc từ SeaweedFS mới); `curl -sI https://tami.genieplatform.cloud/du-an/x` → `301 Location: https://tamihomes.vn/du-an/x`; `http://tami.genieplatform.cloud/du-an/x` → 301 sang https cùng host (rồi 301 tiếp); staging `https://179-197-242-57.sslip.io/` 200 + `X-Robots-Tag: noindex, nofollow, noarchive`. Log app/jobs 5 phút đầu không có error/fail. CHƯA kiểm đăng nhập admin bằng trình duyệt (cần tài khoản; cùng `PAYLOAD_SECRET`) — để reviewer/P3.T02 hoặc user.
Backup: pgBackRest full `20261106-153347F` (82 MB) completed (~7,5 phút), `info` status ok (2 full), WAL archive tới `…1A`, `check` OK, `pg_stat_archiver.failed_count` đứng yên 44 (số cũ từ P2.T02), archived_count tăng; restic snapshot `d1620215` (245,351 MiB), tổng 2 snapshot; log `OK pg_full`, `OK files`.
RAM/OOM: `free` used 3.6Gi, available 4.2Gi, swap 1.4/4.0Gi (không tăng); `OOMKilled=false`, `RestartCount=0` cho 11 container tami + tami-staging; staging và dự án khác không đổi. Server cũ: tami-postgres/redis/backup/staging-* vẫn Up; app/jobs cũ Exited (chưa `--restart=no`, P4.T02), có thể `docker start` để rollback.
Rollback không phải dùng.
