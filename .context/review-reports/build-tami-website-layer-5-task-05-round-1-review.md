Agent: reviewer

# Review: build/tami-website, layer-5-task-05, round 1

- **Review level:** STRICT
- **Reason:** Task đụng navigation và component dùng chung mọi trang công khai (layout `[locale]`), a11y nền (NFR-07 AA), cache/ISR trang công khai (`revalidate = 60` + tag global), logger/`scrubText` (lọc PII trên server và trong chunk trình duyệt), secret build/CD (token GlitchTip, Docker secret mount, `deploy.yml`) và source map public.
- **Blast radius:** mọi route dưới `src/app/(frontend)/[locale]/*` (layout bọc `PublicShell`); `src/components/layout/*` (Header, MobileMenu, DesktopNav, Footer, LanguageSwitcher, SkipLink...); `src/lib/monitoring/scrub-text.ts` (dùng trong logger server + `beforeSend` GlitchTip server/browser); `src/lib/logger.ts` (app, jobs, logger Payload); `next.config.ts`; `docker/Dockerfile` (stage builder); `.github/workflows/deploy.yml`; `package.json`/lockfile (`@sentry/cli`); messages vi/en `layout.*`; docs ARCHITECTURE §5/§8 + runbook deploy §8.

## Verify commands + result (tự chạy lại, theo `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK, 0 lỗi |
| `pnpm typecheck` | OK |
| `pnpm test` | 85 file / 915 test PASS |
| `pnpm build` | OK; `/vi`, `/en` là SSG (●). Không có file `.map` dưới `.next/static/**` (Glob rỗng) khi không có token |
| `next start` + trình duyệt | Reviewer không chạy (không có browser). Dùng evidence của primary (375/768/1280 không cuộn ngang, skip link focus đầu, landmark, menu mobile) + phân tích CSS |
| `pnpm e2e:revalidate` | Không chạy lại (cần app + DB); dựa evidence builder 9/9 PASS + đọc script |

## Responsive Checklist Gate (diff đụng UI, mốc 375/768/1280; profile thêm 640/1024/1536)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK (có residual) | Primary đo trên `next start` 375/768/1280. Phân tích: < xl header = search 44px + logo (~77px) + nút Menu 44px. Residual: ở xl menu ngang `whitespace-nowrap`, `ul` không wrap; menu CMS dài hơn 7 mục mặc định có thể tràn (xem MINOR-2) |
| Mobile-first (`min-width`) | OK | Toàn bộ class Tailwind `sm:/md:/lg:/xl:` (min-width); `DESKTOP_QUERY = (min-width: 80rem)` |
| Grid `auto-fit/minmax` | OK | Footer `md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]` (spec 160px) |
| Container không fixed px | OK | `max-w-container` = 80rem, `px-gutter` |
| Font-size `rem`/token | OK | `text-small/body/h2/eyebrow/xsmall` (token); tracking `em` |
| Heading fluid | N/A | Diff chỉ dùng token heading có sẵn (h1 placeholder trang chủ) |
| Media `max-width`/`aspect-ratio`/`srcset` | OK | `BrandLogo` dùng `next/image` width/height (giữ tỉ lệ) + `h-10 w-auto`, srcset do next/image sinh |
| Touch target ≥ 44×44 trên mobile | **FAIL** | `LanguageSwitcher.tsx:23,35` mục ngôn ngữ `min-h-11 min-w-8` = **32×44px** (hiện ở menu toàn màn hình + footer trên mobile), cách nhau bởi `|` `px-1` (< 8px spec §1.4). `MobileMenu.tsx` `MenuContact` (~dòng 111, 118): link `tel:`/`mailto:` là chữ inline, không `min-h-11` → cao ~1 dòng chữ (< 44px). Xem MAJOR-2 |
| Nav mobile hamburger | OK | `MobileMenu` (Radix Dialog) < xl, `DesktopNav` chỉ `xl:block` |
| Table | N/A | Không có bảng |
| Không `100vh` thuần | OK | `min-h-[60dvh]`, dialog `fixed inset-0` |
| `prefers-reduced-motion` | OK | `globals.css:246` rule reduce toàn cục; `animate-fade-in/out` và transition dropdown bị tắt theo |
| Không che lỗi bằng `overflow:hidden` | OK | Không có trong diff |

**Gate: FAIL** (touch target).

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, lệnh `aislop` không nằm trong tập lệnh được phép của reviewer (chỉ verify commands + git) | Residual |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc*`/`oxlint*.json`) | `pnpm lint` (eslint) + `pnpm typecheck` sạch |
| ocr (open-code-review) | skip, ocr not installed / không trong tập lệnh được phép | |
| AI-readable | OK (1 indicator) | `MobileMenu` component ~68 dòng (> 50). Tên rõ, comment chủ yếu WHY, docs ARCHITECTURE/runbook đã cập nhật |
| ai-friendly-web | N/A | Task không đổi `robots.txt`/`sitemap.xml`/`llms.txt` (task SEO riêng) |
| impeccable / frontend-checklist | FAIL một phần | Touch target (MAJOR-2), dropdown a11y (MAJOR-3); còn lại token/tương phản OK (tính tay: accent-text #8c6733 / trắng ≈ 5.1:1; text-muted #6b6b6b / trắng ≈ 5.3:1; footer text-muted #9a9a9a / #111 ≈ 6.7:1) |
| blitzstrike | skip, không có môi trường/không trong tập lệnh được phép | |

## Kiểm theo yêu cầu primary

**Cache/SSR:** OK. `load-shell.ts` không đọc `cookies()/headers()`; `getHeader/getFooter/getSiteSettings` qua `unstable_cache` tag `global:<slug>` + `revalidate: CACHE_SECONDS`; layout `revalidate = 60` khớp `PUBLIC_PAGE_CACHE_CONTROL` `s-maxage=60` (L4-T03), không xung đột. Build ra `/vi` `/en` SSG. Client component chỉ nhận view model (`NavItemView`, `FooterContactView`: label/href/external, hotline/email/address công khai), không nhận doc global. Lỗi đọc global → fallback + `logger.warn` (không làm hỏng trang).

**Source map/secret:** OK. Token đi qua `RUN --mount=type=secret` + `export` trong cùng RUN (không vào layer/history, không ARG/ENV). `next.config.ts` chỉ đổi token thành boolean, không inline vào bundle (không `NEXT_PUBLIC_`). Script truyền token qua env tiến trình con (`execFileSync`, không trong argv), `finally` luôn xoá `.map` trong `.next/static`, Dockerfile còn `find .next -name '*.map' -delete`. `deploy.yml`: chỉ thêm input `secrets:`/`build-args:` cho action đã pin, không `echo` secret; vars URL/ORG/PROJECT không phải bí mật. Build không token: không `.map` (đã kiểm). Chưa kiểm với GlitchTip thật (residual, builder đã ghi).

**Logger:** OK. Lọc tham số sau chuỗi format khi có placeholder; Error → `name: message` qua `scrubText`; số chứa SĐT → `[phone]` và `%d/%i/%f` → `%s`; test mới cover. Che dư số 9–11 chữ số (vd byte size `104857600`) là chấp nhận được.

**scrubText:** bỏ lookbehind đúng (test cấm `(?<`). Phân tích đối kháng (theo regex, không ghi file tạm vì reviewer chỉ được ghi report): `abc0901234567`, `tel=0901234567&x`, `+84 90 123 4567`, `091.234.5678`, `(028) 3823 4567`, `(+84) 901 234 567` → vẫn che. **Lọt: SĐT liền 12+ chữ số** — xem MAJOR-1.

## Findings

### [MAJOR-1] scrubText không còn che SĐT cố định dạng E.164 (`+842838234567`) và dạng `0084…` / `+840…` (hồi quy PII)
- File: `src/lib/monitoring/scrub-text.ts:13-16` (`LONG_ID_RUN = /\d{12,}/g`), `:23-27` (`scrubMatch`).
- Truy vết: `"+842838234567"` khớp `PHONE_SOURCE`; `LONG_ID_RUN` xoá cả cụm `842838234567` (12 chữ số) → còn 0 chữ số < 9 → trả nguyên văn. Tương tự `0084912345678` (13), `+840912345678` (12), `00842838234567` (14). Code trước diff che tất cả các dạng này.
- Mức độ: `src/lib/phone.ts:3,14` (`normalizePhone`, khoá chống trùng lead BR-15) chuẩn hoá số cố định thành `+84` + `2\d{9}` = **12 chữ số liền** và chấp nhận đầu vào `0084…`. Lỗi DB/ràng buộc unique thường trích nguyên giá trị khoá (`Key (phone)=(+842838234567)`) → SĐT khách lọt nguyên văn vào log Loki/GlitchTip. Comment dòng 13-15 ("SĐT Việt Nam tối đa 11 chữ số (84 + 9 số, hoặc mã vùng + số bàn)") sai: E.164 cố định là 84 + 10 = 12 chữ số.
- Fix đề xuất: không miễn trừ dãy dài khi nó có dạng SĐT VN — vd chỉ coi là ID nếu dãy ≥ 12 chữ số **và** không đứng sau `+` **và** không khớp `^(?:0084|84|0)(?:[35789]\d{8}|2\d{9})$` (tái dùng pattern của `phone.ts`); hoặc nâng ngưỡng ID lên ≥ 13 chữ số và loại trừ tiền tố `00`/`84`. Sửa comment. Thêm test: `+842838234567`, `842838234567`, `0084912345678`, `+840912345678`, `Key (phone)=(+842838234567)` → `[phone]`; giữ test timestamp ms/UUID/số tài khoản.

### [MAJOR-2] Touch target < 44×44 trên mobile (Responsive gate FAIL, design-spec §1.4)
- `src/components/layout/LanguageSwitcher.tsx:23` (span hiện tại) và `:35` (link ngôn ngữ kia): `min-h-11 min-w-8` → 32×44px; khoảng cách giữa hai mục chỉ là `|` + `px-1` (< 8px).
- `src/components/layout/MobileMenu.tsx` `MenuContact` (~dòng 111 `tel:`, ~118 `mailto:`): link inline không có vùng chạm tối thiểu.
- Fix đề xuất: `min-w-11` (hoặc `size-11`) cho mục ngôn ngữ, separator đủ ≥ 8px; link liên hệ trong menu dùng `inline-flex min-h-11 items-center` như `Footer.FooterContact`.

### [MAJOR-3] Dropdown mục con của `DesktopNav` không đạt spec §2.1 và WCAG 1.4.13 (AA, NFR-07)
- File: `src/components/layout/DesktopNav.tsx:22-33` (`ul invisible ... group-hover:visible group-focus-within:visible`).
- Spec §2.1: "Mục có con: dropdown khi hover/focus/**Enter**, `aria-expanded`". Hiện tại: không `aria-expanded`, không Enter (Enter điều hướng mục cha), không Esc để đóng nội dung hiện khi hover/focus mà đè lên trang (WCAG 1.4.13 "dismissible"); mục con `visibility:hidden` nên trình đọc màn hình ở chế độ duyệt không thấy; trên thiết bị cảm ứng ≥ 1280px (tablet ngang) chạm mục cha là điều hướng luôn, mục con không chạm tới được một cách tin cậy. Menu cố định/seed hiện chưa có mục con, nhưng FR-ADM-08 cho admin thêm con trong global `header` bất kỳ lúc nào, và component này nằm trên mọi trang.
- Fix đề xuất (chọn một): (a) mẫu disclosure: link cha giữ nguyên + nút caret riêng (`aria-expanded`, `aria-controls`, nhãn "Mở mục con của X", ≥ 44px), Esc đóng và trả focus về nút, bấm/chạm mở; giữ hover cho chuột; thêm test RTL; (b) nếu hoãn: không render dropdown ở xl (chỉ menu toàn màn hình hiện mục con) và ghi follow-up + decision log.

### [MINOR-1] Lệch spec chấp nhận làm follow-up (cần ghi decision log / task đích)
- `Header.tsx:35-37`: menu ngang 1 hàng ở xl (spec §2.1: 2 hàng, thu về 1 hàng khi cuộn). Chấp nhận được về chức năng (trạng thái "đã cuộn" của spec), nhưng là thay đổi thiết kế: ghi decision log.
- Header trong suốt trên hero: hoãn sang task trang có hero (chưa có trang hero), chấp nhận.
- `ctaButton` + logo từ CMS chưa dùng: admin nhập được nhưng không hiện gì; ghi follow-up hoặc gợi ý trong admin.
- Footer accordion < md (spec §2.4) và menu toàn màn hình: mục con chưa accordion, thiếu mạng xã hội ở cột phải, chưa stagger (spec §2.2): follow-up.
- Nút tìm kiếm là link `/cho-thue?q=` (đúng AC của task) thay vì Sheet có ô nhập (D7): trang `/cho-thue` chưa tồn tại → 404 tới khi làm task Cho thuê; ghi residual.

### [MINOR-2] Menu ngang có thể tràn ngang với menu CMS dài
- `DesktopNav.tsx:14,20`: `ul flex` không wrap + `whitespace-nowrap`; wrapper `min-w-0` nhưng không `overflow` xử lý. 7 mục mặc định vừa 1280px; nhãn CMS dài/nhiều mục sẽ gây cuộn ngang ở 1280. Đề xuất: giới hạn số mục ở admin, hoặc làm đúng bố cục 2 hàng của spec, hoặc `flex-wrap` + test 1280 với nhãn dài.

### [MINOR-3] Ngôn ngữ hiện tại là `<span aria-label>`
- `LanguageSwitcher.tsx:23`: `aria-label` trên phần tử generic không được hỗ trợ (ARIA 1.2) → trình đọc màn hình đọc "vi" thay vì "Tiếng Việt"; spec §2.3 ghi "mỗi mục là `<a hreflang lang>`". Đề xuất: dùng `<a href={trang hiện tại} aria-current="true">` hoặc thêm chữ `sr-only` với tên ngôn ngữ.

### [MINOR-4] `<main>` bỏ outline khi focus
- `PublicShell.tsx:15` `focus:outline-none`: spec §1.4 "không bao giờ `outline: none` mà không thay thế". Với `main tabIndex=-1` đây là thực hành phổ biến; chấp nhận nếu ghi ngoại lệ trong design-spec, hoặc chỉ bỏ outline khi `:focus:not(:focus-visible)`.

### [MINOR-5] `useCloseOnDesktop` đăng ký lại listener mỗi lần render
- `MobileMenu.tsx:38`: truyền arrow mới mỗi render → effect `[close]` gỡ/gắn `matchMedia` listener mỗi render (biến `close` dòng 37 đã có nhưng không dùng ở đây). Đề xuất: `useCallback` hoặc effect phụ thuộc `setOpen`. Thêm: component `MobileMenu` ~68 dòng (> 50), tách `MenuNavList`.

### [MINOR-6] Script e2e chỉ chặn `APP_ENV=production`
- `tests/e2e/revalidate-globals.ts:17-20`: chạy nhầm với env staging sẽ tạo admin tạm và đổi header/footer staging (công khai sau basic auth) trong lúc chạy. Đề xuất: chỉ cho chạy khi `E2E_BASE_URL` là localhost/127.0.0.1 hoặc `APP_ENV` là dev.

### [MINOR-7] Upload source map lỗi làm dừng build release
- `scripts/upload-sourcemaps.mjs:70-80`: GlitchTip ngừng/timeout → `execFileSync` ném → build Docker fail → không deploy được. Có chủ đích (runbook §8) nhưng gắn deploy vào uptime GlitchTip; cân nhắc chỉ fail khi thiếu cấu hình, còn lỗi mạng thì cảnh báo + vẫn xoá `.map`. Ghi quyết định.

## Đánh giá lệch spec builder tự nêu

| Lệch | Kết luận |
|---|---|
| Menu ngang 1 hàng ở xl | Chấp nhận, follow-up + decision log (MINOR-1/2) |
| Header trong suốt chưa làm | Chấp nhận, thuộc task trang có hero |
| ctaButton + logo CMS chưa dùng | Chấp nhận, follow-up (MINOR-1) |
| Footer chưa accordion mobile | Chấp nhận, follow-up (MINOR-1) |
| Dropdown con chưa aria-expanded | **Defect** của task này (MAJOR-3) |
| Ngôn ngữ hiện tại không phải link | MINOR-3 |
| `<main>` `focus:outline-none` | MINOR-4 |

## Residual risk
- Responsive/a11y runtime chỉ dựa evidence primary + phân tích CSS; reviewer không chạy browser, không chạy `pnpm e2e:revalidate`.
- Upload GlitchTip với server thật chưa kiểm (debug ID cần GlitchTip hỗ trợ artifact bundle); binary `@sentry/cli` trên image Linux chưa kiểm trong Docker build.
- aislop/ocr/blitzstrike không chạy được trong tập lệnh cho phép.
- Input đối kháng của `scrubText` được phân tích theo regex, không chạy thực tế (không được ghi file test tạm ngoài `.context/review-reports/`).

## Verdict: FAIL

3 MAJOR (MAJOR-1 PII, MAJOR-2 touch target / Responsive gate FAIL, MAJOR-3 dropdown a11y). Builder sửa MAJOR-1..3 (kèm test), nên xử lý MINOR-3/5 cùng lượt; các MINOR còn lại ghi follow-up/decision log. Không commit.
