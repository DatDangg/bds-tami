# Spec Update — 2026-11-09 admin-validation-error-english-toast

**spec_version:** 1.62.1 → 1.62.2 (PATCH — as-built bug-fix, không đổi requirement/luật validate)
**Trigger:** bug-fix (BL-113, change-request class BUG)
**Work item:** `bug/admin-validation-error-english-toast`
**Change doc:** `spec/changes/2026-11-06-admin-validation-error-english-toast.md`
**Task:** `tasks/bug-admin-validation-error-english-toast/phase-1-task-01.md` (reviewer STRICT PASS round 2)

## Lý do
Admin chỉ bật `vi`, nhưng `new ValidationError` của dự án không truyền `req.t` nên toast hiện tiếng Anh "The following field is invalid: password" và không nêu lý do (lỗi field auth `password` không hiện dưới ô).

## Delta (SPECIFICATIONS.md, F10 — đoạn "Lỗi validate trong admin bằng tiếng Việt (BL-113)")
- LÀM RÕ (as-built): 7 hook/collection đi qua helper `src/lib/errors/vi-validation-error.ts` → toast tiếng Việt, lý do nằm trong message: Staff mật khẩu < 10 ký tự (cả `/reset-password`), last-admin-guard (đơn + hàng loạt), require-english-fields, lead ẩn danh (sync-phone-normalized), lead-activity mã lead, cây danh mục.
- SỬA hành vi lỗi: xoá hồ sơ ứng tuyển khi S3 lỗi → 502 `APIError` công khai "Không xoá được CV trên kho lưu trữ, vui lòng thử lại sau." (trước: 500 "Something went wrong.").
- Không đổi luật validate, schema, access, API shape (`errors[].path/message/data`), không migration.

## Ảnh hưởng
Chỉ chữ `message` lỗi + status 502 ở xoá hồ sơ ứng tuyển lỗi S3. Code khác bắt `instanceof ValidationError` / đọc `error.data.errors` (job-applications, newsletter, translate-content) giữ nguyên. Risk medium. Chưa kiểm trên trình duyệt admin thật (dựa test `formatErrors` + endpoint).
