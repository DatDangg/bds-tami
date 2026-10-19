Agent: spec-validator

# Spec validation (pre-plan): feature-admin-list-quick-filter-chips (BL-022, ADDITIVE), round 2

- Mode: Spec validation (before task execution). Scope: re-check W1–W3 from round 1 and look for new conflicts.
- Inputs: `git diff SPECIFICATIONS.md` (F9 + FR-ADM-19), `spec/changes/2026-10-19-admin-list-quick-filter-chips.md` (D3–D7, lines 32, 49–53), `tasks/feature-admin-list-quick-filter-chips/phase-1-task-01.md` (§1 line 15, §2 line 17, acceptance line 26), `phase-1-task-02.md` (§1 line 11, §3 lines 13–17), `spec/test-scope/current.json` (specVersion 1.18.0, scopeVersion 22), `spec/CHANGELOG.md:30`, round 1 report.

## Verdict: PASS (0 ❌, 0 HIGH conflict, 0 ⚠️)

## Re-check matrix

| # | Round-1 finding | Fix location | Status | Note |
|---|---|---|---|---|
| W1 | Lead chips dropped the manual "Sale phụ trách" filter | SPECIFICATIONS.md FR-ADM-19 "Chip lọc nhanh (BL-022)" parenthetical; change doc D3 (line 49); T02 §1 (line 11) + test "Sale = A rồi bấm Đã chốt vẫn còn Sale = A"; T01 §1 `replaces?: string[]` (line 15) | ✅ | All 3 sources match: chips always replace `status`; only `Mới (chưa giao)` also replaces `assignedTo`; leaving it removes only `assignedTo exists false`. Applying `Mới (chưa giao)` over a manual Sale = A filter drops Sale = A. That is expected because the 2 conditions conflict, and it is consistent with "thay mọi điều kiện cùng trường". |
| W2 | Số PN group was missing `Tất cả` | FR-ADM-19 (`Tất cả · Studio = 0 · …`, "nhóm giá không có chip `Tất cả`"); D4 (line 50); T01 §2 (line 17) | ✅ | Spec, change doc and task now match. |
| W3 | "không đổi … API" vs the F9 export params | FR-ADM-19 constraint: "không thêm endpoint … riêng tham số lọc của endpoint xuất lead mở rộng theo F9 — `search` BL-021, chip trạng thái BL-022"; D7 (line 53); F9 clause adds `status` "nằm trong" + "chưa có sale phụ trách" | ✅ | No longer contradictory. T02 §3 still keeps the whitelist, returns 400 on conflicting params, and leaves other operators locked. |
| R1 | 375px vs BL-024 | FR-ADM-19 "không tràn trang ở 375px" for the chip bar; T01 acceptance line 26 "do thanh chip"; T02 §1 "chỉ tràn do thanh chip (tràn sẵn có … thuộc BL-024)" | ✅ | Scope is consistent. |
| R5 | Spec Publisher artifacts were missing | `spec/test-scope/current.json` specVersion 1.18.0 / scopeVersion 22; CHANGELOG 1.18.0 entry; `spec/updates/2026-10-20-admin-list-quick-filter-chips.md` | ✅ | Now on disk. |

## New conflicts
None found. The F9 export clause, the FR-ADM-19 chip definitions, D5 operators and the T02 export mapping (`status in`, `assignedTo exists false`) all match.

## Residual notes (not counted)
- N1: T02 Acceptance has no explicit 375px checkbox. The scope is stated in §1 and the shared component is covered by T01 acceptance, so the reviewer should check both.
- N2: Round-1 items R2 (sale always sees 0 rows on `Mới (chưa giao)`), R3 (manual `in`/`exists` filters also become exportable, update `UNSUPPORTED_FILTER_MESSAGE`) and R4 (API_SPEC drift `beforeList` vs `beforeListTable`) still apply at T02 close-out and doc reconcile. API_SPEC lines 193 and 202 both need updating.
- N3: I only checked the CHANGELOG entry and the updates file for existence and version, not their full wording.

## Gap list
None. Ready to proceed to the phase/task loop (T01 → T02).
