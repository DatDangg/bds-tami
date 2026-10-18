# Run Journal — build/tami-website · layer-9-task-06

```yaml
workItem: build/tami-website
phaseTask: layer-9-task-06
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-18T22:35:00Z
worktree: none (checkout chính, sau L9-T04 c0f20ce)
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-9-task-06.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-9-task-06-round-2-review.md
  round: 2
  verdict: PASS
next: "L9-T06 done → squash T05, mở T07."
loopSignal: none
approvals: [{gate: retention_scope, at: 2026-10-18T21:25:00Z, ok: true, note: "Q1 chỉ CV khoá upload; Q2 xoá ghi chú + dấu vết; Q3 bất kể trạng thái; Q4/Q5 đồng ý, down không xoá audit"}, {gate: parallel_layer9, at: 2026-10-18T16:25:00Z, ok: true, note: "User duyệt chạy L9 song song"}]
batchQueue: []
```

## History

- 2026-10-18T20:20:00Z ▶ START builder L9-T06 (cancel sẽ redo bước này). Migration duy nhất mới đang làm (T07 chờ sau).
- 2026-10-18T21:05:00Z ✅ DONE builder L9-T06 — job data-retention (CN 03:00 VN, dryRun), ẩn danh lead 24 tháng (lastActivityAt||createdAt, không xoá cứng), hồ sơ 12 tháng (DB trước, file sau, mỗi hồ sơ 1 transaction), CV mồ côi >24h, audit >24 tháng, job lỗi >7 ngày; advisory lock 726003 + remind-unassigned-leads khoá 726002 đọc lại trong transaction; audit system.data_retention chỉ số lượng; migration 20261018_130000_data_retention (enum jobs + enum audit action; down xoá row của chính nó) test up→down→down→up; chưa áp dev. lint/typecheck/test 202 file 2.136/build PASS. ▶ START reviewer STRICT round 1 (cancel sẽ redo bước này).
- 2026-10-18T21:20:00Z ✅ DONE reviewer STRICT round 1 — FAIL: C1 purge-orphan-cvs xoá cả file nội bộ admin upload vào private-files (create: isAdmin); M1 plugin-cloud-storage afterDelete nuốt lỗi S3 → DB xoá, file PII còn trong bucket, không tìm lại được; M2 advisory lock 726002 trùng create-slug-redirect.ts:21. MINOR: đếm thiếu khi lỗi giữa chừng, bản ghi lỗi chặn lô, down xoá audit, hàm dài, task file. Hỏi user Q1–Q5.
- 2026-10-18T21:25:00Z User quyết Q1–Q5. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T22:15:00Z ✅ DONE builder fix attempt 2 — private-files create/update denyAll (Q1); deletePrivateFile tự DeleteObject + throw trước khi xoá DB (M1); ADVISORY_LOCK_KEYS registry 726001–726004 (M2); ẩn danh lead thêm ipHash/userAgent/pageUrl NULL, referrer còn origin, note/call content placeholder, mỗi lead 1 transaction chọn lại sau khoá (Q2); down không xoá audit, giữ enum audit (Q5); RetentionTally; bỏ qua bản ghi lỗi tối đa 20/bước; tách remindDueLeads. lint/typecheck/test 203 file 2.143/build PASS. Builder báo ngoài scope: delete-cv-and-audit.ts cùng giả định plugin nuốt lỗi S3. ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-18T22:35:00Z ✅ DONE reviewer STRICT round 2 — PASS. Primary: sửa regex .pdf (MINOR-1), migrate dev, BL-008 (delete-cv-and-audit cùng lỗi S3), MINOR 2–4 → follow-up task. Commit.
