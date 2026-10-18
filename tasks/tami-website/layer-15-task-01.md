# Task 01: Deploy production (cần user duyệt, mốc M5) + kiểm tra AI-readiness + bàn giao

## Layer
15 — Release: deploy production

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: DevOps
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — production + migration + dữ liệu thật
- Blast radius: (server) /opt/tami/.env (không commit); (server) tami.conf Nginx; docs/runbooks/deploy.md, docs/runbooks/restore.md (cập nhật)
- Doc impact (dự kiến): docs/runbooks/*; ARCHITECTURE §6.3 (tên miền thật)
- Decision impact: NO

## Requirements
- NFR-05, NFR-06, NFR-10
- .agent/devops.md Phase 3 + Phase Final (AI-readiness)
- SPECIFICATIONS § Câu hỏi mở (Q1, Q4, Q5, Q6, tên miền cần trước go-live/production)

## Description
Promote đúng image + migration đã chạy ở staging lên production sau khi user duyệt.

## Dependencies
- `layer-14-task-01` Header bảo mật: CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy (thứ tự: làm sau khi Should xong)
- `layer-14-task-02` Kiểm tra CWV, WCAG AA, responsive trên các trang chính và sửa lỗi nhỏ (thứ tự: làm sau khi Should xong)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (cần staging đủ Must để đo/kiểm)
- `layer-13-task-01` Dashboard admin (FR-ADM-14): lead, nội dung, lượt bấm, cảnh báo dịch, chi phí dịch (thứ tự: làm sau khi Should xong)
- `layer-13-task-02` Quản lý chuyển hướng 301 trong admin (FR-ADM-15): kiểm tra hợp lệ, chống vòng/chuỗi (thứ tự: làm sau khi Should xong)
- `layer-13-task-03` Trang đích khu vực Cho thuê (FR-PUB-16, S06) (thứ tự: làm sau khi Should xong)
- `layer-13-task-04` Khối Đối tác / chủ đầu tư trên trang chủ (FR-PUB-17) (thứ tự: làm sau khi Should xong)

Mở khoá cho: `layer-16-task-01`

## Acceptance Criteria
- [ ] Trước production: `scrubText` NFKC normalize + mở rộng lớp ký tự (`/`, `–`, `_`, `%20`, chữ số full-width) và không cắt 4096 giữa dãy số (lùi điểm cắt trước dãy số cuối) — hoặc ghi rõ giới hạn đã biết (`src/lib/monitoring/scrub-text.ts:6,41`) (MINOR-2/3) (review L5-T05 round 2)
- [ ] ⏸ Mốc M5: user duyệt production deploy; đã có tên miền, Q4 nội dung thật, Q6 hạn mức Claude API, Q5 (pháp lý EN) xử lý
- [ ] Không có migration `HIGH_RISK_MIGRATION` chưa xử lý; migration đã chạy staging
- [ ] Deploy qua GitHub Environment `production` (required reviewers) đúng digest image staging
- [ ] Health check production 200; fail → tự rollback image trước
- [ ] Không seed dữ liệu mẫu ở production; chỉ seed nền
- [ ] AI-readiness: `llms.txt`, `robots.txt` (không chặn AI crawlers, có Sitemap), sitemap, JSON-LD — kiểm bằng curl
- [ ] Uptime Kuma + backup production chạy; diễn tập khôi phục lần đầu lên staging (RTO đo được)
- [ ] Search Console + GA4 cấu hình (ID trong site-settings)

## Tests cần viết
- Evidence: log deploy, health, curl các file AI-readiness, kết quả backup/restore

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Thao tác server: chỉ sau khi user xác nhận từng bước; evidence ghi vào task + Run Journal
- Reviewer report path: `.context/review-reports/build-tami-website-layer-15-task-01-round-<R>-review.md`

## Migration
- Chạy `payload migrate` production với đúng tập migration đã qua staging. Cấm `db push`, reset, seed mẫu, clone data staging→prod.

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: docs/runbooks/*; ARCHITECTURE §6.3 (tên miền thật))
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-15): task-01 deployprod` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-15/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- (server) /opt/tami/.env (không commit)
- (server) tami.conf Nginx
- docs/runbooks/deploy.md, docs/runbooks/restore.md (cập nhật)

## Notes
- Hẹn giờ xuất bản (Could) KHÔNG nằm trong lần deploy này; làm ở layer cuối và lên production qua lần deploy kế tiếp (CD: staging → duyệt tay → production).
- Sau task này: spec-publisher sinh `spec/test-scope/current.json` (`trigger: initial-build`) theo `.agent/loop.md`; chạy lại sau khi Could lên production.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-07
- [ ] Bấm Từ chối/Đồng ý trên CookieBanner xong focus rơi về `<body>` (`src/components/consent/CookieBanner.tsx:114,150-155`) → chuyển focus `main#main` nếu focus đang trong banner.

## Follow-up từ review layer-5-task-08
- [ ] Thêm test khoá `src/app/(frontend)/[locale]/layout.tsx`: `generateStaticParams()` trả `[]` (không prerender trang công khai lúc build) và `generateMetadata` noindex khi `APP_ENV` ≠ production — tránh hồi quy MAJOR-3.

## Follow-up từ review layer-5-task-01
- [ ] FK `NOT NULL` + `ON DELETE set null` (vd `projects.province_id`, `author_id`, `floor_plans.image_id`): xoá tỉnh/nhân viên/media đang được tham chiếu trả 500 → thêm `beforeDelete` trả 409 rõ ràng (mẫu `Provinces.beforeDelete`).

## Follow-up từ review layer-6-task-03
- [ ] Xoá cứng/vào thùng rác nội dung → dọn `redirects` trỏ tới đường dẫn của nó (m3).
- [ ] Test ghi redirect song song cùng một tài liệu sang 2 slug (khoá advisory thật sự được kiểm, r2-m1).
- [ ] `resolve-redirect.ts`: đưa bước khởi động Payload vào cùng cuộc đua timeout 400 ms (r2-m2).
- [ ] `proxy.ts:18`: giữ query của đích redirect nếu có (r2-m4).

## Follow-up từ review layer-6-task-02
- [ ] `build-search-text.ts:141-144`: UPDATE bản version mới nhất giả định versions luôn bật — thêm kiểm tra/comment (MINOR B).
- [ ] Test riêng nhánh rentals của guard xoá tỉnh (MINOR C).

## Follow-up từ review layer-6-task-09
- [ ] `jobApplicationFieldsSchema`: chặn NUL/ký tự điều khiển trong `fullName`/`message` (đang 500 do Postgres) → 400.
- [ ] Giới hạn số part/field multipart trong `job-application-body.ts`; giảm sao chép buffer.
- [ ] Thu hẹp map `ValidationError` → 400 `cvInvalid` chỉ khi lỗi ở field `file` (`job-applications.ts:110`).
- [ ] Test bù trừ CV kiểm cả object S3 bị xoá (`tests/integration/job-applications.test.ts:302`).

## Follow-up từ review layer-6-task-10
- [ ] `private-file-download.ts:45-51` `resolveObjectKey` tôn trọng `prefix` của plugin storage.
- [ ] Test admin bị khoá: chỉ chấp nhận 401 (PERMISSION §5).
- [ ] `CvDownloadButton.tsx:21`: bỏ thuộc tính `download` (server đã gửi attachment) để lỗi 401/403/500 hiện ra thay vì lưu thành file.
- [ ] Tài khoản bị khoá tạm (`lockUntil`) còn JWT cũ: cân nhắc chặn ở tầng xác thực chung (F1).

## Follow-up từ review layer-6-task-06
- [ ] `resolve-missing-page.ts:80-84`: cache đầy thì xoá cũ nhất thay vì xoá hết.
- [ ] JSON-LD Article: không có ảnh bìa thì bỏ `image` (đang ra URL gốc site); thêm `author` = Organization publisher.
- [ ] `ShareButtons.tsx:57`: kiểm link chia sẻ Zalo trên điện thoại thật; bỏ `title={title}`.
- [ ] Trang danh mục và `?page≥2`: ảnh đầu tiên có priority (LCP).
- [ ] hreflang ở `?page=n` không trỏ tới trang EN không tồn tại.
- [ ] `?page` vượt quá → 301 về trang cuối hoặc 404 có nội dung (xử lý ở proxy).

## Follow-up từ review layer-6-task-07
- [ ] `legal-page.ts:17` dùng `depth: 1` để link nội bộ trong trang pháp lý thành link thật.
- [ ] Hero dịch vụ: thêm fallback `vh` cho `svh`.
- [ ] Trang pháp lý: thêm meta description.
- [ ] `RichText.tsx:348`: tách options render cho dễ đọc.

## Follow-up từ review layer-6-task-04
- [ ] 404 khi `?page` vượt phạm vi trên `/du-an`, `/tin-tuc` đang `public, s-maxage=60` → no-store hoặc 301 về trang cuối.
- [ ] Tách `ProjectListPage` (~70 dòng) thành helper toolbar/empty-state.
- [ ] Test chứng minh `findPublicList` với `select` không tải trường dài (`overview`…).
- [ ] Seed mẫu: không ghi đè tên EN của danh mục admin tạo trùng tên VI.
- [ ] Skeleton 6 thẻ cho `/du-an` (`loading.tsx`) nếu đo thấy cần.

## Follow-up từ review layer-6-task-08
- [ ] Migration `20261017_175237_close_job_postings_task` `down`: xoá job `close-job-postings` trong `payload_jobs` trước khi bỏ giá trị enum (hoặc ghi runbook).
- [ ] `JobDetail.tsx:56`: tin hết hạn trên mobile bỏ padding 64px của thanh dính không hiển thị.
- [ ] Seed mẫu tuyển dụng: không publish bản nháp thật trùng tiêu đề VI (`completeLegacyDraft`).
- [ ] `tuyen-dung/[slug]/page.tsx:78/106`: dùng chung một `now` cho metadata và trang.

## Follow-up từ review layer-6-task-01 (phần A round 2)
- [ ] **Chặn trước production:** `docker/nginx/tami.conf` (và `tami-staging.conf` bản Cloudflare) đang `listen 443 ssl http2` — trên server dùng chung nginx 1.24, `http2` thuộc socket chung nên bật HTTP/2 cho mọi site khác. Bỏ `http2` (hoặc chỉ giữ khi mọi vhost trên 443 đã có), không đặt `ipv6only`/`default_server` trùng; `nginx -t` trên 1.24 kèm vhost giả trước khi bật.
- [ ] Production chạy trên server dùng chung (187.52.119.50, nhiều site khác): mọi bước cô lập như staging (file site mới, compose project riêng, reload không restart, không cài/nâng nginx/certbot).

## Follow-up từ review layer-6-task-01 (phần A round 4)
- [ ] Chạy kịch bản e2e backup `sftp` (`docker/backup/test/e2e.sh sftp`) trước khi bật backup production (chỉ `s3` đã PASS).
- [ ] `scripts/deploy/deploy.test.sh:258-265`: dùng `printf '%s
'` / `$'...'` thay xuống dòng thật trong chuỗi.

## Follow-up từ review sửa CI (layer-6-task-01)
- [ ] `ci.yml`: kiểm kết quả tạo bucket SeaweedFS (`s3.bucket.list` hoặc grep output như `docker-compose.prod.yml:270`) thay vì tin exit code của `weed shell`.
- [ ] Cân nhắc ghim image SeaweedFS trong CI theo digest.

## Follow-up từ review sửa dependency runtime (layer-6-task-01)
- [ ] `tests/unit/runtime-dependencies.test.ts`: thêm nhánh `require(` và bỏ qua `import type`/`export type` (MINOR).

## Follow-up hoãn từ layer-6-task-01 (staging sslip.io, chưa có tên miền)
- [ ] Cần tên miền thật trước M5. Các AC Cloudflare của L6-T01 chưa làm vì staging không qua Cloudflare: DNS + SSL Full Strict, cache rule `/api/*` bypass trừ `/api/media/file/*`, bypass biến thể RSC, Authenticated Origin Pulls (hỏi user), `TRUST_CF_CONNECTING_IP=true` + smoke 2 IP thật qua Cloudflare rơi vào 2 bucket.
- [ ] Nginx production chỉ nhận IP Cloudflare (allow/deny theo dải Cloudflare, `tami.conf`) — AC L58 của L6-T01, staging sslip không qua Cloudflare nên chưa áp.
- [ ] Backup production lần đầu (chi tiết từ AC L49 của L6-T01; staging không backup theo user): tạo `BACKUP_ENV_DIR` + env pgBackRest/restic (đích S3/SFTP user chốt), `stanza-create`, `restic init`, kiểm digest base `postgis/postgis:17-3.5` trên server khớp digest ghim + `ldd --version` trước khi đổi image (restore.md §2.3), đặt `HEARTBEAT_URL_WAL`; e2e test chuyển image đọc `ARG POSTGIS_IMAGE` thay vì tag (review L4-T07 round 2 MINOR-A).
- [ ] Đối chiếu bảng giá `src/lib/translation/budget.ts` trước khi đặt `TRANSLATION_MONTHLY_BUDGET_USD` production (staging đang 0).
- [ ] Xác nhận DB production khác DB staging (tên DB/host trong `prod.env` ≠ `/opt/tami/staging.env`), không sync data staging→prod (Tests của L6-T01).
