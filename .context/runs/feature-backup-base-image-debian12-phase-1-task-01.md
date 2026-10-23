# Run Journal — feature/backup-base-image-debian12 · phase-1-task-01

```yaml
workItem: feature/backup-base-image-debian12
phaseTask: phase-1-task-01
step: done
agent: reviewer
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-19
filesTouched: [SPECIFICATIONS.md, spec/changes/BACKLOG.md, spec/CHANGELOG.md, spec/test-scope/current.json, docker/backup/Dockerfile, docker/backup/pgbackrest-env.example, docker/backup/test/docker-compose.e2e.yml, docker/backup/test/e2e.sh, docker/docker-compose.dev.yml, docker/docker-compose.prod.yml, docker/docker-compose.staging.yml, docs/ARCHITECTURE.md, docs/runbooks/deploy.md, docs/runbooks/restore.md, scripts/deploy/deploy.sh, scripts/deploy/deploy.test.sh]
filesNew: [.context/review-reports/feature-backup-base-image-debian12-phase-1-task-01-round-1-review.md, tasks/feature-backup-base-image-debian12/phase-1-task-01.md, docker/backup/postgis/10_postgis.sh, docker/backup/postgis/update-postgis.sh, docs/runbooks/postgres-base-image.md, spec/updates/2026-10-19-backup-base-image-debian12.md]
evidence: {reportPath: .context/review-reports/feature-backup-base-image-debian12-phase-1-task-01-round-3-review.md, round: 3, verdict: PASS}
next: "done (2cfe320); change BL-002 archived; BL-014 pending (CI image)"
loopSignal: none
```

## Notes
- postgis/postgis không có tag bookworm cho 17-3.5; 17-3.6 = trixie. Chọn tự dựng FROM postgres:17.11-bookworm + PostGIS 3.5.2 từ apt-archive bookworm-pgdg-archive.

## History
- 2026-10-19 journal created; spec delta SPECIFICATIONS.md §Hạ tầng; BACKLOG BL-002 in_progress; task file tạo.
- spec-publisher DONE: spec 1.9.0 → 1.10.0, scope v10 (spec/updates/2026-10-19-backup-base-image-debian12.md, CHANGELOG, test-scope/current.json).
- builder attempt 1 START (status running — cancel sẽ redo bước này).
- builder attempt 1 DONE: build 3 target PASS (bookworm/glibc 2.36/PG 17.11/PostGIS 3.5.2/pgbackrest 2.59.1); e2e.sh s3+sftp E2E PASS (switch 2.31→2.36, mismatch 1→0, amcheck 73 index sạch); deploy.test.sh PASS; dọn tami-bk-e2e sạch, dev không đụng.
- reviewer round 1 START (running — cancel sẽ redo bước này).
- reviewer round 1 STRICT FAIL: MAJOR-1 10_postgis.sh executable → volume mới thiếu template_postgis/extension; MAJOR-2 runbook $C trỏ release cũ + thiếu TAMI_IMAGE; 6 MINOR (MINOR-1 test-scope do change-request sửa ở close-out; MINOR-6 CI → residual).
- builder fix attempt 2 START (running — cancel sẽ redo bước này).
- builder fix attempt 2 DONE: chmod initdb (COPY --chmod) + fresh_volume_init_test; runbook $R release mới + TAMI_IMAGE + deploy.sh lại; guard volume-không-container + PG_IMAGE_SWITCH_CONFIRMED; amcheck mọi DB; pg_dumpall globals; e2e r2 PASS (E2E_WAIT_ARCHIVE_TIMEOUT=0); deploy.test PASS. change-request sửa MINOR-1 (test-scope files + spec/updates).
- reviewer round 2 START (running — cancel sẽ redo bước này).
- reviewer round 2 STRICT FAIL: MAJOR-1/MINOR-2..5 closed; MAJOR-A runbook production path prod.env/docker-compose.prod.yml sai ($ENV.env); MINOR-B test-scope guard text; MINOR-C chấp nhận.
- Quyết định tự chọn: vượt max 2 vòng review — MAJOR-A là sửa doc 3 dòng, hội tụ (không phải loop/kiến trúc) → change-request sửa doc trực tiếp (ENVF/CF) + restore.md export TAMI_IMAGE + test-scope MINOR-B; reviewer round 3 hẹp. Không tăng attempt builder.
- reviewer round 3 START (running — cancel sẽ redo bước này).
- reviewer round 3 STRICT PASS. Close-out: MINOR-D restore.md prod.env; BACKLOG BL-002 done + BL-014 mới; change doc archived; progress.json; commit 2cfe320.
