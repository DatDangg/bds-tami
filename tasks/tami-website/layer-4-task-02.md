# Task 02: Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường)

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — schema + field-level access (email nhận thông báo không được lộ)
- Blast radius: src/globals/SiteSettings.ts, Header.ts, Footer.ts; src/lib/content/get-globals.ts (đọc global theo locale, có cache tag); migrations/*
- Doc impact (dự kiến): ERD §4.15 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-08
- FR-PUB-12 (link nút nổi)
- BR-30 (`privacyPolicyVersion`)
- BR-08 (`translationGlossary`, `translationEnabled`)
- ERD §4.15
- PERMISSION §3.2

## Description
Cấu hình chung + menu + footer, có bản EN và nhóm `translation`.

## Dependencies
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)

Mở khoá cho: `layer-5-task-02`, `layer-5-task-05`, `layer-5-task-06`, `layer-5-task-07`, `layer-5-task-08`, `layer-9-task-07`

## Acceptance Criteria
- [x] Trường đúng ERD §4.15; trường chữ localized; link/ảnh/SĐT dùng chung
- [x] `header.navItems[].link` lưu khoá trang (vd `projects`) hoặc URL tuyệt đối
- [x] Khách đọc được phần công khai; `notificationEmails`, `translationGlossary`, `translationEnabled` chỉ admin đọc
- [x] Chỉ admin ghi; lưu global → revalidate tag layout cả vi/en
- [x] `privacyPolicyVersion` chỉ đọc trong admin (do hook `pages` ghi ở task services-pages)

## Tests cần viết
- Integration: khách GET `/api/globals/site-settings` không có `notificationEmails`
- Integration: sale update global → 403
- Unit: resolve `navItems.link` khoá trang → đường dẫn vi/en

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-02-round-<R>-review.md`

## Migration
- Bảng global `site_settings`, `header`, `footer` + bảng `_locales`/array. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 2 (sau Reviewer round 1 FAIL: MAJOR-1 thiếu nhóm `translation`; attempt 1 PASS verify của Builder)
- Last failure type: n/a (lỗi trung gian: Payload trả `[]` cho array bị chặn đọc → thêm hook `afterRead` xoá khoá)
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 đạt (Builder) — trường ERD §4.15 (chữ localized; link/ảnh/SĐT dùng chung); `navItems[].link` khoá trang hoặc URL http(s) (validate chặn `javascript:`); khách không thấy `notificationEmails`/`translationGlossary`/`translationEnabled` (REST + Local API qua `readPublicGlobal`); chỉ admin ghi (sale/khách 403); lưu global → `revalidateTag("global:<slug>", { expire: 0 })` cho cả vi/en (một tag chung, khoá cache có locale); `privacyPolicyVersion` update deny.
- Revalidate: chọn tag (không phải `revalidatePath` layout) vì `get-globals` dùng `unstable_cache` gắn tag `global:<slug>`; trang/layout dùng dữ liệu đó bị làm mới theo tag, và một tag phủ cả hai locale.
- Test: unit `src/lib/content/nav-link.test.ts` (8); integration `tests/integration/globals.test.ts` (15, DB tạm): khách GET không có 3 trường nội bộ, admin thấy đủ, sale update → 403, khách POST → 403, admin update + revalidate được gọi, link/URL validate, `privacyPolicyVersion`.
- Migration: `20261017_033508_globals_site_header_footer` — chỉ CREATE TYPE/TABLE/INDEX/FK mới (down chỉ DROP bảng mới); không destructive. Đã `payload migrate` (batch 8) trên dev; `migrate:create` lần 2 báo "No schema changes".
- Verify commands + result: `pnpm install --frozen-lockfile` OK · `pnpm lint` OK · `pnpm typecheck` OK · `pnpm test` 68 files / 695 tests PASS · `pnpm build` OK.
- Attempt 2 (fix round 1): MAJOR-1 thêm `translationGroup()` (export từ `src/fields/translation.ts`) vào 3 global, KHÔNG thêm `hasEnglish` (layout luôn render vi/en; ERD chỉ bắt `hasEnglish` cho collection có cổng EN) + migration MỚI additive `20261017_034248_globals_translation_group` (6 CREATE TYPE, 21 ADD COLUMN nullable/default, 6 CREATE INDEX; không destructive; down chỉ DROP đối tượng mới; đã migrate batch 9, `migrate:create` lần sau báo không có thay đổi, không để file tạm); MINOR-1 `admin.hidden: hideFromNonAdmin` cho 3 global; MINOR-2 `import "server-only"` ở `get-globals.ts`; MINOR-3 test khách `?locale=all|en`, `?depth`, `?select[...]`, `?draft`; MINOR-4 hook `trimText` (beforeValidate) cho URL/link. Test integration globals: 28 PASS (thêm translation: admin/sale/khách không ghi được, hệ thống ghi được, khách đọc thấy).
- Reviewer verdict: round 1 FAIL (MAJOR-1 thiếu nhóm translation) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-4-task-02-round-2-review.md`). Residual: MINOR-A `translation.lastError` đọc công khai (theo PERMISSION §4) → AC `layer-4-task-04` chỉ lưu mã lỗi đã lọc; MINOR-B gói `server-only` không có trong dependencies (Next alias nội bộ; import từ plain Node sẽ lỗi) → AC `layer-4-task-03`; e2e revalidate layout ở layer 5
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-4.md`)

## Doc / Decision Impact
- Doc impact result: ERD §4.15 thêm ghi chú as-built (khoá trang, ctaButton, contactBlock, platform, field access, tag revalidate). Không đổi API_SPEC (global REST do Payload sinh).
- Decision log: globals có nhóm `translation` nhưng không `hasEnglish` (layout luôn render vi+en); revalidate bằng `revalidateTag(global:<slug>)` + `unstable_cache`; migration thứ 2 additive thay vì sửa migration đã apply


## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-02 globals` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/globals/SiteSettings.ts, Header.ts, Footer.ts
- src/lib/content/get-globals.ts (đọc global theo locale, có cache tag)
- migrations/*

## Notes
- Global `homepage` ở task riêng (cần projects/services/property-posts).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
