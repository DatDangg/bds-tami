# Run Journal — feature/admin-list-quick-filter-chips · phase-1

```yaml
workItem: feature/admin-list-quick-filter-chips
phaseTask: phase-1-task-02
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-20T16:00:00+07:00
filesTouched: [SPECIFICATIONS.md, spec/changes/BACKLOG.md, spec/changes/2026-10-19-admin-list-quick-filter-chips.md]
filesNew: [tasks/feature-admin-list-quick-filter-chips/phase-1-task-01.md, tasks/feature-admin-list-quick-filter-chips/phase-1-task-02.md]
evidence: {reportPath: .context/review-reports/feature-admin-list-quick-filter-chips-spec-validation-round-2.md, round: 2, verdict: PASS}
next: none — BL-022 done
loopSignal: none
approvals: [{gate: phase_plan, at: 2026-10-20, ok: "user ủy quyền auto proceed"}]
batchQueue: [phase-1-task-01, phase-1-task-02]
```

## History
- 2026-10-20 journal created; spec delta 1.18.0 (FR-ADM-19 chip + F9 xuất theo chip). cancel sẽ redo bước này.
- 2026-10-20 spec-validation r1 FAIL (W1-W3) -> fixed -> r2 PASS; spec-publisher 1.18.0 / scope v22 (risk high).
- 2026-10-20 START builder T01 (running, cancel sẽ redo bước này).
- 2026-10-20 DONE builder T01 (test 2905 PASS, lint/typecheck PASS; files quick-filters.ts, QuickFilterChips.tsx, RentalQuickFilterSlot.tsx, Rentals.ts, _lists.scss, admin-ui.ts, importMap.js).
- 2026-10-20 START reviewer T01 r1 (running, cancel sẽ redo bước này).
- 2026-10-20 DONE reviewer T01 STRICT PASS r1; commit 7cb85fd (T01 + spec 1.18.0/scope v22).
- 2026-10-20 START builder T02 (running, cancel sẽ redo bước này).
- 2026-10-20 DONE builder T02 (test/lint/typecheck PASS; params statusIn + unassigned=1; nhãn toán tử theo Payload vi "có trong"/"tồn tại").
- 2026-10-20 START reviewer T02 r1 (running, cancel sẽ redo bước này).
- 2026-10-20 DONE reviewer T02 r1 STRICT PASS (3 minor; .context/review-reports/feature-admin-list-quick-filter-chips-phase-1-task-02-round-1-review.md). Primary sửa MINOR-1 ("tồn tại" = Sai) + MINOR-2 (status in có khoảng trắng → khoá) + test; 279 test vùng PASS, lint/typecheck PASS.
- 2026-10-20 Kiểm trình duyệt (primary, :3000): chip "Mới (chưa giao)" → URL cuối chỉ còn where[or][0][and][0][status][equals]=new (mất assignedTo exists false, chip không sáng). Root cause: WhereBuilder Payload `value = condition[field][op] || undefined` (node_modules/@payloadcms/ui/dist/elements/WhereBuilder/index.js:173) → boolean false thành undefined, Condition debounce ghi lại where. URL tay với exists="false" chuỗi giữ được. → attempt 1 FAIL, START builder fix (running, cancel sẽ redo bước này).
- 2026-10-20 DONE builder T02 attempt 2 (chip Mới ghi exists "false", Studio equals "0"; 2954 test PASS; trình duyệt OK leads/rentals + F5 + 375px).
- 2026-10-20 START reviewer T02 r2 (running, cancel sẽ redo bước này).
- 2026-10-20 DONE reviewer T02 r2 STRICT PASS; phase-1 spec-validation PASS; close-out (progress, BACKLOG done, test-scope v22 diff thật, archive change doc) → commit T02.
