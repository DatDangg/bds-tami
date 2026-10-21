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
