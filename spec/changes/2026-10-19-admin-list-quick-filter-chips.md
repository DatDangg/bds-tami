---
id: admin-list-quick-filter-chips
type: feature
status: in_progress
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

## Quyết định agent (user ủy quyền 2026-10-20: "tự quyết định đừng hỏi lại")
- D1 Chia 2 task tuần tự: T01 chip Tin cho thuê (helper chip dùng chung + component), T02 chip Lead + xuất Excel theo chip. Không song song vì T02 dùng lại helper/component của T01.
- D2 Chip ghép điều kiện vào **từng** nhánh `or` của `where` (giống `withTranslationFilter`), không bọc cả cụm → không lặp bug #01.
- D3 Chọn chip thay **mọi** điều kiện lá trên cùng trường của nhóm (vd bộ lọc tay `Giá >= 5tr` bị thay khi bấm chip giá); chip chỉ sáng khi mọi nhánh chứa đúng điều kiện của chip. Riêng Lead (spec-validation W1): chip luôn thay điều kiện `status`; chỉ `Mới (chưa giao)` thay thêm `assignedTo`; rời chip này chỉ bỏ `assignedTo exists false` — bộ lọc "Sale phụ trách = X" tay được giữ với chip khác.
- D4 Mọi nhóm: bấm lại chip đang sáng = bỏ lọc nhóm; Trạng thái / Số PN có thêm chip `Tất cả` như bảng; nhóm giá không có `Tất cả` (theo bảng đã chốt).
- D5 Điều kiện: `Đang tư vấn` = `status in [contacted, consulting]`; `Mới (chưa giao)` = `status equals new` + `assignedTo exists false`; `3 PN+` = `bedrooms >= 3`; giá theo bảng (`less_than` / `greater_than_equal` / `less_than_equal` / `greater_than`).
- D6 Xuất Excel lead: mở rộng ánh xạ where → query (client) và parse/build (server) chỉ cho 2 dạng chip mới: `status` "nằm trong" (giá trị thuộc danh sách trạng thái hợp lệ) và `assignedTo` "chưa có" (`exists: false`). Toán tử khác vẫn khoá nút (không over-export PII). Cập nhật `docs/API_SPEC.md` (as-built).
- D7 Không đổi schema/DB/quyền, không endpoint mới → không migration. Spec MINOR 1.17.0 → 1.18.0.
