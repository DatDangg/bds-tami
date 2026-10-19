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
4. Sửa 2 minor từ review T01 (`QuickFilterChips.tsx:31`): (a) `Tất cả` chỉ sáng khi không nhánh nào có điều kiện lá trên `fields` của nhóm (helper `hasGroupCondition` + test); (b) bấm `Tất cả` đang sáng → không gọi refineListData.
5. Test: unit export-filters (client + server, dạng chuỗi từ URL, giá trị lạ → 400/khoá), test chip Lead, test endpoint/tích hợp nếu harness sẵn có (chip `Mới (chưa giao)` / `Đang tư vấn` ra đúng tập).

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
- Builder (T02), chưa commit. Files: `src/lib/admin/quick-filters.ts` (+`hasGroupCondition`, `LEAD_QUICK_FILTER_GROUPS`), `src/components/admin/QuickFilterChips.tsx` (`Tất cả` chỉ sáng khi nhóm không có điều kiện; bấm khi đang sáng không gọi refineListData), `src/components/admin/LeadQuickFilterSlot.tsx` (mới), `src/collections/Leads.ts` (beforeListTable: chip rồi export), importMap, `src/lib/leads/export-filters.ts` (client `status in` / `assignedTo exists false`; server `statusIn=a,b` + `unassigned=1`, whitelist, mâu thuẫn → 400/khoá), `docs/API_SPEC.md` (~193, ~202; `beforeList` → `beforeListTable`), tests tương ứng. Access Leads (`isAssignedOrAdmin`), schema, migration không đổi; audit meta chỉ có giá trị chuẩn hoá.
- `UNSUPPORTED_FILTER_MESSAGE` dùng đúng nhãn Payload vi: `isIn` = "có trong", `exists` = "tồn tại" (giá trị Không) thay vì "nằm trong"/"chưa có" ghi trong acceptance (nhãn thật của Payload).
- Verify: `pnpm test` (vitest) PASS (sau khi sửa 2 test LeadExportButton dùng `in` làm ví dụ không hỗ trợ → `not_in`); `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs); `pnpm typecheck` PASS; `pnpm generate:importmap` đã thêm LeadQuickFilterSlot. Chưa kiểm tay trên trình duyệt (375px, F5) — để reviewer/manual.
- **Attempt 2 (defect trình duyệt):** bấm `Đang tư vấn` → `Mới (chưa giao)` làm URL thành `where[or][0][and][0][status][equals]=new`, mất `assignedTo exists`, chip không sáng. Root cause: `@payloadcms/ui` WhereBuilder (`index.js:173`) đọc `condition?.[fieldPath]?.[operator] || undefined` → giá trị falsy (boolean `false`, số `0`) thành `undefined`, Condition (debounced `updateValue`) ghi lại where thiếu điều kiện đó. Fix: chip ghi giá trị chuỗi như UI lọc Payload — Lead `assignedTo exists "false"`, Rentals Studio `bedrooms equals "0"` (`src/lib/admin/quick-filters.ts`); `leafSignature` đã so bằng chuỗi nên `currentChip`/`withChip` nhận cả dạng boolean/số cũ (rời chip Mới vẫn chỉ bỏ điều kiện exists, cả hai dạng); `export-filters.ts` đã nhận `false`/`"false"` → `unassigned=1`; server Payload parse `exists: "false"` = rỗng. Test: cập nhật kỳ vọng sang chuỗi + test hồi quy "không chip nào có giá trị lá falsy" + Studio `"0"`.
- Browser (:3000, admin): leads `Đang tư vấn` → `Mới (chưa giao)` giữ `[and][0][status][equals]=new&[and][1][assignedTo][exists]=false` sau >3s, chip sáng, 1 dòng; Đã chốt/Không thành/Đang tư vấn/Mới đều sáng đúng, `Xuất Excel` enabled ở mọi chip; F5 từ chip `in` và từ chip Mới giữ nguyên URL + chip sáng. Rentals: Studio/2 PN/Dưới 10tr ghi đúng URL, F5 giữ Studio (`equals=0`, bảng lọc hiện giá trị 0; API 0 tin Studio = chưa có dữ liệu Studio), 2 PN 10 dòng. 375px: leads + rentals `scrollWidth = 375`, không tràn ngang; đã reset viewport. `pnpm test` 2954 PASS, `pnpm lint` 0 error, `pnpm typecheck` PASS.

## Review
- Round 1 STRICT PASS (3 minor) — `.context/review-reports/feature-admin-list-quick-filter-chips-phase-1-task-02-round-1-review.md`; MINOR-1 ("tồn tại" = Sai) + MINOR-2 (giá trị `status in` có khoảng trắng → khoá nút) sửa ngay.
- Kiểm trình duyệt sau round 1 phát hiện chip `Mới (chưa giao)` mất `assignedTo exists false` (WhereBuilder Payload `value || undefined`) → attempt 2 ghi giá trị chuỗi `"false"` / Studio `"0"`.
- Round 2 STRICT PASS — `.context/review-reports/feature-admin-list-quick-filter-chips-phase-1-task-02-round-2-review.md`; MINOR-A (comment cạnh giá trị chuỗi) đã thêm.
- Phase 1 spec-validation PASS — `.context/review-reports/feature-admin-list-quick-filter-chips-phase-1-round-1-review.md`.
- Quyết định agent (user ủy quyền 2026-10-20): nhãn toán tử trong thông báo khoá nút theo đúng nhãn Payload vi ("có trong", "tồn tại" = Sai) thay cho "nằm trong"/"chưa có" của task.

## Doc impact / Reconcile
- `docs/API_SPEC.md` §4 (cột mục đích + as-built `GET /api/admin/leads/export`: `statusIn`, `unassigned=1`, slot `beforeListTable`). Không schema/ERD.
