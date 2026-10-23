# Spec Update — 2026-10-23 first-user-avatar-upload

**spec_version:** 1.56.0 → 1.56.1 (PATCH — ghi as-built, không đổi requirement / intent)
**Trigger:** bug-fix (BL-069, change-request class BUG)
**Work item:** `bug/first-user-avatar-upload` phase-1-task-01 — Reviewer round 1 STRICT PASS (`.context/review-reports/bug-first-user-avatar-upload-phase-1-task-01-round-1-review.md`)
**Change doc:** `spec/changes/2026-10-23-first-user-avatar-upload.md` · task `tasks/bug-first-user-avatar-upload/phase-1-task-01.md`

## Lý do
Ở `/admin/create-first-user` (DB mới, chưa ai đăng nhập) trường "Ảnh đại diện" (`staff.avatar`, upload → `media`) vẫn hiện; tải ảnh gọi tạo media,
mà `Media.access.create = isStaff` (cần user `active`) → bị từ chối ("Bạn không có quyền thực hiện thao tác này.") và form bị xoá trắng,
người tạo admin đầu tiên mất dữ liệu đã nhập (gặp khi dựng production 2026-10-23).

## Requirements
- **THÊM / SỬA / XOÁ:** không. Quản trị tài khoản nhân sự (F10) giữ nguyên ý định.
- **Làm rõ as-built** (SPECIFICATIONS.md, F10, đoạn "As-built bug-fix BL-069"): `staff.avatar` có `admin.condition` — ẩn khi chưa đăng nhập
  (`/admin/create-first-user`), hiện như cũ với admin/sale đã đăng nhập (form tạo/sửa staff). Không nới quyền tạo `media`.

## Ảnh hưởng
- Module: `src/collections/Staff.ts` (field `avatar`), test mới `src/collections/staff-avatar-condition.test.ts`.
- Không đổi schema / API / quyền / i18n, không migration.
