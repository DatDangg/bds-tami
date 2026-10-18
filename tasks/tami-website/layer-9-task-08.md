# Task 08: Trang danh mục Cho thuê (S05) `/cho-thue/danh-muc/[category]` (khung chờ `loading.tsx` đã bỏ — gây soft-404, xem round 1)

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
- Blast radius: src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx; src/components/rentals/RentalListPage.tsx, RentalFilters.tsx (chip); src/lib/search/url-params.ts; src/lib/content/resolve-missing-page.ts; src/lib/seo/sitemap-data.ts (nhóm categories-rentals)
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
- [x] `/cho-thue/danh-muc/[category]` ↔ `/en/for-rent/category/[category]` (theo `src/i18n/routing.ts`): danh sách tin cho thuê công khai của danh mục (gồm danh mục con), cùng bộ lọc/sắp xếp/phân trang như S04 trừ danh mục; slug lạ / danh mục xoá mềm / chưa có bản EN → 404 có nội dung (rule `MISSING_PAGE_RULES`)
- [x] Chip loại hình ở S04 và link danh mục trên trang chi tiết (`src/lib/rentals/rental-view.ts:86`) trỏ tới trang danh mục; `/cho-thue?category=x` → canonical về `/cho-thue/danh-muc/x` (hoặc 301 nếu đơn giản và an toàn hơn — ghi quyết định)
- [x] Sitemap thêm nhóm danh mục cho thuê (loại `seo.noindex`, xoá mềm, EN chỉ khi `hasEnglish`)
- [x] Metadata/JSON-LD BreadcrumbList; danh mục `seo.noindex` → noindex
- [~] D5: skeleton `loading.tsx` — **KHÔNG làm được ở cấp route** (xem "Round 1 — M1"): `loading.tsx` trước trang `force-dynamic` biến `notFound()` (vượt số trang) thành soft-404 HTTP 200. Đã bỏ; phản hồi chờ khi lọc ở `/cho-thue` giữ `PendingRegion`. Skeleton cho điều hướng phía client của các danh sách còn lại: đề xuất task riêng (cần user chốt)
- [x] Hook revalidate danh mục (`src/hooks/categories/revalidate-category.ts`) làm mới đúng path trang mới

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
- Attempt: 2
- Last failure type (round 1): M1 `loading.tsx` trước route `force-dynamic` → `?page=` vượt trả 200 (soft-404), đo thật 9/9 route
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 6/6 xong (builder, chờ reviewer STRICT)
- Verify commands + result (worktree bds-wt9-t08): `pnpm lint` PASS (0 lỗi/0 cảnh báo) · `pnpm typecheck` PASS · `pnpm test` 178/180 file PASS (1916 test); lỗi còn lại: `src/lib/contrast.test.ts` (BL-004, CRLF worktree) và `tests/integration/media-upload.test.ts` (hook timeout 10s do DB/S3 chập chờn — chạy lại riêng PASS) · `pnpm build` PASS (lần đầu lỗi tải Google Font, chạy lại sau `rm -rf .next` PASS) · smoke `next start`: `/cho-thue` 200, `/cho-thue/danh-muc/khong-co` 404 có h1, `/en/for-rent/category/x` 404, `/cho-thue?category=abc` canonical về `/cho-thue`.
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-9-task-08-round-2-review.md`)
- Gap chờ user (D5 giảm phạm vi): skeleton cấp route không giữ được HTTP 404 → chỉ `/cho-thue` có `PendingRegion`; đề xuất task riêng phản hồi chờ phía client (`useLinkStatus` trên Pagination/chip) cho các danh sách khác
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` thêm bullet as-built layer-9-task-08 (§5.1); `API_SPEC` không đổi (tham số API giữ nguyên); intent docs không đụng.
- Decision log: G31/D5 user duyệt 2026-10-18 (progress.json decisions)

## Quyết định thiết kế (builder)
- `RentalListPage` nhận prop `categorySlug` (danh mục KHOÁ) thay vì tách trang mới; `?category=` bị bỏ qua ở S05. Không có ô lọc Danh mục ở S05 (`options.categories=[]` → `FilterFields` ẩn ô; chip loại hình thay cho việc đổi danh mục); `RentalFilters/RentalFilterSheet` nhận `fixedCategory` để số "Xem n tin" đếm đúng danh mục.
- `/cho-thue?category=x`: canonical (không 301) về trang danh mục; slug lạ → canonical `/cho-thue` (trang bỏ qua slug lạ). Trang S04 có `?category=` giữ nguyên hành vi lọc/phân trang/chip "Đang lọc".
- Chip loại hình ở S04 giờ là link tới trang danh mục (giữ bộ lọc khác). `rental-view.ts categoryLink` đã trỏ đúng từ L7, không đổi.
- `loading.tsx`: ĐÃ BỎ ở round 1 (M1, xem dưới). Các trang danh sách đã trả về vị trí HEAD (không còn nhóm route `(list)`).
- Hook `revalidate-category` đã có `/cho-thue/danh-muc/[category]` trong `SCOPE_PAGES` và test (L8) → không sửa code.
- Không đụng follow-up L8-T03 trong `layer-13-task-03` (đó là S06 khu vực/khoá tỉnh); `categorySlug` có thể làm mẫu cho khoá tỉnh.
- Cột trống do ẩn ô Danh mục ở panel desktop (lưới 12 cột) để trống phần cuối hàng 1: chấp nhận, chưa căn lại.

## Commit / Tracking
- Commit gợi ý: `feat(build-tami-website): layer-9-task-08 …` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit
- Progress: `.context/progress.json`

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx (+ test)
- src/components/rentals/* (dùng lại RentalListPage với danh mục cố định)
- src/lib/content/resolve-missing-page.ts, src/lib/seo/sitemap-data.ts, src/lib/rentals/rental-view.ts
- (đã bỏ) `loading.tsx` — thay bằng test chặn `src/app/(frontend)/[locale]/list-no-loading.test.ts`

## Notes
- Đọc trước khi code: `SPECIFICATIONS.md`, `.context/design-spec.md` (S04, S05, §3.5), `skills/react-nodejs/design-tokens.md`, follow-up L8-T03 trong `tasks/tami-website/layer-13-task-03.md` (cùng code danh sách — tránh làm trùng).

## Round 1 — sửa findings (builder)

### M1 — `loading.tsx` làm `notFound()` thành soft-404 (đo thật, `pnpm build` + `next start -p 3208`, DB worktree trống + 3 danh mục seed)
Lưu ý: `?page=999` ở `/cho-thue` bị schema API (`MAX_SEARCH_PAGE=500`: 999 bị bỏ → trang 1, không vượt) nên dùng `?page=50` cho 3 URL cho thuê; còn lại `?page=999`.

| URL | Trước (HEAD, không loading) | Có `loading.tsx` (bản round 0) | Sau fix (bỏ loading.tsx) |
|---|---|---|---|
| /cho-thue?page=50 | 404 | **200** | 404 |
| /cho-thue/danh-muc/<slug>?page=50 | 404 | **200** | 404 |
| /en/for-rent?page=50 | 404 | **200** | 404 |
| /du-an?page=999 | 404 | **200** | 404 |
| /tin-tuc?page=999 | 404 | **200** | 404 |
| /tin-tuc/danh-muc/<slug>?page=999 | 404 | **200** | 404 |
| /tin-bds?page=999 | 404 | **200** | 404 |
| /tin-bds/danh-muc/<slug>?page=999 | 404 | **200** | 404 |
| /tuyen-dung?page=999 | 404 | **200** | 404 |

(cột "Trước" = cùng cây mã với 8 `loading.tsx` tạm gỡ; cột "Sau" đo lại ở bước verify cuối.)

**Quyết định (phương án b):** bỏ cả 8 `loading.tsx` + `ListSkeleton` + i18n `page.loading`, trả 5 `page.tsx` về vị trí HEAD (nhóm `(list)` chỉ để cách ly `loading.tsx` khỏi `[slug]`, nay vô nghĩa). Lý do: skeleton cấp route ép stream shell trước nên không thể giữ HTTP 404 trên trang `force-dynamic`; 404 đúng (không bị CDN cache 200) ưu tiên hơn khung chờ lần tải cứng. Phương án c (kiểm vượt trang trước khi stream) cần thêm truy vấn đếm ở proxy/metadata cho 8 route — không gọn. Thêm test `list-no-loading.test.ts` chặn quay lại. **D5 chỉ còn đạt một phần**: `/cho-thue` giữ `PendingRegion` (mờ + aria-busy khi đổi bộ lọc); các danh sách khác chưa có phản hồi chờ phía client — đề xuất task riêng (`useLinkStatus` trên Pagination/chip, ngoài khuôn khổ). Cần user xác nhận D5 giảm phạm vi.

### Minor
- m1: tách `buildRentalListMetadata` (+ helper `rootMetadata`/`categoryCanonicalMetadata`/`categoryPageMetadata`, mỗi hàm ≤ 50 dòng) sang `src/components/rentals/rental-list-metadata.ts`; `RentalListPage.tsx` re-export để import cũ (page, test) không đổi. Hành vi giữ nguyên.
- m2: `findRentalCategory` bọc React `cache()`.
- m3 (breadcrumb cha không kiểm công khai): để nguyên — cùng pattern trang danh mục tin tức, không do task này đưa vào; cần task riêng kiểm Payload population với `trash`.
- m4 (khoảng trống 2 cột ở panel desktop S05): để nguyên — thuần thẩm mỹ, đã ghi nhận ở "Quyết định thiết kế".
- m5: `src/payload-types.ts` chỉ khác EOL — để nội dung HEAD, không đưa vào commit.
