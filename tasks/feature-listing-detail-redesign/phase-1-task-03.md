# feature-listing-detail-redesign · phase-1-task-03 — Bộ component chi tiết dùng chung (`src/components/detail/*`)

- Nguồn: BL-052 change doc; design `docs/specs/listing-detail-redesign/detail-du-an.webp`.
- Spec: 1.46.0 khối BL-052 mục "Chi tiết Dự án" (khung), dùng lại cho "Chi tiết Cho thuê" / "Chi tiết Tin BĐS".
- Plan: phase 1 wave A (song song P1-T01, P1-T02). Thuần trình bày; **không** sửa `ProjectDetail` / `RentalDetail` / `PostDetail` (P1-T06, P2-T03, P3-T04 lắp ráp). Component cũ (`DetailGalleryHero`, `DetailTitleCard`, `DetailLayout` …) giữ nguyên cho tới khi trang cuối chuyển xong (dọn ở P3-T06).
- Phụ thuộc: không.

## Classification / Risk
- Type: **ADDITIVE**.
- Risk: **MEDIUM** — shared component 3 trang chi tiết, a11y, LCP.
- Expected review level: **STRICT**.
- Blast radius: `src/components/detail/*` (file mới; có thể thêm biến thể vào `DetailSubNav` không đổi hành vi cũ), i18n `messages/*` namespace `detail`.

## Scope (mỗi component có test)
1. `DetailHeroMosaic` — ảnh full-bleed (ảnh 1 `priority`, `sizes` đúng, không CLS, scrim token), breadcrumb trên ảnh (component sẵn có), slot badge, `h1`, ghim địa chỉ, mô tả ngắn, nút "Xem video giới thiệu" (prop video → Dialog/VideoFacade sẵn có; không có → không render); ≥ lg cột phải ≤ 3 thumbnail, thumbnail đầu (trên cùng) phủ "Xem tất cả N ảnh" như design → Lightbox sẵn có (bàn phím, focus trap); < lg thumbnail ẩn, nút "Xem tất cả N ảnh" trên ảnh. 1 ảnh → không thumbnail/nút.
2. `DetailSpecBar` — thẻ trắng nổi đè mép dưới hero, ≤ 6 ô (icon tròn + nhãn nhỏ + giá trị đậm), bỏ ô trống, ngăn bằng đường kẻ; < md lưới 2 cột / cuộn — không tràn; `dl` ngữ nghĩa.
3. Tab dính: tái dùng `DetailSubNav` (scroll-spy BL-027/028/029) — thêm kiểu viên thuốc như design nếu cần, giữ hành vi + test cũ.
4. `DetailSection` mới (hoặc mở rộng `DetailSection` sẵn có không đổi hành vi cũ): eyebrow vàng + `h2` + mô tả tuỳ chọn + `id` neo + `scroll-margin`.
5. `DetailInfoGrid` — lưới icon + nhãn + giá trị (2 cột ≥ sm), bỏ ô trống.
6. `DetailStatCards` — thẻ số lớn + nhãn + dòng phụ (dùng cho Sản phẩm dự án).
7. `DetailGalleryGrid` — 1 ảnh lớn + 4 ảnh nhỏ + "Xem tất cả hình ảnh" (mở Lightbox ở đúng ảnh bấm); < 5 ảnh co lưới hợp lý; 0 ảnh → không render.
8. `DetailContactAside` — slot form (LeadForm do trang truyền) trong thẻ trắng tiêu đề/mô tả + khối Hotline nền tối (`tel:`, nút "Gọi ngay"); không hotline → ẩn khối; dính theo `DetailAsideFit` (BL-031) như hiện tại.
9. `DetailFeatureList` — danh sách icon + tên + mô tả, hiện N mục đầu + nút "Khám phá tất cả …" mở phần còn lại (button `aria-expanded`), tuỳ chọn ảnh lớn bên trái.
10. `DetailDistanceList` — danh sách địa điểm (icon + tên + chip khoảng cách), > 8 mục → "Xem thêm".
11. `SimilarCarousel` — đầu khối (eyebrow + `h2` 2 màu) + link "Xem tất cả …" + carousel thẻ (tái dùng `CardSlider` sẵn có, mũi tên trái/phải hai mép).
12. Khung trang `DetailPageShell` (hero → spec bar → [tab dính + cột nội dung | cột phải dính] → slot cuối trang) với nền + khoảng cách theo design; < lg cột phải xuống sau nội dung (slot CTA dính đáy giữ như hiện tại).
13. Không icon tim; token theo `no-raw-colors.test`.

## Acceptance
- [ ] Test từng component (rỗng, 1 ảnh, nhiều ảnh, không video, không hotline, a11y attr).
- [ ] 375 / 768 / 1280 không tràn ngang.
- [ ] Test cũ `DetailSubNav` / `DetailLayout` / `DetailGalleryHero` vẫn PASS.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
