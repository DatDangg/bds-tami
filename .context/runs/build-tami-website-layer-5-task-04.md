# Run Journal — build/tami-website · layer-5-task-04

```yaml
workItem: build/tami-website
phaseTask: layer-5-task-04
step: closeout
agent: primary
status: done
attempt: 3
interrupted: false
updatedAt: 2026-10-18T00:15:00.000Z
filesTouched: ["context/progress.json","docs/ERD.md","docs/PERMISSION.md","migrations/index.ts","seed/index.ts","spec/changes/BACKLOG.md","src/lib/content/public-queries.ts","src/payload-types.ts","src/payload.config.ts","tasks/tami-website/layer-5-task-04.md","tasks/tami-website/layer-6-task-08.md","tasks/tami-website/layer-6-task-09.md","tasks/tami-website/layer-9-task-06.md"]
filesNew: [".context/review-reports/build-tami-website-layer-5-task-04-round-1-review.md",".context/review-reports/build-tami-website-layer-5-task-04-round-2-review.md",".context/review-reports/build-tami-website-layer-5-task-04-round-3-review.md",".context/runs/build-tami-website-layer-5-task-04.md","migrations/20261017_130625_job_postings.json","migrations/20261017_130625_job_postings.ts","migrations/20261017_132020_job_applications_cv_nullable.json","migrations/20261017_132020_job_applications_cv_nullable.ts","seed/sample/job-postings.ts","src/collections/JobApplications.ts","src/collections/JobPostings.ts","src/hooks/job-applications/delete-cv-and-audit.ts","src/hooks/job-postings/guard-delete.ts","tests/fixtures/job-postings/payload-config.ts","tests/integration/job-postings.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-5-task-04-round-3-review.md
  round: 3
  verdict: PASS
next: "Task done + committed. Layer 5 đủ 8/8 → spec-validator bổ sung T01/T04 rồi sang layer 6."
loopSignal: none
approvals: [{gate: start_task, at: 2026-10-17T20:40:00.000Z, ok: true, note: "User: làm L2-T02 rồi L5-T01, L5-T04, layer 6"}]
batchQueue: []
```

## History

- 2026-10-17T22:55:00.000Z ▶ START builder (cancel sẽ redo bước này). HEAD 9ababea, working tree sạch.
- 2026-10-17T23:10:00.000Z ✅ DONE builder attempt 1 — JobPostings (ERD §4.10, salaryMax≥Min, deadline index) + JobApplications (admin-only, create denyAll API, trường ứng viên read-only, ipHash read deny), guard xoá cứng 409, migration 20261017_130625_job_postings (additive + job_postings_list_idx), seed mẫu draft. test 104 file 1.099 PASS, build OK. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T23:20:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: M1 xoá job-application để lại CV (private-files + S3) vĩnh viễn (BR-31, LGL-03). MINOR m1 cv_id NOT NULL + SET NULL; m2 test thiếu jobPosting/cv/consentAt read-only; m3 ghi evidence Local API; m4 audit tuỳ chọn. Quyết định builder 1–6 chấp nhận. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-17T23:45:00.000Z ✅ DONE builder fix attempt 2 — afterDelete xoá CV (private-files, cùng transaction) + audit content.purge không PII; cv bắt buộc tới khi anonymizedAt; test admin không đổi jobPosting/cv/consentAt/anonymizedAt; ERD §4.10/§5 + PERMISSION §3.3. migrate:down batch 15 lỗi (down Payload sinh: DROP CONSTRAINT sau CASCADE) → primary chọn thêm migration 20261017_132020_job_applications_cv_nullable (chỉ DROP NOT NULL), 16/16 applied, cv_id nullable. 8 migration có down cùng lỗi (7 đã commit) → follow-up. test 1.101 PASS, build OK. ▶ START reviewer round 2 (cancel sẽ redo bước này).
- 2026-10-17T23:55:00.000Z ✅ DONE reviewer round 2 STRICT — PASS. MINOR m5 bulk delete không rollback (S3 mồ côi), m6 thứ tự hook, m7 comment migration, m8 thiếu test nhánh lỗi. 8 migration down lỗi: không chặn task; đề xuất sửa riêng down (cần user duyệt ngoại lệ) hoặc ghi runbook fix-forward. ▶ START builder fix attempt 3 (cancel sẽ redo bước này).
- 2026-10-18T00:05:00.000Z ✅ DONE builder fix attempt 3 — disableBulkDelete, hook [audit, deleteCv], comment migration, test CV lỗi → rollback (row + audit còn/không). test 1.102 PASS, build OK. ▶ START reviewer round 3 (cancel sẽ redo bước này).
- 2026-10-18T00:15:00.000Z ✅ DONE reviewer round 3 — PASS. Follow-up → L9-T06, L6-T08, L6-T09; BACKLOG BL-003 (down migration). Close-out → commit.
