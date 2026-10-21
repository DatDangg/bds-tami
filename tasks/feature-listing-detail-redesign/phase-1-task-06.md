# feature-listing-detail-redesign · phase-1-task-06 — Chi tiết Dự án `/du-an/[slug]` theo design mới

- Nguồn: BL-052 change doc (Quyết định Dự án 2, 3, 4, 8); design `detail-du-an.webp`.
- Spec: 1.46.0 khối BL-052 mục "Chi tiết Dự án".
- Plan: phase 1 wave B (song song P1-T04, P1-T07). **Không** sửa `ProjectCard` / `project-view` card mapping / file danh sách (thuộc P1-T04, P1-T05) — "Dự án tương tự" dùng `ProjectCard` như đang có.
- Phụ thuộc: P1-T01 (trường mới), P1-T03 (component chi tiết).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai, LCP, form lead, JSON-LD, scroll-spy.
- Expected review level: **STRICT**.
- Blast radius: `src/components/projects/ProjectDetail.tsx` + khối (`ProjectOverview`, `ProjectLocation`, `NearbyTabs`, `ProjectAmenities`, `FloorPlans`, `PriceTable`, `LegalPolicy`, `Documents`, `ProjectFaq`, `ProjectHighlights`, `ProjectListings`, `ProjectSpecs`, `SimilarProjects`, `ProjectStickyCta`, `use-project-facts`), `src/lib/projects/project-detail-view.ts`, route `du-an/[slug]/page.tsx`, i18n.

## Scope
1. `DetailPageShell` + `DetailHeroMosaic` (gallery, badge danh mục + tình trạng, `h1`, địa chỉ, `summary`, video nếu `videoUrl`) → `DetailSpecBar`: Giá từ (giá hiệu lực — dùng helper P1-T04 nếu đã merge, không thì helper thuần trong `project-detail-view` rồi P1-T04 gom; ghi rõ trong task) · Quy mô (`scale.landAreaM2` → ha, "36,21 ha") · Diện tích (`areaFromM2`–`areaToM2` m²) · Chủ đầu tư · Bàn giao (`scale.handoverTime`) · Loại hình (`productTypes` nhãn i18n). **Không ô Pháp lý.**
2. Tab dính: Tổng quan · Vị trí · Tiện ích · Hình ảnh · Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp (khối có dữ liệu mới có tab; thứ tự đúng thứ tự khối).
3. Tổng quan: eyebrow "Giới thiệu" + `h2` "Tổng quan dự án" + `overview` + `DetailInfoGrid` (Tên thương mại, Chủ đầu tư, Vị trí, Quy mô, Loại hình, Bàn giao) + `DetailStatCards` từ `products`.
4. Cột phải: `DetailContactAside` — form "Nhận thông tin dự án" (LeadForm `source=project`, `#lead-form` duy nhất, trường hiện có) + Hotline `site-settings.hotline` "Gọi ngay". < lg: sau nội dung + `ProjectStickyCta` giữ.
5. Vị trí: eyebrow "Kết nối" + `h2` + địa chỉ + bản đồ sẵn có (`ProjectLocation`, điểm lân cận có toạ độ) + `DetailDistanceList` "Khoảng cách đến các địa điểm quan trọng" từ `nearbyAmenities` (icon theo nhóm). Bỏ tab lân cận theo nhóm (`NearbyTabs`) nếu không còn dùng.
6. Tiện ích nổi bật: eyebrow "Không gian sống" + `h2` + `DetailFeatureList` (ảnh `amenitiesImage`, mục icon + `name` + `description`, > 5 → "Khám phá tất cả tiện ích").
7. Hình ảnh: eyebrow "Thư viện ảnh" + `h2` + `DetailGalleryGrid` + "Xem tất cả hình ảnh".
8. Khối giữ lại (sau Hình ảnh), vẽ lại kiểu đầu khối mới: Nổi bật, Mặt bằng, Bảng giá (+ ngày cập nhật), Pháp lý & chính sách (+ tài liệu PDF, neo `#documents` mở khối nếu thu gọn), Tin liên quan (quy tắc F2 giữ), Hỏi đáp (+ JSON-LD FAQPage giữ).
9. "Dự án tương tự": `SimilarCarousel` + "Xem tất cả dự án" → `/du-an`; rồi dải Điểm mạnh (theo cờ) → `ConsultBanner` (→ `#lead-form` + `tel:`).
10. Khối trống ẩn cả khối lẫn tab; `/en` bỏ hàng thiếu chữ EN như F2.
11. Kiểm trình duyệt: so `detail-du-an.webp` 1440px, 390px, VI + EN, dự án ít dữ liệu (không video/sản phẩm/ảnh tiện ích).

## Acceptance
- [ ] Bố cục khớp `detail-du-an.webp` desktop; mobile hợp lý; không tim; không ô Pháp lý trên thanh thông số.
- [ ] Khối trống ẩn (video, sản phẩm, tiện ích, ảnh, FAQ…), test cho dự án tối thiểu + đầy đủ.
- [ ] Một LeadForm, `#lead-form`, JSON-LD (Breadcrumb, FAQ…) giữ; 1 `h1`.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Bổ sung từ review P1-T03 (change-request 2026-10-21)
- **Bố cục theo design:** cột phải (form + hotline) chỉ **cạnh khối Tổng quan** (dính trong phạm vi đó); Vị trí / Tiện ích / Hình ảnh / khối giữ lại / Tương tự là **dải full-width nền xen kẽ** qua slot `after` của `DetailPageShell` (cập nhật mô tả slot hoặc thêm prop riêng). Kiểm: scroll-spy tab vẫn chạy cho khối trong `after`, `#lead-form` + CTA dính đáy < lg vẫn tới form.
- `DetailSpecBar`: lg 3 cột, xl 1 hàng 6 ô (chữ không gãy giữa từ 1024–1150px); key `label+index` ở `DetailSpecBar` / `DetailInfoGrid`.

## Quyết định (builder)
- **Khung:** `DetailPageShell` thêm prop `bands: DetailBand[]` (dải rộng hết khung, nền xen kẽ `bg-surface` / `bg-bg-alt` bắt đầu bằng trắng, nội dung trong `max-w-container px-gutter`), render trước `after`. Chỉ Tổng quan nằm trong lưới cạnh cột phải → cột phải dính trong phạm vi Tổng quan. Tint dùng `bg-bg-alt` (không `primary-subtle`) để chip / vòng icon `primary-subtle` trong dải vẫn tách nền. JSDoc `children` / `aside` / `after` cập nhật. Scroll-spy: `DetailSubNav` tìm `document.getElementById` nên khối trong dải vẫn được theo dõi (kiểm trình duyệt: tab "Vị trí" sáng khi cuộn tới).
- **Tab / thứ tự:** `SECTION_IDS` = overview · location · amenities · gallery · highlights · floorPlans · pricing · legal · policy · listings · faq. Pháp lý + Chính sách = **một tab** ("Pháp lý & chính sách" khi có cả hai; chỉ một → "Pháp lý" / "Chính sách", trỏ khối có mặt) và **một dải** (`LegalPolicy` ≥ xl hai cột như cũ); `#legal`, `#sales-policy`, `#documents` giữ nguyên.
- **Hình ảnh:** khối chỉ hiện khi ≥ 2 ảnh (ảnh 1 đã là nền hero). Mô tả "Hình ảnh thực tế và phối cảnh của {tên}." (design có câu tương tự).
- **Giá từ:** helper thuần `projectPriceFromVnd(doc)` trong `src/lib/projects/project-detail-view.ts` = min `priceTable[].priceFrom` > 0, không có → `priceFromVnd`, không có → `null` ("Liên hệ"); đọc số thô nên `/en` cùng giá. View có thêm `displayPriceFromVnd` (giữ `priceFromVnd` cũ). **P1-T04/T05 gom helper này về chỗ chung của thẻ / danh sách.**
- **Thông số:** Quy mô = `scale.landAreaM2` → ha (`formatHectares`, "36,21 ha"); Diện tích = `formatAreaRange` ("50 – 120 m²"); Loại hình = nhãn `listingOptions.propertyType` theo thứ tự `PROPERTY_TYPES`. Không ô Pháp lý. Icon mới trong `src/components/icons.ts`: Briefcase, Bus, CalendarCheck, FirstAid, GraduationCap, House, ShoppingBag, SquaresFour, Tag, Tree (đã xác minh có trong Phosphor đã cài).
- **Tổng quan:** lưới thông tin 6 ô (Tên thương mại, Chủ đầu tư — **giữ link website** http(s) mở tab mới qua prop mới `link` của `DetailInfoGrid`, Vị trí = khu vực ngắn (rơi về địa chỉ), Quy mô = ha · tổng căn · số tòa · số tầng (giữ thông tin cũ của `ProjectSpecs`), Loại hình, Bàn giao) + thẻ Sản phẩm (`products`; count 0 → không số lớn). ≥ xl hai cột, không sản phẩm → lưới rộng hết.
- **Vị trí:** bản đồ (7 cột) + `DetailDistanceList` (5 cột) từ `nearbyAmenities` gộp theo thứ tự nhóm, icon theo nhóm; dòng không có khoảng cách vẫn hiện tên, không chip (`DetailDistance.distance` thành tuỳ chọn). Địa chỉ đầy đủ là đoạn mô tả dưới `h2`. **Bỏ `NearbyTabs`** (+ test).
- **Tiện ích:** `DetailFeatureList` (ảnh `amenitiesImage`, alt rỗng → tên dự án; 5 mục đầu, "Khám phá tất cả tiện ích"). `icon` tự do của tiện ích vẫn chưa có bảng ánh xạ → dấu tích chung.
- **Hero:** badge danh mục = chip viền sáng chữ hoa; tình trạng trên nền tối dùng `primary` / `success` / **`dark` + viền sáng cho "Đã bàn giao"** (`neutral` mất tương phản trong `theme-dark-block` — residual review P1-T03). Video: `videoUrl` qua `parseVideoUrl` (whitelist) ở view model, khác → không nút.
- **Lệch design / bỏ:** (1) **Bỏ nút Chia sẻ** của khối tiêu đề cũ — design không có, và menu dự phòng của `DetailShareButton` mở xuống dưới sẽ bị `overflow-hidden` của hero + thanh thông số che; `shareUrl` của `ProjectDetail` bỏ theo. (2) Ô "Pháp lý" trong lưới thông tin của design không làm (spec/task không liệt kê). (3) Mô tả dưới `h2` Tiện ích của design không có trường dữ liệu → không có. (4) < lg cột phải xuống ngay sau Tổng quan (trước các dải), CTA dính đáy giữ.
- **Cuối trang:** `SimilarCarousel` (ProjectCard như cũ, "Xem tất cả dự án" → `/du-an`) → `StrengthsBlock` theo `loadProjectStrengths` (cờ `showProjectStrengths` dùng chung `/du-an`) → `ConsultBanner`. Xoá `SimilarProjects.tsx`, `ProjectSpecs.tsx`, `use-project-facts.tsx` (không còn ai dùng). `DetailTitleCard` / `DetailGalleryHero` giữ (Cho thuê / Tin BĐS còn dùng).
- **i18n:** namespace `page.projectDetail.v2` thêm ở cuối `page.projectDetail` (vi + en). Khoá cũ không còn dùng (`page.projectDetail.facts.*` trừ `unitsValue`, `nearby.*`, `specs.scale/area/developer/handover/units/landArea/label/newTab`) để nguyên — dọn ở P3 cho khỏi xung đột merge.
- `DetailSpecBar`: lg 3 cột (từ sm), xl 1 hàng; key `label-index`; `DetailInfoGrid` key `label-index` + `aria-label` tuỳ chọn.

## Verification summary (Builder)
- Worktree DB `tami_wt52_p1t06` (pg_dump `tami` + `pnpm payload migrate`), REDIS_DB 5. Dữ liệu thử nhập TRÊN DB worktree cho `du-an-mau-can-ho-song-sai-gon`: video, 3 loại sản phẩm, 4 sản phẩm (vi/en), mô tả tiện ích, ảnh tiện ích, 6 điểm lân cận, `landAreaM2` 362100, hotline site-settings.
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`) · `pnpm build` PASS.
- `pnpm test` (chạy cùng dev server): 3574 passed / 10 failed — tất cả do môi trường (`too many clients` Postgres + timeout UI khi máy tải nặng). Chạy lại sau khi tắt dev server: unit + ui **314 files / 2954 tests PASS**; integration **54/56 files PASS (723 tests)**, 2 file (`jobs-email`, `media-upload`) chạy riêng lại **25/25 PASS**.
- Test mới/sửa: `project-detail.test.tsx` (bố cục dải/aside, hero, thanh thông số, Tổng quan, Tiện ích, Hình ảnh, dự án tối thiểu, chỉ Chính sách, /en, cuối trang + Điểm mạnh), `project-market-blocks.test.tsx` (thứ tự tab mới, danh sách khoảng cách thay NearbyTabs), `project-detail-view.test.ts` (giá từ, sản phẩm, loại hình, video, ha/khoảng diện tích, khối Hình ảnh ≥ 2 ảnh), `DetailPageShell.test.tsx` (bands), `page.test.tsx` (hotline "Gọi ngay", Xem tất cả dự án, dải Điểm mạnh).
- Trình duyệt (dev `-p 3106`): 1440 VI dự án đầy đủ so `detail-du-an.webp` — hero + 3 ảnh nhỏ + nút video, thanh thông số 1 hàng 6 ô, tab, Tổng quan + cột phải (form + Hotline "Gọi ngay"), dải Vị trí (bản đồ | danh sách khoảng cách), Tiện ích (ảnh | 5 mục + nút), Hình ảnh (1 lớn + 4 nhỏ), Mặt bằng, Pháp lý & chính sách, Dự án tương tự, Điểm mạnh, banner: khớp bố cục; 1 h1, 1 `#lead-form`, không cuộn ngang; scroll-spy sáng "Vị trí" khi cuộn tới dải. 390 EN dự án đầy đủ: nhãn EN, ô thông số 2 cột, không cuộn ngang. 390 VI dự án tối thiểu (1 ảnh, không video/sản phẩm/tiện ích): chỉ tab Tổng quan + Vị trí, khối trống ẩn.
- Residual risk: bản đồ (`LazyMap`) chưa tải trong ảnh chụp (placeholder, hành vi cũ). Dải cuối (trắng) có thể liền nền với "Dự án tương tự" (trắng) tuỳ số dải — chấp nhận. `src/payload-types.ts` hiện `M` chỉ do đổi xuống dòng LF/CRLF (build sinh lại, nội dung không đổi) — primary bỏ qua / không stage.

## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-1-task-06-round-1-review.md` — **STRICT PASS**. MINOR: (1) bỏ nút Chia sẻ trên hero (design không có, menu bị hero che) → ghi as-built spec khi close-out; (2) `ProjectDetail` dài → tách (P3-T06); (3) lặp `ICON_SIZE`/nhãn Loại hình/quy mô ha giữa ProjectDetail + ProjectOverview (P3-T06); (4) key i18n cũ không dùng (P3-T06).

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer STRICT PASS r1. typecheck · lint · build PASS; unit+ui 314 file / 2954 PASS, integration 54/56 (+2 flaky pass riêng); reviewer 21 file / 211 PASS.

## Doc impact
- `.context/design-spec.md` / `docs/DESIGN.md` (khung chi tiết mới, namespace `page.projectDetail.v2`) → P3-T06.
