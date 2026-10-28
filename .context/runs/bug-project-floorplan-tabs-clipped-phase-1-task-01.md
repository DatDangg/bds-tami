# Run Journal — bug/project-floorplan-tabs-clipped · phase-1-task-01

```yaml
workItem: bug/project-floorplan-tabs-clipped
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-29T00:20:00+07:00
filesTouched: [src/components/listing/ListingTabsScroller.tsx, src/components/projects/FloorPlans.tsx, src/components/projects/project-detail.test.tsx, src/i18n/messages/vi.json, src/i18n/messages/en.json, .context/design-spec.md]
filesNew: [tasks/bug-project-floorplan-tabs-clipped/phase-1-task-01.md]
evidence: {reportPath: .context/review-reports/bug-project-floorplan-tabs-clipped-phase-1-task-01-round-1-review.md, round: 1, verdict: PASS, level: STRICT}
next: "done — commit (see git log)"
loopSignal: none
approvals: [{gate: bug_list, at: 2026-10-28, ok: "user: batch BL-095→BL-099 auto proceed"}]
```

## Notes
Dirty tree ngoài batch (settings/gitignore/package/lock/tools/live-studio/bl054 assets, BL-095 doc + dòng BACKLOG) — không stage.

## History
- 2026-10-28 journal created; root cause từ code + Playwright before (bl096-before-*). START builder (cancel sẽ redo bước này)
- builder DONE attempt 1: ListingTabsScroller +labelNamespace/currentSelector; FloorPlans bọc scroller; i18n previous/next; test BL-096; typecheck/lint/test(4815)/build PASS; Playwright after: nút 44px làn ngoài vùng cuộn 1920/1440/1024/768, bấm sau tới mép giữ focus, End → tab 12 hiện đủ; 390 ô chọn. START reviewer r1 (cancel sẽ redo bước này)
- reviewer r1 STRICT PASS (4 MINOR). change-request sửa MINOR-1 (indent FloorPlans), MINOR-2 (try/finally restore mocks), MINOR-3 (JSDoc scroller); MINOR-4 chấp nhận. Re-verify: vitest projects+listing 189 PASS, typecheck PASS, eslint file đổi PASS. START spec-publisher (cancel sẽ redo bước này)
- spec-publisher DONE: no bump (1.61.0), scope v100 (v99 archive). Close-out: task done, progress done, BACKLOG BL-096 done (chỉ hunk BL-096 qua update-index), change doc archive. Commit.
