# Run Journal — change/backlog-2026-10-20 · BL-029 + BL-030 (tuần tự)

```yaml
workItem: change/backlog-2026-10-20
phaseTask: BL-031
step: change-request
agent: change-request
status: awaiting
attempt: 0
interrupted: false
updatedAt: 2026-10-20T00:00:00Z
evidence: {BL-029: {commit: 687a080, report: .context/review-reports/bug-detail-subnav-clear-active-past-sections-phase-1-task-01-round-1-review.md, spec: 1.24.1, scope: 31}}
next: "backlog trống; chờ user (push / kiểm mắt)"
loopSignal: none
approvals: [{gate: batch_plan, at: 2026-10-20, ok: true, note: "user: 'xóa bl31 đi, làm 29 30 đi'"}]
```

## Notes
- Dirty sẵn của user, KHÔNG đụng/commit: next.config.ts, src/components/projects/{FloorPlans,NearbyTabs,ProjectCard,ProjectFilters,ProjectHero,ProjectListPage}.tsx + 4 test, src/payload-types.ts, .claude/launch.json, template-feedback.md, các .context/runs/* untracked cũ.
- BL-031 user xoá (2026-10-20), không xử lý.

## History
- 2026-10-20 ▶ START change-request BL-029 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-029: 687a080, NORMAL PASS r1, 1.24.1 / v31.
- 2026-10-20 ▶ START change-request BL-030 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-030: 5e049ba, STRICT PASS r1, 1.25.0 / v32.
- 2026-10-20 ▶ START change-request BL-031 (user: "làm bl31 đi") — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-031: 97bb1dc, NORMAL PASS r1 + FAST PASS r2, 1.26.0 / v33.
