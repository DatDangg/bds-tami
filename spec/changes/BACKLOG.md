# BACKLOG — Yêu cầu & bug hậu-build (auto-intake)

> Khi build xong hết layer lần đầu (`mode: maintenance`), **mọi yêu cầu/bug user gửi qua chat
> được agent TỰ ĐỘNG ghi vào đây + tạo change doc** — user KHÔNG cần tạo file tay.
> User chỉ cần gõ `/change` (hoặc `/change <slug>`) → agent xử lý → cập nhật tracking.

## Bảng tracking

| ID | Tiêu đề | Loại | Trạng thái | Change file | Tạo | Xong |
|----|---------|------|-----------|-------------|-----|------|
| BL-001 | Design debt header/footer: header 2 hàng ở xl, website bỏ qua `header.ctaButton`/logo nhập trong CMS, footer chưa accordion < md, menu toàn màn hình thiếu accordion menu con (L5-T05 decision log; G18 spec-validation layer 5) | MODIFY | blocked (chờ user quyết làm trong build hay sau build; chưa tạo change doc) | — | 2026-10-17 | |
| BL-002 | Base image Debian 11 (EOL) của postgres/backup (`docker/backup/`): nâng lên base còn hỗ trợ (L4 G14; G18 spec-validation layer 5) | MODIFY | blocked (chờ user duyệt thời điểm nâng; chưa tạo change doc) | — | 2026-10-17 | |
| BL-003 | `down` của 8 migration do Payload sinh lỗi khi rollback (DROP CONSTRAINT `payload_locked_documents_rels_*_fk` sau `DROP TABLE … CASCADE`): click_events, categories_developers, translation_usage, services_pages, news, provinces_wards, projects, job_postings. Đề xuất: sửa riêng `down` (`IF EXISTS`), giữ nguyên `up` + snapshot — là ngoại lệ luật "không sửa migration đã apply", hoặc ghi runbook rollback = fix-forward (review L5-T04 round 2) | BUG | done (user duyệt ngoại lệ 2026-10-18; reviewer STRICT PASS — .context/review-reports/build-tami-website-bl-003-round-1-review.md) | — | 2026-10-18 |  2026-10-18 |
| BL-004 | src/lib/contrast.test.ts:22 tìm marker gồm xuống dòng LF sau `.theme-dark-block {` → fail trên checkout Windows mới (core.autocrlf=true ra CRLF; gặp ở worktree L7/L8). Chuẩn hoá CRLF→LF khi đọc CSS trong test, hoặc thêm `.gitattributes` với `* text=auto eol=lf` | BUG | pending (chưa tạo change doc) | — | 2026-10-18 | |
| BL-005 | Form ứng tuyển (L7-T04): thanh % tiến trình khi tải CV + vùng kéo-thả riêng ở màn ≥ md theo design-spec §3.4 — nợ thiết kế (hook `usePublicForm` dùng fetch, không có upload progress; cần XHR riêng trong `ApplyForm`) | MODIFY | pending (user chọn backlog 2026-10-18, D3 spec-validation layer 7) | — | 2026-10-18 | |
| BL-006 | Reindex `rentals.searchText` khi đổi tên tỉnh/phường/dự án có > 500 tin: hiện hook bỏ qua + log lệnh `pnpm reindex:rentals-search` (`src/lib/search/reindex-in-hook.ts`, L8-T03) → chuyển thành Payload Jobs task chạy nền (cần migration thêm giá trị enum task) + cảnh báo trên admin khi bị bỏ qua | MODIFY | pending (review L8-T03 MINOR-2) | — | 2026-10-18 | |

## Quy tắc tracking

- **Trạng thái:** `pending` (chưa xử lý) · `in_progress` (đang xử lý) · `done` (xong, change file đã archive) · `blocked` (kẹt, cần user).
- **Agent intake (tự động, khi user chat yêu cầu/bug trong maintenance mode):**
  1. Tạo change doc `spec/changes/YYYY-MM-DD-<slug>.md` (copy `_TEMPLATE.md`, điền yêu cầu + acceptance từ lời user — thiếu thông tin thì hỏi ngắn 1 lần, KHÔNG bịa).
  2. Thêm 1 dòng vào bảng trên với trạng thái `pending`.
  3. Báo user: "✅ Đã ghi vào backlog: <tiêu đề> — gõ `/change` (hoặc `/change <slug>`) để xử lý." **KHÔNG code ngay.**
- **Agent xử lý change (`/change`):** khi change được xử lý xong (status `done` + chuyển `archive/`) → cập nhật hàng tương ứng: `in_progress` (khi bắt đầu) → `done` + ngày xong. `blocked` khi cần user quyết định.
- **Duy nhất 1 nguồn:** mỗi dòng = 1 change doc ở `spec/changes/`. Không xoá dòng đã `done` (giữ lịch sử), chỉ cập nhật trạng thái.
- **`/change --list`:** liệt kê các dòng chưa `done` từ bảng này (kèm slug để chạy `/change <slug>`).| BL-004 | `src/lib/contrast.test.ts:22` tìm marker `".theme-dark-block {\n  --color-bg"` → fail trên checkout Windows mới (core.autocrlf=true ra CRLF). Chuẩn hoá `\r\n` khi đọc CSS hoặc thêm `.gitattributes` `* text=auto eol=lf` (phát hiện khi chạy worktree L7) | BUG | pending (chưa tạo change doc) | — | 2026-10-18 | |
