# Run Journal — build/tami-website · layer-8-task-01

```yaml
workItem: build/tami-website
phaseTask: layer-8-task-01
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T13:10:00Z
worktree: none (checkout chính)
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-8-task-01.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-8-task-01-round-2-review.md
  round: 2
  verdict: PASS
next: "L8-T01 done → squash T04, mở đợt B (T02 leads dựng migration trên homepage, T05 sitemap)."
loopSignal: none
approvals: [{gate: parallel_layer8, at: 2026-10-18T11:45:00Z, ok: true, note: "User duyệt chạy L8 song song"}]
batchQueue: []
```

## History

- 2026-10-18T12:00:00Z ▶ START builder L8-T01 (đợt A) (cancel sẽ redo bước này).
- 2026-10-18T12:20:00Z ✅ DONE builder L8-T01 — global homepage (slides 1-8, video mp4/webm ≤15MB, ctaBanner, blockOrder, admin-only), services lưu → revalidate homepage (tag + /vi /en), G12 allowlist, seed mẫu; migration 20261018_091949_homepage_global additive (8 bảng, 3 enum, down IF EXISTS, test up→down→up; chưa áp dev). lint/typecheck/test 157 file 1.712/build PASS. ▶ START reviewer STRICT round 1 (cancel sẽ redo bước này).
- 2026-10-18T12:45:00Z ✅ DONE reviewer STRICT round 1 — FAIL: MAJOR-1 Homepage.ts:45-49 validator bỏ qua locale ≠ vi nên bật ctaBanner ở tab EN khi title vi rỗng vẫn lưu được. MINOR-1 image_id NOT NULL + FK set null → xoá media đang dùng = 500; MINOR-2 validator video chạy findByID ở onChange, NotFound không bắt; MINOR-3 thiếu test xoá dịch vụ công khai; MINOR-4 seed không loại xoá mềm. Reviewer đã áp migration homepage lên DB dev. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T13:00:00Z ✅ DONE builder fix attempt 2 — validateCtaTitle async đọc title vi qua findGlobal (KHÔNG truyền req: Local API ghi đè req.locale → lưu en ghi nhầm vi); media beforeDelete chặn 409 khi homepage dùng (migration không đổi); validator video return sớm onChange + find không ném; test xoá dịch vụ công khai; seed loại xoá mềm. lint/typecheck/test 157 file 1.715/build PASS. ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T13:10:00Z ✅ DONE reviewer STRICT round 2 — PASS. Primary: ERD MINOR-B (ctaBanner + chặn xoá media); MINOR-A/C/D → L9-T01. Commit.
