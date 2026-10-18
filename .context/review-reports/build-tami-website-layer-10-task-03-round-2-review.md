Agent: reviewer

# Review: build tami-website, layer-10-task-03, round 2

- Task: `tasks/tami-website/layer-10-task-03.md` (hoàn thiện bản EN)
- Code: worktree `D:/prj/bds-wt10-t03` (branch `wt/l10-t03`, base `5dbce88`, chưa commit), builder attempt 2
- Round trước: `build-tami-website-layer-10-task-03-round-1-review.md` (FAIL: MAJOR-1, MAJOR-2, MINOR-1..5)
- Review level: **STRICT**
- Reason: component dùng chung (`Header`, `HeaderFrame`, `LanguageSwitcher`), API công khai mới `/api/locale-counterpart` trả 302 từ input người dùng (open redirect, lộ bản ghi), CSS token dùng chung, đổi/xoá khoá i18n toàn site.
- Blast radius: mọi trang công khai (header, nút chuyển ngôn ngữ desktop/mobile), trang chủ (hero, h1), trang pháp lý, `/api/locale-counterpart` (news, categories, services, projects, job-postings, rentals, property-posts, pages), `vi.json`/`en.json`, `globals.css`, e2e `tests/e2e/revalidate-globals.ts`.

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (đầy đủ: unit + ui + integration, có DB) | 224/225 file, **2331/2331 test PASS** (round 1: 2320). Suite fail duy nhất: `src/lib/contrast.test.ts` (marker CRLF, lỗi đã biết BL-004, không do diff). `tests/integration/locale-counterpart.test.ts` chạy thật trên DB tạm (log có stack từ `locale-counterpart.test.ts:106/169/180`, chỉ là WARN revalidate/dịch ngoài ngữ cảnh Next, không phải lỗi test), không bị `skipIf` |
| `pnpm build` | PASS (exit 0), bảng route có `ƒ /api/locale-counterpart` |

`src/payload-types.ts` hiện trong `git status` chỉ do khác line ending (diff nội dung rỗng).

## Đóng finding round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 pháp lý không có EN → 404 | **Đóng** | `counterpart-url.ts:64,70-72`: khoá trong `LEGAL_PAGE_ROUTES` không còn link thẳng, đi qua endpoint. `resolve-counterpart.ts:34-38`: rule không `param` → `findPublicOne(rule.collection, parsed.locale, rule.where)`, đích `en` bắt buộc `hasEnglish === true`, không có/không EN → `fallback` (`LIST_FALLBACK` không có khoá pháp lý nên về trang chủ ngôn ngữ đích). Comment sửa đúng. Unit `counterpart-url.test.ts:41-45`, integration `locale-counterpart.test.ts:203-218` (chưa có trang, có VI chưa EN, bật EN, hạ EN, chiều EN→VI, terms độc lập) |
| MAJOR-2 thiếu integration counterpart | **Đóng** | `tests/integration/locale-counterpart.test.ts` (8 test, DB tạm). Xem mục "Integration test có kiểm logic thật" |
| MINOR-1 nhánh lỗi bị cache | Đóng | `route.ts:33` `Cache-Control: no-store`; `route.test.ts:48` |
| MINOR-2 hero chừa chỗ header | Đóng | `HeroSlider.tsx:143` thêm `pt-16 lg:pt-18`, `pb-40 sm:pb-24`. 320px/8 slide: cụm điều khiển ~148px ≤ 160px |
| MINOR-3 nhãn "Property listings" | Đóng | `en.json:28,224` → "Property news"; cập nhật `Header.test.tsx:71`, `shell-data.test.ts:43`, `tests/e2e/revalidate-globals.ts:88`. Grep toàn worktree không còn "Post your property"/"Property listings" ngoài report cũ |
| MINOR-4 nhất quán en.json | Đóng | `provinceLabel` → "Province/city" (thống nhất với `:297`), cập nhật `project-components.test.tsx:101`; `furnishingOption.none` → "Unfurnished" |
| MINOR-5 rootMargin tính một lần | Đóng | `HeaderFrame.tsx:20-28` `ResizeObserver` cập nhật `headerHeight`, IntersectionObserver dựng lại theo `[pathname, headerHeight]` (`:38`); không có RO thì giữ hành vi cũ |

## Integration test có kiểm logic thật không

- Mock chỉ thay **instance**: `vi.mock("@payload-config")` trả một marker; `getPayload` bị bọc chỉ khi `config === marker` thì trả payload của test, còn lại gọi `actual.getPayload` (`locale-counterpart.test.ts:11-16`). `resolveCounterpartPath`, `parsePublicPath`, `MISSING_PAGE_RULES`, `findPublicBySlug`/`findPublicOne` (`publicWhere` thật: status, trash, `hasEnglish` cho `en`), `findLocalizedSlugs` đều là code thật, chạy trên Postgres thật. Không mock mất phần cần kiểm.
- Ca được kiểm: rental có EN hai chiều với slug khác nhau; không EN → danh sách; `hasEnglish` hạ dù còn slug EN → danh sách (cả chiều EN→VI); nháp không lộ; xoá mềm (`trash: true`) không lộ; danh mục slug EN riêng, cùng slug sai scope (`/tin-tuc/danh-muc/...`) không khớp; danh mục chưa EN; pháp lý đủ trạng thái.
- Fixture `tests/fixtures/locale-counterpart/payload-config.ts` dùng collection **thật** qua factory (`createRentals`, `createPages`, `createProjects`, `Categories`, `Provinces`, `Wards`, `Staff`, `Media`, `AuditLogs`, `Developers`) và `contentRedirectsPlugin()`, `createSiteSettings`; factory chỉ nhận callback revalidate (`Rentals.ts:114`, `Pages.ts:21`, `SiteSettings.ts:52`), nên slug/fields/access/trash/hooks giống `payload.config.ts:72`. Localization giống hệt config thật (`vi`,`en`, default `vi`, `fallback: false`, `payload.config.ts:90-95`). Khác biệt chỉ là `push: true` trên DB tạm và bỏ collection không liên quan/S3: chấp nhận được.

## Hồi quy

- Hero: `data-header-hero`, `-mt-16 h-svh lg:-mt-18` có test (`HomeBlocks.test.tsx:120-125`). h1 sr-only = tiêu đề slide 1 (đã lọc EN ở `buildHomeView`), không có thì tên site; test cập nhật đủ 3 ca (`:106-117`, `:135`).
- Header: hai bản logo, `HeaderFrame` bọc `<header>` giữ class sticky/z/print; test MobileMenu cập nhật href endpoint (`Header.test.tsx:154-156`).
- Nhãn i18n đổi: mọi chỗ dùng/test/e2e đã cập nhật (Grep xác nhận). Khoá xoá (`leadForm.fallback*`, `rentalDetail.leadForm.hotline`, `contact.formFallback`) không còn tham chiếu; `messages-check.test.ts` (đồng bộ khoá vi/en, tham số ICU) PASS trong `pnpm test`.

## Responsive Checklist Gate (diff đụng Header, HeaderFrame, HeroSlider, globals.css)

Không có browser, xác minh bằng CSS math.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Cụm chấm `flex flex-wrap justify-center px-2` (`HeroSlider.tsx:169`); 375px: 8 × 44 = 352 ≤ 359 |
| Mobile-first `min-width` | OK | `pb-40 sm:pb-24`, `pt-16 lg:pt-18`, `-mt-16 lg:-mt-18` khớp `h-16 lg:h-18` |
| Grid auto-fit / container không fixed px | N/A | Không thêm grid/container |
| Font-size rem / heading fluid | OK | Không thêm cỡ chữ px |
| Spacing theo scale | OK | `pt-16/pt-18/pb-40/pb-24/px-2` thuộc scale |
| Media | N/A | `ResponsiveImage` không đổi |
| Touch target ≥ 44×44 | OK | Chấm `size-11`, logo link `min-h-11 min-w-11`, LanguageSwitcher không đổi kích thước |
| Nav mobile | OK | MobileMenu giữ nguyên, chỉ đổi href ngôn ngữ |
| Table | N/A | Không có bảng |
| Không `100vh` đơn thuần | OK | Hero `h-svh`, `min-h-[560px]` |
| `prefers-reduced-motion` | OK | `globals.css` tắt transition `.site-header`; hero giữ `motion-reduce:*` |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` của hero có từ trước |

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | như round 1 |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc.json`; ESLint PASS |
| ocr | skip, ocr not installed | như round 1 |
| AI-readable | OK | Comment `staticCounterpartPath` đã đúng; hàm < 50 dòng, file < 300 dòng, hằng số có tên. 0-1 indicator nhỏ (docblock dài dòng `Header.tsx:22`) |
| ai-friendly-web | N/A | không đụng `llms.txt`/`robots.txt`/sitemap |
| blitzstrike | skip, không có công cụ/môi trường | rà tay open redirect ở round 1 vẫn đúng: thay đổi round 2 (nhánh pháp lý) chỉ trả `publicPath(parsed.key, target)` hoặc fallback, không phản chiếu input |

## Findings

Không còn CRITICAL/MAJOR.

### [MINOR-1] Integration chưa phủ các collection slug khác ngoài rentals/categories
- `tests/integration/locale-counterpart.test.ts`: chỉ rentals, categories (scope rental), pages. news/projects/services/job-postings/property-posts dùng cùng nhánh code (`resolve-counterpart.ts:39-50`) và `publicWhere` riêng từng collection đã có test ở task trước, nên rủi ro thấp. Không chặn PASS; có thể thêm 1 ca news/projects khi chạm lại.

### [MINOR-2] Route `/cho-thue/khu-vuc/[province]` luôn rơi về danh sách
- `counterpart-url.ts:24`: khoá có trong `pathnames` nhưng chưa có trang/rule nên chuyển ngôn ngữ về `/en/for-rent`. Hiện route chưa có page (Grep chỉ thấy `routing.ts:20`), nên đúng hành vi. Khi làm trang khu vực cần thêm rule hoặc link thẳng (slug tỉnh không localized). Ghi chú cho task sau, không tính lỗi.

## Residual risk

- Contrast chữ header trên ảnh hero phụ thuộc ảnh thật; chưa đo được không có browser.
- `contrast.test.ts` chưa chạy được ở LF trong worktree (BL-004); round 1 đã suy luận marker vẫn khớp với LF.
- Endpoint không rate limit (ngang gọi thẳng trang chi tiết với slug lạ).

## Verdict

**PASS**: 2 MAJOR và 5 MINOR của round 1 đã đóng có bằng chứng. Integration test chạy code thật trên DB thật. Fixture không lệch so với collection thật. Lint, typecheck, build PASS; test 2331/2331 PASS (chỉ còn lỗi CRLF đã biết ở `contrast.test.ts`). Không thấy hồi quy.
