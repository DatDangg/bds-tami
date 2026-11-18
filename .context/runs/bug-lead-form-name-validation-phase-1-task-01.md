# Run Journal — bug/lead-form-name-validation · phase-1-task-01

```yaml
workItem: bug/lead-form-name-validation
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-11-18T03:30:00Z
filesTouched: [spec/changes/BACKLOG.md, SPECIFICATIONS.md, spec/CHANGELOG.md, spec/test-scope/current.json, .context/progress.json, src/shared/types/api.ts, src/components/leads/LeadForm.tsx, src/components/leads/LeadForm.test.tsx, src/components/careers/ApplyForm.tsx, src/components/careers/ApplyForm.test.tsx, src/endpoints/public/job-application-messages.ts, src/endpoints/public/leads.test.ts, src/endpoints/public/job-applications.test.ts, src/i18n/messages/vi.json, src/i18n/messages/en.json, docs/API_SPEC.md]
filesNew: [spec/updates/2026-11-18-lead-form-name-validation.md, tasks/bug-lead-form-name-validation/phase-1-task-01.md, src/lib/person-name.ts, src/lib/person-name.test.ts, .context/review-reports/bug-lead-form-name-validation-phase-1-task-01-round-1-review.md, .context/review-reports/assets/bl123-p1t01-vi-special-1920.png, .context/review-reports/assets/bl123-p1t01-vi-digits-1920.png, .context/review-reports/assets/bl123-p1t01-en-special-1920.png]
evidence:
  reportPath: .context/review-reports/bug-lead-form-name-validation-phase-1-task-01-round-1-review.md
  round: 1
  verdict: PASS (STRICT, 4 MINOR)
next: "xong — commit + push staging 2026-11-18 (user test local OK)"
loopSignal: none
approvals:
  - { gate: bug_list_order, at: 2026-11-17, ok: "user: 'Ok, theo thứ tự đó'" }
  - { gate: name_rule, at: 2026-11-18, ok: "user: chữ (mọi ngôn ngữ, có dấu) + khoảng trắng + ' - . ; không số, không ký tự đặc biệt khác" }
  - { gate: commit, at: 2026-11-18, ok: "user: 'chưa commit' — không commit/push, để working tree" }
batchQueue: [BL-124]
```

## Notes / WIP reasoning

- BL-121 + BL-122 xong, chưa commit (spec 1.64.0 / scope v121). Snapshot `.context/runs/.bl123-baseline-status.txt`.
- Root cause: `src/shared/types/api.ts:81` (lead) + `:35` (ứng tuyển) chỉ trim/min/max; client `LeadForm.tsx:98`, `ApplyForm.tsx:55` chỉ `length < 2`.

## History

- 2026-11-18 journal created; ▶ START [agent: change-request] BL-123
- 2026-11-18 root cause xác định; task file tạo; BACKLOG BL-123 in_progress
- 2026-11-18 ▶ START [agent: builder] phase-1-task-01 (cancel sẽ redo bước này)
- 2026-11-18 ✅ DONE [agent: builder] — 17 test FAIL trước / 20 file 300 test PASS sau; typecheck + eslint PASS; DOM check dev local OK; chưa có ảnh PNG (tool builder không ghi file ảnh)
- 2026-11-18 ▶ START [agent: reviewer] round 1 (cancel sẽ redo bước này)
- 2026-11-18 ✅ DONE [agent: reviewer] round 1 STRICT PASS (4 MINOR không chặn); report .context/review-reports/bug-lead-form-name-validation-phase-1-task-01-round-1-review.md
- 2026-11-18 change-request: chụp 3 ảnh dev local (Playwright + Edge), 0 POST leads; SPECIFICATIONS FR lead thêm luật họ tên BL-123
- 2026-11-18 ▶ START [agent: spec-publisher] (cancel sẽ redo bước này)
- 2026-11-18 ✅ DONE [agent: spec-publisher] spec 1.64.0 → 1.64.1, scope v121 → v122
- 2026-11-18 close-out: progress.json bugs[] thêm lead-form-name-validation (awaiting_commit); BACKLOG BL-123 "fixed, CHƯA commit"; change doc status in_progress (chưa archive). DỪNG trước commit theo user.
