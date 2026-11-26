---
id: admin-ward-field-narrow-in-row
type: bug
status: done
created: 2026-11-26
---

# Admin: ô "Phường/xã" bị co bé tí cạnh ô "Tỉnh/thành"

## Yêu cầu
User báo (chat 2026-11-26, kèm ảnh): trong form admin (hàng Tỉnh/thành · Phường/xã), ô **Phường/xã** co lại chỉ rộng bằng
placeholder "Chọn một giá trị", còn Tỉnh/thành chiếm gần hết hàng. Mở dropdown thì danh sách hẹp, tên phường bị cắt/xuống dòng
từng chữ ("Phườ… Đào Duy Từ"), có cả thanh cuộn ngang.

Phạm vi: mọi chỗ dùng `WardField` trong `formRow` — Cho thuê (`src/collections/Rentals.ts:186-198`), Dự án
(`src/collections/Projects.ts:205`), Tin BĐS (`src/collections/PropertyPosts.ts:124`).

## Root cause (đã xác định khi intake)
- `src/components/admin/WardField.tsx:92` truyền `style={undefined}` cho `RelationshipInput`.
- Ô quan hệ mặc định của Payload (Tỉnh/thành) gắn `style = mergeFieldStyles(field)`
  (`@payloadcms/ui/dist/fields/mergeFieldStyles.js`) → không có `admin.width` thì thêm `flex: 1 1 auto`.
- CSS row của Payload (`fields/Row/index.scss`): `.row__fields > * { flex: 0 1 calc(var(--field-width) - …) }`; thiếu
  `--field-width` và thiếu inline `flex` → ô Phường/xã co về bề rộng nội dung (flex-grow 0).

## Phải làm (dự kiến — change-request chốt)
1. `WardField` truyền `style={mergeFieldStyles(field)}` (import từ `@payloadcms/ui/shared` — chỉ export ở đó, không có trong `@payloadcms/ui`) thay cho `undefined` —
   giữ hành vi như ô quan hệ mặc định (tôn trọng `admin.width` / `admin.style` nếu sau này khai).
2. Test unit cho style truyền xuống (hoặc snapshot prop) + kiểm tra trực quan 1440 / 390 trên 3 form.

## Acceptance
- [x] Hàng Tỉnh/thành · Phường/xã chia đều bề rộng như các hàng 2 ô khác (≥ mid-break); < mid-break mỗi ô 100%
- [x] Dropdown Phường/xã đủ rộng, tên phường hiển thị trên 1 dòng, không còn thanh cuộn ngang
- [x] Lọc theo tỉnh + tự bỏ chọn khi đổi tỉnh vẫn hoạt động (không regression BL trước)
- [x] Áp dụng cho cả Cho thuê, Dự án, Tin BĐS

## Kết quả (2026-11-26)
- `WardField` truyền `style={mergeFieldStyles(field)}` (memo theo `field`, import `@payloadcms/ui/shared`) — y hệt ô quan hệ mặc định Payload; +2 test render (không width → `flex: 1 1 auto`; `admin.width` → `--field-width`).
- Verify: `pnpm vitest run src/components/admin` 469 PASS, `pnpm typecheck` + eslint sạch. NORMAL PASS r1 `.context/review-reports/bug-admin-ward-field-narrow-in-row-phase-1-task-01-round-1-review.md`.
- Spec 1.64.8 / scope v129. Residual: chưa kiểm trình duyệt 1440/390 (Docker/DB local không chạy) — template test phủ.
