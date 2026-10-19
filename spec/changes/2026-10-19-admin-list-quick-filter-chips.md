---
id: admin-list-quick-filter-chips
type: feature
status: pending
created: 2026-10-19
---

# Chip lọc nhanh + lọc khoảng giá trên danh sách admin (bug #11 #12)

## Yêu cầu
Thanh chip 1 chạm phía trên bảng danh sách: khoảng giá (vd 20–50 triệu, Dưới 10tr), số phòng (Studio/1PN/2PN…), trạng thái (Đang cho thuê…). Hiện phải tạo 2 dòng điều kiện và gõ đủ số 0.

## Quyết định đã chốt (user, 2026-10-19)
- Tạm hoãn, làm sau khi xong `2026-10-19-admin-list-fixes.md` (BL-021 đã done).
- Không thêm schema: dùng trường có sẵn `bedrooms`, `priceMonthlyVnd`, `areaM2` (`src/collections/Rentals.ts:168-175`).

## Phạm vi + mức chip (user chốt 2026-10-20)
Thanh chip phía trên bảng; mỗi nhóm chọn 1 (`Tất cả` = bỏ lọc nhóm đó); các nhóm kết hợp AND với nhau và với bộ lọc / tìm kiếm / Lọc dịch đang có.

### 1. Tin cho thuê `/admin/collections/rentals` — ưu tiên 1
| Nhóm | Chip → điều kiện |
|---|---|
| Trạng thái (`status`) | `Tất cả` · `Đang cho thuê` = `published` · `Đã thuê` = `rented` · `Nháp` = `draft` (`hidden` chỉ thấy ở `Tất cả`) |
| Số phòng ngủ (`bedrooms`) | `Tất cả` · `Studio` = 0 · `1 PN` = 1 · `2 PN` = 2 · `3 PN+` = ≥ 3 |
| Khoảng giá (`priceMonthlyVnd`) | `Dưới 10tr` < 10.000.000 · `10 – 20tr` 10.000.000 ≤ x < 20.000.000 · `20 – 50tr` 20.000.000 ≤ x ≤ 50.000.000 · `Trên 50tr` > 50.000.000 (bấm lại chip đang chọn = bỏ lọc giá) |

Tin chưa nhập số PN / giá không lọt chip nào của nhóm đó.

### 2. Lead khách hàng `/admin/collections/leads` — ưu tiên 2 (rất cần cho Sales)
| Nhóm | Chip → điều kiện |
|---|---|
| Trạng thái | `Tất cả` · `Mới (chưa giao)` = `status = new` VÀ `assignedTo` rỗng · `Đang tư vấn` = `contacted` + `consulting` · `Đã chốt` = `won` · `Không thành` = `lost` (`spam` chỉ thấy ở `Tất cả`) |

Chip không nới quyền: Sale vẫn chỉ thấy lead được phép như hiện tại.

### Ngoài phạm vi
Chip diện tích (`areaM2`), màn Dự án / Đăng tin BĐS.

## Acceptance
- [ ] Chip áp/bỏ 1 chạm, kết hợp đúng với bộ lọc khác và Lọc dịch (không lặp lại bug #01).
- [ ] Rentals: 3 nhóm chip đúng bảng trên; Leads: nhóm Trạng thái đúng bảng trên.
- [ ] Chip đang chọn nằm trên URL (`where`) → F5 / chia sẻ link giữ nguyên; tự sửa bộ lọc trùng nhóm thì chip bỏ sáng tương ứng.
- [ ] Xuất Excel lead khi đang chọn chip xuất đúng tập đang lọc.
- [ ] Đạt AA sáng/tối, thao tác được bằng bàn phím, 375px không tràn ngang trang (thanh chip cuộn ngang).
