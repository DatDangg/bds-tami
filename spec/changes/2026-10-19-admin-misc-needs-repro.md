---
id: admin-misc-needs-repro
type: bug
status: pending
created: 2026-10-19
---

# Admin: vỡ dấu tiếng Việt, tràn ngang mobile, toast "Fetching user failed" (bug #05 #10 #16) — cần tái hiện

## Hiện tượng
- #05 Văn bản trong Lexical hiển thị vỡ dấu kiểu `mặt bằ` `ng`, `tư vấ` `n`.
- #10 Form chi tiết admin ở 375px rộng 391–435px → cuộn ngang.
- #16 Chuyển trang nhanh bắn toast đỏ `Fetching user failed: Failed to fetch`.

## Đối chiếu code (chưa có root cause)
- #05: không có ký tự tổ hợp (NFD) nào trong `src/` → nghi do dữ liệu nhập/dán (NFD từ macOS/Word) hoặc do công cụ trích văn bản của người báo. Cần: id bản ghi + ảnh màn hình thật. Nếu xác nhận dữ liệu NFD → normalize NFC ở hook lưu (beforeChange).
- #10: cần collection/form cụ thể + phần tử gây tràn; **không** vá bằng `overflow-x: hidden` toàn cục (che lỗi, cắt nội dung).
- #16: toast nằm trong `AuthProvider` của Payload (`@payloadcms/ui` providers/Auth, `fetchFullUser`), không phải `SessionKeepAlive` → bắt AbortError trong KeepAlive **không** sửa được. Hướng: xác định request bị abort rồi cân nhắc patch-package / báo upstream.

## Acceptance
- [ ] Mỗi mục có bước tái hiện + root cause trước khi sửa.
- [ ] #05: nội dung lưu dạng NFC, hiển thị đúng.
- [ ] #10: không cuộn ngang ở 375px trên các form admin chính.
- [ ] #16: chuyển trang nhanh không còn toast lỗi giả; lỗi mạng thật vẫn báo.
