# Run Journal — feature/news-toc-compact · intake

```yaml
workItem: feature/news-toc-compact
phaseTask: intake
step: done
agent: spec-publisher
status: done
attempt: 0
interrupted: false
updatedAt: 2026-10-23T00:00:00+07:00
filesTouched: []
filesNew: []
evidence:
  reportPath: .context/review-reports/feature-news-toc-compact-phase-1-task-01-round-1-review.md
  round: 1
  verdict: PASS
next: "xong"
loopSignal: none
approvals: [{gate: parallel_run, at: 2026-10-23, ok: true}]
batchQueue: []
```

## Notes / WIP reasoning

User 2026-10-23: "bl67 không liên quan thì chạy song song". BL-066 (popup, leads, migration, PublicShell) chạy ở checkout chính; BL-067 (NewsToc, news page) ở worktree. File chung (spec version, CHANGELOG, test-scope, progress.json, BACKLOG) để primary làm tuần tự sau merge.

## History

- 2026-10-23 ▶ START change-request BL-067 (worktree, song song BL-066) — cancel sẽ redo
- 2026-10-23 ✅ DONE change-request BL-067: commit 68aa204 trên worktree-agent-af0abeabf341e2e04, reviewer NORMAL PASS r1; chưa đo visual
- 2026-10-23 cherry-pick 68aa204 → staging (sạch); đo visual: bài thật 5 mục, 1440x900 & 1280x800 sh=ch=333 không cuộn; 10 mục 2 dòng ở 1440x900 sh681>ch527 → TOC tự cuộn (chấp nhận). ▶ START spec-publisher (cancel sẽ redo)
- 2026-10-23 ✅ DONE spec-publisher: 1.55.1 / scope v72, close-out commit 69b697d
