# feature-production-new-server-tamihomes · phase-4-task-02 — Dừng prod + staging cũ (không xoá), close-out docs/spec/test-scope (BL-112)

- Phụ thuộc: phase-3-task-02 PASS + prod mới ổn ≥ 1 ngày (hoặc user cho dừng sớm). `[XÁC NHẬN]` trước khi dừng container.
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z.

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
- [ ] Runbook/ARCHITECTURE/project-config/decisions cập nhật; prod + staging cũ dừng, dữ liệu còn nguyên.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
