---
id: admin-dashboard-list-mobile-overflow
type: bug
status: pending
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
- [ ] `/admin` và các danh sách chính không cuộn ngang toàn trang ở 375px; bảng cuộn trong khung của nó.
