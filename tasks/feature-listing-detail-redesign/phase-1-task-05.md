# feature-listing-detail-redesign · phase-1-task-05 — Trang `/du-an` theo design mới

- Nguồn: BL-052 change doc; design `list-du-an.webp`.
- Spec: 1.46.0 khối BL-052 mục "Trang danh sách (khung chung)", "`/du-an`".
- Plan: phase 1 wave C.
- Phụ thuộc: P1-T01 (loader `listingPages`), P1-T02 (component danh sách), P1-T04 (dữ liệu + thẻ).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai chính, SEO canonical/noindex, tham số URL.
- Expected review level: **STRICT**.
- Blast radius: `src/components/projects/ProjectListPage.tsx`, `ProjectFilters.tsx`, `ProjectSortControl.tsx`, route `src/app/(frontend)/[locale]/du-an/page.tsx`, i18n `page.projects`.

## Scope
1. Lắp ráp: `ListingHero` (pageHeroes.projects + `q` + Tìm nhanh `listingPages.projects.quickSearch`) → `ListingCategoryTabs` (Tất cả + danh mục cấp 1, số đếm, icon theo danh mục — map slug/icon hợp lý, fallback icon chung) → 2 cột: `FilterSidebar` (Tình trạng chip · Tỉnh/thành ô tìm + ô tích + số đếm + "Xem thêm" sau 6 · Chủ đầu tư Select · Mức giá slider 0–50+ tỷ · Loại hình ô tích + số · Tiện ích nổi bật ô tích + số; "Xoá tất cả" → `/du-an`) | `SpotlightSlider` (trang 1, có nổi bật) → `ResultsBar` ("N dự án phù hợp" + sắp xếp Mới nhất / Giá tăng / Giá giảm) → lưới 3 cột ≥ lg → `Pagination` → `LearnMoreFaq` (`listingPages.projects`) → dải Điểm mạnh (cờ `showProjectStrengths` như hiện tại) → `ConsultBanner`.
2. < lg: nút "Bộ lọc" + badge mở Sheet; lưới 1/2 cột.
3. Empty state: lọc không ra → `EmptyState` filtered (giữ); chưa có dự án → empty.
3b. Link `/du-an?category=<slug>` (trang chủ / link cũ) → tab tương ứng được đánh dấu (test).
4. Metadata: `hasFilterParams` gồm tham số mới → `noindex, follow` + canonical `/du-an`; trang sạch + `?page=n` như cũ. `/en` hoạt động (nhãn i18n đủ: tab, filter, sort, kết quả, Tìm nhanh, Tìm hiểu thêm, FAQ).
5. Xoá/thu gọn code cũ không còn dùng (`ProjectFilters` thẻ lọc nổi BL-045, `ListFilterRow` nếu chỉ Dự án dùng — kiểm Cho thuê còn dùng thì giữ tới P2).
6. Kiểm trình duyệt dev (`.claude/launch.json` `tami-dev` hoặc dev server worktree): so ảnh design 1440px; 390px; VI + EN; không JS (form GET lọc được).

## Acceptance
- [ ] `/du-an` khớp bố cục `list-du-an.webp` ở desktop (hero, tab đếm, sidebar, thẻ nổi bật, lưới 3 cột, phân trang, Tìm hiểu thêm + FAQ, dải lợi ích, banner, footer). Không tim.
- [ ] Bộ lọc chạy qua `searchParams`, chia sẻ link giữ nguyên; số đếm theo quy tắc "trừ chính chiều đó".
- [ ] Mobile: bộ lọc là Sheet; không tràn ngang 375px.
- [ ] Canonical/noindex đúng (test metadata). EN đủ nhãn.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
