# Task 02: `provinces`, `wards` + khung seed (`pnpm seed`) và dữ liệu 34 tỉnh/thành

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + seed dữ liệu nền
- Blast radius: src/collections/Provinces.ts, Wards.ts; seed/index.ts (runner `pnpm seed`, `pnpm seed --sample`); seed/data/provinces.json, wards.json; …
- Doc impact (dự kiến): ERD §4.2 nếu nguồn dữ liệu/trường khác
- Decision impact: NO

## Requirements
- LGL-01
- ERD §4.2
- FR-PUB-04 (lọc tỉnh/phường)

## Description
Collection địa giới 2 cấp (34 tỉnh, phường/xã kèm tên cũ) và khung seed idempotent dùng cho mọi dữ liệu nền + dữ liệu mẫu dev/staging.

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)

Mở khoá cho: `layer-5-task-01`, `layer-5-task-04`, `layer-6-task-01`, `layer-6-task-02`

## Acceptance Criteria
- [x] `provinces` (code U, name, shortName, slug U, sortOrder) và `wards` (province, code U, name, type, slug unique trong tỉnh, legacyNames)
- [x] Seed 34 tỉnh/thành và phường/xã theo danh mục hành chính chính thức sau 01/07/2025, có `legacyNames`
- [x] Seed idempotent (chạy lại không nhân bản, upsert theo `code`)
- [x] `--sample` (dữ liệu mẫu) bị chặn khi `APP_ENV=production`
- [x] Khách/sale chỉ đọc; admin sửa

## Tests cần viết
- Integration: seed 2 lần → số bản ghi không đổi
- Unit: slug phường unique trong tỉnh
- Integration: `APP_ENV=production` + `--sample` → thoát với lỗi

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-02-round-<R>-review.md`

## Migration
- Bảng `provinces`, `wards`, `wards_legacy_names`. Additive. Seed dữ liệu nền **không** phải clone dữ liệu giữa môi trường (cho phép chạy ở staging/prod vì là danh mục tĩnh, idempotent).
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 3
- Last failure type: review FAIL round 1 (M1 khoá so khớp bỏ hết dấu → 16 phường gộp legacyNames) — sửa attempt 2; attempt 3 = ghi đè tên Đào Duy Từ (user) + MINOR n1–n3
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 PASS
- Nguồn dữ liệu (user duyệt 2026-10-17): `seed/data/danh-muc-phuong-xa-moi.xlsx` (chính: mã tỉnh BNV 01–34, mã phường/xã TMS 8 số, tên) + `seed/data/vietnam-sap-nhap-phuong-xa.csv` (chỉ legacyNames). Converter `scripts/build-admin-units.mjs` → `seed/data/administrative-units.json`: 34 tỉnh, 3.321 phường/xã (687/2.621/13), 10.643 legacyNames, 9 alias chính tả + 1 ghi đè tên (40153016 Phường Đào Duy Từ)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 102 file 1.060 PASS (gồm integration DB); pnpm build PASS. Seed dev: lần đầu tạo 34/3.321, chạy lại unchanged; sau fix 16 → 1 updated rồi unchanged
- Reviewer verdict: STRICT FAIL round 1 → PASS round 2 → PASS round 3 (delta) — `.context/review-reports/build-tami-website-layer-2-task-02-round-3-review.md`
- Migration: `migrations/20261017_122831_provinces_wards.ts` additive (enum + provinces/wards/wards_legacy_names + cột locked_documents_rels), không HIGH_RISK
- Residual risk: index chung tên `province_slug_idx` (Payload không đặt tên được; trùng sẽ fail rõ khi migrate). Reseed ghi đè sửa tay của admin (upsert theo code — ghi ERD §4.2). Converter cần Node ≥22.18 (engines đã đặt). Hook searchText của rentals (L6-T02) phải lấy `legacyNames[].name`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.2 as-built (định dạng mã, nguồn + lệnh sinh lại, chuẩn hoá khoá/alias/ghi đè, slug/shortName/sortOrder, xoá tỉnh 409, reseed ghi đè)
- Decision log: nguồn xlsx chính + CSV tên cũ; ghi đè Đào Duy Tư → Đào Duy Từ (user, progress.json decisions)

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-02 geo` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Provinces.ts, Wards.ts
- seed/index.ts (runner `pnpm seed`, `pnpm seed --sample`)
- seed/data/provinces.json, wards.json
- seed/geo.ts
- migrations/*

## Notes
- HỎI USER TRƯỚC KHI LÀM: nguồn file danh mục hành chính chính thức (34 tỉnh/thành, phường/xã sau 01/07/2025 + tên cũ). Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- KHÔNG tự bịa danh sách phường.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
