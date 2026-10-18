# Spec Update — 2026-10-19 legal-en-edit-requires-reapproval

**spec_version:** 1.2.2 → 1.3.0 (MINOR — thêm quy tắc nghiệp vụ cho trang pháp lý, đổi behavior duyệt EN)

**Trigger:** feature-update (Change Request MODIFY, BL-013) — change doc `spec/changes/2026-10-19-legal-en-edit-requires-reapproval.md`, task `tasks/feature-legal-en-edit-requires-reapproval/phase-1-task-01.md`

**Nguồn:** user quyết intent BR-08 ngày 19/10/2026 (review L10-T02 round 4).

**Requirements:**
- SỬA **BR-08** (`docs/BRD.md` v1.6): bản tiếng Anh của trang pháp lý **đã duyệt** mà bị sửa tay nội dung EN (không qua lệnh duyệt) → mất trạng thái duyệt, ẩn khỏi `/en` cho tới khi admin duyệt lại — giống luồng AI dịch lại. Lưu không đổi nội dung EN (chỉ sửa bản Việt / thông tin khác) → giữ duyệt.
- SỬA **F12** (`SPECIFICATIONS.md` mục AI tự dịch): bổ sung tương ứng — sửa tay EN đã duyệt → tắt `hasEnglish` tới khi duyệt lại.
- Liên quan (không đổi chữ): **BR-07** (`/en` chỉ hiện khi `hasEnglish = true`, không fallback), **FR-ADM-17** (job dịch / lệnh duyệt EN).

**Ảnh hưởng:**
- Hook `beforeChange` của `pages`: hạ `hasEnglish` khi nội dung EN của trang pháp lý đã duyệt bị sửa tay.
- `/en` trang pháp lý (privacy/terms), sitemap EN, `/api/locale-counterpart`, lệnh duyệt `POST /api/admin/translations/pages/:id/approve`, job dịch.
- Retest: duyệt EN 422/409, form cũ không tự duyệt, AI dịch lại hạ duyệt, sửa VI giữ duyệt.

**Docs đã cập nhật:** `docs/BRD.md` (v1.6, BR-08), `SPECIFICATIONS.md` (F12, version). Doc as-built (`docs/API_SPEC.md`…) reconcile ở close-out task.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 2
