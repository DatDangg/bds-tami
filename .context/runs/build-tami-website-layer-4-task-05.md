# Run Journal — build/tami-website · layer-4-task-05

```yaml
workItem: build/tami-website
phaseTask: layer-4-task-05
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T10:15:00.000Z
filesTouched: [".context/progress.json",".context/decisions.md","docs/ARCHITECTURE.md","tasks/tami-website/layer-4-task-05.md"]
filesNew: [".context/runs/build-tami-website-layer-4-task-05.md",".github/workflows/deploy.yml",".github/actions/ssh-deploy/action.yml","scripts/deploy/deploy.sh","scripts/deploy/deploy.test.sh","docs/runbooks/deploy.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-4-task-05-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Task kế: layer-4-task-06 (stack giám sát)."
loopSignal: none
approvals: [{gate: cd_runner_registry, at: 2026-10-17T09:00:00.000Z, ok: true, choice: "github-hosted + GHCR + SSH"}, {gate: start_task, at: 2026-10-17T09:00:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T09:00:00.000Z User chốt CD: GitHub-hosted + GHCR + SSH. ▶ START builder (cancel sẽ redo bước này). HEAD 0e4f3f7, working tree sạch.
- 2026-10-17T09:20:00.000Z ✅ DONE builder attempt 1 — deploy.yml (workflow_run CI staging, build→GHCR digest, deploy-staging, production environment cùng digest), composite ssh-deploy (known_hosts strict), deploy.sh (flock, migrate trước up, health+rollback, HIGH_RISK gate fail-closed, prune theo repo, --dry-run), deploy.test.sh 19/19, runbook, decisions Decision 4, ARCH §6.4. actionlint 1.7.7 + shellcheck PASS (Docker), test 827 PASS, build OK. Không deploy thật. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T09:35:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 upload compose vào /opt/tami/repo dùng chung trước flock → race staging/prod; MAJOR-2 compose up app jobs ngoài if → set -e thoát không rollback. MINOR-1 pin SHA; 2 digest cũ hơn current; 3 container tạm; 4 jobs_running 1 lần; 5 pull trước kiểm history; 6 file 356 dòng. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T09:55:00.000Z ✅ DONE builder fix attempt 2 — release dir bất biến /opt/tami/releases/<env>/<sha> + symlink current trong flock, staging.history digest+sha; switch trong if + rollback exit 1/3; pin SHA 4 action (git ls-remote); --allow-older; cleanup container tạm; jobs ổn định 3 lần; history trước pull; lib/*.sh (deploy.sh 284 dòng). actionlint+shellcheck PASS, deploy.test.sh 51/51 (Linux), pnpm test 827 PASS (lần 1 jobs-email timeout flaky), build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T10:15:00.000Z ✅ DONE reviewer round 2 STRICT — PASS. Primary git ls-remote xác nhận 4 SHA khớp tag. MINOR-1/2/4 → AC L6-T01. Close-out → commit.
