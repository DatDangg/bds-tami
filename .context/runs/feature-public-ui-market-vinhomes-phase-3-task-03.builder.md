# builder · BL-020 phase-3-task-03 (Tin tức market) — DONE, chưa commit
- PageBanner `overlap` (+ data-banner-size/overlap); CategoryListTemplate union type searchBar⇒compactBanner, `belowContent`, data-search-overlay.
- Tin tức: NewsHomeBody (nổi bật + hàng danh mục) + news-home.ts (loadNewsHome); NewsListBody = lưới 4 cột; ConsultSection (LeadForm source=contact) trong NewsListPage, chỉ /tin-tuc (không ở trang danh mục).
- listPublicNews `featuredOnly`; listChildNewsCategoriesOf; buildNewsChips nhận roots tải sẵn.
- Tests: NewsListPage.test.tsx mới, NewsHomeBody, PageBanner, CategoryListTemplate, ProjectListPage (data-*).
- Verify: lint 0 error (2 warning cũ tools/), typecheck OK, test 284 files/3002 pass, build OK.
