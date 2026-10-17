# Task 03: Collection `news` (Tin tức)

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + RBAC
- Blast radius: src/collections/News.ts; seed/sample/news.ts; migrations/*
- Doc impact (dự kiến): ERD §4.8 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-04
- BR-02, BR-04
- ERD §4.8, §5

## Description
CRUD tin tức (danh mục, tags, bìa, nội dung) dùng bộ field chung.

## Dependencies
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-03`, `layer-6-task-06`, `layer-8-task-05`, `layer-9-task-07`

## Acceptance Criteria
- [x] Test duplicate qua Local API `overrideAccess: true`: bản sao có `slugs.en` sinh lại hoặc rỗng VÀ `hasEnglish === false` (`src/fields/slug.ts:112`) (MINOR-3) (review L5-T02 round 1)
- [x] G12: thêm slug collection công khai của task vào allowlist `PublicCollectionSlug` (`src/lib/content/public-queries.ts`) và (nếu dịch) `src/lib/translation/allowlist.ts`; test (spec-validation layer 4)
- [x] Đủ trường ERD §4.8
- [x] Index `(status, has_english, category_id, published_at DESC)`, UNIQUE `(_locale, slug)`
- [x] Không thu lead (không có quan hệ leads)

## Tests cần viết
- Integration: sale sửa/xoá tin tức của sale khác → 403; xoá mềm + admin khôi phục; không xoá được danh mục đang có tin tức

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-03-round-<R>-review.md`

## Migration
- Bảng `news`, `news_locales`, `news_tags` + index. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 1 (builder; chờ reviewer STRICT)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 PASS (builder, attempt 1): AC1 Duplicate lộ lỗi thật (hasEnglish giữ true) → sửa `hasEnglishField` (`beforeDuplicate` → false), test `news.test.ts` Duplicate; AC2 `news` thêm vào `PublicCollectionSlug`, allowlist dịch đã có sẵn (thêm `allowlist.test.ts`); ERD §4.8 đủ trường (`cover` R khi published, `tags` → `news_texts`); index `news_list_idx` (status, has_english, category_id, published_at DESC) SQL tuỳ biến trong migration `20261017_093650_news` + UNIQUE (slug, _locale) do Payload sinh; không có quan hệ leads (test)
- Verify commands + result: `pnpm install --frozen-lockfile` OK · `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` FULL 81 files / 874 tests PASS (sau lần sửa cuối) · `pnpm build` OK · `migrate` + `migrate:status` (batch 12 Yes) OK · drift check `migrate:create` → "No schema changes detected" (không sinh file) · `APP_ENV=production pnpm seed:sample-news` → thoát code 1
- Reviewer verdict: **STRICT PASS round 1** (`.context/review-reports/build-tami-website-layer-5-task-03-round-1-review.md`). Residual MINOR-1 → AC `layer-9-task-07`; MINOR-2/3 → `layer-6-task-06`; MINOR-4 → `layer-7-task-01`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: ERD §4.8 (`cover` R khi `published`, `tags` ở `news_texts`) + ERD §5 index `news_list_idx` reconciled as-built; không đổi API_SPEC/DESIGN
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-03 news` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/News.ts
- seed/sample/news.ts
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
