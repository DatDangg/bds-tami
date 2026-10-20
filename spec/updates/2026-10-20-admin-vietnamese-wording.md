# Spec Update — 2026-10-20 admin-vietnamese-wording (rà ngữ nghĩa chữ tiếng Việt trong admin)

**spec_version:** 1.32.0 → 1.33.0 (MINOR — đổi ngữ nghĩa chữ hiển thị trong admin; không đổi schema, slug, URL, access control, endpoint)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-040**, MODIFY). Change doc `spec/changes/2026-10-20-admin-vietnamese-wording.md` (archive ở close-out → `spec/changes/archive/2026-10-20-admin-vietnamese-wording.md`). Task `tasks/feature-admin-vietnamese-wording/phase-1-task-01.md`, `tasks/feature-admin-vietnamese-wording/phase-1-task-02.md`. Review: `.context/review-reports/feature-admin-vietnamese-wording-phase-1-task-01-round-2-review.md` (NORMAL, PASS), `.context/review-reports/feature-admin-vietnamese-wording-phase-1-task-02-round-2-review.md` (STRICT, PASS). Spec validation: `.context/review-reports/spec-validation-feature-admin-vietnamese-wording-phase-1.md` (gap không chặn).

## Requirements (SPECIFICATIONS.md)

- **FR-ADM-19 — Giao diện quản trị (ĐỔI):** thêm câu "Ngữ nghĩa chữ admin (BL-040)": chữ đúng nghĩa nghiệp vụ, người không rành kỹ thuật hiểu được, viết hoa chỉ chữ đầu, một khái niệm một tên (Thùng rác · Ngày … · Sale phụ trách · Tin bất động sản · tiếng Việt/tiếng Anh · Dịch tự động (AI) · Cấu hình chung · Tệp CV ứng viên · Lead); không lộ thuật ngữ dev (slug, canonical, noindex, OG, hash, bucket, token, mã `BR-`/`FR-`, "Collections"/"globals"), chỉ giữ từ mượn thông dụng đã liệt kê.
- Chữ mặc định Payload ghi đè ở **một nơi** (`i18n.translations.vi`) có test khoá chuỗi + khoá tồn tại + placeholder khớp; toán tử bộ lọc đọc tự nhiên (là · không phải · là một trong · có giá trị · Có/Không); thông báo lỗi xuất Excel trích đúng các chữ này.
- Nhãn collection/global chỉ ở `src/lib/admin/collection-labels.ts`.
- Menu nhóm "**Dữ liệu nền**" (thay "Danh mục"); danh sách admin gọi "**Tin bất động sản**" (thay "Đăng tin BĐS") trong câu BL-021/BL-022.

## Hành vi bị thay thế (mẫu chính)

| Trước | Sau (BL-040) |
|---|---|
| Rác | Thùng rác |
| Đã Xóa Lúc | Ngày xoá |
| Collections / Cấu hình chung (globals) | Mục quản lý (thẻ Tổng quan) / Cấu hình chung |
| Tìm với {{label}} | Tìm theo {{label}} |
| Toán tử lọc kiểu máy dịch | là · không phải · là một trong · có giá trị · Có/Không |
| Thông báo lỗi có tiền tố "Lỗi -" | bỏ tiền tố |
| Nhóm menu "Danh mục" | Dữ liệu nền |
| Tệp riêng tư (CV) | Tệp CV ứng viên |
| Thư viện media | Thư viện ảnh & tệp |
| Thống kê lượt bấm theo ngày | Thống kê liên hệ theo ngày |
| Chi phí dịch theo tháng | Chi phí dịch tự động |
| Lead khách hàng (số nhiều) | Lead |
| Cột MIME Type | Loại tệp |
| Cột Excel "Người phụ trách" | Sale phụ trách |
| Nhãn ngày "… lúc" | Ngày … |
| Tab phiên bản | Lịch sử chỉnh sửa |

## Schema / Migration / API

- Schema/DB: không đổi (chỉ `label`/`admin.description`/`labels`). Migration: none.
- API: endpoint xuất lead giữ nguyên tham số; **thông báo lỗi** khi gặp bộ lọc không hỗ trợ dùng chữ toán tử mới, cột Excel "Sale phụ trách" (`docs/API_SPEC.md`).
- Không đổi slug, URL, access control.

## Ảnh hưởng / test

- Admin: sidebar, Tổng quan, danh sách + bộ lọc, thùng rác, phiên bản, đăng nhập/quên mật khẩu, upload media/CV, form mọi collection/global (SEO, slug, Homepage, bảng giá).
- Lead export (thông báo bộ lọc không hỗ trợ + file Excel).
- Banner/bộ lọc dịch (`src/lib/translation/admin-ui.ts`).
- Chưa kiểm trình duyệt thật — test-scope `spec/test-scope/current.json` v41.
