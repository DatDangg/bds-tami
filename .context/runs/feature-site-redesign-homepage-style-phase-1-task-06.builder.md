
## Builder notes (T06, 2026-10-21)
- Worktree `D:/prj/bds/.claude/worktrees/agent-aa1112564d81afb34` (branch `worktree-agent-aa1112564d81afb34`), base `ffc31b8` (ff từ staging). Chưa commit.
- Quyết định:
  1. `loadNewsListing` (không danh mục): 2 truy vấn limit 1 song song (isFeatured, mới nhất) → bài nổi bật = isFeatured mới nhất, fallback mới nhất; lưới loại bài đó ở MỌI trang (như `/tin-bds`), nên không trùng/không mất bài. Xoá `news-home.ts`, `NewsHomeBody`, `NEWS_FEATURED_COUNT`, `listChildNewsCategoriesOf`, key i18n `moreNews/featuredLabel/viewMore/viewMoreIn`.
  2. Trang danh mục không có bài nổi bật (spec "giữ truy vấn hiện tại"); trang 2+ không có bài nổi bật.
  3. `NewsCard variant="feature"` viết lại (ảnh trái, chữ phải, nút "Đọc bài" là `span.buttonVariants` trong link, không link lồng); thêm `PostCard variant="feature"` (nút "Xem chi tiết") cho `/tin-bds`. `/tin-bds` bỏ dòng "Có N kết quả" (bố cục Tin tức không có); lưới 3 cột; bài nổi bật chỉ khi có `isFeatured` còn hạn (không fallback — loader cũ giữ nguyên).
  4. Danh mục: hero `short` (CategoryListTemplate tự chọn cỡ), eyebrow = tên trang, h1 = tên danh mục. Chữ hero `/tin-tuc`, `/tin-bds` qua `loadPageHero` (news/propertyPosts).
  5. Form "Tư vấn nhu cầu": `ConsultSection` trong NewsListPage (thẻ trắng + `SectionHeading` canh trái, `id="lead-form"`, `LeadForm source="contact"`) qua `belowContent`; `ConsultBanner` qua `consultBanner`. Không dùng `LeadFormSlot` (nền subtle + h2 canh trái cố định).
  6. Bài viết: bỏ `DetailLayout`; breadcrumb `plain` giữ mắt xích cuối = tiêu đề bài (JSON-LD BreadcrumbList không đổi); ảnh bìa 2/1; `NewsTocSidebar` xoá, `NewsTocDisclosure` mọi breakpoint; cột phải mới `NewsArticleSidebar` (Bài viết mới ≤ 3 + thẻ tư vấn tối → `/lien-he`); "Bài viết liên quan" nền trắng + `SectionHeading` canh trái; `ConsultBanner` cuối. Collection News không có trường tác giả → bỏ.
  7. Không sửa `PageHero` / `CategoryListTemplate` / `detail/*`; không cần thêm prop.
- Verify: `pnpm typecheck` PASS · `pnpm lint` 0 lỗi (2 warning cũ ở tools/task-dashboard) · `pnpm vitest run src` 249 files / 2444 tests PASS · `tests/integration/news.test.ts` 28 PASS (cập nhật hợp đồng featured).
- Ảnh: `.context/review-reports/assets/site-redesign-t06-{news,article}-{1440,390}.jpg`, `site-redesign-t06-posts-390.jpg` (trình duyệt dùng chung với builder khác, ảnh ở cỡ khung pane). DB dev không có tin BĐS `isFeatured` nên chưa thấy thẻ nổi bật `/tin-bds` bằng mắt (có unit test).
- Lệch mockup: breadcrumb bài viết có thêm tiêu đề bài (mockup dừng ở danh mục).
- Nhiễu: `src/payload-types.ts` và `src/app/(payload)/admin/importMap.js` hiện "modified" chỉ do đổi line-ending khi chạy dev server (không khác nội dung) — đừng stage.
