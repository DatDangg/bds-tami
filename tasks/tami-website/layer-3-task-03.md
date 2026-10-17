# Task 03: Dockerfile + Compose staging/prod + cấu hình Nginx host

## Layer
3 — Bộ field nội dung dùng chung + giám sát app + Docker

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — hạ tầng mạng/expose cổng trên server dùng chung, secret
- Blast radius: docker/Dockerfile (multi-stage, user non-root, HEALTHCHECK `/api/health`); docker/docker-compose.prod.yml, docker/docker-compose.staging.yml; docker/nginx/tami.conf, tami-staging.conf; …
- Doc impact (dự kiến): ARCHITECTURE §6 nếu cổng/service khác; ARCHITECTURE §5.1/§5.3 ghi URL media thật `/api/media/file/*` + ngoại lệ cache (G1)
- Decision impact: NO

## Requirements
- NFR-02, NFR-04, NFR-10
- ARCHITECTURE §6.1–§6.3, §7 (mạng)
- SPECIFICATIONS § Deployment
- .devops/templates/docker-vps.md

## Description
Image production (Next, **không** `output: standalone` — lệch có chủ đích: `jobs`/`payload migrate` cần `payload` CLI + loader TS + đủ dependency production nên image mang `node_modules` prod + `.next`) dùng chung cho `app` và `jobs`; compose riêng cho staging và production; file Nginx cho host.

## Dependencies
- `layer-2-task-06` `GET /api/health` (DB, Redis, S3) (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)

Mở khoá cho: `layer-4-task-05`, `layer-4-task-06`, `layer-4-task-07`, `layer-6-task-01`

## Acceptance Criteria
- [x] Compose project riêng, container tiền tố `tami-` / `tami-staging-`, network riêng
- [x] Chỉ app bind cổng: prod `127.0.0.1:3010`, staging `127.0.0.1:3011`; Postgres/Redis/SeaweedFS không publish cổng
- [x] Mỗi service có `mem_limit` theo ARCHITECTURE §6.2; `restart: unless-stopped`; log driver phù hợp Loki
- [x] Service `jobs` dùng cùng image, chạy `pnpm jobs`
- [x] Nginx: chỉ nhận dải IP Cloudflare (`allow`/`deny`; **lệch có chủ đích: KHÔNG dùng `real_ip_header CF-Connecting-IP`** vì module realip đổi `$remote_addr` thành IP khách ở pha post-read, trước pha access, nên `allow`/`deny` dải Cloudflare sẽ chặn nhầm tất cả; thay vào đó Nginx chuyển nguyên `CF-Connecting-IP` và app tin header qua `TRUST_CF_CONNECTING_IP=true`, log ghi cả hai IP), `/admin` + `/api` không cache — **trừ `/api/media/file/*`** (G1 (user chốt 2026-10-17, phương án a): ngoại lệ cache cho ảnh `/api/media/file/*`: `Cache-Control: public, max-age=31536000, immutable`, Nginx không ghi đè/strip header này), staging thêm `X-Robots-Tag: noindex` và chặn truy cập công khai (Cloudflare Access hoặc basic auth); **staging ghi đè `/api/media/file/*` thành `Cache-Control: private, no-store`** (round-1 MAJOR-1: tránh Cloudflare cache ảnh rồi phát cho người chưa qua basic auth), prod giữ header immutable của app
- [x] Staging và prod dùng DB/Redis/bucket khác nhau (`DATABASE_URL_STAGING` ≠ `DATABASE_URL_PROD`)
- [x] `docker build` thành công local; image không chứa `.env`, source map public, devDependencies

## Tests cần viết
- `docker build` + `docker compose -f docker/docker-compose.staging.yml config` hợp lệ
- Chạy image local với DB dev: `/api/health` 200
- `nginx -t` trên file cấu hình (container nginx tạm) nếu có thể; không đụng server thật

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-3-task-03-round-<R>-review.md`

## Migration
- Không tạo migration. Container app **không** tự chạy migrate khi start; migrate là bước riêng trong pipeline deploy.

## Retry / Error Memory
- Attempt: 2 (builder, sau reviewer round 1 FAIL: MAJOR-1 cache ảnh staging lọt basic auth). Root cause MAJOR-1: Nginx staging truyền nguyên `Cache-Control: public, immutable` của G1 nên CDN được phép lưu response của request có Authorization rồi phát công khai. Fix: Nginx staging ghi đè header trong location media (xem Feature Verification attempt 2). Attempt 1 (builder) — không có attempt fail; các lỗi gặp khi chạy thử (SWC cache read_only, pg devDependency, Sentry namespace, SIGTERM qua pnpm) được sửa ngay trong attempt này
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: builder tự kiểm — đáp ứng hết (xem Evidence bên dưới); chờ Reviewer STRICT
- Verify commands + result (17/10/2026, host Windows + Docker 29.8 local):
  - `pnpm install --frozen-lockfile` OK · `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 63 files / 609 tests PASS · `pnpm build` OK
  - `docker build -f docker/Dockerfile` OK (~2.5GB; node_modules prod 1.4GB). Image: user `node` (uid 1000), không có `.env*`, không có `*.map`, không có vitest/eslint ở top-level node_modules, symlink `.next/node_modules/*` đều resolve; HEALTHCHECK `/api/health`.
  - `docker compose config -q` staging + prod OK (env file test); thiếu biến bắt buộc → lỗi nêu tên biến. Chỉ `app` có `ports`: `127.0.0.1:3011` / `127.0.0.1:3010`; mọi service có `mem_limit`, `restart: unless-stopped` (trừ one-shot), log json-file xoay vòng.
  - Chạy thật bản staging bằng compose staging (project `tami-staging`, Postgres/Redis/SeaweedFS riêng, đã `down -v` dọn): `migrate` (6 migration) OK → `app` healthy, `/api/health` 200 `{db:up,redis:up,storage:up}`, `/`, `/en`, `/admin` 200, `/api/metrics` 401 không token / 200 có token; `jobs` chạy, mem ~190MiB; SIGTERM: `docker stop` <1s, exit 0, log "runner đã dừng".
  - Không tự migrate khi khởi động: DB trống + app/jobs không đặt `AUTO_MIGRATE_ON_START` → 0 bảng; đặt `true` → 17 bảng (chứng minh guard cần thiết).
  - `nginx -t` (container nginx:alpine tạm, đã xoá) cho tami.conf + tami-staging.conf OK. Thử chức năng: peer không phải Cloudflare → 403 (kể cả giả `CF-Connecting-IP`); peer giả lập CF → 200, `CF-Connecting-IP` chuyển nguyên (2 IP khác nhau tới app là 2 giá trị khác nhau); `/api/media/file/*` giữ `Cache-Control: public, max-age=31536000, immutable` do upstream đặt; `/api/*` giữ `no-store`; `/api/metrics` 404; staging: 401 khi thiếu basic auth, `X-Robots-Tag: noindex, nofollow, noarchive`, header `Authorization` không xuống app.
  - Skip có lý do: smoke test rate-limit 2 IP thật qua Cloudflare, mTLS Authenticated Origin Pulls, chạy compose prod thật, push image — thuộc task deploy/Cloudflare, không SSH/deploy ở task này.
- **Attempt 2 (17/10/2026) — xử lý reviewer round 1:**
  - MAJOR-1: `tami-staging.conf` location `^~ /api/media/file/`: `proxy_hide_header Cache-Control` + `add_header Cache-Control "private, no-store" always` + lặp lại `X-Robots-Tag` và 4 header bảo mật (add_header trong location làm mất kế thừa; có comment nhắc sửa đồng bộ). Thử thật container `nginx:alpine` (1.31.7) với stub upstream trả `public, immutable`: staging media (có basic auth) = `Cache-Control: private, no-store` + `X-Robots-Tag: noindex, nofollow, noarchive` + HSTS/nosniff/X-Frame-Options/Referrer-Policy; thiếu auth = 401; staging path khác vẫn có đủ header kế thừa; prod media giữ `public, max-age=31536000, immutable` + 4 header bảo mật. Container tạm đã xoá.
  - MINOR-2: đổi `http2 on;` thành `listen 443 ssl http2;` (+IPv6) ở cả 2 conf — chạy được trên nginx 1.18 (Ubuntu 22.04) và 1.24 (24.04); `nginx -t` PASS trên `nginx:1.18-alpine` (bản này sẽ fail với `http2 on;`) và `nginx:alpine` 1.31.7 (chỉ cảnh báo deprecated). Ghi lý do trong conf + ARCHITECTURE.
  - MINOR-3: tách `resolveProdMigrations` (`src/lib/payload/prod-migrations.ts`) và `pickSentryExports` (`src/lib/monitoring/sentry-options.ts`), dùng trong `payload.config.ts` / `sentry.server.config.ts`; thêm 5 test (cờ chỉ bật khi đúng chuỗi `true`; interop `default` vs namespace).
  - MINOR-4: ghi các lệch (không standalone, bỏ `real_ip_header`, staging media no-store) trực tiếp vào Description/AC ở trên.
  - MINOR-5: ARCHITECTURE §6.2 tổng RAM theo `mem_limit` as-built (prod ≈ 3,8GB + staging ≈ 2,0GB + giám sát ~1GB ≈ 6,8GB); comment compose trỏ đúng khối "Docker Compose staging/prod" của `.env.example`; `.env.example` giải thích vì sao 2 ví dụ `DATABASE_URL_*` giống nhau (instance Postgres/network riêng, mật khẩu thật khác).
  - MINOR-6: `seaweedfs-init` bỏ `|| true`; chỉ bỏ qua lỗi "already exists", lỗi khác `exit 1`. Thử thật với SeaweedFS 4.48: bucket có sẵn → exit 0; tên bucket sai → exit 1 kèm thông báo; chạy lại qua compose staging exit 0.
  - MINOR-7: Dockerfile `rm -rf .next/cache` ở stage builder; image 2.5GB → 2.13GB, `.next/cache` rỗng (thư mục vẫn do runner tạo, ghi được bởi `node`).
  - Verify: `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` FULL sau lần sửa cuối: 64 files / 614 tests PASS · `pnpm build` OK · `docker compose config -q` staging + prod OK (env file giả) · `docker build` OK, chạy compose staging thật (project `tami-staging`, image tạm): migrate OK, `app` healthy, `/api/health` 200 `{db:up,redis:up,storage:up}`; đã `down -v` và `docker rmi` image tạm. Không đụng container `tami-*` của project dev đang chạy.
- Follow-up (không chặn task, chuyển cho task sau):
  - MINOR-1 (layer-6 monitoring/deploy): Prometheus dùng chung nếu chạy trong container không tới được `127.0.0.1:3010/3011` của host; chọn `network_mode: host` cho Prometheus, hoặc nối Prometheus vào network `tami-net` / `tami-staging-net` và scrape `tami-app:3000` kèm Bearer `METRICS_TOKEN`.
  - MINOR-8 (layer 4 SEO): image build với `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (placeholder build-time); trang prerender (SSG `/vi`, `/en`) dùng URL tuyệt đối (metadataBase/sitemap/canonical) sẽ chứa `localhost:3000` tới khi revalidate -> task SEO phải dùng dynamic/ISR hoặc đọc URL lúc chạy.
  - Task deploy: kiểm `nginx -v` và `docker version` (>= 28 để tránh lỗi publish loopback) trên server; chọn Authenticated Origin Pulls (hỏi user); rule Cache của Cloudflare cho `/api/media/file/*` chỉ áp host prod, không áp staging.
- Reviewer verdict: round 1 FAIL (MAJOR-1 ảnh staging public → Cloudflare cache lọt basic auth) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-3-task-03-round-2-review.md`). Residual: MINOR-R2-1 đã ghi vào AC layer-6-task-01 (rule cache chỉ host prod); MINOR-R2-2 static staging (`/_next/static`, public/) có thể bị Cloudflare cache theo đuôi → bypass cache toàn host staging hoặc Cloudflare Access ở layer-6-task-01; seaweedfs-init exit code chỉ kiểm trên SeaweedFS 4.48; 5 header lặp ở tami-staging.conf phải sửa đồng bộ
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-3.md`)

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5.1 (ngoại lệ cache `/api/media/file/*`, Nginx 404 `/api/metrics`), §5.3 (URL media thật), §6.2 (SeaweedFS riêng mỗi môi trường, jobs 1 bản + `mem_limit` 384m, khối as-built: image, migrate riêng, Nginx) cập nhật như as-built. `.env.example` thêm khối compose. `next.config.ts` cập nhật comment (không dùng standalone). `docs/API_SPEC.md`/`ERD.md`: no doc impact (không đổi API/schema)
- Decision log: G1 phương án a (user 2026-10-17); bỏ `real_ip_header` (realip ghi đè $remote_addr trước allow/deny); không `output: standalone` (jobs/migrate cần payload CLI); migrate qua service `migrate` (AUTO_MIGRATE_ON_START mặc định tắt); SeaweedFS riêng từng môi trường; jobs đúng 1 bản (G6)

## Commit / Tracking
- Commit gợi ý: `feat(layer-3): task-03 docker` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-3/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- docker/Dockerfile (multi-stage, user non-root, HEALTHCHECK `/api/health`)
- docker/docker-compose.prod.yml, docker/docker-compose.staging.yml
- docker/nginx/tami.conf, tami-staging.conf
- .dockerignore
- .env.example (khối staging/prod)

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G1 (MEDIUM, ĐÃ CHỐT 2026-10-17: phương án a — ngoại lệ cache, đã ghi vào AC Nginx) — ảnh đang serve qua /api/media/file/* (payload.config.ts:74-79 không generateFileURL) trong khi ARCHITECTURE §5.1 cấm cache /api/*: hoặc thêm ngoại lệ cache immutable cho /api/media/file/* (task này + layer-4-task-03 + rule Cloudflare layer-6-task-01), hoặc đổi cách phục vụ ảnh.
- KHÔNG SSH vào server ở task này. Mọi thao tác trên server làm ở task deploy-staging/production có user duyệt.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-1-task-04
- `src/lib/fonts.ts` dùng `next/font/google`: `next build` tải font từ Google Fonts nên bước build trong Dockerfile/CI cần mạng ra ngoài tới Google Fonts. Nếu build bị cô lập mạng thì chuyển sang `next/font/local` (tải sẵn file woff2 vào repo).

## Follow-up từ review layer-1-task-06 (16/10/2026) — BẮT BUỘC
- [x] Đặt `TRUST_CF_CONNECTING_IP=true` cho staging và production (thiếu cờ → mọi khách chung bucket rate limit `unknown` → 1 kẻ spam chặn form lead toàn site).
- [x] Nginx: chỉ allow dải IP Cloudflare + `deny all`; cổng app chỉ bind 127.0.0.1, không lộ trực tiếp.
- [x] Nginx chuyển nguyên header `CF-Connecting-IP` (không ghi đè/không nhận từ client ngoài Cloudflare).
- [ ] Đề xuất bật Cloudflare Authenticated Origin Pulls (mTLS) vì dải IP Cloudflare dùng chung mọi khách hàng — hỏi user. → chuyển AC `layer-6-task-01` (khối conf đã có, đang comment).
- [ ] Smoke test: 2 IP khác nhau rơi vào 2 bucket khác nhau. → chuyển AC `layer-6-task-01` (cần Cloudflare thật).
- [x] Từ review layer-1-task-07: đặt bắt buộc `APP_ENV=production` (prod) / `APP_ENV=staging` + `EMAIL_ALLOWLIST` (staging) cho cả service `app` và `jobs`; service `jobs` chạy `pnpm jobs` (image cần `payload` CLI + loader TS).
- [x] Từ review layer-1-task-07 round 2: service `jobs` đặt `stop_grace_period: 60s` (worker chờ vòng đang chạy, tối đa 10 job SMTP); cân nhắc timeout cho nodemailer; kiểm SIGTERM thật trên Linux và job kẹt `processing=true` sau SIGKILL. — đã đặt `stop_grace_period: 60s`, SIGTERM êm đo trên Docker local; còn timeout nodemailer + job kẹt sau SIGKILL → kiểm ở `layer-6-task-01`.
