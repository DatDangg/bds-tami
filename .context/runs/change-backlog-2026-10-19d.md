# Run Journal — change/backlog-2026-10-19d · merge đợt 1 (song song)

```yaml
workItem: change/backlog-2026-10-19d
phaseTask: merge-wave-1
step: close-out committed
agent: spec-publisher
status: awaiting
attempt: 0
interrupted: false
updatedAt: 2026-10-19T00:00:00Z
evidence:
  merged: [BL-019@cdd9ef4, BL-016@325b9e5+e9e9a6b, BL-021-T1..T5@044512c..739b12a]
  reports:
    - .context/review-reports/feature-desktop-header-no-menu-button-phase-1-task-01-round-1-review.md
    - .context/review-reports/feature-select-dropdown-styling-phase-1-task-01-round-2-review.md
    - .context/review-reports/feature-select-dropdown-styling-phase-1-task-02-round-3-review.md
    - .context/review-reports/bug-admin-list-fixes-phase-1-task-0{1..5}-round-*-review.md
next: "đợt 2: BL-020 (phase-plan + checkpoint) ∥ BL-021 T6 — worktree riêng; BL-022/023 chờ user"
loopSignal: none
approvals: [{gate: batch_plan, at: 2026-10-19, ok: true, note: "user: 'cứ chạy hết backlog đi… song song được thì song song'; 'xem merge các thứ gì thì làm đi'"}]
```

## Notes
- Đợt 1 chạy 3 session worktree riêng (branch claude/zen-hertz-3f8ced, claude/lucid-blackwell-af2f94, claude/strange-roentgen-bb9a18), DB tami_wt_*; session con KHÔNG đụng spec_version/CHANGELOG/test-scope/BACKLOG/progress.
- Cherry-pick tuần tự lên staging, không conflict.
- KHÔNG commit `next.config.ts` (allowedDevOrigins của user), `.claude/launch.json`.

## History
- 2026-10-19 cherry-pick 8 commit lên staging (cdd9ef4..739b12a). Verify tổng (lint/typecheck/test) chạy nền.
- 2026-10-19 ▶ START spec-publisher (3 change) — cancel sẽ redo bước này.
- 2026-10-19 verify tổng: lint+typecheck PASS; test lần 1 fail do Docker tắt container (ECONNREFUSED 5433/Redis), bật lại → 263 file / 2747 test PASS.
- 2026-10-19 ✅ DONE spec-publisher: BL-019 1.13.0/v15, BL-016 1.14.0/v16, BL-021 T1–T5 1.15.0/v17 (+ snapshot spec/test-scope/archive/).
- 2026-10-19 BL-021 T6 cherry-pick c69f6e5; verify lint+typecheck PASS, test 261/263 file (2 file timeout beforeAll do tải máy) → chạy lại 2 file 45/45 PASS. spec-publisher: 1.15.1 / scope v18, đóng BL-021.
- 2026-10-19 BL-020 Phase 1 cherry-pick 3c1621d ab3f95a f25afe1; verify lint+typecheck PASS, test 264 file / 2764 PASS; spec-publisher 1.16.0 / scope v19.
- 2026-10-20 BL-020 Phase 2 cherry-pick 4f48764..fb360ab (stash payload-types CRLF-only rồi drop; cherry-pick --quit dọn sequencer dở); migrate DB dev 20261019_144259_homepage_market_blocks; lint+typecheck PASS, test 271/273 (2 file timeout beforeAll) → chạy lại 30/30 PASS; spec-publisher 1.17.0 / scope v20 (risk high).
