# Task 03: Truy vấn công khai dùng chung + chính sách cache

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — data access dùng chung cho mọi trang công khai; cache key; lọc bản EN
- Blast radius: src/lib/content/public-queries.ts (`findPublicList`, `findPublicBySlug`, `publicWhere(collection, locale)`); src/lib/content/pagination.ts; next.config.ts (headers Cache-Control cho trang công khai, không cache `/admin`, `/api`); …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- BR-07
- NFR-01, NFR-03
- API_SPEC §1 (Local API `overrideAccess: false`)
- ARCHITECTURE §5.1 (Cache-Control `s-maxage=60`)
- ERD §1 (điều kiện công khai)

## Description
Một lớp truy vấn duy nhất cho website: luôn `overrideAccess: false`, `locale`, `fallbackLocale: false`, lọc `hasEnglish=true` ở EN, phân trang; chính sách cache cho trang công khai.

## Dependencies
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)

Mở khoá cho: `layer-5-task-08`, `layer-6-task-04`, `layer-6-task-05`, `layer-6-task-06`, `layer-6-task-07`, `layer-6-task-08`, `layer-7-task-03`, `layer-8-task-04`, `layer-9-task-01`, `layer-16-task-01`

## Acceptance Criteria
- [x] `src/lib/content/get-globals.ts` có `import "server-only"` nhưng gói chưa trong dependencies: thêm `server-only` vào dependencies (hoặc ghi rõ chỉ code bundle bởi Next được import; jobs/scripts dùng `read-global.ts`) khi nối truy vấn công khai (review L4-T02 round 2 MINOR-B)
- [x] `publicWhere` là **nơi duy nhất** dựng điều kiện công khai (status, chưa xoá mềm, EN → `hasEnglish = true`); task hẹn giờ chỉ thêm `publishedAt ≤ now` ở đây
- [x] Bản EN không bao giờ trả chữ tiếng Việt (fallback tắt) và bản ghi chưa có EN → `null` để trang gọi `notFound()`
- [x] Trang công khai: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; HTML không phụ thuộc cookie
- [x] `/admin`, `/api/*` không cache — **trừ `/api/media/file/*`**: `Cache-Control: public, max-age=31536000, immutable` (G1 (user chốt 2026-10-17, phương án a): ngoại lệ cache cho ảnh `/api/media/file/*`; kiểm header thật của route file Payload/storage-s3, không để bị ghi đè thành no-store)

## Tests cần viết
- Integration (collection test): draft/hidden/xoá mềm không ra; EN thiếu `hasEnglish` không ra; khách không đọc được trường nội bộ

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 3 (user duyệt; sau Reviewer round 2 FAIL — MAJOR-1 RSC/_rsc cache poisoning). Attempt 2: sau round 1 FAIL (404 path có dấu chấm s-maxage 1 năm)
- Last failure type: review MAJOR-1 — 404 của path có dấu chấm (`/robots.txt`...) nhận mặc định Next `s-maxage=31536000` nên CDN giữ 1 năm
- Root cause: `PUBLIC_PAGE_SOURCE` loại path có đuôi file nhưng không có rule nào thay; request tới file không tồn tại rơi vào `/_not-found` tĩnh (Next gắn `s-maxage=31536000`)
- Fix: thêm rule `DOTTED_PATH_SOURCE` + `DOTTED_PATH_CACHE_CONTROL = public, max-age=0, s-maxage=60` (trừ `/_next`, `/api`, `/admin`, `/_vercel`); sửa MINOR-1 (ghi chú populate EN không lọc `hasEnglish`) và MINOR-2 (kiểu `PublicCollectionSlug`)
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 đạt (reviewer STRICT PASS)
- Verify commands + result (builder, sau lần sửa cuối): `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi · `pnpm typecheck` 0 lỗi · `pnpm test` 73 file / 762 test PASS · `pnpm build` OK. Header thật đo bằng `next start` (cổng 3055, đã dọn process + media tạm): `/` và `/en` → `public, s-maxage=60, stale-while-revalidate=300`, không `Set-Cookie` (kể cả khi gửi Cookie); `/admin`, `/admin/login` → `no-store`; `/api/health` → `no-store`; `/api/metrics` → `no-store`; `/api/monitoring-config` → `private, max-age=300`; `/api/media/file/<ảnh thật trên SeaweedFS>` → `public, max-age=31536000, immutable`; media 404, `/api/staff`, `/api/staff/me` → `no-store`; 404 của trang → `private, no-cache, no-store` (Next). Integration (storage-s3 thật): file media 200 và 304 đều `immutable`.
- Attempt 2 (builder): `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi · `pnpm typecheck` 0 lỗi (đã thử slug sai `media`/`categorie` → TS2345) · `pnpm test` 73 file / 777 test PASS · `pnpm build` OK. Header thật (`next start` cổng 3078, đã dừng process): `/robots.txt` 404, `/sitemap.xml` 404 và `/brand/tami-logo-gold.png` 200 → `public, max-age=0, s-maxage=60`; `/_next/static/chunks/*.js` 200 → `public, max-age=31536000, immutable`; `/`, `/en`, `/vi`(301) → `public, s-maxage=60, stale-while-revalidate=300`; `/admin` → `no-store`; `/api/health` → `no-store`; `/api/monitoring-config` → `private, max-age=300`; `/api/media/file/khong-co.jpg` 404 → `no-store`; `/khong-ton-tai` 404 → `private, no-cache, no-store, max-age=0, must-revalidate`.
- Lưu ý MINOR-1: ở `/en` doc liên quan được populate (depth > 0) chỉ lọc theo access, không lọc `hasEnglish`; trang phải bỏ doc có `hasEnglish !== true` khi render link/thẻ (ghi trong JSDoc `findPublicList` và ARCHITECTURE §5.1).
- Attempt 3 (builder, sau round 2 FAIL): `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi · `pnpm typecheck` 0 lỗi · `pnpm test` 73 file / 778 test PASS · `pnpm build` OK. Header đo thật (`next start` cổng 3097, đã dừng process, cổng trống):

  | Request | Status | Cache-Control | Vary |
  |---|---|---|---|
  | `/`, `/en` | 200 | `public, s-maxage=60, stale-while-revalidate=300` | rsc, next-router-*, Accept-Encoding |
  | `/` + `RSC: 1` | 307 → `/?_rsc` | `no-store` | Sec-CH-Prefers-Color-Scheme |
  | `/?_rsc=abc` (không RSC) | 200 text/html | `no-store` | rsc, next-router-*, Accept-Encoding |
  | `/?_rsc=abc` + `RSC: 1` | 307 → `/?_rsc` | `no-store` | Sec-CH-Prefers-Color-Scheme |
  | `/?_rsc` + `RSC: 1` | 200 text/x-component | `no-store` | (không đo) |
  | `/en` + `RSC: 1` | 307 → `/en?_rsc` | `no-store` | Sec-CH-Prefers-Color-Scheme |
  | `/` + `Next-Router-Prefetch: 1` + `RSC: 1` | 307 → `/?_rsc=<hash>` | `no-store` | Sec-CH-Prefers-Color-Scheme |
  | `/robots.txt` | 404 | `public, max-age=0, s-maxage=60` | rsc, next-router-*, Accept-Encoding |
  | `/admin` | 200 | `no-store` | rsc, next-router-*, Accept-Encoding |
  | `/api/health` | 200 | `no-store` | Sec-CH-Prefers-Color-Scheme, rsc, next-router-* |
  | `/api/monitoring-config` | 200 | `private, max-age=300` | như trên |

- Retry attempt 3: MAJOR-1 round 2 (biến thể RSC nhận `public`) sửa bằng rule `has` header `rsc`/`next-router-prefetch`/`next-router-state-tree`/`next-router-segment-prefetch` + query `_rsc` → `no-store`, đặt sau rule công khai (Next 16 cho rule sau thắng, đã đo). MINOR-A: `PublicCollectionSlug` đổi sang allowlist `categories | developers`. MINOR-B: chấp nhận, residual (ảnh trong `public/` `max-age=0`, tách thư mục có hash sau).
- Residual: hành vi Cloudflare bỏ qua `Vary` chưa đo trên CDN thật; AC bypass theo `rsc`/`_rsc` đã gắn vào layer-6-task-01. Draft mode cookie `__prerender_bypass` và server action POST vẫn chưa có rule riêng.
- Reviewer verdict: round 1 FAIL → round 2 FAIL → **STRICT PASS round 3** (`.context/review-reports/build-tami-website-layer-4-task-03-round-3-review.md`). Residual: MINOR-1 RSC trên path có đuôi file + MINOR-2 comment/test title → AC `layer-5-task-08`; MINOR-3 `_rsc` rỗng không khớp `has` (vô hại, ghi ARCH §5.1); chưa đo Cloudflare thật (AC `layer-6-task-01`); draft/live preview sau này cần AC no-store riêng; MINOR-B file `public/` max-age=0
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-4.md`)

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5.1 thêm đoạn As-built (cơ chế đặt header, thứ tự ưu tiên config vs route, `modifyResponseHeaders` cho ảnh, `withDefaultNoStore`). Không đổi API/ERD/DESIGN. Thêm AC Cloudflare bypass RSC vào `layer-6-task-01`, follow-up RSC path có đuôi file vào `layer-5-task-08`.
- Decision log: `/api/*` không khai trong next.config (config headers thắng header route) → `withDefaultNoStore` ở catch-all; ảnh immutable qua `Media.upload.modifyResponseHeaders`; path có đuôi file TTL 60s; biến thể RSC `no-store`; `PublicCollectionSlug` allowlist

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-03 pubq` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/lib/content/public-queries.ts (`findPublicList`, `findPublicBySlug`, `publicWhere(collection, locale)`)
- src/lib/content/pagination.ts
- next.config.ts (headers Cache-Control cho trang công khai, không cache `/admin`, `/api`)
- tests/integration/public-queries.test.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
