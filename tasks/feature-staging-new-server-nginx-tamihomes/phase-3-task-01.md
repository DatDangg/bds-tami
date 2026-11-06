# feature-staging-new-server-nginx-tamihomes · phase-3-task-01 — HTTPS Let's Encrypt 179-197-242-57.sslip.io + smoke qua domain (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: phase-2-task-03 PASS. **CHỜ DNS (U1): `A staging.tamihomes.vn → 179.197.242.57`** đã phân giải (`nslookup staging.tamihomes.vn 8.8.8.8` + `1.1.1.1`). Cần email Let's Encrypt (U4), Turnstile hostname (U2).
- Trạng thái: `done` — STRICT FAIL r1 (MAJOR-1 tài liệu host dùng chung outfitai) → PASS r2 (`.context/review-reports/feature-staging-new-server-nginx-tamihomes-phase-3-task-01-round-2-review.md`), 2026-11-06. Residual: Turnstile chờ U2 (hostname 179-197-242-57.sslip.io), link menu CMS trỏ sslip cũ (user sửa nội dung).

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
- [x] `https://179-197-242-57.sslip.io` HTTPS hợp lệ (LE YE2, hết hạn 2027-02-04), không basic auth (Q1), noindex, trỏ server mới; `certbot renew --dry-run` PASS (cert này), certbot.timer enabled+active.
- [x] Rate limit lấy đúng IP thật qua Nginx (xem Evidence 8).
- [ ] Form có Turnstile + upload hoạt động: upload giới hạn 413 PASS; Turnstile CHỜ U2 (user thêm hostname vào site key staging), chưa kiểm submit thật.

## Retry / Escalation
LE từ chối (rate limit/CAA/firewall 80) → dừng báo, không thử lặp quá 2 lần (giới hạn failed validation của LE). 3 attempt fail → `architecture_review_needed`.

## ĐỔI QUYẾT ĐỊNH (user 2026-11-06, sau P2.03) — thay cho các mục trên khi mâu thuẫn
- Hostname staging = **`179-197-242-57.sslip.io`** (KHÔNG `staging.tamihomes.vn`; `tamihomes.vn` dành production = BL-112, ngoài scope). sslip.io tự phân giải (kiểm 2026-11-06: → 179.197.242.57) ⇒ không còn chờ DNS Mắt Bão (U1 bỏ).
- Let's Encrypt: user đồng ý ToS, **không email** → `certbot certonly --webroot -w /var/www/certbot -d 179-197-242-57.sslip.io --agree-tos --register-unsafely-without-email --non-interactive`. Gia hạn bằng `certbot.timer` + deploy hook `/etc/letsencrypt/renewal-hooks/deploy/` chạy `nginx -t && systemctl reload nginx` (host mới chỉ TAMI dùng certbot nên hook dùng chung được); `certbot renew --dry-run` PASS.
- Turnstile: U2 đổi thành thêm hostname `179-197-242-57.sslip.io` vào site key staging (user CHƯA làm) — form lỗi do hostname → ghi residual chờ U2, không chặn.
- Phạm vi thêm vào task này: đổi mọi tham chiếu `staging.tamihomes.vn` → `179-197-242-57.sslip.io` (conf Nginx repo đổi tên file, vhost server, `NEXT_PUBLIC_SITE_URL` trong `/opt/tami/staging.env` + tạo lại app/jobs, runbook §11, ARCHITECTURE §6, project-config, Decision 12, `.env.example`, comment compose staging).

## Decision log (builder, 2026-11-06)
- Tên file Nginx repo: `docker/nginx/tami-staging-sslip-179{,-http}.conf` (`git mv` từ `tami-staging-tamihomes*`), tách khỏi `tami-staging-sslip*.conf` của server cũ (giữ nguyên, chỉ sửa dòng comment trỏ tên mới). Hành vi bảo mật không đổi (http2 on, noindex, HSTS 86400, không basic auth); chỉ server_name + đường dẫn cert.
- Hook gia hạn: dùng `renewal-hooks/deploy/reload-nginx.sh` dùng chung (theo lệnh dispatcher), thay deploy-hook riêng cho từng cert.
- `certbot renew --dry-run` không cờ sẽ ngủ ngẫu nhiên ~6 phút khi không có tty; dùng `--cert-name 179-197-242-57.sslip.io --no-random-sleep-on-renew` (chỉ dry-run cert của TAMI). Một lần chạy đầu bị tôi kill bằng PID (2058543/2058536) trước khi xong, không ảnh hưởng.
- Sửa doc: deploy.md (§11 + 2 dòng nhắc §3.4/§9), project-config, decisions Decision 12 (+ ghi chú cập nhật), .env.example, compose staging (comment), ARCHITECTURE (CHỈ thay chữ: `staging.tamihomes.vn`→`179-197-242-57.sslip.io`, `tami-staging-tamihomes`→`tami-staging-sslip-179`).

## Evidence (builder, 2026-11-06)
1. Part A: `nginx -t` (nginx:1.28-alpine, cert giả, include http + 443 + reject) OK. sha256 (đã bỏ CR) 3 file conf trên server = file repo (54323ffe…, a11af230…, 2b6f15a1…).
2. `/opt/tami/staging.env`: `NEXT_PUBLIC_SITE_URL=https://179-197-242-57.sslip.io` (grep -c =1, một dòng duy nhất). app+jobs tạo lại bằng `up -d app jobs` (user deploy); `docker exec tami-staging-app printenv NEXT_PUBLIC_SITE_URL` = giá trị mới; `/api/health` 200. StartedAt postgres 04:09:09, redis 04:09:09, seaweedfs 04:12:48 không đổi.
3. Nginx: gỡ symlink+file `tami-staging-tamihomes-http.conf`; cài conf cổng 80 mới; `curl -sI http://179-197-242-57.sslip.io/` → 301 `Location: https://179-197-242-57.sslip.io/`.
4. certbot (1 lần, không retry): "Successfully received certificate", hết hạn 2027-02-04.
5. Hook `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` (root:root 755); `certbot renew --dry-run --cert-name 179-197-242-57.sslip.io` PASS; `certbot.timer` enabled + active.
6. Cài conf 443 + `tami-default-reject.conf`, symlink, `nginx -t` OK, reload OK.
7. Smoke ngoài: HTTPS không `-k` (ssl_verify_result=0), issuer `Let's Encrypt CN=YE2`; `/` 200 + `X-Robots-Tag: noindex, nofollow, noarchive` + `Strict-Transport-Security: max-age=86400`, không WWW-Authenticate; `/en` 200; `/robots.txt` `User-Agent: *` + `Disallow: /`; sitemap `<loc>` + canonical + og:url + og:image đều `https://179-197-242-57.sslip.io/...`; `/api/health` 200; `/api/metrics` + `/api/internal/x` 404; `http://` 301; `--resolve x.invalid` và `https://179.197.242.57/` → TLS handshake lỗi (curl rc=35). Media `/api/media/file/...-400x181.webp` 200 image/webp, `Cache-Control: private, no-store`. Upload: POST 26 MB `/api/public/job-applications` → 413 (nginx); body nhỏ → 400 (app, qua nginx).
8. Rate limit/IP thật: endpoint `POST /api/public/click-events` (30/phút/IP, body `{}` nên 400 không ghi dữ liệu). IP dev 14.248.69.150: 30 lần 400 rồi 4 lần 429; ngay sau đó IP server cũ 187.52.119.50 (`ssh server-old curl`, chỉ đọc): 3 lần 400 (không bị 429) ⇒ 2 bucket riêng. Cột đầu access log nginx hiện đúng 2 IP thật. `docker logs --since 15m tami-staging-app | grep "không xác định IP|chung 1 bucket"` = 0 dòng. Không tạo lead/gửi email thật.
9. Turnstile: `/lien-he` 200, HTML có `turnstileSiteKey`. U2 (thêm hostname `179-197-242-57.sslip.io` vào site key staging) CHƯA làm: widget/submit form có thể lỗi hostname cho tới khi user làm; chưa kiểm submit thật.
10. Host: `free -h` used 3.8Gi/7.7Gi, available 4.0Gi. Container TAMI chạy; dự án khác (supabase*, airoom-b1-*) giữ nguyên Up nhiều ngày. Lưu ý ngoài scope: `outfit-changer-api-1` + `worker-1` đang Restarting, `outfitai.genieplatform.cloud` trả 502 (upstream 127.0.0.1:8088 connection refused); site nginx `outfitai.genieplatform.cloud` + cert của dự án đó xuất hiện trên host lúc 04:21Z (site) / 04:27Z (cert), TRƯỚC khi TAMI cài `tami-default-reject.conf` (05:18Z), không phải do TAMI. Cert TAMI dùng ACME account có sẵn của certbot outfitai nên `--register-unsafely-without-email` không có tác dụng; hook toàn cục cũng chạy khi outfitai gia hạn (vô hại); reject default_server làm client không SNI/IP trần tới outfitai bị từ chối (nhỏ). Cần báo chủ outfitai. Vì có site 443 khác nên giả định "host chỉ TAMI dùng 443/certbot" trong runbook/conf không còn đúng hẳn; `tami-default-reject.conf` làm truy cập `https://179.197.242.57/` bằng IP trần bị reject handshake (site outfitai có server_name riêng nên không ảnh hưởng truy cập bằng tên).

## Residual / việc user
- U2 Turnstile hostname (xem 9).
- Chủ server/dự án outfit-changer cần biết Nginx host nay có site TAMI + default-reject 443 (mục 4 "Việc"); outfit-changer-api đang crash-loop (không do TAMI).
- Ảnh chụp 6 trang 1440/390 của "Việc 3" chưa chụp (không có trong yêu cầu giao); chưa có Reviewer.
