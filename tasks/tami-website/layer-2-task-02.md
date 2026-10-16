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
- [ ] `provinces` (code U, name, shortName, slug U, sortOrder) và `wards` (province, code U, name, type, slug unique trong tỉnh, legacyNames)
- [ ] Seed 34 tỉnh/thành và phường/xã theo danh mục hành chính chính thức sau 01/07/2025, có `legacyNames`
- [ ] Seed idempotent (chạy lại không nhân bản, upsert theo `code`)
- [ ] `--sample` (dữ liệu mẫu) bị chặn khi `APP_ENV=production`
- [ ] Khách/sale chỉ đọc; admin sửa

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
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: ERD §4.2 nếu nguồn dữ liệu/trường khác)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-02 geo` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

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
