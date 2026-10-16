Agent: reviewer

# Review: build/tami-website, layer-2-task-05, round 2

Giao diện admin: logo TAMI, màu nhấn #8C6733, Montserrat, admin chỉ tiếng Việt. Round 2 sau round 1 FAIL (MAJOR-1 contrast giao diện tối, MAJOR-2 font không tới portal).

## Review level
**NORMAL** (giống round 1)

## Reason
Diff ghi đè biến theme toàn cục của Payload (`--color-success-*` ở `:root`, `--theme-success-*` ở `html[data-theme="dark"]`, `--font-body`) và truyền `htmlProps` vào `RootLayout`, nên ảnh hưởng mọi màn /admin. Không đụng auth, dữ liệu, schema hay API, nên không cần STRICT.

## Blast radius
- Mọi màn /admin ở giao diện sáng và tối: nút chính, link, focus ring, checkbox/radio, banner/pill success, hàng/thẻ đang chọn, dropzone, màu "thêm" ở màn so sánh phiên bản, `::selection`, query-inspector.
- Thẻ `<html>` của /admin (thêm class `montserrat.variable`).
- `src/payload.config.ts` (`admin.components.graphics`, `admin.meta`), `importMap.js` (file sinh), `public/brand/*` (4 PNG, khoảng 87 KB).
- Website công khai: không ảnh hưởng (custom.scss chỉ import trong layout `(payload)`).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` lần 1 | PASS: 38 files / 388 tests |
| `pnpm test` lần 2 | PASS: 38 files / 388 tests (lần này không tái hiện timeout integration của round 1) |
| `pnpm build` | PASS (exit 0, có `/admin/[[...segments]]`) |
| Dev server /admin/login | Không chạy (ngoài quyền reviewer). Kết luận dựa trên CSS `@payloadcms/ui` 3.91 / `@payloadcms/next` 3.91 và tính contrast bằng script node (công thức WCAG 2.x) |

## Kiểm chứng các mục builder báo đã sửa
- **MAJOR-1 (dark palette): đã sửa.** `custom.scss:40-66` ghi đè thẳng `--theme-success-*` trong `html[data-theme="dark"]` (ngoài layer, thắng `@layer payload-default`). Ramp đi một chiều (50 = #120D07 tối nhất, 950 = #FDFAF6 sáng nhất), 500 = #E0BF89. Tôi tự tính lại theo selector thật trong `@payloadcms/ui/dist/styles.css`:
  - Tối: banner 600/100 = 12.30, hover 800/200 = 12.64, pill 800/150 = 14.22, diff pill 600/200 = 10.00, diff parent 800/100 = 15.55, diff link 600/100 = 12.30, nhãn thẻ chọn 800/50 = 16.66, số đếm kéo-thả 50/600 = 13.18, hàng chọn 800/150 = 14.22, icon dots 400/50 = 3.78, focus radio 400/#141414 = 3.60, ring 500 = 10.51, dropzone border 500/150 = 9.42.
  - Nút chính: sáng 5.12 / hover 6.31; tối 10.51 / hover 12.56. Link sáng 5.12 (trên #FFF), 4.69 (trên #F5F5F5); tối 10.51. Khớp số builder báo.
- **MAJOR-2 (font): đã sửa.** `layout.tsx:22` truyền `htmlProps={{ className: montserrat.variable }}`. Trong `@payloadcms/next/dist/layouts/Root/index.js:102-107`, `<html>` đặt `data-theme`, `dir`, `lang`, `suppressHydrationWarning` rồi mới spread `...htmlProps`. Builder chỉ truyền `className`, Payload không đặt `className` trên `<html>`, nên không đè thuộc tính nào. `ThemeProvider` phía client chỉ `setAttribute('data-theme')` (`@payloadcms/ui/dist/providers/Theme/index.js:27,78,83`), không đụng class. `--font-body` đặt ở `:root` (`custom.scss:70-72`), biến `--font-montserrat` resolve ngay tại `<html>`, nên modal/drawer/toast (portal ngoài children) nhận Montserrat. Wrapper div đã bỏ.
- **MINOR-1: đã sửa.** `public/brand/` chỉ còn `tami-logo-gold/white.png` (800×416) và `tami-icon-gold/white.png`. Không còn asset dark.
- **MINOR-2: đã sửa.** Header PNG: cả hai icon 256×256, color type 6 (RGBA, có kênh trong suốt). `Icon.tsx` khai `width={256} height={256}`, khớp kích thước thật nên không méo.
- **MINOR-3:** ngoài scope; 2 lần chạy round này đều PASS.

## Findings

### [MAJOR-1] Giao diện sáng: chữ "thêm mới" ở màn so sánh phiên bản chỉ đạt 4.39:1 (< 4.5 AA), số contrast trong code comment và task file sai
`src/app/(payload)/custom.scss:10` (comment "diff "added" #5B4320/#E0BF89 5.28") và ramp sáng `custom.scss:22,30` (`--color-success-200: #e0bf89`, `--color-success-600: #6a4e26`).

Payload định nghĩa `--diff-create-pill-bg: var(--theme-success-200)` và `--diff-create-pill-color: var(--theme-success-600)`, dùng cho chữ được chèn trong `.html-diff [data-match-type=create]` (`@payloadcms/ui/dist/styles.css`), và cho `.relationship-diff__pill` / `.upload-diff__pill` (`@payloadcms/next/dist/prod/styles.css`). Ở giao diện sáng, theme-success-600 = `--color-success-600` = **#6A4E26**, không phải #5B4320 như comment ghi. #6A4E26 trên #E0BF89 = **4.39:1**, dưới AA 4.5 cho chữ thường. Round 1 đã yêu cầu kiểm lại đúng cặp diff-create này; con số 5.28 trong comment và trong `tasks/tami-website/layer-2-task-05.md` (Feature Verification, Attempt 2) là của cặp 650/200, không phải cặp Payload thật sự dùng.

Hiện chưa collection nào bật `versions`, nhưng `docs/specs/2026-10-16-tami-website-design.md` và `docs/ERD.md` có nhắc versions/drafts, và theme này áp dụng cho toàn admin. Phần lớn là chữ cỡ nhỏ trong diff, nên không được bỏ qua AA.

**Cách sửa (1 dòng, chọn một):**
- Trong `:root` thêm `--diff-create-pill-color: var(--theme-success-650);` (#5B4320/#E0BF89 = 5.28). Cách này chỉ ảnh hưởng diff. Ở giao diện tối thì 650 = #EFDBB7 trên #342612, khoảng 10.8, vẫn đạt.
- Hoặc làm tối `--color-success-600` (vd #5f4522). Cách này kéo theo banner, link diff và số đếm kéo-thả, nên phải tính lại các cặp đó.

Sau khi sửa, cập nhật số trong comment `custom.scss:9-12` và task file cho đúng cặp biến Payload dùng.

### [MINOR-1] Query-inspector ở giao diện tối dùng trực tiếp `--color-success-450`
`custom.scss:27` (`--color-success-450: #946e39`). `@payloadcms/next/dist/prod/styles.css` có `.query-inspector{--string-color: var(--color-success-450)}`, dùng biến gốc chứ không qua theme. Ở giao diện tối: #946E39 trên #141414 = 3.99:1. Đây là công cụ dev (API/query inspector) nên ít ảnh hưởng. Có thể thêm `html[data-theme="dark"] .query-inspector { --string-color: var(--theme-success-500); }` nếu muốn đạt AA. Không chặn PASS.

### [MINOR-2] Hai khối `:root` tách rời trong cùng file
`custom.scss:14` và `custom.scss:70`. Không sai, nhưng gộp lại dễ đọc hơn. Không chặn PASS.

### Ghi chú (không phải finding)
Viền thẻ đang chọn ở giao diện tối (`--card-border-color: theme-success-300` = #4D391B trên #141414, 1.68) thấp. Đây là cùng kiểu với palette mặc định của Payload (300 ở giao diện tối vốn là màu tối), không phải regression; trạng thái chọn còn được thể hiện bằng nền và chữ.

## Responsive Checklist Gate
Diff chỉ đụng UI admin (logo/icon, biến theme, font). Không có route/layout công khai mới. Kiểm bằng đọc CSS, chưa xem bằng trình duyệt.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll (375/768/1280) | OK | `.tami-admin-logo { width:100%; max-width:280px }`, `.tami-admin-icon { width:100%; max-width:48px }`. Không có width cố định |
| Mobile-first / grid auto-fit | N/A | Không thêm grid hay media query |
| Container không fixed px | OK | Chỉ dùng `max-width` + `width:100%` |
| Font-size rem / heading clamp | N/A | Chỉ đổi font-family, không đổi cỡ chữ |
| Ảnh `max-width:100%; height:auto` + tỉ lệ | OK | `img { width:100%; height:auto }`; `next/image` khai width/height khớp file thật (800×416, 256×256) |
| srcset/sizes | OK | `next/image` tự sinh srcset |
| Touch target ≥44px | N/A | Không thêm phần tử tương tác |
| Nav mobile / table scroll | N/A | Không đổi |
| 100vh / reduced-motion / overflow:hidden | N/A | Không dùng |

## Skill gates
| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | giống round 1 |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc*`; eslint PASS |
| ocr (open-code-review) | skip, ocr not installed | giống round 1 |
| AI-readable | OK (1 indicator: comment số liệu contrast sai, xem MAJOR-1) | Dưới ngưỡng 3. Tên rõ, không có hàm dài, comment giải thích WHY |
| ai-friendly-web | N/A | /admin là trang nội bộ |
| blitzstrike | N/A | Không phải STRICT, không đụng auth/input |
| impeccable / frontend-checklist (contrast, alt) | **FAIL** | Nút, link, banner, pill, thẻ chọn đạt AA ở cả sáng và tối; `alt` có đủ. Chữ diff-create ở giao diện sáng 4.39 (MAJOR-1) |
| Surgical diff | OK | Mọi dòng phục vụ task. Asset thừa đã bỏ |

## Residual risk
- Chưa xem /admin/login, giao diện tối và modal/drawer bằng trình duyệt. Font trên portal được suy ra từ cấu trúc DOM/CSS của Payload 3.91.
- Contrast tính theo map biến của `@payloadcms/ui` / `@payloadcms/next` 3.91; nâng phiên bản Payload có thể đổi cách map.
- Màn diff hiện chưa vào được (chưa có collection bật versions), nên lỗi MAJOR-1 chưa tác động người dùng nhưng sẽ lộ ra khi bật versions/drafts.

## Verdict
**FAIL**: 1 MAJOR (MAJOR-1: chữ diff-create ở giao diện sáng 4.39:1 < AA, và số contrast báo trong code/task sai cặp biến). MAJOR-1 và MAJOR-2 của round 1 đã sửa đúng; MINOR-1/2 của round 1 đã xong. Cách sửa chỉ 1 dòng CSS kèm sửa comment/task. Đề xuất round 3 ở mức FAST, chỉ kiểm cặp diff-create và các số trong comment.
