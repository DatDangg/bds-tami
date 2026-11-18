# Spec Update — 2026-11-18 mobile-card-carousel-nav

**spec_version:** 1.63.3 → 1.64.0 (MINOR — as-built MODIFY UI BL-122)
**Trigger:** feature-update (BL-122, `feature-mobile-card-carousel-nav`, QA 36)
**Requirements:** SỬA hành vi UI các dãy thẻ cuộn ngang dùng chung `CardSlider` (Dự án nổi bật, Cho thuê "Thuê nhà ở & kinh doanh" — chuyển sang `CardSlider`, "Dự án tương tự" / "Căn tương tự" / "Tin liên quan", Tiện ích có ảnh): có mũi tên trước/sau ở mọi breakpoint và chấm chỉ vị trí; Cho thuê thêm chấm ở mọi breakpoint, mũi tên đi 1 vị trí và vòng. < md: hàng `‹ chấm ›` dưới dãy (mũi tên 44×44, chấm cao 44 × rộng 24), thẻ vẫn ~82% (Cho thuê 80%) để lộ thẻ kế; vuốt scroll-snap, chấm cập nhật khi vuốt. ≥ md bố cục không đổi. Nhãn vi/en, bàn phím, reduced-motion. Không đổi API/schema. Dòng delta nằm trong `SPECIFICATIONS.md` mục "Dự án nổi bật (ĐỔI thẻ + đầu khối)".
**Ảnh hưởng:** `use-snap-slider.tsx`, `CardSlider.tsx`, `RentalsTabs.tsx`, i18n vi/en; home Featured projects + Rentals, chi tiết dự án (Dự án tương tự, Tiện ích), chi tiết cho thuê (Căn tương tự), chi tiết tin BĐS (Tin liên quan). Hồi quy: OffersSlider, SpotlightSlider, ListingTabsScroller, bố cục desktop/tablet, hero slider. Doc: `.context/design-spec.md` cập nhật.
**Rủi ro còn lại:** medium. Reviewer STRICT PASS (`.context/review-reports/feature-mobile-card-carousel-nav-phase-1-task-01-round-1-review.md`). ProjectAmenities (`arrows="sides"`) nhận mũi tên ở mobile.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 121)
