---
id: production-new-server-tamihomes
type: feature
status: done
created: 2026-11-06
completed: 2026-11-09
---

# Chuyển production sang server mới 179.197.242.57 + tên miền tamihomes.vn

## Yêu cầu
User 2026-11-06: "đổi hết sang mới" — production cũng chuyển từ server cũ 187.52.119.50 (`https://tami.genieplatform.cloud`)
sang server mới 179.197.242.57 (SSH alias `server`), dùng tên miền **`tamihomes.vn`** (DNS ở Mắt Bão). Ra ngoài bằng Nginx
host + Let's Encrypt (certbot, không email, user đã đồng ý ToS) như staging BL-111. Staging cùng server, ở `179-197-242-57.sslip.io`.

Classification dự kiến: MODIFY (hạ tầng deploy/runbook, không đổi behavior app). Phụ thuộc: BL-111 xong (Nginx, user deploy, swap, cổng gate staging.history).

## Phải làm (dự kiến — change-request chốt phase plan)
1. **[USER]** Mắt Bão: `A @ → 179.197.242.57`; `www` (A cùng IP hoặc CNAME) nếu dùng www. Hiện domain trống (không A/MX/TXT).
2. Server mới: thư mục/compose production `tami-prod-*` (app 127.0.0.1:3010), vhost Nginx `tamihomes.vn` (+ `www` → 301 về apex), HTTPS, header production (không noindex, HSTS dài), chặn `/api/metrics`, `/api/internal/`.
3. Backup production (pgBackRest + restic theo `docs/runbooks/restore.md`): env + `BACKUP_ENV_DIR` trên server mới, đích backup, diễn tập restore.
4. Chuyển dữ liệu production cũ → mới (pg_dump/pg_restore, SeaweedFS public + private), đếm đối chiếu; downtime/khóa ghi lúc cắt chuyển.
5. `production.env`: `NEXT_PUBLIC_SITE_URL=https://tamihomes.vn`, Turnstile hostname `tamihomes.vn`, SMTP/khác giữ nguyên.
6. Deploy: GitHub Environment `production` secrets `DEPLOY_HOST` / `DEPLOY_SSH_KNOWN_HOSTS` sang server mới; gate staging.history — staging + production cùng máy nên job `record-staging-pass` (BL-111 P1.02) có thể bỏ / chỉnh.
7. Tên miền cũ `tami.genieplatform.cloud`: redirect 301 sang `tamihomes.vn` hay bỏ? (hỏi user).
8. Sau khi ổn: dừng production + staging trên server cũ (không xoá dữ liệu khi chưa có xác nhận).

## Câu hỏi mở
- Q1: `www.tamihomes.vn` có dùng không (301 về apex)?
- Q2: `tami.genieplatform.cloud` sau chuyển: 301 sang tamihomes.vn hay tắt?
- Q3: Thời điểm cắt chuyển production (downtime ngắn khi dump cuối + đổi DNS) — báo trước người dùng/admin?
- Q4: Đích backup production (restic/pgBackRest) giữ nguyên nơi cũ hay đổi?

## Quyết định (plan duyệt 2026-11-06T07:45Z, user "Ok, làm đi")
- Q1 `www.tamihomes.vn` → 301 apex · Q2 `tami.genieplatform.cloud` → 301 `https://tamihomes.vn` (giữ path) · Q3 cắt chuyển ngay sau chạy thử
- Q4 backup R2 cùng bucket, path mới `/tami-prod-s2` + `tami-prod-files-s2`; kho cũ giữ ≥ 30 ngày · Q5 Turnstile test key + SMTP giả giữ nguyên, tách backlog (BL-118 Turnstile, BL-095 SMTP)

## Acceptance
- [x] `https://tamihomes.vn` HTTPS hợp lệ, chạy trên 179.197.242.57, dữ liệu production đầy đủ (đếm khớp) — P3.T01 (149 bảng + bucket khớp 100%), P3.T02
- [x] Deploy production qua CI vào server mới, health PASS, gate "chỉ nhận bản đã qua staging" vẫn đúng — Deploy production 42183151702 / 42194365495; gate kiểm lại ở P4.T02 (P4.T01 evidence)
- [x] Backup production chạy + restore thử PASS trên server mới — P2.T03, full sau cắt chuyển P3.T01
- [x] Rate limit lấy đúng IP thật; robots/sitemap/canonical dùng tamihomes.vn — P3.T02
- [x] Runbook/ARCHITECTURE/project-config/decisions cập nhật — P4.T02 (Decision 13)

## Kết quả (close-out 2026-11-09)
- Commit: 884e0ae2 ad9f6581 1dab6943 4ede6ce4 ec340561 e80b2e14 986a4594 + close-out P4.T02. Cắt chuyển 2026-11-06 08:28Z, downtime ~5 phút.
- 2026-11-09 04:43Z: stack `tami-*` + `tami-staging-*` trên server cũ đã `docker stop` + `restart=no` (volume, `/opt/tami`, kho R2 cũ giữ); vhost 443 staging sslip cũ gỡ; 301 tên miền cũ + cổng 80 ACME giữ.
- Spec 1.63.1, test-scope v118 (production base URL `https://tamihomes.vn`). Task: `tasks/feature-production-new-server-tamihomes/`.
- Còn lại cho user: quyết xoá kho R2 cũ + dữ liệu server cũ sau 2026-12-06; BL-118 (Turnstile), BL-095 (SMTP).
