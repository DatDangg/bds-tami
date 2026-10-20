# feature-detail-pages-unified-layout · phase-1-task-02 — Chi tiết cho thuê dùng khung chi tiết chung (BL-027)

- Change doc: `spec/changes/2026-10-20-detail-pages-unified-layout.md` (BACKLOG BL-027)
- Phụ thuộc: **phase-1-task-01** (`DetailLayout`, `DetailSubNav`, `DetailSection`, `--sticky-top`, header ẩn trên trang chi tiết) → chạy sau T01.
- Trạng thái: `done` (review PASS round 2). Lịch sử: — user duyệt phase plan 2026-10-20 ("ok", chốt 4 đề xuất mặc định: mục con cho thuê Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý; cuộn lên header KHÔNG hiện lại (chỉ đầu trang / focus Tab); thẻ liên hệ cho thuê < lg sau thẻ nội dung; bo thẻ trắng ~28px).

## Classification / Risk
- Type: **MODIFY** (bố cục S07; không đổi schema/API/quyền/nguồn lead `rental`/JSON-LD `RealEstateListing`/noindex tin đã thuê)
- Risk: **MEDIUM** — đổi bố cục trang có form lead + trạng thái "Đã thuê".
- Expected review level: **NORMAL** (component khung đã review ở T01; trang này chỉ dùng lại) — nâng STRICT nếu builder phải sửa component chung.
- Blast radius: `/cho-thue/[slug]` + `/en/for-rent/[slug]` (tin `published` và `rented`).
- Doc impact: `SPECIFICATIONS.md` F3 (bố cục chi tiết), `.context/design-spec.md` S07 — change-request cập nhật ở close-out.

## Thiết kế (quyết định change-request)
- **D1 — khung:** `RentalDetail` dựng bằng `DetailLayout` (nền vàng nhạt, header ẩn khi cuộn, thanh mục con dính đỉnh, thẻ trắng nội dung, aside dính). `before` = breadcrumb → băng "Đã thuê" (nếu có) → thư viện ảnh (giữ LCP `priorityFirst` + badge "Đã thuê") → [tin đã thuê: "Căn tương tự đang trống" ngay sau thư viện như cũ]. `after` = Tin tương tự (tin còn trống) + `ProjectStickyCta`.
- **D2 — các khối trong thẻ trắng + mục con** (thứ tự = thứ tự trang; khối trống tự ẩn cả khối lẫn mục, giống `visibleSections` dự án — thêm `visibleRentalSections` + `RENTAL_SECTION_DOM_ID` trong `src/lib/rentals/`):
  1. **Tổng quan** `#overview` — luôn có: khối tiêu đề (`h1` duy nhất, mã tin + ngày đăng, địa chỉ) + Thông số chính 4 ô + "Chi tiết" `<dl>`. Khối dùng `h1` làm nhãn (không thêm `h2` "Tổng quan" hiển thị).
  2. **Điều khoản** `#terms` — `hasTerms` (tin đã thuê vẫn accordion đóng như cũ)
  3. **Mô tả** `#description` — `hasDescription`
  4. **Video** `#video` — `videoUrl`
  5. **Vị trí** `#location` — `map`
  6. **Pháp lý** `#legal` — `legalNote`
  - Tiêu đề khối đổi `text-h2-sm` → kiểu chung `DetailSection` (`font-display text-h2`) để 2 trang cùng kiểu.
  - Thư viện ảnh **giữ đầu trang** (không có mục "Thư viện" trên thanh) vì là ảnh LCP như ảnh tham chiếu Vinhomes.
  - Nhãn mục con thêm khoá i18n `page.rentalDetail.subNav.*` + `subNavLabel` (vi/en).
- **D3 — thẻ liên hệ (aside):** `SaleContactBox` đổi nền `bg-primary-subtle` → thẻ trắng `bg-surface` bo 20px viền + `shadow-md` giống thẻ "Tư vấn 1:1" (nếu giữ nền vàng nhạt sẽ chìm vào nền trang); dính ≥ lg `top` theo `--sticky-top` (bỏ `lg:top-[calc(var(--header-offset)+1rem)]`); `#lead-form` `scroll-mt` theo `--sticky-top`. Nội dung (giá, sale/hotline, form `source=rental`, tiêu đề tin đã thuê) giữ nguyên.
- **D4 — vị trí thẻ liên hệ < lg:** mặc định **sau thẻ nội dung** (giống chi tiết dự án; giá vẫn có ở Thông số chính đầu thẻ, thanh dính đáy `ProjectStickyCta` vẫn nhảy tới form). Đây là đổi so với design-spec S07 mốc 375 ("khung giá + form nằm sau Thông số chính").
- **D5 — giữ nguyên:** route/page `cho-thue/[slug]/page.tsx` (dữ liệu, metadata, JSON-LD), `ClickRefMarker`, breadcrumb JSON-LD chỉ khi chưa thuê.

## Files (dự kiến)
- `src/components/rentals/RentalDetail.tsx`, `RentalSpecs.tsx`, `RentalTerms.tsx`, `SaleContactBox.tsx`, `SimilarRentals.tsx` (nếu cần vị trí trong `before`/`after`)
- `src/lib/rentals/rental-detail-sections.ts` (mới, hoặc trong `rental-view.ts`) — `visibleRentalSections` + DOM id
- `src/i18n/messages/vi.json`, `en.json` (nhãn mục con)
- Test: `src/components/rentals/rental-detail.test.tsx` (mới — hiện chưa có test component chi tiết cho thuê), `src/lib/rentals/*.test.ts` cho `visibleRentalSections`

## Acceptance
- [ ] `/cho-thue/[slug]` dùng cùng `DetailLayout`/`DetailSubNav`/`DetailSection` với chi tiết dự án (không copy khung)
- [ ] Thanh mục con chỉ gồm khối có dữ liệu, đúng thứ tự trang; neo không bị che; `aria-current` đúng
- [ ] Cuộn xuống header ẩn hẳn, thanh mục con dính 8/16px từ đỉnh; nền `--color-primary-subtle`; nội dung trong thẻ trắng bo góc lớn; thẻ liên hệ tách riêng, dính ≥ lg
- [ ] Nút mục con active nền vàng chữ đen (dùng chung T01)
- [ ] Tin `rented`: băng + badge + "Căn tương tự đang trống" sau thư viện + giá mờ "Giá tham khảo" + Điều khoản thu gọn + tiêu đề form "Nhận tư vấn căn tương tự" + noindex/không JSON-LD — không đổi
- [ ] `h1` duy nhất = tiêu đề tin; form lead một bản trong DOM (`#lead-form`, `source=rental`)
- [ ] 375 / 768 / 1280px không tràn ngang; reduced-motion giữ nguyên
- [ ] Test mới cho bố cục + `visibleRentalSections`; `pnpm vitest run src/components/rentals src/components/detail src/lib/rentals`, `pnpm lint`, `pnpm typecheck` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Attempt 1. `pnpm vitest run src/components/rentals src/components/detail src/components/projects src/lib/rentals`: 15 file / 187 test PASS (mới: `rental-detail.test.tsx` 6 test, `rental-detail-sections.test.ts` 4 test). `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope). `pnpm typecheck`: PASS.
- Không sửa component chung `src/components/detail/*` (chỉ dùng lại `DetailLayout`/`DetailSection`/`DETAIL_ASIDE_CARD_CLASS`) → giữ nguyên expected review NORMAL.
- Dev server (cổng 3000, `/cho-thue/can-cho-thue-san-van-phong-tang-3-toa-n01-t2-khu-ngoai-giao-doan-quan-bac-tu`, tin published): 1280px — header cuộn xuống trượt ẩn (translateY -104), thanh mục con dính ở 16px, `--sticky-top` 1rem, nền rgb(248,243,235), thẻ liên hệ dính (top 88px), bấm "Mô tả" → `#description` hạ cánh 88px, `aria-current` = Mô tả, thanh chỉ gồm Tổng quan/Điều khoản/Mô tả (tin này không có video/vị trí/pháp lý), scrollWidth = clientWidth. 375px — thanh mục con ở 8px, `--sticky-top` .5rem, thẻ liên hệ nằm sau thẻ nội dung, không tràn ngang. Chưa kiểm bằng mắt: tin `rented`, 768px, reduced-motion.
- Attempt 2 (fix review round 1 M-1, m-3). `LeadFormSlot` trong `SaleContactBox` thêm `scroll-mt-[calc(var(--sticky-top)+4.5rem)]` (cn/twMerge: lớp ghi đè scroll-mt mặc định) để thanh mục con không che tiêu đề form khi nhảy `#lead-form`; `rental-detail.test.tsx` assert đúng lớp này. Tiêu đề "Chi tiết" (`RentalSpecs.tsx`, vẫn h2) đổi `text-h2-sm` -> `text-h2`. vitest (rentals/detail/projects/lib/rentals) 15 file / 187 test PASS; `pnpm lint` 0 error (2 warning cũ); `pnpm typecheck` PASS.
- Acceptance criteria: PASS theo test + kiểm tay ở trên (trừ các mục chưa kiểm bằng mắt — Residual risk). Reviewer verdict: NORMAL FAIL r1 (M-1 `#lead-form` scroll-mt) → FAST **PASS r2**. Spec Validator phase: PASS.

## Review
- Round 1 NORMAL FAIL — `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-02-round-1-review.md`
- Round 2 FAST PASS — `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-02-round-2-review.md`
- Phase spec validation PASS — `.context/review-reports/feature-detail-pages-unified-layout-phase-1-spec-validation.md`

## Doc impact / Reconcile
- Close-out phase (gộp T01 + T02): `SPECIFICATIONS.md` (Khung trang ngoại lệ trang chi tiết, Giao diện khung chi tiết chung, F2 thanh mục con + vị trí thẻ < lg, F3 bố cục chi tiết cho thuê) → **spec 1.23.0** (`spec/updates/2026-10-20-detail-pages-unified-layout.md`, CHANGELOG), test-scope **v29** (v28 → `spec/test-scope/archive/test-scope-1.22.0-28.json`); `.context/design-spec.md` §1 (cỡ tiêu đề), §2.1 (dòng Trang chi tiết + Sticky), S03 (mục 3, Bố cục, mục 11), S07 (cấu trúc, thẻ liên hệ, 375, 1024); `docs/DESIGN.md` (S03/S07 bảng màn); `docs/ARCHITECTURE.md` (ProjectSubNav → DetailSubNav); `.context/decisions.md` Decision 9. Không đổi API/schema/ERD.

## Residual risk
- Tin `rented`: bố cục kiểm bằng test (DOM/thứ tự), chưa kiểm bằng mắt trên dev server; "Căn tương tự đang trống" (nền `bg-bg-alt`, full-width) nằm trong `before` giữa thư viện và thanh mục con nên nền vàng nhạt của trang chỉ bắt đầu sau khối đó.
- Điều khoản thu gọn (rented) không dùng `DetailSection` (tránh h2 thứ hai) nên lặp lớp khung/`scroll-mt` của `DetailSection` ở `RentalTerms`; bấm mục "Điều khoản" ở tin đã thuê cuộn tới accordion đang đóng (không tự mở).
- Mục "Chi tiết" trong Tổng quan là h2 `text-h2` (đã đồng bộ ở attempt 2).
- `OBSERVER_MARGIN` của `DetailSubNav` là xấp xỉ (xem T01).
- Hằng `4.5rem` (thanh mục con + khe) viết tay ở `SaleContactBox`, `RentalTerms`, khối Tổng quan và component chung — đổi chiều cao thanh phải sửa nhiều chỗ (MINOR r2, có thể tách task export hằng).
