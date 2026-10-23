# Run Journal — change/backlog-2026-10-20c · BL-034 → BL-035 (tuần tự)

```yaml
workItem: change/backlog-2026-10-20c
phaseTask: BL-035
step: change-request
agent: change-request
status: awaiting
attempt: 0
interrupted: false
updatedAt: 2026-10-20T00:00:00Z
evidence: {BL-034: {commit: 1df89c3, report: .context/review-reports/feature-news-card-hover-brand-color-phase-1-task-01-round-1-review.md, spec: 1.29.0, scope: 36}, BL-035: {commit: f27bfc4, report: .context/review-reports/feature-back-to-top-button-phase-1-task-01-round-1-review.md, spec: 1.30.0, scope: 37}}
next: "BL-034+035 xong; chờ user (push / kiểm mắt)"
loopSignal: none
approvals: [{gate: batch_plan, at: 2026-10-20, ok: true, note: "user: phạm vi BL-034 = tất cả thẻ; 'Ok, chạy luôn' = auto proceed"}]
```

## Notes
- Dirty sẵn của user, KHÔNG đụng/commit: next.config.ts, src/components/projects/{FloorPlans,NearbyTabs,ProjectCard,ProjectFilters,ProjectHero,ProjectListPage}.tsx + 4 test, src/payload-types.ts, .claude/launch.json, các .context/runs/* untracked cũ.
- BL-034 phải sửa 1 dòng ProjectCard.tsx (đang dirty) → chỉ stage hunk hover.

## History
- 2026-10-20 ▶ START change-request BL-034 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-034: 1df89c3, NORMAL PASS r1, 1.29.0 / v36. Residual: slider kính trên ảnh tối hover ~3.0:1.
- 2026-10-20 ▶ START change-request BL-035 — cancel sẽ redo bước này.
- 2026-10-20 ✅ DONE change-request BL-035: f27bfc4, NORMAL PASS r1, 1.30.0 / v37.
