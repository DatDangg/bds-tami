# feature-site-redesign-homepage-style · phase-1-task-06 — Tin tức (danh sách + danh mục) + Bài viết + danh sách Đăng tin BĐS (Q4) (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045) mục 3, 4. Spec delta: khối BL-045 mục "Tin tức", "Bài viết" (Q2, Q3, Q4 đã chốt).
- **Mockup bắt buộc Read:** `docs/specs/site-redesign-mockup/index.html` view `news` (`.phero.short`, chip, `.feat`, `.grid.news`) và `article` (`.crumb.plain`, `.artgrid`, `.art-hd`, `.art-img`, `.art-side`, `.mini`, `.shead.left`), DECISIONS #3.
- Phụ thuộc: **T01** (PageHero short, breadcrumb overlay/plain, CategoryListTemplate, Pagination, SectionHeading, ConsultBanner), **T02** (NewsCard/PostCard).
- Song song: **được** với T03, T04, T07 (wave B). Không đụng `src/components/detail/*` (bài viết rời `DetailLayout` bằng cách đổi page, không sửa DetailLayout). Trùng `vi/en.json` (namespace `page.news.*`, `page.newsDetail.*`, `page.posts.*`).
- Trạng thái: `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user
Như T01. **Không đầu khối canh giữa** ở Tin tức / Bài viết / "Bài viết liên quan".

## Classification / Risk
- Type: **MODIFY** (bố cục F5, F4 danh sách) + **REMOVE** hàng theo danh mục + "Tin khác" ở trang 1 `/tin-tuc` (Q2). Form "Tư vấn nhu cầu" (lead `contact`, F9) **giữ**, chỉ đổi vị trí/kiểu.
- Risk: **MEDIUM–HIGH** — đổi truy vấn trang 1 `/tin-tuc` (bỏ hàng danh mục / Tin khác, không trùng bài nổi bật), form lead giữ nguồn `contact`.
- Expected review level: **STRICT** (đổi truy vấn trang 1 + trang có form lead).
- Blast radius: `/tin-tuc` (+ trang 2+), `/tin-tuc/danh-muc/[category]`, `/tin-tuc/[slug]` (+ `/en`); `/tin-bds` + `/tin-bds/danh-muc/[category]` (+ `/en`).
- Doc impact: design-spec S10/S11 (+ S08), F5/F9 spec (publisher) — T08.

## Scope / files
1. **Danh sách** `src/components/news/NewsListPage.tsx`, `NewsHomeBody.tsx`, `NewsListBody.tsx`, `NewsCard.tsx` (variant `feature` ngang: ảnh trái lớn bo 20px, phải eyebrow danh mục + tiêu đề + tóm tắt + ngày + Button "Đọc bài"), `src/app/(frontend)/[locale]/tin-tuc/page.tsx`, `tin-tuc/danh-muc/[category]/page.tsx`: `PageHero size="short"` (chữ `pageHeroes.news`, ảnh `pageBanners.news`) + breadcrumb overlay → hàng chip danh mục (link, `aria-current`, cuộn ngang < sm) → bài nổi bật ngang (bài `isFeatured` mới nhất, fallback mới nhất) → lưới `NewsCard` 3 cột ≥ lg → phân trang tròn → **form "Tư vấn nhu cầu"** (mọi trang `/tin-tuc`, không ở danh mục; thẻ trắng + `SectionHeading` canh trái, `LeadForm source="contact"` giữ nguyên trường) → `ConsultBanner`. **Bỏ** `CategoryRow` (hàng danh mục cấp 1) + khối "Tin khác" của `NewsHomeBody` (Q2): trang 1 = bài nổi bật (`isFeatured` mới nhất, fallback mới nhất) + lưới các bài mới nhất còn lại (không trùng) + phân trang; xoá truy vấn/view không còn dùng. Trang 2+ và danh mục: chip + lưới + phân trang (bài nổi bật chỉ trang 1 `/tin-tuc` và trang 1 danh mục — giữ truy vấn hiện tại, không trùng bài).
2. **Bài viết** `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `src/components/news/NewsToc.tsx`, `ShareButtons.tsx`: **bỏ `DetailLayout`** → nền `--color-bg`, header thường; breadcrumb `variant="plain"` (Trang chủ › Tin tức › danh mục); lưới ≥ lg `[nội dung][cột phải 22–24rem]`: trái eyebrow danh mục + `h1` canh trái + meta (ngày · thời gian đọc nếu có dữ liệu · tác giả nếu có) → ảnh bìa bo 20px `priority` → mục lục **khối thu gọn đầu bài** (Q3: `NewsTocDisclosure` mọi breakpoint, chỉ khi có heading; bỏ `NewsTocSidebar` dính trái) → RichText `max-w-[68ch]` → tags + chia sẻ; phải (dính `top` dưới header): thẻ "Bài viết mới" (≤ 3 bài cùng ngôn ngữ trừ bài này, `mini` ảnh + tiêu đề + ngày) + thẻ tư vấn tối (`--color-dark`, eyebrow "Tư vấn", nút → `/lien-he`, **không form**); < lg hai thẻ sau nội dung. Cuối: section nền trắng `SectionHeading` canh trái "Bài viết liên quan" + lưới 3 thẻ → `ConsultBanner`. Giữ JSON-LD Article/BreadcrumbList, metadata.
3. **Đăng tin BĐS danh sách (Q4)** `src/components/posts/PostListPage.tsx`, `PostListBody.tsx`, `tin-bds/page.tsx`, `tin-bds/danh-muc/[category]/page.tsx`: theo bố cục Tin tức (hero thấp `pageBanners.propertyPosts`, chip danh mục, bài nổi bật ngang, lưới `PostCard`) + chữ hero `pageHeroes.propertyPosts`; không form lead; tham số / canonical giữ; thay bố cục "bài nổi bật là thẻ đầu lưới" của BL-032.
4. i18n namespace của mình.
5. Tests: `NewsListPage`/`NewsHomeBody`/`NewsCard` (feature ngang, không canh giữa — assert không class `text-center`/`mx-auto` ở đầu khối), news detail page test (không `data-detail-page`, 1 `h1`, cột phải "Bài viết mới" loại bài hiện tại, nút tư vấn → `/lien-he`), `NewsToc` (disclosure đầu bài, không sidebar), `PostListPage` (bố cục Tin tức); form "Tư vấn nhu cầu" còn ở mọi trang `/tin-tuc` (cuối trang), không ở danh mục; không còn hàng danh mục / "Tin khác".

## Acceptance
- [ ] `/tin-tuc` và danh mục khớp `news` 1440 + 390; `/tin-tuc/<slug>` khớp `article` 1440 + 390; không đầu khối canh giữa.
- [ ] Phân trang, canonical, `noindex`, JSON-LD giữ; `/en` chỉ bài EN.
- [ ] `/tin-bds` + danh mục theo bố cục `news`; form "Tư vấn nhu cầu" gửi được (`contact`) ở cuối `/tin-tuc`; mục lục bài viết là khối thu gọn đầu bài.
- [ ] Không hex mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/components/news src/components/posts src/lib/news src/lib/posts` → `pnpm typecheck` → `pnpm lint` → xem thật 1440 + 390, chụp màn hình (`.context/review-reports/assets/site-redesign-t06-*.png`).

## Retry / Escalation
Như T01.

## Verification summary (builder điền)
- Acceptance criteria: PASS|FAIL|BLOCKED
- Verify commands + result:
- Lệch so với mockup + lý do:
- Reviewer verdict:

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
