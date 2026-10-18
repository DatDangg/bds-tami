---
id: ci-postgis-image-bookworm
type: feature
status: pending
created: 2026-10-19
backlog: BL-014
---

# CI test DB dùng cùng image Postgres với dev/staging/prod (bookworm, PG 17.11)

## Yêu cầu
MODIFY (hạ tầng CI). Sau BL-002, dev/staging/prod dùng image tự dựng `tami-postgis:17-3.5-bookworm` (Debian 12, PG 17.11, PostGIS 3.5.2 — `docker/backup/Dockerfile` target `postgis`). `.github/workflows/ci.yml:22` vẫn chạy service `postgis/postgis:17-3.5` (Debian 11 EOL, PG 17.5) ⇒ test CI chạy khác phiên bản/OS với môi trường thật. Nguồn: review BL-002 round 1/2 MINOR-6 (`.context/review-reports/feature-backup-base-image-debian12-phase-1-task-01-round-2-review.md`).

## Acceptance
- [ ] CI dùng DB cùng PG minor + PostGIS + glibc với image `postgis` (vd build target `postgis` trong job rồi chạy `docker run`, hoặc publish image lên GHCR) — không dựa vào image bullseye
- [ ] CI xanh; không đổi dữ liệu/DB thật

## Ghi chú
Không có rủi ro dữ liệu (DB CI dùng rồi bỏ). Ưu tiên thấp.
