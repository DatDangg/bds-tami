# Spec Update — 2026-10-19 backup-base-image-debian12

**spec_version:** 1.9.0 → 1.10.0 (MINOR — thêm ràng buộc vận hành hạ tầng: base OS image Postgres/backup + quy trình đổi image; không đổi tính năng/API/schema ứng dụng)

**Trigger:** feature-update (Change Request MODIFY, hạ tầng, BL-002) — change doc `spec/changes/archive/2026-10-19-backup-base-image-debian12.md`, task `tasks/feature-backup-base-image-debian12/phase-1-task-01.md`

**Nguồn:** L4 G14; G18 spec-validation layer 5; `docs/runbooks/restore.md` §9 — image `docker/backup/` + postgres dev/staging chạy trên Debian 11 bullseye (EOL). User quyết 2026-10-19: nâng trước deploy prod, diễn tập backup/restore trên staging trước.

**Requirements:**
- THÊM bullet **§Hạ tầng** trong `SPECIFICATIONS.md` (sau "Backup ngoài server: pgBackRest…"): image PostgreSQL (dev/staging/prod) + sidecar backup chạy trên OS còn hỗ trợ bảo mật (**Debian 12 bookworm**, ghim digest/phiên bản), giữ **PostgreSQL 17 + PostGIS 3.5**; `pg_dump`/`pgbackrest` cùng major với server. Đổi base OS trên volume có dữ liệu (đổi glibc 2.31 → 2.36 ⇒ đổi collation `en_US.utf8`) chỉ làm theo runbook: dừng app → backup → đổi image → `REINDEX` + `ALTER DATABASE … REFRESH COLLATION VERSION` → amcheck → bật app; **diễn tập backup/restore trên staging trước production**; deploy tự động **không** được tự đổi image postgres trên volume cũ.
- Liên quan (không đổi chữ): **NFR-05** (backup ngoài server, RPO ≤ 15 phút, RTO ≤ 4 giờ, diễn tập khôi phục 6 tháng/lần).

**Code dự kiến (builder chốt ở close-out):**
- `docker/backup/Dockerfile` (target `postgis` từ `postgres:17.11-bookworm` ghim digest + PostGIS `3.5.2+dfsg-1.pgdg120+1`; `postgres` + `pgbackrest=2.59.1-1.pgdg12+1`; `backup`; assert bookworm/glibc 2.36)
- `docker/backup/postgis/10_postgis.sh`, `docker/backup/postgis/update-postgis.sh` (mới, vendor từ postgis/docker-postgis, MIT); `docker/backup/pgbackrest-env.example`; `docs/runbooks/postgres-base-image.md` (mới, runbook chuyển image)
- `docker/docker-compose.{dev,staging,prod}.yml` (tag image mới)
- `docker/backup/test/e2e.sh` (+ `docker-compose.e2e.yml` nếu cần) — `image_switch_test` bullseye → bookworm
- `scripts/deploy/deploy.sh` + `scripts/deploy/deploy.test.sh` (guard chặn đổi image postgres tự động)
- `docs/runbooks/restore.md`, `docs/runbooks/deploy.md`, `docs/ARCHITECTURE.md`

**Schema/API:** không đổi (không migration Payload, không đổi volume/dữ liệu thật).

**Ảnh hưởng:**
- Backup/restore pgBackRest + restic (s3 + sftp).
- Deploy: `deploy.sh` khởi động base services (postgres/redis/seaweedfs/backup).
- Dev DB khởi tạo mới (extension postgis/pg_trgm/unaccent…), staging DB (đổi image theo runbook).
- Risk HIGH: collation/index text sau đổi glibc.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 10
