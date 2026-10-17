# Run Journal — build/tami-website · layer-4-task-07

```yaml
workItem: build/tami-website
phaseTask: layer-4-task-07
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T13:00:00.000Z
filesTouched: [".context/progress.json","docker/docker-compose.staging.yml","docker/docker-compose.prod.yml","scripts/deploy/deploy.sh","docs/ARCHITECTURE.md","docs/runbooks/deploy.md",".env.example",".context/decisions.md","tasks/tami-website/layer-4-task-07.md"]
filesNew: [".context/runs/build-tami-website-layer-4-task-07.md","docker/backup/","docs/runbooks/restore.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-4-task-07-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Layer 4 hết task khả dụng (task-06 deferred) → spec-validator layer 4 → ⏸ mốc M1 chờ user duyệt."
loopSignal: none
approvals: [{gate: backup_target, at: 2026-10-17T10:40:00.000Z, ok: true, choice: "generic S3/SFTP via env"}, {gate: start_task, at: 2026-10-17T10:40:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T10:40:00.000Z task-06 deferred (commit 1f80813). User chốt backup đích chung qua env. ▶ START builder (cancel sẽ redo bước này). HEAD 1f80813.
- 2026-10-17T11:40:00.000Z ✅ DONE builder attempt 1 — image postgres tuỳ biến (postgis:17-3.5 + pgbackrest 2.59.1, Debian 11), sidecar backup scheduler (full CN, diff ngày, restic 03:00), restic qua S3 API + /mirror, heartbeat file + textfile metric + Uptime Kuma push tuỳ chọn, đích S3/SFTP qua env. E2E thật PITR 1800/2500 bản ghi, restic sha256 khớp, archive 297s; shellcheck/compose config OK; test 827 PASS, build OK. Decision 5. deploy.sh up thêm backup. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T12:00:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 không archive-push-queue-max → kho chết WAL dồn đầy ổ server dùng chung. MINOR restore.md exec vào backup đã dừng; lệnh dọn tay filter OR gỡ staging; mẫu SFTP ed25519 sai; pin digest base + assert bullseye; e2e thiếu case chuyển image; restic >500 object; apt HTTP. glibc khớp (bullseye 2.31). E2E s3 reviewer chạy lại PASS. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T12:40:00.000Z ✅ DONE builder fix attempt 2 — archive-push-queue-max env 4GiB/8GiB (e2e kho chết: queue 4/14 segment, DB vẫn ghi, full mới OK); restore.md run --rm; dọn tay theo label; mẫu SFTP RSA PEM; ghim digest postgis 01a6a70e… + assert bullseye/glibc 2.31; e2e chuyển image amcheck/REINDEX OK; runbook BACKUP_MAX_DELETE; apt HTTPS. e2e s3+sftp PASS, shellcheck/deploy.test/compose OK, test 827 PASS, build OK. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T13:00:00.000Z ✅ DONE reviewer round 2 STRICT — PASS (e2e s3 reviewer chạy lại PASS). MINOR-A → AC L6-T01, MINOR-B → AC L4-T06. Close-out → commit.
