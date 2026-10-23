---
id: first-user-avatar-upload
type: bug
status: pending
created: 2026-10-23
---

# Màn tạo admin đầu tiên: thêm "Ảnh đại diện" bị từ chối và form bị xoá trắng

## Yêu cầu
Ở `/admin/create-first-user` không cho (hoặc không hiện) thao tác tải ảnh đại diện khi chưa có ai đăng nhập, để người tạo admin đầu tiên không bị lỗi và mất dữ liệu đã nhập.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/create-first-user`, chưa đăng nhập (DB mới, chưa có staff) — gặp khi dựng production 2026-10-23.
- Bước tái hiện: mở màn tạo admin đầu tiên → nhập thông tin → ở trường "Ảnh đại diện" (`staff.avatar`, upload → `media`) tải ảnh mới lên.
- Expected: không hiện ô tải ảnh ở màn này (hoặc tải được), dữ liệu đã nhập giữ nguyên.
- Actual: request tạo media bị từ chối — log `tami-app` "Bạn không có quyền thực hiện thao tác này." (07:36:28, 07:37:29 UTC) vì `Media.access.create = isStaff` cần user đăng nhập; sau đó form bị trắng (lần submit lỗi mật khẩu ngắn 07:37:04 cũng xoá form).

## Root cause (đã xác định)
`src/collections/Staff.ts:164` — trường `avatar` (upload → media) hiện cả ở màn create-first-user, trong khi tạo media yêu cầu `isStaff` (`src/access/isStaff.ts:8`, `user?.active === true`) mà lúc đó chưa có user.

## Acceptance (bắt buộc)
- [ ] Màn `/admin/create-first-user` không còn ô "Ảnh đại diện" (vd `admin.condition` theo `user` đăng nhập); form sửa/tạo staff khi đã đăng nhập vẫn có trường này như cũ.
- [ ] Không nới quyền tạo media cho người chưa đăng nhập.
- [ ] Test cho điều kiện hiển thị trường.

## Ghi chú
Mức ưu tiên thấp: màn này chỉ dùng 1 lần/môi trường (staging + production đều đã tạo xong admin). Thêm ảnh đại diện sau khi đăng nhập hoạt động bình thường.
