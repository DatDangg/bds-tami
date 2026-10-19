Agent: reviewer

# Review: feature-admin-ui-saas-refresh, phase-1-task-01, round 1 (BL-015 style chung + token admin sáng/tối)

- Worktree: `D:/prj/bds-wt15-t01` (branch wt/bl15-t01, base staging 1c0554a), chưa commit
- Phạm vi review: `src/app/(payload)/custom.scss` (M), `src/components/admin/TranslationFailedBanner.tsx` (M), `src/components/admin/admin-tokens.ts` + `.test.ts` (A), `src/components/admin/styles/_tokens|_controls|_surfaces|_lists.scss` (A). Bỏ qua `src/payload-types.ts` và `importMap.js` (chỉ khác line-ending, không vào commit).

## Review level: NORMAL
**Reason:** chỉ CSS + 1 component trình bày + test unit. Không đụng auth, schema, API, hook hay access. Blast radius là toàn bộ màn `/admin` qua CSS dùng chung nhưng không có logic, đúng mức NORMAL mà task dự kiến.

**Blast radius:** mọi màn `/admin` (sáng + tối): nút, input, react-select, checkbox/radio, dropzone, bảng list, card, tab, pill, popup, nav trái, banner, trang login. Biến `--theme-elevation-*`, `--theme-bg`, `--style-radius-*`, `--gutter-h`, `--nav-width` của Payload bị ghi đè ngoài `@layer`. Không đụng `src/app/(frontend)`: `custom.scss` chỉ nạp ở layout `(payload)`.

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 243 file, 2547/2547 test (exit 0). Lần này không có lỗi DB recovery mode hay timeout Header.test |
| `pnpm build` | PASS (exit 0) |

## Kiểm trọng tâm
- **Token đúng design §1.1/§1.2/§1.3/§1.4/§1.6.1:** OK. Đối chiếu từng giá trị trong `admin-tokens.ts` với bảng design: 15 màu × 2 theme, 6 badge × 2 theme, các bậc elevation design cho sẵn (0..500, 600, 800, 1000) và radius/shadow đều khớp. Các bậc lẻ là giá trị nội suy, đơn điệu đúng chiều.
- **Contrast tính thật:** OK. `luminance` dùng hệ số sRGB WCAG (0.2126/0.7152/0.0722, ngưỡng tuyến tính 0.04045, mũ 2.4). Ratio = (L1+0.05)/(L2+0.05). Test assert từ token, không tự khẳng định. Tôi tính tay để kiểm chéo: elevation-400 sáng `#6E6862` trên `#EFEEEC` ≈ 4.74 (≥ 4.5). Xem MINOR-2 về chuyện làm tròn.
- **SCSS ↔ TS:** OK cho màu, badge, 21 bậc elevation × 2 theme (test đọc `_tokens.scss` theo từng khối `:root` / `html[data-theme="dark"]`). Radius/shadow chưa được đối chiếu, xem MINOR-3.
- **Không `!important` mới:** OK. 3 chỗ `!important` còn lại đều là logo có sẵn ở `custom.scss:127-138`.
- **Không đổi `--base` / `--base-body-size`:** OK. Grep không thấy khai báo nào.
- **`--gutter-h` / `--nav-width` theo breakpoint:** OK. Mốc khớp `app.scss` của Payload 3.91 (mid-break 1024, small-break 768). Payload tự đặt `--nav-width: 100vw` ở small-break, bản này giữ nguyên.
- **Phạm vi:** OK. Không đụng frontend, schema, access, hook, API, `TranslationStatusFilter`. `TranslationFailedBanner` giữ nguyên nội dung/logic, chỉ thay inline style bằng class.
- **File ≤ 300 dòng / hàm ≤ 50:** OK (_tokens 154, _controls 266, _surfaces 208, _lists 175, ts 139, test 119).

## Responsive Checklist Gate (diff đụng UI admin; widths 375/768/1280, không có browser nên xác minh bằng CSS math)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK (CSS math + đo của builder) | Không thêm width cố định. Bảng ≤1024 vẫn cuộn trong `.table { overflow: auto }` của Payload. `_lists.scss:68-75` bỏ bo/viền dọc. Builder đo list 1440/390 sáng + tối không có h-scroll |
| Mobile-first `min-width` | OK, ngoại lệ có lý do | Dùng `max-width` 767/768/1024 để ghi đè đúng mốc desktop-first của Payload (`mid-break` / `small-break`). Viết `min-width` sẽ lệch cascade với Payload |
| Grid `auto-fit`/`minmax`, container không fixed px | N/A | Diff không tạo grid/container mới. `--nav-width: 256px` là token design §1.4, Payload vốn đã fixed 275px |
| Font `rem`, heading `clamp()` | OK, ngoại lệ có lý do | Thang chữ admin Payload dùng px. Design §1.5 chốt px và cấm đổi `--base`. Heading 24px tĩnh theo design |
| Media `max-width`/`aspect-ratio`/`srcset` | N/A | Không có media mới |
| **Touch target ≥ 44×44 (mobile)** | **FAIL** | Đã đạt 44px: nút, input, react-select control, search bar, nav link, pill tạo mới. Checkbox/radio thì `_controls.scss:261-265` chỉ đặt hộp 22×22 trong khối có comment "vùng chạm 44px". `.checkbox-input` là `inline-flex` không có min-height (Payload `fields/Checkbox/index.scss:17-29`) nên vùng chạm cả hàng khoảng 22px chiều cao. Xem MAJOR-1 |
| Nav mobile (hamburger, không tràn) | OK | Giữ hamburger/drawer của Payload. `.hamburger:focus-visible` có ring. Nav 100vw như Payload |
| Table scroll wrapper / card | OK | Wrapper `.table` của Payload có `overflow: auto` |
| Không `100vh` trần | OK | Không dùng `vh` (chỉ có `100vw` trùng Payload) |
| `prefers-reduced-motion` | N/A | Diff không thêm animation/transition |
| Không che lỗi bằng `overflow: hidden` | OK | `overflow: hidden` duy nhất ở `.rs__menu` (`_controls.scss:176`), dùng để cắt option theo bo góc menu, không che tràn layout |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: `aislop` không nằm trong danh sách verify command được phép chạy của reviewer |
| oxlint (anti-slop) | skip: oxlint chưa cấu hình (dự án dùng eslint; `pnpm lint` PASS) |
| ocr (open-code-review) | skip: ocr chưa cài / không có trong lệnh được phép |
| AI-readable | OK: tên rõ, không có hàm > 50 dòng, comment giải thích WHY (layer, contrast, selector nguồn Payload). 0–1 indicator (MINOR-3), dưới ngưỡng 3 |
| ai-friendly-web | N/A: admin nội bộ, không public |
| blitzstrike | N/A: không phải STRICT, không có bề mặt auth/input mới |

## Findings

### [MAJOR-1] Vùng chạm checkbox/radio trên mobile < 44px, chưa đạt yêu cầu "Mobile < 768: vùng chạm 44px"
- `src/components/admin/styles/_controls.scss:261-265`: khối `@media (max-width: 767px)` (comment "vùng chạm 44px (design §1.4)") chỉ đặt `.checkbox-input__input, .radio-input__styled-radio { width: 22px; height: 22px }`. `.checkbox-input` của Payload là `inline-flex` không có min-height, nên cả hàng (hộp + label) cao khoảng 22px. Không đạt gate responsive (≥ 44×44) cũng như yêu cầu 2 của task.
- **Fix đề xuất:** trong cùng khối mobile, cho hàng một vùng chạm 44px mà vẫn giữ hộp 22px, ví dụ `.checkbox-input, .radio-input { min-height: 44px; align-items: center; }`. Label đã là `<label for>` nên chạm label sẽ toggle. Cần đo lại form Projects ở 390px.

### [MINOR-1] "Header bảng dính" không có hiệu lực (CSS chết)
- `src/components/admin/styles/_lists.scss:14-17`: `th { position: sticky; top: 0 }` nằm trong `.table` của Payload, vốn có `overflow: auto` (`@payloadcms/ui/dist/elements/Table/index.scss:6`) và không có max-height. Vì vậy th chỉ dính trong vùng cuộn của chính `.table`, cuộn trang thì không dính. Nếu có tác dụng ở viewport thì `top: 0` còn bị app-header của Payload che.
- **Fix đề xuất:** chọn một trong hai: (a) bỏ sticky và ghi vào Residual risk / design rằng header dính để task list view (T03/T04) xử lý; (b) cho `.collection-list .table` một `max-height` (ví dụ `calc(100dvh - …)`) để có vùng cuộn dọc riêng. Đừng để task ghi đã làm trong khi rule không có tác dụng.

### [MINOR-2] Test làm tròn ratio về 2 chữ số trước khi so ngưỡng
- `src/components/admin/admin-tokens.test.ts:33`: `Math.round(... * 100) / 100` rồi mới `toBeGreaterThanOrEqual(4.5)`. Ratio thật 4.495 sẽ thành 4.50 và PASS sai. Các token hiện tại đều dư biên (thấp nhất khoảng 4.7) nên chưa ảnh hưởng, nhưng sau này chỉnh token sát ngưỡng thì test có thể báo PASS sai.
- **Fix đề xuất:** so giá trị chưa làm tròn, chỉ làm tròn trong message.

### [MINOR-3] `ADMIN_RADIUS` / `ADMIN_SHADOW` xuất ra nhưng không được đối chiếu với SCSS; `contrastRatio` export từ file test
- `admin-tokens.ts:133-139` có comment "một nguồn giá trị", nhưng test (`admin-tokens.test.ts:88-118`) chỉ so màu/badge/elevation. `--admin-radius-*` / `--admin-shadow-*` trong `_tokens.scss:35-39,109-110` có thể trôi mà không ai biết. `export function contrastRatio` trong file `.test.ts` (dòng 30) là export thừa.
- **Fix đề xuất:** thêm 1 case so radius/shadow (hoặc bỏ 2 const này khỏi TS nếu không dùng), và bỏ `export` của `contrastRatio`.

### [MINOR-4] Focus checkbox vẫn là glow `!important` của Payload, chưa phải outline 2px offset 2px
- Payload `fields/Checkbox/index.scss:68-77` đặt `box-shadow: 0 0 3px 3px var(--theme-success-400) !important` khi `:focus-within`. CSS ngoài layer không thắng được `!important` trong layer, mà task lại cấm thêm `!important`. Glow màu nhấn vẫn là chỉ báo focus nhìn thấy được nên chỉ tính MINOR, không chặn.
- **Fix đề xuất:** ghi vào Residual risk, hoặc thêm `outline` cho `.checkbox-input:focus-within .checkbox-input__input` để đồng bộ với ring 2px (glow vẫn còn kèm).

## Residual risk
- Không có browser: phần layout 1440/390 sáng + tối, menu react-select đang mở, popup và login tối dựa vào số đo của builder (task file) cộng CSS math. Builder tự ghi nhận chưa đo bằng số login tối và dropdown đang mở.
- Đã chạm cap tool đọc của NORMAL (15). Chưa đối chiếu từng chi tiết design §4/§5/§8 ngoài phần task file đã liệt kê (header 12/500, dòng 48, hover, option hover elevation-100, option chọn accent-soft, menu shadow-md: các phần này đều đã có trong code).
- Chưa chạy `pnpm generate:types` / `migrate:create`. Diff chỉ có CSS/TSX trình bày, không đụng config collection, nên rủi ro migration xem như không có.

## Verdict: FAIL
Còn 1 MAJOR (MAJOR-1: vùng chạm checkbox/radio trên mobile, cũng làm gate Responsive mục Touch FAIL). Các MINOR nên sửa cùng round (MINOR-1 tối thiểu phải gỡ hoặc ghi rõ thành residual).
