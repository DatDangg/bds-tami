# feature-staging-new-server-nginx-tamihomes · phase-2-task-03 — Đổi CI deploy staging sang server mới + deploy + smoke qua tunnel SSH (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: phase-1-task-02 merge `staging` (nếu user chọn phương án A), phase-2-task-01, phase-2-task-02. **Cần user: GitHub secrets (U3).** Không cần DNS.
- Trạng thái: `pending`.

## Classification / Risk
- Type: MODIFY pipeline (đổi đích deploy staging).
- Risk: **HIGH** — từ thời điểm này staging cũ KHÔNG nhận deploy mới (đứng ở `678b3568` hoặc commit cuối trước khi đổi secret); guard postgres lần đầu trên server mới.
- Expected review level: **STRICT**.

## Việc
1. **[USER]** GitHub → Settings → Environments → `staging`: `DEPLOY_HOST=179.197.242.57`, `DEPLOY_USER=deploy`, `DEPLOY_SSH_KEY` (private key ứng với phase-2-task-01 bước 3), `DEPLOY_SSH_KNOWN_HOSTS` = dòng `ssh-keyscan -t ed25519 179.197.242.57`, **đối chiếu fingerprint `SHA256:5uzqgi5o4/BsMUm9/Fy39nXoMNQP/x1MvzYtJKXIs94`** (đọc từ server qua SSH đã tin cậy, 2026-11-06). Environment `production` GIỮ NGUYÊN.
2. Kích hoạt deploy: Re-run workflow `Deploy` của commit `staging` mới nhất (hoặc push commit close-out phase-1). Theo dõi log `deploy.sh`:
   guard postgres phải qua (container `tami-staging-postgres` có sẵn, đúng image) → `payload migrate` (chỉ migration chưa có trong dump, có thể 0) → up app + jobs → health 200.
   Nếu guard chặn "volume có sẵn mà không container" → DỪNG báo (không tự đặt `PG_IMAGE_SWITCH_CONFIRMED`).
3. Smoke qua tunnel (chưa DNS): `ssh -N -L 13011:127.0.0.1:3011 server` → `curl -s http://127.0.0.1:13011/api/health` 200; `/` và `/en` 200 (header `Host: staging.tamihomes.vn`); trang có ảnh từ `/api/media/file/...` tải 200; admin `/admin` đăng nhập bằng tài khoản staging cũ (user tự làm, Claude không nhập mật khẩu) → thấy dữ liệu chuyển sang; tải 1 CV private từ admin.
   Thử qua Nginx cổng 80 không được (chỉ 301) — smoke HTTPS + rate limit để phase-3.
4. Kiểm server chung: `docker stats --no-stream` (tổng tami-staging-* < ~2.2 GB), container dự án khác vẫn up, `free -h` còn ≥ 1.5 GB available.
5. (Nếu phương án A) server cũ: `tail -1 /opt/tami/state/staging.history` có digest + SHA vừa deploy.

## Acceptance
- [ ] Run `Deploy` → job `deploy-staging` xanh trên server mới, health PASS.
- [ ] Dữ liệu (tin, ảnh, CV) hiển thị qua tunnel.
- [ ] Không ảnh hưởng dự án khác; staging cũ vẫn chạy bản cũ.

## Retry / Escalation
Deploy fail → đọc log, root cause trước (không sửa server ngoài quy trình); 3 attempt fail → `architecture_review_needed`.
