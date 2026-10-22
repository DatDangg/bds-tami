# Spec Update — 2026-10-22 listing-sticky-filter-aside

**spec_version:** 1.51.0 → 1.52.0 (MINOR — đổi bố cục Dự án / Cho thuê / Tin BĐS: bộ lọc danh sách dính + cuộn riêng, thẻ nổi bật bấm cả thẻ, chi tiết 2 cột với form tư vấn dính tới khối "… tương tự"; user duyệt 2026-10-22)
**Trigger:** feature-update (BL-061, change-request class MODIFY)
**Work item:** `feature/listing-sticky-filter-aside` phase 1 · T01 NORMAL PASS r1 (commit `b0fdc6a`) · T02 NORMAL PASS r1 (working tree, commit close-out sắp tới) · spec-validator phase 1 PASS
**Change doc:** `spec/changes/2026-10-22-listing-sticky-filter-aside.md` · tasks `tasks/feature-listing-sticky-filter-aside/phase-1-task-01.md`, `phase-1-task-02.md` · reviews `.context/review-reports/feature-listing-sticky-filter-aside-phase-1-task-0{1,2}-round-1-review.md` · `.context/review-reports/spec-validation-feature-listing-sticky-filter-aside-phase-1.md`

## Lý do và quyết định thay thế
User chốt bố cục mới (2026-10-22) để người đọc luôn thấy form tư vấn bên cạnh nội dung và bộ lọc luôn trong tầm nhìn. **Thay thế** quyết định 2026-10-21 trong `spec/updates/2026-10-21-listing-detail-redesign.md:44` ("cột phải cạnh khối Tổng quan, dính trong phạm vi khối đó; các khối sau là dải rộng hết khung nền xen kẽ" — quyết định review P1-T03 của BL-052 + phần tương ứng của design `detail-du-an.webp`). File update cũ **không sửa** (lịch sử); bản này là nguồn hiện hành cho phần đó.

## Requirements
- **SỬA — Trang danh sách, khung chung, mục (3) (`SPECIFICATIONS.md:39`):** ≥ lg cột "Bộ lọc" dính ngay dưới header (`top` = `--sticky-top` + 1rem), cao tối đa bằng phần màn hình còn lại, tự cuộn bên trong khi dài hơn (`overscroll-contain`, cuộn bộ lọc không cuộn trang); thôi dính ở cuối lưới kết quả (FAQ / Điểm mạnh / banner tư vấn nằm ngoài lưới); < lg giữ Sheet. Áp cho `/du-an`, `/cho-thue`, `/tin-bds` (+ danh mục) vi + en.
- **SỬA — Thẻ nổi bật `/du-an` (`SPECIFICATIONS.md:43`, áp cả 3 màn; :45 / :48 trỏ cùng khung):** bấm bất kỳ chỗ nào trên thẻ mở chi tiết bằng link phủ (stretched link) từ nút "Xem chi tiết", không lồng `<a>`; ngoại lệ: "Nhận tư vấn" (→ `#lead-form`), mũi tên + chấm / bộ đếm chuyển slide; focus bàn phím có ring quanh thẻ, hover đổi màu tiêu đề.
- **SỬA — Chi tiết Dự án, cột phải (`SPECIFICATIONS.md:44`; Cho thuê :46 và Tin BĐS :49 "cùng khung"):** thay "cạnh Tổng quan + dải rộng hết khung" bằng: mọi khối nội dung (Tổng quan, Vị trí, Tiện ích, Hình ảnh, Nổi bật, Mặt bằng, Bảng giá, Pháp lý & chính sách, Tin đăng, Hỏi đáp) là thẻ trắng ở cột trái (`@container/detail`); khối nhiều cột đổi số cột theo **bề rộng cột**, không theo viewport; cột phải (form + hotline) dính suốt chiều cao cột trái và dừng ở khối "… tương tự" / "Tin liên quan" (ngoài lưới, rộng hết khung, cùng Điểm mạnh + banner tư vấn).
- **SỬA — Thứ tự mobile (gap G5):** < lg cột phải (form + hotline) nay đứng **sau toàn bộ khối nội dung** (trước đó ngay sau Tổng quan). Thanh CTA dính đáy → `#lead-form` giữ nguyên; sub-nav + `scroll-mt` giữ.
- **SỬA — BL-060 mục (5), khối Vị trí "Kết nối hạ tầng" (`SPECIFICATIONS.md:63`, gap G1):** breakpoint theo bề rộng cột — cột ≥ 48rem: 12 cột 7/5 (bản đồ + danh sách, thẻ xuống dưới); cột ≥ 64rem: 5·4·3; hẹp hơn: xếp dọc; thiếu phần → 8/4. Trong khung 2 cột (container ≤ 84rem) bố cục 5·4·3 thực tế không còn xuất hiện ở viewport nào, và 7/5 không xuất hiện ở 1024 (xếp dọc) — chấp nhận theo acceptance BL-061.
- **THÊM:** không có requirement mới (chỉ đổi bố cục + as-built).
- **XOÁ:** không (cụm "dải rộng hết khung nền xen kẽ" của BL-052 bị thay).

## Ảnh hưởng
- Module: `src/components/listing/FilterPanel.tsx` (`LISTING_FILTER_STICKY_CLASS`), `listing/SpotlightSlider.tsx`, `listing/spotlight-content-classes.ts` (stretched link), 3 `*SpotlightContent.tsx` (Project / Rental / Post); `src/components/detail/DetailPageShell.tsx` (`bands` vào cột trái, `after` ngoài lưới), `DetailLayout.tsx` (`@container/detail`, `DETAIL_ASIDE_STICKY_CLASS` + `--detail-aside-top`), `DetailAsideFit.tsx` (prop `as`), `DetailGalleryGrid.tsx`, `DetailFeatureList.tsx`; `projects/{ProjectDetail,ProjectLocation,ProjectAmenities,ProjectHighlights,ProjectListings,LegalPolicy}.tsx`; `rentals/{RentalDetail,RentalTerms,RentalAmenities}.tsx`; `posts/PostDetail.tsx`.
- Không đổi schema / API / i18n key / route / quyền, **không migration**. Id khối + `scroll-mt` giữ (assert 8 id).
- Doc as-built đã cập nhật: `.context/design-spec.md`, `docs/DESIGN.md` (:240, :242, :244, :276).
- Scope: `spec/test-scope/current.json` v68 (bản cũ v67 → `spec/test-scope/archive/test-scope-1.51.0-67.json`).

## Verify
- T01: `pnpm typecheck` PASS · eslint scope PASS · `pnpm test` 420 file / 4.403 PASS · `pnpm build` PASS. T02: typecheck PASS · eslint scope PASS · `pnpm test` 420 file / 4.406 PASS · `pnpm build` PASS. Reviewer T02 tự chạy typecheck + eslint 20 file + vitest scope 25 file / 289 PASS (không chạy build / full suite vì chung `.next` với dev server).
- Browser pane (DB local) ảnh `.context/review-reports/assets/bl061-*`.

## Residual (đẩy sang test / staging)
- **R3:** DB local không có dự án với Nổi bật, Mặt bằng, Bảng giá, Pháp lý & chính sách 2 cột, Tin đăng, Hỏi đáp, thẻ "Kết nối hạ tầng" → các khối này chỉ kiểm bằng jsdom + test class; cần kiểm thị giác trên staging (tràn ngang, số cột theo bề rộng cột).
- **R4:** en chỉ kiểm ở 1440 (vi đủ 1440 / 1024 / 768 / 390); `/en/projects` local không có thẻ nổi bật.
- **R1 / R2:** click thật chỉ chạy ở `/du-an` (cho-thue / tin-bds đo bằng JS + unit); ảnh điểm dừng form ở "Dự án tương tự" bị cắt (có số đo `getBoundingClientRect`).
- G3 (cosmetic): nhảy tới `#legal` / `#sales-policy` đầu heading sát thanh tab. G4 (chú thích / tên test cũ "dải rộng hết khung") đã sửa trong cùng commit T02. Ảnh `sizes` chưa chỉnh cho cột hẹp (chỉ ảnh hưởng hiệu năng). `FloorPlans`, `DetailInfoGrid`, `DetailStatCards` còn dùng breakpoint viewport (không tràn).
