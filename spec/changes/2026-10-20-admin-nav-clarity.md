---
id: admin-nav-clarity
type: feature
status: pending
created: 2026-10-20
---

# Admin điều hướng: sidebar dễ phân biệt nhóm/mục + lối tắt sửa website trên Tổng quan

## Yêu cầu
User 2026-10-20 (ảnh sidebar, đăng nhập admin):

1. **Sidebar khó phân biệt** — nhóm 7 nhóm của BL-015 T03 (`src/components/admin/admin-groups.ts`):
   - Tiêu đề nhóm ("Khách hàng", "Nội dung"…) chữ nhỏ xám, mục con chữ to đậm đen → mắt đọc mục con trước, nhóm chìm; nhóm đang mở/đóng gần như giống nhau (chỉ khác mũi tên mảnh).
   - Không có khoảng/vạch ngăn rõ giữa các nhóm; mục con không thụt lề so với nhóm.
   - Mục đang chọn ("Trang chủ") chỉ nền be rất nhạt — khó thấy đang ở đâu.
   - Không có icon (Payload 3.91 không cho icon qua config — chốt design Q4 BL-015; có thể làm bằng CSS/`Nav` tuỳ biến nếu cần).
2. **Tổng quan thiếu lối tắt sửa website** — mục Trang chủ / Menu đầu trang / Chân trang / Cấu hình chung chỉ có ở thẻ "Website" cuối trang (`NavGroupCards`, phải cuộn qua "Lead mới nhất" + "Bài của bạn") → user tưởng không có. Kiểm local 2026-10-20: link `/admin/globals/homepage` có, chỉ bị chìm.

## Acceptance (bắt buộc)
- [ ] Sidebar: tiêu đề nhóm và mục con phân cấp rõ (cỡ/độ đậm/màu/viết hoa hoặc thụt lề — design đề xuất, user duyệt ảnh trước/sau); có khoảng/vạch ngăn nhóm; trạng thái mở/đóng nhóm dễ nhận; mục đang chọn nổi rõ (nền + vạch màu nhấn TAMI), đạt tương phản AA sáng **và** tối.
- [ ] Hover/focus bàn phím mục sidebar thấy rõ; 375px menu thu gọn vẫn dùng được.
- [ ] Tổng quan: hàng lối tắt "Sửa website" ngay đầu trang (dưới lời chào/cạnh "Tạo mới") gồm Trang chủ · Menu đầu trang · Chân trang · Cấu hình chung — chỉ hiện với role admin (cùng quy tắc `hideFromNonAdmin`); thẻ nhóm cuối trang giữ nguyên.
- [ ] Không đổi schema/access/thứ tự nhóm; chỉ CSS + component admin. Ảnh trước/sau desktop 1440 + 375, sáng/tối.

## Ghi chú
- Liên quan: BL-015 T03/T04 (sidebar 7 nhóm, dashboard), BL-040 (tên mục/nhóm có thể đổi chữ — làm BL-040 trước hoặc cùng đợt để chụp ảnh một lần).
