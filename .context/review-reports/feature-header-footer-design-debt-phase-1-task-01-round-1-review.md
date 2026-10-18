Agent: reviewer

# Review — feature-header-footer-design-debt · phase-1-task-01 · round 1

- Task: `tasks/feature-header-footer-design-debt/phase-1-task-01.md` (BL-001, header 1 hàng ở ≥ xl + CTA + logo từ CMS)
- Diff: `src/components/layout/{BrandLogo,DesktopNav,Footer,Header,MobileMenu,PublicShell,load-shell,shell-data}.ts(x)` + `Header.test.tsx`, `PublicShell.test.tsx`, `shell-data.test.ts` (chưa commit, branch `staging`)
- Spec: `.context/design-spec.md` §2.1/§2.2 (delta intent 2026-10-19), `spec/changes/2026-10-19-header-footer-design-debt.md`

## Review level
**STRICT**

## Reason
Component dùng chung cho khung trang của mọi trang công khai (`/`, `/en`), có navigation (DesktopNav/MobileMenu dialog), view model server→client (`ShellView`), và đọc global có cache (`header`, `site-settings`).

## Blast radius
- Mọi trang public: Header (cả bản đặc và bản trong suốt), menu toàn màn hình (client, Radix Dialog), Footer.
- `ShellView` (`shell-data.ts`, `load-shell.ts`) thêm `cta?`, `logo`. Typecheck PASS nên mọi chỗ gọi đã được cập nhật.
- Cache `unstable_cache` của `getSiteSettings`/`getHeader` (tag `global:<slug>`, 60s) vẫn như cũ. Không đổi schema, không cần migration.
- Ảnh logo từ CMS dùng `next/image` `unoptimized`, đường dẫn media `/api/media/file/...` hoặc S3.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/layout` | PASS, 12 file / 82 test |
| `pnpm lint` (eslint) | PASS (không có output lỗi) |
| `pnpm typecheck` (`tsc --noEmit`) | PASS |
| `pnpm test` | 227/228 file, 2437/2438 test PASS. Fail duy nhất: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … -> 400", đã fail từ trước (phụ thuộc ngày), được chấp nhận |
| `pnpm build` | **bỏ qua** (tốn thời gian; builder báo PASS; typecheck + lint đã PASS) |
| Trình duyệt (dev server 375/768/1280) | **Không chạy được**: reviewer không có công cụ trình duyệt. Phần responsive kiểm bằng phép tính CSS và số đo builder ghi lại, xem Residual risk |

## Kiểm trọng tâm
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| CTA ẩn khi thiếu nhãn ở locale đang xem, không mượn VI cho EN (BR-07) | OK | `shell-data.ts` `buildCta` → `toLinkView` (label trim + `resolveNavLink`). `label` của `ctaButton` là `localized: true` (`globals/Header.ts:33`), đọc với `fallbackLocale: false` (`read-global.ts:13`). Đã có test cho trường hợp `undefined`/khoảng trắng ở `en` |
| Link an toàn (`javascript:` bị chặn) | OK | `resolveNavLink` chỉ nhận khoá trang hoặc http(s) (`nav-link.ts:29-58`). Đã có test `javascript:alert(1)` → `undefined`. Link ngoài có `target=_blank rel=noopener noreferrer` qua `NavAnchor` (có test) |
| View model client chỉ chứa trường hiển thị | OK | `toLogoImage` chỉ trả `{url,width,height}`. Có test cho thấy không lộ `uploadedBy`/`alt`/`id`. `MobileMenu` (client) chỉ nhận `LogoView`/`LinkView` |
| Fallback logo CMS | OK | id string (chưa populate), thiếu url hoặc kích thước, global null → logo tĩnh theo `tone`. Ưu tiên `sizes.card` (800w, webp, không có `height` nên không crop, `Media.ts:57`) |
| `next/image` `unoptimized` hợp lệ | OK | Cùng cách với `ResponsiveImage`/`VideoFacade`. Ảnh CMS không đi qua `/_next/image` nên không cần `remotePatterns`. Logo tĩnh vẫn được tối ưu như trước |
| `readPublicGlobal` populate upload | OK | `depth: 1`, `overrideAccess: false`. Media có `read: () => true` (`Media.ts:32`) nên populate được khi đọc ẩn danh |
| Menu toàn màn hình mở được ở ≥ xl, không tự đóng | OK | Đã bỏ `xl:hidden` khỏi Trigger và bỏ `useCloseOnDesktop`. Có test cho cả hai |
| Focus trap / Esc / khoá cuộn | OK (không regress) | Radix Dialog và Overlay giữ nguyên, chỉ thêm CTA (`onClick={close}`, có test đóng menu) |
| Thứ tự Tab | OK | DOM: logo → menu ngang → tìm → VI\|EN → CTA → Menu. Trùng thứ tự hiển thị ở ≥ xl. Ở < xl là `order-*` có sẵn từ L5-T05, không đổi |
| Tên truy cập nút Menu ở xl (chỉ icon) | OK | Span sr-only "Mở menu" bật `xl:inline 2xl:hidden`. Đã soát tổ hợp class: mỗi breakpoint đều có đúng 1 nhãn (hiện hoặc sr-only), kể cả biến thể có CTA `md:hidden lg:inline` / `md:inline lg:hidden` |
| Cache/revalidate header/site-settings | OK | `get-globals.ts` không đổi, tag `global:<slug>` giữ nguyên |
| Không đọc `cookies()`/`headers()` | OK | Diff không thêm |
| Header không tràn ở 1280 | **FAIL (rủi ro chưa được chặn)** | Xem MAJOR-1 |

## Responsive Checklist Gate (diff có đụng UI)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375 | OK | CTA `hidden` < md. Cụm phải còn Menu 44px (VI\|EN ẩn < sm). Builder đo 375 không cuộn ngang |
| Không cuộn ngang / không chồng lấn 768 | OK (logo có thể lệch tâm, MINOR-1) | `flex-1` hai bên ≈ (768 − 2·gutter ≈ 50 − logo 77 − gap 32)/2 ≈ 300px. VI\|EN + CTA (px-3) + Menu icon ≈ 250px, vừa |
| Không tràn 1280 | **FAIL** | MAJOR-1: dư ≤ 17px theo đo trong emulation; ở cửa sổ 1280 thật có scrollbar 15–17px thì dư ≈ 0; logo CMS không giới hạn chiều rộng |
| Mobile-first `min-width` | OK | Chỉ dùng tiền tố tăng dần `sm/md/lg/xl/2xl` |
| Container không fixed px | OK | `max-w-container` (80rem) + `px-gutter` (clamp) |
| Typography rem / token | OK | `text-small` token, không thêm px |
| Media: tỉ lệ ảnh | OK | `width`/`height` thật + `h-10 w-auto lg:h-12` giữ tỉ lệ. Thiếu chặn chiều rộng tối đa, đã gộp vào MAJOR-1 |
| Touch target ≥ 44px | OK | CTA `min-h-11`, Menu `min-h-11 min-w-11`, CTA trong menu `min-h-11` |
| Nav mobile/hamburger | OK | Nút Menu có ở mọi breakpoint |
| Table | N/A | Không có |
| `100vh` | N/A | Không thêm |
| `prefers-reduced-motion` | N/A | Không thêm chuyển động |
| Không che lỗi bằng `overflow:hidden` | OK | Không dùng (nhưng không có cách chống tràn nào khác, xem MAJOR-1) |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: không có trong danh sách verify command được phép chạy |
| oxlint (anti-slop) | skip: oxlint chưa được cấu hình (repo dùng eslint, `pnpm lint` PASS) |
| ocr (open-code-review) | skip: ocr chưa cài |
| AI-readable | OK. Tên rõ (`buildCta`, `buildLogo`, `toLogoImage`, `LogoImageView`). Mọi hàm < 50 dòng, mọi file < 300 dòng, không có indirection thừa. Comment giải thích WHY. 0 indicator |
| impeccable / frontend-checklist | OK, trừ MAJOR-1 (hàng header phụ thuộc nội dung CMS mà không có biện pháp chống tràn) |
| ai-friendly-web | N/A: không đổi `robots`/`sitemap`/`llms` |
| blitzstrike | skip: không có môi trường. Bề mặt bảo mật (link CMS) đã có `resolveNavLink` + test |
| Surgical diff | OK. Mọi dòng thay đổi đều gắn với yêu cầu của task. Đổi gap `DesktopNav` (6 → 4 ở xl) đúng với yêu cầu 1 |

## Findings

### [MAJOR-1] Hàng header ở 1280 không có biện pháp chống tràn; dư ≤ 17px, thực tế có thể ≈ 0
- Vị trí: `src/components/layout/Header.tsx:45-50,65`, `src/components/layout/BrandLogo.tsx:27`, `src/components/layout/DesktopNav.tsx:38`
- Vấn đề:
  1. Builder đo trong Chrome emulation: nav cần 695px, còn 712px, với CTA mô phỏng 150px. Cửa sổ 1280 thật trên Windows có scrollbar dọc 15–17px, nên bề rộng layout còn khoảng 1263px. `max-w-container` = 80rem nên container co theo. `px-gutter` gần như không đổi (≈ 31px mỗi bên), nên phần nav mất khoảng 16px. Chỗ dư còn khoảng 0–1px, tức đúng ở ngưỡng. Emulation không chứng minh được acceptance "không tràn ở 1280".
  2. Logo CMS mới (`site-settings.logo`/`logoDark`) không giới hạn chiều rộng: `h-12 w-auto` với logo ngang 3:1 sẽ rộng 144px, so với logo tĩnh khoảng 92px, tức thêm khoảng 52px. Trong khi đó admin đổi được logo bất kỳ lúc nào.
  3. Nhãn CTA (CMS, localized) cũng không có giới hạn chiều rộng.
  4. Khi thiếu chỗ: mục nav có `whitespace-nowrap`, wrapper `min-w-0 xl:justify-center` nên `<ul>` tràn ra cả hai phía và đè lên logo và nút tìm. Kết quả là chữ chồng nhau và link bị che, chứ không phải cuộn ngang. Vì vậy kiểm `scrollWidth` không bắt được lỗi này.
- Cách sửa đề xuất. Làm a + b, rồi đo lại thật ở cửa sổ 1280 có scrollbar với 7 nhãn VI + CTA "Nhận tư vấn" có thật trong DB dev:
  - a. Chặn chiều rộng logo: `BrandLogo` thêm `max-w-[7.5rem] object-contain object-left` hoặc `xl:max-w-[6rem]`. Logo tĩnh 92px nên không bị ảnh hưởng.
  - b. Chặn chiều rộng CTA: thêm `max-w-[10rem] truncate` vào class CTA ở header (CTA trong menu toàn màn hình giữ nguyên nhãn đầy đủ). Nhãn ngắn không đổi, nhãn dài không làm vỡ hàng.
  - c. Nếu sau a + b vẫn dư < 24px ở bề rộng layout 1263px: ẩn CTA ở header trong khoảng xl–<2xl (`md:inline-flex xl:hidden 2xl:inline-flex`). CTA vẫn có trong menu toàn màn hình, mở bằng nút Menu kề bên. Cách này lệch spec §2.1 ("phải: … CTA (nếu bật)") nên **cần user duyệt spec delta** trước khi làm. Không làm ngầm.
  - Không nên cho nav cuộn ngang hoặc dùng `overflow:hidden` để che lỗi (vi phạm responsive gate).
  - Bổ sung bằng chứng đo vào task: kích thước cửa sổ, có/không scrollbar, `nav.scrollWidth` ≤ `wrapper.clientWidth`, `getBoundingClientRect` của nav không giao với logo/tìm.

### [MINOR-1] Logo ở 768 khi có CTA chưa đo thật
- Vị trí: `src/components/layout/Header.tsx:65`, `src/components/layout/MobileMenu.tsx:39-40`
- Builder tự ghi: logo lệch tâm khoảng 19px trước khi thu `md:px-3`, sau đó chỉ ước khoảng 3px, chưa đo lại vì DB dev chưa có `ctaButton`. Nhãn CTA dài (EN) có thể đẩy cụm phải vượt nửa hàng.
- Đề xuất: cấu hình `ctaButton` trong DB dev và đo lại 768 cho cả VI/EN. Cách b ở MAJOR-1 (`max-w` + `truncate`) cũng giới hạn được trường hợp này.

### [MINOR-2] Đổi file logo trong Media có thể cho ảnh hỏng tới 60s
- Vị trí: `src/components/layout/load-shell.ts:63-64`
- `site-settings` cache theo tag `global:site-settings`. Sửa hoặc đổi file trên doc media (không lưu lại global) không revalidate global, nên URL cũ (file đã bị thay) có thể 404 tới 60s. Mức này nằm trong ngưỡng ARCHITECTURE §5.1 (≤ 1 phút), chỉ ghi Residual risk. Không bắt buộc sửa.

## Residual risk
- Chưa kiểm bằng trình duyệt ở 375/768/1280 (reviewer không có công cụ trình duyệt). Kết luận responsive dựa trên phép tính CSS và số đo builder ghi lại.
- `pnpm build` không chạy lại (builder báo PASS).
- Doc impact (`docs/DESIGN.md` § Logo / khung trang, `docs/ARCHITECTURE.md`) để close-out điền. Code đã khớp `docs/DESIGN.md:152`.

## Verdict
**FAIL**: 1 MAJOR (MAJOR-1: header ở 1280 chưa chứng minh được không tràn, không có giới hạn chiều rộng cho logo/CTA lấy từ CMS). Responsive gate có mục FAIL. Builder sửa MAJOR-1 (a + b, đo lại thật). Phương án c chỉ làm khi user duyệt spec delta. MINOR-1 nên làm cùng.
