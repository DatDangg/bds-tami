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

## Quyết định (builder)
- **Agent:** builder-strong (attempt 1). Base `c26d69e` (ff staging). DB `tami_wt52_p1t03` (bản sao DB dev `tami`, chỉ đọc nguồn), REDIS_DB 13.
- **i18n namespace riêng: `detailKit`** (top-level, thêm cuối `vi.json` / `en.json`): `hero.*`, `specBar.label`, `gallery.*`, `contact.*`, `expand.*`. Nhãn theo trang (tiêu đề khối, "Khám phá tất cả tiện ích", "Xem tất cả dự án", nhãn slider…) do trang truyền qua prop.
- **`DetailPageShell` dựng trên `DetailLayout sectionStyle="cards"`** (không nhân bản lưới): giữ `data-detail-page` (header ẩn khi cuộn, `--sticky-top`), nền `bg-primary-subtle`, `DetailSubNav`, `DetailAsideFit`, mỗi `DetailSection` là thẻ trắng bo 20px — các khối dự án cũ (dựa `DetailSection`) cắm thẳng vào khung mới được. Design vẽ các khối là dải full-width xen kẽ nền; giữ kiểu thẻ vì cột phải dính suốt nội dung (spec BL-052 "Cột phải dính ≥ lg") — dải full-width không đi cùng cột dính.
- **Tab dính:** dùng nguyên `DetailSubNav` (đã là viên thuốc, mục đang xem nền `primary`) — **không sửa** để giữ hành vi + test BL-027/028/029.
- **`DetailSection`:** mở rộng thêm prop tuỳ chọn `description` (đoạn mô tả dưới `h2`); không truyền → DOM/class như cũ.
- **`CardSlider`:** thêm prop tuỳ chọn `arrows?: "below" | "sides"` (mặc định `below` = như cũ); `sides` đặt 2 mũi tên tròn nền trắng đè hai mép (≥ md), hàng dưới chỉ còn chấm. Dùng trong `SimilarCarousel`. File thuộc `src/components/layout` (ngoài blast radius ghi trong task — cần cho "mũi tên trái/phải hai mép"; không thuộc task song song P1-T01/P1-T02).
- **Hero:** `h1` nằm trong hero (spec BL-052 Chi tiết Dự án), vùng `section[aria-labelledby=h1]`. Ảnh nhỏ đầu "Xem tất cả N ảnh" mở Lightbox ở ảnh 1; ảnh nhỏ 2/3 mở đúng ảnh đó. < lg nút viên thuốc "Xem tất cả N ảnh" trong khối chữ. Video: Dialog + `VideoFacade` (cùng mẫu `RentalVideoButton`), trang chịu trách nhiệm kiểm `videoUrl` hợp lệ. Slot `actions` cho nút phụ (chia sẻ…). Badge nằm trên nền tối (`theme-dark-block`) — trang chọn biến thể đọc được trên nền tối (ghi trong JSDoc).
- **`dl` hợp lệ:** `DetailSpecBar` / `DetailInfoGrid` để icon trong `dt` (định vị tuyệt đối) vì `dl > div` chỉ được chứa `dt`/`dd`; nhãn nhóm của thanh thông số đặt trên wrapper `role="group"` (không gắn `aria-label` lên `dl`).
- **Lưới co theo khung:** `DetailInfoGrid` (ô ≥ 13rem) và `DetailStatCards` (thẻ ≥ 8.5rem) dùng `repeat(auto-fill, minmax(…))` thay breakpoint viewport — kiểm trình duyệt thấy chữ bị cắt giữa từ khi 2 khối đứng cạnh nhau trong cột hẹp.
- **Mở rộng danh sách:** `DetailFeatureList` (mặc định 5 mục, nhãn nút do trang truyền) và `DetailDistanceList` (8 hàng, "Xem thêm") dùng chung `DetailExpandButton` (`aria-expanded` + `aria-controls`); mục dư dùng thuộc tính `hidden`.
- **`DetailContactAside`:** gốc là phần tử con đầu của `aside` nên `DetailAsideFit` đo đúng; class dính cùng công thức `DETAIL_ASIDE_CARD_CLASS` (BL-031). Thẻ form dùng `LeadFormSlot` (giữ neo `#lead-form`). Không hotline → ẩn khối tối.
- **Không** sửa `ProjectDetail` / `RentalDetail` / `PostDetail`, `DetailGalleryHero`, `DetailTitleCard`, `DetailLayout`, `DetailSubNav`. Không icon tim. Không migration.

## Verification summary (Builder)
- Test mới: `DetailHeroMosaic.test.tsx` (6), `DetailGalleryGrid.test.tsx` (4), `DetailLists.test.tsx` (6), `DetailBlocks.test.tsx` (7), `DetailPageShell.test.tsx` (4) + `CardSlider.test.tsx` +1 (`arrows="sides"`). Bao: rỗng, 0/1/nhiều ảnh, không video, có video (Dialog, chưa tạo iframe), không hotline, Lightbox đúng ảnh + trả focus, `aria-expanded`/`aria-controls`, cấu trúc `dl`, thứ tự khung, tiếng Anh.
- `pnpm exec vitest run src/components/detail src/components/layout/CardSlider.test.tsx` → 11 file / 63 test PASS (gồm test cũ `DetailSubNav`, `DetailLayout`, `DetailGalleryHero`, `DetailTitleCard`, `CardSlider`).
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning sẵn có ở `tools/task-dashboard/server.mjs`).
- `pnpm test` → 364/366 file PASS, 3644 test PASS; 2 file integration fail do môi trường khi chạy cả bộ (`media-upload` hook timeout 10s, `session-refresh`) → chạy riêng: `session-refresh` PASS, `media-upload` 20/20 PASS.
- Trình duyệt (dev server worktree cổng 3103, trang tạm `/zz-detail-kit` đã xoá, dữ liệu dự án thật): 1280 / 768 / 375 không tràn ngang (`scrollWidth = clientWidth`; chỉ thanh tab cuộn ngang trong chính nó); Lightbox mở từ "Xem tất cả 6 ảnh", Esc đóng trả focus về nút.
- `no-raw-colors`: chỉ dùng token (không hex/rgb, không `outline-none`).

## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-1-task-03-round-1-review.md` — **STRICT PASS**. MINOR: (1) shell giữ cột phải cả trang khác design → **quyết định change-request: theo design** — P1-T06 đặt aside chỉ cạnh Tổng quan, các khối sau là dải full-width qua slot `after` (spec cập nhật); (2) `DetailSpecBar` 1024–1150px chữ gãy → 3 cột lg, 1 hàng xl (P1-T06); (3) `DetailHeroMosaic` dài → tách (P3-T06); (4) công thức sticky lặp `DetailContactAside`/`DetailLayout` (P3-T06); (5) key theo label → thêm index (P1-T06).

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **STRICT PASS r1**. typecheck PASS · lint 0 error · detail/layout/home 318 test + projects/rentals/posts 208 test PASS. Không migration.

## Doc impact
- Component mới → `.context/design-spec.md` ở P3-T06.
