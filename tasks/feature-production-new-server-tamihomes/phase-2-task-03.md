# feature-production-new-server-tamihomes · phase-2-task-03 — Backup production trên server mới + diễn tập khôi phục (BL-112)

- Phụ thuộc: phase-2-task-02. `[XÁC NHẬN]` từng bước. Theo `docs/runbooks/restore.md` §2 bước 3–6, §3.1, §4, §6.
- Trạng thái: `done` — reviewer STRICT FAIL r1 (runbook gọi ./pg-restore.sh thiếu exec bit) → PASS r2.

## Classification / Risk
- Risk: **HIGH** (backup production, kho R2 dùng chung bucket với kho cũ). Review: **STRICT**.

## Việc
1. `$C up -d backup` (postgres đã chạy image pgbackrest, archive_mode=on từ P2.T02 — WAL đang dồn `pg_wal`, làm bước 2 ngay).
2. `pg-backup.sh stanza-create` (path `/tami-prod-s2`) → `check` OK → `restic-backup.sh init` (repo `tami-prod-files-s2`).
3. `pg-backup.sh full`, `restic-backup.sh backup`, `info`, `snapshots`, đọc `tami_backup.prom`.
4. Diễn tập: restore.md §3.1 (restore vào volume MỚI + container tạm `archive_mode=off`, đếm bảng/dòng khớp DB đang chạy) + §4 (restic restore 1 thư mục ra chỗ tạm, so số file/byte). Dọn volume/container tạm sau khi ghi kết quả.
5. Kiểm kho cũ `/tami-prod` + `tami-prod-files` của server cũ **không bị đụng** (server cũ vẫn `OK wal` trong log).

## Verify
- `pg-backup.sh info` có 1 full; `restic snapshots` có 1 snapshot; heartbeat prom mới.
- Restore drill: số bảng = 151, count bảng chính khớp; restic restore khớp số file. Thời gian ghi vào restore.md §5.
- RAM trong lúc full: `free -h`, không OOM (`docker inspect -f '{{.State.OOMKilled}}' tami-postgres tami-backup` = false).

## Acceptance
- [ ] Backup production chạy + restore thử PASS trên server mới (acceptance change doc).

## Retry / Escalation
stanza/check lỗi do system-id → kiểm đúng path mới, KHÔNG `stanza-delete` kho cũ. `stanza-create` / `restic init` báo kho `-s2` đã có dữ liệu → DỪNG, không `--force` (review P2.T01 MINOR). 3 attempt fail → `architecture_review_needed`.

## Decision log (builder, 2026-11-06)
- `$C exec` dùng được nếu `export TAMI_IMAGE="$(cat /opt/tami/state/production.current)"` (restore.md:10); tôi không export nên dùng `docker exec tami-backup/tami-postgres` tương đương. `pg-restore.sh` chạy bằng `bash ./pg-restore.sh` (file mode 100644, lần đầu `./` rc=126, chưa chạm gì; drill dở đã dọn rồi chạy lại). Runbook §3.1/§3.2 đã sửa thành `bash ./pg-restore.sh`.
- `stanza-create` (path `/tami-prod-s2`) completed, không báo kho đã có dữ liệu; `restic init` tạo repo mới `5bc42d9a83` (`.../tami-prod-backup/tami-prod-files-s2`). Không dùng `--force`/`stanza-delete`; không đụng kho cũ.
- Drill dùng mạng riêng `drill-net` (không publish cổng), `--memory 768m`, `archive_mode=off`, restore "mới nhất" (không PITR). Lần drill đầu hỏng do lỗi lệnh restore (xem trên) nên container chạy trên volume rỗng (tự initdb) — đã xoá, không ảnh hưởng.
- `prod-trial.dump` (1 577 037 B, sha 22766bad…) đã xoá; `/opt/tami/transfer/` rỗng. P3 lấy dump mới.
- restore.md: chỉ thêm 1 dòng bảng §8 (diễn tập đầu tiên). Không có chỗ nào trong file nhắc path kho nên không sửa thêm. Runbook §5 là số đo local nên không chèn.
- Residual: `tami_backup_last_run_ok{kind="pg_diff"}=0` do lần `pg_diff` lúc chưa có stanza; tự về 1 khi diff 02:00 chạy (full chưa ghi `pg_diff.success`). Heartbeat `pg_diff` chưa có `.success` cho tới đêm nay — chưa phải lỗi nhưng reviewer lưu ý. Full mất 459 s (phần lớn là bước copy tới R2 + chờ WAL), restore 240 s: dữ liệu nhỏ mà chậm do R2 round-trip nhiều file nhỏ; RTO thật sẽ lớn hơn với DB lớn.

## Evidence (builder, 2026-11-06)
- Thời điểm: stanza-create 07:55:11Z; check OK 07:55:29Z (WAL `…08` lên `/tami-prod-s2/archive/tami/17-1/…`); restic init OK.
- `pg-backup.sh full`: label `20261106-145540F` (giờ +07), 83,5MB DB, 3291 file, repo 8,8MB, rc=0, 459 s. `restic backup`: snapshot `569520db`, 1593 file, 245,351 MiB, +232,9 MiB lưu, rc=0, 12 s.
- `info`: stanza tami status ok, cipher aes-256-cbc, **1 full**, WAL archive min/max `…01`/`…0C`. `restic snapshots`: **1 snapshot** (host `tami-production`, tag tami-files, `/mirror`).
- `tami_backup.prom` (08:03Z): last_success `wal` 1793951870, `pg_full` 1793952198, `files` 1793952210; last_run_ok wal/pg_full/files = 1, pg_diff = 0 (xem Residual).
- WAL archive: `pg_stat_archiver.failed_count` = **44 trước stanza = 44 sau** (chỉ giảm tốc lỗi cũ, không tăng thêm); `last_archived_wal` `…0A.00000028.backup` 08:03:15Z → `…0E` 08:12:52Z (mới). `pg_wal`: 10 file, 113M sau khi hết dồn.
- Drill pgBackRest (volume mới, `drill-pg`, `drill-net`, mem 768m, `archive_mode=off`): restore **240 s** (set 20261106-145540F); recovery tới `not in_recovery` **8 s**. `tables=151` (149 bảng + 2 view), ext=7 (fuzzystrmatch, pg_trgm, plpgsql, postgis, postgis_tiger_geocoder, postgis_topology, unaccent), `payload_migrations` max `20261023_030506_floor_distance_normalized`. `count(*)` 149 bảng: drill vs DB đang chạy **IDENTICAL** (diff rỗng; media 320, projects 11, rentals 12, wards 3321, wards_legacy_names 10600, spatial_ref_sys 8500, payload_migrations 43, leads 0). PostGIS: `_projects_v.version_location` 21 dòng/21 điểm drill = live. drill OOMKilled=false.
- Drill restic: `restore latest /tmp/restored` **9 s**, 1596 mục/245,351 MiB; **1593 file = 1593 file** của `/mirror`; hai bucket `tami-prod-private`, `tami-prod-public`; sha256 300 file đầu IDENTICAL. Tổng byte `du -sb`: 257 416 423 (restored) vs 257 412 327 (`/mirror`) — lệch 4096 B = 1 inode thư mục (du -sb tính cả thư mục; số file bằng nhau, sha khớp). Chưa so từng file toàn bộ.
- Dọn: container `drill-pg`, volume `drill_pg_*`, mạng `drill-net`, `/tmp/restored` đều xoá (kiểm: 0 còn lại); `/opt/tami/transfer` rỗng.
- Kho cũ: server-old `tami-backup` log `OK wal` 07:45, 07:55, 08:05, 08:15Z (chỉ đọc). Không thao tác nào chạm `/tami-prod`, `tami-prod-files`.
- RAM: lúc full (07:55–07:59, 20 mẫu) used 3616–3705 MB, avail ≥ 4230 MB, swap 1537 MB không đổi; lúc restore (08:04–08:13) used ≤ 3695 MB, avail ≥ 4240 MB, swap 1537→1540 MB. Cuối: `free -h` used 3.6Gi, avail 4.2Gi, swap 1.5/4.0Gi. `OOMKilled=false`, `RestartCount=0` cho tami-postgres/backup/app/jobs/redis/seaweedfs.

## Round 2 (builder, 2026-11-06)
- Sửa restore.md §3.1 (dòng 97), §3.2 (dòng 116) thành `bash ./pg-restore.sh`; dòng §8 ghi lỗi rc=126 + cách gọi đúng. Không đổi mode file.
- Residual: restic chỉ so sha256 300/1593 file (số file khớp); `pg_diff` có thể tự retry sau 30 phút, chưa thấy `.success` lúc 08:17Z; PITR (`--target-time`) chưa diễn tập, chỉ restore "mới nhất".
- Trạng thái: `done` — reviewer STRICT FAIL r1 (runbook gọi ./pg-restore.sh thiếu exec bit) → PASS r2.

- (review r2 MINOR-A) `pg_diff` đã tự retry thành công ~08:18Z (`tami_backup_last_run_ok{kind="pg_diff"}=1`).
