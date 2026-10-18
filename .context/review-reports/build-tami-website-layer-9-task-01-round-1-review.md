Agent: reviewer

# Review — build/tami-website · layer-9-task-01 (Trang chủ S01) · round 1

- Worktree: `D:\prj\bds-wt9-t01` (branch `wt/l9-t01` từ b527146, chưa commit)
- Review level: **STRICT**
- Reason: trang LCP chính (CWV), carousel a11y (WAI-ARIA/WCAG 2.2.2), đọc global + 3 collection như khách, sửa file dùng chung (`guard-delete.ts` beforeDelete media, `post-queries.ts` findRelatedPosts, `json-ld.ts`, `layout/CtaBanner`, `services/ServiceCard`, `get-globals.ts`, `post-view.ts` export `toPublicImage`).
- Blast radius: `/vi`, `/en` (trang chủ); S09 chi tiết tin (gợi ý liên quan — `findRelatedPosts`); mọi trang dùng `CtaBanner` (S14…) và `ServiceCard` (S05/S06 dịch vụ); xoá media trong admin (guard 409, single + bulk, request en); JSON-LD; i18n `page.home`.

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 1954/1954 test PASS, 183/184 file; 1 suite FAIL `src/lib/contrast.test.ts` do CRLF worktree (đã biết, BL-004) — không liên quan diff. Không có test skipped trong summary → integration (`homepage.test.ts` guard xoá media) đã chạy trên DB |
| `pnpm build` | PASS (exit 0) |

## Kiểm đặc biệt

- **Lộ dữ liệu vào client/RSC — OK.** `ResponsiveImage` là Client Component; mọi ảnh vào nó/HeroSlider/ProjectsSlider đều qua `toPublicImage` (hero `home-view.ts:115`, about `:141`, dự án `:158`, dịch vụ `:187`, CTA `:172`; ưu đãi qua `toPostCards`). Bản ghi đọc lại bằng `findPublicList` (publicWhere: đã xuất bản, chưa xoá mềm, `/en` chỉ bản có EN); ưu đãi lọc `offerNotEndedWhere` + `isOfferEnded`. Global `homepage` (gồm group `translation`) chỉ dùng ở server, không truyền nguyên doc xuống client. `RichText` là Server Component.
- **CWV — OK (có residual).** Slide 1 `priority` → `preload` + `fetchPriority="high"`, `sizes="100vw"`; slide sau chỉ mount ảnh khi visited/1,5s; video chỉ mount ở client (`useSyncExternalStore` server snapshot `false`) nên HTML server/mobile không có `<video>`; hero cao cố định (`calc(100svh-4rem)`, `min-h-[560px]`) + ảnh/video `absolute` → không CLS; chữ slide 1 SSR ở trạng thái cuối (không bị ẩn chờ animation). JS client chỉ HeroSlider + ProjectsSlider.
- **ISR — OK (residual).** `/[locale]` là SSG, `revalidate = 60` (layout). `getHomepage` cache theo tag `global:homepage`; lưu homepage/dịch vụ làm mới tag + `/vi` `/en` (L8-T01). Dự án/ưu đãi đổi (ẩn/xoá mềm/hết hạn) không làm mới `/vi` `/en` → trễ tối đa 60s (xem MINOR-4).
- **`guard-delete` dùng `req.payload.db.findGlobal` — OK.** Adapter không chạy access/afterRead và không ghi đè `req.locale`; chỉ cần id quan hệ (không localized); `req` giữ cùng transaction. Có test request `en` + bulk + video/about/cta/OG.
- **`CtaBanner`/`ServiceCard` — OK.** Prop mới tuỳ chọn, mặc định giữ nguyên markup/class cũ (`cn(base, undefined)`), trang khác không đổi.
- **`findRelatedPosts` — OK.** Vẫn đi qua `listPostsWhere` (scope `property_post` + publicWhere), bài còn hạn trước, bù bài đã kết thúc; có test 3 case.
- **Merge risk:** `src/i18n/messages/{vi,en}.json` — T01 và T08 đều chèn key mới ở cuối object `page` (sau `legal`) → gần chắc conflict text, resolve tay giữ cả `page.home` và `page.loading`. `src/payload-types.ts` (T01 chỉ đổi EOL, T08 có thể đổi thật) → bỏ file này khỏi commit T01. `docs/ERD.md` — staging (L9-T03) cũng sửa ERD nhưng khác mục (Leads vs §4.15) → khả năng auto-merge. `docs/ARCHITECTURE.md` chỉ T08 đụng.
- **Lệch design-spec (gap, không tính FAIL vì builder đã khai):** header trong suốt đè hero (S01.1) chưa làm; khối Đối tác (FR-PUB-17) bỏ qua. Cần ghi gap/task riêng ở spec-validation layer 9.

## Responsive Checklist Gate (diff đụng UI; xác minh bằng CSS math, không có browser)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Slider/bento cuộn ngang nằm trong `ul overflow-x-auto`; watermark About trong section `overflow-hidden` (trang trí, `aria-hidden`); builder đo 375/1280 |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm/md/lg` của Tailwind |
| Grid không cột cố định | OK | Bento `md:grid-cols-12`/`lg:grid-cols-12` theo số mục, mobile 1 cột; ≥4 mục → hàng cuộn % width |
| Container không fixed px | OK | `max-w-container` + `px-gutter`; `lg:w-[440px]` khung chữ dự án chỉ ≥1024px trong slide `min(80%,1100px)` |
| Typography rem/fluid | OK | Token `text-display/h1/h2/lead` (design tokens) |
| Media `aspect-ratio` | OK | Hero absolute trong khung cố định; dự án `aspect-[4/5] md:aspect-[16/9]`; about `aspect-[4/3] md:aspect-[4/5]`; dịch vụ theo frames |
| `sizes` đúng | OK | hero `100vw`; dự án `(min-width:1024px) 1100px, (min-width:768px) 80vw, 88vw` khớp width slide; about khớp cột |
| Touch target ≥44px | **FAIL** | Xem MAJOR-4: ở 375px, ≥6–8 slide → chấm phân trang chồng nút Dừng |
| Nav mobile | N/A | Không đổi header/nav |
| Table | N/A | Không có bảng mới |
| Không `100vh` đơn thuần | OK | `100svh`; trình duyệt không hỗ trợ `svh` → `min-h-[560px]` làm sàn |
| `prefers-reduced-motion` | OK | `motion-reduce:*`, autoplay/video tắt, `scrollIntoView` `behavior:auto` |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` chỉ cắt ảnh/watermark trang trí |

## Skill gates

- aislop: skip, `aislop` not installed (`command -v` rỗng).
- anti-slop/oxlint: skip, oxlint not configured (không có `.oxlintrc.json`); ESLint PASS.
- open-code-review (ocr): skip, ocr not installed.
- AI-readable: OK — 1 indicator (component `HeroSlider` ~150 dòng > 50, nhưng là JSX một khối); file ≤ 300 dòng, tên rõ, comment chủ yếu WHY, ERD §4.15 as-built đã cập nhật. < 3 indicators.
- ai-friendly-web: OK — trang public; `robots.txt`/`sitemap.xml`/`llms.txt` có từ L8-T05 (build liệt kê route), JSON-LD Organization + WebSite.
- blitzstrike: skip (không có môi trường pentest; task không có input/auth mới).

## Findings

### [MAJOR-1] Hero 1 slide có video: không có nút Dừng cho video tự chạy lặp (WCAG 2.2.2)
`src/components/home/HeroSlider.tsx:151` — toàn bộ điều khiển (kể cả nút Dừng/Phát `:172-181`) nằm trong `{multiple && …}`, trong khi `HeroVideo` (`:31`, `autoPlay loop muted`) vẫn mount khi `count === 1` (`:130`). Video chuyển động > 5s, tự chạy, không có cách dừng. Test `HeroSlider.test.tsx:137` còn khẳng định "1 slide: không nút điều khiển".
Fix: tách nút Dừng/Phát khỏi `multiple`: hiện khi `multiple || (videoAllowed && slides[index].videoUrl)` (và `!reducedMotion`); thêm test 1 slide + video → có nút Dừng, bấm → `video.pause()`.

### [MAJOR-2] Đổi slide bằng phím mũi tên khi focus đang ở nút CTA của slide → mất focus
`HeroSlider.tsx:81-85, 108` — `onKeyDown` gắn ở `section` nên bắt ArrowLeft/Right từ mọi phần tử con, kể cả `Link` CTA trong slide đang hiện (`:140-143`). `goTo` làm slide đó `inert` + `aria-hidden` (`:123-124`) → trình duyệt bỏ focus về `body`, `onBlur` (`:105-107`) đặt `focused=false` → autoplay chạy lại. Trái yêu cầu "focus không mất khi đổi slide".
Fix: chỉ xử lý mũi tên khi focus ở chính region/điều khiển (dots, prev/next), hoặc sau `goTo` chuyển focus vào slide mới (container `tabIndex={-1}`) nếu `document.activeElement` nằm trong slide cũ; thêm test RTL: focus CTA → ArrowRight → `document.activeElement` không phải `body`.

### [MAJOR-3] `h1` của trang nằm trong slide 1 nên bị `aria-hidden` + `inert` khi slide khác hiện
`HeroSlider.tsx:116, 123-124, 138` — khi autoplay/người dùng sang slide 2…n, `h1` biến khỏi cây a11y (trình đọc màn hình duyệt theo heading không thấy `h1` trong phần lớn thời gian, n−1/n chu kỳ). `HomeBlocks.tsx:30-33` chỉ thêm `h1` ẩn khi slide 1 không có title.
Fix: `h1` đặt NGOÀI các slide (vd `h1.sr-only` = title slide 1, hoặc luôn tên site) và tiêu đề hiển thị của mọi slide là `p`/`h2` `aria-hidden` theo slide; hoặc giữ `h1` ở slide 1 nhưng không đặt `aria-hidden`/`inert` lên phần tử chứa nó. Cập nhật test `HeroSlider.test.tsx:49`/`HomeBlocks.test.tsx:106`: sau khi đổi slide vẫn `getByRole("heading",{level:1})`.

### [MAJOR-4] Responsive/touch: ở 375px với 7–8 slide, chấm phân trang chồng nút Dừng
`HeroSlider.tsx:153-170` (hàng chấm căn giữa, `bottom-4`, mỗi chấm `size-11` = 44px) và `:177` (nút Dừng `absolute right-gutter bottom-4`). Ở 375px `--spacing-gutter` = clamp(1rem, 0.6rem+1.7vw, 2rem) ≈ 16px → nút Dừng chiếm x∈[315,359]. Hàng chấm rộng 44·n: n=6 → [55.5,319.5] (chồng 4.5px); n=7 → [33.5,341.5] (chồng 26.5px); n=8 → [11.5,363.5] (nút Dừng phủ ~40/44px của chấm 8, cả icon). `maxRows 8` của schema cho phép. Nút Dừng render sau nên đè, chấm cuối gần như không bấm được.
Fix: đặt nút Dừng cùng flex row với chấm (vd `flex gap-2`, nút ở đầu hàng — WAI khuyên điều khiển xoay đứng đầu thứ tự tab) hoặc giảm vùng chấm ở mobile (`size-11` giữ nhưng `gap` 0 + chừa `pr` bằng nút); test/ghi phép tính ở 375 với 8 slide.

### [MINOR-1] `src/payload-types.ts` chỉ đổi EOL
`git diff --ignore-cr-at-eol` rỗng. Bỏ khỏi commit để tránh conflict với T08/staging.

### [MINOR-2] Vùng cuộn `tabIndex=0` không có tên truy cập
`ProjectsSlider.tsx:57`, `ServicesBento.tsx:20` — `ul` focus được nhưng không `aria-label`/`aria-labelledby` (SR đọc "list" vô danh khi tab vào). Fix: `aria-labelledby={labelledBy}` / id tiêu đề `h2`.

### [MINOR-3] Vuốt hero không phân biệt cuộn dọc
`HeroSlider.tsx:86-95` — chỉ so `|dx| ≥ 50`, cuộn trang chéo trên mobile đổi slide ngoài ý muốn. Fix: lưu cả `clientY`, chỉ đổi khi `|dx| > |dy|`.

### [MINOR-4] Dự án/ưu đãi ẩn/xoá mềm/bỏ isFeatured không làm mới `/vi` `/en`
`load-home.ts:69` đọc trực tiếp, trang SSG `revalidate = 60` → bản ghi đã ẩn còn hiện trên trang chủ tối đa 60s. Chấp nhận được theo chính sách ISR hiện tại; nếu spec yêu cầu tức thì → thêm `/vi` `/en` vào hook revalidate của projects/property-posts. Ghi residual.

### [MINOR-5] Thứ tự tab: nút Dừng đứng sau toàn bộ chấm
`HeroSlider.tsx:153-181` — WAI-ARIA carousel khuyến nghị nút xoay là phần tử đầu tiên trong carousel. Gộp với fix MAJOR-4.

## Residual risk

- Responsive/touch xác minh bằng CSS math, không chạy browser; CLS/LCP thực đo dựa vào báo cáo builder (preload hero, không cuộn ngang 375/1280).
- Header trong suốt đè hero (S01.1) và khối Đối tác chưa làm — gap cho spec-validation layer 9.
- Conflict i18n `page.home` (T01) vs `page.loading` (T08) khi merge.
- `contrast.test.ts` FAIL do CRLF worktree (BL-004), không do diff.

## Verdict

**FAIL** — 4 MAJOR (WCAG 2.2.2 video 1 slide, mất focus khi đổi slide, `h1` bị ẩn khỏi cây a11y, chồng touch target 375px — Responsive gate FAIL). Logic dữ liệu, chống lộ dữ liệu, guard xoá media, `findRelatedPosts`, file dùng chung: không có lỗi chặn. Builder sửa MAJOR-1..4 (+ MINOR-1 nên làm cùng) rồi review round 2.
