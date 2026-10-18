# Task 01: Deploy staging sớm: Compose staging, Nginx, Cloudflare/noindex, CD chạy thật, health check

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — thao tác trên server thật dùng chung + migration lần đầu + secret
- Blast radius: (server) /opt/tami/staging.env (không commit); (server) /etc/nginx/sites-available/tami-staging-sslip*.conf (copy từ `docker/nginx/tami-staging-sslip*.conf`); docs/runbooks/deploy.md (cập nhật kết quả thật); …
- Doc impact (dự kiến): docs/runbooks/deploy.md; ARCHITECTURE §6.4 (chốt cách runner/registry)
- Decision impact: YES — ghi `.context/decisions.md`

## Requirements
- NFR-10 (staging tách biệt, CI/CD)
- ARCHITECTURE §6.1–§6.4, §7
- SPECIFICATIONS § Deployment
- .agent/devops.md Phase 3
- AGENTS.md Non-negotiables (migration)

## Description
Đưa bản đầu (khung website + nội dung đợt 1) lên staging để các task sau kiểm thử trên môi trường thật; pipeline CD (task CD) chạy thật lần đầu.

## Dependencies
- `layer-4-task-05` CD GitHub Actions: image theo SHA → staging (migrate, health) → duyệt tay → production (dùng kết quả của task này)
- `layer-3-task-03` Dockerfile + Compose staging/prod + cấu hình Nginx host (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-07` Banner đồng ý cookie + tải GA4 sau khi đồng ý (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-5-task-02` Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion` (dùng kết quả của task này)
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)
- `layer-5-task-04` Collection `job-postings` + `job-applications` (quản lý hồ sơ) (dùng kết quả của task này)
- `layer-2-task-02` `provinces`, `wards` + khung seed (`pnpm seed`) và dữ liệu 34 tỉnh/thành (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)

Mở khoá cho: `layer-9-task-07`, `layer-12-task-01`

## Acceptance Criteria
- [x] Runbook go-live: điền `site-settings` (`siteName`…) TRƯỚC khi publish trang privacy — nếu thiếu, hook `sync-privacy-version` báo lỗi `siteName` khó hiểu; cân nhắc ValidationError rõ (MINOR-1); `scripts/seed-sample-services.ts` thoát sớm khi `APP_ENV=production` (MINOR-4) (review L5-T02 round 1)
- [x] G10: chốt với user cách báo động backup/web chết trên staging khi stack giám sát (L4-T06) còn hoãn — bật riêng Uptime Kuma hoặc chấp nhận tới trước M3; đối chiếu bảng giá `src/lib/translation/budget.ts` trước khi đặt `TRANSLATION_MONTHLY_BUDGET_USD` production (spec-validation layer 4)
- [→ L15-T01] Backup lần đầu trên server: tạo `BACKUP_ENV_DIR` + env pgBackRest/restic (đích S3/SFTP user chốt), `stanza-create`, `restic init`, kiểm digest base `postgis/postgis:17-3.5` trên server khớp digest ghim + `ldd --version` trước khi đổi image (restore.md §2.3), đặt `HEARTBEAT_URL_WAL`; e2e test chuyển image đọc `ARG POSTGIS_IMAGE` thay vì tag (review L4-T07 round 2 MINOR-A)
- [x] Trước lần deploy thật: rollback dùng `COMPOSE_FILE` qua symlink `current` như lúc deploy (`scripts/deploy/lib/release.sh:48`, review L4-T05 r2 MINOR-1) + assert trong `deploy.test.sh`; xác minh Compose có resolve symlink cho bind `./postgres/init.sql` không — nếu có thì chuyển init.sql sang đường dẫn cố định hoặc `configs:` để postgres không bị recreate mỗi lần đổi release (MINOR-2); cấu hình required reviewers Environment `production`, nhánh mặc định `staging`, secret DEPLOY_* theo `docs/runbooks/deploy.md`
- [x] Pin action trong `.github/workflows/ci.yml` theo commit SHA (đang `@v4`; review L4-T05 r2 MINOR-4)
- [x] Dockerfile COPY `seed/` (và chạy `seed:categories` được trong container) trước deploy staging (review L4-T01)
- [x] Từ layer-1-task-06/L3-T03: kiểm `nginx -v` (≥ 1.18 cho `listen 443 ssl http2`) và `docker version` trên server; hỏi user bật Authenticated Origin Pulls (khối conf đã có, đang comment); smoke test 2 IP thật qua Cloudflare rơi vào 2 bucket rate limit (spec-validation layer 3)
- [→ L15-T01] Cloudflare cache rule: `/api/*` bypass **trừ `/api/media/file/*`** → cache (Edge TTL theo header origin immutable) — **chỉ áp host prod**; host staging bypass cache toàn bộ (hoặc Cloudflare Access) để ảnh/static staging không lọt qua basic auth (review L3-T03 round 2 MINOR-R2-1/R2-2) (G1 (user chốt 2026-10-17, phương án a): ngoại lệ cache cho ảnh `/api/media/file/*`)
- [→ L15-T01] Cloudflare Cache Rule: bypass cache khi request có header `rsc` / `next-router-prefetch` / `next-router-state-tree` / `next-router-segment-prefetch` hoặc query `_rsc` (Cloudflare bỏ qua `Vary`; origin đã trả `no-store` cho các biến thể này trên trang công khai; rule Cloudflare phải áp cho MỌI path, kể cả path có đuôi file); HTML và path có đuôi file tôn trọng TTL origin, không đặt Edge TTL ghi đè (review L4-T03 round 2)
- [x] ⏸ Mỗi bước chạm server (tạo thư mục, `.env`, Nginx, Cloudflare, chạy pipeline) chỉ làm sau khi user xác nhận trong chat
- [x] Compose staging chạy `tami-staging-*` (app, jobs, postgres, redis; SeaweedFS bucket riêng); chỉ app bind `127.0.0.1:3011`
- [x] Nginx `tami-staging.conf`: `nginx -t` PASS rồi mới reload; chỉ nhận IP Cloudflare; không sửa file site khác *(một phần: phần "chỉ nhận IP Cloudflare" → L15-T01)*
- [x] Cloudflare: DNS staging, SSL Full Strict, Cloudflare Access (hoặc basic auth) chặn công khai; `X-Robots-Tag: noindex` + robots `Disallow: /` *(một phần: basic auth + noindex + robots Done; DNS/SSL/Cloudflare → L15-T01)*
- [x] Pipeline CD chạy thật từ nhánh `staging`: image theo SHA → `payload migrate` → app + jobs up → `/api/health` 200; thử rollback một lần (health fail giả lập) có ghi evidence *(một phần: CD Done; diễn tập rollback → L12-T01 (user hoãn))*
- [x] Seed nền (tỉnh/phường, danh mục, pages) + dữ liệu mẫu `--sample` chỉ ở staging; email chỉ tới `EMAIL_ALLOWLIST`
- [x] Các trang đã có (dự án, tin tức, dịch vụ, pháp lý, tuyển dụng) mở được qua tên miền staging *(một phần: pháp lý (draft, admin publish) → L12-T01)*

## Tests cần viết
- Evidence: log pipeline, `curl -I` health + trang chủ qua Cloudflare, `nginx -t`, ảnh chụp trang
- Xác nhận DB staging khác DB production (tên env `DATABASE_URL_STAGING`)

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-01-round-<R>-review.md`

## Migration
- Chạy lần đầu toàn bộ migration đã commit tới L5 trên DB staging (bảng mới, additive). Kiểm danh sách migration trước khi chạy; cấm `db push`/reset. Từ đây migration đã apply ở staging **không được sửa**.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria (2026-10-18, staging tạm `https://187-52-119-50.sslip.io` — chưa có tên miền, không Cloudflare; user chốt):
  - Done: compose `tami-staging-*` (app/jobs/postgres/redis/seaweedfs), chỉ app bind `127.0.0.1:3011`; nginx 2 site sslip (`nginx -t` PASS rồi reload, không sửa site khác); basic auth + `X-Robots-Tag: noindex, nofollow, noarchive` + robots `Disallow: /`; CD chạy thật từ nhánh `staging` (b936204: image digest → migrate → app + jobs → `/api/health` 200); seed nền + `--sample` chỉ staging (email chỉ tới `EMAIL_ALLOWLIST`); Dockerfile có `seed/` (G20); CI migrate DB trống + importMap drift (G18) + pin action SHA; `siteName` đã điền trước khi publish privacy; mỗi bước server có xác nhận của user.
  - Rate limit 2 IP (runbook bước 11): cột đầu access log là IP thật; `click-events` qua `127.0.0.1:3011` với X-Real-IP giả lập: IP A 30×400 rồi 429, IP B 400 (bucket riêng); nginx luôn ghi đè `X-Real-IP $remote_addr` (`docker/nginx/tami-staging-sslip.conf:58`).
  - Trang (qua tunnel tới app, bỏ basic auth): `/`, `/en`, `/du-an` (6 dự án, ảnh `/api/media/file/*` 200), `/du-an/<slug>`, `/en/projects`, `/tin-tuc`, `/tuyen-dung` (3 tin), `/lien-he` 200; 404 đúng; `/vi/*` → 301 bỏ tiền tố. `/dich-vu/<slug>` 404 và `/tin-tuc` rỗng là đúng (dịch vụ + tin mẫu seed ở trạng thái draft). Console chỉ có 404 prefetch `/cho-thue` (trang layer sau) và `/chinh-sach-bao-mat` (chưa publish).
  - Server (AC L53): nginx 1.24 (không bật `http2`, tránh đổi giao thức site khác), Docker 29.7, Compose v5.5; DB staging (`tami-staging-postgres`, `/opt/tami/staging.env`) tách riêng — production chưa có env, kiểm khác DB production → `layer-15-task-01`.
  - Postgres không bị tạo lại khi đổi release (AC L50): `tami-staging-postgres` Created 06:25:55Z (release 0dfc8f9), RestartCount 0, giữ nguyên qua lần đổi sang b936204 (app Created 06:53:48Z) → bind `init.sql` qua `current` không gây recreate.
  - G17 phần code Done (`docker/Dockerfile:40-42`, `.github/workflows/deploy.yml:75`); repository variable `NEXT_PUBLIC_HOTLINE` chưa đặt → kiểm số hotline trên trang lỗi gốc chuyển `layer-12-task-01`.
  - Trang pháp lý (AC L62): 2 trang seed ở trạng thái draft (`/chinh-sach-bao-mat` 404 đúng); publish là thao tác nội dung của admin (đã điền `siteName` nên publish được) → kiểm mở được chuyển `layer-12-task-01`.
  - Hoãn: diễn tập rollback image (user 2026-10-18: tới lần deploy staging thật kế tiếp, trước M5 → `layer-12-task-01`; tạm dựa `scripts/deploy/deploy.test.sh` PASS); bản đồ `/lien-he` (site-settings chưa có `mapLocation`) → `layer-12-task-01`; upload source map GlitchTip thật (G18) → `layer-12-task-01` (bật giám sát ở đó); mọi mục Cloudflare (DNS, SSL Full Strict, nginx chỉ nhận IP Cloudflare, cache rule, Origin Pulls, `TRUST_CF_CONNECTING_IP`, smoke 2 IP qua Cloudflare) → `layer-15-task-01` (cần tên miền thật); backup (AC L49: user chốt staging không backup) → backup production ở `layer-15-task-01` kèm chi tiết L49; G10 báo động → trước M3 (`layer-12-task-01` bật giám sát); đối chiếu `budget.ts` trước khi đặt `TRANSLATION_MONTHLY_BUDGET_USD` production → `layer-15-task-01`.
- Verify commands + result: phần A `pnpm test` 141 file 1.538 PASS, build PASS, `deploy.test.sh` PASS; CI c0406c2/0dfc8f9/b936204 xanh; phần B chỉ đổi runbook (no code).
- Residual: `pnpm seed --sample` lần đầu trên staging exit 1 sau khi tạo 4 dự án (output bị cắt, không thấy lỗi); chạy lại PASS, DB không trùng (6 dự án / 6 media).
- Reviewer verdict: phần A round 4 STRICT PASS; CI round 1-2 PASS; deps round 1 PASS; phần B round 5 NORMAL FAIL (thiếu chỗ nhận 6 mục) → round 6 NORMAL PASS (`.context/review-reports/build-tami-website-layer-6-task-01-round-6-review.md`)
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-6.md`

## Doc / Decision Impact
- Doc impact result: `docs/runbooks/deploy.md` (§9 staging sslip + bước 12 rollback), `docs/ARCHITECTURE.md` §6.3 (phần A); task L12/L15 nhận mục hoãn
- Decision log: `.context/progress.json` decisions (staging sslip.io + basic auth, không backup/báo động tới M3, dịch AI tắt, hoãn rollback drill tới lần deploy staging thật kế tiếp)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-01 deploystg0` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- (server) /opt/tami/staging.env (không commit)
- (server) /etc/nginx/sites-available/tami-staging-sslip*.conf (copy từ `docker/nginx/tami-staging-sslip*.conf`)
- docs/runbooks/deploy.md (cập nhật kết quả thật)
- .context/decisions.md (runner, registry, tên miền staging)

## Notes
- HỎI USER TRƯỚC KHI LÀM: tên miền staging, cách runner (self-hosted `/opt/actions-runner-tami` hay build GitHub + SSH), registry (GHCR?), secret staging, Cloudflare Access hay basic auth. Không tự chọn; chưa có câu trả lời thì dừng ở trạng thái `blocked`.
- Firewall server đang tắt: KHÔNG tự bật (ảnh hưởng dự án khác), chỉ báo cáo.
- Giám sát + backup chưa bật ở đây; bật ở task redeploy staging đầy đủ.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5
- Nguồn: G17, G18 trong `.context/review-reports/spec-validation-build-tami-website-layer-5.md`.
- [x] G17: truyền `NEXT_PUBLIC_HOTLINE` làm build-arg (`ARG` + `ENV` trước `pnpm build`) trong `docker/Dockerfile` và `build-args` của `.github/workflows/deploy.yml` (lấy từ GitHub `vars`), để `src/app/global-error.tsx` hiện số hotline khi DB lỗi (design-spec S18); ghi vào `docs/runbooks/deploy.md`; kiểm trong image staging trang lỗi gốc có số hotline. Bổ sung biến vào danh sách R4 (`/brainstorm secrets`). *(một phần: code Done; kiểm số hotline thật → L12-T01)*
- [x] G18: CI kiểm `importMap.js` không lệch (lỗi thật đã xảy ra, commit a614b3d): bước `pnpm payload generate:importmap` + `git diff --exit-code` trong `.github/workflows/ci.yml`.
- [→ L12-T01] G18: kiểm upload source map GlitchTip thật: bật `GLITCHTIP_AUTH_TOKEN` (secret) + `vars.GLITCHTIP_*` cho staging, build image, gây lỗi thử và kiểm stack trace trên GlitchTip không minify (`scripts/upload-sourcemaps.mjs`, `docs/runbooks/deploy.md` §8).

## Follow-up từ spec-validation layer 5 addendum
- [x] G20: image runtime chưa có thư mục `seed/` (`docker/Dockerfile:61-68`) — đưa `seed/` + `scripts/seed*.{mjs,ts}` vào image (hoặc chạy seed bằng image builder); AC seed dùng `pnpm seed` (không còn `seed:categories`).
- [x] G21: trước khi đụng staging, chạy toàn bộ migration (17) trên DB PostGIS trống (CI hoặc tay) + thêm bước migrate vào CI.
- [x] G24: AC "các trang đã có mở được" chỉ kiểm các trang đã build tới lúc deploy; lần deploy đầu không có image trước nên không thử rollback image — ghi rõ trong evidence.

## Follow-up từ review layer-6-task-09
- [→ L15-T01] Bật `TRUST_CF_CONNECTING_IP=true` ở staging/prod (sau Cloudflare); nếu không mọi khách chung một bucket rate limit (vd ứng tuyển 3/giờ toàn site). Kiểm bằng 2 IP khác nhau.

## Follow-up từ review layer-6-task-07
- [→ L12-T01] Trên staging: mở `/lien-he` (site-settings có `mapLocation`) → bản đồ MapLibre vẽ được tile, console không lỗi "Worker failed to load"; ảnh chụp làm bằng chứng.
