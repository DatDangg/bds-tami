# feature-production-new-server-tamihomes · phase-2-task-03 — Backup production trên server mới + diễn tập khôi phục (BL-112)

- Phụ thuộc: phase-2-task-02. `[XÁC NHẬN]` từng bước. Theo `docs/runbooks/restore.md` §2 bước 3–6, §3.1, §4, §6.
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z.

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
