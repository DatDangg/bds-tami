Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-2-task-02 · round 1 (BL-112)

- **Review level:** STRICT
- **Reason:** dữ liệu production (dump/restore, chép object), đổi secret Environment `production`, cổng deploy production (chỉ nhận digest đã qua staging), bật vhost 443 public trên host dùng chung với dự án khác.
- **Blast radius:** server mới `server` (179.197.242.57: compose `tami`, `tami-staging`, nginx dùng chung với outfitai/airoom/supabase); server cũ `server-old` (prod `tami.genieplatform.cloud`, chỉ đọc); GitHub Environment `production` của `DatDangg/bds-tami` (mọi lần Deploy production sau này trỏ server mới); tên miền public `tamihomes.vn` / `www`. Repo: chỉ `docs/runbooks/deploy.md` (+7 dòng §12.1a) + task file. Không đụng code/script/workflow.
- **Phạm vi diff kiểm:** `git diff docs/runbooks/deploy.md` (§12.1a) + task file. Các file M khác trong working tree (src/*, docs/API_SPEC…) thuộc việc khác, không tính cho task này.

## Verify commands + result (tự chạy, chỉ đọc)

| Kiểm | Kết quả |
|---|---|
| `gh run view 42183151702` | completed/success, attempt 1, workflow_dispatch, ref `staging`, headSha `b75ff984540748a54dced24b87285d6512799bda`, 07:47:08Z→07:48:10Z, 1 job success. Log: `image: ghcr.io/datdangg/bds-tami@sha256:edf4b378…c6a1`, "production xong". Không lộ secret (KNOWN_HOSTS = `***`). |
| `production.current` (server) | `ghcr.io/datdangg/bds-tami@sha256:edf4b3785fc98bde2393bf7020fc2e892469dab25da3edee666a1ab55d38c6a1` |
| Image `tami-app` / `tami-jobs` đang chạy | cùng digest `sha256:edf4b378…c6a1`, OOM=false, RC=0 |
| Gate `staging.history` | dòng `sha256:edf4b378…c6a1 2026-11-06T06:55:21Z b75ff984…` có sẵn (ghi 06:55, trước deploy prod 07:47); `release.sh` awk khớp cả digest+SHA; script/workflow không đổi trong task này ⇒ cổng giữ nguyên. |
| Secret Environment `production` (tên + updatedAt) | DEPLOY_HOST 07:47:02Z, DEPLOY_USER 07:47:03Z, DEPLOY_SSH_KEY 07:47:05Z, DEPLOY_SSH_KNOWN_HOSTS 07:47:06Z — khớp Evidence. |
| known_hosts fingerprint | `ssh-keyscan -t ed25519 179.197.242.57 \| ssh-keygen -lf -` = `SHA256:5uzqgi5o4/BsMUm9/Fy39nXoMNQP/x1MvzYtJKXIs94` = host key trên server = runbook §11.1:370. Run CI dùng `StrictHostKeyChecking=yes` + success ⇒ secret khớp host key thật (gián tiếp). |
| Data đối chiếu (tự đếm cả 2 server) | BASE TABLE 149 + VIEW 2 (=151); extension 7; payload_migrations 43, max = `20261023_030506_floor_distance_normalized`; projects 11 / rentals 12 / news 10 / media 320 / leads 0 / wards 3321; md5 danh sách tên bảng `b72fd88f…` giống; **md5 (tên bảng:count) toàn bộ 149 bảng `8806ab86…` giống, tổng 28 721 dòng giống**; md5 (id,filename) media giống. |
| Last migration vs SHA deploy | `b75ff984` có 43 file migration `.ts`, cuối `20261023_030506_floor_distance_normalized` = DB; `git diff 678b3568 b75ff984 -- '*migrations*'` rỗng. |
| SeaweedFS | `tami-prod-public` size 257871920 / logical 257357042 / chunk 1595, `fs.du` 1595 block / 257268967; `tami-prod-private` 0 — giống hệt 2 server. Media thật qua `https://tamihomes.vn/api/media/file/…webp` 200 image/webp 164 994 B. |
| Nginx 443 | `tamihomes.vn/` 200, `Strict-Transport-Security: max-age=31536000`, **không** X-Robots-Tag, meta robots `index, follow`, canonical `https://tamihomes.vn`; `www…/x?y=1` → 301 `https://tamihomes.vn/x?y=1`; http apex/www → 301 https apex (giữ query); `/api/metrics` 404, `/api/internal/x` 404, `/api/internal/revalidate` 404, `/api/health` 200; Host lạ qua 443 bị từ chối (không response). File sites-available sha256 = repo HEAD `docker/nginx/tami-prod-tamihomes.conf` (`cda3ad3e…`), root:root 644, symlink 07:48. |
| X-Real-IP / access log | request UA `reviewer-p2t02-probe` từ IP máy review 14.248.69.150 → `/var/log/nginx/tami-prod.access.log` cột đầu `14.248.69.150` (IP thật). Config `proxy_set_header X-Real-IP $remote_addr` (ghi đè). |
| SEO/AI host | robots.txt `Sitemap: https://tamihomes.vn/sitemap.xml`, sitemap `<loc>` dùng `https://tamihomes.vn` ⇒ `NEXT_PUBLIC_SITE_URL` đúng; llms.txt 200. |
| Staging | `https://179-197-242-57.sslip.io/` 200 + `X-Robots-Tag: noindex, nofollow, noarchive`; `tami-staging-*` OOM=false RC=0, staging app Up 59 phút (không do task này restart). |
| Prod cũ | `https://tami.genieplatform.cloud/` 200; `tami-app/jobs` start 2026-11-02, `tami-postgres` start 2026-10-23, RC=0 — không bị stop/restart; production.current cũ không đổi; sites-enabled cũ không đổi. (`tami-seaweedfs` RC=5 start 11-02 — có từ trước.) |
| Dự án khác | outfit/airoom/supabase container vẫn Up (thời gian Up không trùng mốc task; unhealthy của airoom-api/supabase-rest/storage có từ trước); outfitai 404 như P2.T01 (đã ghi nhận lỗi app dự án đó). nginx site khác không đổi. |
| RAM/OOM | 07:56:45Z và 07:57:34Z (~9 phút sau deploy): used 3.6Gi, available 4.1–4.2Gi, swap 1.5Gi (1537 MiB) phẳng so với số builder, `vmstat` si/so ≈ 0; mọi container `tami*` OOM=false RC=0; dmesg không có OOM. Mem limit prod: app 1G, jobs 384M, postgres 2G (đúng compose b75ff984 như §12.1a ghi). |
| `/opt/tami/transfer` | `deploy:deploy 700`, `prod-trial.dump` 600, 1 577 037 B — khớp Evidence. |
| Khác | Thư mục creds tạm của deploy (`/tmp/tmp.ucELCTcZlm`) đã bị xoá; `prod.env` 600; release `current` → `b75ff984…`; app chỉ bind 127.0.0.1:3010. |
| Unit test/lint/build | skip — task không đổi code (chỉ runbook/task doc). |

## Responsive Checklist Gate
N/A — không đổi UI/route/CSS (hạ tầng + runbook).

## Skill gates
- aislop: N/A — không có code thay đổi trong task.
- oxlint (anti-slop): N/A — không đụng TS/JS.
- ocr (open-code-review): N/A — không có code.
- AI-readable: OK — §12.1a ngắn, cụ thể (SHA đầy đủ, run id, điều kiện 2g/512MB vs ≥ 884e0ae2), không indicator chaos.
- ai-friendly-web: OK — `tamihomes.vn` public: robots.txt 200 cho phép GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot/anthropic-ai, sitemap.xml 200 đúng host, llms.txt 200.
- blitzstrike: skip — không có môi trường pentest được phép; thay bằng kiểm tay header/route nội bộ 404/Host lạ bị từ chối.

## Findings

Không có CRITICAL / MAJOR.

- **[MINOR] Theo dõi swap 15 phút chưa đủ** (task file:26 Verify; Evidence:64 tự ghi "chưa theo dõi đủ 15 phút"). Reviewer bổ sung mẫu ~9 phút sau deploy: swap phẳng 1.5Gi, si/so ≈ 0, không OOM ⇒ xu hướng ổn, nhưng P2.T03 đang chạy restore drill (tốn RAM) nên đề xuất P2.T03 / P3.T02 ghi thêm 1 mẫu `free -m` + `vmstat` sau khi drill xong để đóng mục này.
- **[MINOR] Cửa sổ "bản thử" đang public + index**: từ 07:48Z `tamihomes.vn` phục vụ bản sao dữ liệu thử với `index, follow`, có form lead + `/admin` 200. Dữ liệu ghi vào prod mới trước P3.T01 (lead, sửa admin) sẽ bị ghi đè khi restore dump cuối; nội dung trùng với `tami.genieplatform.cloud` trong lúc chờ. Plan đã được duyệt (Q3 cắt chuyển ngay sau P2, traffic thấp, leads = 0) nên không chặn. Đề xuất P3.T01 thêm 1 bước: trước khi restore, đếm `leads`/`updated_at > 07:43Z` trên prod mới để không mất dữ liệu thật nếu có người dùng vào tên miền mới.
- **[MINOR] `archive_command` fail do `tami-backup` tự bật** (Decision log:42, runbook §12.1a): `pg_stat_archiver.failed_count` = 44 lúc 07:57Z, `pg_wal` 145M, disk / còn 56G — không nguy hiểm; `archived_count` đã lên 9 (P2.T03 đang xử lý). Đã ghi runbook; không phải lỗi P2.T02. Đóng tại P2.T03 (failed_count ngừng tăng, `OK wal`).

## Verdict
✅ **PASS** — prod mới chạy bằng CI (run 42183151702, digest khớp `production.current` = image đang chạy = dòng `staging.history`), dữ liệu thử khớp 100% (tự đếm toàn bộ 149 bảng + bucket), secret đúng tên/thời điểm + host key đúng fingerprint, nginx 443 đúng header prod/www 301/route nội bộ 404/IP thật trong log, staging + prod cũ + dự án khác không bị ảnh hưởng, không OOM, `/opt/tami/transfer` 700. Ba MINOR chuyển sang P2.T03/P3.T01.

## Residual risk
- Nội dung secret `DEPLOY_SSH_KEY`/`DEPLOY_SSH_KNOWN_HOSTS` không đọc được (đúng thiết kế) — xác minh gián tiếp qua run CI StrictHostKeyChecking=yes thành công.
- Quan sát RAM chỉ ~9 phút sau deploy (xem MINOR 1); P2.T03 song song có thể đổi bức tranh RAM.
- Không kiểm `outfitai` sâu hơn (404 có từ P2.T01, ngoài scope).
