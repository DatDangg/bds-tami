# Run Journal — build/tami-website · layer-6-task-01

```yaml
workItem: build/tami-website
phaseTask: layer-6-task-01
step: deploy
agent: primary
status: running
attempt: 4
interrupted: false
updatedAt: 2026-10-18T17:15:00.000Z
filesTouched: []
filesNew: [".context/runs/build-tami-website-layer-6-task-01.md"]
evidence:
  reportPath: .context/review-reports/build-tami-website-layer-6-task-01-round-4-review.md
  round: 4
  verdict: PASS
next: "Commit sửa CI + push staging → theo dõi deploy trên server."
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
- 2026-10-18T15:00:00.000Z Phần B (user OK đợt 1): user deploy (nhóm docker), /opt/tami/{state,releases} 750; apache2-utils (--no-upgrade, nginx/certbot không đổi phiên bản); /opt/tami/staging.env 600 (secret nội bộ openssl rand, biến ngoài để trống); site nginx cổng 80 tami-staging-sslip-http.conf → nginx -t PASS (cảnh báo có sẵn của tmfoods) → reload; ACME probe 200, / → 301 https. Site khác vẫn 200. Bước 5 chờ email LE thật (user gửi placeholder).
- 2026-10-18T15:20:00.000Z Bước 5: certbot certonly webroot -d 187-52-119-50.sslip.io (dùng tài khoản LE có sẵn trên host, email user không ghi đè), hạn 2027-01-16, renew_hook nginx -t && reload riêng cho cert. Bước 6/7: site 443 tami-staging-sslip.conf → nginx -t PASS → reload; https staging 401 (basic auth, htpasswd chưa tạo); site khác 200 HTTP/1.1 (dhp-cms DNS trỏ server khác, local 200).
- 2026-10-18T15:40:00.000Z staging.env: chưa có Brevo/Turnstile → Turnstile khoá TEST công khai Cloudflare, SMTP giả smtp.invalid, EMAIL_ALLOWLIST=email user (TẠM, thay trước M3). Sinh cặp key CI /home/deploy/.ssh/tami_ci_deploy (pub vào authorized_keys của deploy). ssh-keyscan host key khớp known_hosts của user. Không có gh CLI → user tự đặt secret GitHub.
- 2026-10-18T16:00:00.000Z User push OK → git push origin staging (64d4372..8604da9). CI 8604da9 FAIL: 7 file integration — (1) tami_test chưa migrate (relation staff/payload_jobs không tồn tại), (2) CI không có SeaweedFS (ECONNREFUSED 8333, health 503, upload 500). Các test này thêm từ layer 2+, chưa từng chạy trên GitHub. Deploy chưa chạy.
- 2026-10-18T16:30:00.000Z ▶ START builder sửa CI (cancel sẽ redo bước này).
- 2026-10-18T17:00:00.000Z ✅ DONE builder sửa CI — ci.yml: migrate tami_test + bước SeaweedFS (docker run 4.48, s3.json dummy, chờ sẵn sàng, tạo bucket public/private); access.test.ts teardown xoá staff bằng SQL (last-admin-guard chặn trên DB trống). Giả lập CI local container riêng: migrate 2 DB, importMap, lint, typecheck, test 141 file 1.538 PASS, build PASS. ▶ START reviewer (cancel sẽ redo bước này).
- 2026-10-18T17:15:00.000Z ✅ DONE reviewer sửa CI — NORMAL PASS (.context/review-reports/build-tami-website-layer-6-task-01-ci-round-1-review.md). Primary thêm guard if(!payload) trong afterAll (MINOR-2), access.test 25/25 + typecheck PASS. MINOR 1,3 → L15-T01. Commit + push.
