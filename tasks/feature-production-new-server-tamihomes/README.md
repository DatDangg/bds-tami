# feature-production-new-server-tamihomes (BL-112) — phase plan

- Change doc: `spec/changes/archive/2026-11-06-production-new-server-tamihomes.md`
- Classification: **MODIFY** (hạ tầng deploy production: server + tên miền + backup + pipeline gate). Không đổi behavior app, không migration schema.
- Risk tổng: **HIGH** (dữ liệu production, secret production, cổng deploy production, host dùng chung). Review: **STRICT** cho mọi task chạm server/CI.
- Trạng thái: plan DUYỆT 2026-11-06T07:45Z ("Ok, làm đi") — Q1 www 301 apex; Q2 tên miền cũ 301; Q3 cắt chuyển ngay sau P2; Q4 R2 cũ path `-s2`, kho cũ giữ ≥ 30 ngày; Q5 Turnstile test key + SMTP giả giữ nguyên, tách backlog riêng ở close-out.

## Hiện trạng đo được (read-only, 2026-11-06 ~07:30Z)
| Mục | Server cũ `server-old` 187.52.119.50 | Server mới `server` 179.197.242.57 |
|---|---|---|
| Production | `tami-*` (project `tami`), app 127.0.0.1:3010, release `678b3568`, `https://tami.genieplatform.cloud` | chưa có (cổng 3010 trống, chưa có `prod.env`, chưa có volume `tami_*`) |
| DB prod | 166 MB (151 bảng, PostGIS 3.5.2 + pg_trgm/unaccent/tiger…), `leads` = 0 dòng | — |
| SeaweedFS prod | ~247 MB (`tami-prod-public`, `tami-prod-private`) | — |
| Backup prod | sidecar `tami-backup` chạy OK; pgBackRest + restic → **Cloudflare R2** bucket `tami-prod-backup` (path `/tami-prod`, restic `tami-prod-files`), `BACKUP_ENV_DIR=/opt/tami/backup/production` | — |
| RAM | 15 GB | 7.7 GB, available ~4.8 GB, swap 4 GB (đang dùng 1.4 GB), 2 vCPU, ổ trống 57 GB |
| Traffic prod | rất thấp (~465 request log hôm nay, chưa có lead) | — |
| Turnstile prod | **test key `1x00…`** (luôn pass) — giống staging | — |
| SMTP prod | `SMTP_HOST=smtp.invalid` (không gửi mail thật) | — |
| Dịch AI prod | tắt (`TRANSLATION_MONTHLY_BUDGET_USD=0`, không có key) | — |
| CI key | secret Environment `production` = khoá `tami-ci-deploy-prod` (chỉ nằm trong GitHub, máy dev không có) | `deploy` chỉ có khoá `tami-ci-deploy-staging` (= `~/.ssh/tami_ci_deploy`) |
| staging.history | — | 2 dòng: `55e52730`, `b75ff984` (không có migration nào giữa `678b3568` và `b75ff984`) |
| DNS | `tami.genieplatform.cloud` → 187.52.119.50 | `tamihomes.vn` A 179.197.242.57, `www` CNAME → apex (đã có) |

## Phases
| Task | Mục tiêu | Chạm server? |
|---|---|---|
| phase-1-task-01 | Repo: vhost tamihomes.vn (+www 301), vhost 301 cho tên miền cũ, giảm RAM postgres prod, runbook §12 nháp | Không |
| phase-2-task-01 | Server mới: `prod.env`, backup env (kho R2 path MỚI), image postgres/backup, Nginx 80 + cert `tamihomes.vn`+`www` | Server mới |
| phase-2-task-02 | Chạy thử: copy dữ liệu prod (bản thử) → server mới, đổi secret Environment `production`, CI deploy prod vào server mới, bật 443 | Cả hai (cũ: chỉ đọc/dump) |
| phase-2-task-03 | Backup prod trên server mới + diễn tập restore PASS | Server mới |
| phase-3-task-01 | Cắt chuyển: khoá ghi prod cũ → dump cuối → restore → đếm đối chiếu → bật lại → tên miền cũ 301 | Cả hai |
| phase-3-task-02 | Smoke acceptance trên `https://tamihomes.vn` + backup full sau cắt chuyển | Server mới |
| phase-4-task-01 | Gỡ job `record-staging-pass` (cùng máy, thừa) + dọn runbook §1 | Không (CI) |
| phase-4-task-02 | Dừng prod + staging cũ (không xoá), close-out docs/spec/test-scope, archive | Server cũ (dừng container) |

Thứ tự: P1 → P2.T01 → P2.T02 → P2.T03 → (user chọn giờ) P3.T01 → P3.T02 → P4.T01 ∥ P4.T02 (P4.T02 chỉ sau ≥ 1 ngày prod mới ổn hoặc user cho phép).
