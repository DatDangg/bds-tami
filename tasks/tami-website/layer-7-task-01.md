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
- [ ] Gộp validator ảnh bìa trùng ở `News.ts:13-17` / `Services.ts:21-25` thành helper dùng chung khi property-posts cần (MINOR-4) (review L5-T03 round 1)
- [ ] G12: thêm slug collection công khai của task vào allowlist `PublicCollectionSlug` (`src/lib/content/public-queries.ts`) và (nếu dịch) `src/lib/translation/allowlist.ts`; test (spec-validation layer 4)
- [ ] Đủ trường ERD §4.7 (`offer` group, quan hệ dự án/tin cho thuê tuỳ chọn)
- [ ] `isOfferEnded` là nguồn duy nhất cho nhãn "Đã kết thúc" và loại khỏi khối "Ưu đãi nổi bật"
- [ ] Job 00:05 revalidate trang bài vừa hết hạn + trang chủ (cả vi/en); chạy lại idempotent
- [ ] Index `(status, has_english, category_id, published_at DESC)`, `(status, is_featured, offer_end_at)`

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
- Doc impact result: pending (dự kiến: ERD §4.7 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-7): task-01 posts` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/PropertyPosts.ts
- src/jobs/expire-offers.ts (00:05)
- src/lib/content/offer-status.ts (`isOfferEnded(post, now)`)
- seed/sample/property-posts.ts
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5 addendum
- [ ] G22: `property-posts.ward` lọc theo `province` + validate server; field upload có `validate` tuỳ biến phải gọi validator `upload` mặc định trước.

## Follow-up từ review layer-6-task-08
- [ ] `expire-offers` và `close-job-postings` chạy ở tiến trình `jobs` (ngoài Next) nên `revalidatePath` không có tác dụng: chọn một cơ chế revalidate liên tiến trình (vd endpoint nội bộ có xác thực gọi từ job, hoặc dựa ISR/thời gian render) và áp cho cả hai job.
