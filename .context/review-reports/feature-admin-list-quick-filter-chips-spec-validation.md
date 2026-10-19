Agent: spec-validator

# Spec validation (pre-plan) — feature-admin-list-quick-filter-chips (BL-022, ADDITIVE) — round 1

- Mode: Spec validation (before task execution)
- Inputs: `spec/changes/2026-10-19-admin-list-quick-filter-chips.md` (incl. D1–D7, treated as approved), `git diff SPECIFICATIONS.md` (FR-ADM-19 "Chip lọc nhanh (BL-022)", F9 export clause, 1.17.0 → 1.18.0), `tasks/feature-admin-list-quick-filter-chips/phase-1-task-01.md`, `phase-1-task-02.md`, `src/lib/translation/admin-ui.ts`, `src/lib/leads/export-filters.ts`, `src/collections/Rentals.ts`, `src/collections/Leads.ts`, `src/fields/status.ts`, `docs/API_SPEC.md` §4 (lines 193, 202), `spec/changes/BACKLOG.md` (BL-024).

## Verdict: FAIL (0 ❌, 0 HIGH conflict, 3 ⚠️; the rule is ≥3 ⚠️ → FAIL)

All three warnings are cheap to fix: two need spec wording, one needs a small change to task T02. Feasibility is fine. No schema change is needed (`bedrooms` at Rentals.ts:180, `priceMonthlyVnd` at Rentals.ts:173, statuses at status.ts:4-5, Leads `status`/`assignedTo` at Leads.ts:91/128). The helper pattern (`toBranches`/`withTranslationFilter`, admin-ui.ts:35-61) supports D2, and the export mapper (export-filters.ts:122-182) can be extended for D6.

## Coverage matrix

| # | Requirement (change doc) | Spec delta | Task | Status | Note |
|---|---|---|---|---|---|
| 1 | Rentals Trạng thái: Tất cả / published / rented / draft; `hidden` only under Tất cả | FR-ADM-19 BL-022 ✓ | T01 §2 ✓ | ✅ | Values exist in RENTAL_STATUSES (status.ts:4-5) |
| 2 | Rentals Số PN: **Tất cả** / Studio=0 / 1 / 2 / 3+ (≥3) | Lists Studio/1/2/3+ but **does not list the `Tất cả` chip** for this group | T01 §2 ✓ (has Tất cả) | ⚠️ W2 | Not an exact match to the change doc table and D4 |
| 3 | Price: <10tr · 10tr ≤ x <20tr · 20tr ≤ x ≤ 50tr · >50tr; no Tất cả; tapping the active chip again clears | ✓ boundaries identical | T01 §2 ✓, D5 operators | ✅ | Boundaries 10/20/50tr match exactly (incl. ≤ 50tr inclusive) |
| 4 | A rental with no bedrooms/price value matches no chip in that group | ✓ | implicit (Payload comparisons on null) | ✅ | Suggest a unit/integration assertion in T01 test list |
| 5 | Lead Trạng thái: Tất cả / Mới (chưa giao) = new AND unassigned / Đang tư vấn = contacted+consulting / won / lost; `spam` only under Tất cả | ✓ | T02 §1 ✓ | ✅ | |
| 6 | Chips do not widen permissions (sale sees only assigned leads) | ✓ | T02 §2 + acceptance ✓ | ✅ | `isAssignedOrAdmin` unchanged (Leads.ts:225) |
| 7 | One tap to apply/clear, AND with other filters + search + Lọc dịch, no repeat of bug #01 (per-OR-branch merge, D2) | ✓ | T01 §1/§5, T02 acceptance | ⚠️ W1 | Lead group `fields = status + assignedTo` (T02 §1) conflicts with "AND với bộ lọc khác" (see W1) |
| 8 | Chip state on URL `where`; F5/share keeps it; editing the same field manually un-highlights the chip; chip replaces same-field conditions (D3) | ✓ | T01 §1, acceptance; T02 F5 ✓ | ✅ | T01 §1 correctly notes qs string normalisation |
| 9 | Lead Excel export follows the active chip (D6: `status in`, `assignedTo exists false`; other operators still locked) | F9 clause ✓ | T02 §3 ✓ | ✅ | Server whitelist + 400 on conflict/duplicates; audit unchanged |
| 10 | AA light/dark, keyboard, 375px no page overflow (chip bar scrolls horizontally) | ✓ | T01 §3 + acceptance; T02 relies on shared component | ✅ (residual) | See R1 (BL-024) |
| 11 | Out of scope: area chip, Projects / Property posts | ✓ | — | ✅ | |
| 12 | No schema/DB/permission change, no new endpoint, no migration; MINOR bump | 1.18.0 ✓; FR-ADM-19 still says "không đổi … API" | T01/T02 ✓ | ⚠️ W3 | Wording conflict with the F9 export param extension |
| 13 | Doc impact | — | T02 §3 updates `docs/API_SPEC.md`; T01 states no doc impact | ✅ | API_SPEC line 193 (table "Mục đích") and line 202 (as-built) both need updating, not just 202 |

## Findings

### ⚠️ W1 (MEDIUM): the Lead chip group removes the manual "Sale phụ trách" filter
- T02 §1 sets the Lead group `fields = status + assignedTo`, and D3/the spec say "chọn chip thay mọi điều kiện cùng trường của nhóm đó". If an admin filters `Sale phụ trách = A` and then taps `Đã chốt` / `Đang tư vấn` / `Không thành`, `assignedTo equals A` is silently dropped. That contradicts the acceptance item "kết hợp đúng với bộ lọc khác" and the spec text "không làm mất điều kiện khác". It also hurts the main Sales/admin use case (per-sale funnel).
- Suggested resolution (no new requirement): status-group chips always replace `status` leaf conditions. The `assignedTo` handling changes only when a chip that sets `assignedTo` is involved: replace `assignedTo` conditions when applying `Mới (chưa giao)` (the conditions really conflict), and when moving away from it remove only `assignedTo: { exists: false }`. Put this in the spec sentence and in T02 §1 with a test.

### ⚠️ W2 (LOW): spec delta omits the `Tất cả` chip for Số phòng ngủ
- Change doc table and D4: Số PN has `Tất cả`. The spec delta lists `Studio` = 0 · `1 PN` · `2 PN` · `3 PN+`. The general sentence "bấm lại … hoặc `Tất cả`" does not say which groups render `Tất cả`, and the price group has none by design (D4). Add `Tất cả ·` to the bedrooms group in FR-ADM-19, and optionally state "nhóm giá không có Tất cả".

### ⚠️ W3 (LOW): FR-ADM-19 constraint "không đổi schema/DB, access control, **API**" vs D6 export parameters
- The BL-022 paragraph now sits inside FR-ADM-19, followed by "Ràng buộc: không đổi … API". T02 adds query parameters to `GET /api/admin/leads/export` (F9 delta). This is the same tension BL-021 introduced with `search`. Clarify, for example: "không endpoint mới; riêng tham số lọc của xuất Excel lead mở rộng theo F9".

## Residual risks / notes (not counted)
- R1: BL-024 (BACKLOG.md:34, pending) says `/admin/collections/rentals` already scrolls horizontally at 375px (~576px) before this change. The change-doc acceptance "375px không tràn ngang trang" cannot be fully met by BL-022. T01 correctly scopes it as "không cuộn ngang trang **do thanh chip**". T02 should use the same scope for the Leads toolbar (chips + export button on one row), and the reviewer should not fail BL-022 on BL-024's overflow.
- R2: `Mới (chưa giao)` always returns 0 rows for a sale user (access only returns assigned leads). This is correct behaviour, not a gap. Hiding the chip for sale is optional and not required.
- R3: Payload's filter UI also offers `in`/`exists` to users. After D6, manual `Trạng thái nằm trong …` / `Sale phụ trách tồn tại = false` filters also become exportable. This is consistent with F9 ("`status` nằm trong tập trạng thái hợp lệ") and safe because of the whitelist. Update `UNSUPPORTED_FILTER_MESSAGE` (export-filters.ts:114-116) and API_SPEC accordingly.
- R4: Pre-existing doc drift: API_SPEC line 202 says the slot is `beforeList`, but the code uses `beforeListTable` (Leads.ts:218). Reconcile it during the T02 API_SPEC update.
- R5: Spec Publisher artifacts for 1.18.0 (`spec/updates/`, `spec/CHANGELOG.md`, `spec/test-scope/current.json`) are not on disk yet. The change-request flow must run spec-publisher before close-out.

## Gap list for builder/loop
- [PARTIAL] W1: Lead chip `fields` handling of `assignedTo` — spec FR-ADM-19 BL-022 sentence + T02 §1 scope/tests.
- [PARTIAL] W2: FR-ADM-19 Số phòng ngủ group missing `Tất cả`.
- [PARTIAL] W3: FR-ADM-19 "không đổi … API" wording vs F9 export params.
- After the fixes, rerun spec validation (round 2).
