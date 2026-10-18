# Task 08: Trang danh mục Cho thuê (S05) `/cho-thue/danh-muc/[category]` + khung chờ `loading.tsx` cho trang danh sách

## Layer
9 — Trang chủ, luồng lead, job nghiệp vụ, tự dịch (+ task bổ sung từ spec-validation layer 8)

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial) — task bổ sung (G31 + D5, user duyệt 2026-10-18)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — route công khai mới, canonical/sitemap/404 dùng chung, sửa trang danh sách S04
- Blast radius: src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx; src/components/rentals/RentalListPage.tsx, RentalFilters.tsx (chip); src/lib/search/url-params.ts; src/lib/content/resolve-missing-page.ts; src/lib/seo/sitemap-data.ts (nhóm categories-rentals); `loading.tsx` cho các trang danh sách
- Doc impact (dự kiến): ARCHITECTURE §4/§5.1, API_SPEC nếu đổi tham số
- Decision impact: NO

## Requirements
- BRD `docs/BRD.md:89,108` (trang danh mục cho thuê)
- design-spec S05 (template danh mục), S04 (chip loại hình), §3.5 (skeleton)
- G31, D5 — `.context/review-reports/spec-validation-build-tami-website-layer-8.md`

## Description
Trang danh mục Cho thuê dùng lại code danh sách `/cho-thue` (L8-T03): cùng bộ lọc trừ danh mục (cố định theo slug, gồm danh mục con), banner/tiêu đề/SEO theo danh mục. Thêm `loading.tsx` (skeleton) cho các trang danh sách công khai.

## Dependencies
- `layer-8-task-03` Trang Danh sách Cho thuê (S04) (dùng kết quả của task này)
- `layer-8-task-05` sitemap/robots/llms (dùng kết quả của task này)
- `layer-4-task-01` `categories` (cha–con theo scope) (dùng kết quả của task này)
- `layer-5-task-06` template danh mục `CategoryListTemplate`, trạng thái trống/lỗi (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`, `layer-13-task-03`

## Acceptance Criteria
- [ ] `/cho-thue/danh-muc/[category]` ↔ `/en/for-rent/category/[category]` (theo `src/i18n/routing.ts`): danh sách tin cho thuê công khai của danh mục (gồm danh mục con), cùng bộ lọc/sắp xếp/phân trang như S04 trừ danh mục; slug lạ / danh mục xoá mềm / chưa có bản EN → 404 có nội dung (rule `MISSING_PAGE_RULES`)
- [ ] Chip loại hình ở S04 và link danh mục trên trang chi tiết (`src/lib/rentals/rental-view.ts:86`) trỏ tới trang danh mục; `/cho-thue?category=x` → canonical về `/cho-thue/danh-muc/x` (hoặc 301 nếu đơn giản và an toàn hơn — ghi quyết định)
- [ ] Sitemap thêm nhóm danh mục cho thuê (loại `seo.noindex`, xoá mềm, EN chỉ khi `hasEnglish`)
- [ ] Metadata/JSON-LD BreadcrumbList; danh mục `seo.noindex` → noindex
- [ ] D5: `loading.tsx` skeleton (6 thẻ, theo design tokens, `aria-busy`) cho các trang danh sách công khai: `/cho-thue`, danh mục cho thuê, `/du-an`, `/tin-tuc`, `/tin-bds` (+ danh mục), `/tuyen-dung`; không gây CLS
- [ ] Hook revalidate danh mục (`src/hooks/categories/revalidate-category.ts`) làm mới đúng path trang mới

## Tests cần viết
- Integration: trang danh mục trả tin của danh mục + con, 404 khi slug lạ / xoá mềm / EN chưa có
- Sitemap có nhóm danh mục cho thuê, loại noindex
- Unit: canonical/redirect `?category=`; skeleton render

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-08-round-<R>-review.md`

## Migration
- Không dự kiến. Cần schema → dừng báo user.

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
- Doc impact result: pending
- Decision log: G31/D5 user duyệt 2026-10-18 (progress.json decisions)

## Commit / Tracking
- Commit gợi ý: `feat(build-tami-website): layer-9-task-08 …` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit
- Progress: `.context/progress.json`

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx (+ test)
- src/components/rentals/* (dùng lại RentalListPage với danh mục cố định)
- src/lib/content/resolve-missing-page.ts, src/lib/seo/sitemap-data.ts, src/lib/rentals/rental-view.ts
- `loading.tsx` trong các route danh sách

## Notes
- Đọc trước khi code: `SPECIFICATIONS.md`, `.context/design-spec.md` (S04, S05, §3.5), `skills/react-nodejs/design-tokens.md`, follow-up L8-T03 trong `tasks/tami-website/layer-13-task-03.md` (cùng code danh sách — tránh làm trùng).
