# feature-staging-new-server-nginx-tamihomes · phase-3-task-01 — HTTPS Let's Encrypt staging.tamihomes.vn + smoke qua domain (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: phase-2-task-03 PASS. **CHỜ DNS (U1): `A staging.tamihomes.vn → 179.197.242.57`** đã phân giải (`nslookup staging.tamihomes.vn 8.8.8.8` + `1.1.1.1`). Cần email Let's Encrypt (U4), Turnstile hostname (U2).
- Trạng thái: `blocked` — chờ DNS (kiểm 2026-11-06: NXDOMAIN).

## Classification / Risk
- Type: MODIFY hạ tầng.
- Risk: **MEDIUM-HIGH** — rate limit theo IP thật, chặn công khai/noindex, chứng chỉ tự gia hạn.
- Expected review level: **STRICT** (IP khách / bảo mật header).

## Việc
0. (Nếu có sửa trên staging cũ từ lúc chuyển dữ liệu) chạy lại đồng bộ phase-2-task-02 bước 7.
1. `certbot certonly --webroot -w /var/www/certbot -d staging.tamihomes.vn --email <U4> --agree-tos --no-eff-email --deploy-hook "nginx -t && systemctl reload nginx"` (user đã đồng ý điều khoản LE trong chat).
   Thử `certbot renew --dry-run --cert-name staging.tamihomes.vn`; kiểm timer `systemctl list-timers | grep certbot`.
2. Copy `tami-staging-tamihomes.conf` (+ `tami-default-reject.conf` nếu task-01 thêm) → `sites-available/` + symlink; htpasswd nếu Q1 = bật basic auth (user nhập mật khẩu tại prompt, không trên dòng lệnh); `nginx -t` → `systemctl reload nginx`.
3. Smoke từ ngoài:
   - `curl -sI https://staging.tamihomes.vn/` → 200 (hoặc 401 nếu basic auth) + `X-Robots-Tag: noindex…` + HSTS; cert hợp lệ (không `-k`), issuer Let's Encrypt.
   - `/` + `/en` 200; `/robots.txt` có `Disallow: /`; `/sitemap.xml` + canonical/OG dùng `https://staging.tamihomes.vn` (NEXT_PUBLIC_SITE_URL runtime); link chia sẻ Zalo/Facebook (BL-105) ra domain mới.
   - `/api/health` 200; `/api/metrics` + `/api/internal/x` → 404 qua Nginx.
   - `curl -sI http://staging.tamihomes.vn/` → 301 https.
   - Truy cập `https://179.197.242.57/` không ra trang staging (reject/handshake lỗi).
   - Rate limit: gửi form liên hệ/ứng tuyển từ 2 IP khác nhau (máy dev + `ssh server-old curl …`) → 2 bucket; cột đầu `/var/log/nginx/tami-staging.access.log` = IP thật.
   - Turnstile hiển thị + submit form thành công (cần U2); upload ảnh admin + CV form ứng tuyển ≤ 20MB OK, > 25MB → 413.
   - Ảnh chụp `/`, `/du-an`, `/tin-tuc`, `/cho-thue`, `/tuyen-dung`, `/lien-he` (1440 + 390) làm evidence.
4. Báo user: người quản lý server mới biết Nginx của TAMI giữ 80/443 (dự án khác muốn web sau này đi qua Nginx này — thêm file site riêng).

## Acceptance (= acceptance change doc)
- [ ] `https://staging.tamihomes.vn` HTTPS hợp lệ, (basic auth theo Q1), noindex, trỏ server mới; tự gia hạn dry-run PASS.
- [ ] Rate limit lấy đúng IP thật qua Nginx.
- [ ] Form có Turnstile + upload hoạt động.

## Retry / Escalation
LE từ chối (rate limit/CAA/firewall 80) → dừng báo, không thử lặp quá 2 lần (giới hạn failed validation của LE). 3 attempt fail → `architecture_review_needed`.
