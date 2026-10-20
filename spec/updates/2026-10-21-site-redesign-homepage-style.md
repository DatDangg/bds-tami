# Spec Update — 2026-10-21 site-redesign-homepage-style (các trang còn lại theo phong cách trang chủ mới)

> **Trạng thái: done — published 2026-10-21 (spec 1.35.0 / scope v45).** Plan đã duyệt 2026-10-21 (user chốt Q1–Q9 theo đề xuất). Build xong 10 task T00–T09 trên `staging`, mọi reviewer STRICT PASS (bảng "Kết quả build" bên dưới). Phase review r1 GAPS FOUND: GAP-1 / GAP-2 sửa code ở T09; GAP-3 sổ sách dọn ở close-out này; GAP-4 `pnpm build` cuối là residual (dispatcher chạy trước commit close-out). Phase review r2 do dispatcher chạy sau publish.
> **Không bump thêm:** as-built AB-1..AB-8 chỉ làm rõ trình bày (không đổi business rule) và được ghi trước khi 1.35.0 commit lần đầu → không cần PATCH. Scope v45 "planned" chưa từng commit / bàn giao cho test (khác tiền lệ BL-044 v43 đã commit) nên publish đúng số v45, không ghi đè số đã phát hành.

**spec_version:** 1.34.1 → **1.35.0** (MINOR — MODIFY bố cục toàn site theo trang chủ BL-044 + ADDITIVE tham số lọc `/du-an` `q` / `developer` / `sort` + ADDITIVE field admin `site-settings`: `pageBanners.contact` / `legal`, `pageHeroes` (chữ hero localized 6 trang), `careersPerks`, cờ `showProjectStrengths`; REMOVE icon tim trang chủ (đảo BL-044 Q1)). Không đổi quyền, endpoint REST công khai, schema lead.

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-045**, MODIFY). Change doc `spec/changes/2026-10-21-site-redesign-homepage-style.md`. Mockup đã duyệt `docs/specs/site-redesign-mockup/index.html` (9 view) + `docs/specs/site-redesign-mockup/DECISIONS.md` #1–#6. Task `tasks/feature-site-redesign-homepage-style/phase-1-task-00..09.md`.

## Requirements

**THÊM / SỬA** — khối mới trong `SPECIFICATIONS.md` § Overview: "**Giao diện toàn site theo phong cách trang chủ mới (BL-045 …)**":
- Breadcrumb trên ảnh (DECISIONS #1): khung bo tròn chỉ bao chữ, nền `--color-primary-deep` 13%, token mới `--blur-breadcrumb` 4px, chữ trắng + bóng, ngăn `›`; AA đo trên ảnh sáng thật, thiếu → scrim token. Trang không ảnh (Bài viết): breadcrumb trơn. JSON-LD `BreadcrumbList` giữ.
- Hero trang con 2 cỡ cố định (danh sách 440/360px, thấp 340/280px), chữ canh trái eyebrow → `h1` 2 dòng (dòng 2 vàng) → mô tả; ảnh + chữ hero sửa trong admin (có EN), fallback i18n / ảnh mặc định / nền tối.
- Trang danh sách Dự án / Cho thuê / danh mục Cho thuê: thẻ lọc trắng nổi đè hero (3 hàng như ô tìm kiếm trang chủ), hàng "N kết quả" + sắp xếp, lưới thẻ kiểu "Dự án nổi bật", phân trang mũi tên tròn, banner tư vấn; Cho thuê giữ đủ lọc F3 (hàng 3: tỉnh · mức giá · diện tích · phòng ngủ · nội thất · tiện ích nhiều; "Bộ lọc" chỉ còn phường + khoảng tự nhập); `/du-an` thêm dải Điểm mạnh (cờ `showProjectStrengths`).
- **ADDITIVE F2 (Q1):** `/du-an` thêm `q` (≤ 100 ký tự, khớp không dấu tên + địa chỉ / tỉnh / phường), `developer` (id chủ đầu tư; lạ → bỏ qua), `sort` (`newest` mặc định không lên URL · `price_asc` · `price_desc`, `priceFromVnd` trống xếp cuối); có lọc → `noindex, follow` + canonical `/du-an`; không cột / migration mới; p95 ≤ 500ms. Thay câu F2 "không ô từ khoá vì danh sách dự án không có `q`".
- Thẻ dùng chung (Dự án / Cho thuê / tin), **bỏ icon tim ở mọi màn kể cả trang chủ** (DECISIONS #2 — thay BL-044 Q1).
- Chi tiết Dự án / Cho thuê / Đăng tin BĐS (Q4): ảnh lớn kiểu hero `min(78vh, 640px)` + bộ đếm / thanh tiến trình / ảnh nhỏ / "Xem tất cả ảnh" / "Video"; khối tiêu đề trắng nổi có dải thông số icon (DECISIONS #5); mỗi mục là thẻ trắng (eyebrow + `h2`); danh sách mục Q7 (Dự án bỏ "Thư viện", không "Tiến độ"); slider "tương tự" canh trái nền trắng (DECISIONS #6); CTA cuối chi tiết dự án = banner tư vấn → `#lead-form` + nút `tel:` (Q8); chi tiết cho thuê không thêm ô "Ngày muốn xem" (Q6).
- Tin tức + Đăng tin BĐS danh sách: hero thấp → chip danh mục → bài nổi bật ngang → lưới → phân trang → banner; **Q2** trang 1 `/tin-tuc` bỏ hàng theo danh mục cấp 1 + "Tin khác", giữ form "Tư vấn nhu cầu" cuối trang `/tin-tuc`.
- Bài viết: rời `DetailLayout`, header thường, `h1` canh trái, cột phải "Bài viết mới" + thẻ tư vấn tối dính; **Q3** bỏ mục lục dính trái BL-033, giữ khối thu gọn đầu bài.
- Tuyển dụng (danh sách + chi tiết Q5): hero thấp, dải ý `careersPerks` (Q9, 2–6 mục, `/en` bỏ mục thiếu title EN, < 2 → ẩn), thẻ hàng vị trí + "Ứng tuyển", giữ bộ lọc hiện có (lệch mockup).
- Liên hệ (giữ trường lead), Chính sách / Điều khoản (mục lục dính trái + thẻ trắng), Dịch vụ (Q5: hero thấp + cột phải thẻ tư vấn, không thêm form).
- Banner tư vấn + footer dùng chung (BL-044) cuối mọi trang trừ Liên hệ / Chính sách; nội dung từ `homepage.ctaBanner` không phụ thuộc `enabled`.

**SỬA** — F1 thẻ Dự án nổi bật: "không có icon tim" (đã ghi trong spec trước publish).

**SỬA** — FR-ADM-20: nhóm đổi nhãn "Ảnh banner trang con", thêm ảnh Liên hệ + Pháp lý (không localized); thêm `pageHeroes` (localized), `careersPerks`, `showProjectStrengths`. Schema additive, migration versioned (T01).

**Đánh dấu đoạn cũ "(bố cục thay bởi BL-045)"** (nội dung yêu cầu khác không đổi): Overview Giao diện (banner 240px; "dùng chung một bố cục" chi tiết; băng tìm kiếm Cho thuê) · F2 bố cục `/du-an` + câu "không ô từ khoá" + bố cục chi tiết S03 · F3 bố cục danh sách + bố cục chi tiết BL-027 · F4 danh sách `/tin-bds`, "Đồng bộ danh sách (BL-032)", "Chi tiết bài (BL-032)" · F5 bố cục danh sách, "Trang 1 `/tin-tuc`" (Q2), chi tiết tin BL-033 (Q3) · F6 · F7 · FR-ADM-20. Bảng Câu hỏi mở: dòng BL-045-Q1..Q9 đã chốt.

## Ảnh hưởng
- Module: `src/components/{layout,templates,detail,home,projects,rentals,news,posts,careers,contact,legal,listing}`, `src/lib/projects` (lọc `/du-an`), `src/lib/content` (hero), `src/globals/SiteSettings.ts` + migration additive, `globals.css` (token breadcrumb), i18n vi/en, seed dev.
- Test luồng: mọi trang con 1440 / 390 so mockup; lọc / URL / canonical / noindex `/du-an` (mới) + `/cho-thue` (hồi quy); form lead `contact` / `rental` / `project` / `property_post` + form ứng tuyển; JSON-LD breadcrumb / Article / JobPosting / FAQPage; `/en`; trang chủ bỏ tim.
- Doc impact khi build (T08): `.context/design-spec.md` S01–S16 + §1.6 / §2.6 / §2.7, `docs/DESIGN.md`, `docs/ERD.md`, `docs/API_SPEC.md`, `skills/react-nodejs/design-tokens.md`.

## Kết quả build

| Task | Nội dung | Commit | Review | Report |
|---|---|---|---|---|
| T00 | `/du-an` `q` / `developer` / `sort` + noindex | `389a816` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-00-round-1-review.md` |
| T01 | Nền tảng A: site-settings + migration, PageHero, breadcrumb, khung danh sách, phân trang, banner tư vấn | `72623dc` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-01-round-1-review.md` |
| T02 | Thẻ dùng chung + bỏ tim + CardSlider | `8f586a5` | STRICT PASS r2 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-02-round-2-review.md` |
| T03 | Danh sách Dự án / Cho thuê / danh mục Cho thuê | `a3d51de` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-03-round-1-review.md` |
| T04 | Khung chi tiết mới + chi tiết Dự án | `6953d10` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-04-round-1-review.md` |
| T05 | Chi tiết Cho thuê + chi tiết Đăng tin BĐS | `0f7a025` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-05-round-1-review.md` |
| T06 | Tin tức (danh sách + danh mục) + Bài viết + danh sách Tin BĐS | `adfff04` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-06-round-1-review.md` |
| T07 | Tuyển dụng / Liên hệ / Pháp lý / Dịch vụ | `b77840d` | STRICT PASS r2 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-07-round-2-review.md` |
| T08 | Close-out: seed dev, so khớp 1440/390, AA breadcrumb ảnh thật, gom MINOR, doc reconcile | `6a747fe` | STRICT PASS r2 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-08-round-2-review.md` |
| T09 | Fix GAP-1 / GAP-2: bài nổi bật trang danh mục Tin tức / Tin BĐS + lưới 4 cột ≥ xl; xem thật `/en` | `2c63564` | STRICT PASS r1 | `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-09-round-1-review.md` |

Phase review r1: `.context/review-reports/spec-validation-feature-site-redesign-homepage-style-phase-1.md` (GAPS FOUND → T09). Migration: `migrations/20261020_183923_site_redesign_page_heroes.ts` (additive).

## As-built (close-out) — đã ghi vào khối BL-045 `SPECIFICATIONS.md`, giữ câu gốc

- AB-1 Hero trang con dùng chiều cao tối thiểu (`min-h`) thay cố định; chữ SSR không CLS, chữ dài làm hero cao thêm.
- AB-2 `/tin-bds` + danh mục bỏ hàng "Có N kết quả".
- AB-3 Chi tiết cho thuê bỏ neo `#description`.
- AB-4 Breadcrumb Bài viết thêm mắt xích cuối = tiêu đề bài; JSON-LD không đổi.
- AB-5 `/du-an` `q` / sắp giá chạy trong bộ nhớ trên ≤ 1000 dự án công khai (chạm trần → log cảnh báo); p95 ≤ 500ms trong giới hạn đó; ô sắp xếp cần JS.
- AB-6 ConsultBanner: tiêu đề + mô tả đi theo cặp.
- AB-7 Banner cuối chi tiết cho thuê / Tin BĐS cũng → `#lead-form` + `tel:`.
- AB-8 Slider "tương tự" là lưới khi ≤ 3 thẻ; phân trang trang hiện tại nền `--color-primary`; breadcrumb overlay cao 44px.
- T09 (sửa code theo spec, không đổi spec): trang 1 danh mục Tin tức / Tin BĐS có bài nổi bật ngang; lưới Tin tức / Tin BĐS 4 cột ≥ xl.

Không hạ cấp business rule; intent docs (BRD / PRD / USER_FLOW) không đổi.

## Test scope
`spec/test-scope/current.json` **scopeVersion 45** (`status: published`, 2026-10-21). Scope trước: `spec/test-scope/archive/test-scope-1.34.1-44.json`.
