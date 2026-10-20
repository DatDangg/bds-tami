---
id: admin-raw-slug-columns
type: feature
status: pending
created: 2026-10-20
---

# Admin: cột "Loại dữ liệu" / "Loại nội dung" hiện mã thô (`leads`, `rentals`…) → tên tiếng Việt

## Yêu cầu
Phát hiện khi rà chữ BL-040 (2026-10-20), user duyệt ghi BL: ở danh sách **Nhật ký thao tác** (`audit-logs`) và **Lượt bấm liên hệ** (`click-events`, có thể cả `click-stats-daily`), cột loại dữ liệu/nội dung hiện giá trị slug thô (`leads`, `rentals`, `job-applications`…) — người dùng không hiểu.

## Acceptance (bắt buộc)
- [ ] Ô danh sách (và màn chi tiết nếu hiện) đổi slug → tên tiếng Việt lấy từ `src/lib/admin/collection-labels.ts` (nguồn duy nhất, theo nhãn sau BL-040); slug lạ hiện nguyên giá trị, không lỗi.
- [ ] Lọc/sắp xếp theo cột vẫn chạy trên giá trị gốc; nếu cột có lọc dạng select thì option hiện tên tiếng Việt.
- [ ] Xuất dữ liệu/API không đổi (chỉ đổi hiển thị admin); không đổi schema/DB.
- [ ] Test cell component: slug biết → nhãn, slug lạ → giữ nguyên, rỗng → `—`.

## Ghi chú
- Làm sau BL-040 (dùng nhãn mới). Liên quan BL-021 T5 (định dạng cột).
