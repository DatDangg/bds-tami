# feature-site-redesign-homepage-style · phase-1-task-05 — Chi tiết Cho thuê theo khung chi tiết mới + chi tiết Đăng tin BĐS (Q4) (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045) mục 2. Spec delta: khối BL-045 mục "Trang chi tiết" (danh sách mục Cho thuê Q7, form giữ Q6, chi tiết Đăng tin BĐS Q4 — đã chốt).
- **Mockup bắt buộc Read:** `docs/specs/site-redesign-mockup/index.html` view `detail-rent`.
- Phụ thuộc: **T04** (DetailGalleryHero, DetailTitleCard, `sectionStyle="cards"`), T02 (`RentalCard`, `CardSlider`), T01.
- Song song: chạy ở **wave C** (sau T04). Có thể song song với T03/T06/T07 nếu chúng còn chạy.
- Trạng thái: `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user
Như T01. Giữ: SaleContactBox (giá, sale/hotline, LeadForm `source=rental`), tin đã thuê (băng "Đã thuê", badge, "Căn tương tự đang trống", `noindex`), video (`VideoFacade`), bản đồ gần đúng, pháp lý, thanh dính đáy < lg, header ẩn khi cuộn, BL-031.

## Classification / Risk
- Type: **MODIFY** (bố cục chi tiết F3 + F4).
- Risk: **MEDIUM–HIGH** — hai trang có form lead + noindex logic; **không đổi schema lead** (Q6: bỏ ô "Ngày muốn xem").
- Expected review level: **STRICT**.
- Blast radius: `/cho-thue/[slug]` (+ `/en`); `/tin-bds/[slug]` (+ `/en`).
- Doc impact: design-spec S07 (+ S09) — T08.

## Scope / files
1. `src/components/rentals/RentalDetail.tsx`, `RentalSpecs.tsx`, `RentalTerms.tsx`, `SaleContactBox.tsx`, `SimilarRentals.tsx`, `src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx`, view `src/lib/rentals/*detail*` (visible sections):
   - `DetailGalleryHero` (ảnh tin; nút "Video" khi có video → Dialog/VideoFacade sẵn có; "Tất cả ảnh" → Lightbox) + breadcrumb overlay (Trang chủ › Cho thuê › danh mục › mã tin).
   - `DetailTitleCard`: eyebrow "danh mục · mã tin" + badge (Còn trống / Đã thuê), `h1`, ghim địa chỉ, "Giá thuê" + giá/tháng (thoả thuận → chữ như hiện tại), chia sẻ; facts: diện tích · phòng ngủ / WC · nội thất · hướng.
   - Mục thẻ: Tổng quan (mô tả) · Thông tin chi tiết (thông số + điều kiện) · Tiện ích (khi có `amenities`; bỏ hàng Tiện ích trong `RentalSpecs`) · Điều khoản · Video (khi có) · Vị trí · Pháp lý (khi có) (Q7 đã chốt).
   - Aside: `SaleContactBox` khoác kiểu `.aside` (thẻ trắng, khối sale/hotline kiểu `.agent`), **giữ tiêu đề + trường form lead hiện tại**, không thêm ô ngày (Q6).
   - Cuối trang: nền trắng, `SectionHeading` canh trái "Căn tương tự" + `CardSlider` `RentalCard` → `ConsultBanner`. Tin đã thuê: khối "Căn tương tự đang trống" giữ vị trí hiện tại (ngay sau ảnh lớn) + `pb-8` (BL-031).
2. **Chi tiết Đăng tin BĐS (Q4)** `src/components/posts/PostDetail.tsx`, `PostContactBox.tsx`, `PostShare.tsx`: ảnh bìa thành `DetailGalleryHero` 1 ảnh (không bộ đếm), `DetailTitleCard` (eyebrow danh mục, badge ưu đãi, `h1`, giá/khu vực nếu có), mục thẻ Tổng quan · Ưu đãi · Nội dung · Hình ảnh (`sectionStyle="cards"`), thẻ liên hệ `PostContactBox` dính (`LeadForm source=property_post`), Tin liên quan canh trái nền trắng → `ConsultBanner`. Breadcrumb overlay trên ảnh.
3. i18n `page.rentalDetail.*` (+ `page.postDetail.*`).
4. Tests: `RentalDetail` tests (mục hiện/ẩn, đã thuê noindex + khối tương tự, video), `SaleContactBox` (LeadForm source), `PostDetail` (khung mới, lead source, chia sẻ), 1 `h1`.

## Acceptance
- [ ] `/cho-thue/<slug>` khớp `detail-rent` 1440 + 390; tin đã thuê đúng băng/badge/noindex/khối tương tự.
- [ ] Form lead gửi được `source=rental`; video mở; bản đồ; scroll-spy; aside dính không cuộn riêng.
- [ ] `/tin-bds/<slug>` theo khung chi tiết mới (đối chiếu `detail-rent` phần ảnh lớn / khối tiêu đề / mục thẻ), form lead `source=property_post` giữ.
- [ ] Không hex mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/components/rentals src/components/detail src/components/posts src/lib/rentals` → `pnpm typecheck` → `pnpm lint` → xem thật 1440 + 390 (tin còn trống, tin đã thuê, tin có video), chụp màn hình (`.context/review-reports/assets/site-redesign-t05-*.png`).

## Retry / Escalation
Như T01.

## Quyết định builder (tự quyết, 2026-10-21)
- Mục thanh mục con Cho thuê: `overview` (Tổng quan = mô tả, chỉ khi có mô tả) · `details` (Thông tin chi tiết, luôn có) · `amenities` · `terms` · `video` · `location` · `legal`. Bỏ id `description`.
- "Thông tin chi tiết" gộp: mã tin, danh mục, diện tích, tầng, phòng ngủ, WC, nội thất, hướng nhà/ban công, dự án, ngày đăng. Bỏ hàng Tiện ích khỏi đây (khối Tiện ích riêng, ô icon tròn nền `primary-subtle`, icon Phosphor thêm vào `icons.ts`). Bỏ hàng thông số `RentalSpecs` cũ vì đã vào khối tiêu đề.
- Nút "Video" trên ảnh lớn mở `Dialog` + `VideoFacade`; khối Video thẻ vẫn giữ (Q7).
- Tin đã thuê: băng "Đã thuê" + "Căn tương tự đang trống" nằm ngay sau khối tiêu đề (ảnh lớn kết thúc ở đó), bọc `pb-8` (BL-031); Điều khoản vẫn accordion đóng nhưng khoác khung thẻ (`DETAIL_SECTION_FRAME_CLASS` xuất từ `DetailSection`).
- `SaleContactBox` giữ giá + sale/hotline + form; khối sale/hotline đổi sang kiểu `.agent` (nền `primary-subtle`, bo 16px). Không thêm ô ngày (Q6).
- "Căn tương tự": tiêu đề đổi từ "Tin tương tự" sang "Căn tương tự" (mockup); `CardSlider` + `RentalCard`; nền trắng; rỗng thì không dựng.
- Đăng tin BĐS: `DetailGalleryHero` 1 ảnh (cover), title card (eyebrow = danh mục, badge ưu đãi, giá/khu vực của ưu đãi nếu có), thẻ Tổng quan (excerpt + danh mục + ngày đăng, luôn có) · Ưu đãi (`OfferBox` bỏ h2/khung riêng, `DetailSection` lo) · Nội dung · Hình ảnh; `RelatedPosts` (slider nền trắng) + `ConsultBanner`. `PostShare` (+test) XOÁ vì `DetailShareButton` trong title card thay thế; key `page.posts.share` + `page.posts.relatedTitle` bỏ.
- MINOR T04: #4 tách `GalleryCounter`/`GalleryThumbs` sang `DetailGalleryParts.tsx`; #5 `aria-roledescription` chỉ khi >1 ảnh; #1 `LegalPolicy` h2 `text-h3` khi có eyebrow. (#2 key i18n chết, #3 trùng thông tin: để T08.)
- Banner tư vấn (`ConsultBanner`) truyền từ `page.tsx` (cùng kiểu trang dự án): nút chính `#lead-form`, nút phụ gọi hotline.

## Verification summary (builder điền)
- Acceptance criteria: PASS (xem tay 1440 + 390 tin còn trống, tin đã thuê, trang Đăng tin; video chỉ test đơn vị vì DB dev không có tin nào có `videoUrl`).
- Verify commands + result: `pnpm typecheck` PASS · `pnpm lint` 0 lỗi (2 warning cũ ở tools/task-dashboard) · `pnpm vitest run src` 251 file / 2463 test PASS. Không chạy integration (không đổi query/schema).
- Lệch so với mockup + lý do: không có ô "Ngày muốn xem" (Q6, không đổi schema lead); tiêu đề aside giữ "Nhận tư vấn" (giữ form hiện tại).
- Ảnh: `.context/review-reports/assets/site-redesign-t05-*.jpg`.
- Reviewer verdict:
