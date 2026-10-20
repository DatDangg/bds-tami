# Site redesign: quyết định đã chốt với user

Mockup: `index.html` (chạy `site-mockup` trong `.claude/launch.json`, port 4600).
File này là input cho change doc khi mockup được duyệt.

## Phạm vi
- Toàn bộ site: Dự án, Cho thuê (danh sách + danh mục + chi tiết), Tin tức, Bài viết, Tuyển dụng, Liên hệ, Chính sách/Điều khoản.
- Theo phong cách trang chủ mới (BL-044); **giữ hệ màu + element hiện có** (token trong `src/app/(frontend)/globals.css`).
- Ảnh hero mỗi trang danh sách do **admin tải lên** (có bản EN cho chữ hero).

## Quyết định (2026-10-20 → 2026-10-21)
1. **Breadcrumb** nằm trên ảnh, góc trên-trái: khung bo tròn **chỉ bao quanh chữ** (không kéo full-width),
   nền `#c9a15f21` = `--color-primary-deep` @ 13% (`color-mix(in srgb, var(--color-primary-deep) 13%, transparent)`),
   blur 4px (gần trong suốt), chữ trắng + bóng nhẹ, ngăn cách bằng `›`. Trang không có ảnh (Bài viết): breadcrumb trơn đầu trang.
   → cần token blur riêng cho breadcrumb (khác `--blur-glass` 24px). Kiểm tra độ đọc trên ảnh sáng khi code.
2. **Bỏ icon tim ở MỌI màn, kể cả trang chủ** (thẻ "Dự án nổi bật" của BL-044, thẻ danh sách, slider "tương tự",
   nút tim ở khối tiêu đề trang chi tiết). Đảo lại quyết định BL-044 #1 ("tim chỉ trang trí").
3. **Không canh giữa** đầu khối ở Tin tức / Bài viết / Tuyển dụng — canh trái theo container.
   Bài viết: cột nội dung trái + cột phải "Bài viết mới" + thẻ tư vấn (dính khi cuộn).
4. **Nền trang chi tiết** giữ vàng nhạt `--color-primary-subtle` như hiện tại (`DetailLayout`), thanh mục con dính cùng nền.
5. **Dải thông số trang chi tiết** nằm **trong thẻ tiêu đề trắng** (ngăn bằng đường kẻ), chữ giá trị đậm/đen —
   không để rời trên nền vàng nhạt (bị mờ vì vòng tròn icon trùng màu nền).
6. **Khối "Dự án/Căn tương tự"** cuối trang chi tiết: đầu khối **canh trái**, nền **trắng** (tách khỏi phần thông tin vàng nhạt).
