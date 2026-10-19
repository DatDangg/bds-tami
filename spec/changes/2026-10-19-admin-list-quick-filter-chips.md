---
id: admin-list-quick-filter-chips
type: feature
status: pending
created: 2026-10-19
---

# Chip lọc nhanh + lọc khoảng giá/diện tích trên danh sách admin (bug #11 #12) — làm sau

## Yêu cầu
Thanh chip 1 chạm phía trên bảng danh sách: khoảng giá (vd 20–50 triệu, Dưới 10tr), số phòng (Studio/1PN/2PN…), trạng thái (Đang cho thuê…). Hiện phải tạo 2 dòng điều kiện và gõ đủ số 0.

## Quyết định đã chốt (user, 2026-10-19)
- Tạm hoãn, làm sau khi xong `2026-10-19-admin-list-fixes.md`.
- Không thêm schema: dùng trường có sẵn `bedrooms`, `priceMonthlyVnd`, `areaM2` (`src/collections/Rentals.ts:168-175`).

## Cần chốt trước khi build
- Màn nào có chip (Tin thuê / Dự án / Tin BĐS / Lead).
- Các mức giá, diện tích, số phòng, trạng thái cụ thể.

## Acceptance
- [ ] Chip áp/bỏ 1 chạm, kết hợp đúng với bộ lọc khác và Lọc dịch (không lặp lại bug #01).
