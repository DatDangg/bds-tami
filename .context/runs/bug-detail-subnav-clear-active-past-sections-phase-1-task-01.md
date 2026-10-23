# Run Journal — bug/detail-subnav-clear-active-past-sections · BL-029

```yaml
workItem: bug/detail-subnav-clear-active-past-sections
phaseTask: phase-1-task-01
step: close-out committed
agent: change-request
status: running
attempt: 1
interrupted: false
updatedAt: 2026-10-20T00:00:00Z
filesTouched: [user-dirty sẵn — next.config.ts, src/components/projects/*, src/payload-types.ts, spec/changes/BACKLOG.md; KHÔNG commit]
filesNew: [tasks/bug-detail-subnav-clear-active-past-sections/phase-1-task-01.md]
evidence: {task: tasks/bug-detail-subnav-clear-active-past-sections/phase-1-task-01.md, reportPath: .context/review-reports/bug-detail-subnav-clear-active-past-sections-phase-1-task-01-round-1-review.md, verdict: PASS-NORMAL}
next: "xong — chờ user push"
loopSignal: none
approvals: [{gate: phase_plan, at: 2026-10-20, ok: true, note: "user: làm 29 30 đi — auto proceed"}]
```

## History
- 2026-10-20 ▶ START [agent: builder] phase-1-task-01 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE [agent: builder] fix + DetailSubNav.test.tsx 6 case; repro (c) FAIL→PASS; vitest 13 file/162 PASS, typecheck PASS, lint 0 error. filesNew += src/components/detail/DetailSubNav.test.tsx.
- 2026-10-20 ▶ START [agent: reviewer] round 1 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE [agent: reviewer] NORMAL PASS r1 (3 MINOR, không chặn).
- 2026-10-20 ▶ START [agent: spec-publisher] — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE [agent: spec-publisher] 1.24.1 / scope v31. Close-out: progress.json, BACKLOG BL-029 done, change doc archive.
- 2026-10-20 ✅ DONE [agent: change-request] commit 687a080 trên staging. Không push.
