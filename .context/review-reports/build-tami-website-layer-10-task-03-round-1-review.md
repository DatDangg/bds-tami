Agent: reviewer

# Review: build tami-website, layer-10-task-03, round 1

- Task: `tasks/tami-website/layer-10-task-03.md` (hoàn thiện bản EN: en.json, chuyển ngôn ngữ đúng trang, hreflang, follow-up L9-T01 và L10-T01)
- Code: worktree `D:/prj/bds-wt10-t03` (branch `wt/l10-t03`, base `5dbce88`, chưa commit)
- Review level: **STRICT**
- Reason: điều hướng song ngữ toàn site (component dùng chung `Header`/`LanguageSwitcher`/`HeaderFrame`); route API công khai mới `/api/locale-counterpart` trả 302 dựa trên input của người dùng (rủi ro open redirect, lộ bản ghi); CSS dùng chung (`globals.css`, token khối tối); sửa/xoá khoá i18n dùng toàn site.
- Blast radius: mọi trang công khai (header, nút chuyển ngôn ngữ ở header và menu mobile), trang chủ (hero, h1), `/api/locale-counterpart` (DB: news, categories, services, projects, job-postings, rentals, property-posts), `vi.json`/`en.json` (mọi màn), `globals.css` (biến shadcn và token khối tối), e2e `tests/e2e/revalidate-globals.ts`.

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (unit + ui + integration, có DB) | 223/224 file, 2320/2320 test PASS. 1 suite fail: `src/lib/contrast.test.ts` (marker `".theme-dark-block {\n  --color-bg"` không khớp vì `globals.css` ở worktree là CRLF, lỗi đã biết BL-004). Đã đối chiếu tay: với LF, marker vẫn khớp khối `:is(...),\n.theme-dark-block {\n  --color-bg` sau sửa đổi, nên thay đổi không làm vỡ test này (residual risk, chưa chạy được bản LF) |
| `pnpm build` | PASS, có `ƒ /api/locale-counterpart` trong bảng route (route tĩnh thắng `/api/[...slug]`) |
| `node scripts/i18n-check.ts` | PASS: "vi.json và en.json khớp nhau" |

## Responsive Checklist Gate (diff đụng UI: Header, HeaderFrame, HeroSlider, globals.css)

Không có browser: xác minh bằng CSS math, phần chưa xác minh ghi ở Residual risk.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Cụm chấm hero đổi sang `flex flex-wrap justify-center px-2` (`HeroSlider.tsx:169`): 320px còn 304px, 6 chấm/hàng, xuống hàng thay vì tràn; 375px: 8 × 44 = 352 ≤ 359 vừa một hàng |
| Mobile-first `min-width` | OK | `pb-32 sm:pb-24`, `flex-col sm:flex-row`, `-mt-16 lg:-mt-18` khớp `h-16 lg:h-18` của header |
| Grid auto-fit/minmax, container không fixed px | N/A | Diff không thêm grid/container mới |
| Font-size rem, heading fluid | OK | Không thêm cỡ chữ px; dùng token sẵn có |
| Spacing theo scale | OK | `pb-32`/`pb-24`/`px-2` thuộc scale Tailwind |
| Media max-width/aspect-ratio/srcset | N/A | `ResponsiveImage` không đổi |
| Touch target ≥ 44×44 | OK | Chấm `size-11` (44px) giữ nguyên; link logo `min-h-11 min-w-11`; LanguageSwitcher không đổi kích thước |
| Nav mobile hamburger | OK | MobileMenu giữ nguyên, chỉ đổi href ngôn ngữ |
| Table scroll/card | N/A | Không có bảng trong diff |
| Không `100vh` đơn thuần | OK | Hero `h-svh` (thay `calc(100svh-4rem)`), `min-h-[560px]` |
| `prefers-reduced-motion` | OK | `globals.css` thêm `@media (prefers-reduced-motion: reduce) { .site-header { transition: none } }`; hero giữ `motion-reduce:*` |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` của hero có từ trước (cắt slide), không dùng để che tràn mới |

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` rỗng |
| oxlint (anti-slop) | skip, oxlint not configured | Không có `.oxlintrc.json`/`oxlint.json`; ESLint PASS |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` rỗng |
| AI-readable | OK | 2 indicator nhỏ: comment `staticCounterpartPath` khẳng định sai (xem MAJOR-1), docblock `Header.tsx:22` dài một dòng. Hàm < 50 dòng, file < 300 dòng, tên rõ, hằng số có tên (`MAX_PATH_LENGTH`, `CACHE_CONTROL`, `LIST_FALLBACK`) |
| ai-friendly-web | N/A | Task không đụng `llms.txt`/`robots.txt`/sitemap |
| blitzstrike | skip, không có môi trường/công cụ | Thay bằng rà tay open redirect (phần Security bên dưới) |

## Security review: `/api/locale-counterpart`

- Open redirect: không khai thác được. `route.ts:24` chặn `to` ngoài `routing.locales`, path không bắt đầu `/` hoặc dài > 300. `Location` luôn do `publicPath()` dựng từ `pathnames` + slug lấy từ DB (`resolve-counterpart.ts:44`) hoặc danh sách/trang chủ; không phản chiếu input. Regex `parsePublicPath` dùng `([^/]+)` neo `^…$`, nên `//evil.com`, `/\evil.com`, `/cho-thue/x/../../evil` đều thành null hoặc thành slug không tồn tại, rồi rơi về fallback. Có test (`resolve-counterpart.test.ts:80`, `route.test.ts:33`).
- Lộ bản ghi nháp/ẩn: không. Tra bằng `findPublicBySlug` (`publicWhere` của locale đang xem: chưa công khai, xoá mềm, `en` chưa bật bản dịch đều trả null). `findLocalizedSlugs` dùng `overrideAccess` nhưng chỉ `select: { slug }` và chỉ gọi sau khi bản ghi đã qua truy vấn công khai. Đích `en` bắt buộc `hasEnglish === true` và có slug EN (`resolve-counterpart.ts:42-44`), giống hệt điều kiện hreflang ở các trang chi tiết (vd `tin-tuc/[slug]/page.tsx:53`).
- Slug danh mục riêng theo ngôn ngữ: đúng với schema. `Categories.ts:15` ghi "Slug duy nhất theo (`_locale`, `scope`, `slug`)", slug đến từ `withContentDefaults` (`slugField` + `scopeSlugField`, localized). Rule tra danh mục giữ điều kiện `scope` (`resolve-missing-page.ts:32,34,35`).
- Cache `s-maxage=60`: sau khi admin tắt `hasEnglish`, CDN có thể trả 302 tới trang EN đã thành 404 tối đa 60 giây. Chấp nhận được (ngang ISR), nhưng nhánh lỗi cũng bị cache (MINOR-1).

## Findings

### [MAJOR-1] Trang pháp lý chưa có bản EN: nút chuyển ngôn ngữ dẫn tới 404
- `src/lib/i18n/counterpart-url.ts:64-67` (`staticCounterpartPath`) và `:81-82` (`localeSwitchHref`), `src/lib/i18n/resolve-counterpart.ts:27-28`.
- Mọi khoá không có tham số động được coi là "bản ở ngôn ngữ kia luôn tồn tại" (comment dòng 64) và link thẳng. Điều này sai với `/chinh-sach-bao-mat` và `/dieu-khoan-su-dung`. Trang pháp lý EN chỉ tồn tại khi admin bật `hasEnglish`: `LegalPage.tsx:35-40` gọi `notFound()` khi không có bản công khai ở `/en`, và `resolve-missing-page.ts:42-43` có rule riêng cho chúng. Task song song L10-T02 sẽ đặt `hasEnglish=false` cho trang pháp lý chờ duyệt lại, nên ngay sau deploy, bấm "English" trên trang chính sách/điều khoản sẽ ra 404. Vi phạm FR-PUB-18 / AC 2 ("chưa có bản dịch → trang danh sách ngôn ngữ kia (hoặc trang chủ)").
- Test `counterpart-url.test.ts:38` (`/chinh-sach-bao-mat` → `/en/privacy-policy`) đang khoá chặt hành vi sai này.
- Cách sửa đề xuất: chỉ link thẳng khi khoá không có tham số **và** không có rule trong `MISSING_PAGE_RULES` (tức trang luôn tồn tại: trang chủ, danh sách, liên hệ). Khoá pháp lý đi qua endpoint. Trong `resolveCounterpartPath` thêm nhánh rule không `param`: `findPublicOne(payload, rule.collection, parsed.locale, rule.where)`, đích `en` yêu cầu `hasEnglish === true`, còn lại về trang chủ ngôn ngữ đích. Sửa comment dòng 64 và test dòng 38, thêm test cho pháp lý có/không EN.

### [MAJOR-2] Thiếu test integration bắt buộc "counterpart cho bản ghi có/không EN"
- Task, mục "Tests cần viết": "Integration: counterpart cho bản ghi có/không EN". Không có file nào trong `tests/` nhắc `counterpart` (Grep rỗng). `resolve-counterpart.test.ts` mock toàn bộ `findPublicBySlug`/`findLocalizedSlugs`, nên hợp đồng thật không được kiểm: `publicWhere` của `en` với `hasEnglish`, slug danh mục localized theo `scope`, bản ghi nháp/xoá mềm không được trả slug. Ở mức STRICT, đây là "logic quan trọng thiếu test dùng contract thật".
- Cách sửa: thêm `tests/integration/locale-counterpart.test.ts` dùng DB thật. Tạo rental có EN (slug vi/en khác nhau) → `resolveCounterpartPath("/en/for-rent/<en>", "vi") === "/cho-thue/<vi>"` và chiều ngược lại. Rental `hasEnglish=false` → `/en/for-rent`. Bản nháp/xoá mềm → danh sách. Danh mục rental có slug EN riêng → `/en/for-rent/category/<en>`. Sau MAJOR-1: trang pháp lý `hasEnglish=false` → `/en`.

### [MINOR-1] Nhánh lỗi tra DB cũng bị cache công khai 60 giây
- `src/app/(payload)/api/locale-counterpart/route.ts:30-34`: khi `resolveCounterpartPath` ném lỗi (DB chập chờn), 302 về trang chủ vẫn mang `public, s-maxage=60`, nên CDN giữ redirect sai suốt 60 giây cho đúng URL đó.
- Sửa: nhánh `catch` trả `Cache-Control: no-store`.

### [MINOR-2] Nội dung hero không chừa chỗ cho header đè lên
- `src/components/home/HeroSlider.tsx:143`: hero giờ kéo lên `-mt-16`/`lg:-mt-18` nhưng khối nội dung chỉ có `pb-32` mà không có padding trên. Nội dung căn giữa theo cả vùng dưới header, nên bị đẩy lên khoảng 32px. Với tiêu đề display dài (uppercase, 22ch ở 320px dễ ra 4-5 dòng) và min-h 560, phần trên có thể chui dưới header trong suốt. Ở 320px với 8 slide, cụm điều khiển cao khoảng 148px (nút dừng 44 + 2 hàng chấm 88 + `bottom-4` 16), lớn hơn `pb-32` (128px).
- Sửa: thêm `pt-16 lg:pt-18` cho khối nội dung, và `pb-40` ở < sm, hoặc tính theo số hàng chấm.

### [MINOR-3] Thuật ngữ nhãn "Property listings" lệch với route và nội dung
- `src/i18n/messages/en.json:28` và `:224`: mục `tin-bds` có URL `/en/property-news`, mô tả (`:225`) là "property news, vouchers and offers". Nhãn "Property listings" dễ bị hiểu là tin rao BĐS (trùng ý với "Rental listings" ở `:289`).
- Gợi ý: "Property news" hoặc "News & offers" cho cả nav và `page.posts.title`; đồng bộ `Header.test.tsx`, `shell-data.test.ts`, `tests/e2e/revalidate-globals.ts`.

### [MINOR-4] Nhất quán câu chữ en.json
- `en.json:266` "Province / city" và `:297` "Province/city": chọn một dạng.
- `en.json:331` bộ lọc `furnishingOption.none` = "None", trong khi `:476` chi tiết = "Unfurnished". Bộ lọc nên là "Unfurnished" cho rõ.

### [MINOR-5] `rootMargin` của HeaderFrame chỉ tính một lần
- `src/components/layout/HeaderFrame.tsx:25`: `header.offsetHeight` đọc lúc mount. Khi đổi cỡ cửa sổ qua mốc lg (64 → 72px), observer lệch 8px cho tới lần đổi pathname. Ảnh hưởng nhỏ. Có thể dùng `ResizeObserver` hoặc rootMargin cố định theo giá trị lớn hơn.

## Kiểm các điểm được yêu cầu

- BR-07 hreflang: các trang có sẵn đã đúng và diff không đụng tới. Trang chi tiết/danh mục khai `languages` chỉ khi `hasEnglish` + slug EN (có test ở du-an, cho-thue, dich-vu, tin-bds, tuyen-dung, tin-tuc, danh mục cho thuê). Pháp lý theo `hasEnglish` (`LegalPage.tsx:16-30`). Trang chủ/liên hệ/danh sách luôn có 2 bản. Sitemap bỏ alternates khi chỉ một ngôn ngữ. OK.
- en.json: đủ khoá, không gạch dài, cùng tham số ICU (`messages-check.test.ts` chạy trong `pnpm test`). Nhãn enum (hướng, nội thất, loại việc, tình trạng bán, chu kỳ thanh toán, dịch vụ kèm) dịch qua file chuỗi. Câu chữ nhìn chung tự nhiên, chỉ có MINOR-3/4.
- Xoá khoá chết (`leadForm.fallback*`, `rentalDetail.leadForm.hotline`, `contact.formFallback`): Grep không còn chỗ dùng. `SaleContactBox.tsx:70` chỉ dùng `title`/`titleRented`. `PostDetail.tsx:85` và `ProjectDetail.tsx:99` vẫn dùng `leadForm.hotline` của namespace posts/projects, và các khoá đó vẫn được giữ. `careerDetail.applyForm.fallback` vẫn dùng (`ApplyFormSlot.tsx:27`) và còn nguyên. OK.
- Header trong suốt: biến thể quyết định bằng CSS `:has(~ main [data-header-hero])` (header và `main` là anh em, `PublicShell.tsx:18-19`), nên HTML server đã đúng: không nháy khi hydrate, không CLS (header vẫn trong flow, hero bù bằng `-mt-*`). Selector bọc trong `:is()` (danh sách selector "dễ dãi"): trình duyệt không hỗ trợ `:has` chỉ bỏ phần đó, không vô hiệu cả rule `:root, …, .theme-dark-block`, và rơi về header đặc. Không có IntersectionObserver thì giữ trong suốt có gradient (có test). Token khối tối dùng lại, nên chữ/icon sáng. Logo hai bản, bản ẩn dùng `display:none` nên không bị đọc trùng. OK.
- h1 sr-only = tiêu đề slide 1, không có thì tên site, nằm ngoài carousel (`HomeBlocks.tsx:32`), có test. OK.

## Residual risk

- Contrast chữ header trên ảnh hero phụ thuộc ảnh thực tế (gradient đen 40% → 0 cộng với `bg-overlay` của hero). Chưa đo được khi không có browser.
- `contrast.test.ts` chưa chạy được với LF trong worktree (BL-004). Đã suy luận bằng tay rằng marker vẫn khớp.
- Tải lại trang khi trình duyệt khôi phục vị trí cuộn giữa trang: header có thể trong suốt trong khoảng một frame trước callback đầu của IntersectionObserver.
- Endpoint không rate limit. Slug ngẫu nhiên hợp lệ về dạng mỗi lần tốn 1 truy vấn DB, tương đương gọi thẳng trang chi tiết với slug lạ.

## Verdict

**FAIL**: còn 2 MAJOR. MAJOR-1: trang pháp lý chưa có EN dẫn nút chuyển ngôn ngữ tới 404, xung đột trực tiếp với L10-T02. MAJOR-2: thiếu test integration counterpart mà task bắt buộc. Builder sửa MAJOR-1 và MAJOR-2; MINOR-1..5 nên sửa cùng lượt (MINOR-1 và MINOR-2 chỉ vài dòng).
