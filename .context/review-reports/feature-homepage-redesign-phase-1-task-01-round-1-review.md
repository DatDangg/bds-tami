Agent: reviewer

# Review — feature-homepage-redesign · phase-1-task-01 · round 1 (BL-044)

- **Review level:** STRICT
- **Reason:** schema global `homepage` + migration versioned (enum ADD VALUE, bảng mới), view model dùng chung `home-view.ts`, component dùng chung `OptionSelect` (variant mới), form GET/JS liên trang sang `/cho-thue` (contract URL), i18n vi/en.
- **Blast radius:** trang chủ `/` và `/en` (hero, ô tìm kiếm, khối Điểm mạnh); admin global `homepage` (tab Banner đầu trang, Điểm mạnh, Giới thiệu, Dự án nổi bật, Thứ tự khối); DB `homepage*` (2 bảng mới, 2 enum mới, 16 cột mới, enum `block_order` thêm `strengths`); `payload-types.ts`; mọi nơi dùng `OptionSelect` (ProjectFilters, JobFilters, tab Dự án) — default variant không đổi; pipeline dịch (`TRANSLATABLE_FIELDS.homepage` + `strengths`); URL `/cho-thue?...`.

## Verify commands + result

| Lệnh (project-config) | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm test` | exit 1 — `Test Files 53 failed / 249 passed (302)`, `Tests 9 failed / 2490 passed / 688 skipped`. **Toàn bộ fail nằm ở project `integration`**, nguyên nhân hạ tầng: `Error: cannot connect to Postgres: connect ECONNREFUSED 127.0.0.1:5433` và `RateLimitUnavailableError … (Redis không sẵn sàng)`. Không có suite nào fail ngoài `|integration|`. Unit/UI (gồm `src/components/home`, `src/lib/home`, `src/components/ui`, `no-raw-colors`, `contrast`, `translatable-fields`) PASS. `tests/integration/homepage*.test.ts` bị **skip/không chạy được** trên máy reviewer → migration up/down chưa được reviewer kiểm chứng độc lập (dựa vào evidence builder). |
| `pnpm build` | **skip** — dev server đang chạy ở :3000 dùng chung `.next`; chạy `next build` sẽ ghi đè thư mục build của dev server. Residual risk. |
| `pnpm payload migrate` | không chạy (không auto-allow, chỉ chạy khi deploy) — inspect artifact tay ở dưới. |

## Migration inspection (`migrations/20261020_103248_homepage_redesign.ts`)

- UP: CREATE TYPE ×2, `ALTER TYPE enum_homepage_block_order_block ADD VALUE 'strengths' BEFORE 'about'` (không dùng giá trị mới trong cùng transaction → hợp lệ), CREATE TABLE ×2, ADD COLUMN ×16 (đều nullable, `strengths_enabled DEFAULT true`), FK `ON DELETE set null/cascade`, INDEX. **Không DROP / đổi type / SET NOT NULL trên dữ liệu cũ → không HIGH_RISK_MIGRATION.** Đạt additive.
- DOWN: xem finding M1.

## Responsive Checklist Gate (diff đụng UI)

Không có browser; xác minh bằng CSS math + ảnh builder (1440, 390).

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Ảnh 390 không tràn; chip dự án `< md` nằm trong `overflow-x-auto`; thanh tiến trình `max-w-[40vw]`. |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm:/md:/lg:` (min-width). |
| Grid auto-fit/minmax | OK (theo spec task) | `StrengthsBlock` `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` — task §6 yêu cầu đúng 1/2/4 cột; mỗi cột `min-w-0`. |
| Container không fixed px | OK | `max-w-container`, `max-w-4xl`, `w-full`. |
| Font-size rem / token | OK | Chỉ token `text-display/lead/small/eyebrow/h4` (rem trong globals.css). |
| Heading fluid | OK | `text-display`/`text-h4` token có sẵn. |
| Media | N/A | Không thêm ảnh mới trong render T01 (ảnh hero giữ `ResponsiveImage`). |
| Touch target ≥ 44×44 | **FAIL** | Đoạn thanh tiến trình: cao `h-11` nhưng rộng = `w-40 max-w-[40vw]` ÷ số slide. 375px: 150px ÷ 4 slide = 37px, ÷ 8 slide (schema cho phép 1–8) = 18,75px < 44px. Chấm cũ là `size-11` (44×44) → regression. Xem M3. |
| Nav mobile | N/A | Không đổi header. |
| Table | N/A | — |
| `100vh` | OK | Hero vẫn `svh` (không đổi). |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` trên thanh, caret xoay, nội dung slide. |
| Không che lỗi bằng overflow:hidden | **FAIL (nhẹ)** | Hàng chip "Dự án được quan tâm" ≥ md: `md:overflow-hidden md:h-10` + không wrap → chip cuối bị cắt giữa chữ ("MIK V" ở ảnh 1440). Xem m1. |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop not installed |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`); eslint 0 error |
| open-code-review (ocr) | skip, ocr not installed |
| AI-readable | OK — file ≤ 300 dòng (HeroSearch 258, HeroSlider 262, StrengthsBlock 31); tên rõ; comment nêu WHY. Indicator: hàm component > 50 dòng (`HeroSearch`, `HeroSlider` — pattern có sẵn) = 1 indicator < 3. |
| ai-friendly-web | N/A — không đổi robots/sitemap/llms, task không đụng SEO public surface. |
| blitzstrike | skip — không có môi trường được phép; input mới chỉ là query GET đã qua whitelist (`isOneOf`, `PRICE_HINT_RANGES`, `AREA_HINT_RANGES`) và `parseRentalFilters` ở trang đích; `videoUrl` validate YouTube server-side + kiểm lại ở view. |
| no-raw-colors / token | OK — không hex mới; mọi class màu là token có trong `src/app/(frontend)/globals.css` (`primary-soft`, `primary-subtle`, `accent-display`, `input-border`, `on-dark`, `on-dark-muted`, `text-eyebrow`). `no-raw-colors.test` PASS. |

## Kiểm các quyết định đã chốt

- **Q2 lọc thật:** `rentalFiltersFromForm` → `rentalListQueryString` dùng đúng `QUERY_KEYS` của `src/lib/search/url-params.ts` (`q, category, priceMin, priceMax, areaMin, areaMax, furnishing, amenities`); default `sort/page` không lên URL; "" bị bỏ. No-JS: `category/furnishing/amenities` trùng tên, `priceRange/areaRange` tên lạ → trang đích bỏ qua. OK.
- **Q3 bỏ mũi tên xổ:** không có. OK.
- **Q4 eyebrow/caption chung:** `hero.eyebrow`/`hero.caption` ở cấp group, truyền 1 lần vào `HeroSlider`. OK.
- **1 h1:** `HomeBlocks` sr-only `title + " " + titleAccent`. OK.
- **OptionSelect regression:** `variant` mặc định `"default"` → `variantClass` undefined, class cũ giữ nguyên cho ProjectFilters/JobFilters/tab Dự án. OK.
- **Backward compat dữ liệu cũ:** cột mới nullable; view `text()`/`|| null` an toàn; `titleOf` xử lý group không có `title`. Bản ghi cũ có `blockOrder` 8 khối → Điểm mạnh không hiện và Dịch vụ/Ưu đãi/Cho thuê/Tin tức vẫn hiện cho tới khi admin chỉnh (xem m4).

## Findings

### [MAJOR]

**M1 — Down migration hỏng khi đã có dữ liệu `strengths` trong `blockOrder`.**
`migrations/20261020_103248_homepage_redesign.ts:61-64`: down cast `homepage_block_order.block` về enum cũ (không có `'strengths'`) nhưng **không xoá trước** các dòng `block = 'strengths'`. `strengths` lại là phần tử đầu của `defaultValue` cho bản ghi mới (`src/globals/Homepage.ts:271,366`) nên rollback trên DB thật sẽ lỗi `invalid input value for enum`. Tiền lệ của repo đã xử lý đúng ở `migrations/20261019_144259_homepage_market_blocks.ts:34` (`DELETE FROM "homepage_block_order" WHERE "block" IN ('rentals','news')`). Test `tests/integration/homepage-migration.test.ts` chạy down trên DB không có dòng `strengths` nên không bắt được.
**Fix:** thêm `DELETE FROM "homepage_block_order" WHERE "block" = 'strengths';` ở đầu `down` (trước `ALTER COLUMN … SET DATA TYPE text`); thêm vào test migration bước insert 1 dòng `strengths` vào `homepage_block_order` trước khi `redesign.down`.

**M2 — Hàng "Tùy chọn khác" ở 1440 không khớp mockup (2 hàng thay vì 1).**
Ảnh bằng chứng `.context/review-reports/assets/homepage-redesign-t01-1440.png`: "Tiện ích" rớt xuống hàng 2, ô "Loại căn hộ" rộng ~210px; mockup là 5 chip gọn 1 hàng. Change doc Acceptance: "Reviewer FAIL nếu lệch bố cục … thấy được bằng mắt". Builder giải thích là trạng thái trước hydrate, nhưng bằng chứng nộp chính là trạng thái lệch, không có ảnh sau hydrate chứng minh 1 hàng → unverifiable. Nguyên nhân: `src/components/home/HeroSearch.tsx:183-186` để `md:flex md:flex-wrap` + `md:w-auto md:min-w-28` nên độ rộng chip phụ thuộc option dài nhất (tên danh mục) — kể cả với `<select>` gốc lẫn trigger.
**Fix:** cố định bề rộng chip (vd `md:w-auto md:max-w-40` + `truncate`, hoặc lưới 5 cột `md:grid-cols-5` trong khung) để 5 chip luôn 1 hàng ở ≥ md bất kể hydrate/độ dài option; chụp lại 1440 sau hydrate.

**M3 — Vùng chạm đoạn thanh tiến trình < 44px trên mobile (regression so với chấm cũ 44×44).**
`src/components/home/HeroSlider.tsx:137,146`: nhóm `w-40 max-w-[40vw]`, mỗi đoạn `flex-1` → ở 375px với 4 slide ≈ 37px, 8 slide ≈ 19px rộng. Vi phạm Responsive gate (touch ≥ 44×44) và quy ước dự án.
**Fix:** đặt `min-w-11` cho mỗi nút đoạn và cho nhóm co giãn theo số slide (vd bỏ `max-w-[40vw]`, dùng `w-auto` với đoạn `w-11 sm:w-14`), hoặc tách vùng chạm khỏi vạch hiển thị; thêm test số đoạn × min-width.

### [MINOR]

- **m1** `src/components/home/HeroSearch.tsx:231` — chip dự án ≥ md bị cắt giữa chữ ("MIK V" ở ảnh 1440) do `overflow-hidden` + `md:h-10` không wrap. Mockup hiện chip trọn vẹn. Fix: khi thu gọn dùng `md:flex-wrap md:h-10 md:overflow-hidden` (chip thừa rớt xuống hàng ẩn) thay vì cắt ngang.
- **m2** `src/components/home/HeroSlider.tsx:132-135` — khi chỉ có 1 slide vẫn hiện bộ đếm "01 / 01" (cụm đáy luôn render). Fix: chỉ hiện bộ đếm khi `multiple`.
- **m3** `src/components/home/HeroSearch.tsx:169-170` — `display: contents` trên phần tử có `role="tabpanel"` và `<form role="search">`: một số phiên bản Safari/VoiceOver bỏ vai trò khỏi cây a11y. Ghi residual hoặc dựng thứ tự bằng cấu trúc DOM thay vì `contents` + `order`.
- **m4** Dữ liệu hiện có: `blockOrder` cũ 8 khối không có `strengths` → trên staging/prod khối Điểm mạnh không hiện và các khối ngoài mockup vẫn hiện cho tới khi admin sửa. Change doc yêu cầu "Trang chỉ có các khối trong ảnh". Cần xác nhận T03 xử lý (seed/hướng dẫn admin) — nếu không, thêm bước.
- **m5** Lệch mockup đã ghi (hero 100svh, bỏ vạch dọc cạnh caption, vị trí bộ đếm ở mép container thay vì sát mép trái ảnh như mockup) — change doc yêu cầu "ghi rõ lý do **và hỏi user trước**"; chưa thấy bằng chứng đã hỏi user.
- **m6** `src/components/home/StrengthsBlock.tsx:16` — ô tròn `bg-primary-subtle` gần như trùng nền trang ở ảnh 1440/390, mockup thấy rõ ô tròn. Đúng token theo task, nhưng nên đối chiếu lại (vd `bg-primary-soft`/viền) — hỏi design nếu cần.
- **m7** Viền chip `border-border` (`option-select.tsx:48`) cho control form có thể < 3:1 (WCAG 1.4.11) — nhất quán với chip link hiện có, theo đúng spec task; ghi residual.

## Residual risk
- Migration up/down + `tests/integration/homepage*.test.ts` không chạy được trên máy reviewer (Postgres :5433/Redis down) → dựa vào evidence builder.
- `pnpm build` chưa chạy (tránh phá dev server).
- Responsive 640/768/1024/1536 chỉ kiểm bằng CSS math; ảnh 390 chụp qua iframe.
- Trạng thái sau hydrate của hàng "Tùy chọn khác" không có ảnh.

## Verdict: FAIL

3 MAJOR (M1 down migration hỏng khi có dữ liệu; M2 lệch bố cục mockup ở 1440 theo chính ảnh bằng chứng; M3 touch target thanh tiến trình < 44px — Responsive gate FAIL). Trả về builder sửa M1–M3 (+ khuyến nghị m1, m2), chụp lại 1440/390 sau hydrate.
