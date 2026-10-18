# Task 03: Trang Chi tiết tin cho thuê (S07), gồm trạng thái "Đã thuê" và tin tương tự

## Layer
7 — Đăng tin BĐS, SearchService, chi tiết Cho thuê, form ứng tuyển

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai
- Blast radius: src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx; src/components/rentals/RentalSpecs.tsx, RentalTerms.tsx, SaleContactBox.tsx, SimilarRentals.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-05
- BR-01
- FR-PUB-15 (RealEstateListing)
- SPECIFICATIONS § Quy tắc biên (sale bị khoá, tin đã thuê)
- design-spec S07

## Description
Chi tiết tin cho thuê đủ thông tin; tin `rented` vẫn mở, nhãn "Đã thuê", `noindex, follow`.

## Dependencies
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-01`

## Acceptance Criteria
- [x] Hiện mã tin, giá/tháng (hoặc "Thoả thuận"), diện tích, phòng ngủ/WC, tầng, hướng, nội thất, điều khoản thuê, mô tả, vị trí (ẩn số nhà khi `showExactAddress=false`), video facade
- [x] Sale phụ trách hiện tên/SĐT; sale `active=false` → thay bằng hotline chung
- [x] Tin `rented`: badge, `noindex, follow`, gợi ý tin tương tự nổi bật; không JSON-LD RealEstateListing
- [x] Tin tương tự: cùng danh mục + tỉnh, loại trừ tin hiện tại, tối đa 4
- [x] Vùng `LeadFormSlot` (biến thể "Nhận tư vấn căn tương tự" khi rented)
- [x] Khi `showExactAddress=false`: server component phải truyền `approximateLocation(location)` (src/components/media/map-geometry.ts) cho `LazyMap` (kèm `approximate`), KHÔNG truyền toạ độ thật — props client component bị serialize vào HTML (contract từ layer-2-task-08)

## Tests cần viết
- Integration render: rented → meta robots noindex; sale khoá → hotline
- Integration: không lộ địa chỉ chính xác khi tắt

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-7-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): MAJOR-1 avatar sale đọc overrideAccess depth 1 → lộ `media.uploadedBy` (UUID staff) ra HTML/RSC
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 6/6 AC + 4 follow-up đã làm (builder)
- Verify commands + result: worktree lint/typecheck/build PASS, test 1.599 PASS; sau squash merge cùng L7-T02/T04 trên staging: `pnpm lint` · `pnpm typecheck` · `pnpm test` (155 file, 1.694) · `pnpm build` PASS
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-7-task-03-round-2-review.md`); MINOR r2 (ảnh đầu gallery bị xoá → placeholder, locale ảnh thẻ, RentalDetail ~68 dòng) → follow-up dưới
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-7.md`

## Doc / Decision Impact
- Doc impact result: ARCHITECTURE.md §4 (lib/rentals, components/rentals) + §5.1 (`MISSING_PAGE_RULES` `/cho-thue/[slug]` → `rentals`, rented 200 noindex) — primary reconcile sau merge; không đổi API_SPEC/ERD
- Decision log: xem Quyết định thiết kế bên dưới (không phải Decision toàn dự án).

## Commit / Tracking
- Commit gợi ý: `feat(layer-7): task-03 pubrentdetail` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (ngoại trừ `contrast.test.ts`: lỗi CRLF môi trường worktree, không do task) (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx
- src/components/rentals/RentalSpecs.tsx, RentalTerms.tsx, SaleContactBox.tsx, SimilarRentals.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-06
- FloatingContact chưa nhận `refCollection`/`refId` (design-spec §2.5): trang chi tiết cần truyền để click-stats tính theo tin/dự án (`src/components/layout/FloatingContact.tsx`, endpoint đã nhận enum `CLICK_REF_COLLECTIONS`).
- Nếu trang có thanh cố định đáy (giá/CTA trên mobile): đặt `--floating-bottom-offset` để nút nổi không bị đè.

## Follow-up từ review layer-6-task-03
- [x] Slug không tồn tại / bản ghi chưa có EN (`notFound()` trong page) trả 404 **có nội dung trong HTML server** (h1 đúng ngôn ngữ, header/footer), không phải shell `__next_error__` (giới hạn Next 16 — ARCH §5.1): kiểm tra ở proxy trước khi vào page, hoặc cách khác đã ghi ở ARCH §5.1; curl bằng chứng.

## Follow-up từ review layer-6-task-02
- [x] `rentals.address`/`location` không trả cho khách khi `showExactAddress=false` (field read access): trang chi tiết coi 2 trường là optional (không in "undefined"); bản đồ khu vực gần đúng tự tính ở server bằng `overrideAccess` + làm tròn, không gửi toạ độ chính xác.

## Follow-up từ spec-validation layer 6
- [x] G26 (LOW): AC L6-T05 "JSON-LD Organization" trên trang chi tiết dự án chưa có (`buildOrganizationJsonLd` chỉ dùng ở `/lien-he`). Thêm Organization (publisher/brand) vào JSON-LD `RealEstateListing` của trang này, hoặc ghi rõ không cần (design-spec S03 không đòi). Report: `.context/review-reports/spec-validation-build-tami-website-layer-6.md`.
- [x] G27 (LOW): slug lạ trả 404 có nội dung qua `MISSING_PAGE_RULES` (G15).


## Builder report (L7-T03)

### Quyết định thiết kế
1. **Sale/toạ độ cho khách:** `staff` đóng với khách, `rentals.address/location` bị field-access chặn khi `showExactAddress=false` → `findRentalPrivateFields` (overrideAccess, `select` chỉ `author`+`location`) và `findActiveSaleContact` (overrideAccess, `select` 4 trường; `active=false`/đã xoá → `null`). Sale thiếu SĐT gọi được cũng coi như không có (không hiện tên suông) → hotline chung.
2. **Toạ độ thật không rời `toRentalDetailView`:** hàm dựng view là nơi duy nhất gọi `approximateLocation`; `view.map` là thứ duy nhất đi vào props `LazyMap`. Đã đo `next start`: HTML/RSC chỉ có `10.777,106.701`, không có `10.776889`/số nhà.
3. **Địa chỉ hiển thị:** `address` là một trường (số nhà + đường không tách được) → ẩn: chỉ "Phường, Tỉnh"; hiện: "address, Phường, Tỉnh".
4. **Tin tương tự:** cùng danh mục + cùng tỉnh, loại tin hiện tại, CHỈ `published` (không gợi ý căn cũng đã thuê), 4 thẻ; trang `rented` lấy tối đa 8 (design-spec S07 "4-8"). Lệch AC "tối đa 4" chỉ ở nhánh rented — dễ đổi hằng `SIMILAR_RENTALS_COUNT_WHEN_RENTED`. **Chưa lọc giá ±30%** (design-spec) vì AC chỉ đòi danh mục + tỉnh và lọc thêm làm danh sách thưa; ghi nhận để task sau quyết.
5. **Tin `rented`:** HTTP 200, `noindex, follow` (`forceNoindex`), KHÔNG JSON-LD nào (kể cả BreadcrumbList, như tin tuyển dụng hết hạn), băng `role=status`, badge, giá mờ + "Giá tham khảo", điều khoản = `<details>` đóng, tin tương tự đặt ngay sau thư viện ảnh (trước h1/nội dung).
6. **G26:** `buildRealEstateListingJsonLd` nhận `publisher` (Organization: tên site, URL gốc, logo); áp cho trang cho thuê và trang chi tiết dự án (sửa `du-an/[slug]/page.tsx`).
7. **G27:** thêm `/cho-thue/[slug]` → `rentals` vào `MISSING_PAGE_RULES` (+ test). `findLocalizedSlugs` mở rộng union thêm `rentals`.
8. **FloatingContact:** dùng `ClickRefMarker collection="rentals"` (cơ chế sẵn có, nút nổi nằm ở layout nên không nhận props); thanh dính đáy mobile dùng lại `ProjectStickyCta` (tự đặt `--sticky-cta-height`).
9. **LeadFormSlot:** giữ `id=lead-form` mặc định; layer-10-task-01 cần `source=rental`, `sourceId=doc.id`, biến thể "Nhận tư vấn căn tương tự" khi `view.rented` (tiêu đề + fallback đã đổi theo).
10. Sửa file ngoài danh sách: `src/components/icons.ts` (+`Info`), `src/lib/projects/project-detail-view.ts` (export `renderableImage`), `src/lib/seo/json-ld.ts` (+publisher), `src/lib/news/news-queries.ts` (union), `resolve-missing-page.ts`, i18n `page.rentalDetail` (vi/en), `du-an/[slug]/page.tsx`.

### Verify (worktree D:prjds-wt-t03)
- `pnpm lint`: PASS. `pnpm typecheck`: PASS. `pnpm build`: PASS (route `/[locale]/cho-thue/[slug]` ISR).
- `pnpm test`: 1597 test PASS; 1 file FAIL `src/lib/contrast.test.ts` — lỗi môi trường có từ trước (worktree checkout CRLF, test tìm marker có `
` trong globals.css), không đụng file này.
- Bằng chứng runtime (`next start -p 3103`, DB `tami_wt_t03` + dữ liệu thử đã gỡ sạch): tin còn trống 200 `index, follow` + JSON-LD RealEstateListing/Organization/Offer; tin `rented` 200 `noindex, follow`, 0 JSON-LD, "Nhận tư vấn căn tương tự"; slug lạ `/cho-thue/khong-ton-tai` → 404 có `h1` "Không tìm thấy trang" + header/footer, không `__next_error__`, `noindex`; `/en/for-rent/<slug chưa có EN>` → 404; mobile 375 không cuộn ngang, khung giá + form ngay sau thông số chính.

### Sửa review round 1 (Builder)
- **MAJOR-1 (đã sửa):** `findActiveSaleContact(payload, locale, authorId)` đọc staff `depth: 0` + `select` 4 trường, rồi đọc avatar như khách (`overrideAccess: false`, `locale`, `depth: 0`) nên `media.uploadedBy` bị field access chặn và `alt` theo locale (/en dùng bản EN). `toSaleContactView` và `toRentalCardData` whitelist ảnh (`url/alt/width/sizes`) trước khi vào props Client Component. Ảnh gallery/tin tương tự vốn đọc qua truy vấn khách nên không có trường staff-only. Test: integration (avatar có `uploadedBy`, alt vi/en, không lộ id staff) + unit whitelist.
- **MINOR-1 (quyết định):** tin đã thuê lấy tối đa 8 tin tương tự theo design-spec S07 ("4-8"), tin còn trống 4; AC "tối đa 4" hiểu cho nhánh published. **Gap chờ spec-validator/user:** chưa lọc giá ±30% như design-spec (AC chỉ đòi cùng danh mục + tỉnh); không đổi intent doc.
- **MINOR-2 (đã sửa):** thẻ tin tương tự chỉ lấy ảnh đầu (`withCoverImages`: id thư viện ở depth 0 + một truy vấn media), không populate cả gallery.
- **MINOR-3 (follow-up L8):** `RentalCardData`/`RentalCard` cục bộ trùng khái niệm với `RentalCard` DTO của L7-T02; gộp một component/format card chung khi làm trang danh sách ở layer 8.
- **MINOR-4 (giữ):** `h2` "Căn tương tự đang trống" đứng trước `h1` ở tin đã thuê là theo design-spec S07 (tin tương tự nổi bật ngay sau ảnh); section có `aria-labelledby`, chấp nhận.
- **MINOR-5 (đã sửa):** tách `RentedBanner` và `RentalLongSections` khỏi `RentalDetail`, không đổi hành vi.
- **MINOR-6:** `src/payload-types.ts` chỉ đổi EOL, primary không stage.

## Follow-up từ review layer-7-task-03 round 2 (MINOR)
- [→ L8-T03] `src/lib/rentals/rental-queries.ts:71`: thẻ tin tương tự lấy `gallery[0]`; ảnh đầu bị xoá → dùng ảnh kế tiếp thay vì placeholder. `:74` truyền `locale` khi đọc ảnh bìa. Gộp với `RentalCard` của L7-T02 ở L8-T03.
