# feature-mobile-card-carousel-nav · phase-1-task-01 — Dãy thẻ cuộn ngang: mũi tên + chấm cả ở mobile, dùng chung `CardSlider` (BL-122)

- Change doc: `spec/changes/2026-11-17-mobile-card-carousel-nav.md` (BACKLOG BL-122, QA sheet dòng 36).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT PASS round 1 (`.context/review-reports/feature-mobile-card-carousel-nav-phase-1-task-01-round-1-review.md`); 4 MINOR không chặn (hàng 8 chấm ở màn 320 lấn lề 4px mỗi bên, không cuộn ngang trang; comment `SimilarCarousel.tsx:22` / `ProjectAmenities.tsx:39` còn ghi "mũi tên từ md"; class `md:hover:bg-text` thừa; `RentalsTabs.test.tsx` không restore `scrollIntoView`). Spec 1.64.0 / scope v121. CHƯA commit (user 2026-11-18).

## Classification / Risk
- Type: **MODIFY (UI / design-spec)** — code đúng design-spec cũ (mũi tên chỉ ≥ md, Cho thuê không chấm); user duyệt plan 2026-11-18.
- Risk: **MEDIUM** — sửa slider dùng chung (`CardSlider`, `SliderArrow`), 4 khu vực + `ProjectAmenities` dùng `CardSlider`. Không đổi API/schema/data.
- Expected review level: STRICT (shared component, nhiều consumer).

## Root cause (đã chứng minh)
1. `src/components/layout/use-snap-slider.tsx` `ARROW_BUTTON` = `hidden … md:inline-flex` → mũi tên ẩn < md ở mọi slider.
2. Thẻ < sm cố ý 82% (`CardSlider.tsx:32`) / 80% (`RentalsTabs.tsx:13`) để lộ thẻ kế — **GIỮ NGUYÊN** (user chốt).
3. `RentalsTabs.tsx:20` `useSnapSlider(cards.length, false)` → không theo dõi vị trí, không chấm; slider riêng, không dùng `CardSlider`.

## Thiết kế (user duyệt 2026-11-18)
- **Giữ** bề rộng thẻ mobile như hiện tại (82% `CardSlider`, 80% Cho thuê) — lộ thẻ kế là gợi ý vuốt.
- **Mũi tên trước/sau ở mọi breakpoint** cho 4 khu vực: Trang chủ "Dự án nổi bật" (`ProjectsSlider`) + "Thuê nhà ở & kinh doanh" (`RentalsTabs`), "Dự án tương tự" / "Căn tương tự" / "Tin liên quan" (`SimilarCarousel` → `CardSlider arrows="sides"`).
  - < md: một hàng dưới slider `‹ chấm ›` (cả biến thể `sides`). ≥ md: giữ y nguyên hiện tại (`below`: hàng ‹ chấm ›; `sides`: mũi tên tròn đè hai mép + chấm dưới).
  - Thực hiện bằng opt-in, KHÔNG đổi mặc định `SliderArrow` → `OffersSlider`, `SpotlightSlider` không đổi (ngoài scope QA).
- **Chấm cho mọi dãy**, kể cả Cho thuê: `RentalsSlider` chuyển sang dùng `CardSlider` (một component cho 4 khu vực). Hành vi Cho thuê thành như các slider kia: chấm = số vị trí cuộn được thật, mũi tên đi 1 vị trí và vòng (thay `scrollByPage` 90%). Ghi rõ thay đổi này là có chủ đích (cả desktop: thêm chấm, bước 1 vị trí).
  - Giữ hình học Cho thuê: thẻ 80% < sm · 2 thẻ ≥ sm · 4 thẻ ≥ lg, gap 16 / 24px (lg), list `-mx-2 px-2` trong khung `px-gutter` — cần prop tối thiểu cho `CardSlider` (vd `slideClassName` + biến thể lề list), mặc định giữ nguyên cho consumer cũ.
- **Chấm vừa màn hẹp:** tối đa 8 thẻ (Cho thuê `HOME_RENTALS_PER_TAB_MAX = 8`) + 2 mũi tên 44px phải vừa một hàng ở 320/375 px. < md: nút chấm cao 44px, rộng tối thiểu 24px (WCAG 2.5.8) để vừa hàng; ≥ md giữ `size-11` như cũ. Mũi tên luôn 44×44.
- Chấm/mũi tên cập nhật khi vuốt (cơ chế `useSnapSlider` có sẵn). Chỉ hiện điều khiển khi `pageCount > 1` (giữ BL-038/BL-075).
- A11y: nhãn vi/en có sẵn (`previous`/`next`/`dots`/`goTo` — Cho thuê cần thêm `dots`/`goTo` nếu chưa có trong `page.home.rentals`), focus-visible, bàn phím (Tab tới nút, ←/→ trong vùng cuộn), `motion-reduce` (cuộn `auto`), `aria-disabled` không đổi.

## Files
- Sửa: `src/components/layout/use-snap-slider.tsx`, `src/components/layout/CardSlider.tsx`, `src/components/layout/CardSlider.test.tsx`, `src/components/home/RentalsTabs.tsx`, test Cho thuê (thêm mới nếu chưa có), có thể `src/components/home/ProjectsSlider.tsx` / `src/components/detail/SimilarCarousel.tsx` (chỉ bật opt-in), `src/i18n/messages/vi.json` + `en.json` (chỉ khoá mới cho Cho thuê nếu thiếu).
- Doc (change-request ghi): `.context/design-spec.md` (chỉ đoạn BL-122), `SPECIFICATIONS.md`.
- KHÔNG đụng: mọi file bẩn ngoài scope (snapshot `.context/runs/.bl122-baseline-status.txt` + BL-119/BL-121), `OffersSlider`, `SpotlightSlider`, `ListingTabsScroller`.

## Acceptance
- [ ] 375: 4 khu vực có ‹ chấm › dưới dãy thẻ, vuốt được (scroll-snap), chấm + vị trí cập nhật khi vuốt và khi bấm mũi tên/chấm; thẻ vẫn lộ thẻ kế.
- [ ] Cho thuê có chấm ở mọi breakpoint; dùng `CardSlider`.
- [ ] 768/1440: Dự án nổi bật, Dự án tương tự, Tin liên quan không đổi bố cục; Cho thuê giữ bề rộng thẻ/gap, thêm chấm.
- [ ] Nút có nhãn vi/en; bàn phím; reduced-motion; mũi tên 44×44, chấm cao 44 (≥ 24 rộng < md, 44 ≥ md); hàng điều khiển không tràn ở 320/375 với 8 thẻ.
- [ ] `OffersSlider`, `SpotlightSlider`, `ProjectAmenities` không đổi ngoài ý muốn (ProjectAmenities dùng `CardSlider arrows="sides"` — nếu nhận mũi tên mobile thì ghi rõ trong report).
- [ ] Test hồi quy: `CardSlider.test.tsx` (mũi tên hiển thị < md khi opt-in, Cho thuê có chấm), test `RentalsTabs`.
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/components/layout src/components/home src/components/detail src/components/posts src/components/projects src/components/rentals src/i18n` PASS.
- [ ] Ảnh 375 / 768 / 1440 trên dev local (`pnpm dev`, port 3000): trang chủ (2 khối), chi tiết dự án, chi tiết tin BĐS → `.context/review-reports/assets/bl122-*.png`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: mobile 375, 4 khu vực → thẻ kế bị cắt ở mép phải, không mũi tên / chấm (Cho thuê không chấm ở mọi breakpoint).
- Expected: lộ thẻ kế + ‹ chấm › dưới dãy, đi tới từng thẻ được.
- Actual before fix: < md mũi tên `hidden` (`ARROW_BUTTON … md:inline-flex`) ở mọi slider; Cho thuê dùng `useSnapSlider(count,false)` → không chấm ở mọi breakpoint, mũi tên cuộn 90% trang.
- Actual after fix: 375/320: 4 khu vực có `‹ chấm ›` dưới dãy (mũi tên 44×44, chấm 24×44), thẻ kế vẫn lộ (82%/80%), bấm "Tin sau" → chấm 2 active; Cho thuê dùng `CardSlider` (chấm ở mọi breakpoint, 8 thẻ: hàng 296px vừa 320, không h-scroll). 768/1440: bố cục Dự án nổi bật / Tương tự / Tin liên quan không đổi (`sides` vẫn tròn đè hai mép từ md); Cho thuê giữ bề rộng thẻ/gap, thêm chấm.
- Evidence: `pnpm typecheck` OK; eslint 5 file OK; vitest layout/home/detail/posts/projects/rentals/i18n = 67 files, 625 tests PASS (mới: CardSlider BL-122 x2, `RentalsTabs.test.tsx` x4 — test dots/arrows Cho thuê sẽ FAIL trên code cũ vì không có chấm/nhãn `dots`). Ảnh `.context/review-reports/assets/bl122-{home-projects,home-rentals,project-similar,post-related}-{375,768,1440}.png` (dev DB có đủ dữ liệu; ở 1440 Dự án tương tự/Tin liên quan ≤ 4 thẻ nên pageCount=1, không điều khiển — đúng BL-038/075; chưa chụp được trạng thái `sides` ≥ md với > 4 thẻ ở 1440, 768 đã thấy mũi tên đè hai mép). Đo 320 bằng Playwright msedge.
- Status: PASS (chờ Reviewer)

## Residual risk
- `ProjectAmenities` (CardSlider `sides`) cũng nhận mũi tên + chấm trên mobile vì dùng chung `CardSlider` (cùng loại thẻ cuộn; thay đổi chủ đích tối thiểu, không thêm prop opt-out).
- Cho thuê desktop: thêm chấm, mũi tên đi 1 vị trí + vòng (thay cuộn 90% trang) — chủ đích.
- `scrollByPage` trong `use-snap-slider.tsx` không còn consumer trong scope (giữ nguyên, không xoá ngoài scope).
- `OffersSlider`/`SpotlightSlider`/`ListingTabsScroller` giữ `SliderArrow` mặc định (`showOnMobile=false`) → không đổi.
- Chưa kiểm tay bàn phím/reduced-motion trên trình duyệt (chỉ test + class `motion-reduce` giữ nguyên).

## Doc impact
- `.context/design-spec.md` S01 khối 3 + 8 + khung chi tiết (slider tương tự): mũi tên mọi breakpoint, chấm cho Cho thuê. `SPECIFICATIONS.md` as-built MINOR. Không đổi API/ERD/schema.
