---
id: select-dropdown-styling
type: feature
status: done
created: 2026-10-19
backlog: BL-016
---

# Ô chọn (dropdown) trông lạ, không theo style TAMI — site public + admin

## Yêu cầu
MODIFY (UI). User thấy các ô select "trông cứ kiểu gì ấy" ở cả **site public** và **admin**. User chọn hướng: **dùng Select TAMI** (`src/components/ui/select.tsx`, Radix, đã style theo token) thay `<select>` gốc trình duyệt.

Hiện trạng (agent tự kiểm tra 2026-10-19, dev :3000 `/cho-thue`):
- Site public dùng `<select>` gốc **không có `appearance-none`** → mũi tên mặc định của trình duyệt dính sát mép phải, chữ bị cắt cụt ("Tất cả danh r…", "Tất cả tỉnh/th…"); danh sách xổ xuống là popup của OS (nền trắng, highlight xanh, font hệ thống) — lệch với style TAMI. Ô bị khoá (Phường/xã) xám kiểu trình duyệt.
- `src/components/ui/select.tsx` (Radix) đã có, style đúng token, nhưng các màn chưa dùng.
- Các chỗ dùng `<select>` gốc: `src/components/rentals/FilterFields.tsx`, `src/components/rentals/SortSelect.tsx` (`FIELD_CLASS`), `src/components/projects/ProjectFilters.tsx`, `src/components/projects/FloorPlans.tsx`, `src/components/careers/JobFilters.tsx`, `src/components/forms/FormField.tsx` (`as: "select"` — form liên hệ/ứng tuyển).
- Admin: `src/components/admin/TranslationStatusFilter.tsx` dùng `<select>` gốc với inline style → lệch với ô chọn react-select của Payload ngay cạnh trong màn danh sách. Ô select của field trong form admin là Payload mặc định (chưa kiểm bằng mắt — cần đăng nhập).

## Acceptance
- [ ] Site public: mọi ô chọn dùng Select TAMI (Radix) — ô đóng cùng chiều cao/viền/bo góc/khoảng đệm với input bên cạnh, mũi tên `CaretDown` có padding, chữ dài cắt bằng `…` không đè mũi tên; danh sách xổ xuống theo token (nền popover, hover/highlight màu accent, dấu ✓ mục đang chọn); trạng thái disabled/placeholder/aria-invalid rõ ràng
- [ ] Giữ hành vi hiện có: lọc áp dụng ngay khi đổi (S04), giá trị lên URL/searchParams như cũ, phụ thuộc Tỉnh → Phường/xã vẫn đúng
- [ ] Form (`FormField as: "select"`): vẫn submit được qua form/server action (Radix Select render input ẩn có `name`), `required` + thông báo lỗi + `aria-describedby` giữ nguyên
- [ ] A11y: điều khiển bằng bàn phím (mở/đóng, mũi tên, gõ chữ nhảy mục, Esc), label liên kết đúng, đạt AA (chữ ≥ 4.5:1, viền/UI ≥ 3:1) sáng + tối; vùng chạm ≥ 44px trên mobile
- [ ] Mobile: danh sách không tràn màn hình, cuộn được khi nhiều mục
- [ ] Admin: `TranslationStatusFilter` dùng `SelectInput`/react-select của `@payloadcms/ui` (không dùng Radix trong admin) để đồng bộ với các ô lọc Payload; style select field admin rà theo BL-015 nếu cần
- [ ] Không đổi API, schema, access
- [ ] Ảnh chụp trước/sau: `/cho-thue`, `/du-an`, `/tuyen-dung`, form liên hệ, màn danh sách admin có lọc trạng thái dịch

## Ghi chú
- Liên quan BL-015 (làm lại UI admin) — phần style select field admin có thể gộp vào đó; riêng `TranslationStatusFilter` sửa trong change này.
- Không bỏ `<select>` gốc nếu chỗ nào bắt buộc chạy không JS (progressive enhancement) — builder kiểm tra filter có form GET fallback không trước khi thay.
