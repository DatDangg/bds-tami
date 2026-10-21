Agent: reviewer

# Review — bug-admin-nav-dashboard-sitelink · phase-1-task-01 · round 1 (BL-050)

- **Review level:** NORMAL
- **Reason:** Đụng style và component dùng chung của khung admin (nav trái và header, mọi trang `/admin/**`), nhưng không đụng auth/RBAC, dữ liệu, schema, API hay tenant. Root cause đã rõ và kiểm được trên nguồn Payload 3.91.
- **Blast radius:** mọi trang `/admin/**` đã đăng nhập: `.nav__wrap` (thêm mục đầu qua slot chính thức `beforeNavLinks`) và `.app-header__localizer` (vị trí ô Ngôn ngữ ở mọi breakpoint, LTR và RTL). `importMap.js` thêm 1 entry. Không ảnh hưởng frontend public.

## Kiểm root cause so với nguồn Payload 3.91
- `@payloadcms/ui/dist/elements/AppHeader/index.scss:14-26`: `.app-header__localizer.localizer { position:absolute; right: base(4.5) }`, RTL `left: base(4.5)`, small-break `right: base(2)`. Các rule này nằm trong `@layer payload-default`.
- `AppHeader/index.js:76-101`: `__localizer-spacing` và `__account` là hai phần tử liền nhau trong `__controls-wrapper` (flex, không có `gap`). `__content` có `padding: 0 var(--gutter-h)`. Vì vậy mép phải của ô giữ chỗ = mép phải header − gutter − 25px (avatar). Công thức `calc(var(--gutter-h) + 25px)` đúng ở mọi breakpoint với gutter 32/20/16 của `_tokens.scss` (mobile 41px, xấp xỉ 40px của Payload). Đây là công thức, không phải số mò. Số đo trình duyệt (chênh giữa ô thật và ô giữ chỗ = 0) khớp với phân tích.
- Specificity / @layer: `_surfaces.scss` không nằm trong layer nào (`custom.scss:3`) nên thắng `payload-default` ở mọi media query. RTL: `[dir="rtl"] .app-header__localizer.localizer` (0,3,0) thắng rule LTR ngoài layer, đặt `right: unset` rồi `left` theo gutter + 25. Trong RTL avatar nằm ở mép trái nên công thức đối xứng đúng. Rule `--nav-open { display:none }` của Payload vẫn còn hiệu lực.
- Nav: `@payloadcms/next/dist/elements/Nav/index.js:161-166`: `beforeNavLinks` render trong `nav.nav__wrap`, đứng trước `DefaultNavClient`, nên đúng vị trí đầu menu. Markup của component mới bám `index.client.js:81-103`: `nav__link`, `nav__link-indicator`, `<div>` khi trang đang mở, `Link prefetch={false}` cho các trang khác. Admin route lấy từ `useConfig().config.routes.admin`, không hardcode.
- Active state theo BL-041: `.nav__link:has(.nav__link-indicator)` (`_surfaces.scss:134-139`) tự áp nền và màu. Indicator: `.tami-nav-dashboard .nav__link-indicator` (0,2,0) thắng `.nav__link-indicator` (0,1,0) và chỉ lùi `--nav-padding-inline-start`, đúng vì mục này không thụt lề. Dùng `inset-inline-start` nên đúng cả RTL.
- NavAdvancedCollapse: chỉ tra theo `#nav-group-<label>` và `button.nav-group__toggle--open` (`NavAdvancedCollapse.tsx:21-22`), không phụ thuộc thứ tự con nên không bị phá. Rule `.nav-group + .nav-group` không áp cho nhóm đầu (anh em liền trước là `.tami-nav-dashboard`) nên không bị viền đôi.
- A11y: nhãn văn bản "Tổng quan". Focus ring dùng sẵn `.nav__link:focus-visible` (`_surfaces.scss:124-132`, `_controls.scss:7`). Mobile `.nav__link { min-height: 44px }` (`_surfaces.scss:334-335`).
- importMap: diff chỉ thêm đúng 1 dòng import và 1 entry `/components/admin/NavDashboardLink#NavDashboardLink`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/admin` | PASS: 241/241 tests |
| `pnpm typecheck` | PASS (`tsc --noEmit` sạch) |
| `pnpm lint` | PASS: 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |

## Responsive Checklist Gate (diff có đụng UI admin)
| Mục | KQ | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | Browser check (change-request) ở 375: scrollWidth 375. `right` là `calc` theo gutter, không có width cố định |
| Mobile-first / grid | N/A | Không thêm grid hay media query mới. File dùng sẵn `max-width: 767px` (pattern có từ trước, ngoài scope) |
| Container không fixed px | OK | `.tami-nav-dashboard { width: 100% }` |
| Typography rem / clamp | N/A | Không đổi font, dùng lại `.nav__link` |
| Media | N/A | Không có ảnh hay video |
| Touch target ≥ 44px | OK | `.nav__link` 44px ở ≤767 (`_surfaces.scss:334`). Icon "Xem website" 44×44 (đo ở 375) |
| Nav mobile | OK | Mục mới nằm trong nav drawer có sẵn. Ô Ngôn ngữ ẩn khi nav mở (rule Payload còn nguyên) |
| Table | N/A | Không có bảng |
| 100vh / reduced-motion | N/A | Không có animation hay đơn vị vh |
| Không che lỗi bằng overflow:hidden | OK | Không thêm overflow |
| 768 / 1280 | OK (CSS math) | Ở 768–1279 gutter 20 → 45px. Ở ≥1280 gutter 32 → 57px. Browser đo ở 1000 và 1600: chênh 0, khoảng cách 37px và 20px |

## Skill gates
- aislop: skip, chưa cài (`node_modules/.bin/aislop*` không có)
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (không có `.oxlintrc*`). ESLint 0 error.
- ocr (open-code-review): skip, ocr chưa cài
- AI-readable: OK. Tên rõ, hàm ngắn, comment ghi WHY (root cause Payload). `25px` có giải thích nguồn. 0 indicator đáng kể; riêng kích thước file xem MINOR-1.
- ai-friendly-web: N/A (admin nội bộ)
- blitzstrike: N/A (không phải STRICT, không đụng auth/input)

## Findings
- **[MINOR-1]** `src/components/admin/styles/_surfaces.scss`: file đã quá ngưỡng từ trước (317 dòng, vượt ≤300), nay lên 343 dòng. Đề xuất tạo task riêng tách phần nav (khoảng dòng 49–151 và block mobile nav) sang `_nav.scss`, giống cách đã tách `_lists.scss`. Không chặn vì đây là nợ có sẵn.
- **[MINOR-2]** `_surfaces.scss:101-103`: khoảng ngăn dưới "Tổng quan" là `padding-bottom 8 + border + margin-bottom 8`, còn giữa các nhóm là `margin-top 8 + border`. Phía trên tiêu đề nhóm đầu vì vậy dư khoảng 8px so với giữa các nhóm. Chỉ là thẩm mỹ. Nếu muốn khớp tuyệt đối thì bỏ `margin-bottom`.
- **[MINOR-3]** `NavDashboardLink.tsx:28`: mục đang chọn là `<div>` không có `aria-current="page"`. Hành vi này giống hệt Payload `DefaultNavClient`, nên không bắt buộc. Có thể thêm cho cả nav trong một task a11y riêng.
- **[MINOR-4] (residual)** Hằng `25px` giả định avatar mặc định của Payload (Default/Gravatar). Nếu sau này cấu hình `admin.avatar` custom có kích thước khác thì phải chỉnh theo. Comment đã ghi điều này.

Không có CRITICAL hay MAJOR.

## Residual risk
- Không tự chạy trình duyệt (vượt quyền reviewer). Tin số đo của change-request ở 1600/1000/375; logic CSS đã tự kiểm và khớp. RTL chỉ kiểm bằng phân tích CSS (dự án không bật RTL).

## Verdict
**PASS**
