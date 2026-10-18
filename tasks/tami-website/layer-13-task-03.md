# Task 03: Trang đích khu vực Cho thuê (FR-PUB-16, S06)

## Layer
13 — Should: dashboard, redirect UI, trang khu vực, đối tác

Checkpoint: ⏸ **Mốc M4** — dừng chờ user duyệt sau layer này (Should xong (dashboard, redirect UI, trang khu vực, đối tác))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Should
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai dùng SearchService
- Blast radius: src/app/(frontend)/[locale]/cho-thue/khu-vuc/[province]/page.tsx; src/i18n/messages/{vi,en}.json (intro template)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-16
- design-spec S06

## Description
`/cho-thue/khu-vuc/[province]` · `/en/for-rent/area/[province]` liệt kê tin theo tỉnh, có intro template i18n, SEO riêng.

## Dependencies
- `layer-8-task-03` Trang Danh sách Cho thuê (S04): bộ lọc trên URL, tìm không dấu, sắp xếp (dùng kết quả của task này)
- `layer-7-task-02` `SearchService` + `GET /api/public/rentals` + index trigram (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (thứ tự ưu tiên: Should làm sau khi toàn bộ Must đã lên staging)

Mở khoá cho: `layer-14-task-01`, `layer-14-task-02`, `layer-15-task-01`

## Acceptance Criteria
- [ ] Tỉnh không tồn tại → 404; tỉnh 0 tin → trang trống có link danh sách chung (noindex)
- [ ] Dùng lại RentalFilters (khoá tỉnh) + phân trang
- [ ] Có trong sitemap (tỉnh có ≥ 1 tin)
- [ ] Tên tỉnh giữ tiếng Việt ở bản EN

## Tests cần viết
- Integration render: tỉnh có/không tin; sitemap có trang tỉnh có tin

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-13-task-03-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-13): task-03 arealanding` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-13/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/khu-vuc/[province]/page.tsx
- src/i18n/messages/{vi,en}.json (intro template)

## Notes
- Không thêm `provinces.intro` (user đã chốt không làm).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 6
- [ ] G27 (LOW): route mới thêm rule vào `MISSING_PAGE_RULES` để slug lạ trả 404 có nội dung (G15), không quay lại 404 rỗng. Report: `.context/review-reports/spec-validation-build-tami-website-layer-6.md`.

## Follow-up từ review layer-8-task-03 round 1 (MINOR)
- [ ] `src/components/rentals/RentalListPage.tsx:248-265`: metadata quyết noindex từ tham số URL thô → slug lạ (`?province=xyz`) cho trang indexable trùng nội dung trang gốc; chạy `dropUnknownSlugs` trong metadata.
- [ ] `resolve-missing-page.test.ts`: regex `/[[a-z]+]/` không khớp `[...slug]` hay tên tham số có `-` — sửa regex.
- [ ] `src/lib/rentals/rental-queries.ts:429-430`: dải giá ±30% ra 1–3 tin thì giữ các tin đó và bù tin còn lại, không thay hẳn.
- [ ] `RentalListPage.tsx:95-152` ~57 dòng: tách hàm.
- [ ] `rental-search-sql.ts:553-554`: nhánh thiếu `province` không còn tới được qua API mà lọc ward toàn quốc — bỏ hoặc chặn.
