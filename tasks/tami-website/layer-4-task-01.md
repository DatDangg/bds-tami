# Task 01: `categories` (cha–con theo scope) + `developers` (chủ đầu tư)

## Layer
4 — Danh mục, cấu hình chung, truy vấn công khai, TranslationService, CD/giám sát/backup

Checkpoint: ⏸ **Mốc M1** — dừng chờ user duyệt sau layer này (Nền xong (scaffold, auth, i18n, UI, upload, bộ field, danh mục, cấu hình, CD/giám sát/backup dạng file))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + quy tắc xoá
- Blast radius: src/collections/Categories.ts; src/collections/Developers.ts; src/hooks/categories/guard-delete.ts (map scope → collection); …
- Doc impact (dự kiến): ERD §4.3/§4.4 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-06
- FR-ADM-07 (chủ đầu tư)
- FR-PUB-17 (cờ `showAsPartner`)
- ERD §4.3, §4.4
- PERMISSION §3.2

## Description
Danh mục riêng từng loại nội dung (tối đa 2 cấp) và chủ đầu tư; seed danh mục mặc định.

## Dependencies
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)
- `layer-2-task-01` Upload: `media` (public) + `private-files` (CV) trên SeaweedFS S3 (dùng kết quả của task này)

Mở khoá cho: `layer-5-task-01`, `layer-5-task-03`, `layer-5-task-04`, `layer-6-task-01`, `layer-6-task-02`, `layer-7-task-01`, `layer-8-task-01`, `layer-9-task-07`, `layer-13-task-04`

## Acceptance Criteria
- [ ] `categories`: name/slug/description/seo localized; `scope` ∈ {rental, property_post, news, project, job}; slug unique theo (`_locale`, `scope`, `slug`)
- [ ] `parent` cùng scope, tối đa 2 cấp (hook kiểm tra)
- [ ] Không xoá được danh mục có danh mục con; hook kiểm tra nội dung đang dùng theo bảng scope → collection (mỗi task nội dung thêm test cho collection của mình)
- [ ] `developers` có `hasEnglish`/`translation`, `showAsPartner`, logo
- [ ] Khách/sale đọc; admin ghi
- [ ] Seed danh mục mặc định theo ERD §4.3, idempotent

## Tests cần viết
- Integration: con khác scope cha → lỗi; cấp 3 → lỗi
- Integration: xoá danh mục có con → lỗi
- Integration: sale tạo category → 403

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-4-task-01-round-<R>-review.md`

## Migration
- Bảng `categories`, `categories_locales`, `developers`, `developers_locales` + UNIQUE `(_locale, scope, slug)` (SQL tuỳ biến trong migration). Additive.
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
- Doc impact result: pending (dự kiến: ERD §4.3/§4.4 nếu lệch)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-01 cats` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/Categories.ts
- src/collections/Developers.ts
- src/hooks/categories/guard-delete.ts (map scope → collection)
- seed/categories.ts
- migrations/*

## Notes
- ⚠️ PERMISSION: sale chỉ đọc `developers`; nếu vướng thì mở quyền qua `/change`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
