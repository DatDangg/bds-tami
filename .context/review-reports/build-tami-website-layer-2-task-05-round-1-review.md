Agent: reviewer

# Review — build/tami-website · layer-2-task-05 · round 1

Giao diện admin: logo TAMI, màu nhấn #8C6733, Montserrat, admin chỉ tiếng Việt.

## Review level
**NORMAL**

## Reason
Task ghi kỳ vọng FAST, nhưng diff sửa `src/app/(payload)/layout.tsx` (RootLayout dùng chung cho toàn bộ /admin) và ghi đè biến theme toàn cục của Payload (`--color-success-*` ở `:root` và `html[data-theme="dark"]`). Không đụng auth, dữ liệu, schema, API → không cần STRICT.

## Blast radius
- Mọi màn /admin (login, nav, list, edit, drawer, modal, toast) ở cả giao diện sáng và tối: màu nhấn, focus ring, pill/banner success, màu thêm/xoá ở màn so sánh phiên bản, hàng/thẻ đang chọn.
- `src/app/(payload)/layout.tsx`: wrapper bọc toàn bộ children của RootLayout.
- `src/payload.config.ts` `admin.meta` + `admin.components.graphics`; `importMap.js` (file sinh).
- `public/brand/*` (asset tĩnh mới, khoảng 115 KB tổng).
- Website công khai: không ảnh hưởng (custom.scss chỉ import trong layout `(payload)`).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (eslint, exit 0) |
| `pnpm typecheck` | PASS (tsc --noEmit) |
| `pnpm test` (toàn bộ) | **Không ổn định**: 2 lần chạy, lần 1 có 4 file fail, lần 2 có 3 file fail. Các file fail đều là integration (`access`, `jobs-email`, `media-upload`) với lỗi `Hook timed out in 10000ms` ở `beforeAll` (Payload init + DB khi chạy song song). Không liên quan diff này. |
| `pnpm test tests/integration/access.test.ts src/components/admin` | PASS (3 file / 39 test). Gồm `Logo.test.tsx`. Integration pass khi chạy riêng → timeout do tải song song, có từ trước |
| `pnpm build` | PASS (`/admin/[[...segments]]` build được) |
| Dev server / trình duyệt /admin/login | Không chạy (ngoài quyền reviewer). Kết luận dựa trên CSS của `@payloadcms/ui` 3.91 + tính toán |

## Kiểm tra các điểm builder báo
- **Ghi đè `--color-success-*` có làm sai nghĩa "success" không:** Không. Trong Payload 3.91, `colors.scss` đặt `--color-success-500: rgb(21,135,186)` (xanh dương). Palette "success" chính là màu nhấn của Payload (focus checkbox/radio, dropzone, hàng/thẻ đang chọn, pill/banner, màu "thêm" ở màn so sánh phiên bản), không phải xanh lá "thành công". Toast dùng ToastContainer riêng. Ghi đè ramp này là cách chuẩn. **Nhưng phần ghi đè cho giao diện tối sai, xem MAJOR-1.**
- **Contrast (tôi tự tính lại):** trắng/#8C6733 = 5.17, trắng/#7A5A2C = 6.32, #8C6733/#F5F5F5 = 4.74, #141414/#E0BF89 = 10.5. Khớp số builder báo (sai số làm tròn). Nút chính đạt AA ở cả sáng và tối.
- **Wrapper `.tami-admin-root`:** `display: contents` không làm vỡ layout và không gây lệch hydration (server và client render giống nhau). **Nhưng font không tới được portal/modal/toast, xem MAJOR-2.**
- **titleSuffix " - TAMI Admin":** đáp ứng AC "tiêu đề tab TAMI Admin". OK.
- **Icon PNG 256×123:** ảnh crop đúng phần mái nhà (đã xem ảnh). Kích thước thật khớp `width/height` khai trong `next/image` (logo 800×416, icon 256×123) nên không bị méo.
- **Logo vàng trên nền trắng của màn login:** đúng quy tắc trong `docs/DESIGN.md` § Logo ("Logo vàng chỉ đặt trên nền sáng #FFFFFF…"). `alt="TAMI HOMES"` có ở cả 4 thẻ `<Image>`. OK.
- **i18n:** `supportedLanguages: { vi }`, `fallbackLanguage: "vi"`, `localization.locales: ["vi","en"]` vẫn giữ. Provider SessionKeepAlive không bị đụng. OK.
- **Dung lượng asset:** logo 17–56 KB, icon 2–11 KB. Hợp lý.

## Findings

### [MAJOR-1] Giao diện tối: palette màu nhấn bị đảo ngược hai lần → chữ gần như không đọc được
`src/app/(payload)/custom.scss:38-59` (khối `html[data-theme="dark"]`, phần `--color-success-*`)

Payload đã tự đảo palette ở giao diện tối: `colors.scss` dòng 190-231 trong `@layer payload-default` có `html[data-theme='dark'] { --theme-success-50: var(--color-success-950); … --theme-success-950: var(--color-success-50); }`. Builder đảo `--color-success-*` thêm một lần nữa, nên ramp `--theme-success-*` ở giao diện tối không còn đơn điệu:
theme-50=#5b4320, 100=#6a4e26, 150=#7a5a2c, 200=#8c6733 … 500=#e0bf89, 550=#8c6733, 600=#7a5a2c … 800=#342612, 950=#120d07.

Hệ quả, tính theo selector có sẵn trong `@payloadcms/ui/dist/styles.css`:
- `.banner--type-success` (nền theme-100, chữ theme-600): #7A5A2C trên #6A4E26 ≈ **1.2:1**
- `.pill--style-success` (nền theme-150, chữ theme-800): #342612 trên #7A5A2C ≈ **2.3:1**
- `.folder-file-card--selected`, `.draggable-table-row--selected`, các biến `--diff-create-*` ở màn so sánh phiên bản: cùng kiểu, chữ tối trên nền nâu tối.

Admin không cấu hình `admin.theme`, nên người dùng chọn được giao diện tối (hoặc theo hệ điều hành). Vi phạm AC "chữ đạt AA" ở các thành phần dùng palette nhấn.

**Cách sửa:** trong khối dark, giữ ramp cùng chiều với `:root` (50 sáng nhất → 950 tối nhất) vì Payload tự đảo, chỉ chỉnh để `--color-success-500: #e0bf89`. Như vậy `--theme-success-500` ở giao diện tối = #E0BF89 (10.5:1 trên #141414). Cách khác: ghi đè trực tiếp `--theme-success-*` trong `html[data-theme="dark"]`. Sau khi sửa, kiểm lại các cặp banner, pill, hàng đang chọn và diff-create ở giao diện tối.

### [MAJOR-2] Montserrat không áp dụng cho modal/drawer/toast (portal nằm ngoài wrapper)
`src/app/(payload)/layout.tsx:19` + `src/app/(payload)/custom.scss:63-67`

`--font-montserrat` (class `montserrat.variable`) và `--font-body` chỉ được khai báo trên `div.tami-admin-root`, tức là bên trong `children`. Trong `@payloadcms/ui/dist/providers/Root/index.js:99-120`, `children` nằm sâu trong cây provider, còn `ModalContainer`, `StayLoggedInModal` và `ToastContainer` render **ngang hàng** với nó, ngoài wrapper. Các phần này vẫn dùng `--font-body` mặc định của Payload (font hệ thống): drawer sửa quan hệ, drawer upload/chọn media, modal xác nhận xoá, modal "phiên sắp hết hạn", toast. Vậy AC "font Montserrat" chỉ đạt một phần.

**Cách sửa:** bỏ wrapper div và truyền `htmlProps={{ className: montserrat.variable }}` cho `RootLayout` (prop này có sẵn: `@payloadcms/next/dist/layouts/Root/index.js:43,107` spread vào `<html>`). Trong `custom.scss`, chuyển `--font-body: var(--font-montserrat), …` lên `:root`. CSS không nằm trong layer nên thắng `payload-default`, và biến resolve ngay tại `<html>`.

### [MINOR-1] Asset không dùng tới
`public/brand/tami-logo-dark.png`, `public/brand/tami-icon-dark.png` không được tham chiếu ở đâu (YAGNI, khoảng 29 KB). Nên bỏ, hoặc ghi rõ trong task là chuẩn bị cho task nào (vd header sticky của website).

### [MINOR-2] Favicon không vuông
`src/payload.config.ts` `meta.icons` dùng `tami-icon-gold.png` 256×123 (tỉ lệ khoảng 2:1). Trình duyệt sẽ co ảnh vào ô vuông 16/32px, biểu tượng thành dải mỏng. `docs/DESIGN.md` § Logo bước 3 yêu cầu icon vuông (`favicon.ico` 32×32, `icon.svg`). Builder đã ghi lý do (thiếu Inkscape). Chấp nhận tạm, nhưng nên pad ảnh thành vuông (sharp `extend`) hoặc ghi vào residual/gap để làm khi xuất asset favicon.

### [MINOR-3] Test integration không ổn định khi chạy cả bộ (có từ trước, ngoài scope)
`tests/integration/{access,jobs-email,media-upload}.test.ts` timeout hook 10s khi chạy song song. Task file ghi "test PASS (38 files / 388 tests)", nhưng reviewer chạy 2 lần đều không tái hiện được. Không do diff này gây ra. Đề xuất task riêng: tăng `hookTimeout` cho project integration hoặc chạy tuần tự.

## Responsive Checklist Gate
Diff chỉ đụng UI admin của Payload (logo/icon + biến theme), không có layout/route công khai mới. Kiểm bằng đọc CSS; chưa xem bằng trình duyệt.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `.tami-admin-logo { width:100%; max-width:280px }`, `.tami-admin-icon { width:100%; max-width:48px }`. Không có width cố định gây tràn ở 375 |
| Mobile-first / grid auto-fit | N/A | Không thêm grid/media query |
| Container không fixed px | OK | Chỉ dùng `max-width`, `width:100%` |
| Font-size rem / heading clamp | N/A | Không đổi cỡ chữ; chỉ đổi font-family |
| Ảnh `max-width:100%; height:auto` | OK | `img { width:100%; height:auto }`; `next/image` có width/height thật → giữ tỉ lệ, không CLS |
| srcset/sizes | OK | `next/image` tự sinh srcset |
| Touch target ≥44px | N/A | Không thêm phần tử tương tác (nav/nút của Payload giữ nguyên) |
| Nav mobile / table scroll | N/A | Không đổi |
| 100vh / reduced-motion / overflow hidden | N/A | Không dùng |

## Skill gates
| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` không có |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc*`; eslint PASS |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` không có |
| AI-readable | OK (0 indicator) | Tên rõ ràng, hàm ngắn, comment giải thích WHY (contrast, lý do override); không có magic number không giải thích |
| ai-friendly-web | N/A | /admin là trang nội bộ, không public |
| blitzstrike | N/A | Không phải STRICT; không đụng auth/input |
| impeccable / frontend-checklist (contrast, alt) | **FAIL** | Nút chính và màu nhấn ở giao diện sáng đạt AA; `alt` đầy đủ. Giao diện tối FAIL contrast (MAJOR-1) |
| Surgical diff | OK | Mọi dòng phục vụ task, trừ 2 asset dark không dùng (MINOR-1) |

## Residual risk
- Chưa xem /admin/login và giao diện tối trong trình duyệt. Kích thước icon trong khe `graphics.Icon` (step-nav/nav) chưa kiểm bằng mắt.
- Contrast ở giao diện tối tính từ selector trong `@payloadcms/ui` 3.91; nâng phiên bản Payload có thể đổi cách map theme.

## Verdict
**FAIL**: 2 MAJOR (MAJOR-1 contrast giao diện tối do đảo palette hai lần; MAJOR-2 Montserrat không áp dụng cho modal/drawer/toast). Gửi builder sửa rồi review round 2. MINOR nên xử lý cùng lúc nếu rẻ.
