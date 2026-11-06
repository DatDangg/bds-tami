Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-2-task-02 · round 1 (BL-111)

- Task: `tasks/feature-staging-new-server-nginx-tamihomes/phase-2-task-02.md` (chuyển dữ liệu staging cũ → server mới)
- Reviewed at: 2026-11-06 ~04:15–04:17Z (server clock UTC)
- **Review level: STRICT**
- **Reason:** DB/data migration, PII (CV private, leads), secret env file, deploy guard (`guard_postgres_image`) và shared host (server mới chạy chung supabase/airoom/outfit-changer...; server cũ chạy production `tami-*`).
- **Blast radius:** `/opt/tami/*` server mới (env, release, volumes `tami-staging_*`, transfer dump); staging cũ trên server cũ (seaweedfs dừng ~66 s); lần deploy CI đầu tiên lên server mới (phase-2-task-03) qua `scripts/deploy/deploy.sh` + `.github/actions/ssh-deploy`; các container dự án khác trên server mới; production trên server cũ (không được đụng).

## Verify commands + result

Repo verify commands (lint/test/build): **N/A** — task ops thuần, không đổi source trong scope (chỉ task file). Chỉ kiểm READ-ONLY qua SSH; không restart/sửa gì, không in giá trị secret, không in nội dung dump/CV. Truy vấn DB chạy trong `SET default_transaction_read_only = on` (lần đầu dùng temp table bị read-only chặn → không ghi gì; chạy lại bằng `query_to_xml`). File tạm `/tmp/.tami_rc*` tự tạo đã xoá.

| Kiểm | Lệnh (tóm tắt) | Kết quả |
|---|---|---|
| Env perms | `stat -c '%U:%G %a' /opt/tami/staging.env` (mới) | `deploy:deploy 600` OK |
| SITE_URL | `grep -c '^NEXT_PUBLIC_SITE_URL=https://staging.tamihomes.vn$'` | `1` OK |
| Tên biến cũ vs mới | `cut -d= -f1 \| sort \| sha256sum` | cả hai `db4a99bc…0831` → giống hệt |
| Giá trị (trừ SITE_URL) | `grep -v '^NEXT_PUBLIC_SITE_URL=' \| sha256sum` | cả hai `9ec62002…4b920` → giống hệt |
| Biến cấm | `grep -cE '^(TRUST_\|BACKUP_\|APP_ENV)'` | `0` OK |
| Release dir | `stat`, `find ! -user deploy` | `deploy:deploy 700`, không file nào khác chủ |
| Symlink `current` | `readlink` | `/opt/tami/releases/staging/678b3568…` tuyệt đối — cùng dạng `activate_release` (`ln -sfn "$REPO_DIR"`, REPO_DIR = `cd … && pwd` tuyệt đối) và giống hệt server cũ |
| Nội dung release cũ vs mới | `find . -type f -exec sha256sum {} + \| sort -k2 \| sha256sum` | cả hai `f35c46aa…5add`, 32 file → giống hệt |
| Containers mới | `docker ps -a --filter name=tami-` | postgres/redis/seaweedfs `healthy`, seaweedfs-init `Exited (0)`; label project `tami-staging`; config_files `/opt/tami/releases/staging/current/docker/docker-compose.staging.yml` |
| Bind mount init.sql | `docker inspect --format '{{json .Mounts}}' tami-staging-postgres` | source `/opt/tami/releases/staging/current/docker/postgres/init.sql` (qua `current`, đúng đường dẫn deploy.sh dùng sau `activate_release`); volume `tami-staging_postgres-data` |
| Guard postgres image | `docker inspect .Config.Image` vs `compose config --images postgres` | cả hai `tami-postgis:17-3.5-bookworm` → `guard_postgres_image` qua |
| Compose có recreate không | `cd /home/deploy && sudo -u deploy -H … docker compose --env-file … -f …/current/… config --hash postgres,redis,seaweedfs,seaweedfs-init` | hash = label `com.docker.compose.config-hash` của cả 4 container (`3f1422a5…`, `f76b0a2a…`, `ec14f411…`, `8b462c2e…`) → `compose up -d postgres redis seaweedfs` của deploy.sh sẽ **không** recreate. rc=0 khi cwd = `/home/deploy` |
| cwd của CI | đọc `.github/actions/ssh-deploy/action.yml:119-122`, `deploy.sh` | CI chạy `bash <release>/scripts/deploy/deploy.sh …` qua ssh login user deploy → cwd = home `/home/deploy` (`deploy:deploy 750`, tồn tại). Lỗi "stat .: permission denied" chỉ xảy ra khi `sudo -u deploy` từ `/root`; với CI không xảy ra (đã chứng minh bằng lệnh compose ở trên chạy từ `/home/deploy`) |
| Row count DB | đếm toàn bộ bảng mọi schema (185 bảng, gồm tiger/topology) | danh sách `ROW <bảng> <n>` hash cả hai `40ff01ee…1e5c` → **giống hệt**; leads 34, media 829, news 38, payload_migrations 43, private_files 2, projects 71, rentals 59, spatial_ref_sys 8500; tiger/topology 36 bảng/8885 dòng hai bên. Cũ không đổi kể từ dump (không có ghi mới cần phân biệt) |
| Migration cuối | `payload_migrations ORDER BY id DESC LIMIT 1` | cả hai `20261017_031052_categories_developers` |
| Extensions | `pg_extension` + version + schema + owner | 7 ext giống hệt (fuzzystrmatch 1.2, pg_trgm 1.6, plpgsql, postgis 3.5.2, postgis_tiger_geocoder 3.5.2@tiger, postgis_topology 3.5.2@topology, unaccent 1.1), owner `tami` cả hai |
| Schema/owner/search_path/collation | `pg_namespace`, `pg_db_role_setting`, `pg_database` | giống hệt: tiger/tiger_data/topology owner tami; DB `search_path="$user", public, topology, tiger`; `en_US.utf8`; tiger/topology 162 hàm hai bên; 0 bảng public khác owner; 0 index invalid; tổng `last_value` sequence 17383 hai bên |
| SeaweedFS | `weed shell` `s3.bucket.list` + `fs.du` | cả hai: public size 454412160 / logical 453069295 / 3540 chunk; private 26696 / 2 chunk; fs.du khớp |
| CV private (không in tên/nội dung) | trong container: hash từng file qua filer nội bộ → hash danh sách đã sort, in 16 ký tự | cả hai `files 2`, `3a27e00d5a2c0e62` → nội dung giống hệt (bổ sung phần builder chưa kiểm) |
| Staging cũ | `curl …:3011/api/health`; seaweedfs | `200`; `tami-staging-seaweedfs` started 04:12:41Z healthy; staging app/jobs/postgres/redis uptime 2 ngày/2 tuần (không bị restart) |
| Production cũ | `docker ps`, StartedAt/RestartCount, `curl …:3010/api/health` | `200`; tami-app/jobs started 2026-11-02, postgres/redis/backup 2026-10-23, tami-seaweedfs 2026-11-02 (restarts=5 có từ trước) → không đụng |
| Transfer | `stat` | `/opt/tami/transfer` `deploy:deploy 700`, dump `deploy:deploy 600` OK |
| Host mới | `free -h`, `df -h /` | used 3.5Gi, available 4.3Gi, swap 52Mi/4.0Gi; đĩa 36% |
| Dự án khác | `docker ps`, `docker inspect` Created/StartedAt/working_dir | supabase-* (babyai) + airoom-b1-* uptime/trạng thái y như phase-2-task-01 (unhealthy có sẵn: airoom-b1-api, supabase-rest, supabase-storage). **outfit-changer: xem MINOR-1** |

## Phân tích quyết định restore (Decision log)

`DROP EXTENSION … CASCADE` + `DROP SCHEMA tiger,tiger_data,topology CASCADE` trên DB mới trống rồi restore nguyên dump: **không thấy rủi ro còn lại**.
- Extension do dump tạo lại → owner `tami`, cùng version, cùng schema như cũ (đã so).
- `search_path` mức DB (do `postgis_tiger_geocoder`/init.sql đặt qua `ALTER DATABASE`, không nằm trong `pg_dump` không `-C`) vẫn còn và khớp cũ → `topology`/`tiger` vẫn trong path.
- Đối tượng tiger/topology: 36 bảng, 8885 dòng, 162 hàm — khớp cũ.
- Cùng image `tami-postgis:17-3.5-bookworm` + `en_US.utf8` → không lệch collation; 0 index invalid.
- Lần CI đầu: init.sql chỉ chạy khi volume trống → không chạy lại.

## Rủi ro cho phase-2-task-03 (deploy CI đầu)

1. `guard_postgres_image` qua (image khớp); compose hash khớp ⇒ postgres/redis/seaweedfs không bị recreate; `activate_release` đổi `current` sang SHA mới nhưng bind source vẫn qua `current` nên không đổi.
2. `/opt/tami/state` trống và chưa có `tami-staging-app` ⇒ `read_previous_image` rỗng ⇒ deploy.sh WARN "không thể rollback tự động" nếu lần đầu fail. Chấp nhận được cho lần dựng đầu, nhưng task-03 cần ghi nhận (fail → sửa tay, staging cũ vẫn dự phòng).
3. Nếu commit triển khai đổi `docker-compose.staging.yml` ở service postgres/redis/seaweedfs thì hash đổi ⇒ recreate (giữ volume) — hành vi bình thường như server cũ.
4. Turnstile: `TURNSTILE_SITE_KEY/SECRET` sao nguyên — widget chỉ chạy trên hostname đã khai trong Cloudflare; phải xác nhận `staging.tamihomes.vn` đã có trong danh sách hostname của site key, nếu không form lead/newsletter trên domain mới sẽ fail (MINOR-2).

## Responsive Checklist Gate

N/A — task ops, không đụng UI.

## Skill gates

- aislop: N/A — không đổi code (diff trong scope chỉ task file Markdown).
- oxlint (anti-slop): N/A — không đụng TS/JS.
- ocr (open-code-review): N/A — không có code diff.
- AI-readable: OK — task file rõ thứ tự, Decision log, evidence có số liệu; 0 indicator.
- ai-friendly-web: N/A — không đổi web public (domain chưa trỏ; thuộc phase sau).
- blitzstrike: N/A — không có endpoint/input mới; chỉ kiểm quyền file/secret (đều OK).

## Findings

**[CRITICAL]** — không có.

**[MAJOR]** — không có.

**[MINOR-1] Evidence sai về dự án khác trên server mới** — `tasks/feature-staging-new-server-nginx-tamihomes/phase-2-task-02.md:53` ghi "17 container dự án khác vẫn chạy" và chỉ nêu các unhealthy có sẵn. Thực tế lúc review: `outfit-changer-api-1` và `outfit-changer-worker-1` đang **crash-loop** (`Restarting`, RestartCount 17, ExitCode 1), tạo lại lúc 04:06:36Z; `outfit-changer-caddy-1` ở trạng thái `Created` (chưa start; bind 127.0.0.1:8088/8089 — không tranh cổng 80 với nginx). Nguyên nhân thuộc dự án outfit-changer, **không phải do task này**: `/opt/outfit-changer` (root) được dựng lại 04:01:29Z và thư mục cũ đổi tên `outfit-changer-old-20261106-0401`, working_dir container = `/opt/outfit-changer/deploy`, exit 1 (không phải 137/OOM), RAM available 4.3Gi. (`docker events` không dùng để quy trách nhiệm được vì crash-loop đẩy trôi bộ đệm sự kiện.)
Fix: sửa dòng evidence cho đúng (outfit-changer được redeploy song song bởi bên khác, api/worker crash-loop exit 1, không liên quan tami) và báo user/chủ dự án outfit-changer.

**[MINOR-2] Turnstile hostname chưa kiểm** — env sao nguyên (đúng chủ trương), nhưng site key Turnstile gắn danh sách hostname. Fix: trong phase-2-task-03 kiểm Cloudflare Turnstile widget đã có `staging.tamihomes.vn` (hoặc ghi vào Acceptance của task-03), trước khi coi form lead/newsletter PASS.

**[MINOR-3] Comment cũ trong env** — dòng comment đầu `/opt/tami/staging.env` (mới) vẫn ghi "TAMI staging (sslip.io)". Chỉ là comment, không phải giá trị; tuỳ chọn sửa ở task-03 để khỏi nhầm hai file env.

Ghi chú (không phải lỗi): acceptance "tải được mẫu" cho CV private — builder chỉ so size/chunk; reviewer đã bổ sung so hash nội dung 2 file private (khớp) mà không in tên/nội dung.

## Residual risk

- Không chạy app/jobs/migrate trên server mới (thuộc task-03) → hành vi runtime (S3 endpoint, Redis, health) chưa kiểm.
- Không xác nhận được cấu hình Turnstile phía Cloudflare (ngoài quyền).
- Dữ liệu tạo trên staging cũ sau 04:16Z sẽ không có ở server mới (task bước 7 đã có quy trình chạy lại).

## Verdict

**PASS** — không có CRITICAL/MAJOR. DB (185 bảng, migration, extension, schema, search_path), SeaweedFS (size/chunk + hash CV private), env (tên + giá trị trừ SITE_URL), release (32 file) đều khớp server cũ; quyền file đúng; guard postgres + compose hash bảo đảm deploy CI đầu không recreate/chặn; staging cũ và production cũ còn chạy (health 200), production không bị đụng. 3 MINOR chuyển cho builder/task-03.
