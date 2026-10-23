# Run Journal — change/homepage-redesign (BL-044)

```yaml
workItem: change/homepage-redesign
phaseTask: BL-044 homepage-redesign · phase-1 (T01 → T02 → T03 tuần tự)
step: done
agent: change-request
status: done             # T00-T04 commits 3a5fffe aa5a178 1271db9 d01f1f7 5e8645b + close-out; phase review r2 PASS; spec 1.34.1 / scope v44; change doc archived; BACKLOG BL-044 done
planOrder: T00 → T01 → T02 → T03 (tuần tự; dừng chỉ khi FAIL 2 vòng / HIGH_RISK_MIGRATION / blocked)
attempt: 0
interrupted: false
updatedAt: 2026-10-20T00:00:00+07:00
classification: MODIFY
specVersion: 1.34.1
scopeVersion: 44
filesTouched: [SPECIFICATIONS.md, spec/CHANGELOG.md, spec/test-scope/current.json, spec/changes/BACKLOG.md (BL-044 in_progress, đã có), .context/progress.json]
filesNew: [spec/updates/2026-10-20-homepage-redesign.md, spec/test-scope/archive/test-scope-1.33.0-41.json, tasks/feature-homepage-redesign/phase-1-task-01.md, tasks/feature-homepage-redesign/phase-1-task-02.md, tasks/feature-homepage-redesign/phase-1-task-03.md, .context/review-reports/spec-validation-feature-homepage-redesign-pre-plan.md]
dirtyNotMine: [.claude/agents/*, .context/project-config.md, next.config.ts, scripts/sync-claude.mjs, src/components/projects/*, src/payload-types.ts, spec/changes/2026-10-20-admin-*.md, template-feedback.md]  # KHÔNG commit
evidence:
  t00: {builder: "DONE 2026-10-20 — migration 20261020_095907_rentals_amenities additive (no HIGH_RISK), seed scripts/seed-rental-amenities.ts, pnpm test 3164 PASS, typecheck/lint PASS, Decision 10 (amenities lạ bị bỏ, không 400); builder journal .context/runs/feature-homepage-redesign-phase-1-task-00.builder.md", reviewer: "r1 STRICT FAIL — M1 endpoint rentals.ts:17-18 chỉ lấy giá trị đầu khoá lặp amenities (doc/trang nhận mảng); m2 trailing ws API_SPEC; m3 ActiveFilters default unreachable; m4 api.ts:129 kiểu unknown; m5 seed không lọc deletedAt", attempt: 1, round: 2, reportPath: ".context/review-reports/feature-homepage-redesign-phase-1-task-00-round-1-review.md"}
  specPublisher: "DONE — 1.34.0 / scope v43 (planned, sau duyệt plan: thêm T00 amenities; archive v42) — close-out publish lại → v44"
  specValidator: {reportPath: .context/review-reports/spec-validation-feature-homepage-redesign-pre-plan.md, round: 1, verdict: "PASS với MINOR (G1–G9; G1–G4, G6–G9 đã vá vào spec/task; G5 → hỏi user)"}
next: "none — chờ user quyết U1-U5 (nếu muốn đổi → change request mới)"
loopSignal: none
approvals:
  - {gate: requirements, at: 2026-10-20, ok: "user chốt 4 câu hỏi hành vi + 'làm đi'"}
  - {gate: plan, at: 2026-10-20, ok: "user 'OK, chạy hết 3 task' — Q1 Tiện ích lọc thật (thêm T00 rentals amenities + seed dev), Q2 footer không cột Liên hệ, Q3 bỏ mũi tên xổ, Q4 eyebrow/caption chung mọi slide"}
openQuestions: []
```
