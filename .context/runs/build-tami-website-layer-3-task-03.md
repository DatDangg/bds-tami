# Run Journal — build/tami-website · layer-3-task-03

```yaml
workItem: build/tami-website
phaseTask: layer-3-task-03
step: closeout
agent: primary
status: done
attempt: 2
interrupted: false
updatedAt: 2026-10-17T03:45:00.000Z
filesTouched: [".context/progress.json","tasks/tami-website/layer-3-task-03.md","tasks/tami-website/layer-4-task-03.md","tasks/tami-website/layer-6-task-01.md",".env.example","docs/ARCHITECTURE.md","next.config.ts","src/payload.config.ts","package.json","pnpm-lock.yaml","sentry.server.config.ts","src/lib/monitoring/sentry-options.ts","src/lib/monitoring/sentry-options.test.ts"]
filesNew: [".context/runs/build-tami-website-layer-3-task-03.md","docker/Dockerfile","docker/docker-compose.prod.yml","docker/docker-compose.staging.yml","docker/nginx/",".dockerignore","src/lib/payload/prod-migrations.ts","src/lib/payload/prod-migrations.test.ts"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-3-task-03-round-2-review.md
  round: 2
  verdict: PASS
next: "Task done + committed. Layer 3 hết task → spec-validator layer 3."
loopSignal: none
approvals: [{gate: g1_decision, at: 2026-10-17T02:40:00.000Z, ok: true, choice: "a-cache-exception"}, {gate: start_task, at: 2026-10-17T02:40:00.000Z, ok: true}]
batchQueue: []
```

## History

- 2026-10-17T02:40:00.000Z G1 chốt phương án (a) → AC L3-T03/L4-T03/L6-T01 + progress.decisions. ▶ START builder (cancel sẽ redo bước này). HEAD 0e3a8d7; src/payload-types.ts dirty chỉ CRLF.
- 2026-10-17T03:05:00.000Z ✅ DONE builder attempt 1 — Dockerfile (không standalone, ~2.5GB, user node), compose prod/staging (127.0.0.1:3010/3011, service migrate profile tools, jobs 1 bản), nginx CF allow/deny (không realip), G1 location /api/media/file/* giữ header. Ngoài scope: payload.config prodMigrations chỉ khi AUTO_MIGRATE_ON_START, pg → dependencies, sentry.server.config onUnhandledRejectionIntegration qua default (bug L3-T01). verify OK, test 609 PASS, compose staging chạy thật /api/health 200 rồi down -v. ▶ START reviewer round 1 STRICT (cancel sẽ redo bước này).
- 2026-10-17T03:15:00.000Z ✅ DONE reviewer round 1 STRICT — FAIL: MAJOR-1 tami-staging.conf:66-71 ảnh staging Cache-Control public → Cloudflare cache lọt basic auth. 8 MINOR. 3 sửa ngoài scope + lệch thiết kế (bỏ real_ip_header…) được chấp nhận. ▶ START builder fix (cancel sẽ redo bước này).
- 2026-10-17T03:30:00.000Z ✅ DONE builder fix attempt 2 — MAJOR-1 staging media private,no-store (+lặp X-Robots-Tag/header bảo mật), prod giữ immutable; MINOR-2 listen 443 ssl http2 (nginx 1.18 OK); MINOR-3 resolveProdMigrations/pickSentryExports + 5 test; MINOR-4/5 doc/task; MINOR-6 seaweedfs-init chỉ bỏ qua already exists; MINOR-7 rm .next/cache (2.13GB). test 64 file 614 PASS, build OK, compose staging thật /api/health 200, dọn sạch. ▶ START reviewer round 2 STRICT (cancel sẽ redo bước này).
- 2026-10-17T03:45:00.000Z ✅ DONE reviewer round 2 STRICT — PASS: MAJOR-1 đóng (thử nginx thật), MINOR round 1 không regression; verify độc lập 614 PASS, nginx -t 1.18 + 1.31. MINOR-R2-1 → AC layer-6-task-01 (chỉ host prod), R2-2 residual. Close-out → commit.
