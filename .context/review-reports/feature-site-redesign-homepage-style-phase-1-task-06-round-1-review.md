Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-06 · round 1 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-aa1112564d81afb34` (branch `worktree-agent-aa1112564d81afb34`, chưa commit). `git log -1` = `ffc31b8` (đúng base staging).
- Phạm vi diff: 18 file sửa + 2 file mới (`NewsArticleSidebar.tsx`, `NewsDetailPage.test.tsx`) + 2 file xoá (`NewsHomeBody.tsx`, `lib/news/news-home.ts`). Bỏ qua `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` (chỉ đổi EOL).

## Review level
**STRICT**

## Reason
Đổi truy vấn trang 1 `/tin-tuc` (quy tắc bài nổi bật + loại khỏi lưới ở mọi trang → ảnh hưởng phân trang/không trùng/không mất bài), xoá module dùng chung (`news-home`, `NewsHomeBody`, `NewsTocSidebar`, `listChildNewsCategoriesOf`, `NEWS_FEATURED_COUNT`), trang có form lead (`contact`), SEO (1 `h1`, JSON-LD Article/BreadcrumbList), sửa component dùng chung `NewsCard`/`PostCard`.

## Blast radius
- Route: `/tin-tuc` (+ `?page=n`), `/tin-tuc/danh-muc/[category]`, `/tin-tuc/[slug]`, `/tin-bds`, `/tin-bds/danh-muc/[category]` (+ `/en` của tất cả).
- Component dùng chung: `NewsCard` (variant `feature` viết lại; `card`/`row` dùng ở trang chủ/khối khác không đổi hành vi), `PostCard` (thêm variant `feature`, mặc định `card` không đổi — slider trang chủ an toàn).
- Data: `loadNewsListing` (hình dạng `featured: NewsCardData[]` → `NewsCardData | null`; mọi nơi gọi đã cập nhật, typecheck PASS), `listPublicNews` thêm 1 lần gọi ở chi tiết bài (Bài viết mới).
- i18n: `page.news.*` (xoá 4 key, thêm `readArticle`), `page.newsDetail.*` (mới), `page.posts.viewDetail` (mới).

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm vitest run src` | Lần 1: 2443/2444 PASS, 1 fail (máy đang tải nặng do builder T03/T04/T07 chạy song song; import 76% thời gian). Lần 2 (lọc `FAIL/×/timed out`): không có dòng fail → coi là flaky do tải, không do diff. Xem Residual risk. |
| `pnpm vitest run src/components/news src/components/posts src/lib/news src/lib/posts` | PASS — 11 files / 95 tests |
| `pnpm vitest run tests/integration/news.test.ts` (chạy riêng) | PASS — 28/28 (log `APIError categories` là của test validation có chủ đích) |

## Kiểm các điểm được yêu cầu

1. **Phân trang `/tin-tuc` khi loại bài nổi bật** — OK. `src/lib/news/news-listing.ts:33-52`: 2 truy vấn limit 1 song song (`featuredOnly` / mới nhất) → `leadDoc = flagged ?? newest`; lưới `listPublicNews({ page, excludeIds: [leadDoc.id] })` ở **mọi** trang nên offset nhất quán: không trùng, không mất bài; `featured` chỉ trả ở trang 1; `isEmpty` theo `newest.totalDocs`; `outOfRange` theo `grid.totalPages`. Hợp đồng được kiểm bằng unit test có fake `listPublicNews` thực thi filter thật (`NewsListPage.test.tsx:151,165,184,231` — trường hợp bài `isFeatured` KHÔNG phải mới nhất `n2`, trang 2 `excludeIds:["n2"]`, gộp trang 1+2 không trùng/mất) và integration `news.test.ts` (đủ mọi bài, không trùng, trang 2 không lặp bài nổi bật).
2. **Xoá khối / key không còn dùng (grep)** — OK cho phần xoá: không còn tham chiếu `news-home`, `NewsHomeBody`, `NEWS_FEATURED_COUNT`, `listChildNewsCategoriesOf`, `NewsTocSidebar` (chỉ còn trong test khẳng định đã xoá), `moreNews`, `featuredLabel`, `viewMoreIn`; `viewMore` còn ở namespace khác (`home.*`, RentalsTabs/FeaturedOffers) — không bị xoá nhầm. `LeadFormSlot` vẫn dùng ở 5 nơi khác — giữ đúng. Còn 2 key mồ côi do diff tạo ra (MINOR-1).
3. **SEO** — OK. Chi tiết bài: đúng 1 `h1` (`tin-tuc/[slug]/page.tsx` header), các `h2` cột phải/"Bài viết liên quan" sau nội dung; JSON-LD Article giữ nguyên; `Breadcrumb variant="plain"` vẫn phát `BreadcrumbList` (`Breadcrumb.tsx:85`, `jsonLd` mặc định true), mắt xích cuối = tiêu đề bài như trước. Danh sách: `h1` ở `PageHero`, thẻ `h2`. Metadata/canonical/hreflang không đổi (test `NewsListPage.test.tsx:259,270`).
4. **Form lead** — OK. `NewsListPage.tsx` `ConsultSection`: `LeadForm source="contact"` giữ nguyên trường, `id="lead-form"` giữ đích cuộn, chỉ ở `/tin-tuc` mọi trang (`belowContent` undefined khi có `context`), thứ tự `children → Pagination → belowContent → consultBanner` (`CategoryListTemplate.tsx:163-171`) đúng Q2 "cuối trang sau phân trang, trước banner". Test `:196,:231,:246`. `/tin-bds` không form. Cột phải bài viết: chỉ nút → `/lien-he`, không form (test `NewsDetailPage.test.tsx:98`).
5. **i18n vi/en** — OK. Key mới có đủ ở cả `vi.json`/`en.json` (`readArticle`, `newsDetail.*` 9 key, `posts.viewDetail`); test `/en` có (`NewsListPage.test.tsx:220`, `NewsDetailPage.test.tsx:130`).
6. **Không hex tự chế** — OK. Diff chỉ dùng token (`bg-dark`, `text-on-dark`, `text-on-dark-muted`, `text-primary`, `bg-surface`, `border-border`, `text-accent-text`…). Có giá trị arbitrary px/em (MINOR-3) nhưng không có màu hex.
7. **Không đầu khối canh giữa** — OK. Header bài viết `items-start text-left`; "Bài viết liên quan" dùng `SectionHeading` (canh trái, đúng T01); form `SectionHeading` trong thẻ `max-w-2xl` canh trái; bài nổi bật `items-start`. `mx-auto` chỉ ở container trang, không ở đầu khối.

## Responsive Checklist Gate (diff đụng UI; xác minh bằng CSS math + ảnh builder)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Bài viết: `lg:grid-cols-[minmax(0,48rem)_22rem]` — ở 1024 (container ≈ 1024 − 2×gutter) cột bài `minmax(0,…)` co về ≈ 560px, không tràn; < lg 1 cột. Bài nổi bật `lg:grid-cols-[1.3fr_1fr]`, < lg 1 cột; `min-w-0` ở cột chữ. Chip `scrollChips` cuộn ngang trong chính hàng chip (< sm). Thumb 84px trong `grid-cols-[84px_1fr]` an toàn ở 375. |
| Mobile-first (`min-width`) | OK | Chỉ dùng tiền tố `sm:/lg:` (min-width). |
| Grid không cột cố định | OK | Lưới 1 → `sm:grid-cols-2` → `lg:grid-cols-3` (375: 1 cột, 768: 2 cột, 1280: 3 cột); cột phải 22rem chỉ ≥ lg. |
| Container không fixed px | OK | `max-w-container`, `w-full`, `px-gutter`. |
| Font-size rem/token, heading fluid | OK | `text-h1/h3/body/small/eyebrow` (token của hệ). |
| Spacing theo scale | OK | `py-section-tight`, `gap-*` scale. |
| Media `max-width`/`aspect-ratio`/`sizes` | OK | `ResponsiveImage` với `aspectRatio` + `sizes` theo cột (`2/1` bìa, `16/10` nổi bật, `7/5` mini 84px). |
| Touch target ≥ 44px | OK | Link thẻ `min-h-11`, mini link `min-h-11`, danh mục `min-h-11`, nút `buttonVariants`, summary mục lục `min-h-11`, chip `min-h-11`. |
| Nav mobile | N/A | Không đụng header/nav. |
| Table scroll | N/A | Không có bảng mới (RichText giữ wrapper cũ). |
| Không `100vh` | OK | Không dùng; sticky `top-(--sticky-top)` + `lg:self-start`. |
| `prefers-reduced-motion` | OK | Chỉ `transition-colors` + `CARD_IMAGE_ZOOM` dùng chung sẵn có (không thêm animation mới). |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` chỉ để bo góc ảnh. |

## Skill gates
| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, `aislop` not installed | `command -v aislop` rỗng |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc.json`/`oxlint.json`; thay bằng `pnpm lint` 0 error |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` rỗng |
| AI-readable | OK (2 indicator < 3) | (a) `NewsDetailPage` ≈ 125 dòng (> 50; hàm page JSX vốn đã > 50 trước diff); (b) magic px (`lg:min-h-[340px]`, `w-[84px]`, `tracking-[0.12em]` lặp 5 chỗ). Tên rõ, comment chủ yếu WHY, indirection ≤ 2. Doc flow (design-spec S08/S10/S11) giao T08. |
| ai-friendly-web | N/A | Không đổi `robots`/`sitemap`/`llms.txt`; route sẵn có. |
| blitzstrike | skip | Không có môi trường pentest được phép; input/auth không đổi (LeadForm giữ nguyên). |

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
- **MINOR-1 — key i18n mồ côi do diff tạo ra.** `page.news.relatedTitle` (`src/i18n/messages/vi.json:213`, `en.json:213`) không còn ai gọi (chi tiết bài chuyển sang `page.newsDetail.relatedTitle`); `page.posts.resultCount` (`vi.json:241`, `en.json:241`) không còn ai gọi sau khi `PostListBody` bỏ dòng "Có N kết quả". Fix: xoá 2 key ở cả vi/en (hoặc ghi lý do giữ).
- **MINOR-2 — câu chữ task/spec mơ hồ về bài nổi bật ở trang danh mục.** Task `phase-1-task-06.md:20` ghi "bài nổi bật chỉ trang 1 `/tin-tuc` và trang 1 danh mục — giữ truy vấn hiện tại", còn spec BL-045 liệt kê bố cục "Tin tức (danh sách + danh mục)" có bài nổi bật ngang; builder chọn **không** có bài nổi bật ở danh mục (đúng "giữ truy vấn hiện tại", nhất quán với `/tin-bds/danh-muc` — `post-listing.ts:39`). Không chặn PASS vì Q2 chỉ định quy tắc cho trang 1 `/tin-tuc`, nhưng spec-validator cuối phase / T08 cần chốt lại câu chữ (hoặc hỏi user) để spec và code không lệch.
- **MINOR-3 — lặp class + giá trị arbitrary.** `FeatureNewsCard` (`NewsCard.tsx` mới) và `FeaturePostCard` (`PostCard.tsx`) có chuỗi class khung/ảnh/cột chữ gần như y hệt; eyebrow `text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase` lặp 5 chỗ (NewsCard, PostCard, page bài viết, NewsArticleSidebar ×2 biến thể). Đề xuất (không bắt buộc): đưa hằng `FEATURE_CARD_CLASS`/`EYEBROW_CLASS` vào `card-parts`. Ngoài ra `lg:min-h-[340px]`, `w-[84px]` là px cố định (không gây tràn).
- **MINOR-4 — đổi hành vi ngoài mockup cần ghi doc.** `/tin-bds` bỏ dòng "Có N kết quả" (`role="status" aria-live`) — hợp lý theo bố cục Tin tức (Q4), nhưng là thay đổi hành vi so với BL-032/S08 → T08 cập nhật design-spec S08 (builder đã ghi ở notes). Breadcrumb bài viết có thêm mắt xích tiêu đề bài (lệch mockup, giữ để BreadcrumbList không đổi) — chấp nhận, đã ghi.
- **MINOR-5 — khoảng trắng kép trước form.** `ConsultSection` có `pb-section-tight` sau khung danh sách vốn đã `pb-section-tight` (`CategoryListTemplate.tsx:150`) → đầu form không có padding trên riêng nhưng cuối danh sách có khoảng dưới đủ; chỉ là ghi chú thị giác, kiểm khi xem 1440.

## Residual risk
- Ảnh builder ở cỡ khung pane (~800px và ~468px), **không** phải 1440/390 chính xác; responsive đã xác minh bằng CSS math, nhưng so khớp pixel với mockup `news`/`article` ở 1440 + 390 chưa có bằng chứng — nên chụp lại đúng cỡ ở bước close-out/T08.
- `pnpm vitest run src` lần đầu có 1 test fail không tái hiện ở lần chạy thứ hai (máy tải nặng do 3 builder song song); các suite news/posts và integration news chạy riêng đều PASS. Nên chạy lại full suite một lần khi merge.
- Không thấy được thẻ nổi bật `/tin-bds` bằng mắt (DB dev không có tin `isFeatured`); có unit test `post-components.test.tsx`/`PostListPage.test.tsx`.

## Verdict
**PASS** — không CRITICAL/MAJOR. 5 MINOR (MINOR-1 nên sửa trước commit nếu tiện; MINOR-2 chuyển spec-validator/T08 chốt).
