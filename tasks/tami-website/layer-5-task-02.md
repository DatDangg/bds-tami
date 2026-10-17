# Task 02: Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion`

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + quyền chỉ admin + consentVersion (dữ liệu cá nhân)
- Blast radius: src/collections/Services.ts, Pages.ts; src/hooks/pages/sync-privacy-version.ts; seed/pages.ts (privacy, terms nháp), seed/sample/services.ts; …
- Doc impact (dự kiến): ERD §4.9/§4.9b nếu lệch
- Decision impact: NO

## Requirements
- FR-PUB-10, FR-PUB-14 (dữ liệu)
- FR-ADM-07 (dịch vụ)
- BR-30
- ERD §4.9, §4.9b
- PERMISSION §3.1, §4 (pages hasEnglish chỉ admin)

## Description
Dịch vụ (có `coverImage`) và 2 trang pháp lý route cố định theo `kind`; chỉ admin ghi.

## Dependencies
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)
- `layer-4-task-02` Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường) (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-07`, `layer-8-task-01`, `layer-8-task-05`, `layer-9-task-07`

## Acceptance Criteria
- [x] Trước khi collection nội dung mở Duplicate: `slugField` chung có `beforeDuplicate` để slug các locale không phải dạng `xyz - Copy` (sinh lại/để trống cho admin đặt; áp cả `developers`), có test (review L4-T01 round 2 MINOR-1) (chuyển từ layer-5-task-01)
- [x] G12: thêm slug collection công khai của task vào allowlist `PublicCollectionSlug` (`src/lib/content/public-queries.ts`) và (nếu dịch) `src/lib/translation/allowlist.ts`; test (spec-validation layer 4)
- [x] G7: `pages` (không slug/author, ERD §4.9b) và `services` (không author, ERD §4.9) dùng `withContentDefaults` qua option `omit`/`fieldAccess` của layer-4-task-01 — không chép lại logic factory (spec-validation layer 3)
- [x] `services`: đủ trường ERD §4.9, `coverImage` bắt buộc khi `published`, không có `author`; chỉ admin tạo/sửa/xoá
- [x] `pages`: `kind` ∈ {privacy, terms} unique, không đổi sau khi tạo; không có slug; `version`, `effectiveDate`
- [x] Bản `privacy` đang `published` → hook ghi `site-settings.privacyPolicyVersion = version`
- [x] `pages.hasEnglish` chỉ admin bật (field access); AI dịch xong đặt `pending_review` (logic ở task dịch)
- [x] Seed 2 bản ghi `pages` idempotent

## Tests cần viết
- Integration: sale tạo services/pages → 403
- Integration: publish privacy version 1.1 → site-settings đổi theo
- Integration: tạo `pages` kind trùng → lỗi

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-02-round-<R>-review.md`

## Migration
- Bảng `services`, `services_locales`, `pages`, `pages_locales`. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 1 (builder, hoàn thành)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 8/8 builder PASS (chờ Reviewer STRICT)
- Verify commands + result: `pnpm install --frozen-lockfile` OK · `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 79 files / 857 tests PASS (full, sau lần sửa cuối) · `pnpm build` OK · migration `20261017_092524_services_pages` applied (migrate:status Yes, batch 11), drift check: `migrate:create` lần 2 không sinh file (không có thay đổi schema) · `pnpm seed:pages` chạy 2 lần trên DB dev: tạo 2 rồi bỏ qua 2
- Reviewer verdict: **STRICT PASS round 1** (`.context/review-reports/build-tami-website-layer-5-task-02-round-1-review.md`). Residual MINOR-1/4 → AC `layer-6-task-01`; MINOR-2 → `layer-10-task-02`; MINOR-3 → `layer-5-task-03`; MINOR-5 → `layer-8-task-01`
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.9b: thêm hành vi as-built "gỡ xuất bản/ẩn/xoá `privacy` giữ nguyên `privacyPolicyVersion`". ERD §4.9/§4.9b còn lại khớp code (services/pages không `publishedAt`/`isFeatured`/`author`). API_SPEC/DESIGN: no doc impact.
- Decision log: unpublish/xoá privacy KHÔNG xoá `privacyPolicyVersion` (BR-30: consent đã lưu trỏ về phiên bản cuối đã công khai; form không được ghi `consentVersion` rỗng). `pages` bỏ `publishedAt` (ERD không có): FR-ADM-16 khi thêm `publishedAt ≤ now` vào `buildPublicWhere` phải loại trừ services/pages như đã làm với categories/developers.

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-02 svcpages` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Services.ts, Pages.ts
- src/hooks/pages/sync-privacy-version.ts
- seed/pages.ts (privacy, terms nháp), seed/sample/services.ts
- migrations/*

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
