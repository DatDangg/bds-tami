# Task 01: Collection `property-posts` (Đăng tin BĐS) + job `expire-offers`

## Layer
7 — Đăng tin BĐS, SearchService, chi tiết Cho thuê, form ứng tuyển

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + RBAC + cron
- Blast radius: src/collections/PropertyPosts.ts; src/jobs/expire-offers.ts (00:05); src/lib/content/offer-status.ts (`isOfferEnded(post, now)`); …
- Doc impact (dự kiến): ERD §4.7 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-03
- BR-02, BR-04, BR-06
- ERD §4.7, §5
- ARCHITECTURE §5.4 (`expire-offers`)

## Description
CRUD bài Đăng tin BĐS (tin, voucher, ưu đãi) + job hằng ngày xử lý ưu đãi hết hạn.

## Dependencies
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)

Mở khoá cho: `layer-8-task-01`, `layer-8-task-02`, `layer-8-task-04`, `layer-8-task-05`, `layer-9-task-07`

## Acceptance Criteria
- [x] Gộp validator ảnh bìa trùng ở `News.ts:13-17` / `Services.ts:21-25` thành helper dùng chung khi property-posts cần (MINOR-4) (review L5-T03 round 1)
- [x] G12: thêm slug collection công khai của task vào allowlist `PublicCollectionSlug` (`src/lib/content/public-queries.ts`) và (nếu dịch) `src/lib/translation/allowlist.ts`; test (spec-validation layer 4)
- [x] Đủ trường ERD §4.7 (`offer` group, quan hệ dự án/tin cho thuê tuỳ chọn)
- [x] `isOfferEnded` là nguồn duy nhất cho nhãn "Đã kết thúc" và loại khỏi khối "Ưu đãi nổi bật"
- [x] Job 00:05 revalidate trang bài vừa hết hạn + trang chủ (cả vi/en); chạy lại idempotent
- [x] Index `(status, has_english, category_id, published_at DESC)`, `(status, is_featured, offer_end_at)`

## Tests cần viết
- Unit `isOfferEnded` biên múi giờ VN
- Integration: job gọi revalidate đúng đường dẫn
- Integration: sale sửa/xoá bài Đăng tin BĐS của sale khác → 403; xoá mềm + admin khôi phục; không xoá được danh mục đang có bài Đăng tin BĐS

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-7-task-01-round-<R>-review.md`

## Migration
- Bảng `property_posts`, `property_posts_locales`, rels + index. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): MAJOR-1 migration `down` DROP CONSTRAINT thiếu IF EXISTS sau DROP TABLE CASCADE (+ MINOR enum jobs, trần 500 im lặng)
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: tất cả AC + Follow-up G12/G22/gộp cover-image/revalidate liên tiến trình Done (builder tick ở trên)
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm test` (147 file, 1.582, 0 skip) · `pnpm build` PASS; `migrate:down` + `migrate` trên DB dev OK; test migration up→down→up trên DB tạm
- Rollback note: `down` của `20261018_075627_property_posts` xoá row `payload_jobs`/`payload_jobs_log` của task `expire-offers` (mất lịch sử chạy + job đang chờ; task chỉ làm mới cache)
- Residual: chưa thử end-to-end `jobs → app:3000/api/internal/revalidate` trong Docker → smoke ở lần deploy staging kế tiếp (L12-T01); job lỡ cả ngày thì bài hết hạn ngày đó chỉ làm mới khi cache hết hạn tự nhiên (chấp nhận)
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-7-task-01-round-2-review.md`)
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-7.md`

## Doc / Decision Impact
- Doc impact result: ERD §4.7 + §5, ARCHITECTURE §4/§5.4 (job + làm mới cache từ job), API_SPEC §3.8 (route nội bộ)
- Decision log: quyết định thiết kế ghi ở Notes (revalidate nội bộ Bearer HMAC từ PAYLOAD_SECRET, nginx 404 `/api/internal/`); không có decision mới cần user

## Commit / Tracking
- Commit gợi ý: `feat(layer-7): task-01 posts` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/PropertyPosts.ts
- src/jobs/expire-offers.ts (00:05)
- src/lib/content/offer-status.ts (`isOfferEnded(post, now)`)
- seed/sample/property-posts.ts
- migrations/*

## Notes
- —
- **Builder (L7-T01) — quyết định thiết kế:**
  - `cover` theo ERD ghi `R` nhưng áp quy ước `news`/`services` (bắt buộc khi `published`, nháp được thiếu) qua helper dùng chung `src/fields/cover-image.ts` (`validateCoverWhenPublished`, luôn gọi validator `upload` mặc định trước). Hệ quả: `services.coverImage` giờ cũng chỉ nhận ảnh (test services dùng media `image/jpeg`, thêm test PDF → 400).
  - "Đã kết thúc" không lưu cờ: `isOfferEnded` + `offerNotEndedWhere`/`offerJustEndedWhere` (`src/lib/content/offer-status.ts`); `endAt` là NGÀY giờ VN (hết hiệu lực từ 00:00 ngày kế tiếp), dùng lại `careers/deadline`. Job `expire-offers` (cron `0 5 17 * * *` = 00:05 VN) chỉ revalidate, không đổi bản ghi; idempotent.
  - **Revalidate liên tiến trình** (áp cho `expire-offers` và `close-job-postings`): route nội bộ `POST /api/internal/revalidate` + client `revalidateFromJob`. Chọn phương án đơn giản nhất an toàn: Bearer = HMAC(`PAYLOAD_SECRET`, nhãn riêng) nên KHÔNG thêm secret mới; Nginx 404 `/api/internal/` (3 conf); chỉ nhận `/{vi|en}...`; lỗi gọi ném ra để Payload Jobs retry. Thêm env tuỳ chọn `INTERNAL_APP_URL` (compose đặt `http://app:3000`). Phương án bỏ: dựa hoàn toàn vào ISR 60s (không đạt AC "job revalidate"), secret riêng (thêm việc vận hành, không an toàn hơn).
  - `ward` tuỳ chọn nhưng chọn `ward` mà thiếu `province` → 400 (`validateWardWithOptionalProvince`); guard xoá tỉnh/phường mở rộng sang `property-posts`.
  - Chưa làm (ngoài scope): trang công khai `/tin-bds`, khối "Ưu đãi nổi bật" (L7-T03/L8), revalidate trang danh mục `/tin-bds/danh-muc/[category]` từ job.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5 addendum
- [x] G22: `property-posts.ward` lọc theo `province` + validate server; field upload có `validate` tuỳ biến phải gọi validator `upload` mặc định trước.

## Follow-up từ review layer-6-task-08
- [x] `expire-offers` và `close-job-postings` chạy ở tiến trình `jobs` (ngoài Next) nên `revalidatePath` không có tác dụng: chọn một cơ chế revalidate liên tiến trình (vd endpoint nội bộ có xác thực gọi từ job, hoặc dựa ISR/thời gian render) và áp cho cả hai job.

## Follow-up từ review layer-7-task-01 round 2
- [ ] Test migration chèn thêm 1 dòng `payload_jobs_log` của `expire-offers` để bắt trường hợp bỏ `DELETE FROM payload_jobs_log` trong `down` (MINOR-1).
