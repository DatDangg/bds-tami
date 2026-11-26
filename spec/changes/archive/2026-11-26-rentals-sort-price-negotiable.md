---
id: rentals-sort-price-negotiable
type: bug
status: done
created: 2026-11-26
---

# Cho thuê: sắp xếp "Giá tăng dần" để tin "Thương lượng" nằm rải rác — QA 41

## Yêu cầu
Khi sắp theo giá (tăng/giảm), tin "Thương lượng" (không có giá số) phải gom về một chỗ — đề xuất cuối danh sách (NULLS LAST) cho cả 2 chiều.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Khách, 1440 — `/cho-thue?sort=price_asc`.
- Bước: mở /cho-thue → Sắp xếp "Giá tăng dần" → xem trang 1 → 4.
- Expected: tin xếp theo giá tăng dần; tin "Thương lượng" gom về đầu hoặc cuối danh sách.
- Actual: tin "Thương lượng" nằm rải rác giữa các trang.

## Acceptance (bắt buộc)
- [ ] `price_asc`: các tin có giá tăng dần liên tục, mọi tin Thương lượng ở cuối (sau tất cả tin có giá), nhất quán qua phân trang
- [ ] `price_desc`: tin có giá giảm dần, Thương lượng ở cuối
- [ ] Thứ tự ổn định qua phân trang (tie-breaker), không lặp/mất tin giữa các trang
- [ ] Kiểm cùng logic ở Tin BĐS (`/tin-bds`) nếu có sort giá dùng chung
- [ ] Test cho logic sort

## Ghi chú
Cần tìm root cause: "Thương lượng" có thể là cờ riêng nhưng vẫn còn giá số cũ, hoặc giá null/0 xếp lẫn. Nguồn: QA sheet dòng 41 (20/11/2026, Trung bình).
