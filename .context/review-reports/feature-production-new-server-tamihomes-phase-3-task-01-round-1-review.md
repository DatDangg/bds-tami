Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-3-task-01 · round 1 (BL-112 cắt chuyển production)

- Review level: **STRICT**
- Reason: HIGH_RISK_DATA — thay toàn bộ DB + object store production, DROP/CREATE database, đổi nginx trên server dùng chung với dự án khác, backup/WAL archive, domain cutover (public-facing).
- Blast radius: DB `tami` prod (server mới 179.197.242.57), SeaweedFS bucket `tami-prod-public`/`tami-prod-private`, Redis prod, stanza pgBackRest `tami` (repo `-s2`) + restic `tami-prod-files-s2`; nginx server cũ 187.52.119.50 (dùng chung: crm-dhp, nhstar, ntasolution, ntavietnam, tmfoods, staging sslip cũ); public domain `tamihomes.vn` + `tami.genieplatform.cloud` (SEO 301); staging trên cả 2 server.
- Scope diff: `tasks/.../phase-3-task-01.md` (Decision log + Evidence), `docs/runbooks/deploy.md` §12.1b, `.context/progress.json`. Các thay đổi khác của deploy.md trong working tree thuộc P4.T01 — ngoài scope.

## Verify commands + result
Không có code thay đổi → test/lint/typecheck/build: `skip, no app code in diff`. Kiểm hạ tầng CHỈ ĐỌC qua ssh `server` / `server-old` + curl (2026-11-06 ~08:43Z), không chạy lệnh ghi:

| Hạng mục | Kết quả reviewer tự đo | Khớp Evidence |
|---|---|---|
| `count(*)` 149 bảng public (query_to_xml, `default_transaction_read_only=on`) cũ vs mới | 149 dòng mỗi bên, `diff` rỗng → **IDENTICAL** (sha256 file đầu ra 108df1a8… cả 2 bên; khác chuỗi `a26d9b14…` của builder do định dạng khác, không quan trọng) | OK |
| Bảng / view | 149 / 2 cả hai | OK |
| Extension (tên:version:owner:schema) | fuzzystrmatch 1.2, pg_trgm 1.6, plpgsql, postgis 3.5.2, postgis_tiger_geocoder (tiger), postgis_topology (topology), unaccent 1.1 — owner `tami`, giống hệt | OK |
| Last migration / số | `20261023_030506_floor_distance_normalized` / 43 cả hai | OK |
| `\l` tami | owner `tami`, UTF8, `en_US.utf8`/`en_US.utf8`, provider libc, datacl rỗng — giống cũ | OK |
| `ALTER DATABASE … SET search_path` | `"$user", public, topology, tiger` cả hai | OK |
| Schema owner | public:pg_database_owner, tiger/tiger_data/topology:tami — giống | OK |
| Owner object public | r149 / v2 / i816 / S64 / c2 đều `tami` — giống | OK |
| md5 last_value toàn bộ sequence, ACL bảng, số index 816, constraint 413 | giống hệt | OK (thêm ngoài Evidence) |
| `s3.bucket.list` | public size 257871920 / logical 257357042 / chunk 1595; private 0 — 2 bên giống | OK |
| `fs.du` | public 1595 block / 257268967; private 0 — 2 bên giống | OK |
| pgBackRest `info` | stanza `tami` status ok; full `20261106-153347F` (15:33:47→15:41:14 +07, 82MB), 2 full + 1 diff; WAL max `…1A` | OK |
| system-id | `pg_control_system()` 7704960719497166885 == `system-id` trong info JSON → stanza giữ | OK |
| `pg_stat_archiver` | archived 29, last `…1A` 08:41:33Z; failed_count 44, last_failed 07:54:58Z (trước cắt chuyển) → không tăng | OK |
| `pgbackrest check` | KHÔNG chạy (check ép switch WAL = lệnh ghi) — dựa evidence builder + archiver stats | residual nhỏ |
| restic (`snapshots --no-lock`) | `569520db` + `d1620215` (15:41:20 +07, 245.351 MiB) | OK |
| Health `127.0.0.1:3010/api/health` | 200 | OK |
| `https://tamihomes.vn/`, `/du-an` | 200 (IP 179.197.242.57), không X-Robots-Tag, HSTS có | OK |
| Ảnh media (3 file mới nhất theo DB) | 200, 211–214 KB mỗi file | OK |
| `www.tamihomes.vn/du-an?a=1` | 301 → `https://tamihomes.vn/du-an?a=1` | OK |
| `https://tami.genieplatform.cloud/du-an/x?q=1`, `/`, `/admin` | 301 → `https://tamihomes.vn<same path+query>`; HSTS giữ | OK |
| `http://tami.genieplatform.cloud/du-an/x?q=1` | 301 → https cùng host (rồi 301 tiếp) | OK |
| Server cũ sites-enabled | chỉ thay symlink `tami-prod-direct.conf` → `tami-prod-genieplatform-redirect.conf` (08:33); mọi symlink khác giữ mtime cũ; `tami-prod-direct.conf` còn trong sites-available; `tami-prod-direct-http.conf` (80, ACME webroot) còn enabled | OK |
| File redirect server == repo | sha256 `5f6b4297…` trùng `docker/nginx/tami-prod-genieplatform-redirect.conf` | OK |
| `nginx -t` server cũ | syntax ok / test successful (chỉ warn có sẵn của tmfoods — ngoài scope) | OK |
| Renewal cert cũ | `renewal/tami.genieplatform.cloud.conf`: authenticator webroot `/var/www/certbot` (tồn tại), renew_hook `nginx -t && systemctl reload nginx`; cert hết hạn 2027-01-19; `certbot.timer` active. Không chạy dry-run | OK |
| Container server cũ | tami-app Exited(143) / tami-jobs Exited(0) lúc 08:28:18, restart=`unless-stopped` (không tự bật lại khi daemon restart) → rollback `docker start` được; tami-postgres/redis/seaweedfs/backup Up; staging cũ + dự án khác Up | OK |
| Site khác server cũ | staging `187-52-119-50.sslip.io`, nhstar, ntasolution.vn, ntavietnam.tech → 200 | OK |
| `/opt/tami/transfer` (server mới) | dir `drwx------ deploy`, `prod-final.dump` `-rw------- deploy` 1577037 B | OK (xoá sau review) |
| RAM/OOM server mới | used 3.6Gi, avail 4.1Gi, swap 1.4/4.0Gi; OOMKilled=false, RestartCount=0 toàn bộ container | OK |
| Staging mới | `https://179-197-242-57.sslip.io/` 200 + `X-Robots-Tag: noindex, nofollow, noarchive` | OK |
| Redis prod | `INFO keyspace` rỗng (0 key), uptime 3681s (không restart → flush là FLUSHALL) → không còn cache trang thử | OK |
| Log app/jobs 15 phút | 0 dòng error/fail | OK |
| robots/sitemap/llms | robots Allow AI bots, `Sitemap: https://tamihomes.vn/sitemap.xml`; sitemap loc dùng `https://tamihomes.vn`; `llms.txt` 200 | OK |
| Đăng nhập admin | KHÔNG kiểm được (cần tài khoản/trình duyệt) | Residual → P3.T02 |

## Responsive Checklist Gate
N/A — diff không đụng UI (chỉ task file, runbook, progress.json).

## Skill gates
- aislop: N/A — không có code trong diff.
- oxlint (anti-slop): N/A — không đụng TS/JS.
- ocr (open-code-review): N/A — không có code; (ocr không dùng cho infra).
- AI-readable: OK — runbook §12.1b ghi mốc giờ, downtime, khác biệt, rollback rõ; 0 indicator.
- ai-friendly-web: OK — public domain mới có `llms.txt` 200, `robots.txt` không chặn AI crawler, `sitemap.xml` dùng domain mới.
- blitzstrike: skip — không có thay đổi auth/API/input; task infra.

## Findings
Không có CRITICAL / MAJOR.

- [MINOR] `tasks/feature-production-new-server-tamihomes/phase-3-task-01.md:4` ghi `awaiting_review` nhưng `.context/progress.json` (entry phase-3-task-01) vẫn `in_progress`, không có reviewer/report path → primary cập nhật khi close-out (status, reviewer PASS, reportPath, completedAt).
- [MINOR] `phase-3-task-01.md:66` sha256 `a26d9b14…` không nêu cách sinh (định dạng/locale) nên không tái lập được bằng hash; reviewer đã tự đối chiếu theo danh sách (`diff` rỗng). Đề xuất ghi lệnh tạo danh sách vào runbook nếu dùng lại ở P3.T02/P4.
- [MINOR] Dump `/opt/tami/transfer/prod-final.dump` còn trên server mới (đúng kế hoạch) → xoá sau khi review PASS và ghi vào Evidence close-out.
- [MINOR / info] `tami-backup` server cũ vẫn chạy, tiếp tục archive WAL/lịch backup của DB cũ (đứng yên) vào kho cũ `/tami-prod` — vô hại, xử lý ở P4.T02 cùng việc dừng hẳn prod cũ.

## Residual risk
- Đăng nhập admin trên `tamihomes.vn` chưa kiểm (cookie domain mới, cùng `PAYLOAD_SECRET`) → bắt buộc kiểm ở P3.T02 hoặc user xác nhận.
- `pgbackrest check` không được reviewer chạy lại (lệnh ghi WAL); dựa `info` status ok + archiver failed_count không tăng + system-id khớp.
- Đối chiếu object theo tổng (chunk/size/block), không so từng key/etag; spot-check 3 ảnh mới nhất 200. Rủi ro thấp vì copy là tar nguyên volume.
- Container `airoom-b1-api-1`, `supabase-rest`, `supabase-storage` trên server mới `unhealthy` từ 4–10 ngày trước — dự án khác, có trước cắt chuyển, ngoài scope.

## Verdict
✅ PASS
