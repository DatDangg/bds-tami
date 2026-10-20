# Spec Update — 2026-10-20 homepage-redesign (trang chủ làm lại bố cục theo mockup mới + footer dùng chung)

> **Trạng thái: done / published — close-out 2026-10-20 (scope v44).** Pre-build phát hành ở scope v43 (plan duyệt). Build xong 5 task T00–T04, mọi reviewer PASS; phase review `.context/review-reports/spec-validation-feature-homepage-redesign-phase-1-round-2.md` PASS (0 CRITICAL / 0 MAJOR). Close-out bump PATCH **1.34.0 → 1.34.1**: ghi as-built phần trình bày (S1–S5 + N2 của phase review), không đổi business rule / intent.

**spec_version:** 1.33.0 → 1.34.0 (pre-build) → **1.34.1** (close-out, PATCH — xem § Close-out). 1.34.0: (MINOR — MODIFY bố cục F1 Trang chủ + footer dùng chung (Khung trang) + ADDITIVE F3 trường `amenities` tin cho thuê + tham số lọc `amenities` cho `/cho-thue` và `GET /api/public/rentals` + schema additive global `homepage`; không đổi quyền, cache tag, schema `footer` / `site-settings`)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-044**, MODIFY). Change doc `spec/changes/2026-10-20-homepage-redesign.md` (archive ở close-out → `spec/changes/archive/2026-10-20-homepage-redesign.md`). Mockup: `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp` (desktop 1440; không có mockup mobile). Task `tasks/feature-homepage-redesign/phase-1-task-00..03.md` (plan đã duyệt).

**Quyết định (chốt với user 2026-10-20):**
- D1 **Icon tim** trên thẻ Dự án nổi bật: chỉ trang trí — vẽ như mockup, `aria-hidden`, không state, bấm không làm gì.
- D2 **"Tùy chọn khác"** (hàng 3 ô tìm kiếm, tab Cho thuê): **lọc thật** — ô chọn lấy giá trị từ bộ lọc của `/cho-thue` (Mức giá → `priceMin`/`priceMax`, Diện tích → `areaMin`/`areaMax`, Loại căn hộ → `category`, Nội thất → `furnishing`, Tiện ích → `amenities` mới); bấm Tìm kiếm → GET `/cho-thue` kèm query qua `rentalListQueryString`. Tab Dự án giữ nguyên.
- D3 **Nút play "Khám phá TAMI HOMES"**: mở video YouTube trong Dialog (`ui/dialog` sẵn có, iframe `youtube-nocookie.com/embed/<id>?autoplay=1`, chỉ tải khi mở); link admin nhập ở `about.videoUrl`; không link / link không hợp lệ → ẩn nút.
- D4 **Khối ngoài mockup** (Dịch vụ, Ưu đãi nổi bật, Cho thuê, Tin tức, Đối tác): tắt trên trang chủ bằng admin (`enabled` = tắt hoặc bỏ khỏi "Thứ tự khối"), **không xoá code/dữ liệu**, bật lại được; `blockOrder` mặc định bản ghi mới chỉ gồm khối trong mockup.
- D5 **Mobile (390)**: không có mockup riêng — xếp dọc giữ phong cách desktop.
- D6 **Giữ** màu, design tokens, font Montserrat, element sẵn có (Button, chip, Badge, Input, OptionSelect, mũi tên/chấm slider, icon Phosphor); không thêm màu/kiểu mới (`no-raw-colors.test` là gate).
- **Q1 (chốt):** ô thứ 5 "Tùy chọn khác" = **Tiện ích, lọc thật** — `/cho-thue` chưa có bộ lọc này → thêm **task T00** (ADDITIVE, F3): collection `rentals` thêm field `amenities` (select hasMany, index, danh sách cố định `RENTAL_AMENITIES` 10 giá trị: `pool`, `gym`, `elevator`, `parking`, `security`, `balcony`, `washing_machine`, `air_conditioner`, `pet_friendly`, `kitchen`; khác `rentalTerms.includedServices`), migration additive riêng, tham số **mới** `amenities` (nhiều giá trị phẩy, giá trị lạ bị bỏ, **AND**) cho `/cho-thue` + trang danh mục/khu vực + `GET /api/public/rentals`; chip chọn nhiều trong lọc phụ "Bộ lọc" (tính badge), `ActiveFilters` bỏ từng tiện ích, hàng "Tiện ích" ở chi tiết tin (`RentalSpecs`, trống → ẩn); seed dev `pnpm seed:rental-amenities` (idempotent, **từ chối chạy** staging/prod). Trang chủ chọn 1 tiện ích → `/cho-thue?amenities=<key>`.
- **Q2 (chốt):** footer **không có cột Liên hệ** — chỉ 2 cột link như mockup; hotline/email/địa chỉ vẫn ở `site-settings`, hiện ở nút liên hệ nổi + trang Liên hệ (bỏ `FooterContact`).
- **Q3 (chốt):** hàng "Tùy chọn khác" **không có mũi tên xổ** ở cuối hàng (không còn bộ lọc nào khác).
- **Q4 (chốt):** `hero.eyebrow` / `hero.caption` là chữ **chung cho mọi slide** (không theo từng slide).

## Task đã làm (1 phase, 5 task tuần tự T00 → T01 → T02 → T03 → T04)

| Task | Loại | Nội dung | Trạng thái · commit · review |
|---|---|---|---|
| P1-T00 | ADDITIVE + schema additive (F3, API) | Tin cho thuê: `rentals.amenities` (`RENTAL_AMENITIES` 10 giá trị, `src/collections/Rentals.ts` + `src/shared/types/api.ts`) + migration `rentals_amenities` + tham số `amenities` (`url-params`, `rental-search-sql` AND qua `EXISTS`, `rentalSearchParamsSchema`) + chip chọn nhiều ở lọc phụ (`FilterFields`, `use-rental-draft`) + `ActiveFilters` + hàng Tiện ích `RentalSpecs` + i18n vi/en + seed dev `scripts/seed-rental-amenities.ts` + tests; doc reconcile `docs/API_SPEC.md`, `docs/ERD.md`. Migration `20261020_095907_rentals_amenities` | **done** · `3a5fffe` · STRICT PASS r2 — `.context/review-reports/feature-homepage-redesign-phase-1-task-00-round-2-review.md` (r1: `…-task-00-round-1-review.md`) |
| P1-T01 | MODIFY + schema additive | Schema global `homepage` (field mới, `HOMEPAGE_BLOCKS` + `strengths`) + migration versioned + view model (`home-view`, `home-queries`, `load-home`) + **Hero** chữ trái / bộ đếm / thanh tiến trình / chú thích + **ô tìm kiếm** (kính lúp trong ô, chip gọn 1 hàng + nút mở, hàng "Tùy chọn khác") + **khối Điểm mạnh** (`StrengthsBlock`, mới). Migration `20261020_103248_homepage_redesign` | **done** · `aa5a178` · STRICT PASS r2 — `.context/review-reports/feature-homepage-redesign-phase-1-task-01-round-2-review.md` (r1 FAIL: integration không có DB; r2 chạy DB thật) |
| P1-T02 | MODIFY | **Về TAMI** cụm ảnh chồng + thẻ chú thích + nút play Dialog YouTube + số liệu có icon + nút CTA + ảnh trang trí; **thẻ Dự án nổi bật** nền trắng ảnh 11:10 (as-built) + tim trang trí + ghim + nút mũi tên, điều khiển giữa dưới, eyebrow + mô tả đầu khối; **banner tư vấn** chữ trái (`layout/CtaBanner` prop `align`) | **done** · `1271db9` · STRICT PASS r1 — `.context/review-reports/feature-homepage-redesign-phase-1-task-02-round-1-review.md` |
| P1-T03 | MODIFY | **Footer dùng chung** theo mockup (cột trái logo + mô tả + mạng xã hội, cột link, hàng cuối) + tắt khối ngoài mockup (hướng dẫn admin, `blockOrder` mặc định) + **mobile 390** + so khớp mockup 1440 / 390 (chụp màn hình đặt cạnh mockup) + doc reconcile (`SPECIFICATIONS.md`, `.context/design-spec.md`, `docs/ERD.md`, `docs/DESIGN.md`). As-built thêm: footer bỏ cột Liên hệ (`FooterContact`), mạng xã hội ô tròn ở footer, trang Liên hệ giữ kiểu plain; `layout/CtaBanner` prop `size="compact"` (trang chủ); seed dev `seed/sample/homepage.ts` `blockOrder` theo mockup | **done** · `d01f1f7` · STRICT PASS r2 — `.context/review-reports/feature-homepage-redesign-phase-1-task-03-round-2-review.md` (r1: `…-task-03-round-1-review.md`) |
| P1-T04 | MODIFY (đóng gap phase review r1 G-M1 + D1) | **Về TAMI** chữ mặc định i18n: `about.eyebrow` trống → "Về chúng tôi" / "About us"; `about.videoLabel` trống → "Khám phá TAMI HOMES" / "Discover TAMI HOMES" (nút play chỉ phụ thuộc `videoUrl` hợp lệ); mô tả admin `Homepage.ts` khớp hành vi; khoảng Về TAMI → Dự án nổi bật (`pb-6` + `pt-4` khi liền sau, ≈ 40px vs ~42px mockup); `docs/ERD.md` §4.15 đủ field | **done** · `5e8645b` · NORMAL PASS r1 — `.context/review-reports/feature-homepage-redesign-phase-1-task-04-round-1-review.md` |

Phase review: `.context/review-reports/spec-validation-feature-homepage-redesign-phase-1.md` (r1 FAIL — G-M1 MAJOR) → `.context/review-reports/spec-validation-feature-homepage-redesign-phase-1-round-2.md` (**PASS**).

## Requirements (SPECIFICATIONS.md)

- **F1 Trang chủ (FR-PUB-01) — khối "Bố cục theo mockup mới (BL-044)" (MỚI/ĐỔI):** thứ tự khối Hero → ô tìm kiếm → Điểm mạnh → Về TAMI → Dự án nổi bật → Banner tư vấn → Footer; bố cục/vị trí/tỉ lệ đúng mockup, màu/token/font/element giữ nguyên.
  - **Hero (ĐỔI):** chữ canh trái trong khung 84rem: `hero.eyebrow` → `title` + `titleAccent` (vàng) → `subtitle` → nút Primary + mũi tên; góc dưới trái bộ đếm `01 / 03` + thanh tiến trình (đoạn bấm được, `aria-label`) **thay chấm giữa**; nút Dừng/Phát cạnh bộ đếm; mũi tên tròn 44–48px hai mép; góc dưới phải `hero.caption` + nút cuộn xuống. 1 slide: `01 / 01`, không thanh, không autoplay. `100svh`, ảnh/video/scrim/autoplay/vuốt/phím như BL-020.
  - **Ô tìm kiếm (ĐỔI):** icon kính lúp trong ô nhập + nút Primary "Tìm kiếm" + mũi tên; chip "Dự án được quan tâm" gọn 1 hàng + nút tròn mở (`aria-expanded`); hàng 3 "Tùy chọn khác" (tab Cho thuê) theo D2 — 5 ô: Mức giá · Diện tích · Loại căn hộ · Nội thất · **Tiện ích** (chọn 1 → `amenities=<key>`), **không mũi tên xổ cuối hàng** (Q3); không JS gửi `q` + ô đơn trị (`category`, `furnishing`, `amenities`), mốc giá/diện tích cần JS; "Tất cả" = rỗng không lên URL; danh mục cho thuê server nạp, `/en` chỉ danh mục có EN. `hero.eyebrow` / `hero.caption` chung mọi slide (Q4).
- **F3 Cho thuê (FR-PUB-04) — Tiện ích (MỚI, BL-044 Q1):** tin cho thuê thêm trường `amenities` (select nhiều giá trị, `RENTAL_AMENITIES` 10 giá trị có nhãn VI/EN qua i18n, tuỳ chọn, index; khác `rentalTerms.includedServices`) — admin nhập ở nhóm thông số căn hộ; chi tiết tin hiện hàng "Tiện ích" trong `RentalSpecs` (trống → ẩn). Bộ lọc `/cho-thue` (+ danh mục / khu vực, `GET /api/public/rentals` đếm/tìm): tham số `amenities` (nhiều giá trị phân cách phẩy, giá trị ngoài danh sách bị bỏ, **AND**), trong lọc phụ "Bộ lọc" chip chọn nhiều, tính badge + chip "đang lọc" (`ActiveFilters`, bỏ từng tiện ích). Dữ liệu mẫu chỉ seed DB dev (`pnpm seed:rental-amenities`). Bộ lọc p95 ≤ 500ms.
- **API `GET /api/public/rentals` (ĐỔI, additive):** nhận thêm `amenities` (chuỗi phẩy hoặc mảng; `rentalSearchParamsSchema` enum `RENTAL_AMENITIES`); không truyền → hành vi cũ. Doc: `docs/API_SPEC.md`.
  - **Điểm mạnh (MỚI, `strengths`):** dải 4 mục (≥ lg 4 cột; md 2×2; < md 1 cột) dưới ô tìm kiếm, nền `--color-bg`; mỗi mục icon tròn 56px nền `--color-primary-soft`, icon `--color-accent-text` (as-built 1.34.1; icon Phosphor từ danh sách cố định `map-pin`, `buildings`, `headset`, `file-check`, `shield-check`, `clock`, `users`, `star`) + tiêu đề `--text-h4` 600 + mô tả `--text-small` muted; admin `strengths.enabled`, `items` 2–6; không `h2`, vùng `aria-label` i18n; `/en` bỏ mục thiếu `title` EN, < 2 mục → ẩn khối; bản ghi có sẵn admin tự thêm vào "Thứ tự khối".
  - **Về TAMI (ĐỔI):** nền khối `--color-primary-subtle`; ≥ lg 2 cột — trái cụm ảnh chồng (as-built 1.34.1: `image` **vuông** ~66% cột, canh phải cụm, < lg 4:3; `secondaryImage` vuông ~36% mép trái phía trên; mảng nền be `--color-primary-soft` lệch sau ảnh phụ, trang trí ≥ lg; thẻ chú thích trắng `imageCaption` **dưới ảnh phụ ở mép trái cụm** + nút tròn trang trí; nút play theo D3; thiếu `image` → ẩn cả cụm gồm nút play); phải `eyebrow` (trống → i18n "Về chúng tôi") → `h2` `title` + `titleAccent` `--color-accent-text` → `content` → số liệu có icon (`stats[].icon` trong ô tròn `--color-primary-soft` icon `--color-accent-text`, `value` `--text-h2`, `label` muted, 2 cột) → nút Primary `ctaLabel`/`ctaLink` (thiếu → ẩn); `decorImage` chỉ ≥ xl `aria-hidden`. < lg xếp dọc. Khoảng cách (T04): Về TAMI `pt-section pb-6`; Dự án nổi bật liền sau thu `pt-4` (≈ 40px ở 1440). Thay bố cục 5/7 của BL-020.
  - **Dự án nổi bật (ĐỔI):** đầu khối căn giữa `featuredProjects.eyebrow` → `h2` (gạch ngắn) → `description`; thẻ trắng bo 20px viền `--color-border`, ảnh 11:10 (as-built 1.34.1; badge trạng thái trên trái, **tim trang trí** trên phải), phần thông tin nền trắng: tên `--text-h4` 2 dòng (giữ chỗ 2 dòng, BL-037) + ghim + tỉnh + nút tròn mũi tên trang trí; **bỏ** kính mờ + số liệu `scale.*`; ≈ 5 thẻ/khung 1440 (~272px ≥ lg, 82% < sm); cả thẻ là link, hover BL-034; điều khiển mũi tên + chấm **giữa phía dưới** (cơ chế BL-038) → nút ghost "Xem tất cả dự án"; đệm dưới khối `pb-10`.
  - **Banner tư vấn (ĐỔI):** chữ canh trái trong khung 84rem; `layout/CtaBanner` thêm prop `align` (`center` mặc định — S14 dịch vụ giữ; trang chủ `start`) + prop `size` (as-built 1.34.1: `compact` ở trang chủ = dải thấp `min-h-[18rem] py-10` ≈ 290px ở 1440, nút chính có `ArrowRight`; `default` cho dịch vụ / chi tiết dự án không đổi); nội dung/scrim/AA như BL-020.
  - **Khối ngoài mockup:** theo D4. **Mobile:** theo D5.
- **Khung trang — Footer (ĐỔI, dùng chung toàn site):** nền tối `--color-dark`; ≥ md lưới: cột trái rộng (logo trắng → `footer.contactBlock` → hàng icon mạng xã hội `site-settings.socialLinks` ô tròn viền `--color-dark-border`, icon 20px, vùng chạm 44px) · cột link `footer.columns` (tiêu đề `--text-eyebrow` vàng `--color-on-dark-accent` viết hoa giãn chữ) · **không có cột Liên hệ** (Q2; bỏ `FooterContact`, hotline/email/địa chỉ vẫn ở nút liên hệ nổi + trang Liên hệ); hàng cuối kẻ trên: bản quyền trái · phải `VI | EN` + "Cài đặt cookie" (khi có). Nút lên đầu trang = `BackToTop` sẵn có (BL-035), không dựng nút thứ hai. Mạng xã hội rời hàng cuối lên cột trái. < md cột trái xếp dọc, cột link accordion như cũ.
- Design as-built: `.context/design-spec.md` §2.1 / §2.2 / §2.4 + S01 (cập nhật ở T03).

## Schema / Migration / API

- **Collection `rentals` — additive, migration versioned thứ nhất (`rentals_amenities`, T00), không destructive:** field `amenities` select hasMany (enum `RENTAL_AMENITIES`, bảng `rentals_amenities` do Payload sinh), index; `searchText` không đổi. Inspect migration chỉ CREATE TABLE/TYPE/INDEX; destructive → dừng + `HIGH_RISK_MIGRATION`.
- **Global `homepage` — additive, migration versioned thứ hai `20261020_103248_homepage_redesign` (T01; thứ nhất là `20261020_095907_rentals_amenities`), không destructive:** `hero.eyebrow` (localized), `hero.caption` (localized), `hero.slides[].titleAccent` (localized), `strengths{enabled, items[]{icon, title (localized, bắt buộc), description (localized)}}`, `about.{eyebrow, titleAccent, secondaryImage (upload media), imageCaption (textarea localized), videoUrl (validate YouTube server), videoLabel (localized), ctaLabel (localized), ctaLink (navLinkField), decorImage (upload media)}`, `about.stats[].icon`, `featuredProjects.{eyebrow, description}`; `HOMEPAGE_BLOCKS` thêm `strengths`. Mọi field mới tuỳ chọn → bản ghi có sẵn không cần data migration.
- Global `footer` / `site-settings`: **không đổi schema** (mô tả footer = `footer.contactBlock`, mạng xã hội = `site-settings.socialLinks`).
- API: `GET /api/public/rentals` nhận thêm tham số `amenities` (additive, zod enum; không truyền → như cũ). Không endpoint mới, không đổi quyền / cache tag. URL: `/cho-thue` (+ danh mục / khu vực) thêm tham số `amenities` (chuỗi phẩy; form không JS gửi `amenities=a&amenities=b` → parser nhận cả hai dạng).
- i18n: thêm key chuỗi giao diện mới (nhãn "Tìm kiếm", "Tùy chọn khác", nhãn ô chọn, "Về chúng tôi", "Khám phá TAMI HOMES", `aria-label` Điểm mạnh, bộ đếm/thanh tiến trình; `page.rentals.fields.amenities`, `page.rentals.amenityOption.<key>` ×10, `page.rentals.detail.amenities`) ở `src/i18n/messages/{vi,en}.json`.
- Seed dev: `scripts/seed-rental-amenities.ts` + script `pnpm seed:rental-amenities` — gán 2–5 tiện ích ổn định theo hash id cho tin chưa có; idempotent; từ chối chạy khi `NODE_ENV=production` hoặc `DATABASE_URL` khớp staging/prod. Không commit dữ liệu.

## Hành vi bị thay thế

| Trước (BL-020 P2) | Sau (BL-044) |
|---|---|
| Hero chữ căn giữa; chấm phân trang ở giữa đáy | Chữ canh trái (eyebrow + title + `titleAccent` + mô tả + nút); bộ đếm `01 / 03` + thanh tiến trình góc dưới trái; chú thích + nút cuộn góc dưới phải |
| Ô tìm kiếm: ô nhập thường + nút; chip nhiều hàng | Kính lúp trong ô + nút "Tìm kiếm" mũi tên; chip 1 hàng + nút mở; hàng "Tùy chọn khác" 5 ô lọc thật, không mũi tên xổ (tab Cho thuê) |
| `/cho-thue` không có bộ lọc Tiện ích; tin cho thuê không có trường `amenities`; API không nhận `amenities` | Trường `amenities` (10 giá trị) + chip chọn nhiều trong "Bộ lọc" + `ActiveFilters` + hàng Tiện ích chi tiết tin; tham số `amenities` AND trên URL + API |
| Footer có cột Liên hệ (`FooterContact`, < md luôn mở) | Không cột Liên hệ; chỉ cột trái + 2 cột link |
| Không có khối Điểm mạnh | Khối `strengths` 4 mục icon tròn ngay dưới ô tìm kiếm |
| Thẻ dự án 464×600 kính mờ + hàng số liệu `scale.*` | Thẻ trắng ảnh 11:10 + tim trang trí + ghim + nút mũi tên tròn, không số liệu; ≈ 5 thẻ/khung |
| Về TAMI bố cục 5/7, một hàng chữ số liệu không icon | 2 cột: cụm ảnh chồng + thẻ chú thích + nút play video Dialog; số liệu có icon; nút CTA; ảnh trang trí mép phải |
| Banner tư vấn CTA căn giữa, cao như các trang khác | Chữ canh trái, dải thấp ~290px + nút có mũi tên (`align="start"` + `size="compact"`); S14 dịch vụ giữ căn giữa + cỡ mặc định |
| Footer: mạng xã hội ở hàng cuối | Mạng xã hội trong cột trái (logo + mô tả + icon); hàng cuối chỉ bản quyền + `VI \| EN` + cookie |
| Trang chủ hiện khối Dịch vụ / Ưu đãi / Cho thuê / Tin tức | Tắt bằng admin, code/dữ liệu giữ, bật lại được |

## Số đo / verify

- `pnpm test` full suite (DB thật Postgres + Redis): T00 r2 301 files / 3166 PASS; T01 r2 302 / 3187 PASS (gồm `tests/integration/homepage-migration.test.ts` up/down có dòng `strengths`); T02 304 / 3195 PASS; T03 r1 305 / 3200 PASS (r2 304/305 — `media-upload` timeout hạ tầng, chạy riêng 20/20 PASS); T04 **305 files / 3205 tests PASS**.
- `pnpm typecheck` PASS, `pnpm lint` 0 error (T04); `pnpm build` builder báo PASS (reviewer không chạy lại — residual).
- `no-raw-colors.test` + contrast test nằm trong `pnpm test` PASS — không hex mới; đúng 1 `h1`; AA.
- So khớp mockup 1440 / 390 bằng ảnh chụp ở T03/T04 (`.context/review-reports/assets/`); khoảng Về TAMI → Dự án ≈ 40px vs ~42px mockup.

## Close-out (1.34.1 PATCH, scope v44)

Lý do bump PATCH: `SPECIFICATIONS.md` đổi chữ (làm rõ as-built trình bày theo quyết định user đã chốt, không thêm/sửa/xoá requirement hay business rule) → theo `.agent/spec-publish.md` "PATCH làm rõ" (tiền lệ 1.4.1). Cụ thể (phase review r2 S1–S5 + N2):
- S1 Điểm mạnh + số liệu Về TAMI: ô tròn `--color-primary-soft` + icon `--color-accent-text` (thay `primary-subtle` / `accent-display`).
- S2 Banner tư vấn trang chủ `CtaBanner size="compact"` (dải thấp ~290px, nút có mũi tên) + Dự án nổi bật `pb-10`.
- S3 + N2 Về TAMI as-built: ảnh lớn vuông ≥ lg / 4:3 nhỏ hơn, thẻ chú thích dưới ảnh phụ, mảng nền be `primary-soft` sau ảnh phụ, nền khối `primary-subtle`, thiếu ảnh lớn → ẩn cả cụm gồm nút play; spacing `pb-6` + `pt-4` khi Dự án nổi bật liền sau.
- S4 Ảnh thẻ Dự án nổi bật 11:10.
- S5 Bỏ "cột Liên hệ luôn mở" (Khung trang) và "Footer liên hệ" (F1) cho khớp Q2.
- Câu "design-spec S01 … bị thay cho tới khi reconcile" đổi thành đã reconcile (T03/T04).

Change doc `spec/changes/2026-10-20-homepage-redesign.md` archive do dispatcher làm cùng close-out commit.

## Lệch mockup còn chờ user (không chặn, phase review r2 U1–U5)

| # | Lệch | Trạng thái |
|---|---|---|
| U1 | Hero `100svh` cao hơn mockup | Chờ user quyết |
| U2 | Bộ đếm hero canh mép chữ (khung 84rem); mockup sát mép trái ảnh | Chờ user quyết |
| U3 | Hoa văn sóng nền footer + hoạ tiết mờ nền Về TAMI chưa dựng (cần asset / pattern) | Chờ user quyết |
| U4 | Khoảng mép nền kem → eyebrow Dự án nổi bật ~23px vs ~44px mockup (khoảng Về TAMI → Dự án tổng đã ≈ 40px vs ~42px) | Chờ user xác nhận chấp nhận |
| U5 | `blockOrder` bản ghi trang chủ staging/prod: không data migration — admin tự thêm `strengths` + tắt Dịch vụ / Ưu đãi / Cho thuê / Tin tức theo hướng dẫn 3 dòng ở `tasks/feature-homepage-redesign/phase-1-task-03.md` | Admin thực hiện sau deploy |

## Ảnh hưởng test

- Direct: trang chủ `/` và `/en` mọi khối (hero, ô tìm kiếm + "Tùy chọn khác" 5 ô, Điểm mạnh, Về TAMI + Dialog video, Dự án nổi bật, banner tư vấn); admin global `homepage` field mới + "Thứ tự khối" có `strengths`; **`/cho-thue` (+ danh mục / khu vực, vi/en) lọc Tiện ích AND** — chip chọn nhiều trong "Bộ lọc", badge đếm, `ActiveFilters` bỏ từng tiện ích, URL `amenities=a,b`; **`GET /api/public/rentals?amenities=`** đếm/tìm; **chi tiết tin cho thuê** hàng "Tiện ích"; admin Tin cho thuê ô "Tiện ích".
- Dependents: footer **mọi trang công khai** (không còn cột Liên hệ); `layout/CtaBanner` ở S14 dịch vụ (phải giữ căn giữa); `useSnapSlider` (BL-038) cho thẻ mới; `BackToTop` (BL-035) không trùng nút footer; `rental-search-sql` / `search-service` dùng chung cho danh sách + API đếm; `url-params` (`QUERY_KEYS`, `activeFilterCount`, `rentalListQueryString`) dùng chung lọc / phân trang / canonical.
- Regression: `/cho-thue` nhận đúng query từ trang chủ (có / không JS); không truyền `amenities` → kết quả, đếm, badge, phân trang, canonical như cũ; `amenities` giá trị lạ bị bỏ; form tìm kiếm gửi được khi không JS; tab Dự án `/du-an?province=&status=`; thanh thông báo trang chủ; đúng 1 `h1`; AA; `/en` ẩn phần tử thiếu chữ EN (BR-07); khối tắt không render; 2 migration additive chạy sạch trên DB có dữ liệu; `searchText` / reindex không đổi; seed dev từ chối staging/prod.
- Residual: không có mockup mobile — reviewer so phong cách, không so pixel; tiện ích thật chưa có dữ liệu (seed dev chỉ để so khớp).
