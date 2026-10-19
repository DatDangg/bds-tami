# Spec Update — 2026-10-20 admin-list-quick-filter-chips (chip lọc nhanh danh sách admin)

**spec_version:** 1.17.0 → 1.18.0 (MINOR — thêm hành vi mới trong admin: chip lọc nhanh Tin cho thuê + Lead, xuất Excel lead theo điều kiện chip; không đổi schema/DB, quyền, không endpoint mới)

**Trigger:** feature-update (Change Request BL-022, bug #11 #12). Change doc `spec/changes/2026-10-19-admin-list-quick-filter-chips.md` (quyết định D1–D7). Task `tasks/feature-admin-list-quick-filter-chips/phase-1-task-01.md` (T01 chip Tin cho thuê), `phase-1-task-02.md` (T02 chip Lead + xuất Excel theo chip).

**Nguồn:** user báo #11 #12 — lọc khoảng giá / số phòng / trạng thái phải tạo 2 dòng điều kiện và gõ đủ số 0. Phạm vi + mức chip user chốt 2026-10-20; chi tiết kỹ thuật D1–D7 agent quyết (user uỷ quyền).

## Requirements

- THÊM **FR-ADM-19 / Chip lọc nhanh (BL-022)**:
  - Thanh chip 1 chạm phía trên bảng (trong thanh công cụ `beforeListTable` cùng hàng với ô Lọc dịch / nút Xuất Excel), cuộn ngang nội bộ khi hẹp, không tràn trang ở 375px; chip là `<button aria-pressed>`, nhóm `role="group"` có nhãn, thao tác bàn phím, AA sáng/tối, vùng bấm ≥ 44px.
  - Mỗi nhóm chọn 1; bấm lại chip đang sáng hoặc `Tất cả` = bỏ lọc nhóm. Các nhóm AND với nhau và với bộ lọc / tìm kiếm / Lọc dịch — ghép vào **từng** nhánh `or` của `where` (D2, không lặp bug #01 BL-021).
  - Chip ghi vào `where` trên URL (F5 / chia sẻ link giữ nguyên). Chip sáng khi mọi nhánh chứa đúng điều kiện chip; chọn chip thay mọi điều kiện cùng trường của nhóm (D3) — bộ lọc tay khác chip trên cùng trường → chip bỏ sáng.
  - **Tin cho thuê:** Trạng thái (`Tất cả` · `Đang cho thuê`=`published` · `Đã thuê`=`rented` · `Nháp`=`draft`; `hidden` chỉ ở `Tất cả`); Số phòng ngủ (`Tất cả` · `Studio`=0 · `1 PN` · `2 PN` · `3 PN+` ≥ 3); Khoảng giá `priceMonthlyVnd` (`Dưới 10tr` < 10tr · `10 – 20tr` [10tr, 20tr) · `20 – 50tr` [20tr, 50tr] · `Trên 50tr` > 50tr; không có `Tất cả`, D4). Tin chưa nhập số PN / giá không lọt chip nào của nhóm đó.
  - **Lead:** Trạng thái (`Tất cả` · `Mới (chưa giao)` = `status equals new` + `assignedTo exists false` · `Đang tư vấn` = `status in [contacted, consulting]` · `Đã chốt`=`won` · `Không thành`=`lost`; `spam` chỉ ở `Tất cả`). Chip không nới quyền — sale vẫn chỉ thấy lead được giao.
  - Ngoài phạm vi: chip diện tích (`areaM2`), Dự án, Đăng tin BĐS.
- MỞ RỘNG **F9 / Xuất Excel lead** (D6): ngoài bộ lọc đã hỗ trợ (BL-021), nút + endpoint `GET /api/admin/leads/export` nhận thêm đúng 2 dạng điều kiện của chip: `status` "nằm trong" (mỗi giá trị thuộc danh sách trạng thái hợp lệ) và `assignedTo` "chưa có" (`exists: false`). Server validate whitelist (trùng / mâu thuẫn / giá trị lạ → 400), dựng `where` bằng code (không ghép chuỗi thô). Toán tử khác vẫn khoá nút (không over-export PII). Audit `lead.export` như cũ (bộ lọc chuẩn hoá, không PII). Quyền giữ nguyên (chỉ admin).

**Schema / Access / API:** không đổi schema/DB, không migration, không đổi access control; không endpoint mới — chỉ thêm tham số query vào endpoint xuất lead có sẵn (`docs/API_SPEC.md` cập nhật as-built ở T02).

**Ảnh hưởng:**
- Admin danh sách `/admin/collections/rentals` và `/admin/collections/leads` (thanh công cụ `beforeListTable`).
- Helper `where` mới dùng chung (`src/lib/admin/quick-filters.ts`), có thể tách `toBranches` dùng chung với `withTranslationFilter` — retest Lọc dịch (BL-021 #01).
- Xuất Excel lead (`src/lib/leads/export-filters.ts`, `src/endpoints/admin/leads-export.ts`, `LeadExportButton`) — retest bộ lọc cũ + tìm kiếm (BL-021 T3).
- SCSS thanh công cụ `_lists.scss` (`.list-toolbar-item`, BL-021 T6).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 22
