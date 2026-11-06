Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-2-task-03 · round 1 (BL-111)

- Task: `tasks/feature-staging-new-server-nginx-tamihomes/phase-2-task-03.md`. Đổi CI deploy staging sang server mới, deploy, smoke qua tunnel.
- Review level: **STRICT**
- Reason: đổi đích deploy staging; guard postgres chạy lần đầu trên server mới; dữ liệu đã migrate; server mới dùng chung với dự án khác; record-staging ghi lên server production (187.52.119.50); file private (CV) bị lộ nếu auth sai.
- Blast radius: server mới 179.197.242.57 (tami-staging-* và các container dự án khác: supabase-*, airoom-b1-*, outfit-changer-*), `/opt/tami/state` + `releases/staging` trên server mới, `/opt/tami/state/staging.history` trên server production (đầu vào cho cổng "production chỉ nhận digest đã qua staging"), stack production tami-* trên server cũ (chỉ được đọc), GitHub environments `staging`/`production`.
- Ngày review: 2026-11-06, khoảng 04:55–04:58Z. Chỉ đọc. Không in secret, không nhập mật khẩu, không sửa server.

## Lệnh verify + kết quả

Repo này không có verify command riêng cho task. Task chỉ đụng hạ tầng và không đổi source. Lint/test/build: `skip, no source diff in this task`. Các kiểm tra độc lập (chỉ đọc):

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | `gh run view 42163804119 -R DatDangg/bds-tami --json ...` | `completed/success`, event `workflow_run`, headSha `55e5273065812758be0640f67550d41140326ff5`. Cả 3 job success: Build image + push GHCR (04:39:37–04:48:18), Deploy staging (04:48:21–04:50:18), Ghi staging.history trên server production (04:50:21–04:50:37). |
| 2 | Log deploy.sh (`gh run view --log`) | Digest build ra `sha256:d900ca9e…7b76`. `tami-staging-postgres Running` → `Healthy`: guard cho qua với container có sẵn, postgres không bị Create/Recreate. Trong log không có `PG_IMAGE_SWITCH_CONFIRMED`. Container `migrate-run` chạy: "Reading migration files from /app/migrations" rồi "Done." Chỉ app/jobs được `Created`. `health OK (lần 2)` lúc 04:50:04Z. "staging xong: …@sha256:d900ca9e… (release 55e52730…)". Có WARN dự kiến: "chưa có image trước: … KHÔNG thể rollback tự động" (đúng với lần deploy đầu trên server mới). |
| 3 | Job record-staging (log) | mode `record-staging`, environment `production`, "đã ghi staging.history: sha256:d900ca9e… + SHA 55e52730…" lúc 04:50:34Z. |
| 4 | Server mới: state files | `staging.current` = `ghcr.io/datdangg/bds-tami@sha256:d900ca9e…7b76`. Dòng cuối `staging.history` = `sha256:d900ca9e… 2026-11-06T04:50:14Z 55e5273065812758be0640f67550d41140326ff5`. `releases/staging/current` → `/opt/tami/releases/staging/55e5273065812758be0640f67550d41140326ff5`. Quyền file `deploy:deploy`, thư mục 0750. |
| 5 | Server mới: containers | `tami-staging-app` Up (healthy), RestartCount 0. `tami-staging-jobs` Up, RestartCount 0. Cả hai chạy image `…@sha256:d900ca9e…`, khởi động 04:49:56Z. postgres: Created 04:09:08Z, Started 04:09:09Z, RestartCount 0, tức là **không bị tạo lại** khi deploy. redis/seaweedfs không bị tạo lại. `seaweedfs-init` Exited (0). |
| 6 | `docker exec tami-staging-app printenv NEXT_PUBLIC_SITE_URL` | `https://staging.tamihomes.vn` |
| 7 | `free -h` | total 7.7Gi, available 3.9Gi (≥ 1.5 GB), swap dùng 52Mi/4.0Gi |
| 8 | `docker stats --no-stream` | app 219MiB/768MiB, jobs 172MiB/384MiB, postgres 92MiB/512MiB, seaweedfs 133MiB/256MiB, redis 5MiB/128MiB. Tổng khoảng 622 MiB, dưới mốc ~2.2 GB. |
| 9 | Dự án khác trên server mới | supabase-* Up 8–10 ngày; airoom-b1-db Up 8 ngày. `airoom-b1-api` (unhealthy, Up 4 ngày), `supabase-rest`/`supabase-storage` (unhealthy, Up 10 ngày), `ai-rid-api` (Exited 8 ngày) đều đã vậy từ trước khi deploy. `outfit-changer-api/worker` đang Restarting. Stack outfit-changer có chu kỳ deploy riêng (`migrate`/`minio-init` Exited 33 phút trước ≈ 04:23Z; postgres/minio Up 49 phút), đều trước khi bắt đầu deploy tami (04:48Z). Không thấy container nào khác bị tami tạo lại hoặc khởi động lại. |
| 10 | `/tmp/tmp.*` trên server mới (thư mục docker config tạm của lần login GHCR) | Không còn, đã dọn. |
| 11 | Server cũ: `tail -3 state/staging.history` | Dòng cuối = `sha256:d900ca9e…7b76 2026-11-06T04:50:34Z 55e5273065812758be0640f67550d41140326ff5` (khớp digest + SHA). |
| 12 | Server cũ: `ls state/.record.*` | "No such file or directory": thư mục tạm của record-staging đã dọn. `staging.current`/`staging.previous`/`production.*` không đổi mtime (Nov 2). Chỉ `staging.history` và `deploy.lock` mang mtime 04:50. |
| 13 | Server cũ: production | `tami-app`/`tami-jobs` Started 2026-11-02T07:53:48Z, rc 0. `tami-postgres`/`tami-redis` Started 2026-10-23, rc 0. `production.current` = `…@sha256:c426f6de…` (không đổi). Staging cũ (`tami-staging-app/jobs`) vẫn chạy image cũ `c426f6de57db`. |
| 14 | Smoke qua **tunnel riêng** (`ssh -N -L 13111:127.0.0.1:3011 server`, `Host: staging.tamihomes.vn`) | `/api/health` → `{"status":"ok","checks":{"db":"up","redis":"up","storage":"up"}}`. `/` 200 (421 KB), `/en` 200, `/du-an` 200, `/cho-thue` 200, `/tin-tuc` 200. Dữ liệu đã migrate: `/api/news` totalDocs 12, `/api/projects` totalDocs 69, `/api/media` totalDocs 829. File media `/api/media/file/62056cc1-….jpg` → 200 image/jpeg 342018 B. canonical + og:url = `https://staging.tamihomes.vn`, `/en` canonical `…/en`. `/sitemap.xml` 200, cả 11 `<loc>` đều trên host `https://staging.tamihomes.vn`. `/robots.txt` `User-Agent: *` / `Disallow: /`. |
| 15 | File private khi chưa đăng nhập | `/api/admin/private-files/1/download` → 401. `/api/private-files/file/x.pdf` → 403. `/api/private-files` → 403. |
| 16 | Dọn tunnel | Chỉ kill đúng PID của tunnel (`kill $!`). Sau khi kill, curl → `000`, PID không còn. Không đụng tới các tiến trình ssh khác. |
| 17 | `docker logs --since 1h` (tóm tắt, không có PII) | app: 11 dòng, gồm 3 error "Bạn không có quyền thực hiện thao tác này." (do chính các probe private-file không đăng nhập của builder và reviewer gây ra, đúng như mong đợi) và 3 warn: không xác định được IP khách (bucket rate limit dùng chung), SMTP_USER là placeholder, SMTP_HOST. jobs: 4 dòng, gồm "Jobs: runner đã khởi động", "Running 1 jobs.", và 2 warn SMTP. Không có ECONN, unhandled hay fatal. |
| 18 | Warn SMTP/IP có sẵn từ trước không (log staging cũ) | Staging cũ cũng có warn SMTP placeholder (1). Warn về IP khách **không** có trên staging cũ, nên là warn mới trên server mới (xem MINOR-1). |

## Responsive Checklist Gate
N/A: task chỉ về hạ tầng/deploy, diff không đụng route/component/CSS.

## Skill gates
- aislop: N/A, không có source diff trong task này.
- oxlint (anti-slop): N/A, không có diff TS/JS.
- ocr (open-code-review): N/A, không có diff code.
- AI-readable: OK. Task file có evidence rõ ràng, không thấy indicator nào.
- ai-friendly-web: N/A. Staging cố ý chặn crawler (`Disallow: /`) và không public (chưa có DNS). Đây là hành vi đúng cho staging.
- blitzstrike: skip, không có môi trường pentest được phép. Đã kiểm thủ công ranh giới auth của file private (401/403).

## Findings

Không có CRITICAL. Không có MAJOR.

- **[MINOR-1] Warn "không xác định được IP khách: mọi request dùng chung một bucket rate limit"** trong `tami-staging-app` trên server mới (staging cũ không có warn này). Nguyên nhân: Nginx/X-Real-IP chưa ráp xong (vhost mới chỉ có cổng 80; smoke đi qua tunnel thẳng vào 3011). Task đã ghi rõ phần này để phase-3. Đề xuất: phase-3 phải kiểm warn này biến mất khi đi qua Nginx 443 và rate limit tách theo IP; chưa xong thì không nên trỏ DNS và dùng thật.
- **[MINOR-2] Cách dọn tunnel của builder: kill toàn bộ `ssh.exe`.** Cách này có thể làm rớt các phiên SSH khác của user, kể cả phiên tới server production. Lần này không gây hại, nhưng nên dùng cách của reviewer: ghi PID của tunnel (`& TP=$!` hoặc `-f` + `-o ControlPath`) rồi chỉ kill PID đó. Đề xuất ghi vào runbook §11 cho phase-3.
- **[MINOR-3] Trang `/cho-thue` trả 200 nhưng HTML nhỏ (31 KB).** `/api/public/rentals?limit=1` không trả `totalDocs`, endpoint custom có shape khác. Reviewer chưa đếm được số tin cho thuê đã migrate. Phase-2-task-02 đã đối chiếu đủ 185 bảng nên rủi ro thấp. Đề xuất: khi user đăng nhập admin thì xem nhanh danh sách tin cho thuê.
- **[INFO] Còn chờ user (đúng như acceptance):** đăng nhập `/admin` bằng tài khoản staging cũ và tải 1 CV private thật. Claude không nhập mật khẩu. Không chặn PASS, vì acceptance ghi rõ "tải CV thật = user tự kiểm".
- **[INFO]** `outfit-changer-api/worker` crash-loop là chuyện riêng của dự án đó. Lần deploy của outfit-changer (≈04:23Z) diễn ra trước lần deploy tami, nên không phải do tami.
- **[INFO]** Rollback tự động chưa dùng được cho tới lần deploy thứ 2 trên server mới (log WARN "chưa có image trước"). Điều này đúng cho lần deploy đầu; vẫn còn đường quay về staging cũ trên server cũ (vẫn đang chạy).

## Residual risk
- Chưa kiểm qua Nginx 443/HTTPS và rate limit thật (để phase-3, chưa có DNS).
- Đăng nhập admin và tải CV private thật chưa được kiểm chứng (cần user).
- Số tin cho thuê chưa đếm được qua API (MINOR-3).

## Verdict
**PASS**: không có CRITICAL/MAJOR. Đã kiểm độc lập: CI 3 job xanh trên đúng commit; guard postgres cho qua mà không cần cờ xác nhận và không tạo lại postgres; migrate Done; health OK; app và jobs chạy đúng digest; state files đúng; `staging.history` trên server production đã ghi đúng digest + SHA, thư mục `.record.*` đã dọn; production không bị đụng tới; dữ liệu và media đã migrate được phục vụ đúng, domain staging đúng; file private bị chặn 401/403 khi chưa đăng nhập; tài nguyên còn dư và không ảnh hưởng dự án khác. Builder nên theo các mục MINOR ở phase-3.
