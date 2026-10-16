# Task 02: Collection `staff` (auth) + hàm phân quyền `src/access/`

## Layer
1 — Hạ tầng dùng chung (CI, auth, i18n, UI, thư viện, bảo mật, jobs)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — auth/RBAC + schema
- Blast radius: src/collections/Staff.ts; src/access/roles.ts (hằng `ROLES`); src/access/isAdmin.ts, isStaff.ts, isAuthorOrAdmin.ts, isAssignedOrAdmin.ts, publishedOnly.ts; …
- Doc impact (dự kiến): PERMISSION.md nếu tên hàm/quy tắc khác thiết kế (code thắng, cập nhật cùng task).
- Decision impact: NO

## Requirements
- FR-ADM-11 (phần nền)
- NFR-04
- PERMISSION §1, §2, §7
- ERD §4.1

## Description
Tạo collection auth `staff` (admin/sale) và bộ hàm access dùng chung, làm nền cho mọi collection sau.

## Dependencies
- `layer-0-task-01` Scaffold Next.js + Payload 3 + tooling + Docker Compose dev (dùng kết quả của task này)

Mở khoá cho: `layer-2-task-01`, `layer-2-task-02`, `layer-2-task-03`, `layer-2-task-04`, `layer-2-task-05`, `layer-2-task-07`, `layer-3-task-02`

## Acceptance Criteria
- [x] `staff` có `email`, `fullName`, `phone`, `avatar` (để trống quan hệ media tới task media), `role` (`admin`|`sale`, mặc định `sale`), `active`, `lastLoginAt`
- [x] `auth.maxLoginAttempts: 5`, `lockTime` 10 phút; mật khẩu tối thiểu 10 ký tự (validate)
- [x] Tài khoản `active = false` không đăng nhập được và mọi hàm access trả false
- [x] `isAuthorOrAdmin` trả `true` cho admin, trả query constraint `{ author: { equals: user.id } }` cho sale; `isAssignedOrAdmin` tương tự với `assignedTo`
- [x] `publishedOnly`: khách chỉ thấy `status` công khai (rentals: `published`/`rented`; còn lại `published`) và chưa xoá mềm; staff thấy tất cả. Viết dạng hàm tạo `where` dùng chung để task hẹn giờ (Could) chỉ thêm điều kiện `publishedAt ≤ now` ở **một chỗ**
- [x] Field `role`, `active` chỉ admin sửa; sale chỉ đọc/sửa hồ sơ của chính mình
- [x] Không hardcode chuỗi vai trò ngoài `roles.ts`

## Tests cần viết
- Integration: admin/sale/khách/tài khoản khoá với từng hàm access (bảng kỳ vọng theo PERMISSION §2)
- Integration: sale không đổi được `role` của mình; sale không đọc được hồ sơ sale khác (trừ trường công khai cần cho trang tin)
- Integration: đăng nhập sai 5 lần → khoá

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-02-round-<R>-review.md`

## Migration
- Tạo bảng `staff`. Additive (bảng mới), không HIGH_RISK.
- Thực tế (builder, attempt 2): migration `20261016_092103_staff_auth` là ALTER bảng `staff` đã có từ layer 0 (`ADD COLUMN full_name ... NOT NULL` không default, thêm enum `enum_staff_role`, cột `phone`/`role`/`active`/`last_login_at`, index `role`). Chấp nhận vì chưa có môi trường nào có dữ liệu `staff` (dev đếm 0 dòng); reviewer đồng ý, không HIGH_RISK. Nếu có môi trường đã có dòng `staff` thì phải thêm default/backfill trước khi áp.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS (reviewer xác minh)
- Verify commands + result: install --frozen-lockfile/lint/typecheck/test (45, integration DB thật)/build = PASS; 4 attempt (round 1–3 FAIL: M1 reset bỏ qua min length, M2 sale đổi email, M3 multipart 415, M4 file-first _payload lách) → architecture review hướng A (user duyệt). Residual: Local API resetPassword không kiểm độ dài; form admin chưa thử trên trình duyệt
- Reviewer verdict: STRICT PASS round 4 — `.context/review-reports/build-tami-website-layer-1-task-02-round-4-review.md`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: docs/PERMISSION.md (as-built: mô tả hàm access)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-02 auth` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Staff.ts
- src/access/roles.ts (hằng `ROLES`)
- src/access/isAdmin.ts, isStaff.ts, isAuthorOrAdmin.ts, isAssignedOrAdmin.ts, publishedOnly.ts
- src/access/index.ts
- tests/integration/access.test.ts
- migrations/*

## Notes
- Field `avatar` thêm ở task media (tránh phụ thuộc vòng); hoặc thêm sau bằng migration riêng.
- Session 8 giờ không hoạt động làm ở task riêng (session-refresh).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-0-task-01 (16/10/2026)
- F1: `src/payload.config.ts` admin `i18n.supportedLanguages` đang có `{ vi, en }` → spec: admin CHỈ tiếng Việt → để `{ vi }`. Collection `staff` tối thiểu đã có ở `src/collections/Staff.ts` (layer 0) — mở rộng, không tạo lại.
