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
- [ ] `src/lib/content/get-globals.ts` có `import "server-only"` nhưng gói chưa trong dependencies: thêm `server-only` vào dependencies (hoặc ghi rõ chỉ code bundle bởi Next được import; jobs/scripts dùng `read-global.ts`) khi nối truy vấn công khai (review L4-T02 round 2 MINOR-B)
- [ ] `publicWhere` là **nơi duy nhất** dựng điều kiện công khai (status, chưa xoá mềm, EN → `hasEnglish = true`); task hẹn giờ chỉ thêm `publishedAt ≤ now` ở đây
- [ ] Bản EN không bao giờ trả chữ tiếng Việt (fallback tắt) và bản ghi chưa có EN → `null` để trang gọi `notFound()`
- [ ] Trang công khai: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; HTML không phụ thuộc cookie
- [ ] `/admin`, `/api/*` không cache — **trừ `/api/media/file/*`**: `Cache-Control: public, max-age=31536000, immutable` (G1 (user chốt 2026-10-17, phương án a): ngoại lệ cache cho ảnh `/api/media/file/*`; kiểm header thật của route file Payload/storage-s3, không để bị ghi đè thành no-store)

## Tests cần viết
- Integration (collection test): draft/hidden/xoá mềm không ra; EN thiếu `hasEnglish` không ra; khách không đọc được trường nội bộ

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

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
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-03 pubq` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/lib/content/public-queries.ts (`findPublicList`, `findPublicBySlug`, `publicWhere(collection, locale)`)
- src/lib/content/pagination.ts
- next.config.ts (headers Cache-Control cho trang công khai, không cache `/admin`, `/api`)
- tests/integration/public-queries.test.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
