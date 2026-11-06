# feature-production-new-server-tamihomes · phase-2-task-02 — Chạy thử: bản sao dữ liệu prod → server mới, CI deploy prod vào server mới, bật 443 (BL-112)

- Phụ thuộc: phase-2-task-01. `[XÁC NHẬN]` từng bước.
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z.
- Mục đích: dựng prod mới hoàn chỉnh **trong khi prod cũ vẫn chạy bình thường** (không khoá ghi). Dữ liệu ở đây là bản thử; bản thật lấy lại ở P3.T01.

## Classification / Risk
- Risk: **HIGH** (đổi secret Environment `production`, cổng "chỉ nhận bản đã qua staging", dữ liệu production). Review: **STRICT**.

## Việc
1. Dump thử prod cũ (chỉ đọc với prod): `pg_dump -Fc` trong `tami-postgres` → pipe sang server mới `/opt/tami/transfer/` (chmod 700, xoá sau P3). SeaweedFS 2 bucket prod: chép theo cách P2.02 BL-111 (đã chứng minh).
2. Server mới: `$C up -d postgres redis seaweedfs seaweedfs-init` (project `tami`, network `tami-net`, KHÔNG đụng `tami-staging`), `pg_restore` vào DB trống, chép object vào 2 bucket.
   **Không** bật `backup` ở bước này (archive WAL chưa có stanza → báo lỗi; bật ở P2.T03). Ghi chú: compose `up postgres` cùng project sẽ không tự bật backup.
3. Đếm đối chiếu (bản thử): số bảng (151), `count(*)` các bảng chính (projects, rentals, posts, media, leads, wards…), số object + tổng byte mỗi bucket.
4. GitHub Environment `production` (agent làm bằng `gh secret set -R DatDangg/bds-tami --env production`, giá trị đọc từ file/stdin, không in):
   `DEPLOY_HOST=179.197.242.57`, `DEPLOY_USER=deploy`, `DEPLOY_SSH_KEY` = `~/.ssh/tami_ci_deploy` (khoá CI đã có trên server mới; cùng user `deploy` nên khoá riêng cho prod không thêm cách ly), `DEPLOY_SSH_KNOWN_HOSTS` = `ssh-keyscan -t ed25519 179.197.242.57` đối chiếu fingerprint `SHA256:5uzqgi5o…` (runbook §11.1).
   Lưu ý: secret cũ (khoá `tami-ci-deploy-prod`) bị ghi đè, không lấy lại được — rollback không cần CI (xem Rollback).
5. Actions → **Deploy production** → SHA `b75ff984…` (có trong `staging.history` server mới; schema = prod cũ `678b3568`, không migration giữa hai commit). Guard postgres qua vì container đã chạy đúng image.
   `staging.history` cùng máy ⇒ cổng giữ nguyên tác dụng (production đọc chính file staging ghi).
6. Bật 443: `tami-prod-tamihomes.conf` → sites-available + symlink, `nginx -t`, reload.

## Verify
- Run Deploy production xanh; `curl -s http://127.0.0.1:3010/api/health` = 200 trên server; `/opt/tami/state/production.current` có digest đúng.
- `curl -sI https://tamihomes.vn/` 200, không `X-Robots-Tag`; `https://www.tamihomes.vn/x` → 301 `https://tamihomes.vn/x`; staging `https://179-197-242-57.sslip.io` vẫn 200 + noindex.
- `docker stats` tổng RAM tami (staging + prod) + `free -h` (swap không tăng liên tục sau 15 phút).
- Prod cũ vẫn 200 tại `tami.genieplatform.cloud`.

## Acceptance
- [ ] prod mới chạy bằng CI, tamihomes.vn HTTPS OK, đếm bản thử khớp, prod cũ không bị ảnh hưởng.

## Rollback
Gỡ symlink 443/80 tamihomes, `$C down` (KHÔNG `-v` nếu muốn giữ dữ liệu thử). Secret: đặt lại `DEPLOY_HOST=187.52.119.50` + known_hosts cũ + **cần thêm khoá `tami_ci_deploy.pub` vào `/home/deploy/.ssh/authorized_keys` server cũ** (chỉ khi thật sự cần deploy lại prod cũ).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
