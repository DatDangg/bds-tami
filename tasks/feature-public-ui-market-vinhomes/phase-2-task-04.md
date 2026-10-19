# feature-public-ui-market-vinhomes · phase-2-task-04 — Khối Tin cho thuê + Tin tức trên trang chủ

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT FAIL r1 (2 khối tối + runtime: t(undefined salesStatus), khối ẩn khi thiếu tiêu đề) → PASS r2
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI · NORMAL (đọc dữ liệu công khai sẵn có, cache tag hiện có).

## Việc
- `HomeRentals`: tab theo danh mục cho thuê (CMS hoặc fallback), slider `RentalCard` (tái dùng), "Xem thêm" → `/cho-thue/danh-muc/<slug>`. Tablist a11y; dữ liệu các tab render ở server (≤ 4 tab × 8 tin).
- `HomeNews`: khối tối, intro trái + 3 `NewsCard` phải, "Xem tất cả".
- `HomeBlocks` render theo `blockOrder`; trang chủ revalidate khi rentals/news đổi (kiểm hook hiện có, thêm nếu thiếu).

## Acceptance
- [ ] Hai khối bật/tắt + sắp xếp được; không có dữ liệu thì ẩn khối; ở `/en` theo luật ẩn tin chưa có bản EN hiện có


## Carry-over từ P2-T01 (reviewer r1 — quyết định cho checkpoint)
- Khối không có trong `blockOrder` thì không hiện (as-built ERD L9-T01); `defaultValue` 8 khối chỉ áp cho bản ghi mới → homepage đang có trên staging/prod (6 dòng) **không hiện `rentals`/`news`** cho tới khi admin thêm ở "Thứ tự khối".
- Hướng làm (an toàn, không data migration): (a) cập nhật `seed/sample/homepage.ts` có đủ 8 khối + dữ liệu mẫu cho khối mới; (b) thêm cảnh báo trong admin (description của `blockOrder`/tab Cho thuê, Tin tức: "khối chỉ hiện khi có trong Thứ tự khối") ; (c) ghi bước triển khai "Admin → Trang chủ → Thứ tự khối: thêm Cho thuê, Tin tức" vào Decision log để session chính đưa vào spec/updates. **Không** tự động thêm khối thiếu lúc render (đổi luật as-built, cần user duyệt).


## Decision log (builder)
- **View model** (`home-view.ts`): `rentals` {title, tabs[{id,label,href,cards}]} và `news` {title, intro, posts, href}. `HomeDocs` thêm `rentalTabs` (danh mục + DTO `SearchService`) và `news` (doc News). `RENDERED_BLOCKS` thêm `rentals`, `news` → cần bật + có trong `blockOrder`; **tiêu đề tuỳ chọn** (round 2: thiếu tiêu đề ở ngôn ngữ đang xem → dùng tiêu đề mặc định i18n `page.home.{rentals,news}.defaultTitle`, không ẩn khối; ở `/en` nội dung EN chính là các tin/bài có bản EN — không có tin EN thì ẩn khối). Tab thiếu tên/slug/tin bị bỏ; ≤ 4 tab × ≤ 8 tin; ≤ 3 bài tin. 0 tab / 0 bài → ẩn khối.
- **Loader tin cho thuê** (`home-queries.ts`): dùng đúng `PostgresRentalSearch` của `/cho-thue/danh-muc/<slug>` (`available: true` = chỉ tin còn trống, `locale` → `/en` chỉ tin có EN, mới nhất trước, `limit: 8`) nên trùng luật hiển thị trang danh sách; danh mục con tính vào danh mục cha (SQL sẵn có). **Chi phí:** 1 truy vấn danh mục + mỗi tab 1 lần `search` (đếm + trang = 2 SQL, song song, ảnh/khu vực JOIN trong chính SQL → không N+1 theo tin): chọn tay ≤ 4 tab (≤ 9 SQL), fallback dò ≤ 8 danh mục gốc (≤ 17 SQL, thực tế 2–3 danh mục). Chọn đúng "mỗi tab một truy vấn" thay vì một truy vấn gộp vì DTO không mang `category` (gộp rồi chia nhóm cần đổi SQL của SearchService, ngoài scope). Chạy trong `Promise.all` cùng các khối khác, chỉ khi khối hiển thị.
- **Nguồn tab:** `rentals.categories` (đọc như khách qua `findPublicList`, scope `rental`, giữ thứ tự admin, ≤ 4). Để trống HOẶC không tab nào còn tin/công khai (vd `/en` chưa có EN) → fallback các danh mục cho thuê cấp 1 (`listRentalCategoryOptions`, cùng thứ tự `/cho-thue`) đang có tin, ≤ 4. Quyết định thêm (không ghi trong task): rơi về fallback khi chọn tay không ra tab, giống chip hero, để khối không trống vô lý.
- **Tin tức:** `news.posts` (≤ 3, giữ thứ tự, như khách, `/en` chỉ bài có EN) → trống/không bài nào còn công khai thì 3 bài mới nhất; `select` chỉ title/slug/excerpt/publishedAt/category/cover (không kéo `content` richText).
- **UI:** `HomeRentals` (server) → `RentalsTabs` (client): server render ĐỦ mọi panel, panel không chọn chỉ `hidden`; tab đầu `aria-selected`; ←/→ vòng, Home/End, roving tabindex; 1 tab thì không dựng tablist. Slider mỗi panel tái dùng `useSnapSlider` + `SliderArrow`, `RentalCard` (h3), 80%/2/4 thẻ. "Xem thêm" theo tab. `HomeNews` (server, `.theme-dark-block`): intro trái + `NewsCard` ×3 phải (h3), "Xem tất cả" → `/tin-tuc`. Không route nào thành dynamic (không `headers/cookies/searchParams`; chỉ sửa component + loader). **Chưa kiểm trình duyệt** 375/768/1280, tương phản `NewsCard` trên nền tối, vuốt thật → residual risk cho reviewer/primary.
- **Revalidate:** hook mới `createRevalidateHomepageOnListing` (tag `global:homepage` + `/vi` `/en`) gắn vào `rentals` và `news` (afterChange + afterDelete): xuất bản, sửa khi đang `published`, ẩn/đã thuê/xoá mềm/xoá hẳn đều làm mới trang chủ; nháp sửa tiếp thì không. Hook hiện có (`OnUnpublish`) chỉ phản ứng khi RỜI công khai, `createRevalidateContent` chỉ chạm `/` khi `isFeatured` → thiếu cho khối "mới nhất", nên thêm hook riêng (không đổi hook cũ). `createRentals`/`createNews` thêm tham số `revalidateTags` (như `createProjects`). Đổi tên danh mục không làm mới trang chủ ngay (hook category không chạm `/`): ISR 60s lo — chấp nhận.
- **Carry-over P2-T01 (blockOrder):** không tự thêm khối thiếu lúc render, không data migration. (a) `seed/sample/homepage.ts`: `rentals` + `news` (tiêu đề + intro VI/EN, để trống chọn tay → fallback) + `blockOrder` đủ 8 khối (about, featuredProjects, services, featuredOffers, rentals, news, partners, ctaBanner). (b) Admin description: group `rentals`, `news` ("Khối chỉ hiện khi có trong mục Thứ tự khối.", hằng `BLOCK_ORDER_NOTE`) + mô tả `blockOrder`. (c) `pnpm generate:types`: `payload-types.ts` chỉ đổi dòng comment (JSDoc từ description), KHÔNG đổi kiểu dữ liệu → **không cần migration** (description không lưu DB).
- **BƯỚC TRIỂN KHAI (cho spec/updates + release notes):** sau khi deploy, trên staging/prod: **Admin → Trang chủ → tab "Thứ tự khối" → thêm "Cho thuê" và "Tin tức"** (kéo vị trí mong muốn), rồi vào tab Cho thuê/Tin tức (tuỳ chọn) điền **Tiêu đề khối** ở mỗi ngôn ngữ — để trống thì dùng tiêu đề mặc định "Thuê nhà ở & kinh doanh" / "Tin tức" (EN: tiêu đề mặc định tiếng Anh) + (tuỳ chọn) intro, danh mục/bài chọn tay. Trước đó trang chủ hiện như cũ (không mất khối nào).
- **i18n:** khoá mới `page.home.rentals.{tabs,viewMore,slide,previous,next}`, `page.home.news.viewAll` (VI/EN). Không xoá khoá nào (nên test guard `load-shell-keys` giữ nguyên).
- **Docs:** `.context/design-spec.md` S01 (bảng thứ tự + mục 8, 9 + ghi chú "chỉ hiện khi có trong blockOrder"), `docs/DESIGN.md` (mô tả trang chủ, hook làm mới).

## Verification summary (builder)
- `pnpm lint` 0 error (2 warning cũ `tools/task-dashboard`) · `pnpm typecheck` PASS · `pnpm vitest run src/components src/lib src/i18n src/app` 177 file / 1760 PASS · `pnpm test` (gồm integration, hook đổi) 270 file / 2850 PASS. `pnpm build` bỏ qua theo yêu cầu (primary so route table: không đổi route/layout).
- Test mới/đổi: `home-view.test` (tab: thứ tự, link vi/en, ≤ 8/≤ 4, bỏ tab rỗng/thiếu tên, ẩn khối; tin: ≤ 3, intro, EN href, blockOrder/enabled/tiêu đề), `home-queries.test` (chọn tay/fallback/EN/giới hạn/không truy vấn khi khối ẩn, danh mục con bị bỏ), `HomeRentals.test` (tablist a11y, panel `hidden`, no-JS, click, ←/→/Home/End, 1 tab, EN), `HomeNews.test`, `HomeBlocks.test` (thứ tự theo blockOrder, homepage cũ không có khối, ẩn khi tắt/rỗng), `revalidate-homepage-on-unpublish.test` (hook Listing).

## Round 2 fixes (builder) — reviewer r1 FAIL + runtime check của primary
- **Runtime 1 — 36× `MISSING_MESSAGE ... reading 'split'` (hồi quy P2-T03, đã commit 5ca19aa).** Nguyên nhân gốc: `HOME_PROJECT_FIELDS` (select của `loadProjects`/`findSelected`) KHÔNG có `salesStatus` và `scale` → doc trả về thiếu hai field → `slide.salesStatus` undefined → `tStatus(undefined)`; đồng thời số liệu `scale.*` cũng luôn rỗng ở runtime (test cũ dựng doc đủ field nên không bắt được). Fix: thêm `salesStatus: true, scale: true` vào select; `ProjectSlideView.salesStatus: SalesStatus | null`, `ProjectsSlider` không dựng badge khi null. Test: `home-queries.test` khẳng định select thật (cả chọn tay lẫn `isFeatured`) gồm salesStatus+scale; `ProjectsSlider.test` ca `salesStatus: null`.
- **Runtime 2 — trang chủ không có Cho thuê/Tin tức.** Nguyên nhân gốc (SQL `homepage_locales` trên `tami_wt_bl020`: `rentals_title` và `news_title` rỗng ở cả vi/en; `homepage_block_order` đã có rentals/news): `visibleBlockKeys` ẩn khối khi tiêu đề ở ngôn ngữ đang xem trống, mà tiêu đề CMS là tuỳ chọn và seed/DB cũ chưa có. Không phải lỗi ISR (log không có lỗi ngoài MISSING_MESSAGE). Quyết định: `rentals`/`news` KHÔNG bị ẩn vì thiếu tiêu đề; view mang `title` rỗng, `RentalsTabs`/`HomeNews` dùng chữ mặc định i18n `page.home.rentals.defaultTitle` / `page.home.news.defaultTitle` (VI/EN). Các khối khác giữ luật cũ. Test cập nhật (visibleBlockKeys, view, HomeRentals/HomeNews title trống). Chưa build lại bản mới (primary rebuild để xác nhận `curl /` có 2 h2).
- **MAJOR-1 (khối tối thứ hai):** user/primary chốt giữ tối. Cập nhật `.context/design-spec.md` (bảng: 9 section, 2 khối tối nội dung CTA + Tin tức; checklist "≤ 2 section nội dung"), `skills/react-nodejs/design-tokens.md` §0 ngoại lệ "tối đa 2", Decision log.
- **MINOR-2:** `HomeNews` có `border-b border-dark-border` để tách khỏi footer tối (test lớp CSS; chưa xem bằng mắt).
- **MINOR-1:** tách mapping + kiểu Cho thuê/Tin tức sang `src/lib/home/home-view-listings.ts` (`toRentalsBlock`, `toNewsBlock`, `RentalTabView`, `NewsBlockView`, `RentalsBlockView`, `HomeRentalTabDocs`, `HOME_RENTALS_PER_TAB_MAX`); `home-view.ts` còn 295 dòng.
- **MINOR-3:** `NewsCard` thêm prop `sizes` tuỳ chọn; `HomeNews` truyền `sizes` theo cột ~230px.
- **MINOR-4:** fallback danh mục dò 4 đầu; chỉ dò thêm lô kế (tới ≤ 8) khi chưa đủ 4 tab có tin (test đếm lần gọi 4 vs 7).
- **MINOR-5:** comment HomeNews "S01 khối 9, BL-020 #11".
- **MINOR-6:** tab chưa chọn có `border border-border`, hover `border-text` (+ nền); tab chọn `border-dark`.
- **Verify r2:** `pnpm lint` 0 error · `pnpm typecheck` PASS · `pnpm vitest run src/components src/lib src/i18n src/app src/hooks` 189 file / 1856 PASS · integration `homepage`, `rentals`, `news` 90 PASS.

## Ghi chú cho checkpoint / spec delta (primary, sau review r2)
- Diễn giải `SPECIFICATIONS.md:174` ("khối trang chủ chưa có bản EN thì ẩn khối") cho 2 khối mới: với Cho thuê/Tin tức, "bản EN" là các tin/bài có bản EN (lọc `hasEnglish`/locale); tiêu đề khối không quyết định hiển thị (thiếu → tiêu đề mặc định i18n). Cần user xác nhận ở checkpoint Phase 2.
- Seed mẫu: thứ tự `… rentals, news, partners, ctaBanner` → khi `partners` chưa render, khối Tin tức (tối) nằm sát CTA (tối), ngăn bằng viền `border-dark-border`; chấp nhận, admin có thể đổi thứ tự.
