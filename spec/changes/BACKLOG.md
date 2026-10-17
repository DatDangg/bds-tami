# BACKLOG — Yêu cầu & bug hậu-build (auto-intake)

> Khi build xong hết layer lần đầu (`mode: maintenance`), **mọi yêu cầu/bug user gửi qua chat
> được agent TỰ ĐỘNG ghi vào đây + tạo change doc** — user KHÔNG cần tạo file tay.
> User chỉ cần gõ `/change` (hoặc `/change <slug>`) → agent xử lý → cập nhật tracking.

## Bảng tracking

| ID | Tiêu đề | Loại | Trạng thái | Change file | Tạo | Xong |
|----|---------|------|-----------|-------------|-----|------|
| BL-001 | Design debt header/footer: header 2 hàng ở xl, website bỏ qua `header.ctaButton`/logo nhập trong CMS, footer chưa accordion < md, menu toàn màn hình thiếu accordion menu con (L5-T05 decision log; G18 spec-validation layer 5) | MODIFY | blocked (chờ user quyết làm trong build hay sau build; chưa tạo change doc) | — | 2026-10-17 | |
| BL-002 | Base image Debian 11 (EOL) của postgres/backup (`docker/backup/`): nâng lên base còn hỗ trợ (L4 G14; G18 spec-validation layer 5) | MODIFY | blocked (chờ user duyệt thời điểm nâng; chưa tạo change doc) | — | 2026-10-17 | |
| BL-003 | `down` của 8 migration do Payload sinh lỗi khi rollback (DROP CONSTRAINT `payload_locked_documents_rels_*_fk` sau `DROP TABLE … CASCADE`): click_events, categories_developers, translation_usage, services_pages, news, provinces_wards, projects, job_postings. Đề xuất: sửa riêng `down` (`IF EXISTS`), giữ nguyên `up` + snapshot — là ngoại lệ luật "không sửa migration đã apply", hoặc ghi runbook rollback = fix-forward (review L5-T04 round 2) | BUG | blocked (chờ user duyệt ngoại lệ; chưa tạo change doc) | — | 2026-10-18 | |

## Quy tắc tracking

- **Trạng thái:** `pending` (chưa xử lý) · `in_progress` (đang xử lý) · `done` (xong, change file đã archive) · `blocked` (kẹt, cần user).
- **Agent intake (tự động, khi user chat yêu cầu/bug trong maintenance mode):**
  1. Tạo change doc `spec/changes/YYYY-MM-DD-<slug>.md` (copy `_TEMPLATE.md`, điền yêu cầu + acceptance từ lời user — thiếu thông tin thì hỏi ngắn 1 lần, KHÔNG bịa).
  2. Thêm 1 dòng vào bảng trên với trạng thái `pending`.
  3. Báo user: "✅ Đã ghi vào backlog: <tiêu đề> — gõ `/change` (hoặc `/change <slug>`) để xử lý." **KHÔNG code ngay.**
- **Agent xử lý change (`/change`):** khi change được xử lý xong (status `done` + chuyển `archive/`) → cập nhật hàng tương ứng: `in_progress` (khi bắt đầu) → `done` + ngày xong. `blocked` khi cần user quyết định.
- **Duy nhất 1 nguồn:** mỗi dòng = 1 change doc ở `spec/changes/`. Không xoá dòng đã `done` (giữ lịch sử), chỉ cập nhật trạng thái.
- **`/change --list`:** liệt kê các dòng chưa `done` từ bảng này (kèm slug để chạy `/change <slug>`).