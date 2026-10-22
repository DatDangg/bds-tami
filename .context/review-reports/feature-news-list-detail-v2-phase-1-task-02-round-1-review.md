Agent: reviewer

# Review: feature-news-list-detail-v2 · phase-1-task-02 · round 1 (BL-062, redesign trang chi tiết Tin tức)

- **Review level:** STRICT
- **Reason:** Task có DB schema + migration (cột localized mới trong `site_settings_locales`) và sửa component dùng chung (`ShareButtons`, `NewsCard`, `Breadcrumb` variant overlay, khung dính `DetailAsideFit` / `DETAIL_ASIDE_STICKY_CLASS`). Theo luật reviewer trong AGENTS.md, hai loại risk này bắt buộc STRICT.
- **Blast radius:**
  - Trang `/tin-tuc/[slug]` và `/en/news/[slug]`: hero, thân bài, cột trái, khung liên hệ, thẻ tag, bài liên quan.
  - CSS `.news-prose` trong `globals.css`. Lớp này chỉ trang tin dùng.
  - `ShareButtons`: thêm prop `tone`, mặc định giữ nguyên, nên tuyển dụng và `DetailShareButton` không đổi.
  - `NewsCard`: thêm biến thể `related`. Các biến thể `card`, `grid`, `row` không đổi.
  - `Breadcrumb` overlay: đụng mọi trang dùng `PageHero` / hero overlay.
  - Global `site-settings`: thêm tab "Tin tức" và cột DB mới.
  - `TRANSLATABLE_FIELDS["site-settings"]`: thêm `newsDetail`, nên bản EN sẽ được tự dịch.
  - `payload-types.ts`: 2 hunk thuộc BL-062.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm test` (đủ bộ, sau lần sửa cuối `leaves.ts`) | **PASS**: 422/422 file, 4430/4430 test, exit 0 |
| `pnpm typecheck` | **PASS** (exit 0) |
| `npx eslint` trên các file đổi (page, `src/components/news`, Breadcrumb(+test), SiteSettings, `news-detail`(+test), loader(+test), `leaves.ts`) | **PASS**: 0 lỗi |
| `pnpm build` | **skip**: dev server `:3000` đang dùng `.next`, chạy build sẽ ghi đè. Builder báo PASS. Typecheck và test đã tự chạy lại xác nhận. |

## Migration / schema (gate)
- **OK** `migrations/20261022_172224_news_detail_contact_note.ts`
  - up: chỉ có `ALTER TABLE "site_settings_locales" ADD COLUMN "news_detail_contact_note" varchar;`. Cột nullable, SAFE_ADDITIVE, không có lệnh lạ.
  - down: `DROP COLUMN` đúng cột đó.
- **OK** Snapshot `.json` có `news_detail_contact_note` varchar, `notNull: false` (dòng 22302), khớp với SQL.
- **OK** `migrations/index.ts` đăng ký migration đúng thứ tự cuối.
- **OK** `payload-types.ts` chỉ thêm `newsDetail?.contactNote` và Select. Field là `textarea`, `localized`, `maxLength 500`, `trimText`, nhãn tiếng Việt, đặt trong tab "Tin tức", giữ `access`.

## Checklist yêu cầu bắt buộc
- **OK** Khung liên hệ là văn bản thuần:
  - `NewsArticleContactNote.tsx:20-37` render qua `split(brand)` thành React text node, không dùng `dangerouslySetInnerHTML`.
  - Có test "HTML trong chữ không được render" (`NewsDetailPage.test.tsx:201`).
- **OK** Không lấy chữ VI cho `/en`: `read-global.ts:13` dùng `fallbackLocale: false`. Chuỗi rỗng hoặc chỉ khoảng trắng thì loader trả `undefined` và trang dùng câu i18n. Global lỗi thì cũng về câu mặc định (`load-news-contact-note.ts`).
- **OK** Link "TAMI REAL ESTATE" trỏ tới `publicPath("/lien-he", locale)#lead-form`. Test ở `NewsDetailPage.test.tsx:210/218/224` kiểm cả `/lien-he#lead-form` và `/en/contact#lead-form`.
- **OK** Cache: loader đi qua `getSiteSettings` = `unstable_cache`, tag `site-settings`. Đây là cùng cơ chế revalidate như các trường site-settings khác. Chưa kiểm bằng cách lưu thật trên admin (xem Residual).
- **OK** Cấu trúc cột dính:
  - Lưới `lg:grid-cols-[15rem_minmax(0,1fr)]`, không có `items-start`.
  - Ô trái là `DetailAsideFit as="div"`, con đầu mang `DETAIL_ASIDE_STICKY_CLASS`, `--detail-aside-top` đặt ở ô.
  - "Bài viết liên quan" và banner nằm ngoài lưới.
  - DOM < lg đúng thứ tự: thân bài, khung liên hệ, Thẻ, rồi cột trái.
- **OK** A11y:
  - Trang có đúng 1 `h1` (trong hero). Phần header cũ đã xoá.
  - TOC giữ `aria-current="location"`, số thứ tự để `aria-hidden`.
  - Nút chia sẻ on-dark có `aria-label`/`title`, focus `outline-on-dark`.
  - Link khung liên hệ và chip danh mục có `focus-visible`.
- **OK** `ol` không thành ✓ vì selector chỉ áp cho `ul.list-disc`.
- **OK** Hero không ảnh bìa: nền `bg-dark-deep`, không có `img`, có test.
- **OK** Các nơi gọi khác của `ShareButtons` / `NewsCard` không đổi. Riêng `Breadcrumb` có thay đổi hành vi nhỏ, xem MINOR-2.

## Findings

### [MAJOR-1] Từ mục `h2` thứ 2 trở đi bị thụt vào 3.25rem, số tròn lệch khỏi rãnh và chữ đoạn không thẳng hàng tiêu đề (vi phạm D5)
- **Vị trí:** `src/app/(frontend)/globals.css:458-461`, trong `@media (min-width: 48rem)`:
  ```css
  .news-prose > h2 ~ *,
  .news-prose > h2 ~ ul.list-disc { margin-inline-start: 3.25rem; }
  ```
- **Nguyên nhân:** `h2 ~ *` khớp cả các `h2` đứng sau `h2` đầu tiên. Không có rule nào reset margin cho `h2`, và CSS này nằm ngoài `@layer` nên thắng utility.
- **Hậu quả, từ mục 02 trở đi:**
  - Số tròn nằm ở 3.25rem thay vì 0.
  - Chữ tiêu đề nằm ở 6.5rem, trong khi đoạn văn và `ul` sau nó vẫn ở 3.25rem, nên đoạn văn chạy lệch dưới số tròn.
  - Cả trang thành dạng bậc thang: mục 01 lệch trái hơn các mục còn lại.
- **Bằng chứng:** `.context/review-reports/assets/bl062-p1t02-full-1440.png`. Ở ảnh thu nhỏ, số "01" ở x≈150, còn "02"–"05" ở x≈168 (≈ 52px thật ở 1440). Chữ đoạn dưới mục 02+ thẳng hàng với số tròn, không thẳng hàng với chữ tiêu đề. D5 yêu cầu "chữ đoạn / `ul` / ảnh thẳng hàng chữ tiêu đề (không chạy dưới số)".
- **Cách sửa:** Loại trừ `h2` khỏi selector, rồi kiểm lại 1440 / 768 với bài có ≥ 2 `h2` và chụp lại ảnh giữa bài. Một trong hai cách:
  - Đổi selector thành `.news-prose > h2 ~ :not(h2)`.
  - Hoặc thêm `.news-prose > h2 ~ h2 { margin-inline-start: 0; }` trong cùng media query.

### [MINOR-1] Chữ `text-on-dark/90` ở hero chưa chắc đạt AA trong trường hợp xấu nhất
- **Vị trí:** `NewsArticleHero.tsx:63` (ngày / phút đọc) và `ShareButtons.tsx:579` (nhãn "Chia sẻ:" khi `onDark`).
- **Vấn đề:** Phép tính của builder (5.07:1) chỉ đúng cho chữ trắng 100%. Chữ trắng 90% trên ảnh trắng, chỉ qua scrim 0.6, cho nền ≈ rgb(114,110,103) và chữ ≈ rgb(241,240,240), tức ≈ **4.48:1 < 4.5**.
  - "Chia sẻ:" nằm bên phải hero ở ≥ lg, nơi gradient trái→phải đã nhạt hết, nên chỉ còn scrim nền.
  - Rủi ro thấp vì ảnh thật hiếm khi trắng tuyệt đối.
- **Cách sửa:** Dùng `text-on-dark` đặc cho 2 chỗ này. Hoặc đo mẫu pixel trên ảnh sáng nhất và ghi số đo.

### [MINOR-2] Đổi thứ tự `cn` trong `Breadcrumb` cũng đổi `ol` overlay ≤ 3 mục từ `inline-flex` sang `flex`
- **Vị trí:** `src/components/layout/Breadcrumb.tsx:64`.
- **Đánh giá:** Sửa đúng bug thật (`hidden` bị `inline-flex` của `PILL_CLASS` nuốt khi > 3 mục). Bug này lộ ra vì trang tin giờ dùng overlay 4 mục. Có test hồi quy, nên chấp nhận.
- **Lưu ý:** Với `parent` rỗng, `flex` giờ đứng cuối nên thắng `inline-flex`. Các hero overlay ≤ 3 mục (`PageHero` danh sách, tuyển dụng, …) đổi display. Có `w-fit` nên gần như không khác về hình, nhưng câu "overlay ≤ 3 mục không đổi" trong Verification summary chưa chính xác.
- **Đề xuất:** Không bắt buộc sửa. Nếu muốn giữ nguyên tuyệt đối, chỉ thêm `hidden md:flex` sau PILL khi có `parent`, còn lại giữ `inline-flex`.

### [MINOR-3] Sapo trong hero bị `line-clamp-4` (`NewsArticleHero.tsx:55`)
- **Vấn đề:** Ảnh 390 cho thấy sapo bị cắt bằng "…". Cắt sapo không có trong Quyết định 1. Nội dung vẫn có trong meta và thân bài nên không mất thông tin quan trọng.
- **Đề xuất:** Ghi vào design-spec như một quyết định phụ, hoặc bỏ clamp ở ≥ lg.

## Responsive Checklist Gate (diff đụng UI)
Kiểm bằng CSS math, ảnh của builder và số đo builder ghi. Reviewer không có browser.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | Builder đo `scrollWidth === clientWidth` ở 768/390. Lưới dùng `minmax(0,1fr)`, `min-w-0`, khung liên hệ có `[overflow-wrap:anywhere]`. |
| Mobile-first `min-width` | OK | Media `min-width: 48rem`, utility `md:` / `lg:`. |
| Grid `auto-fit`/`minmax`, không cột cố định | OK | `lg:grid-cols-[15rem_minmax(0,1fr)]` chỉ áp ≥ lg (cột trái 15rem theo design). Lưới liên quan 1/2/3 cột theo breakpoint, cùng pattern sẵn có. |
| Container không fixed px | OK | `max-w-container px-gutter`, rem. |
| Font rem / heading fluid | OK | Token `text-h1` / `text-h3` / `text-lead`. CSS dùng `var(--text-*)`. |
| Spacing scale | OK | `py-section-tight`, gap theo scale. Rãnh 3.25rem lặp ở CSS và `NewsArticleContactNote` (ghi chú). |
| Media `max-width` / `aspect-ratio` | OK | Hero `ResponsiveImage` phủ tuyệt đối `sizes="100vw"` `priority`. Thẻ liên quan `aspectRatio 16/7` + `sizes`. |
| Touch ≥ 44px | OK | Nút chia sẻ `size-11`, chip danh mục `min-h-11`, tag `min-h-11` (< lg), breadcrumb `min-h-11`. Link "TAMI REAL ESTATE" là link trong dòng chữ, được miễn theo WCAG 2.5.8. |
| Nav mobile | N/A | Không đổi header. |
| Table scroll wrapper | N/A | Không đổi (RichText sẵn có). |
| Không dùng `100vh` thuần | OK | TOC `max-h` dùng `100dvh`. Hero `min-h` rem. |
| `prefers-reduced-motion` | OK | Chỉ có `transition-colors`, không thêm animation chuyển động. |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` ở hero chỉ để cắt ảnh nền. |
| Bố cục nội dung ≥ md | **Không tính FAIL responsive** | Lỗi thụt `h2` là lỗi bố cục desktop / tablet (MAJOR-1), không phải lỗi responsive. Đã tính ở Findings. |

## Skill gates
- **aislop:** skip, `aislop` chưa cài (`which` không thấy).
- **oxlint (anti-slop):** skip, oxlint chưa cấu hình (không có `.oxlintrc*`). ESLint 0 lỗi.
- **ocr (open-code-review):** skip, `ocr` chưa cài.
- **AI-readable:** OK, 1 indicator (< 3).
  - Tên rõ, comment giải thích lý do, hàm mới ≤ 50 dòng (`NewsArticleHero` ≈ 47 dòng thân).
  - Indicator duy nhất: magic `3.25rem` lặp giữa CSS và TSX, có comment chú thích.
  - Doc as-built đã cập nhật (`design-spec.md`, `DESIGN.md`, `ERD.md`).
- **ai-friendly-web:** N/A. Không đổi metadata / robots / sitemap, trang giữ canonical và JSON-LD.
- **blitzstrike:** skip. Không phải auth / API public. Bề mặt nhập liệu duy nhất là textarea admin, đã xác minh render thuần text.

## Residual risk
- Chưa xem bằng mắt `/en/news/[slug]` (DB không có bài EN), luồng lưu admin → trang, và hero không ảnh bìa. Cả ba chỉ được phủ bằng test.
- Contrast hero tính theo cận lý thuyết, chưa lấy mẫu pixel từng ảnh.
- `pnpm build` reviewer không chạy lại (lý do ở bảng verify).
- `newsDetail` nằm trong `TRANSLATABLE_FIELDS`, nên bản EN sẽ được tự dịch từ VI. Chưa xác minh bản dịch máy có giữ nguyên chuỗi "TAMI REAL ESTATE" hay không. Nếu bị dịch, link thương hiệu ở `/en` sẽ mất.

## Verdict
**FAIL**: còn 1 MAJOR (MAJOR-1: các `h2` từ mục 02 bị thụt sai, vi phạm D5). Builder sửa selector CSS, kiểm lại ảnh 1440 / 768 với bài có ≥ 2 `h2`, rồi review round 2. Có thể xử lý luôn MINOR-1 (dùng `text-on-dark` đặc).
