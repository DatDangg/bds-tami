# feature-staging-new-server-nginx-tamihomes · phase-2-task-03 — Đổi CI deploy staging sang server mới + deploy + smoke qua tunnel SSH (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: phase-1-task-02 merge `staging` (nếu user chọn phương án A), phase-2-task-01, phase-2-task-02. **Cần user: GitHub secrets (U3).** Không cần DNS.
- Trạng thái: `done` — STRICT PASS r1 (`.context/review-reports/feature-staging-new-server-nginx-tamihomes-phase-2-task-03-round-1-review.md`), 2026-11-06; dump /opt/tami/transfer đã xoá. Còn chờ user: đăng nhập /admin + tải 1 CV thật (không chặn).

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
- [x] Run `Deploy` → job `deploy-staging` xanh trên server mới, health PASS.
- [x] Dữ liệu (tin, ảnh) hiển thị qua tunnel; CV: endpoint private chặn không-auth (401/403), tải CV thật = user tự kiểm (không nhập mật khẩu).
- [x] Không ảnh hưởng dự án khác; staging cũ vẫn chạy bản cũ.

## Retry / Escalation
Deploy fail → đọc log, root cause trước (không sửa server ngoài quy trình); 3 attempt fail → `architecture_review_needed`.

## Evidence (builder, 2026-11-06)
- Bước 1-2 (user/CI): secrets env `staging` đã đặt; CI 42162175234 success; Deploy 42163804119 (DatDangg/bds-tami) success 3 job: build image, Deploy staging, ghi staging.history trên server production. Build commit `55e52730…`, digest `sha256:d900ca9e9c3ad1cf04ff3b8028e51fb6f2861aa3d24933e0d689589506ba7b76`.
- Log deploy.sh: `tami-staging-postgres Running/Healthy` (guard qua, không tạo lại), migrate-run container chạy ("Reading migration files from /app/migrations"), up app+jobs, `health OK (lần 2)` 04:50:04Z.
- Server mới: `tami-staging-app` Up (healthy), `tami-staging-jobs` Up (cùng image d900ca9e9c3a), redis/postgres/seaweedfs healthy. Postgres StartedAt 2026-11-06T04:09:09Z, RestartCount 0 (KHÔNG recreate, trước deploy). Mounts: volume `tami-staging_postgres-data` -> /var/lib/postgresql/data + bind init.sql.
- `/opt/tami/state/staging.current` = `ghcr.io/datdangg/bds-tami@sha256:d900ca9e…7b76`; `staging.history` dòng `sha256:d900ca9e… 2026-11-06T04:50:14Z 55e5273065812758be0640f67550d41140326ff5`; `releases/staging/current` -> `/opt/tami/releases/staging/55e5273065812758be0640f67550d41140326ff5`.
- Tài nguyên: `free -h` total 7.7Gi, available 4.0Gi, swap used 52Mi. docker stats: app 151MiB/768, jobs 169MiB/384, redis 6MiB, postgres 90MiB, seaweedfs 133MiB => tami-staging-* ~550 MiB (< 2.2 GB). Dự án khác (supabase-*, airoom-b1, outfit-changer-postgres/minio) vẫn up; `outfit-changer-api/worker` Restarting (đã crash-loop từ trước, không do tami); airoom-b1-api, supabase-storage, supabase-rest unhealthy từ trước (Up 4-10 ngày).
- Server cũ (187.52.119.50, chỉ đọc): `staging.history` 3 dòng cuối có `sha256:d900ca9e… 2026-11-06T04:50:34Z 55e52730…` (record-staging). Production tami-app/jobs/postgres/redis uptime 3 ngày/13 ngày không đổi; tami-staging-app/jobs cũ vẫn Up (bản cũ, 2-3 ngày). Lưu ý: `tami-staging-seaweedfs` (cũ) "Up 40 minutes" = đã restart ở phase-2-task-02 (dừng để copy), không thuộc task này.
- Smoke qua tunnel `ssh -N -L 13011:127.0.0.1:3011 server` (Host: staging.tamihomes.vn): `/api/health` 200 json; `/`, `/en`, `/du-an`, `/tin-tuc`, `/cho-thue`, `/tuyen-dung`, `/lien-he`, `/admin` đều 200 html; canonical + og:url = `https://staging.tamihomes.vn` (`/en` -> `.../en`); `/robots.txt` `User-Agent: *` `Disallow: /`; `/sitemap.xml` 200, 11 `<loc>` đều host `https://staging.tamihomes.vn`; media `/api/media/file/e9b154d9-…-800x451.webp` 200 image/webp 60094 B; `/api/news?limit=1` 200.
- Private file không auth: `/api/admin/private-files/1/download` -> 401; `/api/private-files/file/x.pdf` -> 403 (route thật `/admin/private-files/:id/download` trong `src/endpoints/admin/private-file-download.ts`). Admin đăng nhập + tải CV thật: chưa làm (cần user, không nhập mật khẩu).
- Tunnel đã tắt (curl sau kill: 000). Dump `/opt/tami/transfer` KHÔNG xoá. Rate-limit X-Real-IP bỏ qua (phase-3). Không commit.
