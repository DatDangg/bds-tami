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
- [ ] Trường đúng ERD §4.15; trường chữ localized; link/ảnh/SĐT dùng chung
- [ ] `header.navItems[].link` lưu khoá trang (vd `projects`) hoặc URL tuyệt đối
- [ ] Khách đọc được phần công khai; `notificationEmails`, `translationGlossary`, `translationEnabled` chỉ admin đọc
- [ ] Chỉ admin ghi; lưu global → revalidate tag layout cả vi/en
- [ ] `privacyPolicyVersion` chỉ đọc trong admin (do hook `pages` ghi ở task services-pages)

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
- Doc impact result: pending (dự kiến: ERD §4.15 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-02 globals` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/globals/SiteSettings.ts, Header.ts, Footer.ts
- src/lib/content/get-globals.ts (đọc global theo locale, có cache tag)
- migrations/*

## Notes
- Global `homepage` ở task riêng (cần projects/services/property-posts).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
