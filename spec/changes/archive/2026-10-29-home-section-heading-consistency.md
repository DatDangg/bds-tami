---
id: home-section-heading-consistency
type: bug
status: done
created: 2026-10-29
---

# Trang chủ: tiêu đề khối + nút "xem thêm" chưa đồng bộ (QA sheet 28/10 bug 19, 20, 21 — Thấp)

## Yêu cầu
Chuẩn hoá phần đầu khối (tiêu đề, line trang trí) và nút điều hướng của các khối trang chủ theo design-spec/thiết kế đã duyệt. Gộp 3 bug vì cùng khu vực (đầu khối các section trang chủ, `src/components/home/*`) — một task để tránh sửa chồng file.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/` (VI, và kiểm `/en`), Khách, 1920 (kiểm thêm 1440/768/390)
- **Bug 19 — căn lề tiêu đề:** "Dự án nổi bật", "Ưu đãi nổi bật"… căn giữa, trong khi "Dịch vụ" căn trái. Expected: tiêu đề các khối theo một quy tắc căn lề nhất quán (responsive).
- **Bug 20 — nút:** nút "Xem tất cả dự án" (Dự án nổi bật) và "Xem thêm" (Ưu đãi nổi bật) khác kiểu. Expected: đồng bộ kiểu chữ, kích thước, màu, viền, bo góc, căn chỉnh, hover/focus; giữ nội dung + chức năng riêng.
- **Bug 21 — line trang trí:** chỉ "Dự án nổi bật" có đường line dưới tiêu đề; "Ưu đãi nổi bật", "Dịch vụ", "Thuê nhà ở & kinh doanh" không có. Expected: nếu line là thành phần chung thì các khối tương ứng hiển thị đồng bộ vị trí/kích thước/kiểu.

## Acceptance (bắt buộc)
- [x] Mọi khối trang chủ có tiêu đề dùng cùng một quy tắc căn lề + cùng xử lý line trang trí (có hết hoặc không có hết — theo design-spec/ảnh design; nếu design mâu thuẫn hoặc không nói → hỏi user, không tự chọn hướng lớn)
- [x] Nút xem thêm/xem tất cả của các khối cùng một variant (button/link) + hover/focus
- [x] Không vỡ responsive 1920/1440/768/390, VI + EN
- [x] Ảnh Playwright trước/sau; design-spec trang chủ cập nhật as-built nếu đổi

## Ghi chú
Nguồn: QA sheet https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4 (gid 642400866) dòng 19–21, ảnh bug19.png/bug20.png/bug21.png (chỉ là tên file, không tải được). User yêu cầu làm 2026-10-29 ("xem làm 19-21 đi"). Liên quan BL-075 (khối Dự án nổi bật theo max-w-container).
