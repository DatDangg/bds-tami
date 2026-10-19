---
id: admin-dashboard-list-mobile-overflow
type: bug
status: done
closed: 2026-10-20
created: 2026-10-20
---

# Admin 375px: Tổng quan và danh sách vẫn cuộn ngang toàn trang (BL-024)

## Hiện tượng
Đo khi xử lý BL-023 #10 (sau fix header + màn tài khoản), iframe 375px, `documentElement.scrollWidth`:
- `/admin` (Tổng quan): ~506px
- `/admin/collections/rentals` (danh sách): ~576px

## Ghi chú
- Form chi tiết (account, rentals/projects/leads edit, create) đã 375px — c961292.
- Chưa xác định phần tử gây tràn (bisect bằng ẩn phần tử cho kết quả không rõ ở dashboard). Bảng danh sách nên cuộn trong khung riêng, không làm cả trang cuộn.
- Luật: không vá bằng `overflow-x: hidden` toàn cục.

## Acceptance
- [x] `/admin` và các danh sách chính không cuộn ngang toàn trang ở 375px; bảng cuộn trong khung của nó.

## Kết quả (2026-10-20)
- Root cause: 506/576px là transition `grid-template-columns` của `.template-default` (Payload, 1fr auto → 0 auto khi hydrate) bị **đóng băng** ở trang không render (pane ẩn/iframe nền) — sau khi transition xong, `/admin` + rentals/leads/projects/news/property-posts/media/lead-activities/services/account đều 375; bảng cuộn trong `.table`, chip lọc nhanh cuộn nội bộ. Lỗi tràn thật duy nhất: thanh chọn hàng loạt `.collection-list__list-selection` (Payload: fixed, width 100%, không có `left` → lệch phải 1 gutter, nút "Xóa" bị cắt 16px; nhiều trang thêm "Chọn tất cả (N)" làm hàng nowrap tràn).
- Fix: `_lists.scss` ghim thanh `left:0; right:0; width:auto; padding-inline: var(--gutter-h)` + `.list-selection{flex-wrap:wrap}`; không đụng overflow html/body/nav. Task `tasks/bug-admin-dashboard-list-mobile-overflow/phase-1-task-01.md`.
- Review NORMAL PASS r1 `.context/review-reports/bug-admin-dashboard-list-mobile-overflow-phase-1-task-01-round-1-review.md`; spec 1.21.0 (không bump) / scope v26.
- Quyết định agent (user ủy quyền 2026-10-20): D1 không đổi transition nav Payload; D2 sửa thanh chọn hàng loạt trong cùng task; D3 không sửa `--nav-width: 100vw` (residual).
