# Architecture Decisions Log

## Format

```markdown
### Decision {N}: {Title}
- **Date:** YYYY-MM-DD
- **Context:** {Why this decision was needed}
- **Decision:** {What was decided}
- **Alternatives Considered:** {Other options}
- **Rationale:** {Why this option was chosen}
- **Consequences:** {Trade-offs, follow-up needed}
```

## Decisions

_No decisions recorded yet. Decisions logged here khi dựng spec và trong implementation._

### Decision 1: Phiên bản Next.js + Payload CMS cho scaffold
- **Date:** 2026-10-16
- **Context:** Task layer-0/task-01 cần chọn Payload 3 ổn định mới nhất hỗ trợ `trash` + Jobs Queue, và phiên bản Next tương thích.
- **Decision:** Payload `3.91.0` (+ `@payloadcms/next`, `db-postgres`, `richtext-lexical`, `translations` cùng `3.91.0`), Next.js `16.4.2`, React `19.3.1`, TypeScript `5.9.3`, Vitest `5.0.5`, ESLint `9.39.5` + `eslint-config-next 16.4.2` (flat config), zod `4.6.7`, `sharp 0.35.5`. Postgres dev: `postgis/postgis:17-3.5`; SeaweedFS ghim `4.48`.
- **Alternatives Considered:** Next `15.4.11` (nằm trong peer range Payload nhưng `pnpm audit` báo critical RCE/high trên toàn bộ nhánh <15.5.24, mà Payload 3.91 không hỗ trợ 15.5.x). TypeScript 7 / vitest 3 (peer typescript-eslint không khớp / `tinypool` critical).
- **Rationale:** Next 16.4.2 nằm trong peer `>=16.3.3 <17` của Payload 3.91.0, sạch advisory critical/high; build + dev + `/admin` đã kiểm chứng.
- **Consequences:** Next 16 dùng Turbopack mặc định; `middleware.ts` (next-intl, ARCHITECTURE §4) bị Next 16 đánh dấu deprecated sang `proxy.ts` — task i18n routing phải kiểm tra. `output: "standalone"` chưa bật vì lỗi EPERM symlink trên Windows với pnpm; task Dockerfile quyết định. Auth collection tạm đặt slug `staff` (khớp ERD) để tránh rename migration sau. `pnpm audit --audit-level high` còn 1 high `braces <=3.0.3` (transitive của `@payloadcms/ui`, chưa có bản vá) — theo dõi ở task CI.

### Decision 2: Phiên admin hết hạn sau 8 giờ không hoạt động (layer-2-task-04)
- **Date:** 2026-10-16
- **Context:** PERMISSION §7 yêu cầu "8 giờ không hoạt động", nhưng `tokenExpiration` của Payload là hạn tuyệt đối tính từ lúc cấp token.
- **Decision:** `staff.auth.tokenExpiration = SESSION_TTL_SECONDS` (28800, một nguồn ở `src/lib/session/keepalive.ts`). Provider admin `SessionKeepAlive` (`admin.components.providers`) nghe hoạt động (pointerdown/keydown/wheel/mousemove/đổi route), throttle tối đa 1 lần/15 phút, bỏ qua khi tab ẩn và trên các màn login/logout/inactivity/forgot/reset/createFirstUser/unauthorized, rồi gọi `useAuth().refreshCookieAsync()` của `@payloadcms/ui` (thêm dependency trực tiếp 3.91.0). Cookie `payload-token`: HttpOnly, SameSite=Lax, Secure khi `NODE_ENV=production`.
- **Alternatives Considered:** (1) fetch `/refresh-token` tự viết + `setUser` — review FAIL: không broadcast sang tab khác, tab để yên sẽ logout cả session (`_sid` chung) sau 8 giờ. (2) Rút ngắn tokenExpiration + refresh khi focus — không cần vì cơ chế provider khả dụng ở Payload 3.91.
- **Rationale:** `refreshCookieAsync` dùng đúng đường refresh của Payload: cập nhật timer phiên client, broadcast REFRESHED đa tab, có guard đang-logout; refresh lỗi 401/403 thì Payload tự chuyển màn `/admin/logout-inactivity` rồi về login.
- **Consequences:** Phiên sống tối đa 8 giờ kể từ lần refresh cuối (trễ ≤ 15 phút so với thao tác cuối). 401 đi qua màn inactivity thay vì về thẳng login. Cờ Secure phụ thuộc staging/prod chạy `next start` (`NODE_ENV=production`) — bước DevOps phải đảm bảo. Đa tab kiểm chứng bằng đọc source Payload, chưa có E2E.

### Decision 3: Gộp lượt bấm click-events idempotent (layer-2-task-07)
- **Date:** 2026-10-16
- **Context:** Job `aggregate-click-stats` chạy hằng giờ phải gộp `click-events` vào `click-stats-daily` mà chạy lại không cộng trùng; dữ liệu thô xoá sau 90 ngày. ERD ghi "unique 5 cột" (gồm cả `count`).
- **Decision:** Thêm cột `click-events.aggregatedAt`; job lấy lô ≤1000 bản chưa gộp (`createdAt <= now`), cộng dồn + đánh dấu trong cùng transaction. Unique `click-stats-daily` 4 cột `(date, type, refCollection, refId)`; ở bảng thống kê dùng `""` thay null cho ref để unique không coi null là khác nhau. `date` = ngày giờ VN (UTC+7), lưu 00:00 UTC. Xoá raw > 90 ngày chỉ khi đã có `aggregatedAt`.
- **Alternatives Considered:** Tính lại theo cửa sổ thời gian — mất số liệu khi raw đã xoá. Unique có `count` — vô nghĩa với khoá.
- **Rationale:** Đánh dấu + transaction cho exactly-once khi một runner; hàng đợi Payload không xếp trùng job cùng loại.
- **Consequences:** Cộng dồn đọc-rồi-ghi không nguyên tử — chỉ an toàn với 1 process `jobs`; nhiều worker phải đổi sang `ON CONFLICT DO UPDATE`. Chưa kiểm trên Postgres thật (Docker off lúc build).

### Decision 4: CD = GitHub runner build → GHCR → SSH chạy deploy.sh (layer-4-task-05)
- **Date:** 2026-10-17
- **Context:** ARCHITECTURE §6.4 để mở hai cách: self-hosted runner `/opt/actions-runner-tami` hoặc build trên GitHub rồi SSH. Server dùng chung với dự án khác (đã từng đầy ổ do build cache).
- **Decision:** Runner GitHub-hosted build image (tag = commit SHA, label OCI, cache GHA) → push `ghcr.io/<repo>` → job SSH vào server chạy `scripts/deploy/deploy.sh` (gửi kèm `docker/` + `scripts/deploy/` vào release bất biến `/opt/tami/releases/<env>/<sha>`, script chạy từ chính release đó, symlink `current` đổi nguyên tử trong flock). Staging tự động qua `workflow_run` của CI (chỉ `conclusion=success`, `event=push`, `head_branch=staging`, head là repo này); production là job cùng workflow trên Environment `production` (required reviewers cấu hình trên GitHub) và deploy đúng DIGEST đã chạy ở staging. Deploy theo digest, không `latest`. Server từ chối cặp digest + SHA chưa có trong `staging.history` (dòng `<digest> <ts> <sha>`) và digest cũ hơn `production.current` (trừ `--allow-older` chạy tay); production bị chặn khi có migration `HIGH_RISK_MIGRATION` chưa apply (đánh dấu bằng comment trong `migrations/*.ts`). Login GHCR bằng `GITHUB_TOKEN` truyền qua stdin vào `DOCKER_CONFIG` tạm.
- **Alternatives Considered:** Self-hosted runner trên server dùng chung (runner chạy code PR trên máy chứa dự án khác, tốn RAM/ổ build, cần quản trị riêng). Build trên server (bỏ qua digest bất biến, build cache 140GB từng làm đầy ổ). PAT dài hạn lưu trên server để pull.
- **Rationale:** Không có runner/build cache của TAMI trên server; image bất biến theo digest nên "đúng cái đã test ở staging" kiểm chứng được cả ở GitHub (output) lẫn ở server (history); secret ngắn hạn.
- **Consequences:** Nhánh mặc định repo phải là `staging` (workflow_run chỉ đọc workflow từ nhánh mặc định). Environment/secret/reviewer phải tạo thủ công trên GitHub (docs/runbooks/deploy.md). Migration đã chạy không rollback được: migration phải backward-compatible, health fail chỉ đưa image về bản trước. Không `docker builder prune` (không build trên server); chỉ xoá image tami cũ. Action pin theo commit SHA đầy đủ (tra bằng `git ls-remote`). Release dir theo SHA thay `/opt/tami/repo` dùng chung để tránh staging commit mới ghi đè compose production đang chờ khoá; đường dẫn bind mount đổi một lần khi chuyển bố cục (postgres có thể bị tạo lại một lần). Chưa chạy thật: lần đầu ở layer-6-task-01.

### Decision 5: Backup = pgBackRest (WAL liên tục) + restic (qua S3 API), sidecar trong compose, đích cấu hình bằng env (layer-4-task-07)
- **Date:** 2026-10-17
- **Context:** NFR-05 (RPO ≤ 15 phút, RTO ≤ 4 giờ, kho ngoài server). Nhà cung cấp kho chưa chốt (B2 hay server công ty); stack giám sát (layer-4-task-06) đang hoãn nên cần heartbeat không phụ thuộc Prometheus. Server dùng chung, postgres chạy bằng image `postgis/postgis:17-3.5` (Debian 11) trên volume có sẵn.
- **Decision:** (1) Image postgres tuỳ biến cùng tag base + `pgbackrest` (ghim 2.59.1) vì `archive_command` chạy trong container postgres; một Dockerfile hai target (`postgres`, `backup`) để mọi nơi cùng phiên bản. (2) Lịch bằng sidecar `backup` có vòng lặp (`scheduler.sh`), không dùng cron/systemd timer của host: nằm trong compose từng môi trường, log stdout, bắt kịp lịch sau restart, không cần root trên host dùng chung. Sidecar user `postgres` (uid 999), pgdata read-only + socket dùng chung. (3) Kho đích hoàn toàn qua env (`PGBACKREST_REPO1_*`, `RESTIC_*`): S3-compatible hoặc SFTP, mã hoá cả hai, không commit credential. (4) File SeaweedFS đi qua S3 API (rclone sync → `/mirror` → restic), không chụp volume đang ghi. (5) pgBackRest giữ theo số bản (6 full + WAL ≥ 35 ngày) thay vì theo ngày; `archive_timeout=300`. (6) Heartbeat: file `<kind>.success` (chỉ ghi khi exit 0) + textfile metric `tami_backup_last_success_timestamp_seconds{kind,env}` + URL push tuỳ chọn (Uptime Kuma). (7) `stanza-create`/`restic init` luôn chạy tay, không tự động. (8) Trần WAL `archive-push-queue-max` (env, mặc định staging 4GiB / prod 8GiB, sync mode): kho đích chết thì BỎ WAL thay vì làm đầy ổ server dùng chung (chấp nhận gãy PITR, phải chạy `full` mới; heartbeat `wal` là cảnh báo sớm). (9) Base `postgis/postgis:17-3.5` ghim digest `sha256:01a6a70e…` + assert Debian 11/glibc 2.31 khi build; apt qua HTTPS.
- **Alternatives Considered:** Giữ image gốc rồi cài pgbackrest lúc chạy (không bất biến, mất khi tạo lại container). Chuyển base sang Debian 12 (đổi glibc/collation trên dữ liệu cũ, có thể hỏng index). systemd timer/cron trên host (cần quyền root, không nằm trong repo/compose, khó test). Chụp thẳng volume SeaweedFS (file .dat/.idx ghi dở không nhất quán). pgBackRest retention theo ngày (cửa sổ PITR co dưới 30 ngày). Tự động tạo kho khi thiếu (sai env tạo kho rỗng ở sai chỗ mà heartbeat vẫn báo OK). Không đặt trần WAL (kho chết lâu đầy ổ server dùng chung, sập cả dự án khác; round 1 review MAJOR-1). `archive-async` (spool riêng) không cần: trần áp dụng cả chế độ đồng bộ, đã kiểm bằng e2e.
- **Rationale:** Đúng + đơn giản nhất thoả RPO/RTO mà không thêm dịch vụ trả phí; mọi thứ kiểm chứng được bằng test Docker (`docker/backup/test/e2e.sh`, cả S3 TLS lẫn SFTP): PITR, restore mới nhất, restic restore so sha256, heartbeat, scheduler, `archive_timeout` thật (297 s ≤ 300 s).
- **Consequences:** Cần build image một lần trên server (`compose build postgres backup`; `deploy.sh` chỉ thêm `backup` vào `compose up`); lần đầu chuyển image làm postgres khởi động lại một lần, dữ liệu giữ nguyên (đã kiểm với volume khởi tạo bằng image gốc). Kho hỏng lâu ⇒ WAL dồn ở `pg_wal` tới trần (4/8GiB) rồi bị bỏ: DB sống nhưng PITR gãy cho tới khi chạy `full` mới (runbook §9); cần cảnh báo `wal` (đặt `HEARTBEAT_URL_WAL` ngay từ đầu), vì trần chỉ chặn sự cố ổ đầy chứ không báo ai. SFTP cho pgBackRest bị giới hạn bởi libssh2 1.9 của Debian 11 (cần server cho phép `ssh-rsa` + DH group-exchange; khuyến nghị kho S3-compatible). Image sidecar chạy trên Debian 11 hết hạn hỗ trợ (kho đã trỏ về archive); nâng base là việc riêng có diễn tập. Bản sao `/mirror` tốn thêm ổ bằng dung lượng bucket. Chưa chạy trên server thật: kiểm ở layer-6-task-01 và diễn tập đầu tiên.

### Decision 6: Staging tạm trên sslip.io + Let's Encrypt + basic auth, không Cloudflare; staging không backup/báo động tới M3 (layer-6-task-01)
- **Date:** 2026-10-18
- **Context:** Chưa có tên miền nên không đặt được Cloudflare/DNS cho staging. Server 187.52.119.50 dùng chung với nhiều dự án khác (nginx 1.24 chung, nhiều site). Stack giám sát (L4-T06) đang hoãn; kho backup chưa chốt.
- **Decision:** (1) Staging chạy ở `https://187-52-119-50.sslip.io`, chứng chỉ Let's Encrypt (webroot, renew hook riêng cho cert), chặn công khai bằng HTTP basic auth + `X-Robots-Tag: noindex` + robots `Disallow: /`; site nginx riêng `tami-staging-sslip{,-http}.conf`, không `http2`/`default_server`/`ipv6only` để không đổi hành vi site khác. (2) App tin `X-Real-IP` (nginx ghi đè bằng `$remote_addr`, `TRUST_X_REAL_IP=true` chỉ staging). (3) Staging không có dịch vụ backup, `archive_mode=off`; không báo động tới M3; dịch AI tắt (ngân sách 0). (4) Diễn tập rollback image hoãn tới lần deploy staging thật kế tiếp (L12-T01), tạm dựa `deploy.test.sh`.
- **Alternatives Considered:** Chờ có tên miền rồi mới dựng staging (trễ mốc staging sớm). Cloudflare Access/Tunnel (vẫn cần tên miền trong Cloudflare). Dùng IP trần + chứng chỉ tự ký (trình duyệt cảnh báo, không kiểm được HTTPS thật).
- **Rationale:** Có staging HTTPS thật ngay để kiểm deploy/CD/seed/trang mà không đụng cấu hình chung của server; mọi phần phụ thuộc Cloudflare để lại cho production.
- **Consequences:** Các AC Cloudflare (DNS, SSL Full Strict, cache rule, chỉ nhận IP Cloudflare, Origin Pulls, `TRUST_CF_CONNECTING_IP`) chuyển L15-T01; production cần tên miền thật trước M5. Ảnh/static staging không qua CDN nên không có nguy cơ lọt basic auth qua cache. Staging mất dữ liệu nếu hỏng ổ (chấp nhận, dữ liệu thử).

### Decision 7: Logo header/footer lấy từ `site-settings.logo`/`logoDark`, CTA "bật" = có nhãn + link (feature-header-footer-design-debt, BL-001)
- **Date:** 2026-10-19
- **Context:** Change doc BL-001 yêu cầu dùng logo nhập trong CMS và `header.ctaButton`. Global `header` không có trường logo; `site-settings` đã có `logo`, `logoDark` (ERD §4.15); `ctaButton` không có cờ bật/tắt.
- **Decision:** Dùng `site-settings.logo` cho nền sáng (header đặc), `logoDark` cho nền tối (header trong suốt, menu toàn màn hình, footer); thiếu bản nào → logo tĩnh tương ứng. CTA hiện khi có nhãn ở ngôn ngữ đang xem + link hợp lệ (không mượn nhãn VI cho EN). Nút Menu hiện cả ở ≥ xl (menu toàn màn hình dùng mọi breakpoint).
- **Alternatives Considered:** Thêm trường `logo` + checkbox `enabled` vào global `header` (đổi schema + migration, trùng dữ liệu với `site-settings`).
- **Rationale:** Không đổi schema/migration, một nguồn logo duy nhất.
- **Consequences:** Admin cấu hình logo ở "Cấu hình chung"; tắt CTA = xoá nhãn hoặc link.

### Decision 8: UI admin kiểu SaaS chỉ bằng cấu hình admin + CSS + component, không thay Nav (feature-admin-ui-saas-refresh, BL-015)
- **Date:** 2026-10-19
- **Context:** Cần làm lại admin Payload 3.91 (tokens AA sáng/tối, sidebar nhóm, dashboard, list badge/thumbnail, form tab) mà không đổi schema/access/hook/API.
- **Decision:** (1) Token `--admin-*` + SCSS ngoài `@layer` ghi đè Payload, không `!important` mới. (2) Nhóm nav bằng `admin.group` + plugin chạy cuối sắp thứ tự (`admin-groups.ts`), không tự viết Nav (chấp nhận collection đứng trước global trong cùng nhóm, không icon menu). (3) Dashboard = `admin.components.views.dashboard` (Server Component, count/find `overrideAccess:false` + user). (4) Form: chỉ tab **không tên**/row/collapsible để không đổi path dữ liệu, không migration.
- **Alternatives Considered:** Thay `admin.components.Nav` (icon, thứ tự tự do — rủi ro quyền/active/mobile, bảo trì khi nâng Payload); tab có tên (đổi path → migration).
- **Rationale:** Giữ an toàn dữ liệu và quyền, nâng Payload không vỡ.
- **Consequences:** FR-ADM-14 (L13-T01) cắm vào `DashboardView`; custom Cell phải đi qua `LinkedCell` để giữ chọn bản ghi trong ListDrawer.

### Decision 9: Trang chi tiết ẩn header khi cuộn bằng CSS `:has([data-detail-page])` + biến `--sticky-top` cố định (feature-detail-pages-unified-layout, BL-027)
- **Date:** 2026-10-20
- **Context:** User yêu cầu trên chi tiết dự án / cho thuê cuộn xuống thì không còn header, chỉ thanh mục con dính sát đỉnh (lề như header nổi). BL-025 quyết định header sticky ở mọi trang và mọi `scroll-margin`/thanh dính bù theo `--header-offset`. `HeaderFrame` nằm ở layout, không biết route.
- **Decision:** Khung chung `DetailLayout` gắn `data-detail-page`; `globals.css` dùng `html:has([data-detail-page])` để (1) `.site-header[data-scrolled]:not(:has(:focus-visible))` trượt ẩn bằng `transform` (không hiện lại khi cuộn lên; hiện khi focus bàn phím), (2) biến `--sticky-top` (`:root` = `--header-offset`) cố định 0.5rem / ≥ lg 1rem — dùng cho sticky thanh mục con, thẻ tư vấn/liên hệ và `scroll-margin` neo trong khung chi tiết. Sửa quyết định BL-025 cho riêng trang chi tiết.
- **Alternatives Considered:** Prop/context từ page xuống layout header (cần client state xuyên layout); JS đặt data-attribute lên `<html>` khi mount (phụ thuộc hydrate); chỉ đổi `--sticky-top` khi header đã `data-scrolled` (round 2 — làm neo nhảy từ đầu trang thừa ~88px vì scroll-margin tính lúc còn 104px); `:focus-within` (focus chuột sau khi đóng menu giữ header che thanh mục con); `visibility:hidden` (link header không còn focus được bằng Tab).
- **Rationale:** Không đổi JS/DOM header, không prop xuyên layout; trang khác giữ nguyên vì `:has()` không khớp; trình duyệt thiếu `:has()` rơi về hành vi cũ nhất quán.
- **Consequences:** Trước hydrate / không JS header đầy đủ có thể che thanh mục con (user chấp nhận 2026-10-20); `OBSERVER_MARGIN` -88px xấp xỉ; trình đọc màn hình vẫn đọc link header khi đã ẩn. Component mới dùng neo trong khung chi tiết phải dùng `--sticky-top` + 4.5rem.

### Decision 10: Tham số `amenities` của `GET /api/public/rentals` bỏ giá trị lạ thay vì 400 (feature-homepage-redesign T00, BL-044)
- **Date:** 2026-10-20
- **Context:** Tham số lọc mới `amenities=a,b` (AND). `furnishing` hiện tại là enum đơn: giá trị sai → zod fail → 400. SPECIFICATIONS F3 ghi "giá trị ngoài danh sách bị bỏ".
- **Decision:** `rentalSearchParamsSchema.amenities` = `z.preprocess` tách chuỗi/mảng, lọc theo `RENTAL_AMENITIES`, bỏ trùng, xếp theo thứ tự danh sách; toàn giá trị lạ → `undefined` (không lọc), không 400. Trang `/cho-thue` và API dùng cùng schema nên hiểu URL giống nhau.
- **Alternatives Considered:** 400 như `furnishing` (nhất quán kiểu enum, nhưng link chia sẻ/trang chủ T01 vỡ khi danh sách tiện ích đổi, và trang công khai vốn đã bỏ tham số sai thay vì 400).
- **Rationale:** Tham số danh sách: phần hợp lệ còn lại vẫn có nghĩa; theo đúng spec F3.
- **Consequences:** Khác biệt hành vi giữa `furnishing` (400) và `amenities` (bỏ) được ghi ở `docs/API_SPEC.md` §3.3; kiểu khác chuỗi (vd số) vẫn 400. Endpoint HTTP gộp khoá lặp `amenities=a&amenities=b` thành mảng (≡ `a,b`) để API, parser trang `/cho-thue` và count path hiểu URL như nhau; các khoá khác vẫn "khoá lặp lấy giá trị đầu".

### Decision 11: Trang danh mục Dự án — `?category=` cũ luôn 308 (kể cả kèm tham số khác), slug dành riêng đặt ở `slug.ts` (feature-projects-category-page, BL-090)
- **Date:** 2026-10-28
- **Context:** BL-090 (user chốt cách B 2026-10-27) thêm trang `/du-an/danh-muc/[category]`. Link cũ `/du-an?category=<slug>` cần chuyển hướng. Cho thuê/Tin BĐS (BL-055) chỉ 308 khi URL CHỈ có `category`, vì trang danh mục của chúng không giữ được mọi bộ lọc. Slug chi tiết dự án `danh-muc`/`category` làm URL trông như trang danh mục; `src/collections/Projects.ts` đang dirty của BL-077.
- **Decision:** (1) `/du-an?category=<slug có thật, scope project, đúng locale>` → **308 luôn** sang trang danh mục, giữ nguyên mọi tham số khác (khoá lặp, `utm_*`, `page`); slug lạ/rỗng → không redirect, không lọc. (2) Danh sách slug dành riêng `RESERVED_SLUGS` theo `collection.slug` + locale nằm trong `src/fields/slug.ts` (`projects`: vi `danh-muc`, en `category`), coi như "đã bị chiếm" trong `findFreeSlug` → `-2`.
- **Alternatives Considered:** 308 chỉ khi URL chỉ có `category` như BL-055 (để lại trang lọc trùng nội dung với trang danh mục); validate trong `Projects.ts` (đụng file dirty của BL-077, chỉ báo lỗi chứ không tự sinh slug khác).
- **Rationale:** Trang danh mục dự án nhận đủ mọi bộ lọc của `/du-an` nên tập kết quả không đổi khi chuyển — không mất ngữ cảnh, gom SEO về một URL. Slug dùng chung hook nên chặn ở đó áp cho UI/API/seed, collection khác không đổi.
- **Consequences:** Hành vi redirect Dự án khác Cho thuê/Tin BĐS (ghi `docs/API_SPEC.md` §3.9). Dự án cũ đã có slug `danh-muc`/`category` trên staging/prod không tự đổi; lần lưu sau hook đổi sang `-2` (đổi URL) — kiểm read-only dữ liệu trước deploy.

### Decision 12: Staging dùng Nginx host + Let's Encrypt trên server mới, không Cloudflare Tunnel (feature-staging-new-server-nginx-tamihomes, BL-111)
- **Date:** 2026-11-06
- **Context:** Staging chuyển sang server mới 179.197.242.57 (Hostinger, dùng chung với dự án khác) với tên miền `179-197-242-57.sslip.io`; server cũ 187.52.119.50 giữ production (`tami.genieplatform.cloud`) và staging sslip chạy song song làm dự phòng. Các dự án khác trên host mới ra Internet bằng cloudflared quick tunnel, TRỪ `outfitai.genieplatform.cloud` (outfit-changer) đã có site Nginx + cert Let's Encrypt riêng (bật 04:21Z/04:27Z 2026-11-06, trước reject của TAMI): Nginx 443 + certbot dùng chung.
- **Decision:** TAMI tự cài Nginx 1.28 + certbot trên host mới, Let's Encrypt `-d 179-197-242-57.sslip.io` (HTTP-01, sslip.io tự phân giải, không cần DNS), vhost `docker/nginx/tami-staging-sslip-179{,-http}.conf` + `tami-default-reject.conf` (`ssl_reject_handshake`). Staging công khai + `noindex` (user: không basic auth, 2026-11-06). Production ở lại server cũ.
- **Alternatives Considered:** Cloudflare Tunnel / quick tunnel (hostname đổi mỗi lần chạy, không ổn định; IP khách phải đọc từ `CF-Connecting-IP`); dùng chung cloudflared của dự án khác (đụng dự án khác).
- **Rationale:** Giữ nguyên mô hình đã chạy ở staging sslip: `X-Real-IP` ghi đè bằng `$remote_addr` (rate limit đúng IP thật), app chỉ bind `127.0.0.1:3011`, cờ `TRUST_*` mặc định của compose không đổi. Host mới chưa site 443 nào (lúc quyết định; nay dùng chung với outfitai) nên TAMI sở hữu nginx và được `systemctl reload`.
- **Consequences:** Phải tuân quy tắc host dùng chung (không ufw, không `apt upgrade`/reboot, không đụng container/thư mục dự án khác; cài gói bằng `--no-upgrade`). Cert gia hạn bằng certbot.timer + deploy hook toàn cục `renewal-hooks/deploy/reload-nginx.sh` (cũng chạy khi cert outfitai gia hạn, chỉ graceful reload). `tami-default-reject.conf` là default_server 443 toàn host: client không SNI/IP trần tới outfitai bị từ chối handshake (tác động nhỏ). Cert TAMI dùng ACME account có sẵn do certbot của outfitai tạo nên `--register-unsafely-without-email` không có tác dụng. Cần báo chủ outfitai. HSTS 1 ngày, không includeSubDomains (`tamihomes.vn` gốc để dành production). Runbook `docs/runbooks/deploy.md` §11.

> **Cập nhật 2026-11-06 (user, BL-111):** hostname staging đổi từ `staging.tamihomes.vn` sang `179-197-242-57.sslip.io` (không cần DNS, không email Let's Encrypt: `--register-unsafely-without-email`); `tamihomes.vn` dành cho production (BL-112, ngoài scope). Vhost repo đổi tên `tami-staging-tamihomes*` thành `tami-staging-sslip-179*` (giữ `tami-staging-sslip*.conf` của server cũ làm dự phòng).
