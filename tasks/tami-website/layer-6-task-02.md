# Task 02: Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText`

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — schema + sequence + RBAC
- Blast radius: src/collections/Rentals.ts; src/hooks/rentals/generate-code.ts (sequence Postgres → `CT-000001`); src/hooks/rentals/build-search-text.ts; …
- Doc impact (dự kiến): ERD §4.6, §5, §6 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-02
- BR-01, BR-04
- LGL-02
- ERD §4.6, §5, §6

## Description
CRUD tin cho thuê đủ trường, mã tự sinh, trạng thái `rented`, chuỗi tìm kiếm không dấu theo từng locale.

## Dependencies
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-2-task-02` `provinces`, `wards` + khung seed (`pnpm seed`) và dữ liệu 34 tỉnh/thành (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) + `developers` (chủ đầu tư) (dùng kết quả của task này)
- `layer-3-task-02` Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate) (dùng kết quả của task này)

Mở khoá cho: `layer-7-task-01`, `layer-7-task-02`, `layer-7-task-03`, `layer-8-task-02`, `layer-8-task-05`, `layer-9-task-07`

## Acceptance Criteria
- [x] G12: thêm slug collection công khai của task vào allowlist `PublicCollectionSlug` (`src/lib/content/public-queries.ts`) và (nếu dịch) `src/lib/translation/allowlist.ts`; test (spec-validation layer 4)
- [x] Đủ trường ERD §4.6 + group `rentalTerms`
- [x] `code` sinh từ sequence, chỉ đọc với mọi người, không trùng khi tạo song song
- [x] Publish cần ≥ 3 ảnh; `priceMonthlyVnd` bắt buộc trừ khi `priceNegotiable`
- [x] Chuyển `rented` → tự gán `rentedAt`
- [x] `searchText` (localized) = code + title của locale + address + phường + tỉnh + legacyNames + tên dự án, đã chuẩn hoá bằng `normalizeSearchText`
- [x] Index: `(status, has_english, category_id, province_id, price_monthly_vnd)`, `(status, ward_id)`, `(status, published_at DESC)`, `(status, area_m2)`, `(status, bedrooms)`, GIST `location`, UNIQUE `(_locale, slug)`

## Tests cần viết
- Integration: tạo 20 tin song song → 20 mã khác nhau, tăng dần
- Integration: publish với 2 ảnh → lỗi
- Integration: searchText có tên phường cũ
- Integration: sale sửa/xoá tin cho thuê của sale khác → 403; xoá mềm + admin khôi phục; không xoá được danh mục đang có tin cho thuê

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-02-round-<R>-review.md`

## Migration
- Bảng `rentals`, `rentals_locales`, rels, `CREATE SEQUENCE rentals_code_seq` + index SQL. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 2
- Last failure type: review FAIL round 1 (MAJOR-1 lộ address/location/searchText cho khách) — sửa attempt 2
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS toàn bộ + follow-up L2-T02 (legacyNames[].name) + G22 (ward∈province, validator mặc định)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 110 file 1.218 PASS (33 integration rentals, DB thật); pnpm build PASS. Migration `20261017_143212_rentals` (sequence `rentals_code_seq` + 5 index + GIST) applied dev 18/18; DB tạm up/down/up OK
- Reviewer verdict: STRICT FAIL round 1 → STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-6-task-02-round-2-review.md`
- Residual risk: searchText cũ khi đổi tên dự án / legacyNames phường → reindex ở L7-T02 (đã gắn). Trigram GIN → L7-T02. `payload-types` ghi address luôn có nhưng khách có thể không nhận → L7-T03 coi address/location optional. MINOR B (UPDATE version row giả định versions bật), C (test guard tỉnh nhánh rentals chưa tách) → L15-T01
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.2, §4.6, §5; `docs/PERMISSION.md` §4
- Decision log: guard 409 xoá ward/province (ngoài file liệt kê, reviewer chấp nhận); videoUrl chỉ https YouTube/TikTok (đúng ERD); trigram để L7-T02 (Notes task)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-02 rentals` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Rentals.ts
- src/hooks/rentals/generate-code.ts (sequence Postgres → `CT-000001`)
- src/hooks/rentals/build-search-text.ts
- seed/sample/rentals.ts
- migrations/*

## Notes
- Index trigram `search_text` làm ở task search-service (cùng truy vấn).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-2-task-02
- `wards.legacyNames` lưu dạng mảng `{ name }` ("<phường cũ>, <quận/huyện cũ>"): hook `searchText` phải lấy `legacyNames[].name` (ERD §4.2, §5).

## Follow-up từ spec-validation layer 5 addendum
- [x] G22: `rentals.ward` lọc `filterOptions` theo `province` đã chọn + validate server; field upload có `validate` tuỳ biến phải gọi validator `upload` mặc định trước (bài học L5-T01).
