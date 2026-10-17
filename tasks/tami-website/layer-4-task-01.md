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
- [x] G7: `withContentDefaults` thêm option bỏ bớt field dùng chung (vd `omit: ["slug","author"]`) và slug unique theo scope (`scopeField` → unique (`_locale`, `scope`, `slug`) cho `categories`, ERD §4.3); có test (spec-validation layer 3)
- [x] L3-T02 n2: `fieldAccess` bỏ qua giá trị `undefined` (không được ghi đè deny-all thành mở quyền) và throw khi tên field lạ (`content-defaults.ts:49-55`); có test (spec-validation layer 3)
- [x] L3-T02 n1: kiểm trùng slug không dùng `like` (ILIKE %prefix%, pagination:false) — dùng `equals base` OR tiền tố `head-` (`fields/slug.ts:41`) (spec-validation layer 3)
- [x] `categories`: name/slug/description/seo localized; `scope` ∈ {rental, property_post, news, project, job}; slug unique theo (`_locale`, `scope`, `slug`)
- [x] `parent` cùng scope, tối đa 2 cấp (hook kiểm tra)
- [x] Không xoá được danh mục có danh mục con; hook kiểm tra nội dung đang dùng theo bảng scope → collection (mỗi task nội dung thêm test cho collection của mình)
- [x] `developers` có `hasEnglish`/`translation`, `showAsPartner`, logo
- [x] Khách/sale đọc; admin ghi
- [x] Seed danh mục mặc định theo ERD §4.3, idempotent

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
- Attempt: 2 (sau Reviewer round 1 FAIL: MAJOR-1 duplicate phá UNIQUE). Attempt 1: không có lỗi phải retry.
- Last failure type: review MAJOR-1 (Duplicate: Payload `beforeDuplicate` thêm " - Copy" vào `scopeSlug` mọi locale + copy slug locale khác → trùng (en, scope, slug) mà UNIQUE DB không bắt). Fix: `disableDuplicate: true` cho Categories (Payload chặn cả Local API/REST, 400); danh mục nền hiếm khi cần nhân bản, và sửa tại `slugField` chung là phạm vi rộng hơn task.
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria (reviewer STRICT PASS):
  - G7: `withContentDefaults` thêm `omit` (tên trường dùng chung), `scopeField` (slug lọc theo scope + trường ẩn `scopeSlug` unique localized → UNIQUE `(scope_slug, _locale)`), `route: null` (không có trang riêng); bỏ `status` mà không tự đặt `access.read` thì ném lỗi. Test: `src/collections/_shared/content-defaults.test.ts`, `src/fields/slug.test.ts`, `tests/integration/categories.test.ts`.
  - n2: `fieldAccess` bỏ khoá `undefined`, ném lỗi khi tên không phải trường dùng chung / đã omit. Test: `content-defaults.test.ts` "fieldAccess (n2)".
  - n1: kiểm trùng slug dùng `in` trên ≤ 20 ứng viên `base, base-2...` mỗi lượt (Payload không có toán tử "bắt đầu bằng"; `like`/`contains` đều là `ILIKE %x%`), lặp lượt kế nếu bị chiếm hết. Test: `src/fields/slug.test.ts` (không có `like`/`contains`, 1 truy vấn thường, 2 lượt khi 25 ứng viên bị chiếm).
  - categories/developers/hook cây/chặn xoá/quyền/seed: `tests/integration/categories.test.ts` (24 test, DB tạm).
- Verify commands + result (Builder attempt 1): `pnpm install --frozen-lockfile` OK; `pnpm lint` OK; `pnpm typecheck` OK; `pnpm test` FULL 66 file / 667 test PASS; `pnpm build` OK. `pnpm payload migrate` áp `20261017_031052_categories_developers` lên DB dev, `migrate:status` batch 7 = Yes; `pnpm seed:categories` chạy 2 lần trên DB dev: tạo 11 rồi bỏ qua 11.
- Attempt 2 (sau Reviewer round 1) - cách sửa:
  - MAJOR-1: `Categories` `disableDuplicate: true`. Test `tests/integration/categories.test.ts` "MAJOR-1" (vi+en, `payload.duplicate` → 400, chỉ 1 bản (en, scope, slug)): FAIL trước sửa (duplicate thành công), PASS sau.
  - MINOR-1: hook `src/hooks/categories/lock-scope.ts` ép `scope` = bản đã lưu khi update (kể cả `overrideAccess: true`). Test "MINOR-1": FAIL trước (scope đổi sang rental), PASS sau.
  - MINOR-2: `validate-tree.ts` chặn `parent` có `deletedAt`. Test "MINOR-2": đã PASS cả trước sửa (Payload từ chối cha trong thùng rác ở bước khác); check tường minh giữ làm lớp phòng thủ.
  - MINOR-3: `fields/slug.ts` `isAllowedScope` (đọc options select từ `collection.flattenedFields`) - scope ngoài enum không đi vào truy vấn → validate select trả 400. Test integration "MINOR-3" FAIL trước (không phải 400), PASS sau; unit test thêm trong `src/fields/slug.test.ts`.
  - MINOR-4: không làm; residual: lỗi unique do race báo trên field ẩn `scopeSlug` (map sang `slug` cần `afterError` tuỳ biến, không gọn).
  - Drift check: `pnpm payload migrate:create drift_check_tmp` trên DB dev → "No schema changes detected", không sinh file (từ chối tạo file rỗng) → no drift; không có migration mới.
- Verify attempt 2 (sau lần sửa cuối): install --frozen-lockfile OK; lint OK; typecheck OK; `pnpm test` FULL 66 file / 672 test PASS; build OK; `migrate:status` 7/7 Yes.
- Follow-up: (1) Dockerfile chưa COPY `seed/` → thêm ở layer-6-task-01 trước deploy staging (cần danh mục mặc định). (2) `slugField` chung: duplicate ở collection khác (`developers`, collection nội dung layer 5+) gán slug `xyz - Copy` sai định dạng `[a-z0-9-]` → đề xuất task riêng thêm `beforeDuplicate` chung cho `slugField`.
- Reviewer verdict: round 1 FAIL (MAJOR-1 duplicate phá UNIQUE scopeSlug) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-4-task-01-round-2-review.md`). Residual: MINOR-1 duplicate `developers` → slug locale khác dạng `xyz - Copy` (do slugField chung) → đã gắn AC `layer-5-task-01`; MINOR-4 lỗi race UNIQUE báo trên field ẩn `scopeSlug`; Dockerfile chưa COPY `seed/` → đã gắn AC `layer-6-task-01`
- Spec Validator verdict (layer close): COMPLETE (`.context/review-reports/spec-validation-build-tami-website-layer-4.md`)

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.3 (as-built: UNIQUE qua `scopeSlug`, scope khoá sau khi tạo, chặn xoá cả xoá mềm, seed), §4.4 (as-built), §5 (ghi chú UNIQUE của categories). Không đổi PERMISSION/API_SPEC.
- Decision log: UNIQUE (`_locale`, `scope`, `slug`) qua field ẩn localized `scopeSlug` (Postgres không UNIQUE xuyên 2 bảng); scope khoá sau khi tạo; Categories `disableDuplicate`; categories/developers `versions: false`

## Commit / Tracking
- Commit gợi ý: `feat(layer-4): task-01 cats` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-4/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Categories.ts
- src/collections/Developers.ts
- src/hooks/categories/guard-delete.ts (map scope → collection)
- seed/categories.ts
- migrations/*
- (thêm, ngoài danh sách gốc) src/collections/_shared/content-defaults.ts, src/fields/{slug,scope-slug,name}.ts, src/lib/slug.ts, src/access/readUnlessTrashed.ts, src/hooks/categories/{scope-collections,validate-tree,lock-scope}.ts, scripts/seed-categories.ts, package.json (`seed:categories`), src/payload.config.ts, tests/fixtures/categories/*, tests/integration/categories.test.ts

## Notes
- ⚠️ PERMISSION: sale chỉ đọc `developers`; nếu vướng thì mở quyền qua `/change`.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
