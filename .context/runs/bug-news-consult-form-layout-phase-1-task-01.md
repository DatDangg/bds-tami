# Run Journal — bug/news-consult-form-layout · phase-1-task-01

```yaml
workItem: bug/news-consult-form-layout
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-29T10:00:00+07:00
filesTouched: [src/components/news/NewsListPage.tsx, src/components/news/NewsListPage.test.tsx, .context/design-spec.md]
filesNew: [tasks/bug-news-consult-form-layout/phase-1-task-01.md]
evidence: {reportPath: .context/review-reports/bug-news-consult-form-layout-phase-1-task-01-round-1-review.md, round: 1, verdict: PASS, level: FAST}
next: "done — commit (see git log)"
loopSignal: none
approvals: [{gate: bug_list, at: 2026-10-28, ok: "user: batch BL-095→BL-100 auto proceed"}]
```

## Notes
Dirty tree ngoài batch (settings/gitignore/package/lock/tools/live-studio/bl054 assets, change doc + dòng BACKLOG BL-095/099/100) — không stage.

## History
- 2026-10-29 journal created; root cause từ code + Playwright before (bl098-before-*). START builder (cancel sẽ redo bước này)
- builder DONE attempt 1: ConsultSection thẻ mx-auto w-full max-w-2xl; test BL-098 FAIL→PASS; typecheck/lint/test(4816) PASS; Playwright after gap 304/304 (1920,1440), 48/48 (768), 390 không đổi. START reviewer r1 (cancel sẽ redo bước này)
- reviewer r1 FAST PASS (1 MINOR chấp nhận: test chỉ kiểm class, centring chứng minh bằng Playwright). START spec-publisher (cancel sẽ redo bước này)
- spec-publisher DONE: no bump (1.61.0), scope v102 (v101 archive). Close-out: task done, progress done, BACKLOG BL-098 done (chỉ hunk BL-098 qua update-index), change doc archive. Commit.
