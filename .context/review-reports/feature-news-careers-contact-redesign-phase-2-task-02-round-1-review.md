Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-2-task-02 · round 1

Chi tiết tin tức `/tin-tuc/[slug]` (BL-054). Worktree `.worktrees/feature-news-careers-contact-redesign__phase-2__task-02` (chưa commit, base staging 2b99a60).

- **Review level:** STRICT
- **Reason:** trang chi tiết ISR; CSS mới cho nội dung `RichText` (component dùng chung với trang dự án / dịch vụ / pháp lý); `ShareButtons` dùng chung (tuyển dụng, `DetailShareButton`); gắn beacon đếm lượt xem; xoá key i18n.
- **Blast radius:** `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `src/components/news/{NewsArticle,NewsArticleSidebar,NewsToc,ShareButtons}.tsx`, `src/app/(frontend)/globals.css` (thêm khối `.news-prose`, các rule cũ không đổi), `src/lib/news/news-queries.ts` (bỏ hằng `LATEST_NEWS_COUNT`), `src/i18n/messages/{vi,en}.json` (thay `page.newsDetail.*` bằng `page.newsDetail.v2.*`, bỏ `page.news.readArticle`), các doc `.context/design-spec.md`, `docs/DESIGN.md`, `docs/ERD.md`. Không đổi API, schema hay migration. `src/payload-types.ts` chỉ khác line ending: `git diff --ignore-all-space --ignore-cr-at-eol` ra rỗng.

## Verify commands + result
| Lệnh (chạy trong worktree) | Kết quả |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, không thuộc diff |
| `pnpm vitest run src/components/news src/components/content src/components/detail src/i18n "src/app/(frontend)/[locale]/tin-tuc" src/lib/news src/components/careers` | PASS: 29 file, 301 test (có cả careers vì `ShareButtons` dùng chung) |
| `pnpm vitest run tests/integration/news.test.ts` | PASS: 32 test (WARN dịch job là log có sẵn) |
| `pnpm build` | không chạy lại (Postgres dùng chung đang tải cao); builder báo PASS, route vẫn `●` ISR → Residual risk |

## Kiểm trọng tâm
- **Style chỉ áp ở bài tin:** `RichText.tsx` không đổi. Lớp `news-prose` chỉ gắn ở `NewsArticleBody` (`NewsArticle.tsx:106`), các selector đều theo dạng `.news-prose > …` nên trang dự án / dịch vụ / pháp lý không bị ảnh hưởng. Gốc `RichText` là một `div` render thẳng các node cấp gốc (`RichText.tsx:274`), nên selector con trực tiếp khớp đúng p / ul / ol / h2 / blockquote. Selector `ul.list-disc` loại được khối số liệu (`StatHighlights` không có `list-disc`). Có test khoá việc chỉ một file dùng `news-prose`. OK.
- **Key i18n đã xoá:** grep `src` và `tests` (`latestEyebrow|latestTitle|relatedEyebrow|relatedTitle|relatedAccent|readArticle|LATEST_NEWS_COUNT|latest-news`) không còn chỗ nào dùng. `latestTitle` duy nhất còn lại thuộc `page.news.v2` (`NewsListBody.tsx:30`), là key khác và vẫn có trong cả vi.json lẫn en.json. Namespace `page.newsDetail` chỉ còn được gọi qua `.v2`. Không thấy template string động nào trỏ vào namespace đã xoá. OK.
- **SEO:** JSON-LD `Article` giữ nguyên (`page.tsx:178-191`). `BreadcrumbList` vẫn do `Breadcrumb` phát (`jsonLd` mặc định true). `generateMetadata` không đổi. Trang chỉ có 1 `h1` (`NewsArticleHeader`); "Bài viết liên quan" và thẻ tư vấn dùng `h2`. OK.
- **Beacon:** `NewsViewBeacon` chỉ được render ở `page.tsx:124`, một lần, với `doc.id` (grep chỉ ra trang này và test). Trang vẫn ISR vì beacon là client component. OK.
- **Mục lục a11y:** link `#id` thật; `aria-current="location"` chỉ ở bản sidebar; heading có `id` + `tabIndex=-1` + `scroll-mt` (từ `RichText`). `PAGE_RESERVED_IDS` đã bỏ `latest-news` vì id này không còn trên trang. Bản sidebar dùng `hidden lg:block`, bản gập dùng `lg:hidden`, nên mỗi breakpoint chỉ một `nav` được hiển thị. Có dọn rAF, listener và timer khi unmount. OK.
- **Chia sẻ:** URL đi qua `encodeURIComponent`; link ngoài có `rel="noopener noreferrer"` + `target="_blank"`; `navigator.share` đọc bằng `useSyncExternalStore`, server trả false nên không lệch hydrate; huỷ bảng chia sẻ thì bỏ qua. Nút icon có `aria-label`; chữ "Zalo" để `aria-hidden` trong link đã có nhãn. Biến thể mặc định giữ nguyên hành vi (test careers / detail PASS). OK.
- **Ảnh bìa:** có `caption` thì ảnh giữ `alt`; chỉ có `alt` thì chú thích lấy `alt` và ảnh là decorative; không có cả hai thì `alt` = tiêu đề. Không bị đọc hai lần. OK.
- **Tags ở `/en`:** truyền mảng rỗng nên không render dòng "Thẻ:". Link tag dựng bằng `URLSearchParams` nên đã được encode. OK.
- **So với design `chi-tiet-tin-tuc.webp`:** bố cục khớp (cột trái mục lục + thẻ tư vấn, badge, h1, sapo, hàng tác giả + chia sẻ, ảnh + chú thích, đoạn mở đầu đóng khung, số tròn h2, trích dẫn, dấu tích, Thẻ:, Bài liên quan + Xem tất cả, banner). Các điểm lệch đã ghi ở design-spec: thẻ tư vấn không có ảnh, avatar dùng logo thay chữ "T".

## Responsive Checklist Gate (390 / 768 / 1440, đối chiếu bằng ảnh builder + CSS math)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Builder đo `scrollWidth == clientWidth` ở 1440 / 768 / 390. Ảnh `bl054-p2t02-vi-{1440,390}.png` không thấy tràn. Lưới `lg:grid-cols-[13.5rem_minmax(0,1fr)]`, cột có `min-w-0`; RichText có `overflow-wrap:anywhere`; `.news-prose` chỉ thêm `padding-inline-start: 3.25rem` từ `min-width:48rem` |
| Mobile-first media query | OK | CSS mới chỉ dùng `@media (min-width: 48rem)`; utility đều là `md:` / `lg:` / `sm:` |
| Grid / container | OK | Lưới 1 cột dưới lg; bài liên quan `sm:2 / lg:3` cột trong `max-w-container`; cột trái cố định 13.5rem chỉ từ lg, cột bài `minmax(0,1fr)` |
| Typography rem / clamp | OK | Token `text-h1` / `text-lead` / `--text-xsmall`; kích thước mới đều bằng rem, chỉ có `1px` cho viền |
| Media | OK | `ResponsiveImage` `aspectRatio="2/1"` + `sizes`; thẻ liên quan có `sizes` riêng |
| Touch target ≥ 44px | OK | Nút share `size-11`; link TOC `min-h-11`; badge và "Xem tất cả" `min-h-11`; chip tag `min-h-11` (từ lg là 36px, môi trường con trỏ) |
| Nav / table | N/A | Không đổi header; bảng vẫn dùng wrapper `tableWrap` sẵn có |
| 100vh / dvh | OK | Dùng `max-h-[45dvh]`, không có `100vh` |
| Reduced motion | OK | `scrollToHeading` sẵn có (BL-033) cuộn tức thì khi giảm chuyển động; chỉ thêm `transition-colors` |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` chỉ ở khung ảnh bo góc; nav TOC dùng `overflow-y-auto` có chủ đích |

## Skill gates
- aislop: skip, không cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint. `pnpm lint` (ESLint) cho 0 error
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK. Tên rõ; hàm ngắn (`NewsTocSidebar` khoảng 50 dòng, logic tách ra `findActiveId` / `TocLinks`); magic number `ACTIVE_LINE_PX` / `SCROLL_LOCK_MS` có hằng tên + comment WHY; `DESIGN.md` / design-spec đã cập nhật. 0 indicator.
- ai-friendly-web: N/A, không đổi robots / sitemap / llms
- blitzstrike: skip, không có môi trường; input duy nhất là tag/URL đã được encode

## Findings
- [CRITICAL] none
- [MAJOR] none
- [MINOR] `src/components/news/NewsArticleSidebar.tsx:23`: cả `aside` (mục lục ≤ 45dvh + thẻ tư vấn) được sticky. Trên màn lg thấp (khoảng ≤ 700px cao) và bài có nhiều heading, phần dưới của `aside` có thể cao hơn viewport và nút "Nhận tư vấn" bị khuất cho tới cuối bài. Đề xuất (task sau, không chặn): giảm `max-h` theo `calc(100dvh - var(--sticky-top) - <chiều cao thẻ>)` hoặc chỉ sticky phần mục lục.
- [MINOR] `docs/ERD.md:361`: ghi chú `news.content` có node `block` là reconcile còn thiếu của P1-T02, không có trong Doc impact của task này lúc lập kế hoạch. Nội dung đúng và đã ghi ở mục Doc impact của task file. Chấp nhận, nhưng nên nêu trong commit body.
- [MINOR] `src/app/(frontend)/globals.css` khối `.news-prose`: dấu số h2 / dấu ngoặc dùng `content: … / ""`. Trình duyệt không hỗ trợ cú pháp này sẽ dùng khai báo dự phòng và có thể đọc "01". Builder đã ghi nhận; chấp nhận.

## Residual risk
- Không chạy lại `pnpm build` và chưa đo lại ở trình duyệt. Mốc 768 chỉ có một ảnh `bl054-p2t02-vi-768.png` + số đo của builder.
- Contrast của `accent-text` (chữ cỡ xsmall, đậm 600) trên `primary-subtle` ở số tròn h2, và `text-secondary` trên `primary-subtle` ở đoạn mở đầu: dựa vào token đã kiểm ở các task trước, không đo lại lần này.

## Verdict
PASS — không có CRITICAL hay MAJOR; typecheck, lint, unit (301) và integration (32) đều PASS.
