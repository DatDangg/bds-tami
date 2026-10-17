Agent: spec-validator

# Spec Validation: build tami-website, đóng layer 3 (round 1)

- Mode: Phase review (đóng layer, initial build)
- Scope: `tasks/tami-website/layer-3-task-01.md`, `layer-3-task-02.md`, `layer-3-task-03.md`; commit 383d39f, 0e3a8d7, 03ba054 (HEAD 03ba054).
- Ngoài scope: `layer-2-task-02` (vẫn BLOCKED chờ data địa giới hành chính).
- Nguồn đã đối chiếu: SPECIFICATIONS.md (NFR-02/04/08/10 `:149-157`, § Deployment `:196-206`), docs/BRD.md (BR-02..05/07 `:184-189`, FR-ADM-01..05 `:158-162`), docs/PERMISSION.md §2/§3.1/§4/§6, docs/ERD.md §1/§1.1/§4.3/§4.9/§4.9b/§4.14, docs/ARCHITECTURE.md §4/§5.1/§5.3/§5.4/§6.1-§6.3/§7/§8, docs/API_SPEC.md, `.context/project-config.md`, `.context/progress.json` (decision G1, dòng 188), report reviewer round cuối của 3 task, code `src/**`, `docker/**`, `scripts/jobs-runner.ts`.
- Verify (read-only, Docker dev `tami-*` đang chạy, HEAD 03ba054):
  - `pnpm test`: exit 0, **64 file / 614 test PASS** (có integration chạy DB thật). Vẫn còn cảnh báo deprecation `pg` "client.query() when already executing", đã biết từ layer 2.
  - `pnpm lint`: exit 0
  - `pnpm typecheck`: exit 0
  - `pnpm build`, `docker build`, `nginx -t`: không chạy lại. Lấy theo evidence của builder và reviewer (L3-T03 r2: chạy `nginx -t` trên 1.18 và 1.31.7, có thử chức năng).
- Working tree: `src/payload-types.ts` chỉ khác CRLF (`git diff --ignore-cr-at-eol` rỗng). File `.context/runs/build-tami-website-layer-3-validate.md` là journal của primary.

## Verdict: ✅ COMPLETE (PASS), kèm follow-up bắt buộc phải gắn vào task trước khi chạy layer 4

Toàn bộ 18 AC của 3 task đều có code, có test hoặc evidence chạy thật, và reviewer đã PASS ở mức STRICT. Không có [MISSING] nào so với AC của layer 3. Follow-up G4, G5, G6, R2, R3 của layer 2 đã đóng. G1 đã đóng phần thuộc layer 3 (Nginx).

Có 1 conflict cross-doc mức MEDIUM (G7) và 1 lỗ hổng về quy trình (G8: follow-up chưa được ghi vào AC task đích). Cả hai không làm sai AC của layer 3. Tuy vậy, **G7 và L3-T02 n2 phải được ghi vào AC của `layer-4-task-01` / `layer-5-task-02` trước khi chạy các task đó.** Nếu không, task layer 4/5 sẽ phải chọn giữa sao chép logic của factory (trái ghi chú L3-T02:101) và sai ERD.

## Coverage matrix

### layer-3-task-01: giám sát app

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Lỗi server/client gửi GlitchTip khi có DSN; không có DSN thì tắt êm | AC1, ARCH §8:307 | ✅ | `src/instrumentation.ts:6-18` (register + `onRequestError` → `Sentry.captureRequestError`); `sentry.server.config.ts:16`; `src/lib/monitoring/sentry-options.ts:39-73`; `src/instrumentation-client.ts`; DSN trình duyệt lấy lúc chạy qua `src/app/(payload)/api/monitoring-config/route.ts:15`; test `sentry-options.test.ts`, `tests/integration/monitoring-config.test.ts` |
| 2 | Logger redact `phone`, `email`, `fullName`, `message`, `password`, cookie, `authorization` | AC2, ARCH §8:309 | ✅ | `src/lib/logger.ts:7-19` (SENSITIVE_KEYS), `:27-34` (lồng tới 3 cấp), `:41-48` (serializer lỗi lọc qua `scrubText`); `src/lib/logger.test.ts` |
| 3 | Metrics (thời gian phản hồi, số 5xx, kết nối DB) chỉ truy cập được khi có token; Nginx không public | AC3, ARCH §5.1:156, §8:308 | ✅ | `src/app/(payload)/api/metrics/route.ts:16-27` (404 khi chưa có token, 401 khi sai token, `no-store`); `metrics-auth.ts:4-9` (so sánh thời gian hằng); `metrics.ts:102-126` (histogram, `requests_total` theo lớp status, pool DB); `docker/nginx/tami.conf:55-57`, `tami-staging.conf:63-65` (404); `tests/integration/metrics.test.ts`. Latency SSR lấy từ log Nginx `rt=$request_time` (`tami.conf:6`), có ghi ở ARCH §8:308 |
| 4 | Service name `tami-web`, env theo `APP_ENV` | AC4, project-config `otel_service_name` | ✅ | `src/lib/monitoring/service-name.ts`; `sentry-options.ts:42-47`; `sentry.server.config.ts:16` (`APP_ENV`) |
| 5 | (Follow-up G4) app và jobs không chết khi DB sập | spec-validation L2 G4 | ✅ đóng | `src/lib/monitoring/process-errors.ts:15-21`; `instrumentation.ts:10-11`; `scripts/jobs-runner.ts:11-18` (handler + `connectWithRetry`); ARCH §8:310 |
| 6 | (Follow-up G5) test session-refresh không chập chờn | spec-validation L2 G5 | ✅ đóng | `tests/integration/session-refresh.test.ts:41-44` (kiểm `payload && staffId`). Lần validate này 614/614 PASS |

### layer-3-task-02: bộ field + hook nội dung dùng chung

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 7 | Slug tự sinh từ `title` theo từng locale; trùng trong cùng collection + locale thì thêm hậu tố; sửa tay được | BR-05 (BRD:187), ERD §1.1:51 | ✅ | `src/fields/slug.ts:24-57,69-80`; `src/lib/slug.ts` `appendUniqueSuffix`; integration `content-defaults.test.ts` (vi/en, trùng, 80 ký tự). Redirect 301 khi đổi slug được hoãn có chủ đích sang `layer-6-task-03` |
| 8 | Trạng thái `draft → published → hidden` (rentals thêm `rented`); `status` dùng chung cho 2 ngôn ngữ | BR-02 (BRD:184), BR-07, ERD §1:22-27 | ✅ | `src/fields/status.ts:4-26` (không localized, mặc định `draft`) |
| 9 | Xoá mềm; chỉ admin khôi phục hoặc xoá hẳn; mỗi thao tác ghi audit | BR-03 (BRD:185), PERMISSION §3.1:48, §6:112 | ✅ | `content-defaults.ts:44-47,71` (`trash: true`, xoá hẳn chỉ admin); `src/hooks/guard-trashed-edit.ts:11-15` (sale không tự khôi phục được); `src/hooks/audit-content-delete.ts:27-46`; integration `:341-351` và test rollback khi audit lỗi |
| 10 | `author` tự gán, chỉ admin đổi; sale chỉ sửa/xoá bài của mình; sale đọc tất cả trong admin | BR-04, PERMISSION §2, §3.1, §4:84 | ✅ | `src/fields/author.ts:6-21`; `content-defaults.ts:73-79` (`isAuthorOrAdmin`, `makePublishedOnly`); `src/access/ownedByUserOrAdmin.ts:9-15` |
| 11 | `isFeatured` chỉ admin | PERMISSION §4:85 | ✅ | `src/fields/is-featured.ts:6-14` |
| 12 | `publishedAt` tự gán ở lần xuất bản đầu tiên, chỉ đọc ở mức Must | ERD §4.5:215, FR-ADM-16 (để sau) | ✅ | `src/fields/published-at.ts:9-23` |
| 13 | `hasEnglish` + `translation.*` chỉ đọc; `beforeValidate` chặn bật khi thiếu trường EN bắt buộc | BR-07, ERD §1.1:38-50, PERMISSION §4:90 | ✅ (Must) | `src/fields/translation.ts:5-27`; `src/hooks/require-english-fields.ts:62-79`. Ngoại lệ "`pages` chỉ admin bật" (PERMISSION §4:91) làm qua `fieldAccess`, xem n2 |
| 14 | Revalidate cả VI và EN: trang chi tiết, danh sách, trang chủ (khi `isFeatured`) | ARCH §5.1:152-154 | ✅ (mức code) | `src/hooks/revalidate-content.ts:47-88`; `src/lib/content/content-paths.ts:31-59` (đường dẫn nội bộ `/{locale}{key}`). Chưa quan sát trên cache Next thật vì chưa có route chi tiết |
| 15 | Versions (không dùng drafts), lịch sử phiên bản | FR-ADM-01..05 (BRD:158), ERD §1:19 | ✅ | `content-defaults.ts:18,72` (`maxPerDoc: 20`, `drafts: false`) |
| 16 | Document locking | SPEC § edge cases:169 | ✅ | Factory không tắt `lockDocuments`, nên giữ mặc định của Payload 3. Chưa kiểm trên UI (residual của reviewer) |
| 17 | Nhóm `seo` dùng chung, localized | ERD §4.14:470-480 | ✅ | `src/fields/seo.ts:9-21`; ERD:480 đã reconcile as-built (tự khai báo, không dùng plugin-seo) |

### layer-3-task-03: Docker + Compose + Nginx

| # | Requirement | Source | Status | Evidence |
|---|---|---|---|---|
| 18 | Compose project riêng, tiền tố `tami-` / `tami-staging-`, network riêng | SPEC Deployment:199, ARCH §6.1:219 | ✅ | `docker-compose.prod.yml:16,67,84`; `docker-compose.staging.yml:16,67,84,213` |
| 19 | Chỉ app bind `127.0.0.1:3010` (prod) / `127.0.0.1:3011` (staging); DB/Redis/SeaweedFS không publish cổng | SPEC:199, ARCH §6.1:220-221, §7:289 | ✅ | prod `:70-71`, staging `:70-71`; các service khác không có `ports` |
| 20 | `mem_limit` theo ARCH §6.2; `restart: unless-stopped`; log hợp Loki | ARCH §6.2:230-237 | ✅ | staging `:76-78,102-104,141-143,161-163,181-183`; prod `:76-78,102-104`; log `json-file` xoay vòng `:18-25` |
| 21 | `jobs` dùng cùng image, chỉ 1 bản (G6) | AC4, ARCH §6.2:231 | ✅ | prod `:82-105` (`node node_modules/payload/bin.js run scripts/jobs-runner.ts`, tương đương `pnpm jobs`, chạy node trực tiếp để nhận SIGTERM đúng), `stop_grace_period: 60s`, `container_name` cố định |
| 22 | Nginx chỉ nhận IP Cloudflare; chuyển nguyên `CF-Connecting-IP`; `TRUST_CF_CONNECTING_IP=true` | SPEC:202, AC5, follow-up L1-T06 | ✅ | `tami.conf:33,51`; `tami-staging.conf:35,59`; compose `:30`. Không dùng `real_ip_header` là lệch có chủ đích, đã ghi ở AC và ARCH §6.2:244 |
| 23 | `/admin`, `/api` không cache, trừ `/api/media/file/*` (G1); staging `noindex` + chặn truy cập công khai; ảnh trên staging `private, no-store` | AC5, ARCH §5.1:156, SPEC:201 | ✅ (phần Nginx) | `tami.conf:59-79` (không ghi đè header ảnh); `tami-staging.conf:37-41` (basic auth, X-Robots-Tag), `:72-82` (ghi đè `private, no-store`). Header immutable phía app: `layer-4-task-03:40`. Rule Cloudflare chỉ áp host prod: `layer-6-task-01:47` |
| 24 | Staging và prod khác DB/Redis/bucket | NFR-10, SPEC:201, project-config `staging_db ≠ prod_db` | ✅ | staging `:32` `DATABASE_URL_STAGING`, prod `:32` `DATABASE_URL_PROD`; SeaweedFS và Redis riêng cho từng compose (ARCH §6.2:233-234) |
| 25 | Image: user non-root, HEALTHCHECK, không chứa `.env`, source map hay devDependencies; không tự migrate | AC7, NFR-04, ARCH §6.2:240-242, §6.4 | ✅ | `docker/Dockerfile:36-37` (xoá `*.map` và `.next/cache`), `:40-43` (`--prod`), `:46-49` (`NODE_ENV=production`, `USER node`), `:62-63`; `src/lib/payload/prod-migrations.ts:10` + test; migrate là service `--profile tools` |
| 26 | Secure cookie ở staging/prod (residual task-04 của layer 2) | PERMISSION §7:118 | ✅ đóng | `Dockerfile:46` `NODE_ENV=production` |
| 27 | NFR-02: app stateless, scale ngang | NFR-02 (SPEC:149) | ⚠️ PARTIAL (chấp nhận ở Tier Standard) | Session lưu ở cookie, rate limit ở Redis, file ở S3. Tuy vậy, cache ISR `.next/cache` và `revalidatePath` chỉ có hiệu lực trong từng process. Xem G9 |

**Cross-doc conflict:** không có mức HIGH. Có 1 mức MEDIUM (G7). Có 2 mục doc as-built còn thiếu (R6, R7).

## Follow-up từ report layer 2: trạng thái

| Mục | Trạng thái | Evidence |
|---|---|---|
| G1 (cache ảnh `/api/media/file/*`) | **Đóng phần layer 3.** Phần app và Cloudflare đã gắn AC | User chốt (progress.json:188); Nginx `tami.conf:59-64`, `tami-staging.conf:72-82`; ARCH §5.1:156, §5.3:185; `layer-4-task-03:40`; `layer-6-task-01:47`. Hiện app **chưa** đặt header immutable (Grep `src/` không có `immutable`), đúng kế hoạch là làm ở L4-T03 |
| G2 (`refCollection` không có allow-list) | Mở, đã gắn task | `layer-5-task-06:94` (chỉ ghi ở Notes, chưa thành AC) |
| G3 (nhận lỗi captcha bằng chữ) | Mở, đã gắn task (cả 2 task đều bị chặn bởi L2-T02) | `layer-6-task-09:92`, `layer-9-task-02:97` |
| G4 (unhandledRejection) | **Đóng** | dòng 5 của ma trận |
| G5 (test chập chờn) | **Đóng** | dòng 6 của ma trận |
| G6 (job chỉ 1 process `jobs`) | **Đóng** | ARCH §5.4:198, §6.2:231; compose prod `:14-15` |
| R1 (cây thư mục ARCH §4) | Đóng phần layer 2 (`ARCHITECTURE.md:91-114`). **Mở lại cho layer 3**, xem R6 | |
| R2 (ARCH §5.4/§6.2 về click-stats và 1 jobs) | **Đóng** | ARCH:198, :231 |
| R3 (URL media và cache trong ARCH) | **Đóng** | ARCH:156, :185 |
| R4 (`project-config.md` § Secrets) | **Vẫn mở và đã dài thêm** | `project-config.md:117` vẫn thiếu `APP_ENV`, `EMAIL_ALLOWLIST`, `TRUST_CF_CONNECTING_IP`, `SMTP_PORT`, `EMAIL_FROM_ADDRESS`, và giờ thêm `GLITCHTIP_DSN`, `GLITCHTIP_PUBLIC_DSN`, `METRICS_TOKEN`, `LOG_LEVEL`, `REDIS_PASSWORD`, `TAMI_IMAGE`, `AUTO_MIGRATE_ON_START`. Cần chạy `/brainstorm secrets` (không sửa tay) |
| R5 (vệ sinh task file) | Một phần | Layer 2: dòng "Spec Validator verdict: pending" vẫn còn ở mọi task. Layer 3: xem R8 |

## Gaps và đề xuất task đích

### [PARTIAL] G7 MEDIUM: `withContentDefaults` chưa dùng được cho các collection mà ERD định nghĩa khác khuôn
- Code: `content-defaults.ts:90-104` luôn thêm cả `slug` (`unique: true`, bắt buộc ở `vi`, `slug.ts:61-75`), `author` (`required: true`, `author.ts:17`), `status`, `publishedAt`, `isFeatured`. Không có option bỏ bớt trường. `CONTENT_ROUTES` (`content-paths.ts:15-22`) không có `pages`/`categories`/`developers`, nên factory ném lỗi (`content-defaults.ts:65`).
- ERD và task lại yêu cầu:
  - `pages` không có `slug` và `author` (ERD §4.9b:341; `layer-5-task-02:39`).
  - `services` không có `author` (ERD §4.9:319; `layer-5-task-02:38`).
  - Slug của `categories` unique theo (`_locale`, `scope`, `slug`) (ERD §1.1:51, §4.3:163; `layer-4-task-01:37`). `slugField` hiện unique toàn collection và lúc kiểm trùng không lọc theo `scope` (`slug.ts:39-42,74`).
- Ghi chú L3-T02:101 lại yêu cầu "Mọi collection nội dung sau đều phải dùng factory này, không có bản sao logic". Hai yêu cầu này mâu thuẫn nhau.
- **Đề xuất:** thêm vào AC `layer-4-task-01` (task đầu tiên dùng tới, không bị chặn): `slugField` nhận `scopeField` (kiểm trùng và UNIQUE theo scope); factory nhận option bỏ trường (`omit: ["slug","author",...]`) hoặc tách thành các bộ field ghép được. Thêm vào AC `layer-5-task-02`: `pages` dùng factory với `omit slug/author`, `englishRequiredFields: ["title","content"]`, `fieldAccess.hasEnglish.update = isAdmin`; `services` bỏ `author` và dùng access chỉ admin. Không tự quyết cách làm. Builder hoặc primary chốt.

### [PARTIAL] G8 MEDIUM (quy trình): follow-up của reviewer layer 3 chưa có trong AC của task đích
Grep `tasks/tami-website/layer-{4,5,6,14,15,16}-*.md` không thấy bất kỳ mục nào dưới đây. Đề xuất gắn như sau:

| Residual | Nguồn | Mức | Task đích đề xuất |
|---|---|---|---|
| **n2** `fieldAccess` nhận giá trị `undefined`, ghi đè deny-all thành mở quyền; tên field gõ sai bị bỏ qua im lặng | L3-T02 r2 n2, `content-defaults.ts:49-55` | **Phải sửa trước khi có collection đầu tiên dùng `fieldAccess`** | AC `layer-4-task-01` (sửa factory cùng lúc với G7): lọc key có giá trị `undefined` và ném lỗi khi tên field lạ, kèm unit test. Kiểm lại ở `layer-5-task-02` (pages `hasEnglish`) |
| n1 kiểm trùng slug dùng `ILIKE %prefix%` + `pagination:false`, chậm khi slug ngắn và có tới 100.000 tin cho thuê (NFR-02) | L3-T02 r2 n1, `slug.ts:41,48` | LOW, nhưng ảnh hưởng thật ở quy mô `rentals` | Gộp vào `layer-4-task-01` (vì đằng nào cũng sửa `slugField` cho scope). Nếu không thì đưa vào AC `layer-6-task-02` (rentals) |
| n3 test purge của m6 xoá một bản ghi chưa nằm trong thùng rác | L3-T02 r2 n3 | LOW | Tuỳ chọn. Gộp vào `layer-4-task-01` nếu đã đụng `content-defaults.test.ts` |
| Chưa quan sát revalidate trên cache Next thật | L3-T02 r2 residual | LOW | AC `layer-6-task-06` (trang chi tiết tin tức, không bị chặn): lưu bài, kiểm HTML mới ở cả `/tin-tuc/x` và `/en/news/x` |
| **MINOR-1** lookbehind `(?<!\d)` trong chunk client làm Safari/iOS < 16.4 ném SyntaxError và không hydrate được trang nào | L3-T01 r3 MINOR-1, `scrub-text.ts:7` | LOW theo NFR-08 ("2 bản gần nhất"), nhưng NFR-08 cũng nêu trình duyệt trong Zalo/Facebook (WebView theo bản iOS của máy). Phải sửa trước deploy prod | AC `layer-4-task-06` (task giám sát, dùng kết quả L3-T01, không bị chặn): bỏ lookbehind, thêm test giữ hành vi. Hoặc làm ngay ở `layer-5-task-05`, task đầu tiên đưa trang công khai ra |
| MINOR-2 tham số `%s` với Error và `%d` chưa được lọc | L3-T01 r3 | LOW | `layer-4-task-06` hoặc backlog. Tối thiểu ghi quy ước trong `logger.ts` |
| MINOR-3 mẫu SĐT che nhầm số dài (timestamp, UUID); lọt dạng `(028) 3823 4567` | L3-T01 r3 | LOW | Backlog (`spec/changes/BACKLOG.md`) hoặc `layer-4-task-06` |
| Source map trình duyệt chưa upload lên GlitchTip | L3-T01 FV:58 | LOW | AC `layer-4-task-05` (CD) hoặc `layer-4-task-06` |
| MINOR-1 L3-T03: Prometheus chạy trong container không tới được `127.0.0.1:3010/3011` của host | L3-T03 follow-up:82 | MEDIUM cho giám sát | AC `layer-4-task-06` (đúng chỗ chọn `network_mode: host` hoặc join `tami-net` + Bearer) |
| MINOR-8 L3-T03: `NEXT_PUBLIC_SITE_URL` lúc build là `http://localhost:3000`, nên trang SSG chứa URL tuyệt đối sai | L3-T03 follow-up:83 | MEDIUM cho SEO (NFR-03) | AC `layer-5-task-08` (nền SEO: metadataBase/canonical/hreflang đọc URL lúc chạy, hoặc dùng dynamic/ISR) |
| Kiểm `nginx -v` và `docker version` (≥ 28) trên server; hỏi user về Authenticated Origin Pulls (mTLS); smoke test 2 IP vào 2 bucket rate limit khác nhau | L3-T03 follow-up:84; L3-T03:125-126 (BẮT BUỘC từ L1-T06) | MEDIUM (bảo mật origin trên host dùng chung) | AC `layer-6-task-01` (deploy staging sớm, đang bị chặn bắc cầu bởi L2-T02) |
| 5 header bảo mật lặp ở `tami-staging.conf:76-80` phải sửa đồng bộ | L3-T03 r2 residual | LOW | `layer-14-task-01` (CSP/header): tách ra snippet include |

### [PARTIAL] G9 LOW: ISR/revalidate chỉ có hiệu lực trong từng process, mâu thuẫn ARCH §9.1 "Mức 2: chạy 2+ bản app. Sửa code? Không"
`revalidatePath` (`revalidate-content.ts:14-21`) và `.next/cache` (`Dockerfile:48`) là trạng thái riêng của từng process. Với 2 bản app sau upstream Nginx, chỉ bản nhận request lưu bài mới được làm mới cache. Bản còn lại phục vụ HTML cũ cho tới khi hết `revalidate`. Hiện tại an toàn vì prod chạy 1 bản (`container_name` cố định, prod:67). Metrics in-memory theo process đã được ghi ở ARCH §8:308. **Đề xuất:** ghi vào ARCH §9.1 mức 2 rằng cần cache handler dùng chung (Redis) trước khi chạy 2 bản. Đây là doc intent/kiến trúc, cần primary hoặc user quyết, không chặn layer nào.

### As-built doc cần reconcile (LOW, không chặn)
- **R6: ARCH §4 cây thư mục** (`ARCHITECTURE.md:86-124`) thiếu phần layer 3 thêm: `src/fields/`, `src/collections/_shared/`, `src/lib/monitoring/`, `src/lib/content/`, `src/lib/payload/`, `src/lib/logger.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, `sentry.server.config.ts`, route `api/metrics/`, `api/monitoring-config/`, `docker/nginx/tami-cloudflare-ips.conf`, `tests/fixtures/test-content/`.
- **R7: `docs/API_SPEC.md` chưa có `GET /api/metrics` và `GET /api/monitoring-config`** (Grep không có kết quả). Cả hai là endpoint mới, có contract (404/401/200, `no-store`; `private, max-age=300`, shape `{dsn, environment}`). Theo AGENTS § Doc Impact, endpoint mới phải ghi vào API_SPEC. Doc impact của L3-T01 chỉ cập nhật ARCHITECTURE. Đề xuất thêm §3.6 / §3.7 cạnh §3.5 `/api/health` (`API_SPEC.md:126`).
- **R8: vệ sinh task file layer 3:**
  - `layer-3-task-01.md:34-37`: cả 4 AC vẫn `[ ]`; `:57` vẫn ghi "(chờ reviewer)".
  - `layer-3-task-02.md:67`: vẫn ghi "(chờ reviewer)".
  - `layer-3-task-03.md:63`: vẫn ghi "chờ Reviewer STRICT". Checklist `:122-128` (BẮT BUỘC từ L1-T06) vẫn `[ ]` dù 5/7 mục đã làm (TRUST_CF `compose:30`, allow-list CF, bind 127.0.0.1, `CF-Connecting-IP`, `APP_ENV`/`EMAIL_ALLOWLIST`/`stop_grace_period`). 2 mục còn lại (AOP, smoke test 2 IP) xem G8.
  - Cả 3 task: "Spec Validator verdict (layer close): pending" (`L3-T01:63`, `L3-T02:70`, `L3-T03:86`).
- **R9:** ARCH §6.2:231 và `Dockerfile:2` ghi `jobs` chạy lệnh `pnpm jobs`. As-built thực tế chạy `node node_modules/payload/bin.js run scripts/jobs-runner.ts` (compose prod:86-88 có giải thích). Đề xuất ghi rõ trong ARCH.

## Residual chấp nhận (không cần task)
- `/api/*` dựa vào header của app và Cloudflare để không bị cache. Nginx không ép `no-store` (`tami.conf:66-74`). Cloudflare mặc định không cache JSON, và rule bypass đã có ở `layer-6-task-01:47`.
- REST công khai `?locale=en` vẫn trả bản ghi `published` chưa có `hasEnglish` (trường EN rỗng vì `fallback: false`). Không lộ dữ liệu ngoài phạm vi công khai. Phía trang web đã có lọc ở `layer-4-task-03:37-38`.
- Hook revalidate không làm mới trang danh mục và các khối trang chủ không phụ thuộc `isFeatured` (vd thẻ Dịch vụ ở trang chủ, ERD §4.9:313). Cache vẫn hết hạn sau `s-maxage=60` (ARCH §5.1:152, AC `layer-4-task-03:39`), nên vẫn đạt mục tiêu "≤ 1 phút". Task trang chủ hoặc danh mục có thể bổ sung đường dẫn qua `ContentRoute`.
- `requireEnglishFields` mặc định chỉ kiểm `title`, `slug`. ERD §1.1:38 yêu cầu thêm mô tả ngắn và nội dung chính, tuỳ collection. Option `englishRequiredFields` đã có (`content-defaults.ts:28,84`). Mỗi task collection phải truyền đúng giá trị (reviewer layer 4/5 kiểm).
- Process khác trên host dùng chung gọi thẳng `127.0.0.1:3010/3011` có thể giả `CF-Connecting-IP` (L3-T03 r2). Chấp nhận ở phạm vi server dùng chung. AOP là giải pháp, xem G8.

## Residual risk của lần validate này
- Không chạy lại `pnpm build`, `docker build`, compose staging thật hay `nginx -t`. Các mục này dựa vào evidence của builder và reviewer (L3-T03 r2 có thử chức năng trên container tạm).
- Không mở trình duyệt. MINOR-1 (Safari < 16.4) chỉ suy ra từ bundle, chưa chạy thật.
- Không kiểm được trên cache Next thật vì chưa có route chi tiết.
- Không đọc nội dung `docker/nginx/tami-cloudflare-ips.conf`. Phần allow-list Cloudflare dựa vào reviewer r2 và test chức năng "peer không phải Cloudflare → 403" của builder.
