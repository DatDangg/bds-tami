# bug-listing-detail-design-match · phase-1-task-01 — Chi tiết + danh sách Dự án / Cho thuê / Tin BĐS khớp design (A1, A2, A3, A4, A5, A8)

- Nguồn: BL-056 · change doc `spec/changes/2026-10-22-listing-detail-design-match.md` · scan `tasks/bug-listing-detail-design-match/scan.md`.
- Design: `docs/specs/listing-detail-redesign/detail-du-an.webp`, `list-du-an.webp`.
- Spec gốc: BL-052 (spec 1.46.1 as-built). Không đổi schema, không migration.
- User chốt: gom 1 task A1–A5 + A8; A6 (breadcrumb hero) + A7 (carousel tương tự) giữ nguyên; nhóm B (dữ liệu CMS) ngoài phạm vi.
- **AUTO PROCEED** (user 2026-10-22: "tự làm tự quyết đừng hỏi"): mọi chi tiết thiết kế mơ hồ do change-request tự quyết theo ảnh design — ghi ở § Quyết định.

## Classification / Risk
- Type: **BUG** (UI lệch design đã duyệt BL-052).
- Risk: **MEDIUM** — sửa component dùng chung của khung chi tiết (`DetailSpecBar`, `DetailInfoGrid`, `DetailStatCards`, `DetailFeatureList`), `FormField` + `LeadForm` (form lead dùng ở /lien-he, /tin-tuc, 3 màn chi tiết), 3 thẻ nổi bật danh sách.
- Expected review level: **STRICT** (shared component + form lead).
- Blast radius: `src/components/detail/*`, `src/components/forms/FormField.tsx`, `src/components/leads/LeadForm.tsx`, `src/components/projects/{ProjectOverview,ProjectAmenities,ProjectDetail,ProjectSpotlightContent}.tsx`, `src/components/rentals/{RentalDetail,SaleContactBox,RentalSpotlightContent}.tsx`, `src/components/posts/{PostDetail,PostContactBox,PostSpotlightContent}.tsx`, `src/i18n/messages/{vi,en}.json`, helper rich text mới (+ test).

## Root cause (từ scan, file:line đã có — không cần Explore)
- A1: `src/components/detail/DetailSpecBar.tsx:41` `dd` dùng `break-words`, không giới hạn dòng → giá trị dài ("Chủ đầu tư", "Loại hình") xuống 3–4 dòng; ô `xl:flex-1` chia đều 6 ô nên ô hẹp.
- A8: `src/components/projects/ProjectOverview.tsx:64-68` có `overview` thì render nguyên rich text, bỏ `summary`; `RentalDetail.tsx:91` (`doc.description`) và `PostDetail.tsx:157` (`doc.content`) cũng render nguyên bài → bullet "Thông tin chính" trùng lưới thông tin.
- A2: `ProjectOverview.tsx:69` lưới `xl:grid-cols-2` chia đôi, nhưng `DetailInfoGrid` dùng `auto-fill minmax(13rem)` → trong nửa cột chỉ 1 cột; `DetailStatCards` `auto-fill minmax(8.5rem)` → 2×2.
- A3: `LeadForm.tsx:79-91` dùng `FormField` nhãn trên ô, nút `w-full sm:w-fit` (căn trái từ sm).
- A4: `DetailFeatureList` (ProjectAmenities) khi không ảnh/không mô tả: builder xác nhận nguyên nhân trên trang thật (ô hẹp / chip) trước khi sửa.
- A5: `ProjectSpotlightContent.tsx:56`, `RentalSpotlightContent.tsx:60`, `PostSpotlightContent.tsx:83` dùng `buttonVariants({ variant: "secondary" })` = `border-border` (viền xám nhạt gần như không thấy trên thẻ trắng) + chữ accent → trông như link chữ.

## Quyết định (change-request tự quyết theo design, AUTO PROCEED)
1. **A1** — ≥ xl: `dd` 1 dòng `truncate` + `title={value}` (hover thấy đủ; `dd` vẫn chứa đủ chữ cho trình đọc màn hình). < xl: giữ lưới 2/3 cột, giá trị `line-clamp-2` + `title`, không tràn ngang. Có thể giảm padding trái ô ≥ xl để ô rộng hơn nhưng giữ icon tròn như design.
2. **A8** — component dùng chung mới trong `src/components/detail/` (vd `DetailOverviewIntro`), dùng cho cả 3 màn:
   - Đoạn dẫn = trường tóm tắt nếu có (Dự án `summary`; Tin BĐS `excerpt`; Cho thuê: trường tóm tắt nếu view có, không có thì bỏ qua) — không có thì **đoạn văn (paragraph) đầu tiên có chữ** của rich text đầy đủ (`overview` / `description` / `content`), trích thành text thuần.
   - Nội dung rich text đầy đủ đặt trong **`<details>` / `<summary>` native** (không cần JS, chữ luôn có trong HTML cho SEO). Nhãn nút "Xem thêm" / "Thu gọn" đổi theo trạng thái open bằng CSS (`group-open:`); EN "Read more" / "Show less". Key i18n mới ở namespace `detailKit.overview` (`showMore`, `showLess`).
   - Ẩn nút khi không có rich text, hoặc khi rich text chỉ có đúng đoạn đã dùng làm đoạn dẫn (không có gì thêm).
   - Không có cả tóm tắt lẫn rich text → không hiện đoạn dẫn (giữ như cũ: chỉ lưới thông tin).
   - Tin BĐS: hero đã hiện `excerpt` (P3-T04 ghi trùng) — vẫn theo quyết định user "ưu tiên summary"; chấp nhận trùng, ghi residual.
3. **A2** — Dự án ≥ xl: hai cột ~55/45 (`xl:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]` hoặc tương đương), lưới thông tin **2 cột cố định** (thêm prop `columns` vào `DetailInfoGrid`, mặc định giữ hành vi cũ cho Cho thuê/Tin BĐS); thẻ sản phẩm `xl:grid-cols-3`, hàng cuối lẻ thì ô cuối kéo dài hết hàng (4 ô → 3 + 1 rộng như design). Không sản phẩm → lưới thông tin rộng hết (giữ `xl:col-span-2`, lúc đó lưới có thể 3 cột). < xl: như cũ (xếp dọc).
4. **A3** — `LeadForm` thêm prop `layout?: "default" | "compact"` (mặc định `default` → /lien-he, /tin-tuc **không đổi**). `compact` dùng ở 3 cột liên hệ chi tiết (`ProjectDetail.tsx:241`, `SaleContactBox.tsx:67`, `PostContactBox.tsx:24`):
   - `FormField` thêm prop tuỳ chọn `icon` (đặt trái trong ô, `aria-hidden`) + `labelHidden` (nhãn `sr-only`, vẫn gắn `htmlFor`) + placeholder = nhãn (bắt buộc thêm " *"). Icon: User (họ tên), Phone (SĐT), EnvelopeSimple (email), ChatText/NotePencil (lời nhắn) — lấy từ `@/components/icons` (thêm export nếu thiếu).
   - Nút submit full-width mọi khổ + icon ArrowRight; chữ key mới `form.lead.submitNow` = "Nhận tư vấn ngay" / "Get advice now" (nút uppercase theo token).
   - Validate, thông báo lỗi dưới ô, consent, Turnstile, FormErrorSummary giữ nguyên.
5. **A4** — Không ảnh tiện ích: danh sách rộng hết, lưới `sm:grid-cols-2 lg:grid-cols-3`, mỗi mục icon tròn + tên (+ mô tả nếu có) — không còn chip co trong ô hẹp. Có ảnh: giữ ảnh trái + danh sách phải.
6. **A5** — nút "Nhận tư vấn" trên 3 thẻ nổi bật dùng `variant: "outline"` (viền + chữ màu `text`, như design: viền tối, chữ tối) cạnh "Xem chi tiết". Không đổi variant `secondary` toàn cục.

## Scope
1. Sửa theo § Quyết định A1, A2, A3, A4, A5, A8.
2. Test (vitest): helper trích đoạn đầu rich text (paragraph đầu có chữ, bỏ heading/list, rỗng → null); `DetailOverviewIntro` (ưu tiên tóm tắt, fallback đoạn đầu, có/không nút, nội dung đầy đủ có trong HTML); `DetailSpecBar` có `title` + class 1 dòng; `LeadForm` compact (nhãn sr-only gắn đúng input, placeholder, icon aria-hidden, nút full-width; default giữ nhãn hiển thị); thẻ nổi bật dùng outline. Cập nhật test cũ bị ảnh hưởng.
3. Doc as-built: `.context/design-spec.md` (khung chi tiết BL-052: thanh thông số, Tổng quan, form compact, tiện ích, thẻ nổi bật) + `docs/DESIGN.md` nếu có mô tả tương ứng. Không sửa intent docs.
4. Kiểm trình duyệt: chi tiết Dự án (The Crown + Sun Festo Town), 1 chi tiết Cho thuê, 1 chi tiết Tin BĐS, `/du-an`, `/cho-thue`, `/tin-bds` + bản `/en` × 1440 / 768 / 390: không tràn ngang, 1 `h1`, "Xem thêm" mở/thu được.

## Acceptance (từ change doc)
- [x] A1: ≥ xl mọi ô thanh thông số giữ 1 dòng giá trị (cắt `…` + `title`), thanh không cao hơn ô 1 dòng; mobile/tablet không tràn ngang.
- [x] A8: Tổng quan hiện tóm tắt, không có thì đoạn đầu rich text; có nội dung đầy đủ thì có "Xem thêm"/"Thu gọn" (VI/EN), nội dung đầy đủ có trong HTML; không có nội dung dài thì không có nút.
- [x] A8 áp cho Dự án, Cho thuê, Tin BĐS.
- [x] A2: ≥ xl lưới thông tin 2 cột, thẻ sản phẩm bên phải theo design; không sản phẩm → lưới rộng hết.
- [x] A3: form có icon trong ô + placeholder, nút full-width; nhãn cho trình đọc màn hình; submit/lỗi/captcha như cũ.
- [x] A4: thiếu ảnh tiện ích → danh sách không co trong ô hẹp.
- [x] A5: "NHẬN TƯ VẤN" trên thẻ nổi bật là nút outline ở cả 3 màn danh sách.
- [x] Bằng chứng trình duyệt VI/EN × mobile/tablet/desktop.
- [x] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification
Môi trường: dev server `tami-dev` (port 3000), DB local; đo bằng JS trong trình duyệt + ảnh chụp ở `.context/review-reports/assets/bl-056/` (đường dẫn tương đối từ gốc repo). "Trước" = hành vi theo scan / root cause (code cũ đã thay, không chụp lại); "Sau" = đo sau fix.

| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| A1 thanh thông số | ≥ xl mọi ô 1 dòng giá trị, có title | `dd` `break-words` không giới hạn → "Chủ đầu tư"/"Loại hình" 3–4 dòng, thanh cao | /du-an/the-crown… 1440: 6 `dd` cao 27px (1 dòng), bar 93px; ô dài `clipped` + `title`; Sun Festo 1440 6/6 = 27px; 768 bar 186px, 390 bar 270px (2 cột, tối đa 2 dòng), không tràn ngang (sw ≤ iw) | `du-an-crown-vi-390-hero-specbar.jpg`, `cho-thue-detail-vi-1440-specbar-overview.jpg`, `tin-bds-detail-vi-1440-specbar-overview.jpg` | PASS |
| A8 Tổng quan | Lead = tóm tắt / đoạn đầu; "Xem thêm"/"Thu gọn" mở thu; không có nội dung thêm thì không nút | `overview`/`description`/`content` render cả bài (bullet "Thông tin chính" trùng lưới), bỏ summary | 3 màn × 1440/768/390: có `<details>`, nhãn đổi Xem thêm ⇄ Thu gọn (VI), Read more ⇄ Show less (EN /en/projects/sample-hanoi-central-apartments); Sun Festo lead = summary; Cho thuê/Tin BĐS lead = đoạn đầu/excerpt; round 2: ảnh/bảng không chữ vẫn có nút, lead không lặp trong phần mở rộng, chữ trích không còn khoảng trắng trước dấu câu (test) | `du-an-crown-vi-1440-overview-open.jpg`, `du-an-sunfesto-vi-1440-overview-form.jpg`, `cho-thue-detail-vi-390-overview-form.jpg`, `tin-bds-detail-vi-390-overview-form.jpg`, `en-projects-detail-1440-overview-form.jpg`, `en-projects-detail-390-overview-form.jpg` | PASS |
| A2 bố cục Tổng quan Dự án | ≥ xl lưới thông tin 2 cột + thẻ sản phẩm 3 cột, ô lẻ cuối rộng | Lưới chia đôi nhưng info 1 cột (auto-fill 13rem), stat 2×2 | Crown 1440: info 2 cột (162.8px), stat 3 cột (98.8px) 4 thẻ → 3 + 1 rộng; Sun Festo (không sản phẩm) 3 cột rộng hết; 768: info 2 cột + 4 thẻ 1 hàng; 390: info 1 cột. Số 4–5 ký tự: 1280/1440 đo không tràn (cỡ chữ thu h2-sm/h3, ngắt dòng khi cực đoan) | `du-an-crown-vi-1440-info-stats.jpg`, `du-an-crown-vi-768-overview-info-stats.jpg` | PASS |
| A3 form compact | Icon trong ô, placeholder, nút full-width "Nhận tư vấn ngay"; submit/lỗi như cũ | Nhãn trên ô, nút `w-full sm:w-fit` căn trái | 3 màn chi tiết: placeholder "Họ và tên *"… nút 334/334px (1440), 658/658 (768), 308/308 (390); EN "Get advice now" + placeholder EN; placeholder tương phản 5.33:1 (rgb 107 trên trắng, opacity 1) ≥ 4.5; /lien-he, /tin-tuc giữ default (test) | `du-an-sunfesto-vi-1440-overview-form.jpg`, `en-projects-detail-1440-overview-form.jpg`, `cho-thue-detail-vi-390-overview-form.jpg` | PASS |
| A4 Tiện ích không ảnh | Danh sách rộng hết, không co trong ô hẹp | The Crown: 1 tiện ích không ảnh/không mô tả nằm trong `md:grid-cols-2` → 1 thẻ 602px = nửa bề rộng 1216px | Crown 1440: `ul` 1 cột, thẻ rộng hết (1216px); test `DetailLists`: ≥ 2 mục `sm:2 lg:3`, 1 mục 1 cột, có ảnh không đổi | `du-an-crown-vi-1440-amenities-no-image.jpg` | PASS |
| A5 nút outline thẻ nổi bật | Nút "Nhận tư vấn" có viền tối | `secondary` + `border-transparent` của lớp nền thắng trong CSS (link gọi `buttonVariants` thẳng) → viền vô hình, trông như link chữ. Round 1 chỉ đổi class (viền VẪN transparent: computed rgba(0,0,0,0)) | Sau bọc `cn(...)`: computed `border-top-color` rgb(20,20,20) 1px ở /du-an và /tin-bds (1440); /du-an 5/5 nút outline; /cho-thue không có thẻ nổi bật trong dữ liệu local → chỉ test vitest (class + không `border-transparent`) | `du-an-list-vi-1440-spotlight-outline-after-fix.jpg`, `tin-bds-list-vi-1440-spotlight-outline-after-fix.jpg` | PASS |

EN: `/en/projects` (3 dự án mẫu) và `/en/projects/sample-hanoi-central-apartments` kiểm được; `/en/for-rent`, `/en/property-news` không có tin EN trong DB local → EN của Cho thuê / Tin BĐS chỉ kiểm bằng vitest (locale `en`). Ảnh: `en-projects-list-1440.jpg`.
Status: PASS.

## Verification summary
- Attempt: 2 (r1 STRICT FAIL: M-1 ảnh/block không chữ bị ẩn, M-2 khoảng trắng trước dấu câu, M-3 thiếu repro/bằng chứng + test A4 → fix attempt 2) · r2 STRICT PASS.
- Review: `.context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-1-review.md` (FAIL), `.context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-2-review.md` (PASS).
- Verify (reviewer r2): `pnpm typecheck` PASS · `pnpm lint` 0 lỗi (2 warning cũ tools/task-dashboard) · `pnpm test` 3905/3905 PASS · `pnpm build` PASS.
- Root cause A5 thật (builder r2): spotlight gọi `buttonVariants()` trực tiếp nên `border-transparent` (base) không bị merge với `border-text` → bọc `cn()`.
- Bằng chứng trình duyệt: 15 ảnh `.context/review-reports/assets/bl-056/` (The Crown 1440/768/390, Sun Festo Town 1440, Cho thuê 1440/390, Tin BĐS 1440/390, /du-an + /tin-bds thẻ nổi bật outline 1440, EN /en/projects danh sách + chi tiết 1440/390).
- Spec: 1.46.2 (PATCH as-built) · test-scope v60 (`spec/updates/2026-10-22-listing-detail-design-match.md`).
- Doc impact: `.context/design-spec.md`, `docs/DESIGN.md` (as-built). Không đổi API/schema/migration.
- Residual / follow-up: EN Cho thuê / Tin BĐS + thẻ nổi bật /cho-thue chỉ kiểm bằng vitest (DB local không có dữ liệu); Tin BĐS excerpt hiện ở hero + đoạn dẫn (theo quyết định ưu tiên summary); n-1 upload media đã xoá/không url vẫn tính là nội dung thêm → nút "Xem thêm" có thể mở rỗng; n-2 `buttonVariants` trả chuỗi chưa merge — variant secondary/outline/chip gọi thẳng không qua `cn` sẽ lặp lỗi viền.
