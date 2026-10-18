# Spec Update — 2026-10-19 layer9-minor-export-reminder

**spec_version:** 1.8.0 → 1.9.0 (MINOR — đổi hành vi nhìn thấy được của tính năng xuất Excel sẵn có: nút ẩn ở thùng rác / list drawer, nút khoá kèm thông báo nêu toán tử hỗ trợ. `docs/SPEC_VERSIONING.md` chỉ cho PATCH khi "không đổi behavior" nên không dùng PATCH; không xoá/đổi ngữ nghĩa requirement nên không MAJOR. Cùng cách xếp loại với 1.6.0/1.8.0)

**Trigger:** feature-update (Change Request MODIFY, BL-009) — change doc `spec/changes/2026-10-19-layer9-minor-export-reminder.md`, task `tasks/feature-layer9-minor-export-reminder/phase-1-task-01.md` (xuất Excel), `phase-1-task-02.md` (index job nhắc lead)

**Nguồn:** spec-validation layer 9 G33 — MINOR còn lại của L9-T05 round 3 (xuất Excel) và L9-T04 (job nhắc lead).

**Requirements:**
- SỬA **F9** (FR-ADM-09/FR-ADM-10) dòng "xuất Excel": xuất đúng bộ lọc đang áp trong danh sách lead — trạng thái / nguồn / sale phụ trách với toán tử "bằng", ngày tạo với "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng"; bộ lọc khác → nút khoá kèm thông báo nêu rõ các toán tử được hỗ trợ; nút không hiện ở thùng rác và trong cửa sổ chọn lead (list drawer).
- Liên quan (không đổi chữ): **BR-14** (nhắc admin lead `new` chưa giao sau 30 phút giờ hành chính) — chỉ thêm index DB cho truy vấn job `remind-unassigned-leads`, không đổi hành vi.

**Code dự kiến (builder chốt):**
- T01: `src/lib/leads/export-filters.ts` (thông báo `UNSUPPORTED_FILTER_MESSAGE` liệt kê toán tử; so `createdFrom > createdTo` bằng `Date.parse`), `src/components/admin/LeadExportButton.tsx` + server component bọc mới (dò thùng rác qua `params.segments`; ẩn trong list drawer), `src/collections/Leads.ts` (beforeList), `src/app/(payload)/admin/importMap.js`
- T02: `migrations/20261018_212611_leads_remind_scan_index` — `CREATE INDEX` trên `leads (status, assigned_to_id, reminded_at, created_at)` (additive, versioned) + `migrations/index.ts`

**Schema/API:** endpoint `GET /api/admin/leads/export` contract không đổi. Schema: thêm 1 index trên bảng `leads` (không destructive).

**Ảnh hưởng:**
- Admin: list view / trash view / list drawer của collection `leads` (hiện/ẩn/khoá nút xuất).
- Xuất Excel theo bộ lọc (fail-closed với toán tử không hỗ trợ, khoảng ngày khác định dạng / múi giờ).
- Job `remind-unassigned-leads` (hiệu năng truy vấn; hành vi không đổi).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 9
