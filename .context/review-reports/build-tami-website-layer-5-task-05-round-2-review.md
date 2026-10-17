Agent: reviewer

# Review: build/tami-website, layer-5-task-05, round 2

- **Review level:** STRICT
- **Reason:** Giữ mức của round 1. Task đụng navigation và component dùng chung trên mọi trang công khai, a11y nền (NFR-07 AA), bộ lọc PII `scrubText` (chạy trong logger server và `beforeSend` GlitchTip ở chunk trình duyệt), secret build/CD và source map.
- **Blast radius:** mọi route `src/app/(frontend)/[locale]/*` (qua `PublicShell`); `src/components/layout/*` (DesktopNav, MobileMenu, LanguageSwitcher, Footer, Header, SkipLink); `src/lib/monitoring/scrub-text.ts` (giờ import `src/lib/phone.ts`, nên `normalizePhone` vào chunk client); `src/lib/logger.ts`; messages vi/en (`layout.nav.openSubmenu`); `tests/e2e/revalidate-globals.ts`.

## Verify commands + result (reviewer tự chạy lại theo `.context/project-config.md`)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | OK, 0 lỗi |
| `pnpm typecheck` | OK |
| `pnpm test` | 86 file / 924 test PASS |
| `pnpm build` | OK; `/vi`, `/en` vẫn SSG (●) |
| `next start` + trình duyệt | Reviewer không chạy (không có browser trong tập lệnh được phép). Dựa evidence primary (đo độc lập `next start :3218`, 375 `/en`: 0 phần tử tương tác < 44×44 cả trang lẫn khi mở menu mobile, `scrollWidth` 375) và đọc class |
| `pnpm e2e:revalidate` | Không chạy (cần app + DB). Đã đọc guard mới |

## Xác minh 3 MAJOR của round 1

### MAJOR-1 (scrubText lọt SĐT ≥ 12 chữ số): ĐÃ ĐÓNG
`scrub-text.ts:26-37`: `scrubMatch` gọi `looksLikeVietnamPhone` (dùng lại `normalizePhone`, thêm dạng `+840…`/`840…`/`00840…` qua `replace(/^(\+?(?:0084|84))0/, "$1")`) **trước** luật bỏ dãy ID ≥ 12 số. Không có lookbehind. Test `scrub-text.test.ts:66-82` phủ `+842838234567`, `842838234567`, `0084912345678`, `00842838234567`, `+840912345678`, các dạng có cách/chấm, JSON, `%2B84…`, `phone=84…`, `ABC0912345678`, lỗi unique Postgres.

Truy vết input đối kháng theo regex (không chạy thực tế, xem Residual):

| Input | Kết quả |
|---|---|
| `091-234-5678`, `(028) 3823-4567` | che (gạch/ngoặc nằm trong `PHONE_SOURCE`; `normalizePhone` bỏ `()`) |
| `+84 (0)912 345 678` | `+84 ` không đủ 7 ký tự trước `(` nên không khớp; khớp `912 345 678` (9 số, không đúng dạng VN) nhưng luật đếm ≥ 9 số → `+84 (0)[phone]`: che được phần thuê bao |
| `(+84) 912 345 678` | `(+84) [phone]` |
| `+84 (0)28 3823 4567` | `+84 (0)[phone]` (10 số) |
| Nhiều SĐT một dòng `0912345678 0987654321` | gộp 1 match (dấu cách nằm trong class), không có dạng VN, đếm 20 số → che cả cụm. Ngăn bằng dấu phẩy → 2 match, mỗi match che |
| SĐT + timestamp `0912345678 1700000000000` | bỏ dãy 13 số thì còn 10 → che cả cụm (che dư ID, chấp nhận) |
| Cố định 10 số kiểu cũ `0283823456` | `normalizePhone` null nhưng 10 số ≥ 9 → che |
| `2026-10-17 0912345678`, `17-10-2026-0912345678` | ngày giữ, SĐT che |
| Cắt 4 KB giữa SĐT | phần còn lại ≥ 9 số → che; 5–8 số ngay tại ranh giới cắt có thể lọt một phần (xem MINOR-3) |
| Dấu `/`, gạch ngang dài `–`, `%20`, chữ số full-width `０９…` | **lọt** (không thuộc class / `\d` chỉ ASCII; NFKC chỉ chạy trong `normalizePhone` sau khi regex đã khớp). Định dạng hiếm trong thông điệp lỗi → MINOR-2 |

ReDoS/hiệu năng: `\d[\d .-]{7,}\d` là một vòng lặp đơn, không lồng quantifier; mỗi vị trí bắt đầu thất bại chỉ xảy ra ở đuôi dãy phân cách, cả lượt quét gần tuyến tính. Nhóm ngoặc và nhánh ngày có độ dài chặn trên. Đầu vào đã cắt ở 4096 ký tự. `EMAIL_PATTERN` (có sẵn từ trước, không đổi trong diff) vẫn có thể bậc hai trên chuỗi chữ dài không có `@`, nhưng cũng bị chặn ở 4096 ký tự (residual). Không phát hiện ReDoS.

### MAJOR-2 (touch target < 44): ĐÃ ĐÓNG
- `LanguageSwitcher.tsx:32,45` `min-h-11 min-w-11`; dấu `|` có `px-2` (2×8px giữa hai mục).
- `MobileMenu.tsx:114,121` link `tel:`/`mailto:` dùng `inline-flex min-h-11`.
- `Footer.tsx:57` link cột `min-h-11 min-w-11`; `:87,94` liên hệ `min-h-11`; `:109,119` social `size-11 gap-2`.
- Evidence đo runtime của primary ở 375: 0 phần tử < 44×44.

### MAJOR-3 (dropdown DesktopNav): ĐÃ ĐÓNG
`DesktopNav.tsx:44-97`: link cha giữ chức năng điều hướng, nút caret riêng `size-11` có `aria-expanded`, `aria-controls`, `aria-label` (i18n). Enter/Space/chạm toggle. Esc đóng và trả focus về nút. Click ra ngoài (`pointerdown` trên document, chỉ đăng ký khi đang mở) hoặc blur khỏi nhóm thì đóng. Hover chỉ mở với `pointerType === "mouse"`. Phần nội dung xổ nằm trong `li` nên rê chuột vào vẫn giữ mở. Khi đóng dùng `hidden`. Test RTL `DesktopNav.test.tsx` (6 ca) phủ đủ các luồng này. Còn khe nhỏ về 1.4.13 khi mở bằng hover, xem MINOR-1.

### MINOR của round 1
- MINOR-3: OK. Ngôn ngữ đang xem là `<a href={pathname} hrefLang lang aria-current="true">`. Giữ `"true"` thay vì `"page"` là hợp lý: đây là mục đang chọn trong một nhóm lựa chọn ngôn ngữ (`role="group"`), không phải mục trang trong nav. `"page"` cũng hợp lệ vì link trỏ đúng trang hiện tại, nhưng có thể làm lẫn với `aria-current="page"` của menu chính. Không bắt buộc đổi.
- MINOR-5: OK (`useCallback`, `MobileMenu.tsx:38`).
- MINOR-6: OK (`tests/e2e/revalidate-globals.ts:26` regex neo `^https?://(localhost|127.0.0.1|[::1])(:port)?(/|$)`, không bypass được bằng `localhost.evil.com`).
- MINOR-1/2/4/7: đã ghi Decision log (`tasks/tami-website/layer-5-task-05.md:90-94`). Chấp nhận.

## Responsive Checklist Gate (diff đụng UI; mốc 375/768/1280, profile thêm 640/1024/1536)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Primary đo 375 `scrollWidth` 375 (cả khi menu mở); builder đo 375/1280. Residual MINOR-2 của round 1 (menu CMS dài ở xl) đã vào decision log |
| Mobile-first (`min-width`) | OK | Chỉ dùng prefix Tailwind `sm/md/lg/xl/2xl`; `DESKTOP_QUERY (min-width: 80rem)` |
| Grid `auto-fit/minmax` | OK | Footer `md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]` |
| Container không fixed px | OK | `max-w-container`, `px-gutter`; dropdown `min-w-48` (rem) |
| Font-size rem/token | OK | `text-small/body/h2/eyebrow` |
| Heading fluid | N/A | Không thêm heading mới |
| Media | OK | `BrandLogo` dùng `next/image` |
| Touch target ≥ 44×44 (mobile) | OK | Xem MAJOR-2 + đo của primary ở 375 |
| Nav mobile hamburger | OK | `MobileMenu` < xl; `DesktopNav` `hidden xl:block` |
| Table | N/A | Không có |
| Không `100vh` thuần | OK | `min-h-[60dvh]`, dialog `fixed inset-0` |
| `prefers-reduced-motion` | OK | Rule reduce toàn cục ở `globals.css` tắt `transition-transform` của caret và animation menu |
| Không che lỗi bằng `overflow:hidden` | OK | Không có trong diff |

**Gate: PASS.** Mốc 768/1024 chỉ xác minh bằng class/CSS math (residual).

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, lệnh không nằm trong tập lệnh reviewer được phép | Residual |
| oxlint (anti-slop) | skip, oxlint not configured | `pnpm lint` + `pnpm typecheck` sạch |
| ocr | skip, ocr not installed / không được phép | |
| AI-readable | OK (2 indicator) | `DesktopNav` ~87 dòng và `MobileMenu` ~70 dòng (> 50, handler inline dày). Tên rõ, comment chủ yếu giải thích WHY, docs đã cập nhật ở round 1 |
| ai-friendly-web | N/A | Không đổi robots/sitemap/llms |
| impeccable / frontend-checklist | OK | Đã đóng touch target và disclosure; token không đổi |
| blitzstrike | skip, không có môi trường | |

## Findings

Không còn CRITICAL hay MAJOR.

### [MINOR-1] Dropdown mở bằng hover không đóng được bằng Esc khi focus nằm ngoài nhóm (WCAG 1.4.13 "dismissible")
- `src/components/layout/DesktopNav.tsx:50-59`: `onKeyDown` gắn trên `li`, nên chỉ nhận Esc khi focus đang ở trong nhóm. Nếu chuột rê vào mở menu con trong khi focus ở chỗ khác (body, ô nhập), Esc không đóng được; người dùng phải di chuột ra.
- Fix: trong effect `openKey !== null` (`:26-33`), thêm listener `keydown` trên document với Esc thì `setOpenKey(null)`. Chỉ trả focus về nút khi focus đang nằm trong nhóm.

### [MINOR-2] scrubText chưa bắt SĐT dùng dấu phân cách hiếm hoặc chữ số full-width
- `src/lib/monitoring/scrub-text.ts:6`: class `[\d .-]` không có `/`, `–`, `_`, `%20`; `\d` chỉ khớp ASCII. Ví dụ `0912/345/678`, `0912–345–678`, `0912%20345%20678`, `０９１２３４５６７８` lọt nguyên văn.
- Fix (tuỳ chọn): chạy `text.normalize("NFKC")` trước khi quét; thêm `–/_` vào class, decode `%20`. Hoặc ghi giới hạn này vào comment và decision log.

### [MINOR-3] Cắt 4096 ký tự có thể để lọt một phần SĐT tại ranh giới
- `src/lib/monitoring/scrub-text.ts:41`: cắt trước rồi mới quét. Nếu chỗ cắt rơi giữa một SĐT và chỉ còn 5–8 chữ số (ví dụ `09123456`), phần đó dưới ngưỡng 9 số nên giữ nguyên.
- Fix: cắt lùi về trước dãy `[\d .+()-]` cuối cùng, hoặc quét trên `MAX_SCRUB_LENGTH + 32` ký tự rồi mới cắt. Xác suất thấp.

### [MINOR-4] Nit
- `DesktopNav.tsx:42` `items.indexOf(item)` trong `map` (O(n²), không cần thiết): dùng tham số `index` của `map`.

## Residual risk
- Input đối kháng của `scrubText` được truy vết theo regex, không chạy thử (reviewer không được ghi file ngoài `.context/review-reports/`).
- Responsive/a11y runtime dựa vào đo của primary (375) và builder (375/1280). Mốc 768/1024 chỉ xác minh bằng phân tích class. Chưa kiểm hành vi disclosure với trình đọc màn hình thật.
- `EMAIL_PATTERN` (không đổi trong diff) có độ phức tạp bậc hai trên chuỗi dài không có `@`, đã bị chặn ở 4096 ký tự.
- aislop/ocr/blitzstrike không chạy được. Upload source map với GlitchTip thật chưa kiểm (giữ nguyên từ round 1).

## Verdict: PASS

Cả 3 MAJOR của round 1 đã đóng, có test. Verify (lint, typecheck, 924 test, build) đều PASS khi reviewer tự chạy lại. Responsive gate PASS. Các MINOR-1..4 chỉ là follow-up, không chặn commit.
