# Run Journal — build/tami-website · layer-8-task-02

```yaml
workItem: build/tami-website
phaseTask: layer-8-task-02
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T15:25:00Z
worktree: none (checkout chính)
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-8-task-02.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-8-task-02-round-2-review.md
  round: 2
  verdict: PASS
next: "L8-T02 done → squash T03 rồi T05."
loopSignal: none
approvals: [{gate: parallel_layer8, at: 2026-10-18T11:45:00Z, ok: true, note: "User duyệt chạy L8 song song"}]
batchQueue: []
```

## History

- 2026-10-18T13:20:00Z ▶ START builder L8-T02 (đợt B, sau L8-T01 7581ee1 / T04 ce01ba1) (cancel sẽ redo bước này).
- 2026-10-18T14:15:00Z ✅ DONE builder L8-T02 — leads + lead-activities (create denyAll trừ Local API; read/update isAssignedOrAdmin; delete admin; field access sale chỉ status/lostReason; activities bất biến; status_change cùng transaction; firstContactedAt/lastActivityAt; phoneNormalized; G23 ANONYMIZED_PLACEHOLDER), nextval helper chung (rentals dùng lại), LeadAssigneeWarning; migration 20261018_094454_leads additive + sequence + 2 index DESC SQL tuỳ biến, down IF EXISTS, đã áp dev. lint/typecheck/test 164 file 1.785/build PASS. ▶ START reviewer STRICT round 1 (cancel sẽ redo bước này).
- 2026-10-18T14:45:00Z ✅ DONE reviewer STRICT round 1 — FAIL: M1 LeadActivities.ts:27-34 addManualActivity trả false khi không có data → admin UI dò quyền create (không data) ẩn nút thêm note/call cho sale. MINOR m1 leads.locale thiếu index (ERD R,I); m2 blockquote PERMISSION.md cắt bảng; m3 lead đã ẩn danh admin vẫn nhập lại PII; m4 cập nhật lead lồng thừa. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T15:05:00Z ✅ DONE builder fix attempt 2 — create isStaff + hook guardManualActivity (403 type≠note/call hoặc lead không giao), cờ hệ thống asSystemActivity qua req.context, filterOptions type; locale index (sửa tay migration + snapshot, down→migrate trên dev); PERMISSION.md; chặn sửa PII lead ẩn danh (400); bỏ cập nhật lead lồng. lint/typecheck/test 164 file 1.788/build PASS. Test quyền M1 viết sau sửa (chưa chứng minh đỏ trước). ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T15:25:00Z ✅ DONE reviewer STRICT round 2 — PASS. Primary: ERD quy tắc asSystemActivity; MINOR cờ song song + lead không UUID → L9-T02; BL-006 để commit T03. Commit.
