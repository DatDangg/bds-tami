---
id: admin-raw-slug-columns
type: feature
status: done
completed: 2026-10-21
created: 2026-10-20
---

# Admin: cột "Loại dữ liệu" / "Loại nội dung" hiện mã thô (`leads`, `rentals`…) → tên tiếng Việt

## Yêu cầu
Phát hiện khi rà chữ BL-040 (2026-10-20), user duyệt ghi BL: ở danh sách **Nhật ký thao tác** (`audit-logs`) và **Lượt bấm liên hệ** (`click-events`, có thể cả `click-stats-daily`), cột loại dữ liệu/nội dung hiện giá trị slug thô (`leads`, `rentals`, `job-applications`…) — người dùng không hiểu.

## Acceptance (bắt buộc)
- [x] Ô danh sách (và màn chi tiết nếu hiện) đổi slug → tên tiếng Việt lấy từ `src/lib/admin/collection-labels.ts` (nguồn duy nhất, theo nhãn sau BL-040); slug lạ hiện nguyên giá trị, không lỗi.
- [x] Lọc/sắp xếp theo cột vẫn chạy trên giá trị gốc; nếu cột có lọc dạng select thì option hiện tên tiếng Việt.
- [x] Xuất dữ liệu/API không đổi (chỉ đổi hiển thị admin); không đổi schema/DB.
- [x] Test cell component: slug biết → nhãn, slug lạ → giữ nguyên, rỗng → `—`.

## Ghi chú
- Làm sau BL-040 (dùng nhãn mới). Liên quan BL-021 T5 (định dạng cột).
- 2026-10-21: BL-041 dồn Nhật ký thao tác / Lượt bấm liên hệ vào nhóm "Nâng cao" (không ẩn) → phạm vi BL này không đổi. Diff Trước/Sau cho metadata nhật ký: hoãn (`docs/reviews/2026-10-21-admin-audit.md` §9.2).

## Kết quả (2026-10-21)
- Task `tasks/feature-admin-raw-slug-columns/phase-1-task-01.md` done; reviewer NORMAL r2 PASS; spec 1.35.0 / scope v45.
- Quyết định tự xử lý (auto proceed): D1 tên số ít; D2 ô lọc là ô chữ nên không có option select (giữ giá trị gốc); D3 màn chi tiết hiện gợi ý "Tên gọi: …" dưới ô chỉ đọc; D4 spec-validator gộp ở phase review; D5 mã global (nhật ký dịch lại) hiện nhãn global.
- Áp dụng cho Nhật ký thao tác, Lượt bấm liên hệ, Thống kê liên hệ theo ngày.
