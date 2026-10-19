# feature-admin-list-quick-filter-chips · phase-1-task-02 — chip Trạng thái Lead + xuất Excel theo chip

- Change doc: `spec/changes/2026-10-19-admin-list-quick-filter-chips.md` (BL-022, ưu tiên 2). Spec: FR-ADM-19 "Chip lọc nhanh" + F9 xuất Excel lead (1.18.0). Phụ thuộc T01 (helper + component `QuickFilterChips`).

## Classification / Risk
- Type: **ADDITIVE**. Risk: **HIGH → review STRICT** — đụng endpoint xuất Excel lead (PII, quyền admin, audit) và parse tham số server.
- Blast radius: danh sách `/admin/collections/leads`, `src/lib/leads/export-filters.ts` (+ endpoint dùng nó), `LeadExportSlot`/`LeadExportButton`. Doc impact: `docs/API_SPEC.md` mục xuất lead (tham số mới) — as-built.
- Decision impact: D3, D5, D6 trong change doc.

## Scope
1. Nhóm chip Lead Trạng thái: `Tất cả` · `Mới (chưa giao)` = `status equals new` + `assignedTo exists false` · `Đang tư vấn` = `status in [contacted, consulting]` · `Đã chốt` = won · `Không thành` = lost; `spam` chỉ ở Tất cả. Chip luôn thay mọi điều kiện `status`; chỉ `Mới (chưa giao)` thay thêm điều kiện `assignedTo`; rời chip này (chọn chip khác / Tất cả / bấm lại) chỉ bỏ đúng `assignedTo exists false`, giữ `assignedTo equals X` tay khi chọn chip khác (spec-validation W1 — có test: lọc Sale = A rồi bấm `Đã chốt` vẫn còn Sale = A). Helper T01 có thể cần cho chip khai báo trường mình thay (vd `replaces`) thay vì cả nhóm. Phạm vi kiểm 375px: chỉ tràn do thanh chip (tràn sẵn có của danh sách thuộc BL-024).
2. Đăng ký vào `beforeListTable` của Leads cùng `LeadExportSlot` (cùng hàng). Không nới quyền (access `isAssignedOrAdmin` giữ nguyên).
3. Xuất Excel theo chip (D6):
   - Client `leadExportQueryFromWhere`: nhận thêm `status: { in: [...] }` (mỗi giá trị thuộc `LEAD_STATUSES`; mảng hoặc chuỗi phân tách dấu phẩy như Payload đọc từ URL) và `assignedTo: { exists: false }` (kể cả `"false"`). Không trùng với `status equals` / `assignedTo equals` cùng truy vấn. Toán tử khác vẫn `ok:false`.
   - Server `parseLeadExportFilters` / `buildLeadExportWhere`: tham số mới (chọn 1 cách, vd `statusIn=contacted,consulting` + `unassigned=1`), validate whitelist, trùng/mâu thuẫn/quá số giá trị → 400; where `status in` / `assignedTo exists false`. Không ghép chuỗi thô.
   - Cập nhật `UNSUPPORTED_FILTER_MESSAGE` nếu cần (giữ test hiện có hợp lệ). Audit như cũ (bộ lọc chuẩn hoá, không PII).
   - Cập nhật `docs/API_SPEC.md` mục xuất lead.
4. Test: unit export-filters (client + server, dạng chuỗi từ URL, giá trị lạ → 400/khoá), test chip Lead, test endpoint/tích hợp nếu harness sẵn có (chip `Mới (chưa giao)` / `Đang tư vấn` ra đúng tập).

## Acceptance
- [ ] Nhóm Trạng thái Lead đúng bảng; kết hợp với tìm kiếm / bộ lọc khác; F5 giữ chip.
- [ ] Xuất Excel khi đang chọn bất kỳ chip nào (kể cả kèm tìm kiếm) ra đúng tập đang lọc; toán tử không hỗ trợ khác vẫn khoá nút.
- [ ] Sale không thấy thêm lead nào ngoài lead được giao.
- [ ] 375px: thanh chip Lead không gây cuộn ngang trang (tràn sẵn có = BL-024); bàn phím + aria-pressed như T01.
- [ ] Close-out: `UNSUPPORTED_FILTER_MESSAGE` nêu thêm "nằm trong" (Trạng thái) / "chưa có" (Sale phụ trách); `docs/API_SPEC.md` dòng ~193 (cột mục đích) + ~202 (as-built, sửa `beforeList` → `beforeListTable`).
- [ ] `pnpm test` / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
(builder điền)
