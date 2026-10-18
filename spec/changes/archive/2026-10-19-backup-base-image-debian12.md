---
id: backup-base-image-debian12
type: feature
status: done
created: 2026-10-19
backlog: BL-002
---

# Nâng base image Debian 11 (EOL) của postgres/backup lên bản còn hỗ trợ

## Yêu cầu
MODIFY (L4 G14; G18 spec-validation layer 5). Image trong `docker/backup/` (và postgres liên quan) dựa trên Debian 11 (bullseye, EOL). Nâng lên base còn hỗ trợ (vd Debian 12 bookworm), giữ đúng major postgres client/server.
User quyết 2026-10-19: nâng **trước deploy prod**, thử backup/restore trên staging trước.

## Acceptance (bắt buộc)
- [x] Mọi Dockerfile/compose dùng base Debian 11 trong `docker/` chuyển sang base còn hỗ trợ (bookworm hoặc mới hơn), pin tag cụ thể
- [x] `pg_dump`/`pg_restore` cùng major với server Postgres đang dùng
- [x] Build image local PASS và backup/restore chạy thử local nếu có docker; không có → ghi `skip` + residual risk
- [x] Runbook ghi bước **thử backup + restore trên staging trước deploy prod** (không tự deploy)
- [x] Không đổi dữ liệu/volume, không đụng DB prod

## Ghi chú
Deploy staging/prod chỉ khi user yêu cầu rõ. Kiểm thử thật trên staging = bước người vận hành.

## Kết quả (2026-10-19)
- Task: `tasks/feature-backup-base-image-debian12/phase-1-task-01.md`; review STRICT PASS round 3 (`.context/review-reports/feature-backup-base-image-debian12-phase-1-task-01-round-3-review.md`).
- Build + e2e local PASS (chuyển image bullseye→bookworm có REINDEX/refresh collation/amcheck; backup/restore pgBackRest + restic s3/sftp). Runbook `docs/runbooks/postgres-base-image.md`.
- Residual: CHƯA chạy trên staging/prod (bước người vận hành, staging trước prod theo runbook); CI image → BL-014.
