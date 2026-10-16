# Task 01: Collection `projects` (Dự án)

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
- Blast radius: src/collections/Projects.ts; seed/sample/projects.ts (dữ liệu mẫu dev/staging, ảnh picsum); migrations/*
- Doc impact (dự kiến): ERD §4.5, §5 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-01
- BR-02, BR-04, BR-05
- LGL-02
- ERD §4.5, §5 (index projects)

## Description
CRUD dự án trong admin đủ trường ERD §4.5, dùng bộ field chung.

## Dependencies
- `layer-2-task-02` `provinces`, `wards` + khung seed (`pnpm seed`) và dữ liệu 34 tỉnh/thành (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-02`, `layer-6-task-04`, `layer-6-task-05`, `layer-7-task-01`, `layer-8-task-01`, `layer-8-task-02`, `layer-8-task-05`, `layer-9-task-07`

## Acceptance Criteria
- [ ] Đủ trường ERD §4.5 (gồm `location` PostGIS point, `scale`, `amenities`, `floorPlans`, `documents`, `legalInfo`, `salesPolicy`)
- [ ] `gallery` bắt buộc khi `published`; ảnh đầu là ảnh đại diện
- [ ] Dùng factory kit: slug, seo, status, publishedAt, author, isFeatured, hasEnglish/translation, versions, xoá mềm, revalidate
- [ ] Index `(status, has_english, sales_status, province_id)` + GIST `location` + UNIQUE `(_locale, slug)` trong `projects_locales`

## Tests cần viết
- Integration: publish thiếu gallery → lỗi
- Integration: sale sửa/xoá dự án của sale khác → 403; xoá mềm + admin khôi phục; không xoá được danh mục đang có dự án
- Integration: khách đọc draft → không thấy

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-01-round-<R>-review.md`

## Migration
- Bảng `projects`, `projects_locales`, bảng array/rels + index SQL tuỳ biến (GIST, composite). Additive.
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
- Doc impact result: pending (dự kiến: ERD §4.5, §5 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-01 projects` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/Projects.ts
- seed/sample/projects.ts (dữ liệu mẫu dev/staging, ảnh picsum)
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
