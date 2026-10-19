---
id: admin-list-fixes
type: bug
status: pending
created: 2026-10-19
---

# Sửa màn danh sách admin: bộ lọc, tìm kiếm, xuất Excel, hiển thị (bug #01 #02 #03 #04 #06 #07 #08 #09 #13 #14 #15)

Một change, nhiều task (1 task = 1 commit). Gồm cả BUG (#01) và MODIFY (còn lại) — classify từng task.
Chip lọc nhanh (#11 #12) tách sang `2026-10-19-admin-list-quick-filter-chips.md`; vỡ dấu / tràn mobile / toast (#05 #10 #16) ở `2026-10-19-admin-misc-needs-repro.md`.

## Quyết định đã chốt (user, 2026-10-19)
- Xuất Excel khi đang tìm kiếm: **mở**, file ra đúng tập lead đang thấy trên màn.
- Tìm Lead theo SĐT + Email.
- Tìm tin thuê theo địa chỉ: **mở cho mọi tài khoản nội bộ** (khớp `readExactAddress` — `isStaff` đã đọc được địa chỉ, `src/collections/Rentals.ts:88`).
- Giá: `110.000.000 ₫`. Ô trống: `—`.
- #08 (vị trí Xuất Excel / Lọc dịch) chung vùng với BL-016 → làm sau BL-016 (mặc định, user chưa phản đối).

## Task dự kiến (thứ tự)

### T1 — BUG #01: đổi "Trạng thái dịch" xoá bộ lọc khác
- Root cause (xác minh trên code): `src/lib/translation/admin-ui.ts:19-35` — `andEntries` chỉ tách `{ and: [...] }` một khoá; WhereBuilder ghi `{ or: [{ and: [...] }] }` → cả cụm `or` là 1 entry, có `translation.*` bên trong thì `isTranslationCondition` loại cả cụm. `currentTranslationFilter` cũng không nhận mục đang chọn ở dạng này. Test chỉ phủ dạng `{ and }`.
- Repro: lọc `Trạng thái = Đã xuất bản` + `Giá thuê >= 50.000.000` → chọn một mục Trạng thái dịch → đổi mục khác → chỉ còn điều kiện dịch.
- [ ] Dạng `{ or: [{ and }] }` 1 nhánh và nhiều nhánh: đổi/bỏ mục dịch giữ mọi điều kiện khác, không mất nhánh.
- [ ] `currentTranslationFilter` nhận đúng mục ở mọi dạng; test hồi quy.

### T2 — #03 #04: trường tìm kiếm
- [ ] Leads (`src/collections/Leads.ts:200`): thêm SĐT + email. Dán `0956789012` / `0956 789 012` / `+84956789012` đều ra lead (cân nhắc `phoneNormalized`).
- [ ] Rentals: thêm `listSearchableFields` mã tin + tiêu đề + địa chỉ; gõ `CT-000089` hoặc tên đường ra tin.

### T3 — #02: xuất Excel khi có từ khoá tìm kiếm
- Đổi hành vi có chủ đích: `src/components/admin/LeadExportButton.tsx:43` đang khoá khi có `search`.
- [ ] Endpoint `/api/admin/leads/export` nhận `search`, áp đúng cùng tập trường/toán tử với danh sách (server kiểm lại); file ra đúng tập đang thấy.
- [ ] Vẫn chặn với điều kiện không ánh xạ được; cập nhật `docs/API_SPEC.md` + thông báo `UNSUPPORTED_FILTER_MESSAGE`.

### T4 — #06 #07: danh sách trường lọc
- [ ] "Thêm bộ lọc" của rentals/projects/property-posts/news/leads chỉ còn trường nghiệp vụ (`admin.disableListFilter` cho SEO, OG image, translation hash, timestamp kỹ thuật…).
- [ ] Lọc "Thuộc dự án" chọn theo tên, có tìm kiếm — cần repro trước (`project` ở `Rentals.ts:150` là relationship thường).

### T5 — #09 #13 #14 #15: hiển thị cột
- [ ] Cột tiền VNĐ dạng `110.000.000 ₫`; sort/filter vẫn theo số.
- [ ] Ô trống `—` thay `<Không có …>`.
- [ ] Cột Sale phụ trách không còn "Đang tải..." mỗi dòng.
- [ ] Ngày giờ admin `dd/MM/yyyy HH:mm` (`admin.dateFormat` hiện chưa khai).

### T6 — #08: thanh công cụ (sau BL-016)
- [ ] Xuất Excel + Lọc dịch nằm cùng hàng thanh công cụ danh sách, desktop + mobile.
