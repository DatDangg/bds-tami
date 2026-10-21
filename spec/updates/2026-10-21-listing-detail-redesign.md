# Spec Update — 2026-10-21 listing-detail-redesign (redesign danh sách + chi tiết Dự án / Cho thuê / Tin BĐS)

**spec_version:** 1.45.1 → 1.46.0 (MINOR — thêm requirement bố cục mới + trường dữ liệu mới additive cho Dự án / Tin BĐS / Cài đặt website + tham số lọc mới. Không breaking: lọc / URL cũ giữ, trường mới tuỳ chọn, migration chỉ ADD.)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-052**, MODIFY + ADDITIVE schema). Change doc `spec/changes/2026-10-21-listing-detail-redesign.md`. Design: `docs/specs/listing-detail-redesign/list-du-an.webp`, `detail-du-an.webp`.

**Trạng thái:** planned — spec delta đã ghi, build theo phase 1 (Dự án) → 2 (Cho thuê) → 3 (Tin BĐS). Chế độ auto proceed, builder-strong, commit `staging` không push.

## Requirements (SPECIFICATIONS.md)

- **Giao diện — THÊM khối "Redesign danh sách + chi tiết Dự án / Cho thuê / Tin BĐS (BL-052 …)"** (ngay sau "Doc impact khi build" của khối BL-045). Thay điểm bố cục BL-045 cho `/du-an`, `/du-an/[slug]`, `/cho-thue` (+ danh mục / khu vực), `/cho-thue/[slug]`, `/tin-bds` (+ danh mục), `/tin-bds/[slug]`. Các mục BL-045 "Trang danh sách" / "Thẻ dùng chung" / "Trang chi tiết" và F2 / F3 / F4 đánh dấu *(bố cục thay bởi BL-052)*.
  - **Khung danh sách chung:** hero ảnh (eyebrow, `h1` 2 dòng, ô tìm `q`, chip "Tìm nhanh" từ admin) → thanh tab danh mục có icon + số đếm → cột trái "Bộ lọc" (≥ lg; < lg Sheet + badge) trên `searchParams` → thẻ nổi bật lớn (≤ 5 tin `isFeatured`, trang 1, không lặp trong lưới) → "N … phù hợp" + sắp xếp → lưới 3/2/1 cột → phân trang → "Tìm hiểu thêm" + FAQ riêng từng màn → Điểm mạnh → banner tư vấn. Số đếm = khớp mọi lọc khác trừ chính chiều đó; có lọc → `noindex, follow` + canonical sạch. Không icon yêu thích.
  - **Admin `site-settings` tab "Trang danh sách" (MỚI):** `listingPages.{projects, rentals, propertyPosts}` — `quickSearch` (≤ 8), `learnMore` (chữ localized, ảnh, `videoUrl`, CTA), `faqs` (≤ 10), cờ `showStrengths` (rentals / propertyPosts). EN thiếu chữ → bỏ hàng.
  - **Dự án — trường mới (additive, tuỳ chọn):** `productTypes` (`PROPERTY_TYPES` 8 giá trị), `featuredAmenities` (`PROJECT_FEATURES` 7 giá trị), `products` (≤ 8: count / type localized / areaFrom–areaTo), `videoUrl`, `amenities[].description` (localized), `amenitiesImage`. Không thêm trường giá / pháp lý ngắn.
  - **Giá dự án "Giá từ":** `priceFromVnd` > 0, không thì min > 0 của `priceTable[].priceFrom`, không có → "Liên hệ" (loại khỏi lọc giá, xếp cuối khi sắp giá).
  - **`/du-an` lọc:** `status`, `province` (nhiều, OR; link 1 slug cũ vẫn chạy), `developer`, `priceMin`/`priceMax` (tỷ, 50 = không giới hạn), `type` (nhiều, OR theo `productTypes`), `feature` (nhiều, AND), `q`, `sort`. Giá trị lạ bị bỏ, không 400/500.
  - **Chi tiết Dự án:** hero full-bleed + 3 thumbnail + "Xem tất cả N ảnh" + nút video (khi có); thanh thông số ≤ 6 ô **không có Pháp lý**; tab dính Tổng quan · Vị trí · Tiện ích · Hình ảnh rồi các khối giữ (Nổi bật, Mặt bằng, Bảng giá, Pháp lý & chính sách, Tin liên quan, Hỏi đáp); cột phải form "Nhận thông tin dự án" + Hotline "Gọi ngay"; Vị trí có danh sách khoảng cách; "Dự án tương tự" carousel. Khối trống ẩn cả khối lẫn tab.
  - **`/cho-thue`:** tab = danh mục (đóng vai Loại hình); lọc Tỉnh (1) + Phường, **`project` (MỚI, cả `GET /api/public/rentals`)**, giá thuê, diện tích, phòng ngủ, nội thất, tiện ích (AND). Chi tiết: thanh thông số Giá thuê · Diện tích · PN/PT · Nội thất · Hướng · Dọn vào từ; Điều khoản thuê + Pháp lý giữ; "Căn tương tự".
  - **Tin BĐS — trường mới (additive, tuỳ chọn):** `propertyType`, `areaM2`, `bedrooms`, `bathrooms`, `houseDirection`, `frontageM`, `floors`, `handoverCondition` (`raw`/`basic`/`full`), `address`, `location`.
  - **`/tin-bds`:** lọc `type`, `province` (nhiều), `priceMin`/`priceMax` (tỷ), `areaMin`/`areaMax`, `bedrooms`, `direction`, `handover`, `q`, `sort`. Voucher / ưu đãi chung lưới, thẻ voucher riêng (hạn + Còn hạn / Đã kết thúc, BR-06). Chi tiết: thanh thông số theo loại tin, tab Ưu đãi giữ `OfferBox`.
  - **Backfill dev only:** `pnpm backfill:listing-fields` (dry-run mặc định, `--apply` ghi, chỉ điền ô trống, chặn production, xuất báo cáo cho admin soát).
- **F2 / F3 / F4** (FR-PUB-02..07, FR-PUB-16, FR-ADM-01..03): thêm ghi chú trỏ khối BL-052; phần dữ liệu / quyền cũ giữ.

**Giữ nguyên:** header, footer, `ConsultBanner`, `StrengthsBlock`, breadcrumb trên ảnh, token / Montserrat / element sẵn có (`no-raw-colors.test`), LeadForm (nguồn, Turnstile, consent), JSON-LD, 1 `h1`/trang, i18n vi/en (BR-07), tin đã thuê (băng / noindex / căn tương tự), ưu đãi hết hạn (BR-06).

## Ảnh hưởng

- **Schema / DB:** migration versioned additive (projects, property-posts, site-settings `listingPages`). Không DROP / đổi type.
- **API:** `GET /api/public/rentals` nhận thêm `project`; tham số URL mới ở `/du-an`, `/tin-bds`.
- **Module:** `src/collections/{Projects,PropertyPosts}.ts` + `projects/*`, `src/globals/SiteSettings.ts` + `site-settings/*`, `src/components/{listing,detail,projects,rentals,posts}/*`, `src/lib/{projects,rentals,posts}/*`, `src/shared/types/api.ts`, `src/endpoints/public/rentals*`, `migrations/*`, script backfill, `messages/*`.
- **Phụ thuộc:** trang chủ (thẻ dự án / `ProjectsSlider`), `DetailLayout` dùng chung, BL-054 (Tin tức / Tuyển dụng / Liên hệ) sẽ tái dùng `src/components/listing/*`.
- **Doc impact khi build:** `.context/design-spec.md`, `docs/DESIGN.md`, `docs/ERD.md`, `docs/API_SPEC.md`.
- **Test-scope:** `spec/test-scope/current.json` v58 (risk HIGH).

## Làm rõ sau spec-validation pre-plan r1 (2026-10-21, `.context/review-reports/feature-listing-detail-redesign-spec-validation.md`)
- F1: "Giá từ" dự án theo Quyết định 6 — **min `priceTable[].priceFrom` > 0 trước**, fallback `priceFromVnd`, không có → "Liên hệ".
- F3: thẻ mới (Dự án / Cho thuê / Tin BĐS-voucher) dùng ở danh sách + trang chi tiết; **trang chủ giữ biến thể thẻ hiện tại**.
- F4: route khu vực Cho thuê chưa có trang → ngoài phạm vi. F5: `/cho-thue?category=` và `/du-an?category=` (ô tìm kiếm trang chủ) vẫn lọc + đánh dấu tab.
- F8: JSON-LD `FAQPage` danh sách chỉ ở trang sạch. F9: voucher card khi có ưu đãi và không có `priceVnd`/`areaM2`; `address`/`location` tin BĐS công khai.
- F10: Cho thuê / Tin BĐS được lọc + đếm trong bộ nhớ có trần nếu cần cho p95. F11: slider Cho thuê 0–100+ triệu (bước 1), 0–300+ m² (bước 5); Tin BĐS 0–50+ tỷ (bước 1), 0–500+ m² (bước 10).
- F12: "Xem tất cả N ảnh" phủ thumbnail đầu như design. F14: `scale.handoverTime`; cờ dải Điểm mạnh áp cả danh sách + chi tiết theo màn. F15: tỉnh Cho thuê chọn một (radio).
