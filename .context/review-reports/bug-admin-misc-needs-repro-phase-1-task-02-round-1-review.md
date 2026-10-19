Agent: reviewer

# Review — bug-admin-misc-needs-repro · phase-1-task-02 · round 1 (BL-023 #10, form admin tràn ngang 375px)

- **Review level:** NORMAL
- **Reason:** Chỉ CSS + test tĩnh, không đụng schema/API/auth. Nhưng `.app-header__step-nav-wrapper` là header admin dùng chung cho mọi màn → không đủ hẹp để FAST; không có rủi ro đỏ nào buộc STRICT.
- **Scope reviewed:** `src/components/admin/styles/_surfaces.scss` (git diff, +17 dòng) và file mới `src/components/admin/admin-mobile-overflow.test.ts`. Các thay đổi khác trong working tree thuộc task khác, không review ở đây.
- **Blast radius:** breadcrumb trên header admin ở mọi màn admin; vạch kẻ trên/dưới khối `.payload-settings` (`/admin/account`). Không ảnh hưởng frontend public, API hay dữ liệu.

## Đối chiếu với rule gốc của Payload 3.91 (đã đọc trong node_modules)
- `@payloadcms/ui/dist/styles.css`: `.app-header__controls-wrapper{display:flex;align-items:center;flex:1;min-width:0}` và `.app-header__step-nav-wrapper{flex-grow:0;display:flex;width:100%}`. Rule này không có `min-width` và không có `overflow`; Payload có sẵn `::-webkit-scrollbar{display:none}`. Override `min-width:0` cho phép flex item co lại (flex-shrink mặc định là 1). `overflow-x:auto` cho cuộn nội bộ. `scrollbar-width:none` ẩn thanh cuộn trên Firefox giống cách Payload ẩn trên WebKit. Nhắm đúng rule.
- `@payloadcms/next/dist/prod/styles.css`: `.payload-settings:before,.payload-settings:after{…width:calc(100% + var(--base) * 5);left:calc(var(--gutter-h) * -1);position:absolute}`. `:after` mặc định `display:none` và hiện `display:block` trong media query ≤1024. Override `width:auto; right:-gutter` cùng với `left:-gutter` sẵn có (absolute, left+right, width auto) → vạch dài đúng bằng container + 2×gutter. Nhắm đúng rule.
- **Layer:** stylesheet Payload nằm trong `@layer`. `custom.scss` nạp `surfaces` qua `@use` ở top-level, không bọc `@layer` → rule không thuộc layer nào nên thắng `payload-default`, bất kể specificity. Đúng.
- **Không có `overflow-x: hidden` toàn cục:** diff không đụng `html`/`body`/khung trang. Test số 3 có guard điều này.

## Desktop (1280) — đánh giá vạch kẻ
- Trước fix ở desktop: `--gutter-h` khoảng 32px, `--base` khoảng 20px → vạch bắt đầu ở −32px và kết thúc ở 100%+68px (thò qua mép phải container 68px, không đối xứng).
- Sau fix: vạch từ −32px đến 100%+32px → **ngắn hơn 36px ở mép phải** và giờ đối xứng gutter hai bên.
- Ở desktop chỉ `::before` hiện (`::after` là `display:none` khi >1024px), nên chỉ đổi 1 vạch hairline 1px màu `--theme-elevation-100`, chênh 36px ở mép phải. Tôi chấp nhận thay đổi này: đây là đường phân cách mờ và bản mới nhất quán hơn (khớp gutter). Tuy vậy, nói đúng ra AC "desktop 1280 không đổi giao diện" chưa đạt tuyệt đối → xem MINOR-1.
- Wrapper breadcrumb ở desktop: rule gốc đã có `width:100%`, `min-width:0` chỉ có tác dụng khi nội dung dài hơn chỗ trống. Breadcrumb ngắn → không đổi.

## Bàn phím / focus
- Link focus được đặt trong vùng `overflow-x:auto` vẫn Tab tới được, và trình duyệt tự cuộn link đang focus vào tầm nhìn → truy cập bằng bàn phím không bị ảnh hưởng.
- Lưu ý: khi `overflow-x` khác `visible` thì `overflow-y` tính ra `auto`. Outline focus vẽ ra ngoài link ở mép trên/dưới wrapper có thể bị cắt → MINOR-2. Đây là residual risk, không chặn PASS.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin/admin-mobile-overflow.test.ts` | PASS — 1 file, 3/3 tests |
| `pnpm lint` | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, không có lỗi) |

Đo trình duyệt `documentElement.scrollWidth` ở 375px: reviewer không chạy app (ngoài quyền). Change-request đang đo riêng → xem Residual risk.

## Responsive Checklist Gate (chỉ xét diff)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang toàn trang ở 375 | OK (theo CSS math) — chờ số đo browser | breadcrumb co lại nhờ `min-width:0` trong `controls-wrapper{min-width:0;flex:1}`; vạch kẻ = container+2×16px nằm trong padding gutter của viewport. Builder/root cause đã thử: rentals 430→375, leads 386→375, account 435→375 |
| 768 | OK (CSS math) | gutter 16px, cùng cơ chế như 375 |
| 1280 | OK (có thay đổi nhỏ) | wrapper không đổi; vạch `::before` ngắn hơn 36px ở mép phải (MINOR-1) |
| Mobile-first media query / grid auto-fit | N/A | diff không có media query hay grid |
| Container không dùng fixed px | OK | dùng `auto` / `var(--gutter-h)` |
| Typography rem / clamp | N/A | diff không đụng typography |
| Media (img/video) | N/A | — |
| Touch target ≥44px / nav mobile | N/A | không đổi kích thước control; nút ngôn ngữ và avatar không còn bị đẩy ra ngoài viewport |
| Table scroll wrapper | N/A | — |
| 100vh / prefers-reduced-motion | N/A | không có |
| Không che lỗi bằng `overflow:hidden` | OK | dùng `overflow-x:auto` có chủ đích trên đúng phần tử, không có `hidden` |

## Skill gates
- **aislop:** skip — reviewer chỉ được chạy verify commands đã cấu hình; diff là 17 dòng CSS + 1 test ngắn, đọc tay không thấy slop.
- **oxlint (anti-slop):** skip, oxlint not configured trong verify commands; `pnpm lint` (eslint) có 0 error.
- **ocr:** skip, ocr not installed / không nằm trong lệnh được phép.
- **AI-readable:** OK — tên rõ, comment giải thích WHY (trích rule gốc Payload + lý do), không magic number, không indirection. Có 0 indicator.
- **ai-friendly-web:** N/A (admin nội bộ).
- **blitzstrike:** N/A (không phải STRICT, không có bề mặt bảo mật).

## Test quality
- Test tĩnh đọc SCSS nguồn và bỏ comment để regex không khớp nhầm đoạn trích rule Payload nằm trong chú thích. Hai test đầu sẽ FAIL nếu override bị xoá (hồi quy thật). Test 3 chặn `overflow-x:hidden` trên html/body.
- Giới hạn: test chỉ kiểm rule có tồn tại trong source, không kiểm hành vi layout thật. Đây là kiểu test sẵn có của repo; bằng chứng hành vi phải dựa vào số đo browser của change-request. Chấp nhận được.

## Findings
- **[MINOR-1]** `src/components/admin/styles/_surfaces.scss:205-209` — ở ≥1025px vạch `.payload-settings::before` ngắn hơn 36px ở mép phải so với mặc định Payload. AC ghi "desktop 1280 không đổi giao diện". Đề xuất: chấp nhận và ghi vào Residual risk/close-out ("hairline đối xứng gutter, chênh 36px"). Nếu muốn giữ y nguyên desktop thì bọc override trong `@media (max-width: 1024px)`, nhưng tôi không khuyến nghị.
- **[MINOR-2]** `src/components/admin/styles/_surfaces.scss:197-201` — `overflow-x:auto` kéo theo `overflow-y:auto`, outline focus của link breadcrumb có thể bị cắt ở mép trên/dưới. Đề xuất: khi đo browser, kiểm Tab qua breadcrumb; nếu outline bị cắt thì thêm `padding-block` nhỏ hoặc dùng `outline-offset` âm cho link. Không chặn.
- **[MINOR-3]** Thanh cuộn bị ẩn (`scrollbar-width:none`), nên breadcrumb bị tràn trên desktop chỉ cuộn được bằng shift+wheel, touchpad hoặc Tab. Hành vi này giống ý định gốc của Payload (đã ẩn scrollbar WebKit); ở 1280 thực tế hiếm khi tràn. Ghi nhận, không cần sửa.

Không có CRITICAL hoặc MAJOR.

## Residual risk
- Chưa có số đo browser `documentElement.scrollWidth == 375` cho account / rentals / projects (tên dài) / leads edit + create. Change-request phải đo và ghi kết quả vào task file trước khi close-out. Nếu bất kỳ màn nào > 375 thì task chưa đạt AC dù review này PASS.
- Dashboard `/admin` (506px) và list rentals (576px) vẫn tràn — ngoài scope, đã ghi đề xuất task riêng.

## Verdict
✅ **PASS** — CSS override nhắm đúng rule Payload 3.91 và nằm ngoài `@layer`; không có `overflow-x:hidden` toàn cục; lint, typecheck và test đều PASS. Còn chờ số đo browser 375px của change-request trước khi close-out.
