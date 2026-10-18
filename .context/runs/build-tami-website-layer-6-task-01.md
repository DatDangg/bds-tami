# Run Journal — build/tami-website · layer-6-task-01

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-01
step: phase_b
agent: primary
status: awaiting
attempt: 4
interrupted: false
updatedAt: 2026-10-18T14:40:00.000Z
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-6-task-01.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-01-round-4-review.md
  round: 4
  verdict: PASS
next: "Phần A đã commit. Phần B: chờ user xác nhận từng bước server theo runbook §9.2 (bước 1 đọc-only)."
loopSignal: none
approvals: [{gate: attempt_4, at: 2026-10-18T14:00:00.000Z, ok: true, note: "User: cho attempt 4"}, {gate: staging_mode, at: 2026-10-18T10:40:00.000Z, ok: true, note: "sslip.io + Let's Encrypt + basic auth, không Cloudflare"}]
batchQueue: ["phase-B server steps (mỗi bước cần user xác nhận)"]
```

## History

- 2026-10-18T10:45:00.000Z ▶ START builder phần A (repo) (cancel sẽ redo bước này). HEAD ba64fd3.
- 2026-10-18T11:00:00.000Z Server (chỉ đọc, ssh alias `server` root@187.52.119.50, user cho phép): Ubuntu 24.04, 4 CPU, 15 GB RAM, đĩa trống 118 GB; Docker 29.7, Compose v5.5, nginx 1.24, certbot 2.9. Server DÙNG CHUNG: ismartschool (prod + staging + sysupgrade), nta, nhstar (wordpress), crm-dhp, tmfoods — site nginx: crm-dhp, default, nhstar.genieplatform.cloud, ntasolution.vn, ntavietnam.tech, tmfoods. Cổng 3011 trống. Nhiều DB/Redis/MinIO của dự án khác bind 0.0.0.0 (không thuộc phạm vi). Mọi thay đổi phải cô lập: file site nginx mới, compose project tami-staging riêng, app chỉ 127.0.0.1:3011.
- 2026-10-18T11:20:00.000Z ✅ DONE builder phần A — nginx sslip 80/443 (basic auth, X-Real-IP, nginx -t PASS), TRUST_X_REAL_IP (staging), Dockerfile seed + NEXT_PUBLIC_HOTLINE, CI migrate DB trống + importMap drift + pin SHA, rollback symlink current + test, seed sample services chặn prod, lỗi siteName rõ, runbook §9 (13 bước [XÁC NHẬN]), ARCH §6.3. test 141 file 1.537 PASS, build OK, deploy.test.sh PASS (Debian container). ▶ START reviewer phần A STRICT (cancel sẽ redo bước này).
- 2026-10-18T11:40:00.000Z ✅ DONE reviewer phần A STRICT — FAIL: MAJOR-1 listen 443 ssl http2 bật HTTP/2 cho mọi site khác trên nginx 1.24; MAJOR-2 runbook apt-get install nâng cấp nginx/certbot dùng chung. Primary kiểm nginx -T (chỉ đọc): không site nào có http2 trên 443; [::]:443 ipv6only=on đã có ở 1 site; default_server chỉ ở :80 site default. User: tắt backup staging, không báo động tới M3, tắt AI dịch. ▶ START builder fix attempt 2 (cancel sẽ redo bước này).
- 2026-10-18T12:00:00.000Z ✅ DONE builder fix attempt 2 — bỏ http2/ipv6only/default_server, HSTS 86400, runbook không cài/nâng nginx-certbot, deploy-hook theo cert, staging compose bỏ backup + archive_mode=off (deploy.sh base_services có điều kiện), dịch AI ngân sách 0, parseTrustFlag chung. nginx -t PASS trên nginx:1.24-alpine (kèm vhost ipv6only giả), compose config PASS không BACKUP_ENV_DIR, deploy.test.sh PASS, test 1.538 PASS. ▶ START reviewer phần A round 2 (cancel sẽ redo bước này).
- 2026-10-18T12:15:00.000Z ✅ DONE reviewer phần A round 2 — FAIL: MAJOR-1 bộ e2e backup dựng trên docker-compose.staging.yml (đã bỏ backup) → hỏng. MINOR deploy.sh nuốt lỗi compose config, .env.example TRUST lặp, restore.md còn ghi staging có backup, comment reload/install -d. http2 ở tami.conf prod → backlog chặn trước production. ▶ START builder fix attempt 3 (cancel sẽ redo bước này).
- 2026-10-18T13:00:00.000Z ⚠ Session trước bị ngắt (tắt máy) giữa builder fix attempt 3; đĩa: e2e.sh đã sửa dở. Redo bước fix (không tăng attempt, không revert). ▶ START builder fix attempt 3 redo (cancel sẽ redo bước này).
- 2026-10-18T13:30:00.000Z ✅ DONE builder fix attempt 3 — e2e backup dựng trên prod compose (container tami-bk-e2e-*, secret giả) → E2E PASS (s3); deploy.sh die khi compose config lỗi + dry-run không gọi docker (+3 test); .env.example TRUST staging comment; restore.md staging không backup; reload wording + /var/www/certbot không reset mode. test 1.538 PASS, deploy.test.sh PASS. ▶ START reviewer phần A round 3 (cancel sẽ redo bước này).
- 2026-10-18T13:50:00.000Z ✅ DONE reviewer phần A round 3 — FAIL: MAJOR-1 deploy.sh:268 `compose up -d $(base_services)` — die trong $(...) chỉ thoát subshell → compose config lỗi thì up toàn bộ service prod trước migrate. MINOR restore.md:3-4, .env.example:103 4GiB. Đạt 3 attempt FAIL → dừng hỏi user (AGENTS Retry/Escalation).
- 2026-10-18T14:00:00.000Z User cho phép attempt 4 (vượt ngưỡng 3). ▶ START builder fix attempt 4 (cancel sẽ redo bước này).
- 2026-10-18T14:20:00.000Z ✅ DONE builder fix attempt 4 — deploy.sh gán base_list || die, mảng + chặn rỗng; audit không còn chỗ khác; test mức deploy() (config lỗi → không up, không migrate; đường đúng → đúng danh sách); restore.md drill-pg prod host; .env.example 8GiB. deploy.test.sh PASS (Windows + Debian không SKIP), test 1.538 PASS. ▶ START reviewer phần A round 4 (cancel sẽ redo bước này).
- 2026-10-18T14:40:00.000Z ✅ DONE reviewer phần A round 4 STRICT — PASS (test mới bắt được lỗi cũ trên bản sao). Commit phần A. Task chưa xong (phần B server).
