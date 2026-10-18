---
id: layer9-minor-export-reminder
type: feature
status: done
created: 2026-10-19
backlog: BL-009
---

# MINOR còn lại layer 9: xuất Excel + index job nhắc lead

## Yêu cầu
MODIFY (spec-validation layer 9 G33).
Xuất Excel (L9-T05 round 3):
1. Thông báo khoá nút ghi rõ toán tử bộ lọc được hỗ trợ (`export-filters.ts:94-95`).
2. So `createdFrom > createdTo` bằng `Date.parse` thay vì so chuỗi (`:72`).
3. Dò trạng thái thùng rác (trash) bằng server component.
4. Ẩn nút xuất trong list drawer.

Job nhắc lead (L9-T04):
5. Index quét `status, assigned_to_id, reminded_at, created_at` cho dữ liệu lớn (migration versioned).

## Acceptance (bắt buộc)
- [x] Nút xuất bị khoá → thông báo liệt kê toán tử hỗ trợ
- [x] Khoảng ngày khác định dạng so đúng thứ tự bằng `Date.parse`; test ca biên
- [x] Trạng thái trash xác định phía server
- [x] Nút xuất không hiện trong list drawer
- [x] Migration thêm index (CREATE INDEX, không destructive) cho truy vấn job nhắc lead
- [x] `pnpm test`/lint/typecheck/build PASS

## Ghi chú
Có thể tách 2 task (export / index) nếu change-request thấy cần.
