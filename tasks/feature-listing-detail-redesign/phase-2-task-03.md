# feature-listing-detail-redesign · phase-2-task-03 — Chi tiết Cho thuê `/cho-thue/[slug]` theo khung chi tiết mới

- Nguồn: BL-052 change doc mục "Cho thuê".
- Spec: 1.46.0 khối BL-052 mục "Chi tiết Cho thuê".
- Plan: phase 2 wave A (song song P2-T01). **Không** sửa `RentalCard` / `rental-view` card mapping (P2-T01) — "Căn tương tự" dùng thẻ như đang có.
- Phụ thuộc: P1-T03 (component chi tiết), mẫu lắp ráp P1-T06.

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai, địa chỉ chính xác (`showExactAddress` / access), tin đã thuê (noindex, băng, căn tương tự), form lead.
- Expected review level: **STRICT**.
- Blast radius: `src/components/rentals/RentalDetail.tsx`, `RentalSpecs`, `RentalTerms`, `RentalAmenities`, `RentalVideoButton`, `SaleContactBox`, `SimilarRentals`, `use-rental-facts`, `src/lib/rentals/rental-detail-sections.ts`, route `cho-thue/[slug]/page.tsx`, i18n.

## Scope
1. `DetailPageShell` + `DetailHeroMosaic` (gallery, badge danh mục + "Đã thuê", mã tin, `h1`, vị trí theo quy tắc địa chỉ, nút video `videoUrl`) → `DetailSpecBar`: Giá thuê (…/tháng | Thương lượng | Liên hệ) · Diện tích · Phòng ngủ/tắm · Nội thất · Hướng (`houseDirection`) · Dọn vào từ (`rentalTerms.availableFrom`, `dd/MM/yyyy`).
2. Tab: Tổng quan (mô tả + `DetailInfoGrid`: mã tin, tầng, hướng ban công, thuộc dự án (link), ngày đăng…) · Vị trí · Tiện ích (`amenities` icon + nhãn i18n) · Hình ảnh (`DetailGalleryGrid`) · Điều khoản thuê · Pháp lý (khi `legalNote`).
3. Cột phải: `DetailContactAside` với giá + sale phụ trách / hotline (giữ `SaleContactBox` nội dung) + form lead `source=rental` duy nhất; < lg thanh dính đáy giữ.
4. Tin đã thuê: băng "Đã thuê", "Căn tương tự đang trống" vị trí như hiện tại (sau hero), `noindex, follow`; cuối trang `SimilarCarousel` "Căn tương tự" → dải Điểm mạnh (cờ rentals) → `ConsultBanner` (`#lead-form` + `tel:`).
5. Khối trống ẩn cả khối lẫn tab. Kiểm 1440 / 390, VI + EN, tin đầy đủ / tối thiểu / đã thuê / ẩn địa chỉ chính xác.

## Acceptance
- [ ] Bố cục cùng khung chi tiết Dự án; thanh thông số đúng 6 ô theo spec (ô trống bỏ).
- [ ] Địa chỉ chính xác chỉ hiện khi `showExactAddress` (test); tin đã thuê giữ hành vi.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Quyết định (builder)
- **Khung:** `RentalDetail` dựng trên `DetailPageShell` như P1-T06: hero `DetailHeroMosaic` → `DetailSpecBar` → tab dính → [Tổng quan (thẻ trắng) | cột liên hệ dính] → dải `bands` nền xen kẽ Vị trí · Tiện ích · Hình ảnh · Điều khoản thuê · Pháp lý → `after`: "Căn tương tự" → dải Điểm mạnh → `ConsultBanner`. < lg cột liên hệ xuống ngay sau Tổng quan (trước các dải), `ProjectStickyCta` giữ.
- **Tab / neo:** `RENTAL_SECTION_IDS` = overview · location · amenities · gallery · terms · legal (BL-052). **Bỏ** mục/neo `#details` (Thông tin chi tiết — nội dung chuyển vào thanh thông số + lưới thông tin Tổng quan) và `#video` (video thành nút "Xem video giới thiệu" trên hero, Dialog + `VideoFacade` sẵn có của `DetailHeroMosaic`). Link cũ tới `#details` / `#video` rơi về đầu trang → ghi as-built spec khi close-out. Tổng quan luôn có (mã tin luôn có); Vị trí khi có `map` (toạ độ được phép, đã làm tròn khi ẩn địa chỉ); Hình ảnh khi ≥ 2 ảnh (ảnh 1 là nền hero, như P1-T06).
- **Hero:** chip danh mục (kiểu chip P1-T06) + badge "Đã thuê" (`dark` + viền sáng — `neutral` mất tương phản trên nền tối) + chữ "Mã tin CT-xxxxxx"; bỏ badge "Còn trống" (spec chỉ nêu badge danh mục + "Đã thuê"). Vị trí = `view.addressLine` (số nhà/đường chỉ khi `showExactAddress`, quy tắc `toRentalDetailView` giữ nguyên). Breadcrumb giữ (`jsonLd={!rented}`, mục cuối = mã tin).
- **Thanh thông số (6 ô, ô trống bỏ):** Giá thuê (tin đã thuê: nhãn "Giá tham khảo") · Diện tích · Phòng ngủ / tắm ("2 phòng ngủ · 1 WC", phần nào có thì hiện) · Nội thất · Hướng (`houseDirection`) · Dọn vào từ (`rentalTerms.availableFrom`, `formatDate` sẵn có: VI `dd/MM/yyyy`, EN theo `en-US` như mọi ngày khác trên site — cùng chuỗi với khối Điều khoản).
- **Giá:** helper mới `useRentalPrice` / `RentalPriceText` (`src/components/rentals/RentalPriceText.tsx`): có giá → "12 triệu/tháng"; `priceNegotiable` → **"Thương lượng"**; chưa nhập giá → **"Liên hệ"** (trước đây cả hai là "Thoả thuận"). `priceNegotiable` đọc từ `doc` (prop `doc` thêm `priceNegotiable`) — **không sửa `rental-view.ts`** (P2-T01). Chuỗi giá ở thanh thông số chèn U+200B trước "/tháng" để ô hẹp (2 cột < sm, EN "20 million VND/month") xuống dòng trước "/month" thay vì cắt giữa từ. Lưu ý: `RentalCard` ("Căn tương tự") vẫn hiện "Thoả thuận" cho tới khi P2-T01 đổi thẻ.
- **Tổng quan:** eyebrow "Giới thiệu" + `h2` "Tổng quan" + mô tả (khi có) + `DetailInfoGrid` (Mã tin, Danh mục — link, Tầng, Hướng ban công, Thuộc dự án — link, Đăng ngày). `DetailInfoGrid.link.newTabLabel` thành tuỳ chọn: không có → `next/link` nội bộ mở tại chỗ (dự án / danh mục); có → link ngoài tab mới như cũ (ProjectOverview không đổi). Ngày đăng mất thẻ `<time>` (giá trị lưới là chuỗi) — chấp nhận.
- **Cột liên hệ:** `SaleContactBox` nay dựng `DetailContactAside` (prop mới `header`: phần đầu thẻ TRÊN tiêu đề form, thẻ trắng bọc cả hai, vùng form `#lead-form` nền trong suốt): giá thuê → người phụ trách (avatar, tên, nút "Gọi {sđt}") khi có sale → form `LeadForm source=rental` duy nhất. Không có sale → khối Hotline nền tối "Gọi ngay" của `DetailContactAside` (thay "Liên hệ TAMI" + nút "Gọi hotline …"); không hotline → ẩn. Tin đã thuê: "Giá tham khảo" mờ + tiêu đề "Nhận tư vấn căn tương tự", nguồn vẫn là tin.
- **Tin đã thuê:** `DetailPageShell` thêm prop `belowSpecBar` (sau thanh thông số, trong khối `pb-8` trước tab) → băng "Đã thuê" + "Căn tương tự đang trống" đúng vị trí cũ (sau hero/khối đầu trang); cuối trang không lặp "Căn tương tự". Điều khoản thu gọn accordion; `noindex, follow` + không JSON-LD giữ nguyên (page.tsx không đổi phần metadata/JSON-LD).
- **Căn tương tự:** `SimilarRentals` dùng `SimilarCarousel` (mũi tên hai mép, "Xem tất cả căn cho thuê" → `/cho-thue`) với `RentalCard` như hiện có (không truyền biến thể mới của P2-T01). Bỏ dòng mô tả "Cùng khu vực, mức giá gần giống." (`SimilarCarousel` không có mô tả, như "Dự án tương tự").
- **Điểm mạnh:** loader mới `src/lib/content/load-listing-strengths.ts` `loadListingStrengths(locale, key)` = cờ màn qua `resolveListingPageContent` (`rentals` → `listingPages.rentals.showStrengths`, mặc định bật) + điều kiện khối trang chủ của `resolveProjectStrengths`; lỗi global → `null`. Dùng lại được cho danh sách Cho thuê / Tin BĐS.
- **Nút chia sẻ: bỏ** (như P1-T06): design không có chỗ, menu dự phòng của `DetailShareButton` sẽ bị `overflow-hidden` của hero che; prop `shareUrl` của `RentalDetail` bỏ theo. → ghi as-built spec khi close-out.
- **Xoá:** `RentalSpecs.tsx`, `RentalVideoButton.tsx`, `use-rental-facts.tsx` (không còn ai dùng; đã `git rm` — đang ở index). `DetailTitleCard` / `DetailGalleryHero` giữ (Tin BĐS còn dùng).
- **i18n:** namespace `page.rentalDetail.v2` (cuối `page.rentalDetail`, vi + en): tabs, eyebrow/titles overview + gallery, galleryDescription, codeChip, spec.{negotiable, contact, layout, availableFrom}, info.{label, project}, similarViewAll. Khoá cũ không còn dùng (`subNav.*`, `sections.overview/details/video`, `eyebrow.overview/details/video`, `facts.sanitary`, `contact.hotlineTitle`, `video.*`, `specs.negotiable`) để nguyên — dọn ở P3 cho khỏi xung đột merge.
- **Không đổi:** quy tắc địa chỉ chính xác / toạ độ (`toRentalDetailView`, `findRentalPrivateFields`), JSON-LD `RealEstateListing` + breadcrumb, metadata/noindex, `ClickRefMarker`, không migration.

## Verification summary (Builder)
- Worktree DB `tami_wt52_p2t03` (pg_dump `tami` + `pnpm payload migrate` — không có migration mới), REDIS_DB 9. Dữ liệu thử CHỈ trên DB worktree: CT-000064 đầy đủ (toạ độ, `showExactAddress`, dự án, ngày trống, tầng, hướng ban công, pháp lý, bản EN), CT-000078 ẩn địa chỉ (toạ độ + số nhà bí mật), CT-000077 `rented`, CT-000087 tối thiểu (1 ảnh, không giá/tiện ích/điều khoản/video/toạ độ).
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn `tools/task-dashboard/server.mjs`) · `pnpm test` **379 files / 3824 tests PASS** · `pnpm build` PASS.
- Test mới/sửa: `rental-detail.test.tsx` (tab/thứ tự, tin tối thiểu, bố cục Tổng quan | aside + dải nền xen kẽ, hero, 6 ô thông số, Thương lượng/Liên hệ, lưới thông tin + link nội bộ, cuối trang + Điểm mạnh, 1 form, tin đã thuê, /en), `SaleContactBox.test.tsx`, `rental-detail-sections.test.ts`, `page.test.tsx` (Điểm mạnh theo cờ `rentals`, hotline "Gọi ngay", không chia sẻ; test ẩn địa chỉ chính xác giữ nguyên và PASS), `DetailBlocks.test.tsx` (`DetailInfoGrid` link nội bộ, `DetailContactAside header`), `DetailPageShell.test.tsx` (`belowSpecBar`), `load-listing-strengths.test.ts`.
- Trình duyệt (dev `-p 3203`, đã dừng): 1440 VI đầy đủ — thanh thông số 1 hàng 6 ô, Tổng quan cạnh cột liên hệ cùng mép trên, 5 dải nền `surface`/`bg-alt` xen kẽ, 1 h1, 1 `#lead-form`, JSON-LD BreadcrumbList + RealEstateListing, không cuộn ngang, số nhà hiện (`showExactAddress`). Ẩn địa chỉ: HTML không chứa số nhà lẫn toạ độ thật, hero + Vị trí chỉ "phường, tỉnh". Đã thuê: badge trên hero, băng + "Căn tương tự đang trống" trước tab, "Giá tham khảo", Điều khoản accordion, 0 JSON-LD. Tối thiểu: chỉ tab Tổng quan, 0 dải, thông số Giá "Liên hệ" · Diện tích · Phòng ngủ/tắm, không nút video / xem ảnh. 375 EN + VI: nhãn EN đủ, cột liên hệ sau Tổng quan trước dải, CTA dính đáy, không cuộn ngang (phát hiện + sửa giá "VND/mont-h" gãy giữa từ bằng U+200B).
- Residual risk: (1) tiêu đề tin cho thuê dài → `h1` hero cỡ `text-h1` 3–4 dòng (hero vẫn chứa đủ ở 1440/375; cỡ chữ là của `DetailHeroMosaic` chung, không đổi riêng). (2) Bản đồ (`LazyMap`) chỉ thấy placeholder trong lần kiểm (hành vi cũ). (3) Màn chụp ở pane bị thu nhỏ nên so design chủ yếu bằng đo DOM. (4) `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` `M` chỉ do LF/CRLF sau build — không stage.

## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-2-task-03-round-1-review.md` — **STRICT PASS**. MINOR: M1 ký tự U+200B gõ thẳng trong `RentalPriceText.tsx` → `\u200B` (P2-T02); M2 `DetailInfoGrid` link ngoài phụ thuộc `newTabLabel` → union type (P3-T06); M3 as-built spec (bỏ neo `#details`/`#video`, bỏ nút chia sẻ, giá "Thương lượng"/"Liên hệ" thay "Thoả thuận"; thẻ RentalCard thống nhất chữ ở P2-T02) → close-out; M4 ngày đăng mất `<time>` (P2-T02); M5 key i18n cũ (P3-T06).

## Verification summary (close-out)
- Acceptance: **PASS**. typecheck · lint 0 error · test 379 file / 3824 PASS · build PASS · reviewer 45 file / 486 + integration 45 PASS.
