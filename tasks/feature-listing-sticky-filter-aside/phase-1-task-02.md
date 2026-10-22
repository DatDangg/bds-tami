# feature-listing-sticky-filter-aside · phase-1-task-02 — Chi tiết Dự án / Cho thuê / Tin BĐS: mọi khối nội dung ở cột trái, cột liên hệ dính tới khi gặp "… tương tự" / "Tin liên quan"

- Nguồn: BL-061 · change doc `spec/changes/2026-10-22-listing-sticky-filter-aside.md` (yêu cầu 3). T01 (danh sách) đã xong riêng — không đụng lại.
- Áp cho 3 màn chi tiết `/du-an/[slug]` · `/cho-thue/[slug]` · `/tin-bds/[slug]` (vi + en). Không đổi schema / API / i18n / URL / id khối / thanh tab.
- User 2026-10-22 chốt bố cục 2 cột (khác design BL-052 `detail-du-an.webp` để các khối full width). **AUTO PROCEED**: phương án chốt ở § Quyết định, builder không hỏi.
- **Tái dùng cho BL-062 (chi tiết Tin tức, chạy sau):** cơ chế "cột dính tới hết khối liên quan" phải là **khung chung** (không hard-code cho Dự án) — xem Quyết định 1 + 4. KHÔNG làm phần Tin tức ở đây.

## Classification / Risk
- Type: **MODIFY** (đổi bố cục khung chi tiết chung BL-052 — `SPECIFICATIONS.md:44` "Chi tiết Dự án", design-spec :235 "Khung chi tiết chung"; thay "dải rộng hết khung nền xen kẽ").
- Risk: **MEDIUM** — khung dùng chung 3 màn + nhiều khối con phải vừa cột hẹp hơn (≈ 776px ở 1440, ≈ 590px ở 1024). Không auth / schema / API. Regression: scroll-spy thanh tab, `scroll-mt`, CTA dính đáy, `#lead-form`, `#documents`, JSON-LD không đổi.
- Expected review level: **NORMAL** (shared layout; STRICT không cần vì không có risk đỏ — reviewer tự chọn).
- Blast radius: `src/components/detail/DetailPageShell.tsx` (:1-76), `DetailLayout.tsx` (:10-74), `DetailAsideFit.tsx`, `DetailContactAside.tsx` (chỉ nếu cần), `DetailSection.tsx` (:12-13 `DETAIL_SECTION_FRAME_CLASS`), `src/components/projects/ProjectDetail.tsx` (`useProjectBands` :114-150, `ProjectDetail` :225-252), `ProjectLocation.tsx:70-85`, `ProjectHighlights.tsx:15`, `LegalPolicy.tsx:126`, `ProjectAmenities.tsx:55` (`-mx-gutter`), `ProjectListings.tsx:15`, `src/components/rentals/RentalDetail.tsx` (:143-156 bands, :201), `src/components/posts/PostDetail.tsx` (:209-220, :243), `DetailGalleryGrid.tsx:49` (bento `md:`); test `DetailPageShell.test.tsx:36-59` (bands ngoài lưới — PHẢI đổi), `DetailLayout.test.tsx`, `project-detail.test.tsx`, `rental-detail.test.tsx`, `PostDetail.test.tsx:142`, `project-detail-blocks.test.tsx`; doc as-built design-spec :235 + S03/S07/S09, `docs/DESIGN.md:240,242,244,276`.

## Hiện trạng (file:line — không spawn Explore)
- `DetailLayout.tsx:39-40` lưới `GRID_WITH_ASIDE`: `lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] xl:…24rem` — **không** `items-start` → ô `aside` (`DetailAsideFit`, :64-66) cao bằng hàng lưới = cột trái. Thẻ dính là **phần tử con đầu của `aside`** (`DetailContactAside` gốc `div.STICKY_CLASS`, :45) với `DETAIL_ASIDE_STICKY_CLASS` (:10) `top = min(--sticky-top + 4.5rem, 100dvh − --detail-aside-h − 1rem)`; `--detail-aside-h` do `DetailAsideFit` đo (:22-30). ⇒ Thẻ dính trong suốt chiều cao hàng lưới và **tự dừng khi hết lưới**. Vấn đề duy nhất: `DetailPageShell.tsx:45-55` đưa `bands` + `after` vào `DetailLayout after` (ngoài lưới) nên hàng lưới chỉ cao bằng Tổng quan.
- `DetailSection` (:12-13): trong `group/detail` + `data-section-style=cards` (DetailLayout :57) tự thành thẻ trắng bo 20px `p-5 md:p-8`; ngoài `group/detail` (dải) là kiểu kẻ trên + `py-section-tight`.
- Khối KHÔNG qua `DetailSection`: `LegalPolicy.tsx:45` (`section` riêng; `useProjectBands` :139 bọc `py-section-tight`); `ProjectAmenities.tsx:55` kéo `-mx-gutter` cho `CardSlider` (đúng khi trong dải `px-gutter`, **sai** khi trong thẻ `p-5/md:p-8`).
- Khối nhiều cột theo viewport: `ProjectLocation.tsx:70` `lg:grid-cols-12` (bản đồ·danh sách·thẻ Kết nối hạ tầng 5·4·3 ≥ xl, 7/5 lg — BL-060); `ProjectHighlights.tsx:15` `sm:2 xl:3`; `LegalPolicy.tsx:126` `xl:grid-cols-2`; `ProjectListings.tsx:15` `sm:grid-cols-2`; `DetailGalleryGrid.tsx:49` bento `md:grid-cols-4`; `RentalTerms.tsx:30` `md:2`; `RentalAmenities.tsx:30` `2 / md:3`; `DetailFeatureList` `sm:2 lg:3`; `PriceTable` `min-w-[40rem]` cuộn ngang trong khung (đã ổn).
- Cho thuê: `RentalDetail.tsx:198-213` — tin đã thuê đặt `similarBlock` ở `belowSpecBar`, tin trống ở `after` (giữ). Tin BĐS: `PostDetail.tsx:243` `RelatedPosts` ở `after` (giữ).
- `.context/design-spec.md` không có token container query; repo chưa dùng `@container` (Grep `@container|@lg:` = 0). Tailwind v4 có sẵn biến thể `@container` / `@md:` / `@3xl:`.

## Quyết định (AUTO PROCEED)
1. **Khung chung — `DetailPageShell`:** `bands` **vào cột trái** sau `children`, mỗi dải thành một phần tử trong cột `group/detail` (tức là thẻ trắng như Tổng quan): bỏ nền xen kẽ + bọc `max-w-container px-gutter`; giữ `key` + `data-detail-band` (đổi JSDoc: "khối trong cột trái, sau khối đầu"). Prop `bands` giữ tên/kiểu (`DetailBand[]`) để diff 3 trang nhỏ; `after` vẫn ngoài lưới (full width). JSDoc `DetailPageShell` + `DetailLayout` ghi rõ **công thức dính tái dùng**: "cột phải = ô lưới cao bằng hàng (không `items-start`) → phần tử con đầu của `aside` `sticky` theo `DETAIL_ASIDE_STICKY_CLASS`; mọi khối cần form đi kèm nằm TRONG lưới (cột trái); khối sau lưới (`after`) đứng ngoài → thẻ thôi dính đúng khi tới khối đó".
2. **Tái dùng (BL-062):** generalize tối thiểu, không đổi hành vi hiện có:
   - `DETAIL_ASIDE_STICKY_CLASS` (DetailLayout :10): `top` đọc biến `--detail-aside-top` có mặc định = `calc(var(--sticky-top) + 4.5rem)`: `lg:top-[min(var(--detail-aside-top,calc(var(--sticky-top)_+_4.5rem)),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))]` → trang không có thanh tab (Tin tức) chỉ cần đặt `[--detail-aside-top:calc(var(--sticky-top)+1.5rem)]` trên `aside`/cột. Kiểm Tailwind v4 sinh đúng (dấu `_` cho khoảng trắng trong arbitrary value; `var(--x,calc(...))` không có khoảng trắng cũng hợp lệ).
   - `DetailAsideFit` thêm prop `as?: "aside" | "div"` (mặc định `aside`; `aria-labelledby` chỉ khi có) — cột trái dính của Tin tức là `div`. JSDoc: "ô lưới nào muốn dính tới hết hàng lưới: bọc bằng `DetailAsideFit` + con đầu mang `DETAIL_ASIDE_STICKY_CLASS`".
   - Không tạo component mới khác, không đổi `DetailContactAside` API.
3. **Khối vừa cột hẹp (container query)**: đặt `@container/detail` lên cột trái `div.group/detail` (DetailLayout :57) (Tailwind v4: class `@container/detail`). Đổi các lưới theo viewport sang theo cột:
   - `ProjectLocation.tsx:70-85`: `lg:grid-cols-12` → `@3xl/detail:grid-cols-12` (≥ 48rem cột); các span helper (`mapSpan` / `listSpan` / `mediaSpan`) đang dùng `lg:col-span-* xl:col-span-*` → `@3xl/detail:` / `@5xl/detail:` (xem file; giữ logic BL-060 5·4·3 / 7/5 / 8/4 theo bậc container). Bản đồ `LazyMap` cao cố định — giữ.
   - `ProjectHighlights.tsx:15`: `sm:grid-cols-2 xl:grid-cols-3` → `@md/detail:grid-cols-2 @3xl/detail:grid-cols-3`.
   - `LegalPolicy.tsx:126`: `xl:grid-cols-2` → `@3xl/detail:grid-cols-2`; bỏ bọc `py-section-tight` ở `useProjectBands` (:139-141) và cho `LegalPolicy`/mỗi block của nó dựng **thẻ** như `DetailSection` trong cards (dùng `DETAIL_SECTION_FRAME_CLASS` ở `section` :45 hoặc bọc cả `LegalPolicy` trong một thẻ với 2 cột bên trong — chọn cách giữ `id`/`scroll-mt`/`#documents`/accordion mobile nguyên).
   - `ProjectAmenities.tsx:55`: `-mx-gutter` → `-mx-5 md:-mx-8` (khớp padding thẻ `DETAIL_SECTION_FRAME_CLASS`) để slide đầu thẳng mép chữ; kiểm `CardSlider` `px-gutter` so với `p-5/8` — nếu lệch thì truyền padding cho `CardSlider` (xem prop sẵn có) thay vì mx âm.
   - `ProjectListings.tsx:15`: giữ `sm:grid-cols-2` nhưng đổi theo cột `@md/detail:grid-cols-2`; `DetailGalleryGrid.tsx:49` bento `md:` → `@md/detail:` **chỉ khi** component được dùng trong cột (nó cũng dùng ở đâu khác? Grep; nếu chỉ chi tiết thì đổi, không thì thêm prop). `RentalTerms` / `RentalAmenities` / `DetailFeatureList`: `md:`/`lg:` → `@md/detail:` / `@2xl/detail:` tương đương.
   - Nguyên tắc: không tràn ngang (`min-w-0` đã có ở cột), bảng giá cuộn trong khung như cũ, ảnh/bản đồ co theo cột.
4. **3 trang:** `ProjectDetail` / `RentalDetail` / `PostDetail` giữ `bands={bands}` (DetailPageShell tự đặt vào cột) — chỉ sửa JSDoc ("các khối … trong cột trái") và chỗ `py-section-tight` của legal. Thứ tự khối + tab không đổi. `after` giữ nguyên.
5. **Scroll-spy / neo**: `DetailSection` `scroll-mt` giữ; `DetailSubNav` quét theo `id` cả trang — không đổi. CTA dính đáy `ProjectStickyCta` ẩn khi `#lead-form` trong viewport — không đổi.

## Scope
1. Sửa theo § Quyết định 1–5.
2. Test (TDD — fail trước, pass sau):
   - `DetailPageShell.test.tsx:36-59` viết lại: bands nằm **trong** cột trái (`[data-section-style=cards]`) sau `children`, trước `aside` trong DOM; `DetailSection` trong band có lớp thẻ (`group-data-[section-style=cards]/detail:…`); không còn `max-w-container px-gutter` bọc band; `after` vẫn ngoài lưới (sau `aside`). Thêm test: cột trái có `@container/detail`.
   - `DetailLayout.test.tsx`: `DETAIL_ASIDE_STICKY_CLASS` chứa `var(--detail-aside-top,`; `DetailAsideFit as="div"` dựng `div` (không `aria-labelledby`), mặc định `aside`.
   - `project-detail.test.tsx` / `rental-detail.test.tsx` / `PostDetail.test.tsx:142`: cập nhật assert `data-detail-band` (vẫn có, nay trong cột); thứ tự id khối không đổi; `#lead-form` duy nhất; `after` (similar/related) sau lưới.
   - `project-detail-blocks.test.tsx` (BL-060): cập nhật class container-query nếu test đang assert `lg:col-span`.
3. Kiểm thị giác + hành vi (Browser pane, dev server `tami-dev`, DB local; `/du-an/sun-festo-town-ha-long` (hoặc dự án có đủ khối), 1 tin `/cho-thue/<slug>`, 1 tin `/tin-bds/<slug>`; vi + en; 1440 / 1024 / 768 / 390):
   - 1440 + 1024: cuộn qua Vị trí · Tiện ích · Hình ảnh · … · Hỏi đáp → form + hotline luôn ở cột phải (dính dưới thanh tab hoặc dính đáy khi cao hơn viewport); tới "Dự án tương tự" / "Căn tương tự" / "Tin liên quan" → form dừng, không đè. Thanh tab active đúng khi cuộn; bấm tab cuộn tới khối đúng (không bị che).
   - Khối rộng trong cột hẹp: Vị trí (bản đồ + danh sách + Kết nối hạ tầng), Thư viện ảnh (bento), Bảng giá (cuộn ngang trong khung), Mặt bằng, Pháp lý & chính sách (2 cột ≥ 48rem cột), Tiện ích slider (mép thẳng), Tin đăng (2 cột) — không tràn ngang (`document.documentElement.scrollWidth === clientWidth`).
   - 768 / 390: 1 cột, aside sau nội dung, CTA dính đáy "Nhận tư vấn" tới `#lead-form` hoạt động.
   - Chụp `.context/review-reports/assets/bl061-p1t02-<màn>-<w>-<mốc>.png` (ít nhất: du-an-1440 giữa trang (Tiện ích/Mặt bằng), du-an-1440 tại "Dự án tương tự" (form đã dừng), du-an-1024 Vị trí, cho-thue-1440, tin-bds-1440, du-an-390, en-1440). Không chạy được → residual, không bịa.
4. Doc impact (as-built, builder sửa): `.context/design-spec.md:235` (Khung chi tiết chung: "→ [tab dính + Tổng quan + **mọi khối nội dung (thẻ trắng, cột trái, `@container/detail`)** | cột phải dính `DetailContactAside` suốt chiều cao cột trái] → slider tương tự / tin liên quan (ngoài lưới → thẻ thôi dính) → …"; bỏ "dải rộng hết khung nền xen kẽ"); mục S03 :395 / S07 :496 / S09 :545 thêm 1 câu "As-built BL-061: …"; `docs/DESIGN.md:240,242,244` (3 dòng chi tiết: "dải rộng hết khung" → "khối thẻ trong cột trái; form dính tới '… tương tự'"), `:276` (Khung chi tiết BL-052: thêm "BL-061: `bands` nằm trong cột trái; `DETAIL_ASIDE_STICKY_CLASS` nhận `--detail-aside-top`; `DetailAsideFit as`"). KHÔNG sửa `SPECIFICATIONS.md` / `spec/**`.
5. Verify (`.context/project-config.md`): `pnpm typecheck` · `npx eslint <file scope>` · `pnpm test` (đủ bộ, chờ xong) · `pnpm build`.
6. **KHÔNG commit**; không stage/đụng file dirty ngoài scope (xem T01 §6).
7. Ghi `## Verification summary` vào cuối file này trước khi trả report. Report mở đầu `Agent: builder`.

## Acceptance
- [ ] ≥ lg, 3 màn chi tiết: tất cả khối nội dung ở cột trái (thẻ trắng); form tư vấn + hotline dính cột phải trong suốt lúc cuộn qua các khối; tới "Dự án tương tự" / "Căn tương tự" / "Tin liên quan" thì dừng (không đè).
- [ ] Khối rộng vẫn đẹp trong cột hẹp — xếp dọc / thu cột theo bề rộng cột, không tràn ngang ở 1024 và 1440.
- [ ] Thanh tab + `scroll-mt` đúng; `#lead-form`, `#documents`, CTA dính đáy mobile hoạt động; < lg aside sau nội dung như cũ.
- [ ] `DETAIL_ASIDE_STICKY_CLASS` nhận `--detail-aside-top`; `DetailAsideFit as="div"`; JSDoc công thức tái dùng (BL-062).
- [ ] Test cập nhật PASS; typecheck + eslint (scope) + test + build PASS. design-spec + DESIGN.md as-built; không đụng `spec/**`.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
