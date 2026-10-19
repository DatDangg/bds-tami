Agent: spec-validator

# Phase review — feature-admin-list-quick-filter-chips — phase 1 — round 1

- Mode: Phase review (FEATURE_WORKFLOW §3.7), read-only
- Scope: T01 commit `7cb85fd` (Rentals chips + helper + component) + T02 working tree (Lead status chips, export by chip, string-value fix `"0"` / `"false"`)
- Sources: `SPECIFICATIONS.md:87` (F9), `SPECIFICATIONS.md:92` (FR-ADM-19 "Chip lọc nhanh (BL-022)"), `spec/changes/2026-10-19-admin-list-quick-filter-chips.md` (acceptance + D1–D7 + W1), `docs/API_SPEC.md` §4 as-built (working tree), `spec/test-scope/current.json` (v22)
- Excluded per request: `next.config.ts`, `src/payload-types.ts`
- Reviewer reports: task-01 round-1 STRICT PASS; task-02 round-2 STRICT PASS

## Verdict: COMPLETE (PASS) — no MISSING / PARTIAL

## Coverage matrix

| Requirement | Source | Implementation | Status | Note |
|---|---|---|---|---|
| Rentals Trạng thái: Tất cả / published / rented / draft; `hidden` chỉ ở Tất cả | change doc L23; SPEC:92 | `src/lib/admin/quick-filters.ts:121-132` | OK | không có chip hidden |
| Rentals Số PN: Studio=0, 1, 2, 3PN+ ≥3, có Tất cả | change doc L24; D5 | `quick-filters.ts:133-145` | OK | Studio `"0"` chuỗi (WhereBuilder bỏ falsy), leafSignature so chuỗi `quick-filters.ts:31-37` |
| Rentals giá: <10tr; [10,20); [20,50]; >50tr; không có Tất cả | change doc L25; D4/D5 | `quick-filters.ts:146-156` | OK | biên đúng toán tử |
| Tin thiếu PN/giá không lọt chip | change doc L27 | điều kiện so sánh/equals trên trường → null không khớp | OK | |
| Lead: Mới (chưa giao) = new AND assignedTo exists false; Đang tư vấn = in[contacted,consulting]; won; lost; spam chỉ Tất cả | change doc L32; D5 | `quick-filters.ts:104-118` | OK | |
| Mỗi nhóm chọn 1; bấm lại chip sáng / Tất cả = bỏ lọc | D4; SPEC:92 | `QuickFilterChips.tsx:24-38` | OK | Tất cả sáng chỉ khi nhóm không có điều kiện (`hasGroupCondition`) |
| Ghép vào từng nhánh `or` (không lặp bug #01), AND với bộ lọc/tìm kiếm/Lọc dịch | D2; acceptance 1 | `withChip` `quick-filters.ts:84-97` dùng `toBranches`/`rebuildWhere` chung với Lọc dịch | OK | |
| Chọn chip thay mọi điều kiện lá cùng trường; chip sáng khi mọi nhánh khớp đúng | D3; SPEC:92 | `currentChip` `:61-73`, `withChip` `:89-95` | OK | |
| W1: Lead chip luôn thay `status`; chỉ `Mới` thay thêm `assignedTo`; rời chip đó chỉ bỏ `assignedTo exists false`, giữ Sale phụ trách tay | D3/W1; SPEC:92 | `replaces` `:112`; `groupConditionSignatures` `:57-58,92` | OK | |
| where trên URL → F5/share giữ chip | acceptance 3 | `refineListData({ where, page: 1 })` `QuickFilterChips.tsx:25`; chuẩn hoá chuỗi/mảng từ qs `:31-37` | OK | về trang 1 (test-scope L79) |
| Xuất Excel lead theo chip (client map `status in` → `statusIn`, `assignedTo exists false` → `unassigned=1`; mâu thuẫn → khoá) | acceptance 4; D6; F9 SPEC:87 | `src/lib/leads/export-filters.ts` `conditionParam`/`CONFLICTING_PARAMS` (diff) | OK | giá trị có khoảng trắng → khoá (an toàn PII) |
| Server parse/build `statusIn` (hợp lệ, ≤6, gộp trùng), `unassigned=1`, mâu thuẫn → 400 | D6; API_SPEC §4 | `export-filters.ts` `parseStatusList`, `parseLeadExportFilters`, `buildLeadExportWhere` | OK | `LEAD_STATUSES.length` = 6 (`src/lib/leads/lead-values.ts:6`) khớp "tối đa 6" |
| Toán tử khác vẫn khoá nút + thông báo nêu toán tử hỗ trợ | D6; F9 | `UNSUPPORTED_FILTER_MESSAGE` (diff) | OK | thêm "có trong", "tồn tại = Sai" |
| Audit chỉ ghi giá trị chuẩn hoá | API_SPEC §4 | `src/endpoints/admin/leads-export.ts:195,207` | OK | statusIn/unassigned đi theo `auditFilters` |
| A11y: button aria-pressed, role=group có nhãn, bàn phím, focus-visible, 44px, AA sáng/tối | acceptance 5; SPEC:92 | `QuickFilterChips.tsx:27-40`; `src/components/admin/styles/_lists.scss:218-279` | OK | token admin (contrast test sẵn có) |
| 375px: thanh chip cuộn ngang nội bộ | acceptance 5 | `_lists.scss:224-247` (min-width 0, max-width 100%, overflow-x auto) | OK | tràn khác thuộc BL-024 (test-scope L94) |
| Ẩn ở thùng rác / list drawer | test-scope L77 | `LeadQuickFilterSlot.tsx:13`, `RentalQuickFilterSlot.tsx:13`, `QuickFilterChips.tsx:16` | OK | |
| Không nới quyền | change doc L34; SPEC:92 | chỉ thêm điều kiện where; access Leads không đổi | OK | |
| Slot placement: chip trước nút Xuất, cùng toolbar | SPEC:92; API_SPEC §4 | `src/collections/Leads.ts:219`; `src/collections/Rentals.ts:131` | OK | Rentals + Lọc dịch nối sau qua `content-defaults.ts:173` |
| Không schema/DB/endpoint mới/migration; spec 1.18.0 | D7 | không có migration; `spec/test-scope/current.json:2-3` (1.18.0 / v22) | OK | |
| Ngoài phạm vi: không chip diện tích, không Projects/Đăng tin BĐS | change doc L37 | chỉ 2 slot | OK | |
| API_SPEC as-built khớp code | AGENTS Doc Impact | `docs/API_SPEC.md:193,202` (diff) ↔ `export-filters.ts` | OK | |

## Gaps
None ([MISSING] 0, [PARTIAL] 0).

## Residual / close-out notes (not gaps)
1. T02 chưa commit — close-out (progress → commit) còn chờ.
2. `spec/test-scope/current.json:6` `triggerNote` vẫn ghi "Phát hành trước khi build (T01, T02 chưa code) — commits/files là kế hoạch, cập nhật ở close-out" → cập nhật commits/files khi close-out phase.
3. `spec/changes/2026-10-19-admin-list-quick-filter-chips.md:4` `status: in_progress`, acceptance checkboxes L40-44 chưa tick → tick + archive ở close-out.
4. Hành vi thực trên Payload với giá trị chuỗi (`bedrooms equals "0"`, `assignedTo exists "false"`) dựa vào ép kiểu của Payload; đã được reviewer T02 xác minh — validator không chạy lại runtime.
5. Đường dẫn report: viết theo quy ước `<feature>-<slug>-phase-<N>-round-<R>-review.md`; không ghi đè `feature-admin-list-quick-filter-chips-spec-validation.md` (report pre-plan round 1 đã commit trong `7cb85fd`).
