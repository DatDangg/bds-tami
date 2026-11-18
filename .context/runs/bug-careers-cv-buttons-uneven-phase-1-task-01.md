# Run Journal — bug/careers-cv-buttons-uneven · phase-1-task-01

```yaml
workItem: bug/careers-cv-buttons-uneven
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-11-18T02:30:00Z
filesTouched: [src/components/careers/CopyEmailButton.tsx, src/components/careers/CopyEmailButton.test.tsx, SPECIFICATIONS.md, spec/CHANGELOG.md, spec/test-scope/current.json, .context/progress.json, spec/changes/BACKLOG.md, spec/changes/2026-11-17-careers-cv-buttons-uneven.md]
filesNew: [tasks/bug-careers-cv-buttons-uneven/phase-1-task-01.md, spec/updates/2026-11-18-careers-cv-buttons-uneven.md, .context/review-reports/bug-careers-cv-buttons-uneven-phase-1-task-01-round-1-review.md]
evidence:
  reportPath: .context/review-reports/bug-careers-cv-buttons-uneven-phase-1-task-01-round-1-review.md
  round: 1
  verdict: PASS
next: "xong — commit + push staging 2026-11-18 (user test local OK)"
loopSignal: none
approvals:
  - { gate: bug_list_order, at: 2026-11-17, ok: "user: 'Ok, theo thứ tự đó'" }
  - { gate: commit, at: 2026-11-18, ok: "user: 'chưa commit' — không commit/push" }
batchQueue: []
```

## Notes / WIP reasoning

- BL-119/121/122/123 xong, chưa commit (spec 1.64.1 / scope v122). Snapshot `.context/runs/.bl124-baseline-status.txt`.

## History

- 2026-11-18 journal created; ▶ START [agent: change-request] BL-124
- 2026-11-18 root cause: CopyEmailButton onDark không w-full trong cột CtaBanner (nút chính w-full max-w-xs). Task file tạo. ▶ START [agent: builder] phase-1-task-01
- 2026-11-18 ✅ DONE [agent: builder]: CopyEmailButton onDark w-full max-w-xs sm:w-auto; vitest careers+CtaBanner 68 PASS, typecheck PASS, eslint sạch; ảnh skip (không có dev server). ▶ START [agent: reviewer] round 1
- 2026-11-18 ✅ DONE [agent: reviewer] NORMAL PASS r1 (1 MINOR không chặn: max-w-xs lặp lại từ CtaBanner). ▶ START [agent: spec-publisher]
- 2026-11-18 ✅ DONE [agent: spec-publisher] 1.64.2 / scope v123. progress.json (awaiting_commit), BACKLOG, change doc, task file cập nhật. Dừng trước commit theo user.
