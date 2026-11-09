# Spec Update — 2026-11-09 production-new-server-tamihomes

**spec_version:** 1.63.0 → 1.63.1 (PATCH — as-built hạ tầng Deployment, không đổi requirement sản phẩm)
**Trigger:** feature-update (BL-112, change-request class MODIFY, hạ tầng) — khớp `trigger` trong `spec/test-scope/current.json` v118
**Work item:** `feature/production-new-server-tamihomes` (phase-4-task-02)
**Change doc:** `spec/changes/archive/2026-11-06-production-new-server-tamihomes.md`

## Lý do
Production chuyển từ server cũ 187.52.119.50 (`https://tami.genieplatform.cloud`) sang server mới 179.197.242.57 (cùng host với staging `https://179-197-242-57.sslip.io`), tên miền `https://tamihomes.vn`.

## Delta (SPECIFICATIONS.md § Hạ tầng/Deployment, bullet "As-built BL-112")
- LÀM RÕ: production = `https://tamihomes.vn`; `www.tamihomes.vn` → 301 apex; `https://tami.genieplatform.cloud/*` → 301 `https://tamihomes.vn/*` (giữ path). Cắt chuyển 2026-11-06 08:28Z, đối chiếu dữ liệu 100%.
- LÀM RÕ: 2026-11-09 stack cũ (prod `tami-*` + staging cũ) trên server cũ đã dừng (docker stop, restart=no, dữ liệu giữ); `https://187-52-119-50.sslip.io` không còn là môi trường TAMI.
- LÀM RÕ: backup prod R2 path `/tami-prod-s2` + `tami-prod-files-s2`.
- Bullet BL-111 sửa câu "production vẫn trên server cũ" thành lịch sử; ghi job CI `record-staging-pass` đã gỡ (cùng server, `staging.history` chung).
- Không đổi business rule, code ứng dụng, schema, API, migration.

## Ảnh hưởng
Chỉ môi trường test/vận hành: smoke production tại `https://tamihomes.vn`; staging giữ `https://179-197-242-57.sslip.io`. Tồn đọng (backlog riêng): Turnstile prod vẫn test key (BL-118), SMTP prod vẫn `smtp.invalid` (BL-095). Risk low-medium (hạ tầng, không đổi code app).
Docs as-built liên quan: `docs/runbooks/deploy.md` §9/§10/§12, `docs/runbooks/restore.md`, `docs/ARCHITECTURE.md` §6, `.context/project-config.md`, `.context/decisions.md` Decision 13.
