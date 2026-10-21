---
id: admin-nav-dashboard-sitelink
type: bug
status: done
created: 2026-10-21
---

# Admin: thêm "Tổng quan" vào sidebar + nút "Xem website" bị ô Ngôn ngữ đè

## Yêu cầu
1. Màn Tổng quan (dashboard tuỳ biến `/admin`, `components/admin/dashboard/DashboardView`) có nhưng sidebar không có mục dẫn tới → thêm mục "Tổng quan" đầu sidebar (trên các nhóm), active khi đang ở `/admin`.
2. Header admin: nút "Xem website" (`SiteLink`, `admin.components.actions`) bị ô "Ngôn ngữ: Tiếng Việt" đè lên — chữ "website" chạm/lấn vào ô ngôn ngữ (ảnh user 2026-10-21, màn Cho thuê list).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/collections/rentals` (và mọi màn có ô Ngôn ngữ), admin, desktop ~1600px.
- Bước tái hiện: mở danh sách Cho thuê, nhìn góc phải header.
- Expected: "Xem website" và ô "Ngôn ngữ" cách nhau rõ ràng, không chồng.
- Actual: ô Ngôn ngữ đè lên đuôi chữ "Xem website" (không có khoảng cách).

## Acceptance (bắt buộc)
- [x] Sidebar có mục "Tổng quan" ở đầu, bấm về `/admin`, có trạng thái active như mục khác (BL-041), không phá nhóm "Nâng cao" thu gọn.
- [x] Header: "Xem website" không bị đè ở ≥ 768px (sáng/tối), có khoảng cách tối thiểu ~8px với ô Ngôn ngữ; mobile vẫn chỉ icon 44px.
- [x] Root cause của việc đè được ghi trong task (CSS actions/localizer của Payload 3.91), không vá bằng số cứng mò.
- [x] Kiểm tra bằng trình duyệt màn có và không có ô Ngôn ngữ (vd Cho thuê, Lead/Media).

## Ghi chú
Liên quan BL-041 (sidebar + SiteLink). Style ở `src/components/admin/styles/_surfaces.scss` (`.tami-admin-site-link`).
