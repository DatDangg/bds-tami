---
id: legal-en-edit-requires-reapproval
type: feature
status: done
created: 2026-10-19
backlog: BL-013
---

# Trang pháp lý: sửa tay bản EN đã duyệt → ẩn /en tới khi duyệt lại (BR-08)

## Yêu cầu
MODIFY (review L10-T02 round 4). User quyết BR-08 (2026-10-19): **bắt duyệt lại** mọi thay đổi EN pháp lý. Hiện admin sửa tay bản EN đã duyệt thì nội dung mới lên /en ngay. Đổi: nội dung EN của trang pháp lý đã duyệt bị sửa tay → bỏ trạng thái duyệt, ẩn /en tới khi admin duyệt lại qua lệnh duyệt rõ ràng — giống luồng "AI dịch lại" hiện có (L10-T02).

## Acceptance (bắt buộc)
- [x] Sửa trường nội dung EN của trang pháp lý đã duyệt (admin/API, không phải lệnh duyệt) → trạng thái duyệt EN về chưa duyệt, /en của trang đó ẩn như luồng AI dịch lại
- [x] Lưu không đổi nội dung EN (chỉ đổi VI/metadata không liên quan) → giữ duyệt
- [x] Lệnh duyệt EN rõ ràng hiện có duyệt lại được → /en hiện lại; form cũ không tự duyệt (giữ chặn hiện có)
- [x] Spec BR-08 cập nhật (intent user đã duyệt) + doc as-built (API_SPEC…)
- [x] Test hồi quy; `pnpm test`/lint/typecheck/build PASS

## Ghi chú
Làm sau BL-012 (cùng khu duyệt EN pháp lý, dùng `isFilled`).
