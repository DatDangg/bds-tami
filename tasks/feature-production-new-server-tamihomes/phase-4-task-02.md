# feature-production-new-server-tamihomes · phase-4-task-02 — Dừng prod + staging cũ (không xoá), close-out docs/spec/test-scope (BL-112)

- Phụ thuộc: phase-3-task-02 PASS + prod mới ổn ≥ 1 ngày (hoặc user cho dừng sớm). `[XÁC NHẬN]` trước khi dừng container.
- Trạng thái: `done` — plan duyệt 2026-11-06T07:45Z; `[XÁC NHẬN]` dừng server cũ: user 2026-11-09 (prod mới ổn ~3 ngày). Reviewer NORMAL PASS r1; spec-validator phase-4 (xem Evidence).

## Classification / Risk
- Risk: MEDIUM (dừng dịch vụ cũ; không xoá dữ liệu). Review: NORMAL; spec-validator cho phase.

## Việc
1. Server cũ: `docker stop` toàn bộ `tami-*` (prod: app/jobs đã dừng ở P3; nay postgres/redis/seaweedfs/backup) và `tami-staging-*` (staging sslip dự phòng). **Không** `down -v`, không `docker volume rm`, không xoá `/opt/tami`. Đặt `restart: no` hiệu lực bằng `docker update --restart=no` để reboot không bật lại.
   Nginx cũ: giữ vhost 301 `tami.genieplatform.cloud` + cổng 80 ACME; gỡ symlink `tami-staging-sslip.conf` 443 (staging cũ đã dừng) nếu user đồng ý — cert cũ có SAN sslip nên **giữ** site cổng 80 sslip để gia hạn không lỗi.
   Kho R2 cũ (`/tami-prod`, `tami-prod-files`): giữ ≥ 30 ngày rồi user quyết.
2. Docs (as-built): `docs/runbooks/deploy.md` §10 (đánh dấu lịch sử) + §12 hoàn chỉnh; `docs/runbooks/restore.md` (path kho `-s2`, server mới); `docs/ARCHITECTURE.md` §6 (một server cho staging + prod, RAM, domain); `.context/project-config.md` `deploy_platform`; `.context/decisions.md` Decision 13 (prod → server mới + tamihomes.vn; tên miền cũ 301).
3. ★ Spec Publisher: PATCH bump (as-built Deployment), `spec/updates/`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` (production base URL `https://tamihomes.vn`, scopeVersion +1).
4. spec-validator phase; `progress.json`; BACKLOG BL-112 done; archive change doc; commit.

## Verify
- `ssh server-old docker ps | grep tami` rỗng; `docker volume ls | grep tami` còn đủ volume.
- `https://tami.genieplatform.cloud` vẫn 301 sang tamihomes.vn.
- spec-validation PASS; `node scripts/sync-claude.mjs --check` không lệch (nếu đụng agent/command).

## Acceptance
- [x] Runbook/ARCHITECTURE/project-config/decisions cập nhật; prod + staging cũ dừng, dữ liệu còn nguyên.

## Evidence (2026-11-09, change-request)
- Server cũ `server-old` 04:42:55Z → 04:43:22Z: `docker stop -t 30 tami-staging-jobs tami-staging-app tami-backup` + `docker stop -t 60 tami-postgres tami-staging-postgres tami-redis tami-staging-redis tami-seaweedfs tami-staging-seaweedfs` (tami-app/tami-jobs đã dừng từ P3.T01) → mọi container exit 0; `docker update --restart=no` 13 container `tami*` (trước `unless-stopped`).
- Nginx 04:43:35Z: `nginx -t` → `rm sites-enabled/tami-staging-sslip.conf` → `nginx -t` PASS → `systemctl reload nginx`. Giữ `tami-prod-genieplatform-redirect.conf`, `tami-prod-direct-http.conf`, `tami-staging-sslip-http.conf`; file gốc còn ở `sites-available/`.
- Verify: `docker ps | grep tami` rỗng (running-count=0); 9 volume `tami_*`/`tami-staging_*` còn; `/opt/tami` còn (reviewer tự kiểm); `https://tami.genieplatform.cloud/du-an` → 301 `https://tamihomes.vn/du-an`; `https://tamihomes.vn/` 200; `certbot renew --dry-run --cert-name tami.genieplatform.cloud --no-random-sleep-on-renew` PASS. Kho R2 cũ không đụng.
- Hệ quả: `https://187-52-119-50.sslip.io` rơi vào site 443 mặc định của dự án khác (không ai dùng). `sync-claude --check` không lệch (không đụng agent/command).
- Docs: deploy.md §9/§10 (lịch sử), §11, §12 (bỏ NHÁP, §12.1c, §12.2 rollback sau P4.T02); restore.md (as-built kho `-s2`); ARCHITECTURE §6; project-config `deploy_platform`; decisions Decision 13.
- Spec: 1.63.0 → 1.63.1, `spec/updates/2026-11-09-production-new-server-tamihomes.md`, CHANGELOG, test-scope v117 → v118 (`productionBaseUrl` https://tamihomes.vn).
- Backlog Q5: Turnstile prod → BL-118 (`spec/changes/2026-11-09-production-turnstile-real-key.md`); SMTP prod → BL-095 (đã có).
- Review: `.context/review-reports/feature-production-new-server-tamihomes-phase-4-task-02-round-1-review.md` (NORMAL PASS, 4 MINOR đã sửa); spec-validation `.context/review-reports/feature-production-new-server-tamihomes-phase-4-spec-validation.md` (r1 FAIL close-out gaps) → `.context/review-reports/feature-production-new-server-tamihomes-phase-4-spec-validation-round-2.md` (r2 PASS).

## Residual risk
- Kho R2 cũ (`/tami-prod`, `tami-prod-files`) + volume/`/opt/tami` server cũ: chờ user quyết xoá sau 2026-12-06.
- Prod vẫn Turnstile test key (BL-118) + SMTP giả (BL-095). Chưa có lượt user login admin/tải CV thật trên tamihomes.vn (residual P3.T02).
- Staging + prod cùng host 7.7 GB RAM: theo dõi RAM/swap/OOM.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
