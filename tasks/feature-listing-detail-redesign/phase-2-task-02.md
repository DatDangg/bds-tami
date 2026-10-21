# feature-listing-detail-redesign · phase-2-task-02 — Trang `/cho-thue` (+ danh mục) theo khung danh sách mới

- Nguồn: BL-052 change doc mục "Cho thuê".
- Spec: 1.46.0 khối BL-052 mục "`/cho-thue`", "Trang danh sách (khung chung)".
- Plan: phase 2 wave B.
- Phụ thuộc: P2-T01, P1-T02, P1-T01 (loader `listingPages.rentals`).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai, SEO (canonical/noindex), bộ lọc nhiều tham số, client draft count hiện có.
- Expected review level: **STRICT**.
- Blast radius: `src/components/rentals/RentalListPage.tsx`, `RentalFilters*`, `RentalFilterPopover/Sheet`, `FilterFields`, `ActiveFilters`, `RentalSortControl`, `use-rental-draft`, `RentalListNavigation`, routes `cho-thue/page.tsx`, `cho-thue/danh-muc/[category]/page.tsx` (route khu vực chưa có trang — ngoài phạm vi), `rental-list-metadata.ts`, i18n.

## Scope
1. `ListingHero` (pageHeroes.rentals; danh mục: tiêu đề = tên danh mục, mô tả = mô tả danh mục như BL-045) + `q` + Tìm nhanh (`listingPages.rentals`) → `ListingCategoryTabs` (Tất cả + danh mục, link route danh mục như hiện tại, số đếm) → `FilterSidebar`: Tỉnh/thành (ô tích một lựa chọn + số đếm; chọn tỉnh → Select Phường) · Dự án (Select → `project`) · Giá thuê (slider triệu/tháng → `priceMin`/`priceMax` VNĐ) · Diện tích (slider → `areaMin`/`areaMax`) · Phòng ngủ (chip 1/2/3/4+) · Nội thất (chip) · Tiện ích (ô tích, AND) + "Xoá tất cả" → `SpotlightSlider` (trang 1) → `ResultsBar` + sắp xếp → lưới 3 cột → `Pagination` → `LearnMoreFaq` (`listingPages.rentals`) → dải Điểm mạnh (cờ `listingPages.rentals.showStrengths`) → `ConsultBanner`.
2. Bỏ thẻ lọc nổi BL-045 + Popover lọc phụ; chip "đang lọc" (`ActiveFilters`) giữ ở hàng kết quả nếu hợp (hoặc bỏ có lý do — ghi quyết định). Không JS: form GET lọc được (`q`, tỉnh, phòng ngủ, nội thất, dự án; slider → 2 ô số; tiện ích → ô tích nhiều giá trị khoá lặp).
3. Link cũ `/cho-thue?category=<slug>` (ô tìm kiếm trang chủ `HeroSearch`) vẫn lọc đúng + tab tương ứng `aria-current` (test). Canonical / `noindex` / tham số `page` giữ; tin đã thuê hiển thị như hiện tại.
4. Dọn component cũ không còn dùng (thẻ lọc nổi, `ListSearchBar`/`ListFilterRow` nếu không còn nơi nào dùng).
5. Kiểm trình duyệt 1440 / 390, VI + EN, không JS.

## Acceptance
- [ ] `/cho-thue`, `/cho-thue/danh-muc/[category]` cùng khung danh sách Dự án, bộ lọc theo spec, số đếm đúng.
- [ ] Link cũ (tham số cũ) vẫn lọc đúng; canonical/noindex đúng (test).
- [ ] Mobile Sheet; không tràn 375px; EN đủ nhãn.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Bổ sung từ review P2-T01 / P2-T03 + mẫu P1-T05 (change-request 2026-10-21)
- Lắp ráp theo mẫu `/du-an` (P1-T05): `src/components/projects/ProjectListBody.tsx` + `project-list-state.ts` — hook `useListingFilterNav` gọi 1 lần, `generation` làm `key`, `reset` → `onClear`; `findPublicList({ populate })` nếu cần.
- Data P2-T01: `listRentals()` trả `items`/`total`/`featured`/`facets.category`/`facets.provinces`; `toRentalProvinceFacets`; `RentalFilterOptions.projects`; RentalListPage hiện tạm đặt nổi bật đầu lưới trang 1 → thay bằng `SpotlightSlider`.
- MINOR mang sang: `RentalCard` `key={tag}` thêm tiền tố; thống nhất chữ giá thẻ với chi tiết ("Thương lượng" / "Liên hệ", bỏ "Thoả thuận"); `RentalPriceText.tsx` U+200B → `\u200B`; ngày đăng chi tiết bọc lại `<time>`; "Căn tương tự" dùng biến thể `listing`.
