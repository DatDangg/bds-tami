# Run Journal — feature/single-font-montserrat · phase-1-task-01

```yaml
workItem: feature/single-font-montserrat
phaseTask: phase-1-task-01
step: close-out
agent: change-request
status: done
attempt: 1
interrupted: false
updatedAt: 2026-10-20T14:00:00+07:00
filesTouched: [src/lib/fonts.ts, src/lib/fonts.test.ts, src/components/layout/PublicDocument.tsx, src/app/(frontend)/globals.css, src/components/projects/ProjectHero.tsx, src/components/projects/project-detail.test.tsx, .context/design-spec.md, docs/DESIGN.md, skills/react-nodejs/design-tokens.md, SPECIFICATIONS.md, spec/changes/BACKLOG.md, spec/changes/2026-10-20-single-font-montserrat.md]
filesNew: [tasks/feature-single-font-montserrat/phase-1-task-01.md]
evidence:
  reportPath: .context/review-reports/feature-single-font-montserrat-phase-1-task-01-round-2-review.md
  round: 2
  verdict: PASS (STRICT r2)
next: "none — BL-036 done"
loopSignal: none
approvals: [{gate: font_choice, at: 2026-10-20, ok: "Montserrat"}, {gate: proceed, at: 2026-10-20, ok: "làm đi (auto proceed)"}]
```

## History
- 2026-10-20 classify MODIFY; spec delta SPECIFICATIONS.md 1.30.0 → 1.31.0; task file tạo; BACKLOG BL-036 in_progress
- 2026-10-20 ▶ START builder phase-1-task-01 (cancel sẽ redo bước này)
- 2026-10-20 builder lần 1 (background) bị cắt — interrupted, không tăng attempt; builder chạy lại foreground xong (typecheck PASS, lint 0 error, vitest 1065 PASS phần liên quan)
- 2026-10-20 ▶ START reviewer STRICT r1 (cancel sẽ redo bước này)
- 2026-10-20 ✅ DONE reviewer r1 FAIL: MAJOR design-spec.md:70 thang cỡ cũ; fix doc + MINOR className PublicDocument (typecheck PASS, vitest layout+lib 1158 PASS). Builder background lần 1 hoá ra còn chạy, kết thúc cùng diff (md5 ổn định); xoá journal thừa .builder.md khỏi commit
- 2026-10-20 ▶ START reviewer r2 (cancel sẽ redo bước này)
- 2026-10-20 ✅ DONE reviewer r2 STRICT PASS (vitest src/lib src/components 1919/1919, typecheck, lint 0 error)
- 2026-10-20 ▶ START spec-publisher (cancel sẽ redo bước này)
- 2026-10-20 ✅ DONE spec-publisher 1.31.0 / scope v38; close-out progress.json + BACKLOG done + change doc archive; commit
