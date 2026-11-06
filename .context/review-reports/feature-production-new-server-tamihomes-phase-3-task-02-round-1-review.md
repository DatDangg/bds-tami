Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-3-task-02 · round 1

Task: `tasks/feature-production-new-server-tamihomes/phase-3-task-02.md` (BL-112: smoke acceptance cho production https://tamihomes.vn sau cắt chuyển)
Change doc: `spec/changes/2026-11-06-production-new-server-tamihomes.md`
Thời điểm review: 2026-11-06 ~08:55Z (`date -u` trên server). Máy kiểm có IP public 14.248.69.150.

- **Review level:** NORMAL
- **Reason:** Task chỉ kiểm, không có diff code hay server. Bản thân việc kiểm chạm production public (HTTPS, SEO, rate-limit IP), nhưng builder không sửa vhost. Task ghi rõ "STRICT nếu phải sửa vhost", và vhost không bị sửa.
- **Blast radius:** production tamihomes.vn: nginx vhost `tami-prod-tamihomes*.conf`, container `tami-*`, backup `tami-backup`, SEO (robots/sitemap/canonical), rate limit theo IP. Không có code nào đổi nên không ảnh hưởng client/API contract.

## Verify commands + result
- Repo verify commands (test/lint/typecheck/build): skip, task này không có diff source.
- Kiểm độc lập, chỉ đọc (curl/openssl từ máy local, `ssh server` dùng lệnh đọc). Không gửi form, không chạy renew, không in secret (chỉ grep tên cờ `TRUST_*`).

| Mục | Kết quả reviewer tự kiểm | Khớp Evidence builder |
|---|---|---|
| Cert/HSTS/X-Robots | `/` 200; issuer Let's Encrypt `YE1`, SAN `tamihomes.vn` + `www.tamihomes.vn`, hết hạn 2027-02-04; `Strict-Transport-Security: max-age=31536000`; không có header `X-Robots-Tag` | Khớp |
| www → apex | `https://www.tamihomes.vn/du-an/abc?q=1` → 301 `https://tamihomes.vn/du-an/abc?q=1` | Khớp |
| http → https | `http://tamihomes.vn/du-an?x=1` → 301 `https://tamihomes.vn/du-an?x=1` | Khớp |
| Domain cũ | `https://tami.genieplatform.cloud/du-an/x?a=1` → 301 `https://tamihomes.vn/du-an/x?a=1`; `http://…/tin-tuc?a=1` → 301 https cùng host → 301 `https://tamihomes.vn/tin-tuc?a=1` → 200 | Khớp |
| robots.txt | `Allow: /`, `Disallow: /admin`, `Disallow: /api/` (có thêm `Allow: /api/media/file/`), không có `Disallow: /`; `Sitemap: https://tamihomes.vn/sitemap.xml`; có liệt kê AI crawler | Khớp |
| Sitemap | index có 8 sitemap con, tất cả `https://tamihomes.vn/sitemaps/*`; trong mọi sitemap con, số `<loc>` thuộc domain khác = 0 (static 14, projects 10, rentals 8, news 16, cat-news 8, cat-property-posts 4, cat-projects 10, cat-rentals 12 `<loc>`) | Domain khớp; số lượng lệch (xem MINOR-1) |
| canonical/og:url/hreflang | `/`, `/du-an/maison-privee`, `/en/projects/maison-privee`, `/tin-tuc`: canonical và og:url đều `https://tamihomes.vn…`; hreflang vi/en/x-default đúng cặp vi↔en; 0 chuỗi `genieplatform`/`sslip` trong HTML | Khớp |
| Endpoint bị chặn | `/api/metrics` 404, `/api/internal/x` 404, `/api/health` 200; trên server `127.0.0.1:3010/api/health` 200 | Khớp |
| IP thật (nginx) | `tami-prod.access.log` (2000 dòng cuối): cột đầu là các IP public khác nhau, IP máy kiểm `14.248.69.150` có 90 dòng; 0 dòng cột đầu là 127./172./10. | Khớp |
| IP thật (từ nginx vào app) | vhost: `proxy_set_header X-Real-IP $remote_addr` (ghi đè), `CF-Connecting-IP ""` (xoá), `X-Forwarded-For $remote_addr`; container `tami-app` có `TRUST_X_REAL_IP=true`, `TRUST_CF_CONNECTING_IP=false`; `src/lib/security/client-ip.ts` chỉ tin X-Real-IP khi bật cờ (có test `client-ip.test.ts`); app chỉ nghe `127.0.0.1:3010` (`ss`), gọi từ ngoài `179.197.242.57:3010` timeout, nên client không chèn được header giả qua đường vòng; log app từ 08:33Z có 0 dòng cảnh báo IP/bucket | Mạnh hơn bằng chứng gián tiếp của builder |
| Backup prom | `tami_backup_last_run_ok`=1 cho wal/pg_full/pg_diff/files (env=production); pg_full ts 1793954479 = 08:41:19Z, files 08:41:25Z, wal 08:48:12Z | Khớp |
| OOM/Restart | Mọi container `tami-*` (prod + staging): `OOMKilled=false`, `RestartCount=0`; tami-app/jobs/backup start 08:33:09Z, app healthy | Khớp |
| RAM | 7.7Gi, used 3.6Gi, available 4.2Gi; swap 4.0Gi, dùng 1.5Gi | Khớp (chỉ có 1 lần đọc) |

Không kiểm lại (đã có bằng chứng ở P3.T01/P2.T03, hoặc cần lệnh ghi): đếm khớp dữ liệu (P3.T01 "đối chiếu 100%"), certbot dry-run, chi tiết `pg-backup.sh info`, restic snapshot, TLS reject khi gọi bằng hostname lạ.

## Đối chiếu acceptance của change doc
| Acceptance (change doc) | Thuộc task này | Trạng thái |
|---|---|---|
| HTTPS hợp lệ, chạy trên 179.197.242.57, dữ liệu đầy đủ (đếm khớp) | có (HTTPS) / P3.T01 (đếm) | PASS. Reviewer tự kiểm HTTPS. Đếm dữ liệu dựa vào evidence P3.T01, smoke cho thấy sitemap/trang có dữ liệu |
| Rate limit lấy đúng IP thật | có | PASS. Cả chuỗi nginx `$remote_addr` → ghi đè `X-Real-IP` → `TRUST_X_REAL_IP=true` → `getClientIp` đều đã kiểm bằng config, code, test và log |
| robots/sitemap/canonical dùng tamihomes.vn | có | PASS |
| Backup chạy + restore thử PASS | P2.T03 | Lần chạy backup sau cắt chuyển OK (prom) |
| Deploy CI / Runbook docs | task khác | N/A |

**Có residual nào chặn acceptance không:** không.
- Residual 1 (admin/CV private): không nằm trong 4 nhóm acceptance của change doc, nhưng nằm trong mục "Việc" của task. Còn mở, user tự kiểm.
- Residual 2 (SMTP chưa cấu hình): không thuộc acceptance; xem MINOR-2.
- Residual 3 (form thử): không chặn. Chuỗi IP đã được reviewer xác minh qua config, code và log.
- Residual 4 (RAM 24h): theo dõi tiếp.
- Residual 5 (HEAD 404): đặc tính của Payload, không ảnh hưởng.

## Responsive Checklist Gate
N/A. Không có diff UI (task smoke hạ tầng).

## Skill gates
- aislop: N/A, không có diff code.
- oxlint (anti-slop): N/A, không có diff TS/JS.
- ocr (open-code-review): N/A, không có diff code.
- AI-readable: N/A, không có code mới. Task file rõ ràng, có bảng evidence và residual.
- ai-friendly-web: OK. robots.txt cho phép GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot, có sitemap.xml, production không có noindex. Không kiểm `llms.txt` (ngoài scope task, có thể đã kiểm ở feature trước).
- blitzstrike: skip, không phải STRICT, không đổi auth/input.

## Findings
- **[MINOR-1]** `tasks/feature-production-new-server-tamihomes/phase-3-task-02.md:34`: Evidence ghi "static 56 / projects 40 / rentals 32 / news 64 URL", nhưng reviewer đếm được 14/10/8/16 `<loc>`. Số của builder đúng bằng 4 lần số này, nhiều khả năng đã đếm cả `xhtml:link` hreflang. Kết luận "0 domain khác" vẫn đúng. Fix: sửa số liệu thành số `<loc>` hoặc ghi rõ đơn vị đếm.
- **[MINOR-2]** Residual 2: production đang có `SMTP_HOST=smtp.invalid`, nên email báo lead/newsletter sẽ lỗi. Không thuộc acceptance và change doc nói "SMTP giữ nguyên", nhưng đây là tác động vận hành trên production. Fix đề xuất: ghi thành item backlog/follow-up riêng có owner (user điền SMTP thật vào `/opt/tami/prod.env`), thay vì chỉ để trong residual.
- **[MINOR-3]** Residual 1 (admin + tải CV private) và residual 4 (RAM 24h) là các mục trong "Việc" của task nhưng chưa xong. Đề xuất: close-out ghi rõ đây là user follow-up và không đánh dấu task "toàn bộ Việc PASS".

Không có finding CRITICAL hoặc MAJOR.

## Residual risk
- Đếm khớp dữ liệu, certbot dry-run, restic snapshot và TLS reject chỉ dựa vào evidence của builder hoặc task trước, reviewer không chạy lại.
- Chưa có xác nhận end-to-end rằng rate limit nhận IP thật qua một lần gửi form thật (cố ý không gửi form). Có thể kiểm bằng config, code và test.
- RAM/swap mới có 1 lần đọc. Host dùng chung với supabase/airoom/outfitai.

## Verdict
PASS
