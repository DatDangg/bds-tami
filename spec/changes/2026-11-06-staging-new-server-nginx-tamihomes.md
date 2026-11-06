---
id: staging-new-server-nginx-tamihomes
type: feature
status: pending
created: 2026-11-06
---

# Chuyển staging sang server mới 179.197.242.57 + Nginx + HTTPS `179-197-242-57.sslip.io` (ban đầu dự kiến staging.tamihomes.vn — đổi, xem "Đổi quyết định")

## Yêu cầu
User 2026-11-06: chuyển staging tami từ server cũ (187.52.119.50, `https://187-52-119-50.sslip.io`) sang server mới
`root@179.197.242.57` (SSH alias `server`, key `~/.ssh/id_ed25519_tami`; IP cũ = alias `server-old`).
Đưa ra ngoài bằng **Nginx trên host + HTTPS Let's Encrypt** (KHÔNG dùng Cloudflare Tunnel), tên miền `tamihomes.vn`
(DNS ở Mắt Bão). Đề xuất: staging = `staging.tamihomes.vn`; `tamihomes.vn` + `www` để dành production.

Classification dự kiến: MODIFY (hạ tầng deploy/runbook, không đổi behavior app).

## Hiện trạng server mới (rà 2026-11-06, read-only)
- Ubuntu 26.04.1, kernel 7.0, 2 CPU, RAM 7.7G (trống ~4.6G), **không swap**, đĩa 96G (trống 73G). 31 bản cập nhật chờ, `System restart required`.
- **Server dùng chung**: outfit-changer, airoom, supabase (self-host), ai-rid, babyai, nextlevel-dashboard (`0.0.0.0:9443`). Các dự án khác ra ngoài bằng Cloudflare quick tunnel.
- Docker 29.9.0 + Compose v5.6.0 có sẵn (≥ 28, không dính lỗ publish-loopback).
- **Không có Nginx**, không gì nghe 80/443 → cài mới không đụng ai. Cổng loopback đã dùng: 5432, 6543, 8000, 8080, 9200, 9201, 54330, 2216, 28443, 20241, 20242 — **3010/3011 còn trống**.
- Không có user `deploy`; `/opt` chứa dự án khác (tami đặt riêng thư mục). ufw inactive, fail2ban inactive, root login + password auth bật (việc của người quản lý server — chỉ báo, không tự đổi).
- Timezone UTC, git có; chưa có certbot, pgbackrest/restic (chạy trong container).

## Phải làm
1. **[USER]** Thêm bản ghi DNS ở Mắt Bão: `A staging → 179.197.242.57` (TTL thấp). Domain hiện trống (không A/MX/TXT).
2. **[USER chốt 2026-11-06]** Dữ liệu: **chuyển DB + media (ảnh, CV private) từ staging cũ** sang server mới. Staging cũ **giữ chạy song song** làm dự phòng, chỉ tắt khi user xác nhận (không xoá dữ liệu cũ). User duyệt dùng Nginx, bắt đầu chuyển ("chuyển server thôi, dùng nginx").
   DNS `staging.tamihomes.vn` chưa có lúc bắt đầu → làm trước phần không cần DNS (chuẩn bị server, Nginx HTTP, chuyển dữ liệu, deploy qua tunnel SSH); HTTPS/certbot + smoke qua domain chờ DNS.
3. Server: cài Nginx + certbot; vhost `staging.tamihomes.vn` từ cấu hình `tami-staging-sslip.conf` (KHÔNG basic auth — user Q1 2026-11-06 giữ mở công khai như hiện tại; `X-Robots-Tag noindex`, HSTS, `X-Real-IP $remote_addr` ghi đè, `client_max_body_size` như cũ) → proxy `127.0.0.1:3011`; HTTPS + tự gia hạn.
4. Server: user `deploy` + `authorized_keys` cho key CI; thư mục deploy tami; thư mục backup env (`pgbackrest.env`, `restic.env`, `ssh/`) theo `docs/runbooks/restore.md`; swap 2–4G.
5. Kiểm 80/443 không bị chặn từ phía nhà cung cấp (curl từ ngoài).
6. Repo: cập nhật `NEXT_PUBLIC_SITE_URL` staging + mọi chỗ dính URL (sitemap, robots, link email, Zalo share), `docs/runbooks/deploy.md` (§ staging sslip.io → tamihomes), `docs/ARCHITECTURE.md` §6, `.context/project-config.md` (deploy), `.context/decisions.md` (quyết định Nginx thay Cloudflare cho staging).
7. **[USER xác nhận]** GitHub environment `staging`: `DEPLOY_HOST`=179.197.242.57, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` (ssh-keyscan + đối chiếu fingerprint ED25519 server mới).
8. Deploy staging lên server mới, smoke: trang chính VI/EN 200, `/api/health`, noindex (không basic auth — Q1), rate limit 2 IP ra 2 bucket, upload ảnh/CV.

## Lưu ý / rủi ro
- Nginx chiếm 80/443 cả máy → báo người quản lý server; dự án khác muốn web sau này phải đi qua Nginx này.
- Không swap + server chung → OOM khi dự án khác tăng tải; stack tami mem_limit tổng ~2G.
- Production `tami.genieplatform.cloud` (đang trỏ server cũ) — ngoài scope, quyết riêng.
- Liên quan: BL-105 (Zalo share, có ghi chú domain sslip.io); BL-095/BL-106 (chờ SMTP — có domain thật thì có thể làm email `@tamihomes.vn`, ngoài scope).

## Acceptance
- [ ] `https://179-197-242-57.sslip.io` HTTPS hợp lệ, công khai (không basic auth — Q1), noindex, trỏ server mới
- [ ] CI deploy staging chạy vào server mới, health check PASS
- [ ] Rate limit lấy đúng IP thật qua Nginx
- [ ] Runbook/ARCHITECTURE/project-config cập nhật; không còn tham chiếu sslip.io cho staging

## Quyết định khi duyệt plan (user 2026-11-06)
- Q1: KHÔNG basic auth (mở công khai + noindex như staging hiện tại).
- Q2: phương án A — job `record-staging-pass` ghi `staging.history` trên server production (giữ cổng production khi 2 server tách).
- Q3: được dừng seaweedfs staging cũ 1–2 phút để tar volume.
- Q4: builder sinh key CI ed25519 trên máy dev (`~/.ssh/tami_ci_deploy`, ngoài repo); user tự dán private key vào GitHub secret.
- Mục 4 "thư mục backup env": không áp dụng cho staging (staging không backup — runbook §9.5).
- Phase plan: `tasks/feature-staging-new-server-nginx-tamihomes/` (P1.01, P1.02, P2.01–P2.03, P3.01–P3.02).

## Đổi quyết định (user 2026-11-06, sau P2.03)
- **Staging KHÔNG dùng subdomain** `staging.tamihomes.vn`. Staging dùng IP: `https://179-197-242-57.sslip.io` (giống mô hình staging cũ `187-52-119-50.sslip.io`; sslip.io cho hostname để Let's Encrypt cấp cert — cert cho IP trần không dùng).
- `tamihomes.vn` (+ `www`) dành cho **production**, chuyển production sang server mới = **BL-112** (change doc riêng).
- Hệ quả BL-111: đổi vhost/server_name, `NEXT_PUBLIC_SITE_URL` trong `/opt/tami/staging.env`, docs (runbook §11, ARCHITECTURE §6, project-config, Decision 12) từ `staging.tamihomes.vn` → `179-197-242-57.sslip.io`; P3.01 không còn chờ DNS Mắt Bão. Turnstile: thêm hostname `179-197-242-57.sslip.io` vào site key staging (U2 đổi giá trị).
- Let's Encrypt: user đồng ý ToS, không email; gia hạn bằng certbot.timer + deploy hook reload nginx.
