Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-2-task-01 · round 1 (BL-112)

- Review level: **STRICT**
- Reason: secret production (prod.env, backup env R2/pgBackRest/restic), host dùng chung với dự án khác (outfitai, supabase, airoom), certbot ACME account chung, chuẩn bị release dir mà CI deploy production sẽ dùng.
- Blast radius: `/opt/tami/prod.env`, `/opt/tami/backup/production/**`, `/opt/tami/releases/production/**`, image `tami-postgres`/`tami-backup`, nginx host (`sites-enabled/*`), `/etc/letsencrypt/**`, kho R2 `tami-prod-backup` (path mới `-s2`), CI `ssh-deploy` + `scripts/deploy/deploy.sh` lần deploy production đầu tiên trên server mới.
- Phương pháp: chỉ đọc qua `ssh server` / `ssh server-old` (stat, grep tên biến, sha256 từng dòng/từng file, nginx -t, openssl x509, letsencrypt.log, curl). Không in giá trị secret. Không sửa server/file nguồn.

## Verify commands + result

| Kiểm | Kết quả | Bằng chứng |
|---|---|---|
| `prod.env` quyền/chủ | OK | `600 deploy:deploy` (uid 1000 — khớp server cũ `600 1000:1000`) |
| Tên biến + chỉ `NEXT_PUBLIC_SITE_URL` khác | OK | 28/28 dòng; diff hash từng dòng cũ↔mới: chỉ dòng 12 `NEXT_PUBLIC_SITE_URL` (cũ `https://tami.genieplatform.cloud` → mới `https://tamihomes.vn`) |
| TRUST_* / BACKUP_ENV_DIR | OK | `TRUST_CF_CONNECTING_IP=false`, `TRUST_X_REAL_IP=true`, `BACKUP_ENV_DIR=/opt/tami/backup/production` |
| `DATABASE_URL_PROD` ≠ staging | OK | hash value prod `8897423cd31e` (len 101) ≠ staging `c159f27c9361` (len 104). Cùng host service `postgres` nhưng compose prod `name: tami` + network `internal` riêng project, container `tami-*` vs `tami-staging-*` → không lẫn |
| `backup/production` quyền | OK | dir `750 deploy:deploy`; `pgbackrest.env`/`restic.env` `600 deploy:deploy`; `ssh/` `700 999:999` (rỗng) — khớp layout server cũ; image chạy uid 999 (`postgres`) |
| Path kho mới, không trỏ kho cũ | OK | pgbackrest.env 48 dòng chỉ khác dòng 14 `PGBACKREST_REPO1_PATH=/tami-prod-s2` (cũ `/tami-prod`); restic.env 27 dòng chỉ khác dòng 11 → `.../tami-prod-backup/tami-prod-files-s2` (cũ `tami-prod-files`); type s3, bucket `tami-prod-backup` |
| Release `releases/production/b75ff984…/` khớp git | OK | 35 file (`docker/` + `scripts/deploy/`), sha256 từng file = `git show b75ff984:<path>`, mismatches=0; tập file = đúng tập `tar docker scripts/deploy` của `ssh-deploy` |
| Symlink `current` | OK | `current -> /opt/tami/releases/production/b75ff984…` (tuyệt đối, khớp `activate_release` `ln -sfn "$REPO_DIR"`); owner `deploy:deploy` |
| Không phá CI deploy | OK | `ssh-deploy` chỉ `mv -T` khi `<sha>` chưa có, có rồi thì giữ + `touch`; nội dung đã bootstrap trùng 100% với bản CI sẽ upload. SHA khác → CI tạo dir mới, `check_release_layout` vẫn PASS; `prune_old_releases` chỉ xoá tên 40-hex ngoài 5 bản mới nhất |
| Image | OK | `tami-postgres:17-3.5-bookworm-pgbackrest2.59` (5e32c35b2f13), `tami-backup:bookworm-pgbackrest2.59-restic0.17.3` (8444229ccecd) |
| Nginx chỉ thêm 1 vhost | OK | file mới sau 06:30Z trong `/etc/nginx` chỉ `sites-available/tami-prod-tamihomes-http.conf` + symlink (07:36); outfitai/default/staging mtime cũ (04:27/05:27). Hash file server `1e33137bb6f7…` = `git show 884e0ae2:docker/nginx/tami-prod-tamihomes-http.conf` |
| `nginx -t` / active | OK | syntax ok, test successful; `active` |
| http → 301 | OK | `http://tamihomes.vn/` → 301 `https://tamihomes.vn/`; `http://www.tamihomes.vn/x?y=1` → 301 `https://tamihomes.vn/x?y=1` |
| Cert SAN | OK | CN=tamihomes.vn, SAN `tamihomes.vn, www.tamihomes.vn`, notAfter 2027-02-04; renewal conf webroot `/var/www/certbot` cho cả 2 tên; hook `renewal-hooks/deploy/reload-nginx.sh` có; `certbot.timer` enabled |
| Renew dry-run dùng `--cert-name` | OK | letsencrypt.log 07:36:33 `Arguments: ['--dry-run', '--cert-name', 'tamihomes.vn', '--no-random-sleep-on-renew']` → "all simulated renewals succeeded". certonly 07:36:16 có `--cert-name tamihomes.vn`. Chỉ 1 lần certonly (không retry) |
| Không đụng dự án khác / outfitai 404 | OK (không do TAMI) | vhost + cert/renewal outfitai mtime 04:27Z không đổi; backend trực tiếp `127.0.0.1:8088` = 404, `127.0.0.1:8089` = 404 (bỏ qua nginx); `outfit-changer-api-1`/`worker-1` "Up 8 minutes" — họ đang tự restart/deploy. 404 nằm ở app của họ |
| Staging TAMI | OK | `https://179-197-242-57.sslip.io/` = 200; `tami-staging-*` app/redis/postgres/seaweedfs healthy |
| Không container TAMI prod chạy | OK | `docker ps -a` chỉ có `tami-staging-*`; volume `tami_*` = 0; `:3010` không listen |
| Repo verify commands (lint/test/build) | skip — task chỉ thao tác server, diff repo của task = task file; không có code app đổi |

Ghi chú minh bạch: reviewer đã chạy 1 lệnh `docker run --rm --entrypoint id tami-backup:…` để xác định uid trong image (container tạm, tự xoá, không mount gì) — không để lại trạng thái.

## Skill gates
- aislop: N/A — không có code thay đổi trong task.
- oxlint (anti-slop): N/A — không đụng TS/JS.
- ocr (open-code-review): N/A — không có code diff.
- AI-readable: OK — task file có Decision log + Evidence rõ ràng; runbook §12 cập nhật cert/backup path `-s2` (deploy.md:417–445).
- ai-friendly-web: N/A — task hạ tầng, 443/app chưa bật.
- blitzstrike: skip — không có môi trường pentest được phép; không có surface mới ngoài vhost 80 chỉ 301.
- Responsive Checklist Gate: N/A — không đụng UI.

## Findings

- [MINOR] Ràng buộc "deploy production đầu tiên PHẢI dùng SHA b75ff984 (hoặc bootstrap lại release)" và "compose b75ff984 còn postgres mem_limit 2g/shared_buffers 512MB" chỉ nằm ở Decision log task file (`tasks/feature-production-new-server-tamihomes/phase-2-task-01.md:35-36`), chưa có trong `docs/runbooks/deploy.md` §12. Đề xuất: P2.T02 thêm 1 dòng vào runbook §12 (hoặc task P2.T02 Việc) để người chạy CI không chọn SHA khác khi postgres dựng từ release b75ff984; đồng thời xác định rõ khi nào chuyển sang compose >= 884e0ae2 (1g/256MB) trên host 2 vCPU dùng chung.
- [MINOR] Prefix kho R2 `/tami-prod-s2` và `tami-prod-files-s2` chưa được xác nhận trống (builder ghi rõ, Decision log dòng 40). Chấp nhận vì `stanza-create`/`restic init` ở P2.T03 sẽ lỗi nếu đã có dữ liệu; P2.T03 cần xử lý lỗi đó là dừng, không `--force`.
- [INFO, ngoài scope] letsencrypt.log 05:16:18 có `certbot renew --dry-run` trần (không `--cert-name`) — thuộc BL-111 đã commit, không phải task này; đã chạm simulate cert outfitai lúc đó. Không tính cho round này.
- [INFO] uid 999 trên host mới là user `nextlevel-tunnel`/group `systemd-journal` (chỉ tên hiển thị); thư mục `ssh/` rỗng, 700 — không lộ gì cho user đó. Khớp layout server cũ (999:999).

Không có CRITICAL/MAJOR.

## Residual risk
- Không chạy lại `certbot renew --dry-run` (tránh thêm request ACME); dựa trên log certbot có timestamp + args xác thực.
- Không kiểm nội dung kho R2 (cần khoá R2; ngoài phạm vi chỉ đọc).
- outfitai 404: kết luận dựa trên backend trực tiếp 404 + vhost/cert không đổi; trạng thái app của họ có thể thay đổi tiếp do họ đang restart.

## Verdict
**PASS**
