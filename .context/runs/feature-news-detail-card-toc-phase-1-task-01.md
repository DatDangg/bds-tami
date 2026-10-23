# Run Journal — feature/news-detail-card-toc · phase-1-task-01

```yaml
workItem: feature/news-detail-card-toc
phaseTask: phase-1-task-01
step: done
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-20T15:00:00+07:00
filesTouched: [src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx, src/components/detail/DetailLayout.tsx, src/components/detail/DetailLayout.test.tsx, src/components/content/RichText.tsx, src/components/content/RichText.test.tsx, src/lib/content/section-headings.ts, src/lib/content/section-headings.test.ts, src/i18n/messages/vi.json, src/i18n/messages/en.json, SPECIFICATIONS.md, .context/design-spec.md, spec/changes/BACKLOG.md]
filesNew: [src/components/news/NewsToc.tsx, src/components/news/NewsToc.test.tsx, .context/review-reports/feature-news-detail-card-toc-spec-validation.md, tasks/feature-news-detail-card-toc/phase-1-task-01.md, spec/changes/2026-10-20-news-detail-card-toc.md]
userDirtyUntouchable: [next.config.ts, src/components/projects/*, src/payload-types.ts, .claude/launch.json, template-feedback.md]
evidence:
  reportPath: .context/review-reports/feature-news-detail-card-toc-phase-1-task-01-round-2-review.md
  round: 2
  verdict: PASS
next: "none — BL-033 done (commit close-out, chưa push)"
loopSignal: none
approvals: [{gate: phase_plan, at: 2026-10-20, ok: "auto proceed (user: tự quyết đừng hỏi)"}]
```

## History
- 2026-10-20 journal created; spec delta written (SPECIFICATIONS F5, design-spec S11 + bảng header); BACKLOG BL-033 in_progress; ▶ START builder + spec-validator (song song)
- 2026-10-20 ✅ DONE spec-validator PASS (2 LOW: N1 sửa S11 dòng Responsive; N2 → residual) report .context/review-reports/feature-news-detail-card-toc-spec-validation.md
- 2026-10-20 ✅ DONE builder (3114 test PASS, typecheck PASS, lint 0 error); ▶ START reviewer r1 + spec-publisher (song song)
- 2026-10-20 ✅ DONE reviewer r1 NORMAL PASS (3 MINOR); ✅ DONE spec-publisher 1.28.0 / scope v35; change-request sửa MINOR-1/2/3 (reserved ids main/floating-contact-actions/cta-scrim, timer ref + clear unmount, overflow-wrap link); 216 test liên quan PASS, typecheck PASS, lint 0 error; ▶ START reviewer r2 FAST (cancel sẽ redo bước này)
- 2026-10-20 ✅ DONE reviewer r2 FAST PASS (bỏ cta-scrim khỏi reserved ids theo ghi chú); close-out: task, progress.json, BACKLOG BL-033 done, change doc archived; commit
