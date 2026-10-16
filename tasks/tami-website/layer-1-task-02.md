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
- [ ] `staff` có `email`, `fullName`, `phone`, `avatar` (để trống quan hệ media tới task media), `role` (`admin`|`sale`, mặc định `sale`), `active`, `lastLoginAt`
- [ ] `auth.maxLoginAttempts: 5`, `lockTime` 10 phút; mật khẩu tối thiểu 10 ký tự (validate)
- [ ] Tài khoản `active = false` không đăng nhập được và mọi hàm access trả false
- [ ] `isAuthorOrAdmin` trả `true` cho admin, trả query constraint `{ author: { equals: user.id } }` cho sale; `isAssignedOrAdmin` tương tự với `assignedTo`
- [ ] `publishedOnly`: khách chỉ thấy `status` công khai (rentals: `published`/`rented`; còn lại `published`) và chưa xoá mềm; staff thấy tất cả. Viết dạng hàm tạo `where` dùng chung để task hẹn giờ (Could) chỉ thêm điều kiện `publishedAt ≤ now` ở **một chỗ**
- [ ] Field `role`, `active` chỉ admin sửa; sale chỉ đọc/sửa hồ sơ của chính mình
- [ ] Không hardcode chuỗi vai trò ngoài `roles.ts`

## Tests cần viết
- Integration: admin/sale/khách/tài khoản khoá với từng hàm access (bảng kỳ vọng theo PERMISSION §2)
- Integration: sale không đổi được `role` của mình; sale không đọc được hồ sơ sale khác (trừ trường công khai cần cho trang tin)
- Integration: đăng nhập sai 5 lần → khoá

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-1-task-02-round-<R>-review.md`

## Migration
- Tạo bảng `staff`. Additive (bảng mới), không HIGH_RISK.
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
- Doc impact result: pending (dự kiến: PERMISSION.md nếu tên hàm/quy tắc khác thiết kế (code thắng, cập nhật cùng task).)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-1): task-02 auth` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-1/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

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
