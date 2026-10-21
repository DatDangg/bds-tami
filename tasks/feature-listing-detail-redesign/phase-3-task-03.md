# feature-listing-detail-redesign · phase-3-task-03 — Trang `/tin-bds` (+ danh mục) theo khung danh sách mới

- Nguồn: BL-052 change doc mục "Tin BĐS".
- Spec: 1.46.0 khối BL-052 mục "`/tin-bds`", "Trang danh sách (khung chung)".
- Plan: phase 3 wave C.
- Phụ thuộc: P3-T02, P1-T02, P1-T01 (loader `listingPages.propertyPosts`).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai, SEO, tham số mới.
- Expected review level: **STRICT**.
- Blast radius: `src/components/posts/PostListPage.tsx`, `PostListBody.tsx`, routes `tin-bds/page.tsx`, `tin-bds/danh-muc/[category]/page.tsx`, metadata, i18n.

## Scope
1. `ListingHero` (pageHeroes.propertyPosts; danh mục: tên + mô tả danh mục) + `q` + Tìm nhanh (`listingPages.propertyPosts`) → `ListingCategoryTabs` (Tất cả + danh mục tin BĐS, link route, số đếm) → `FilterSidebar`: Loại hình · Tỉnh/thành · Mức giá (slider tỷ) · Diện tích (slider) · Phòng ngủ (chip) · Hướng · Tình trạng bàn giao + "Xoá tất cả" → `SpotlightSlider` (trang 1) → `ResultsBar` + sắp xếp → lưới 3 cột thẻ BĐS / voucher → `Pagination` → `LearnMoreFaq` (`listingPages.propertyPosts`) → dải Điểm mạnh (cờ propertyPosts) → `ConsultBanner`. Thay bố cục BL-045 Q4 (hero thấp + bài nổi bật ngang).
2. Mobile Sheet; không JS form GET.
3. Kiểm 1440 / 390, VI + EN, danh mục voucher (thẻ voucher), lọc ra rỗng.

## Acceptance
- [ ] `/tin-bds`, `/tin-bds/danh-muc/[category]` cùng khung danh sách; voucher/ưu đãi chung lưới thẻ riêng; lọc theo loại tin (tab).
- [ ] Canonical/noindex đúng; EN đủ nhãn; không tràn 375px.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
