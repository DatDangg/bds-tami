Agent: reviewer

# Review — build/tami-website · layer-3-task-03 · round 1

- **Review level:** STRICT
- **Reason:** hạ tầng mạng / expose cổng trên server dùng chung, secret, thay đổi hành vi migrate lúc khởi động (`payload.config.ts`), cache policy (G1), đổi dependency runtime, sửa file shared (`sentry.server.config.ts` nạp ở cả app và jobs).
- **Blast radius:** `docker/Dockerfile` (image dùng chung app/jobs/migrate, promote staging→prod), `docker/docker-compose.{prod,staging}.yml` (toàn bộ runtime prod/staging: Postgres/Redis/SeaweedFS/app/jobs/migrate), `docker/nginx/*` (biên mạng công khai, chọn IP khách cho rate limit, cache header ảnh), `.dockerignore` (secret có lọt image không), `src/payload.config.ts` (mọi môi trường production: không còn tự migrate), `package.json`/`pnpm-lock.yaml` (`pg` thành dependency runtime), `sentry.server.config.ts` (instrumentation app + `scripts/jobs-runner.ts`), `docs/ARCHITECTURE.md` §5.1/§5.3/§6.2, `.env.example`, `next.config.ts` (chỉ comment).
- **Diff:** working tree so với HEAD `0e3a8d7` (+ untracked). Ngoài scope theo yêu cầu: `src/payload-types.ts` (CRLF), `tasks/tami-website/layer-4-task-03.md`, `layer-6-task-01.md`, `.context/progress.json` (quyết định G1 do primary ghi).

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 (63 files / 609 tests PASS) |
| `pnpm build` | exit 0 (`/vi`, `/en` SSG; `/api/*` dynamic) |
| `docker compose --env-file <fake.env> -f docker/docker-compose.staging.yml config -q` | exit 0 |
| `docker compose --env-file <fake.env> -f docker/docker-compose.prod.yml config -q` | exit 0 |
| `config --format json` (prod) | chỉ `app` có `ports` = `127.0.0.1:3010->3000`; jobs/postgres/redis/seaweedfs/seaweedfs-init: `[]`; mọi service có `mem_limit`; `restart: unless-stopped` (one-shot `no`); `EMAIL_FROM_ADDRESS:` (không giá trị) được resolve đúng từ `--env-file`; `migrate` chỉ xuất hiện với `--profile tools` |
| `pnpm install --frozen-lockfile` | không chạy lại (lockfile diff chỉ dời `pg` từ devDependencies sang dependencies, cùng version 8.23.1 — đã đọc diff) |
| `docker build` | không chạy lại (nặng, không bắt buộc); dựa vào evidence builder + đọc Dockerfile |

## Kiểm theo checklist được giao

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Cổng chỉ bind 127.0.0.1 | OK | compose prod:71, staging:71; config JSON xác nhận `host_ip: 127.0.0.1`; seaweedfs `-ip.bind=0.0.0.0` chỉ trong network nội bộ, không publish |
| Không secret trong file | OK | compose chỉ `${VAR:?}`; Dockerfile:25-34 placeholder chỉ ở stage `builder`, stage `runner` không kế thừa ENV đó; `.dockerignore` loại `.env`, `.env.*` (giữ `.env.example`, không chứa secret); redis password qua env (`$$` escape) |
| staging_db ≠ prod_db | OK | 2 instance Postgres riêng (project `tami` / `tami-staging`, network `tami-net` / `tami-staging-net`, volume tách theo project); prod compose chỉ đọc `DATABASE_URL_PROD`, staging chỉ `DATABASE_URL_STAGING`. Host `postgres` resolve trong network riêng nên chuỗi URL giống nhau vẫn trỏ 2 DB khác nhau (xem MINOR-5 về câu chữ) |
| TRUST_CF_CONNECTING_IP an toàn | OK (kèm residual) | `tami-cloudflare-ips.conf`: 15 dải IPv4 + 7 dải IPv6 khớp danh sách Cloudflare công bố, `deny all` cuối; include ở mức `server` → kế thừa vào mọi location (không location nào khai access riêng). `location = /api/metrics { return 404; }` chạy ở pha rewrite trước access → peer lạ nhận 404 thay vì 403, vô hại. Không có đường public tới app bỏ qua Nginx (chỉ loopback). `client-ip.ts` không đọc XFF. Residual: process khác trên host dùng chung có thể gọi thẳng `127.0.0.1:3010` và giả header; dải IP Cloudflare dùng chung (AOP đang comment, chờ user) |
| G1 header không bị strip | OK | Không `proxy_hide_header`/`expires`/`add_header` trong location nào; `proxy_cache off` mọi location; `add_header` chỉ ở mức server nên không đụng `Cache-Control` upstream |
| Staging noindex + basic auth, không lộ Authorization | OK (kèm MAJOR-1) | staging.conf:36-40: `auth_basic` mức server, `proxy_set_header Authorization ""` (giá trị rỗng → nginx không gửi header), `X-Robots-Tag ... always` mức server, kế thừa vào location vì location không có `add_header` |
| Dockerfile non-root / không .env / không map | OK | `USER node` (Dockerfile:48), COPY `--chown=node:node`; `find .next -name '*.map' -delete` (36); prod-deps `--prod`; context loại `.env*` |
| jobs SIGTERM êm | OK | compose:88 node trực tiếp làm PID 1 (không qua pnpm), `stop_grace_period: 60s`; evidence builder: `docker stop` exit 0, log "runner đã dừng" |
| 1 bản jobs | OK | `container_name` cố định chặn `--scale`; comment + ARCHITECTURE §6.2 ghi rõ |

## Đánh giá thay đổi ngoài scope

1. **`src/payload.config.ts:77` `prodMigrations` theo `AUTO_MIGRATE_ON_START`** — đúng và cần thiết: adapter chạy `prodMigrations` khi connect ở `NODE_ENV=production`, app + jobs + (sau này 2 bản app) sẽ migrate đua nhau; ARCHITECTURE §6.4 vốn yêu cầu migrate là bước riêng. Builder có evidence (0 bảng khi không bật, 17 bảng khi bật). Không ảnh hưởng dev (`prodMigrations` chỉ dùng ở production). Chấp nhận. Thiếu test tự động (MINOR-3).
2. **`pg` → dependencies** — đúng: `src/lib/health/probes.ts:2` `import { Pool } from "pg"` chạy lúc runtime; pnpm isolate nên dependency bắc cầu của `@payloadcms/db-postgres` không resolve được từ code app khi cài `--prod`. Cùng version, lockfile diff tối thiểu. Chấp nhận.
3. **`sentry.server.config.ts:7`** — fix hợp lý (ESM nạp CJS qua cjs-module-lexer thiếu named export → lấy `default`). Nhánh Next/Turbopack: bản ESM không có `default` nên giữ namespace. Typecheck/build PASS. **Không có test tự động bao phủ** (không có test nào import `sentry.server.config` hay chạy `jobs-runner` bằng loader thật) → MINOR-3.

## Đánh giá lệch thiết kế

| Lệch | Kết luận |
|---|---|
| Không `output: standalone` (image ~2.5GB) | Chấp nhận: jobs/migrate cần payload CLI + loader TS + đủ deps; trace standalone không gồm. Đã ghi `next.config.ts` + ARCHITECTURE. Task Description dòng 27 vẫn ghi "Next standalone" (MINOR-4) |
| SeaweedFS riêng từng môi trường | Chấp nhận, tăng cô lập dữ liệu/khoá; ARCHITECTURE §6.2 đã ghi as-built. Tổng RAM ước tính chưa cập nhật (MINOR-5) |
| jobs `mem_limit` 384m | Chấp nhận, có số đo ~190MB; doc cập nhật |
| Không read_only/tmpfs | Chấp nhận, lý do kỹ thuật rõ (SWC native addon cần ghi+exec); còn `cap_drop: ALL` + `no-new-privileges` |
| Bỏ `real_ip_header CF-Connecting-IP` | **Đúng bản chất bảo mật**: realip đổi `$remote_addr` ở pha post-read, trước pha access, nên `allow` dải Cloudflare sẽ so với IP khách và chặn tất cả (hoặc phải dùng `$realip_remote_addr` + map/if). Cách hiện tại: Nginx xác thực peer = Cloudflare, app tin `CF-Connecting-IP` qua cờ; log có cả 2 IP. Trái chữ AC nhưng đạt mục tiêu AC; cần ghi lệch vào AC (MINOR-4) |
| Không mở cổng 80 | Chấp nhận (Cloudflare Full strict + Always Use HTTPS; `return 301` không gate được bằng access) |
| Domain `REPLACE_WITH_*` | Chấp nhận (task deploy thay; `nginx -t` vẫn qua) |
| Authenticated Origin Pulls comment | Chấp nhận — follow-up layer-1-task-06 yêu cầu **hỏi user**; giữ nguyên trong residual risk |

## Findings

### [MAJOR]

**MAJOR-1 — Ảnh staging lọt qua basic auth nhờ cache Cloudflare** — `docker/nginx/tami-staging.conf:66-71` (cùng `:36-37`).
Staging truyền nguyên `Cache-Control: public, max-age=31536000, immutable` của `/api/media/file/*` (G1). Cloudflare mặc định cache theo đuôi file (`.webp`/`.jpg`/`.pdf`...) và với `public` thì được phép lưu cả response của request có `Authorization` (RFC 9111 §3.5). Sau lần đầu một người có basic auth tải ảnh, edge trả cache HIT cho **bất kỳ ai** biết URL mà không qua Nginx → vi phạm AC "staging chặn truy cập công khai". Tên file Payload là tên upload gốc (đoán được), ảnh dự án chưa công bố có thể lộ. Lỗi phát sinh ngay khi layer-4-task-03 đặt header; cấu hình staging của task này là chỗ chặn hợp lý.
Fix đề xuất (chọn 1, ghi vào task):
- (a) Trong `tami-staging.conf` location `^~ /api/media/file/`: `proxy_hide_header Cache-Control;` + `add_header Cache-Control "private, no-store" always;` — **lưu ý** khai `add_header` trong location làm mất kế thừa, phải lặp lại `X-Robots-Tag` + 4 header bảo mật (hoặc tách ra snippet include); hoặc
- (b) Chốt Cloudflare Access cho host staging **và** cache rule "Bypass cache" cho host staging, ghi bắt buộc vào `layer-6-task-01` + comment trong `tami-staging.conf` (khi đó cần người duyệt chấp nhận rằng chặn nằm ở Cloudflare).
Prod không bị ảnh hưởng (ảnh public là chủ đích G1).

### [MINOR]

**MINOR-1 — Prometheus không scrape được `127.0.0.1:3010` nếu chạy trong container** — `docker/docker-compose.prod.yml:71`, `docker/nginx/tami.conf:53`, `docs/ARCHITECTURE.md:156`.
Port chỉ bind loopback của host; Prometheus của stack giám sát dùng chung (thường là container) có `127.0.0.1` của riêng nó và không tới được host-loopback. Đề xuất: ghi rõ ở task monitoring/deploy (layer-6) cách scrape — Prometheus `network_mode: host`, hoặc nối Prometheus vào `tami-net` và scrape `tami-app:3000` (kèm Bearer). Không chặn task này.

**MINOR-2 — `http2 on;` cần nginx ≥ 1.25.1** — `tami.conf:19`, `tami-staging.conf:21`.
Builder test bằng `nginx:alpine` mới nhất; nginx host (Ubuntu 22.04 = 1.18, 24.04 = 1.24) sẽ fail `nginx -t` với directive này. Đề xuất: comment ghi phiên bản tối thiểu + phương án `listen 443 ssl http2;` cho bản cũ; task deploy kiểm `nginx -v` trước.

**MINOR-3 — Thiếu test tự động cho 2 thay đổi runtime ngoài scope** — `src/payload.config.ts:77`, `sentry.server.config.ts:7`.
Cả hai chỉ có evidence chạy tay (compose). Đề xuất: test nhỏ khẳng định `prodMigrations` là `undefined` khi không đặt cờ / là mảng khi `"true"` (tách thành hàm `resolveProdMigrations(env)`), và test interop `default` vs namespace cho lựa chọn `Sentry` (tách helper thuần).

**MINOR-4 — Task file AC/Description lệch as-built** — `tasks/tami-website/layer-3-task-03.md:27` ("Next standalone"), `:40` (AC tick `[x]` nhưng ghi `real_ip_header CF-Connecting-IP`).
Đề xuất ghi chú lệch ngay trong AC (không dùng realip vì lý do pha access; không standalone vì jobs/migrate), tránh spec-validator đánh FAIL vì AC chữ.

**MINOR-5 — Doc/env lệch nhỏ** —
- `docs/ARCHITECTURE.md` §6.2 dòng "Tổng ước tính ~4–5GB RAM" chưa cập nhật theo `mem_limit` as-built (prod ≈ 3.8GB + staging ≈ 2.0GB + giám sát ~1GB ≈ 6.8GB trần).
- `docker/docker-compose.{prod,staging}.yml:12` nhắc "khối PRODUCTION/STAGING trong .env.example" nhưng `.env.example` chỉ có 1 khối chung "Docker Compose staging/prod".
- `.env.example:78-79` ví dụ `DATABASE_URL_STAGING`/`_PROD` giống hệt nhau trong khi comment dòng 69 nói "PHẢI khác nhau" — nên giải thích: tách biệt nhờ instance/network riêng, mật khẩu phải khác.

**MINOR-6 — `seaweedfs-init` nuốt lỗi** — compose prod/staging `:197` `|| true`: lỗi tạo bucket (vd sai khoá) bị bỏ qua; chỉ lộ ra khi `/api/health` báo `storage` hỏng. Đề xuất phân biệt "bucket đã tồn tại" với lỗi khác, hoặc kiểm `s3.bucket.list` sau vòng lặp và `exit 1` nếu thiếu.

**MINOR-7 — Image chứa `.next/cache` của lần build** — `docker/Dockerfile:36,51`: copy cả `.next` gồm cache build (tăng kích thước, không phải lỗi bảo mật). Đề xuất `rm -rf .next/cache/*` (giữ thư mục) trong stage builder trước khi copy.

**MINOR-8 (residual cho layer sau) — `NEXT_PUBLIC_SITE_URL=http://localhost:3000` lúc build** — `docker/Dockerfile:34`. Hiện chưa có `metadataBase`/sitemap/robots dùng biến này trong `src/app` (grep rỗng) và env đọc qua zod object (không bị inline), nhưng `/vi`, `/en` là SSG lúc build: khi layer SEO dùng `getEnv().NEXT_PUBLIC_SITE_URL` trong trang prerender, HTML build-time sẽ chứa `localhost:3000` cho tới khi revalidate. Đề xuất ghi follow-up cho task SEO (layer 4): trang dùng URL tuyệt đối phải dynamic/ISR hoặc đọc lúc chạy.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` chưa cài (command not found) |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`); `pnpm lint` (eslint) PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — 0–1 indicator: comment chủ yếu WHY; `sentry.server.config.ts:7` một dòng dài nhưng rõ; không hàm >50 dòng, không indirection; ARCHITECTURE cập nhật luồng deploy/migrate |
| ai-friendly-web | N/A — task hạ tầng, chưa có trang public mới (robots/sitemap thuộc layer SEO) |
| blitzstrike | skip, không có môi trường được phép (không deploy/SSH ở task này) |
| Responsive Checklist Gate | N/A — diff không đụng route/component/CSS |
| Migration gate | OK — không tạo migration; đổi cách chạy (bước riêng `migrate`, không tự migrate lúc start) phù hợp ARCHITECTURE §6.4 |

## Residual risk

- Không tự `docker build` lại; dựa evidence builder (non-root, không `.env`/`*.map`, không devDeps top-level).
- Nginx chỉ được kiểm bằng đọc cấu hình (không chạy `nginx -t` lại); phiên bản nginx host chưa biết (MINOR-2).
- Process khác trên host dùng chung gọi thẳng `127.0.0.1:3010/3011` có thể giả `CF-Connecting-IP`; Docker < 28 có lỗ hổng publish-loopback truy cập được từ LAN cùng L2 — task deploy nên kiểm phiên bản Docker.
- Dải IP Cloudflare dùng chung mọi khách hàng → Authenticated Origin Pulls (đang comment) cần user quyết định ở task deploy.
- `proxy_set_header Authorization ""` ở staging làm API key Payload (header `Authorization`) không dùng được qua Nginx staging — chấp nhận được, admin dùng cookie.

## Verdict

❌ **FAIL** — 1 MAJOR (MAJOR-1: ảnh staging bỏ qua basic auth qua cache Cloudflare). Các phần cốt lõi (bind loopback, secret, tách DB, allow/deny Cloudflare, G1 header prod, non-root image, migrate tách bước, SIGTERM jobs, 1 bản jobs) đạt. Builder sửa MAJOR-1 (và nên xử lý MINOR-2/4/5 vì rẻ) rồi review round 2.
