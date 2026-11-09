# Design Spec: Website TAMI (website công khai)

- **Sinh bởi:** bước `/design` (`/start` bước 3), 16/10/2026 · **Trạng thái:** chờ user confirm tokens + các quyết định ở §6, §9
- **Tokens:** `skills/react-nodejs/design-tokens.md` (nguồn đúng cho màu/chữ/khoảng cách; ghi đè 4 giá trị của `docs/DESIGN.md`, xem §12 file đó)
- **Nguồn:** `SPECIFICATIONS.md` v1.2.1 · `docs/DESIGN.md` (màn, component, logo) · `docs/BRD.md` §2, §2.1, §3.1 · `docs/ERD.md` §4 · `docs/API_SPEC.md` §3 · `docs/ARCHITECTURE.md` §5 · design doc `docs/specs/2026-10-16-tami-website-design.md`
- **Tham chiếu phong cách:** market.vinhomes.vn (chỉ bố cục, nhịp section, cảm giác; màu là của TAMI). **Không** dùng nội dung, ảnh, icon, chữ của Vinhomes (LGL-04).
- **Phạm vi file:** website công khai VI + EN. Trang quản trị `/admin` dùng giao diện Payload mặc định (chỉ đổi logo, màu nhấn `#8C6733`, font Montserrat qua `admin.components`/CSS), không có screen spec riêng.

**Design read:** website thương hiệu bất động sản cao cấp cho khách mua/thuê Việt Nam và người nước ngoài; ngôn ngữ biên tập sang trọng theo market.vinhomes.vn (màu TAMI); Tailwind + shadcn/ui tuỳ biến, một font Montserrat (BL-036), chuyển động tiết chế.
**Dials:** `DESIGN_VARIANCE 5` · `MOTION_INTENSITY 4` · `VISUAL_DENSITY 3` (trang thương hiệu) / `5` (danh sách Cho thuê). Lý do + ngoại lệ có chủ đích: tokens §0.

---

## 1. Nguyên tắc chung (áp cho mọi màn)

### 1.1. Song ngữ
- VI và EN **cùng một bố cục, cùng component**; chỉ khác chuỗi (`src/i18n/messages/{vi,en}.json`) và nội dung localized. Không có component riêng cho EN.
- `<html lang="vi">` / `<html lang="en">`; `hreflang` `vi`, `en`, `x-default` chỉ khi có cả hai bản.
- `/en` chỉ hiện nội dung `hasEnglish = true`. Danh sách EN lọc ở truy vấn (không ẩn bằng CSS). Chi tiết EN chưa có bản dịch → 404 EN.
- Khối trang chủ chưa có bản EN → **ẩn khối** ở `/en`; `header`/`footer` thiếu EN → menu cố định trong `en.json` (Spec § Quy tắc biên).
- Thiết kế cho chuỗi dài hơn 30%: nút, tab, menu **không** đặt chiều rộng cố định; tiêu đề thẻ cắt 2 dòng (`line-clamp-2`) kèm `title` đầy đủ.
- Tên tỉnh/phường giữ tiếng Việt ở cả hai bản. Tiền luôn VNĐ, định dạng theo locale (tokens §2.1).

### 1.2. Khoá nhãn CTA (một nhãn cho một ý định, taste-skill §4.5)

| Ý định | VI | EN | Dùng ở |
|---|---|---|---|
| Để lại liên hệ (lead) | **Nhận tư vấn** | **Get advice** | Nút gửi mọi lead form, banner CTA, `header.ctaButton` nếu bật |
| Lead khi tin đã thuê | Nhận tư vấn căn tương tự | Find similar units | Form tin "Đã thuê" |
| Xem chi tiết dự án | Khám phá dự án | Explore project | Slider dự án, thẻ dự án (link ẩn trên cả thẻ) |
| Xem danh sách | Xem tất cả | View all | Cuối mỗi khối trang chủ |
| Ứng tuyển | Ứng tuyển | Apply now | Chi tiết tuyển dụng |
| Gọi | Gọi hotline | Call hotline | Nút nổi, khung sale |
| Tải tài liệu | Tải tài liệu | Download | Chi tiết dự án |

Menu "Liên hệ / Contact" là điều hướng, không phải CTA nên không tính trùng.

### 1.3. Ảnh (taste-skill §4.8, NFR-01)
- Mọi ảnh qua `next/image` từ cỡ đã sinh (`thumb` 400w · `card` 800w · `large` 1600w · `og`, ERD §4.12), khai `sizes` đúng cột, tỉ lệ cố định (tokens §10) để CLS = 0.
- Ảnh LCP (ảnh hero slide 1, ảnh bìa chi tiết) `priority` + `fetchPriority="high"`; mọi ảnh khác `loading="lazy"`.
- `alt` lấy từ `media.alt` (localized). Ảnh trang trí (nền banner) `alt=""`.
- Không chèn chữ vào ảnh (để dịch được). Không đặt nhãn/pill lên ảnh, **trừ** badge trạng thái (Đã thuê, Đã kết thúc, Đang mở bán) vì mang thông tin thật; badge đặt góc trên trái, cách mép 12px.
- Dữ liệu mẫu khi chưa có ảnh thật (Q4): `https://picsum.photos/seed/tami-<khối>-<n>/<w>/<h>` chỉ ở seed dev/staging, không vào production.

### 1.4. Accessibility nền (NFR-07: AA cho trang chính)
- Link "Bỏ qua tới nội dung" (`Skip to content`) là phần tử focus đầu tiên.
- Landmark: `header`, `nav[aria-label]`, `main#main`, `footer`; mỗi trang đúng một `h1`.
- Focus `:focus-visible` dùng `--focus-ring` (tokens §1.7); không bao giờ `outline: none` mà không thay thế.
- Mọi điều khiển chỉ có icon có `aria-label` theo ngôn ngữ đang xem.
- Touch target ≥ 44×44px, khoảng cách ≥ 8px.
- Slider/carousel: `role="region"` + `aria-roledescription="carousel"`, slide `role="group"` + `aria-label="2 / 5"`, nút Trước/Sau/Dừng có nhãn; autoplay dừng khi focus vào trong.
- Form: label hiển thị, `aria-describedby` cho helper + lỗi, `aria-invalid`, lỗi tóm tắt có `role="alert"`, thông báo thành công `role="status"` + chuyển focus tới tiêu đề thông báo.
- Dialog/Sheet/Menu toàn màn hình: bẫy focus, `Esc` đóng, trả focus về nút mở, khoá cuộn nền.
- `prefers-reduced-motion`: theo tokens §6.

### 1.5. Hiệu năng (NFR-01)
- Server Component mặc định; chỉ các lá tương tác là Client Component: slider, menu, bộ lọc, form, cookie banner, nút nổi, lightbox, bản đồ.
- MapLibre GL tải động khi khối bản đồ vào viewport (IntersectionObserver), trước đó hiện ảnh tĩnh + nút "Xem bản đồ / View map".
- Video (hero, tin cho thuê) không tự tải trên mobile/Save-Data; YouTube/TikTok dùng facade (ảnh + nút phát), chỉ nhúng iframe khi bấm.
- GA4 chỉ tải sau đồng ý cookie (§3.10). Turnstile tải khi form vào viewport hoặc khi focus ô đầu tiên.
- Trang công khai cache CDN `s-maxage=60` (ARCHITECTURE §5): HTML **không** được khác nhau theo cookie. Mọi thứ phụ thuộc cookie (consent, ghi nhớ ngôn ngữ) xử lý ở client.

### 1.6. Ngân sách eyebrow; không còn chữ chìm
- Eyebrow (nhãn nhỏ in hoa trên tiêu đề): tối đa **ceil(số section / 3)** mỗi trang (taste-skill §4.7). Mỗi screen dưới đây ghi rõ section nào có.
- **As-built BL-045:** các trang con theo phong cách trang chủ đặt eyebrow cho khối đầu trang (hero) + đầu mỗi khối nội dung; hero KHÔNG tính vào ngân sách `ceil(n/3)` vì eyebrow hero là chữ admin (`site-settings.pageHeroes.*.eyebrow`). Eyebrow không được trùng chữ với tiêu đề của chính mục (đã đổi eyebrow Tổng quan/Nội dung/Hình ảnh/Video ở chi tiết tin BĐS + cho thuê sang chữ mô tả khác).
- **Chữ chìm (watermark) đã bỏ** (BL-020, user duyệt 2026-10-19): không còn token `--text-watermark`, prop `watermark` của PageBanner, hay chữ chìm ở trang chủ/404. Mọi chỗ dưới đây ghi "watermark" là lịch sử, không còn áp dụng.

### 1.7. Kiểu chữ: viết thường (sentence case)
- **Viết thường (sentence case)**, Montserrat weight 500 (h4/giá 600; BL-036 as-built: một font duy nhất, thang `display/h1/h2/h2-sm/h3` mang weight 500 mặc định qua token `--text-*--font-weight`, `--font-display` trỏ về Montserrat, phân cấp bằng cỡ + độ đậm): mọi heading h1/h2/display (tiêu đề trang, tiêu đề section, câu chính hero, tên dự án trên hero/slider, tiêu đề CTA, bài viết, tin cho thuê, việc làm, tên trên thẻ). Không dùng CSS `uppercase` cho heading (BL-020; trước đây in hoa).
- **In hoa (CSS `uppercase`) chỉ còn**: nút (Button), eyebrow, menu.
- Cỡ (desktop → mobile, token `--text-*`, BL-036): display 52px → ~28px, h1 48px → ~26px, h2 38px → ~24px, h2-sm 26px → ~22px, h3 22px → ~20px, h4 18px; weight display/h1/h2/h2-sm/h3 = 500, h4/giá = 600; line-height display/h1 1.15, h2 1.2, h2-sm 1.25, h3 1.3; letter-spacing display/h1/h2 -0.01em. Heading phụ trong nội dung/trang chi tiết (RichText h2, mục việc làm, tiêu đề form (kể cả form trong thẻ liên hệ / tư vấn), "tin tương tự") dùng `--text-h2-sm`; mục trong khung chi tiết chung (chi tiết dự án + chi tiết cho thuê, `DetailSection`, BL-027) dùng `--text-h2` để h1 ≥ h2 ≥ h3; tiêu đề tin cho thuê (h1) dùng `--text-h2`.

---

## 2. Khung trang (layout shell)

### 2.1. Header

| Thuộc tính | Spec |
|---|---|
| Biến thể | **Nền một biến thể, hai hình dạng theo cuộn (BL-025, sửa BL-020)**: nền luôn kính mờ SÁNG `--color-glass` (kem ~80%) + `backdrop-filter: blur(--blur-glass 24px)`, cả trên hero lẫn trang không hero (không có biến thể trong suốt). **Đầu trang** (`scrollY ≤ 4px`, mặc định SSR, `<header>` không có `data-scrolled`): thanh **phẳng full-width** lấp đầy `<header>` (cao = `--header-offset`), sát mép trên/trái/phải, `border-radius: 0`, không bóng; nội dung vẫn trong khung `max-w-[84rem]` căn giữa (chỉ nền tràn viền, logo/nút không nhảy ngang khi đổi trạng thái). **Đã cuộn** (`data-scrolled`): thanh **nổi** bo tròn hai đầu bằng bán kính thật = nửa chiều cao thanh (BL-046: 26px; ≥ lg 28px, theo thanh nổi 52/56px — không dùng `--radius-pill` 9999px vì khi nội suy góc giữ tròn gần hết quãng rồi bật vuông; BL-026), `--shadow-md`, lề + rộng tối đa như dòng "Cao / lề". Chuyển đổi (BL-026): transition padding header + max-width/radius/shadow thanh, mọi thuộc tính cùng nhịp `--duration-slow` (450ms) + `--ease-standard` (`cubic-bezier(0.2,0,0,1)`), góc bo đổi dần 0 ↔ 26/28px; tắt khi `prefers-reduced-motion`. Trạng thái do client component `HeaderFrame` (listener `scroll` passive + rAF). Logo vàng (BL-018) + chữ/icon `--color-text` luôn đạt ≥ 4.5:1 ở cả hai hình dạng (10.83:1 khi nền sau kính là đen, 17.55:1 khi trắng). Fallback: trình duyệt không có `backdrop-filter` (`@supports`) hoặc `prefers-reduced-transparency: reduce` → nền đặc `--color-surface`. Vòng focus trong thanh dùng màu `--color-text` (focus-ring mặc định chỉ ~3.0:1 trên kính/nền đen) |
| Trang chi tiết (BL-027) | Chi tiết dự án + chi tiết cho thuê (+ tin đăng BĐS BL-032, tin tức BL-033) (gốc `DetailLayout` có `data-detail-page`; CSS `html:has([data-detail-page])`): đầu trang thanh phẳng như trên; **đã cuộn** (`data-scrolled`) → header trượt lên ẩn hẳn `translateY(-100%)` (`--duration-slow` + `--ease-standard`, tức thì khi `prefers-reduced-motion`), không thành thanh nổi, **không hiện lại khi cuộn lên**; hiện lại khi về đầu trang hoặc khi trong header có `:focus-visible` (Tab bàn phím — không dùng `:focus-within` vì focus chuột/chạm sau khi đóng menu sẽ giữ header che thanh mục con). Chỉ ẩn bằng transform (link còn focus được, đọc màn hình vẫn thấy); `<header>` vẫn cao `--header-offset` trong luồng (không CLS). Trình duyệt không có `:has()` → hành vi thường. Chưa hydrate / không JS: header đầy đủ có thể che thanh mục con (rủi ro user chấp nhận 2026-10-20) |
| Trang không có hero | Cùng quy tắc hai hình dạng; `<header>` nằm trong luồng, cao CỐ ĐỊNH `--header-offset` ở cả hai trạng thái (phẳng: thanh lấp đầy 64/72px; nổi: lề + thanh 6+52+6 = 64px; ≥ lg 8+56+8 = 72px — BL-046 hạ thấp theo mockup site redesign) nên nội dung không bị che, không CLS khi đổi trạng thái. Hero kéo lên bằng `-mt-(--header-offset)` để ảnh nằm dưới thanh |
| Cao / lề | (BL-046) Khi nổi: thanh 52px (< lg) · 56px (≥ lg); cách mép trên 6px (< lg) · 8px (≥ lg), hai bên 8/16px; rộng tối đa 84rem, căn giữa. Khi phẳng (đầu trang): thanh 64px (< lg) · 72px (≥ lg) như mockup, không lề, full-width; hàng nội dung cao bằng thanh, căn giữa dọc; logo 40px (< lg) · 36px (≥ lg). Cả hai: đệm ngang trong thanh 12/20/24px (< md / md / lg), xl 20px |
| Bố cục < xl | Trái: nút Tìm kiếm (icon kính lúp). Giữa: logo. Phải: cờ VI / EN (§2.3; ẩn < sm, khi đó nằm trong menu) + nút Menu (icon 3 gạch, nhãn "Menu") mở menu toàn màn hình §2.2. Nút Menu **chỉ có ở < xl** (BL-019) |
| Bố cục ≥ xl | **Một hàng** (user quyết 2026-10-19, BL-001; bỏ nút Menu BL-019): logo trái · menu ngang giữa (7 mục: Trang chủ · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ, chữ `--text-xsmall` (12px) 600 in hoa `0.04em`, gap 24px — theo mockup site redesign, BL-046) · phải: nút Tìm kiếm, cờ VI / EN (§2.3), nút CTA (nếu bật). **Không có nút Menu** (như vinhomes.vn desktop: menu ngang là điều hướng duy nhất, không trùng menu toàn màn hình). Cao 72px như ≥ lg, không còn hàng 2. Mục có con: dropdown khi hover/focus/Enter, `aria-expanded`. Menu ngang không xuống dòng, không tràn ở 1280px (VI và EN) |
| Mục đang xem | Gạch chân 2px `--color-text`, `aria-current="page"` (không dùng màu accent: accent-text trên kính nền đen chỉ ~3:1). Hover mục: gạch chân `--color-text` 40%; hover icon: nền `--color-text` 10% (không đổi màu chữ). **As-built BL-074:** bỏ vạch dưới chữ (cả đang xem lẫn hover) — mục menu là viên thuốc `px-2.5` (2xl `px-3`), hover nền `--color-text` 6%, đang xem nền `--color-text` 10% + `aria-current="page"` (khoảng cách chữ giữ 24/32px, không tràn 1280). **As-built BL-087 (thay BL-074 cho menu ngang header):** quay lại vạch dưới chữ nhưng màu vàng — mục đang xem (`aria-current="page"`) và hover đều có vạch 2px `--color-accent-text` (#8c6733), bỏ viên thuốc/nền (không `px`, `ul` `gap-6 2xl:gap-8`); transition `--duration-fast`, tắt khi reduced motion; chỉ menu ngang header ≥ xl (menu < xl, dropdown, link/nút khác không đổi). Tương phản vạch/nền đo thực tế: 4.88:1 trên nền sáng/kính trên nền trắng, 3.33:1 trên kính đầu trang đè hero, min 3.01:1 tính cho kính 80% trên nền đen tuyền (≥ 3:1, WCAG 1.4.11); không dùng `--color-accent-display` (2.31:1) |
| Sticky | Có, `position: sticky; top: 0; z: --z-header`; vùng lề trong suốt `pointer-events: none` (chỉ thanh nhận chuột). Thanh mục con dính (`DetailSubNav`) dùng `top: var(--sticky-top)`, khung `mx-auto max-w-container px-gutter` (= khung lưới nội dung của `DetailLayout`, không phải khung 84rem của header — BL-028), viên thuốc `ul` `w-full`; `--sticky-top` = `--header-offset` ở `:root`, trên trang chi tiết (BL-027) cố định 0.5rem / ≥ lg 1rem (= lề ngang header nổi; cố định, không theo lề trên 6/8px). Đích neo dùng `scroll-margin-top` = `--sticky-top` + 1rem (`LeadFormSlot` mặc định), trong khung chi tiết = `--sticky-top` + 4.5rem (thanh ~54px + khe 18px). Trang khác (tin, tuyển dụng, pháp lý…) giữ `--header-offset`. **As-built BL-074:** khi có thanh mục con, `DetailLayout` đặt thanh **trong** lưới, bọc [thanh, (leading), cột chính] bằng `div.lg:contents` (thanh `lg:col-span-2 mb-4 lg:mb-8`, lưới bỏ padding trên; `DetailSubNav frameClassName` thay khung `mx-auto max-w-container px-gutter` vì lưới đã có cùng khung) → < lg thanh chỉ dính tới hết cột trái, không đè thẻ liên hệ xếp sau (khe tối thiểu 16 + 24 = 40px); ≥ lg thanh dính suốt lưới và thôi dính ở cuối lưới cùng thẻ phụ. Không có thanh mục con → DOM như cũ |
| Logo | Chỉ bản cho nền sáng (`site-settings.logo`, mặc định `/brand/tami-logo-gold.png`; BL-018) vì kính luôn sáng; `site-settings.logoDark` vẫn dùng cho menu toàn màn hình + footer. Logo là nhãn hiệu nên miễn tỉ lệ 4.5:1 (WCAG 1.4.3) |
| Nút CTA | Từ global `header.ctaButton`: "bật" = có cả `label` ở ngôn ngữ đang xem và `link` hợp lệ → hiện nút CTA (nút chính cỡ nhỏ) ở cụm phải header (≥ md) và trong menu toàn màn hình; thiếu nhãn ở ngôn ngữ đang xem (vd chưa có bản EN) hoặc thiếu link → ẩn, không mượn chữ ngôn ngữ kia (BR-07) |

**Tìm kiếm (D7):** bấm icon mở thanh tìm (Sheet trên xuống, cao 160px desktop / toàn màn mobile): ô `q` (label ẩn trực quan "Tìm tin cho thuê / Search rentals"), gợi ý tĩnh 4 danh mục Cho thuê dạng chip. Enter → `/cho-thue?q=` · `/en/for-rent?q=`. Không autocomplete (ngoài phạm vi).

### 2.2. Menu toàn màn hình
- **Chỉ < xl** (BL-019): mở từ nút Menu, phủ toàn màn hình, lớp `.theme-dark-block` nền `--color-dark-deep`, `z: --z-overlay`.
- Cột trái (≥ lg) / toàn bộ (< lg): 7 mục chữ `--text-h3` in hoa (giữ in hoa trong menu, như `MobileMenu`), mục có con xổ accordion (chữ `--text-body`). Cột phải (≥ lg): hotline, email, địa chỉ, mạng xã hội, cờ VI / EN (§2.3).
- Accordion menu con: link cha giữ điều hướng, nút caret riêng cạnh link (≥ 44px, `aria-expanded`, `aria-controls`, nhãn "Mở menu con <mục>"), đóng mặc định, mở bằng Enter/Space/chạm; chuyển động mở/đóng `--duration-base`, tắt khi `prefers-reduced-motion`. ≥ xl không có menu toàn màn hình (điều hướng bằng menu ngang §2.1); đang mở mà cửa sổ rộng lên ≥ xl → menu tự đóng, nhả khoá cuộn nền.
- Mở: menu trượt mờ dần `--duration-slow`, các mục stagger 40ms (tắt khi reduced motion).
- Nút đóng ở đúng vị trí nút Menu (cùng toạ độ), `aria-label="Đóng menu / Close menu"`.

### 2.3. Chuyển ngôn ngữ (FR-PUB-19)
- **As-built BL-063 (user chọn cờ vuông 2026-10-22):** hai **cờ vuông SVG inline** VN (đỏ `#DA251D` + sao vàng) / UK (Union Jack giản lược) thay chữ `VI | EN`, tự vẽ ở `flag-icons.tsx` (không emoji, không ảnh ngoài; màu quốc kỳ cố định, không theo token). Khung cờ 24×24 `rounded-[2px]`, viền mảnh `ring-1 ring-black/20` để nét trên nền sáng lẫn tối. Mỗi mục là `<a hreflang lang>` với `aria-label` + `title` = "Tiếng Việt" / "English", vùng bấm ≥ 44×44 (`min-h-11 min-w-11`, `rounded-full`), hai mục kề nhau `gap-1`; cờ là trang trí (`aria-hidden`), không còn ngăn `|`.
- **As-built BL-074 (user 2026-10-23, thay hình dạng/kích thước BL-063):** cờ **chữ nhật 3:2** — SVG `viewBox 0 0 30 20`, hiển thị `h-3.5 w-[21px]` (21×14, nhỏ hơn 24×24); VN nền `#DA251D`, sao vàng tâm (15,10) đỉnh hướng lên, bán kính ngoại tiếp 20/3 (= 1/3 chiều rộng, builder theo quy định cờ; chênh ~0.5px so với cách 1/5 chiều dài — không thấy được ở cỡ này), bán kính trong 0.382×; Union Jack giản lược 30×20 (chéo trắng 4 / đỏ 1.6, chữ thập trắng 6 / đỏ 3.4). Viền mảnh `ring-1 ring-black/20` + `rounded-[2px]` giữ; ngôn ngữ đang xem ring **mảnh hơn** `ring-[1.5px] ring-accent-text ring-offset-1` (≈ 4.8:1 trên kính sáng, ≈ 10:1 on-dark), cờ kia mờ 60%. Vùng bấm 44×44, `gap-1`, thuộc tính truy cập, đích link, cookie không đổi.
- **Đang xem:** `aria-current="true"` + ring 1.5px `--color-accent-text` có offset 1px (BL-074; trước đó 2px/2px) (phân biệt bằng hình học, không chỉ màu); màu offset theo nền qua prop `tone` (`on-light` mặc định = `--color-glass` ở header; `on-dark` = `--color-dark` ở menu toàn màn hình + footer). **Ngôn ngữ kia:** mờ 60%, hover/focus 100% (`--duration-fast`, tắt khi reduced motion). Focus dùng vòng `:focus-visible` toàn site (trong header là màu chữ).
- Đích: trang tương ứng ở ngôn ngữ kia (route map BRD §2.1 + slug localized). Không có bản dịch → trang danh sách của loại đó, hoặc trang chủ. Bấm ghi cookie `NEXT_LOCALE` (client).
- Xuất hiện ở: header (≥ sm), menu toàn màn hình, footer.

### 2.4. Footer
- `.theme-dark-block` nền `--color-dark`, padding `--space-section-tight`.
- **As-built BL-044 (theo mockup trang chủ, đổi toàn site; user chốt Q2 2026-10-20: không cột Liên hệ).**
- Lưới ≥ md `minmax(0,1.4fr)` + N cột link `minmax(0,1fr)` (N = số cột `footer.columns`, truyền qua biến CSS `--footer-cols`; `auto-fit` không đi chung với track `fr`): **cột trái** logo trắng → mô tả ngắn (≤ 25 từ, `footer.contactBlock`) → mạng xã hội (`site-settings.socialLinks`) dạng **ô tròn 40px viền `--color-dark-border`**, icon 20px, vùng chạm 44px, `aria-label` theo nền tảng; **cột link** `footer.columns` (vd "Khám phá", "Về TAMI"; chữ do CMS) tiêu đề `--text-eyebrow` hoa giãn chữ `--color-accent-text`, link `--text-small` `--color-text-secondary`. **Không cột Liên hệ**: hotline/email/địa chỉ nằm ở nút nổi §2.5, menu di động và trang Liên hệ.
- Hàng cuối (đường kẻ `--color-dark-border` phía trên): bản quyền bên trái; cờ VI / EN (§2.3) + "Cài đặt cookie" (khi có GA) bên phải. Mạng xã hội KHÔNG nằm ở hàng cuối nữa.
- Nút tròn "lên đầu trang" góc dưới phải trong mockup = `BackToTop` nổi (§2.5, BL-035), không dựng nút thứ hai trong footer.
- Responsive: < md cột trái xếp dọc, mỗi cột link là accordion (tiêu đề là heading chứa nút, đóng mặc định, `aria-expanded` + `aria-controls`); ≥ md lưới (không accordion, mọi link hiện).

### 2.5. Nút liên hệ nổi (FR-PUB-12)
- Góc dưới phải, cách mép `max(16px, env(safe-area-inset-right))` và đáy `max(16px, env(safe-area-inset-bottom))`, `z: --z-floating`.
- 3 nút tròn 48px (`--radius-full`, `--shadow-lg`): Hotline (`tel:`, nền `--color-primary`), Zalo, Fanpage (nền `--color-dark`, icon trắng). Mobile: mặc định thu gọn thành 1 nút "Liên hệ nhanh / Quick contact" bung lên 3 nút (tránh che nội dung); ≥ md hiện cả 3 xếp dọc.
- Bấm: `navigator.sendBeacon('/api/public/click-events', {type, pagePath, refCollection?, refId?})` rồi mở link. Link lấy từ `site-settings`; thiếu link nào thì ẩn nút đó.
- Khi cookie banner đang hiện, nút nổi đẩy lên trên banner (không chồng).
- Trang chi tiết có khung giá dính ở đáy mobile (§4.7): nút nổi đẩy lên trên thanh đó.
- **Lên đầu trang (BL-035):** nút tròn 48px trong **cùng cụm nổi** (một khung `fixed` chung với nút liên hệ — vị trí đáy/phải, `--floating-bottom-offset`, `--sticky-cta-height`, `--z-floating`, `print:hidden` đặt ở khung chung), đứng trên cùng của cột; nền `--color-surface` + viền `--color-border` + icon `ArrowUp` 24px màu chữ, `--shadow-lg`, focus-visible ring theo token. Hiện khi `scrollY > innerHeight` (fade opacity `--duration-fast`; ẩn = `invisible` + `opacity-0` nên không nhận focus/click, không chừa vùng chặn click). Bấm: `scrollTo({top: 0, behavior: reduced-motion ? "instant" : "smooth"})` + `#main.focus({preventScroll: true})`. Site không có hotline/Zalo/fanpage → cụm chỉ còn nút này. Nhãn `page.floating.backToTop` ("Lên đầu trang" / "Back to top").

### 2.6. Breadcrumb
- Mọi trang trừ trang chủ. `nav[aria-label="Breadcrumb"]` + `ol`, mục cuối `aria-current="page"`, không là link. Chữ `--text-small` `--color-text-muted`, phân cách icon `CaretRight` 12px `aria-hidden`.
- Trên trang có hero ảnh: breadcrumb đặt **dưới** hero (không đè lên ảnh). Mobile: rút gọn còn "← <mục cha>" nếu > 3 mục.
- **As-built BL-045 (thay quy tắc trên cho trang con có hero ảnh):** breadcrumb nằm TRÊN ảnh, góc trên-trái, khung viên thuốc chỉ bao chữ (`.crumb-glass`: nền `--color-primary-deep` 13% + `--blur-breadcrumb` 4px, chữ trắng + bóng bằng `--color-banner-scrim`, ngăn `›`). Trang không có ảnh (Bài viết tin tức) → breadcrumb trơn đầu trang. Đã đo trên ảnh hero thật (dev, 1440 + 390): chữ trắng/nền sau khung median ≥ 9.9:1, p95 ≥ 7.6:1 (≥ 4.5:1 AA) ở mọi trang con.
- Kèm JSON-LD `BreadcrumbList` theo ngôn ngữ.

### 2.7. Page banner (đầu trang danh sách)
- **As-built BL-045:** hero trang con = `PageHero` (ảnh admin + scrim đen ánh nâu vàng `--color-banner-scrim` `rgb(20 13 2 / 0.6)` (BL-049, đổi chung token; trên ảnh trắng: chữ trắng 5.07:1, breadcrumb kính 4.60:1, dòng vàng 7.03:1) + chữ canh trái: eyebrow, tiêu đề, dòng vàng, mô tả từ `site-settings.pageHeroes`, rơi về chữ i18n mặc định). Chiều cao là `min-h` (list 360/440, ngắn 280/340 px) thay chiều cao cố định để chữ admin dài không bị cắt/đè breadcrumb; chữ render ở server nên không gây CLS. Thiếu ảnh → nền tối token cùng chiều cao. Banner tư vấn cuối trang con = `ConsultBanner` (nội dung `homepage.ctaBanner`, tiêu đề+mô tả đi theo cặp).
- (Lịch sử, trước BL-045) Biến thể **Ảnh**: cao `clamp(240px, 42svh, 440px)` (`size="default"`; trang danh sách dùng `size="compact"` — **cao cố định 240px**; chỉ khi có băng tìm kiếm đè (prop `overlap`) mới chừa 3rem đáy, mô tả tối đa 2 dòng; BL-020 P3), ảnh `object-cover` + scrim, tiêu đề `--text-h1` trắng căn giữa. Ảnh lấy từ `site-settings.pageBanners` (FR-ADM-20, BL-017): ảnh riêng của trang danh sách → ảnh mặc định (`pageBanners.default`) → không có thì biến thể Chữ. Trang danh mục (S05) dùng ảnh của danh sách cha. VI/EN cùng ảnh. Scrim của banner phải giữ chữ trắng (cả mô tả) ≥ 4.5:1 trên ảnh trắng tinh.
- Biến thể **Chữ** (khi chưa cấu hình ảnh): nền `--color-bg-alt`, tiêu đề `--text-h1` (viết thường, không còn chữ chìm), mô tả danh mục nếu có (`categories.description`, `max-width: 60ch`). Padding `--space-section-tight`.
- Header trên trang có banner ảnh: vẫn là thanh nổi kính mờ sáng §2.1 (không còn biến thể trong suốt).

---

## 3. Component và pattern dùng chung

### 3.1. Section heading
- Thành phần: [eyebrow tuỳ chọn theo ngân sách §1.6] + tiêu đề `--text-h2` + mô tả tuỳ chọn (≤ 25 từ, `--text-lead`, `max-width: 60ch`) + link "Xem tất cả" (Ghost, `--color-accent-text`).
- Căn giữa (trang chủ) hoặc căn trái (trang trong). **Không** dùng kiểu tiêu đề trái + đoạn nhỏ trôi bên phải (split-header ban). Link "Xem tất cả" đặt **dưới** nội dung khối trên mobile, cạnh tiêu đề (căn đáy) ≥ md.

### 3.2. Thẻ (Card)

Thẻ ảnh và khung thẻ bo `--radius-xl` (20px); nút bo viên thuốc `--radius-pill`; panel/hộp thông báo `--radius-md`/`--radius-lg` (12/16px); ô nhập (input/textarea/select) `--radius-md` (BL-030), checkbox 6px (= md/2), khung form lead `--radius-lg`. Badge bo viên thuốc: Sắp mở bán = `--gradient-gold`, Đang bán = `--gradient-success` (chữ trắng), Đã bàn giao = trung tính.

| Thẻ | Ảnh | Nội dung | Hover/focus |
|---|---|---|---|
| **Dự án** | 4:5 (< md) / 4:3 (≥ md), `--radius-xl` (20px); thẻ trắng `--color-surface`, viền `--color-border`, khung `overflow-hidden` bo 20px, nội dung `p-4` | Badge `salesStatus`; tên `--text-h4`; tỉnh/thành `--text-small` muted; "Từ <giá>" `--text-small` 600 nếu có | Ảnh `--hover-zoom` `--duration-slow`; thẻ `hover:shadow-md`; tên đổi màu `--color-accent-text` (BL-034). Cả thẻ là 1 link (`<a>` bọc, không lồng link) |
| **Tin cho thuê** | 4:3, `--radius-xl` (20px), nền `--color-surface`, viền `--color-border` | Giá/tháng `--text-h4` `--color-text` (hoặc "Thoả thuận / Negotiable"); tiêu đề 2 dòng `--text-body` 600; hàng thông số icon + số: diện tích, phòng ngủ, WC (`tabular-nums`); phường, tỉnh `--text-small` muted; mã tin `--text-xsmall` muted | Ảnh zoom; viền đổi `--color-input-border`; tiêu đề đổi màu `--color-accent-text` (BL-034). Tin `rented` không bao giờ xuất hiện trong lưới/tin tương tự nên thẻ không cần badge "Đã thuê" |
| **Tin/ưu đãi** (Đăng tin BĐS, Tin tức) | 16:10; thẻ lưới `card` trắng bo 20px viền `--color-border`, nội dung `p-4` (PostCard, NewsCard; NewsCard trên nền tối khối Tin tức trang chủ giữ phẳng trong suốt, ảnh bo 20px; bài lớn `feature` và hàng `row` của trang Tin tức cũng phẳng) | Danh mục `--text-xsmall` 600 `--color-accent-text` (đây là metadata, không tính eyebrow section); tiêu đề 2-3 dòng `--text-h4`; excerpt 2 dòng (chỉ thẻ lớn); ngày `--text-xsmall` muted; Đăng tin BĐS: badge "Đã kết thúc" / "Còn <n> ngày" nếu có `offer.endAt` | Ảnh zoom; thẻ trắng `hover:shadow-md`; tiêu đề đổi màu `--color-accent-text` (BL-034; cả tiêu đề tin trong khối Ưu đãi chi tiết tin đăng) |
| **Dịch vụ** | 3:4 (nhỏ) / 4:5 (lớn), scrim dưới | Tên `--text-h2` trắng đè trên ảnh (đáy trái), `summary` 2 dòng `--color-on-dark-muted` ≥ md | Ảnh zoom; mũi tên `ArrowRight` trượt 4px |
| **Việc làm** (hàng) | không ảnh | Tên vị trí `--text-h4`; nơi làm, hình thức, lương (`salaryText`), hạn nộp; nút mũi tên | Nền `--color-surface` → `--color-primary-subtle`; tên vị trí đổi màu `--color-accent-text` (BL-034) |

**Hover tiêu đề thẻ (BL-034, user 2026-10-20):** mọi thẻ là link (Dự án, Tin cho thuê, Đăng tin BĐS, Tin tức mọi biến thể, Ưu đãi chi tiết tin đăng, Việc làm, slider dự án trang chủ) khi hover hoặc focus bàn phím vào thẻ: tiêu đề **không gạch chân**, chữ đổi sang vàng thương hiệu `--color-accent-text` (`#8C6733`, 5.1:1 trên trắng; trong `.theme-dark-block` token tự thành `--color-on-dark-accent` `#E0BF89`, 10.8:1 trên `#111`), đổi màu `transition-colors` (`--duration-*` mặc định; tức thì khi `prefers-reduced-motion`). **Không** dùng `--color-primary` cho chữ (quá nhạt trên nền trắng). Link khác (breadcrumb, footer, mục lục, link danh mục, nút ghost) giữ hover cũ.

**Hover link điều hướng (BL-037, user 2026-10-20):** breadcrumb, Button `ghost` ("Xem tất cả" Dự án nổi bật, "Nhận tư vấn" EmptyState), "Xem thêm" hàng danh mục `/tin-tuc`, link danh mục chi tiết tin tức + tin đăng, "Xem tất cả vị trí" tin tuyển dụng hết hạn: hover **không gạch chân**, `transition-colors`; link chữ thường → `--color-accent-text` (khối tối tự `#E0BF89`); link vốn đã `--color-accent-text` → `--color-text`; "Xem tất cả vị trí" trong hộp cảnh báo giữ gạch chân lúc thường, hover bỏ gạch chân + accent (4.57:1 trên `#FBF1E0`). Focus-visible giữ outline chung. Link trong nội dung bài (RichText) giữ gạch chân; footer / mục lục / LanguageSwitcher / 404 chưa đổi. **As-built BL-074 (thay các ngoại lệ trên):** site công khai **không còn gạch chân** ở link/nút/menu/thẻ/footer/mục lục/404/banner cookie/form/bộ lọc (kể cả "Xem tất cả vị trí" trong hộp cảnh báo) — hover `transition-colors` đổi màu (chữ xám → `--color-text`, chữ vàng → `--color-text`) hoặc nền (`--color-text` 6% cho link chữ đậm trên nền màu: hotline / "Thử lại" trên `--color-error-subtle` dùng `--color-text` thay accent vì accent chỉ 4.40:1 ở đó; AnnouncementBar). Link giữa câu ngoài RichText (ô đồng ý "Chính sách bảo mật", banner cookie, ghi chú liên hệ tin tức, email/hotline tuyển dụng) phân biệt bằng **chữ đậm + màu nhấn** (WCAG 1.4.1). **Chỉ link trong nội dung bài (RichText) giữ gạch chân.** Chỉ báo tab dạng thanh dưới ô (tab danh mục trang danh sách) giữ.

**Loading (skeleton):** cùng khung + tỉ lệ ảnh, khối `--color-surface-muted`, hiệu ứng nhấp nháy opacity 0.6 → 1 1.2s (tắt khi reduced motion). **Không** dùng `loading.tsx` cấp route cho trang danh sách (`force-dynamic`, kể cả thư mục cha): khung chờ stream trước làm `notFound()` vượt số trang thành soft-404 HTTP 200 (L9-T08; test `list-no-loading.test.ts` chặn). Lưới danh sách dùng phản hồi chờ như S04 (giữ kết quả cũ, mờ 50% + `aria-busy`, link đang chờ mờ nhẹ qua `useLinkStatus`); skeleton chỉ dùng cho `Suspense` cục bộ của khối con.

### 3.3. Lead form (FR-PUB-13, API_SPEC §3.1)
- Biến thể **Đầy đủ** (dự án, liên hệ, Đăng tin BĐS): Họ tên* · Số điện thoại* · Email · Lời nhắn (textarea, đếm ký tự khi > 800/1000) · Checkbox đồng ý* · Turnstile · nút **Nhận tư vấn**.
- Biến thể **Rút gọn** (khung dính tin cho thuê): Họ tên* · Số điện thoại* · Lời nhắn (1 dòng, mở rộng khi focus) · đồng ý* · Turnstile · nút.
- Checkbox đồng ý: "Tôi đồng ý để TAMI xử lý dữ liệu cá nhân theo [Chính sách bảo mật]." / "I agree to TAMI processing my personal data under the [Privacy Policy]." Link mở tab mới, có `aria-describedby` tới chú thích "(mở tab mới)".
- Gửi kèm ẩn: `source`, `sourceId`, `locale`, `pageUrl`, `utm` (ghi ở mọi trang công khai bởi island client trong khung trang: URL có `utm_*` thì lưu/ghi đè `sessionStorage`; lúc gửi ưu tiên UTM của URL hiện tại, không có thì bản đã lưu).
- Validate client (cùng luật API): họ tên 2-100 ký tự; SĐT Việt Nam (chấp nhận `0xxxxxxxxx`, `+84…`, có dấu cách/chấm), `inputmode="tel"`, `autocomplete="tel"`; email hợp lệ nếu nhập; lời nhắn ≤ 1000. Validate khi blur + khi gửi, không validate khi đang gõ lần đầu.

| Trạng thái | Hiển thị |
|---|---|
| Mặc định | Label phía trên, `*` kèm chữ ẩn "bắt buộc / required" |
| Lỗi trường | Viền `--color-error`, icon `WarningCircle`, thông báo dưới ô `--text-small` `--color-error` theo ngôn ngữ ("Vui lòng nhập số điện thoại hợp lệ." / "Please enter a valid phone number."). Gửi khi có lỗi: focus ô lỗi đầu tiên + hộp tóm tắt `role="alert"` trên nút |
| Chưa tick đồng ý | Nút vẫn bấm được (không disable để người dùng biết lý do); lỗi dưới checkbox "Vui lòng đồng ý để gửi thông tin." |
| Đang gửi | Nút disabled, nhãn "Đang gửi…" / "Sending…" + spinner 16px trong nút, các ô `readonly`. Không spinner toàn trang |
| Thành công (200) | Thay form bằng panel `--color-success-subtle`: icon `CheckCircle`, tiêu đề "Cảm ơn anh/chị!" / "Thank you!", câu "Chuyên viên TAMI sẽ liên hệ trong giờ làm việc." / "A TAMI advisor will contact you during business hours." + hotline. `role="status"`, focus tiêu đề. Bắn sự kiện GA4 `generate_lead` (chỉ khi đã đồng ý cookie). Không hiện khác nhau khi lead bị gộp (API luôn trả như nhau) |
| 400 (validate/captcha) | Lỗi trả theo `locale` gắn vào từng trường (`details`); captcha lỗi: "Xác minh chống spam không thành công, vui lòng thử lại." + reset Turnstile |
| 429 | Hộp `--color-warning-subtle`: "Anh/chị đã gửi nhiều lần, vui lòng thử lại sau ít phút hoặc gọi hotline <số>." Giữ dữ liệu đã nhập |
| 500 / mạng | Hộp `--color-error-subtle` `role="alert"`: "Chưa gửi được, vui lòng thử lại." + nút "Thử lại / Try again" + hotline. Giữ dữ liệu |

### 3.4. Form ứng tuyển (FR-PUB-09, API_SPEC §3.2)
- Họ tên* · Số điện thoại* · Email* · CV* (vùng chọn file: kéo-thả ≥ md, nút "Chọn tệp / Choose file" mọi cỡ; chấp nhận `.pdf,.doc,.docx`, ≤ 5MB) · Lời nhắn · đồng ý* · Turnstile · nút **Ứng tuyển**.
- File: kiểm tra đuôi + dung lượng ở client trước khi gửi; hiện tên tệp + dung lượng + nút xoá. Lỗi 413/415 hiển thị tại ô CV.
- Đang gửi: thanh tiến trình upload (XHR progress) trong nút, không có track nền (taste §9.F): hiện "%".
- Thành công: panel như §3.3, câu "TAMI đã nhận hồ sơ của anh/chị." Vị trí hết hạn trong lúc mở trang (400): "Vị trí này đã hết hạn nhận hồ sơ." + link danh sách tuyển dụng.

### 3.5. Bộ lọc Cho thuê (FR-PUB-04)
- **As-built BL-052:** thay bằng bộ lọc cột trái / Sheet dùng chung cho `/du-an`, `/cho-thue`, `/tin-bds` — xem khối đầu §4 và API_SPEC §3.9–§3.11; các dòng dưới là thiết kế ban đầu.
- Trường: Từ khoá (`q`) · Danh mục · Tỉnh/thành · Phường/xã (phụ thuộc tỉnh, disabled khi chưa chọn tỉnh) · Giá/tháng (2 ô min-max + gợi ý mốc: < 5tr, 5-10tr, 10-20tr, > 20tr) · Diện tích (min-max) · Phòng ngủ (chip 1, 2, 3, 4+) · Nội thất (chip Không, Cơ bản, Đầy đủ) · Sắp xếp (Mới nhất, Giá tăng dần, Giá giảm dần).
- **Nguồn sự thật là URL** (query params như API_SPEC §3.3). Đổi bộ lọc → `router.replace` với `scroll: false`, debounce 300ms cho ô số và từ khoá; trang về `page=1`.
- **Bố cục as-built (BL-020 P3-T01):** thay thanh lọc 2 hàng + thanh dính mobile bằng **băng tìm kiếm gọn** (`ListSearchBar`, thẻ trắng bo 20px, bóng `--shadow-lg`, đè 3rem lên mép dưới banner; một hàng ≥ lg, xếp dọc < lg): ô Từ khoá `q` · **Loại** (= Danh mục, tham số `category`) · **Khoảng giá** (mốc gợi ý + "Mọi mức giá"; ra đúng cặp `priceMin`/`priceMax` của chip mốc giá cũ; khoảng tự nhập không trùng mốc hiện "Khoảng giá tuỳ chọn") · nút "Tìm kiếm" · nút viên thuốc "Bộ lọc" kèm **huy hiệu số lọc phụ đang bật** (Tỉnh, Phường, Diện tích, Phòng ngủ, Nội thất, và **khoảng giá tự nhập** không trùng mốc nào của băng — tính 1 vì trường tự nhập nằm trong Sheet/Popover và "Xoá" dọn nó; mốc giá chọn ở băng, từ khoá, danh mục không tính). Lọc phụ: **Popover modal ≥ lg** (áp dụng ngay, Esc đóng + trả focus về nút) / **Sheet dưới < lg** (như trên). Sắp xếp chuyển xuống hàng kết quả: nhãn chỉ hiện từ `sm` (< sm chỉ còn nhãn cho trình đọc màn hình) để giá trị đọc được ở 375px; dùng chung **một bản nháp** với băng/Popover (context của `RentalListNavigationProvider`) nên đổi sắp xếp luôn kèm mọi lọc đang chờ và từ khoá chưa debounce. Trang danh mục (S05): không có ô Loại. **URL giữ nguyên** (cùng tên khoá/giá trị, "Tất cả" = vắng mặt, lọc mới về trang 1). Băng là **form GET thật** (ô có `name`, ô chọn là `<select>` gốc đã style trước hydrate, tham số khác giữ bằng input ẩn): không JS vẫn tìm theo từ khoá + Loại; riêng đổi Khoảng giá cần JS (một ô không gửi được hai tham số).
- Hàng "Đang lọc": chip từng điều kiện có nút xoá (`aria-label="Bỏ lọc <tên>"`) + "Xoá tất cả / Clear all".
- Số kết quả `aria-live="polite"`: "Có 128 kết quả / 128 results" (EN số ít "1 result"), cùng hàng với ô Sắp xếp.
- Mobile (< lg; **as-built: không còn thanh dính**, băng tìm kiếm cuộn cùng trang): nút "Bộ lọc" mở **Sheet từ dưới lên** (cao 90svh) chứa các lọc phụ, chân Sheet dính: "Xoá / Clear" + "Xem <n> tin / Show <n> listings" (số cập nhật sống). ≥ lg: lọc phụ trong Popover (có nút "Đóng" nhìn thấy, 44px).

### 3.6. Phân trang
- Số trang có link thật (`?page=n`, SEO được), hiện tối đa: đầu, cuối, hiện tại ±1, dấu "…". Nút Trước/Sau có nhãn. `nav[aria-label="Phân trang / Pagination"]`, trang hiện tại `aria-current="page"`.
- Mobile: chỉ "Trước · Trang 2/12 · Sau".
- Đổi trang: cuộn về đầu lưới (focus tiêu đề kết quả).

### 3.7. Thư viện ảnh + lightbox
- **As-built BL-052:** chi tiết dự án / cho thuê / tin BĐS: ảnh ở hero `DetailHeroMosaic` (ảnh 1 nền + ≤ 3 ảnh nhỏ ≥ lg) + dải "Hình ảnh" `DetailGalleryGrid` (1 lớn + 4 nhỏ, ≥ 2 ảnh); mọi ô mở `Lightbox` (bàn phím, bẫy focus, vuốt). `Gallery` / `DetailGalleryHero` cũ đã xoá.
- Chi tiết tin cho thuê / dự án: lưới bento 1 ảnh lớn + 4 ảnh nhỏ (≥ md), ảnh thứ 5 phủ "+<n> ảnh"; mobile: carousel vuốt (scroll-snap) đếm "1/12" ở góc dưới phải (thông tin thật, được phép).
- Lightbox: toàn màn hình nền `--color-dark-deep`, phím ← → Esc, vuốt trên mobile, `alt` làm chú thích, ảnh `large` 1600w. Không có ≥ 3 ảnh (dữ liệu lỗi) → hiện ảnh đầu, ẩn lưới.

### 3.8. Bản đồ
- MapLibre GL + OpenStreetMap, tải lười (§1.5). Ghim 1 điểm `location`. Tin `showExactAddress = false`: hiện **vòng tròn bán kính 300m** thay vì ghim chính xác. Không có `location` → ẩn khối bản đồ.
- Bản đồ không bẫy cuộn: cần 2 ngón trên mobile / Ctrl + cuộn trên desktop; nút "Mở Google Maps / Open in Google Maps".

### 3.9. Trạng thái trống, lỗi, toast
- **Trống khi lọc** (Spec § Quy tắc biên): khung trong lưới, icon `MagnifyingGlass` 40px muted, tiêu đề "Không tìm thấy tin phù hợp" / "No matching listings", câu gợi ý "Thử bớt điều kiện lọc hoặc đổi khu vực." + nút Outline "Xoá bộ lọc / Clear filters" + link "Nhận tư vấn" (mở form liên hệ). Vẫn giữ thanh lọc.
- **Trống thật** (danh mục chưa có bài): "Chưa có bài viết trong mục này." + link về danh sách cha.
- **Lỗi tải phần** (client fetch lỗi): khung `--color-error-subtle` + "Thử lại".
- **Toast** (chỉ cho thông báo tạm, vd đã sao chép mã voucher): góc dưới giữa mobile / dưới phải desktop (trên nút nổi), tự tắt 4s, `role="status"`.

### 3.10. Banner đồng ý cookie (Q7, LGL-03) ★ mới
**Đề xuất chốt:** GA4 **chỉ tải sau khi khách đồng ý**. Không chặn trang (không modal), không tick sẵn.

- Vị trí: thanh nổi đáy màn hình, `--color-surface`, `--shadow-lg`, `--radius-sm`, `z: --z-cookie`; ≥ md: hộp 420px góc dưới trái (không đụng nút nổi bên phải); < md: toàn chiều rộng, cách đáy 8px.
- Nội dung VI: "TAMI dùng cookie phân tích (Google Analytics) để cải thiện website. Cookie cần thiết luôn bật. [Chính sách bảo mật]"
  EN: "TAMI uses analytics cookies (Google Analytics) to improve this website. Essential cookies are always on. [Privacy Policy]"
- Nút (cùng cấp, cùng kích thước, không làm nổi "Đồng ý" hơn "Từ chối"): **Từ chối / Decline** (Outline) · **Đồng ý / Accept** (Dark). Link "Tuỳ chọn / Preferences" mở dialog 2 mục: Cần thiết (luôn bật, disabled) · Phân tích (switch).
- Lưu lựa chọn: cookie `tami_consent` = `{v:1, analytics:true|false, ts}` 12 tháng (client). Đổi `privacyPolicyVersion` → hỏi lại.
- Logic: chưa chọn hoặc từ chối → **không** chèn script GA4, không cookie `_ga`. Đồng ý → chèn `gtag` với `site-settings.gaMeasurementId`; nếu chưa cấu hình ID thì **không hiện banner** (không có cookie phân tích để xin).
- Mở lại từ footer "Cài đặt cookie / Cookie settings". Rút lại đồng ý → xoá cookie `_ga*` + không tải GA4 ở lần tải sau.
- A11y: `role="region"` `aria-label="Cookie"`, không bẫy focus (không phải modal), xuất hiện sau nội dung chính trong thứ tự focus; dialog Tuỳ chọn là modal chuẩn.
- Không ảnh hưởng HTML cache (§1.5): banner render client sau hydrate, đặt chỗ sẵn không gây CLS (dạng overlay cố định, không đẩy nội dung).
- **As-built (layer-5-task-07):** cookie thêm `pv` = `privacyPolicyVersion` đã đồng ý (`{v:1, analytics, ts, pv}`) để so khi đổi version. Link footer "Cài đặt cookie" mở thẳng dialog Tuỳ chọn (hiện lựa chọn hiện tại, bật/tắt Phân tích) thay vì banner; ẩn link khi chưa cấu hình GA ID. < md banner đặt `--floating-bottom-offset` để nút nổi không bị che.

---

## 4. Screen specs

> **As-built BL-052 (thay BL-045 cho S02/S03/S04/S05 cho thuê + tin BĐS/S07/S08/S09; ưu tiên hơn mọi chi tiết cũ bên dưới khi mâu thuẫn — design `docs/specs/listing-detail-redesign/`):**
> - **Khung danh sách chung** (`components/listing/`, S02 · S04 · S05 · S08): hero `ListingHero` (ảnh + chữ `pageHeroes`, breadcrumb kính, ô tìm `q`, chip "Tìm nhanh" `listingPages.*.quickSearch`) → tab danh mục cấp 1 có số đếm (`ListingCategoryTabs`; `/du-an` có icon theo slug; BL-084/086: tràn khung → cuộn ngang + fade ở mép trong vùng cuộn phía còn nội dung + từ md hai làn nút ‹ › 44px NGOÀI vùng cuộn (vùng cuộn thu hẹp, nút không đè tab; ở mép nút mờ `aria-disabled`, không unmount), < md vuốt; không tràn → không làn; tab đang chọn tự cuộn vào giữa tầm nhìn — `ListingTabsScroller`) → ≥ lg cột lọc trái `FilterSidebar` 16/17.5rem | < lg nút "Bộ lọc" + badge mở `FilterSheet` (cùng nội dung) → cột phải: thẻ nổi bật `SpotlightSlider` (trang 1, ≤ 5 tin `isFeatured` khớp lọc, không lặp ở lưới mọi trang) → `ResultsBar` "N … phù hợp" + ô Sắp xếp (`OptionSelect` chip; nhãn ẩn < sm) → lưới 3 cột (md 2, < md 1) → phân trang tròn → "Tìm hiểu thêm" + FAQ (`LearnMoreFaq`; `FAQPage` JSON-LD chỉ ở trang sạch, trùng điều kiện noindex) → dải Điểm mạnh (cờ) → `ConsultBanner`. **BL-061:** ≥ lg `FilterSidebar` dính dưới header (`--sticky-top` + 1rem), cao tối đa = phần màn hình còn lại (`100dvh − --sticky-top − 2rem`), cuộn riêng bên trong thẻ (thanh cuộn mảnh, `overscroll-contain` nên cuộn hết bộ lọc không kéo trang), thôi dính khi hết hàng lưới kết quả (FAQ / Điểm mạnh / CTA nằm ngoài lưới) — `LISTING_FILTER_STICKY_CLASS`; < lg giữ nút "Bộ lọc" + Sheet. `SpotlightSlider`: cả thẻ là link — link phủ (`::after` trải kín `li`) từ nút "Xem chi tiết" (`data-stretched-link`), không lồng `a`; "Nhận tư vấn" (`relative z-10`) + mũi tên / bộ đếm (`z-10`) giữ hành vi riêng; focus-visible vào "Xem chi tiết" → ring quanh cả thẻ (`has-[…]` trên `section`); rê chuột lên thẻ → tiêu đề đổi màu nhấn (`group/spot`).
> - **Bộ lọc:** URL là nguồn sự thật (API_SPEC §3.9–§3.11). Chưa có JS: form GET + nút "Áp dụng", thanh trượt là hai ô số Từ/Đến (`step=any`, không `max` để link cũ lẻ bước vẫn gửi được). Có JS: đổi ô là `router.push` ngay (không cuộn), các thay đổi chưa về URL được gộp (`useListingFilterNav`; ô Sắp xếp dùng cùng `navigate` qua `ListingNavigateContext` nên đổi lọc rồi đổi sắp xếp nhanh không mất lọc), thanh trượt commit khi thả chuột / 300ms sau phím; "Xoá tất cả" về trang sạch. Ô tích có số đếm "trừ chính chiều đó" (mục 0 mờ nhưng vẫn hiện); chip đơn chọn (Tình trạng, Phòng ngủ, Nội thất) không số. Vùng kết quả mờ + `aria-busy` khi chờ (`PendingRegion`, không `loading.tsx`).
> - **Khung chi tiết chung** (`components/detail/DetailPageShell`, S03 · S07 · S09): hero full-bleed `DetailHeroMosaic` (ảnh 1 nền LCP `priority` + scrim; breadcrumb kính, badge, `h1`, địa chỉ, mô tả ngắn ≤ 3 dòng, nút "Xem video giới thiệu" khi có `videoUrl`; ≥ lg 3 ảnh nhỏ cột phải, ảnh đầu "Xem tất cả N ảnh"; < lg nút đó trên ảnh; mọi ảnh mở Lightbox) → thanh thông số nổi `DetailSpecBar` đè đáy hero (ô trống bị bỏ) → tab dính `DetailSubNav` → [cột trái `@container/detail`: Tổng quan (`DetailInfoGrid`) + **mọi khối nội dung (thẻ trắng, BL-061)** | cột phải dính `DetailContactAside` suốt chiều cao cột trái: form lead duy nhất `#lead-form` + khối Hotline] → (khối thiếu dữ liệu ẩn cả khối lẫn tab; Hình ảnh `DetailGalleryGrid` chỉ khi ≥ 2 ảnh) → slider tương tự / tin liên quan (ngoài lưới → form thôi dính) **[As-built BL-071: dải `SimilarCarousel` nền `--color-surface` (trắng) + viền trên `--color-border`, không còn `--color-primary-subtle` vì trùng nền gốc trang `data-detail-page`]** → dải Điểm mạnh → banner tư vấn (nút chính cuộn tới form, không nhân đôi form); thanh CTA dính đáy < lg. `DetailLayout` giữ cho Dịch vụ / Tuyển dụng (BL-054).
> - **Thẻ:** `RentalCard` / `PostCard` biến thể `listing` (danh sách, tin liên quan, "Tin liên quan" của chi tiết dự án) và `home` (trang chủ, giữ BL-045). `PostCard` listing chọn thẻ BĐS hoặc thẻ voucher theo `isVoucherPost` (có ưu đãi, không giá lẫn diện tích — cùng quy tắc với chi tiết); thẻ voucher hết hạn: ảnh mờ 0.7, "Đã kết thúc" đọc một lần (badge ảnh `aria-hidden`). Giá cho thuê không có số: "Thương lượng" / "Liên hệ".
> - **Theo màn:** S02 lọc Tình trạng · Tỉnh/thành (ô tìm + ô tích, 6 + "Xem thêm") · Chủ đầu tư · Mức giá 0 – 50+ tỷ · Loại hình · Tiện ích nổi bật. S03 dải Vị trí · Tiện ích · Hình ảnh · Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách (một dải, một tab) · Tin liên quan · Hỏi đáp; thông số Giá từ · Quy mô (ha) · Diện tích · Chủ đầu tư · Bàn giao · Loại hình; không nút chia sẻ hero. S04/S05 (cho thuê) tab = danh mục (link route, đếm cấp 1; `?category=` cũ chỉ-có-`category` + slug thật → 308 sang trang danh mục (BL-055), kèm tham số khác vẫn lọc + đánh dấu tab), lọc Tỉnh/thành (radio + số) → Phường · Dự án (dự án có tin còn trống) · Giá thuê 0 – 100+ triệu · Diện tích 0 – 300+ m² · Phòng ngủ · Phòng tắm (BL-104, chip 1 · 2 · 3 · 4+ như Phòng ngủ; tính vào huy hiệu "Bộ lọc" + gợi ý bỏ lọc khi rỗng) · Nội thất · Tiện ích; bỏ hàng chip "Đang lọc"; lỗi truy vấn → khung lỗi + "Thử lại". S07 thông số Giá thuê · Diện tích · Phòng ngủ/tắm · Nội thất · Hướng · Dọn vào từ; dải Vị trí · Tiện ích · Hình ảnh · Điều khoản (đã thuê: accordion đóng) · Pháp lý; bỏ neo `#details`/`#video`; không nút chia sẻ hero. S08 lọc Loại hình · Tỉnh/thành · Mức giá 0 – 50+ tỷ · Diện tích 0 – 500+ m² · Phòng ngủ · Phòng tắm (BL-104, chip như Phòng ngủ) · Hướng · Tình trạng bàn giao; lưới trộn thẻ BĐS + voucher, tin ưu đãi đã kết thúc xếp sau; `/tin-bds?category=<slug>` lọc + tab, noindex, canonical về trang danh mục. S09 Tổng quan (nội dung + lưới thông tin) · Ưu đãi (`OfferBox`, hết hạn không lộ mã — BR-06) | form `source=property_post`; dải Vị trí · Hình ảnh → Tin liên quan; thông số theo loại tin (BĐS: Giá · Diện tích · Phòng ngủ/tắm · Hướng · Mặt tiền · Số tầng; voucher: Hạn ưu đãi · Trạng thái); tóm tắt ở hero và làm đoạn dẫn Tổng quan (BL-056); bỏ neo `#content`; có nút chia sẻ hero.

> **As-built BL-056 (chỉnh khung chi tiết + thẻ nổi bật cho khớp design `detail-du-an` / `list-du-an`; ưu tiên hơn BL-052 khi mâu thuẫn):**
> - **Thanh thông số `DetailSpecBar`:** giá trị dài không xuống 3–4 dòng — < xl `line-clamp-2`, ≥ xl `line-clamp-1` (`…`), `dd[title]` = đủ chữ (rê chuột), chữ đầy đủ vẫn trong DOM; ≥ xl ô hẹp lề trái hơn (icon vẫn tròn 40px).
> - **Tổng quan (`DetailOverviewIntro`, dùng chung Dự án / Cho thuê / Tin BĐS):** đoạn dẫn = tóm tắt (Dự án `summary`, Tin BĐS `excerpt`; Cho thuê không có trường tóm tắt) — không có thì **đoạn văn (paragraph) đầu có chữ** của richText (`lib/content/rich-text-lead`); richText đầy đủ (bỏ đúng block đã dùng làm đoạn dẫn; mọi block hiển thị được còn lại, kể cả ảnh / bảng không chữ, tính là nội dung thêm — `lib/content/rich-text-lead.splitOverview`; chữ trích nối text node bằng "", không chèn khoảng trắng trước dấu câu) nằm trong `<details>` native (chữ luôn có trong HTML) với nút "Xem thêm" / "Thu gọn" (EN "Read more" / "Show less", `detailKit.overview.*`, đổi nhãn bằng `group-open`). Không có nội dung ngoài đoạn dẫn → không có nút; không có gì → không dựng. Tin BĐS: tóm tắt vừa ở hero vừa làm đoạn dẫn (chấp nhận trùng). Bỏ hành vi "có `overview` thì bỏ `summary`".
> - **Bố cục Tổng quan Dự án (as-built BL-071, thay 11fr/9fr + 3 cột của BL-056):** xếp dọc ở mọi bề rộng — `DetailInfoGrid columns={2}` (2 cột từ sm) rộng hết, thẻ Sản phẩm `DetailStatCards` bên dưới rộng hết cột trái (~728px ở ≥ xl). Lưới thẻ: < sm `auto-fill minmax(8.5rem,1fr)` (2 cột ở 375px), ≥ sm `minmax(11rem,1fr)` (~206–235px/thẻ ở 768 / ≥ 1280; tên dài xuống dòng theo từ, `break-words` chỉ là lưới an toàn cuối); số lớn luôn `text-h2`, không thu cỡ. "m²" dùng NBSP (`formatAreaRange`) nên không rơi dòng riêng. Không có sản phẩm → lưới thông tin rộng hết, `columns="auto"`.
> - **Form lead gọn (`LeadForm layout="compact"`):** dùng ở 3 cột liên hệ chi tiết (Dự án / Cho thuê / Tin BĐS); `/lien-he`, `/tin-tuc` giữ `default`. Nhãn `sr-only` (vẫn `htmlFor`), icon trái trong ô (`FormField icon`, `aria-hidden`: User / Phone / EnvelopeSimple / ChatText), placeholder = nhãn (ô bắt buộc thêm " *"), nút full-width mọi khổ "Nhận tư vấn ngay" (`form.lead.submitNow`) + mũi tên. Validate / lỗi dưới ô / consent / Turnstile giữ nguyên.
> - **Chi tiết Dự án — Tiện ích + Vị trí (BL-060):** (1) tiện ích có ≥ 1 mục có ảnh riêng (`amenities[].image`) → khối Tiện ích là slider thẻ (`CardSlider` `arrows="sides"`; thẻ: ảnh 4:3 + `h3` tên + mô tả line-clamp 3; mục không ảnh = ô nền muted + dấu tích); không mục nào có ảnh → như dòng dưới (danh sách + `amenitiesImage`). (2) Vị trí có `locationMedia` (title/image/videoUrl) → thêm thẻ "Kết nối hạ tầng" (video qua `VideoFacade`, ảnh làm poster; chỉ ảnh → ảnh 4:3): ≥ xl lưới 5·4·3 cột (bản đồ·danh sách·thẻ), lg 7/5 + thẻ hàng dưới, < lg xếp dọc; thiếu bản đồ/danh sách → 8/4. Không `locationMedia` → bố cục cũ.
> - **Tiện ích nổi bật không có ảnh (`DetailFeatureList`):** danh sách rộng hết, `sm:2` / `lg:3` cột (đúng 1 mục → 1 cột, không co thành nửa ô); có ảnh giữ ảnh trái + danh sách phải (BL-071 as-built: ảnh luôn 4:3 bất kể số mục, bọc `div` riêng — `ResponsiveImage` có `size-full` nên làm grid item trực tiếp thì kéo cao theo danh sách; ≥ md `div` dính dưới thanh mục con). Nguyên nhân gốc: 1 tiện ích trong lưới `md:grid-cols-2` chỉ chiếm nửa bề rộng.
> - **Thẻ nổi bật danh sách (`ProjectSpotlightContent` / `RentalSpotlightContent` / `PostSpotlightContent`):** nút "Nhận tư vấn" dùng `cn(buttonVariants({ variant: "outline" }))` (viền + chữ `text`) thay `secondary`; variant `secondary` toàn cục không đổi. Nguyên nhân gốc: link gọi `buttonVariants` thẳng (không qua `Button`/`cn`) nên `border-transparent` của lớp nền thắng `border-text`/`border-border` trong CSS → viền vô hình; bọc `cn` để twMerge bỏ `border-transparent` (đo: màu viền rgb(20,20,20) sau fix, rgba(0,0,0,0) trước fix). **BL-057:** `buttonVariants` tự gộp bằng `cn` (bọc `cva`) nên gọi trần cũng không còn `border-transparent` cạnh viền biến thể; `cn(buttonVariants(...), extra)` vẫn cho `extra` ghi đè. Cùng BL-057: node `upload` không có media / không url / không phải ảnh không tính là nội dung thêm của Tổng quan (`lib/content/rich-text-upload.renderableUploadImage`, dùng chung với `RichText`).
>
> **As-built BL-045 (thay đổi toàn site, ưu tiên hơn chi tiết cũ bên dưới khi mâu thuẫn):** S02/S04/S05/S08/S10/S12 dùng hero `PageHero` + thẻ lọc nổi (S02, S04, S05) + hàng "N mục + Sắp xếp" + lưới thẻ + phân trang tròn + dải Điểm mạnh (chỉ S02, cờ `site-settings.showProjectStrengths`) + `ConsultBanner`. `/du-an` thêm `?q=&developer=&sort=` (ô từ khoá `maxLength` 100, sắp theo giá/mới nhất; có tham số lọc → `noindex, follow` + canonical `/du-an`). Thẻ dự án/cho thuê bỏ tim, thẻ dự án bỏ giá. Chi tiết (S03/S07/S09) dùng khung `DetailGalleryHero` (ảnh lớn + bộ đếm + ảnh nhỏ + mũi tên) + khối tiêu đề trắng chứa dải thông số + thẻ mục có eyebrow; S07 bỏ anchor `#description` (neo cũ chỉ về đầu trang); S03 bỏ "Loại hình"/"Giá từ" lặp ở Tổng quan, bỏ mục Thư viện ảnh riêng. S08 `/tin-bds` bỏ dòng "Có N kết quả" (hành vi BL-032 cũ), bài nổi bật chỉ trang 1. S10/S11/S12/S13 canh trái đầu khối (không `text-center`); S12 có dải `careersPerks` (2–6 ý, cấu hình ở site-settings). S14 chi tiết dịch vụ, S15 Liên hệ (`pageBanners.contact`), S16 Pháp lý (`pageBanners.legal`) cùng phong cách hero. Hero 6 trang: vi/en riêng (`pageHeroes`). Seed dev: `pnpm seed:page-heroes`, `pnpm seed:galleries` (task T08).

> Bảng responsive mỗi màn: chỉ ghi mốc **có thay đổi**; mốc không ghi = giữ như mốc nhỏ hơn. Kiểm tra bắt buộc 375 / 768 / 1280.
> "EN" ghi điểm khác riêng của bản tiếng Anh (ngoài §1.1).

### S01. Trang chủ · `/` · `/en` (FR-PUB-01, 17)

> **As-built BL-044 (feature-homepage-redesign T00–T03, mockup `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp`) — GHI ĐÈ bảng/mục bên dưới khi mâu thuẫn.** Bố cục theo ảnh; màu, font Montserrat, token và element giữ nguyên.
> - **Thứ tự mặc định:** Hero + ô tìm kiếm → **Điểm mạnh** (`strengths`, khối mới) → Về TAMI → Dự án nổi bật → Banner tư vấn → Footer (§2.4). Dịch vụ, Ưu đãi, Cho thuê, Tin tức, Đối tác **tắt mặc định** (không nằm trong `blockOrder` mặc định/seed; code và dữ liệu còn nguyên, admin thêm lại vào tab "Thứ tự khối" để bật). Bản ghi có từ trước trên staging/prod KHÔNG tự migrate: admin vào Trang chủ → "Thứ tự khối" xoá 4 khối ngoài mockup, thêm Điểm mạnh lên đầu, rồi nhập 2–6 mục ở tab "Điểm mạnh".
> - **1 Hero:** chữ canh trái (`hero.eyebrow` chung mọi slide, `title` + `titleAccent` dòng 2 màu vàng, `subtitle`, nút); góc dưới trái bộ đếm `01 / 03` + thanh tiến trình (thay chấm; 1 slide ẩn cả hai); mũi tên tròn viền ở hai mép; góc dưới phải `hero.caption` + nút cuộn xuống; nút Dừng/Phát giữ (WCAG 2.2.2). **1b Ô tìm kiếm:** icon kính lúp trong ô, nút "Tìm kiếm →", chip "Dự án được quan tâm" 1 hàng + nút mở thêm, hàng mới "Tùy chọn khác" (Mức giá / Diện tích / Loại căn hộ / Nội thất / Tiện ích) — lọc thật, chuyển `/cho-thue` kèm query của bộ lọc sẵn có.
> - **Điểm mạnh:** dải 2–6 mục, mỗi mục ô tròn 56px `--color-primary-soft` chứa icon Phosphor (`strengths.items[].icon`) + tiêu đề `h3` + mô tả muted; ≥ lg 4 cột, md 2 cột, < md 1 cột. Không có `h2` (vùng `aria-label`).
> - **2 Về TAMI:** `eyebrow` + tiêu đề "Về" + `titleAccent` vàng; ≥ lg cụm ảnh chồng bên trái (ảnh lớn vuông ~66% bề rộng cột, nền khối kem ấm `--color-primary-subtle` (chữ muted/accent-text trên nền này ≥ 4.6:1, bảng tokens §AA), ảnh phụ lệch ra mép trái đè trên **mảng nền be `--color-primary-soft`** (vẫn phân biệt được với nền kem), thẻ chú thích `imageCaption` + mũi tên tròn dưới ảnh phụ), chữ cột 7–12, ảnh toà nhà `decorImage` hé ở mép phải từ xl. *As-built BL-047 (so lại mockup trang chủ):* ≥ lg cụm ảnh 7/12 cột (ảnh lớn 62% ≈ 430px ở 1440, ảnh phụ 36% ≈ 250px, thẻ chú thích 34% ngay dưới ảnh phụ), chữ cột 8–12 tối đa 27rem, tiêu đề `--text-h1`; `decorImage` rộng 10% mép phải, mờ 60% + mask nhạt dần sang trái, **chỉ hiện từ 1400px** (dưới đó 10% mép phải đè lên cột chữ ở 1280–1392px) nên không đè chữ; số liệu dùng icon `medal` / `users-three`. Nút play "Khám phá…" trên dải scrim đáy ảnh lớn mở hộp thoại YouTube-nocookie (`about.videoUrl`; dùng `parseVideoUrl` có sẵn, không có `youtube.ts` riêng; không có link thì ẩn nút). **Thiếu ảnh lớn thì ẩn cả cụm ảnh, gồm nút video** (ảnh lớn là điều kiện của cụm). Số liệu: ô tròn icon + giá trị `--text-h2` (cho phép xuống dòng, ô tròn 48px < sm) + nhãn muted, 2 cột; nút "Tìm hiểu thêm →".
> - **3 Dự án nổi bật:** `eyebrow` + tiêu đề + mô tả; thẻ nền trắng bo 20px: ảnh 11:10 + badge trạng thái + **tim trang trí** (BL-045 #2: ĐÃ BỎ ở mọi màn, kể cả trang chủ — đảo quyết định Q1), thân thẻ: tên (2 dòng cố định), ghim tỉnh, nút mũi tên tròn; thẻ 272px ≥ lg trong khung `max-w-container` — khung 1280 vừa 4 thẻ/hàng (*BL-075 thay "~5 thẻ/khung 1440" tràn viền*; ít thẻ hơn một hàng → căn giữa, không điều khiển — xem S01 khối 3); mũi tên + chấm giữa phía dưới; "Xem tất cả dự án →". Khung cuộn có `pt-1` để vòng focus thẻ không bị cắt. Bỏ khung kính và hàng số liệu cũ.
> - **7 Banner tư vấn:** chữ canh trái trên ảnh nền, **dải thấp** như mockup (~290px ở 1440: `min-h-[18rem]` + `py-10`) và nút chính "Nhận tư vấn" có mũi tên →. `CtaBanner` có prop `align` (`start` ở trang chủ) + `size` (`compact` ở trang chủ); mặc định `center`/`default` (khung cao `clamp(26rem,60svh,40rem)`, nút không mũi tên) cho `/dich-vu/[slug]` và chi tiết dự án — không đổi. Khoảng cách Dự án nổi bật → banner ~65px (`pb-10` của khối dự án).
> - **Đầu khối + nút "xem thêm" (as-built BL-101, QA 28/10 bug 19–21, user chốt 2026-10-29):** mọi khối trang chủ có `h2` trong khung (Dự án nổi bật, Dịch vụ, Ưu đãi, Cho thuê) dùng chung `SectionHeading` — căn giữa: eyebrow (nếu có) → `h2` `--text-h2` → gạch `--color-primary` 48×2px → mô tả (nếu có); nút cuối khối (Dự án, Ưu đãi, Cho thuê, Tin tức) dùng chung `SectionMoreLink` — Button `ghost` + mũi tên → (thay Outline). Ngoại lệ: Về TAMI, Banner tư vấn, Tin tức giữ bố cục split/canh trái riêng (Tin tức chỉ đổi nút).
> - **375/390:** mọi khối 1 cột, giữ phong cách ảnh; không tràn ngang (`scrollWidth` = 390), vùng chạm ≥ 44px. Ảnh/thẻ phụ `absolute` chỉ từ lg.

**Thứ tự khối** theo `homepage.blockOrder` (admin đổi được); mặc định và bố cục:

| # | Khối | Layout family | Nền | Eyebrow |
|---|---|---|---|---|
| 0 | Thanh thông báo (1a) | Dải chữ trong luồng, TRÊN header | `--color-primary` | Không |
| 1 | Hero (+ ô tìm kiếm + chip 1b) | Full-bleed media, chữ giữa; ô tìm kiếm đè đáy hero từ md | Ảnh/video | Không |
| 2 | Về TAMI (`about`) | Split ảnh-chữ 5/7 (ảnh bo 20px) + hàng số liệu | `--color-bg` | Không |
| 3 | Dự án nổi bật | Slider thẻ lớn ~464×600 bo 20px + khung kính | `--color-bg-alt` | Không |
| 4 | Dịch vụ | Bento bất đối xứng, thẻ ảnh bo 20px + khung kính | `--color-bg` | Không |
| 5 | Ưu đãi nổi bật | Slider thẻ | `--color-bg-alt` | Không |
| 6 | Đối tác (FR-PUB-17, Should; BL-107) | Dải logo + tên chạy ngang (≤ 4: hàng tĩnh) | `--color-bg` | Không |
| 7 | Banner CTA (đề xuất §6.1; BL-020 #7 "Đăng ký tham quan") | Khối tối full-width; có ảnh → ảnh tràn viền + scrim, 2 nút | `.theme-dark-block` `--color-dark-deep`; ảnh `ctaBanner.image` + `--color-banner-scrim` | Không |
| 8 | Cho thuê (`rentals`, BL-020 #8) | Tab danh mục + slider thẻ | `--color-bg` | Không |
| 9 | Tin tức (`news`, BL-020 #11) | Split intro trái / 3 thẻ phải | `.theme-dark-block` (nền tối thương hiệu) | Không |
| | Footer | | `--color-dark` | |

**Đối chiếu #1–#11 của market (BL-020):** #1 thanh thông báo = khối 0 · #2 hero = 1 · #3 ô tìm kiếm + chip = 1 (1b) · #4 Giới thiệu = 2 · #5 "Mua từ chủ đầu tư" (slider thẻ) = 5 Ưu đãi · #6 slider dự án = 3 · #7 "Đăng ký tham quan" = 7 Banner CTA · #8 + #10 "Thuê nhà ở / kinh doanh" (gộp) = 8 Cho thuê · #9 "Đồng hành trọn hành trình" = 4 Dịch vụ · #11 Tin tức = 9. **#3 "slider banner ưu đãi": user chốt 2026-10-20 (checkpoint Phase 2) ánh xạ vào slider Ưu đãi (khối 5, tin ưu đãi)** — không dựng slider banner riêng, không thêm schema. Các mục #1–#2, #4–#11 đã có khối tương ứng. Đối tác (6, Should) chưa dựng giao diện (ngoài #1–#11, không đổi schema).

9 section → layout family khác nhau (Cho thuê = tab + slider, Tin tức = split intro/3 thẻ); eyebrow 0/3 (khối Dự án nổi bật đã bỏ eyebrow ở P2-T03; ngân sách 3 vẫn còn nguyên); **2 khối tối nội dung (CTA + Tin tức)** + footer: ngoại lệ tokens §0 (user chốt 2026-10-19: nền "thương hiệu" của BL-020 #11 = khối tối đen/kem + vàng của TAMI). Khi Tin tức đứng ngay trên footer (blockOrder mặc định) có đường viền `--color-dark-border` dưới khối để tách khỏi footer.

**1. Hero** (`homepage.hero.slides`, 1-8)
- Cao `100svh` (tối thiểu 560px, tối đa 1080px), thanh header nổi kính mờ sáng đè lên (hero kéo lên `-mt-(--header-offset)`, nội dung hero đệm trên `--header-offset`).
- Ảnh `object-cover` + scrim (tokens §9); slide có video (đề xuất §6.1) phát `muted loop playsinline` chỉ khi ≥ lg, không reduced-motion, không Save-Data; còn lại hiện ảnh (= poster, cũng là ảnh LCP).
- Chữ căn giữa, `max-width: 22ch` cho tiêu đề: `title` (`--text-display`, ≤ 2 dòng desktop), `subtitle` (`--text-lead`, ≤ 20 từ, `#FFFFFF` opacity 0.85 trên scrim), nút Primary `ctaLabel` → `ctaLink`. Tối đa 3 phần tử chữ.
- Chữ slide hiện dần (trượt 24px + opacity, `--duration-reveal`) khi slide vào; ảnh chuyển crossfade 700ms.
- Điều khiển (≥ 2 slide): chấm phân trang đáy giữa (chấm 8px trong vùng chạm 44px, đang chọn `--color-primary` rộng 24px), nút Dừng/Phát góc dưới phải cạnh chấm. Mũi tên Trước/Sau ≥ lg ở hai mép giữa. Vuốt trên cảm ứng. Autoplay `--slider-interval`, dừng khi hover/focus/tab ẩn/reduced motion.
- Nút cuộn xuống (BL-020, thay quyết định "không scroll cue" cũ): nút tròn 44px chỉ có icon mũi tên (không chữ "Scroll"), có `aria-label`, góc dưới phải, chỉ từ `sm` (mobile đã có ô tìm kiếm ngay dưới hero); bấm cuộn mượt (reduced-motion: nhảy ngay): có ô tìm kiếm thì đưa đỉnh ô đó xuống ngay dưới header (`scroll-mt-(--header-offset)`), không thì tới đáy hero trừ chiều cao header.
- 1 slide: không chấm, không autoplay.
- Khi có ô tìm kiếm (≥ md) đệm dưới 13rem và nhóm điều khiển + nút cuộn nâng lên `bottom-28` để nằm trên ô.

**1a. Thanh thông báo** (`homepage.announcementBar`: `enabled` mặc định tắt, `text`, `link`; CHỈ trang chủ)
- Đứng TRÊN CÙNG trang, phía trên header nổi (mẫu market), là phần tử trong luồng: dải full-width nền `--color-primary`, chữ `--color-primary-foreground` (AA), chữ căn giữa `--text-small`, cao tối thiểu 44px (chữ dài thì xuống dòng, chiều cao do HTML server quyết định nên không CLS lúc tải), nội dung trong container; có `link` thì cả chữ là liên kết (BL-074: không gạch chân — chữ đậm, hover nền `--color-primary-foreground` 10%). Cuộn trang thì thanh trôi đi, header vẫn dính mép trên. Hero chỉ kéo lên theo `--header-offset` (xuống dưới header) nên công thức offset không đổi.
- Render ở khung trang dùng chung (`PublicShell`, dữ liệu từ global `homepage` qua cache tag `global:homepage` sẵn có, lưu homepage làm mới mọi trang đã cache); `HomeAnnouncementBar` chỉ dựng khi đường dẫn là `/` · `/en` (không dùng slot song song: làm mất ISR các route khác). Hiện kể cả khi trang chủ không có slide hero.
- Nút đóng 44×44px (`aria-label` "Đóng thông báo"); vùng là `<section aria-label="Thông báo">`. Đóng → nhớ trong `localStorage` theo hash (chữ + link), khoá RIÊNG theo ngôn ngữ: đổi nội dung thì hiện lại. Khách đã đóng: script inline ngay trong thanh giấu TRƯỚC paint (chưa từng vẽ nên không dịch chuyển layout); chỉ HTML server mang script. Bấm đóng làm nội dung dịch lên (do người dùng chủ động, không tính CLS). `localStorage` bị chặn thì đóng chỉ trong phiên.
- Ẩn khi tắt, chữ trống, hoặc `/en` chưa có chữ EN.

**1b. Ô tìm kiếm + chip dự án** (`homepage.heroSearch`: `enabled`, `placeholder`, `chipProjects` ≤ 6)
- ≥ md: thẻ `--color-surface` bo 20px, đổ bóng, rộng tối đa 56rem, căn giữa, đè đáy hero 96px (phần còn lại nằm dưới hero). < md: thẻ nằm ngay dưới hero (không đè).
- Tablist "Cho thuê" / "Dự án" (nút viên thuốc 44px, đang chọn nền `--color-dark`; mũi tên trái/phải đổi tab). Tab Cho thuê: form GET → `/cho-thue` · `/en/for-rent` với tham số từ khoá **có sẵn** `q` (tối đa 100 ký tự), ô nhập 48px có nhãn ẩn + nút Tìm kiếm; dùng được khi chưa có JS (HTML server dựng sẵn tab Cho thuê). `/du-an` chưa có tham số từ khoá nên tab Dự án là form GET → `/du-an` · `/en/projects` với đúng hai tham số lọc có sẵn của trang đó: `province` (slug tỉnh, danh sách từ `listProvinces` như `/du-an`) và `status` (`upcoming`/`selling`/`handed_over`), ô chọn TAMI dạng progressive (select gốc khi chưa có JS) + nút Tìm kiếm; không thêm tham số mới. Tablist hỗ trợ ←/→/Home/End.
- Chip "Dự án được quan tâm": dự án admin chọn (đã xuất bản, `/en` chỉ bản có EN); không có thì `isFeatured` mới nhất; tối đa 6; link tới chi tiết dự án; viên thuốc cao 44px; mobile vuốt ngang, ≥ md xuống dòng. Không có chip thì bỏ cả hàng. Chữ gợi ý ô nhập: CMS, trống thì chuỗi mặc định theo ngôn ngữ.

**2. Về TAMI** (`about`)
- Ảnh bo `--radius-xl` 20px (market #4).
- < md: tiêu đề → ảnh 4:3 → nội dung (richText, tối đa ~120 từ hiển thị, phần còn lại không cắt: admin chịu trách nhiệm độ dài) → số liệu.
- ≥ md: lưới 12 cột: ảnh cột 1-5 (4:5), chữ cột 7-12.
- Số liệu `stats` (2-4 mục): **một hàng chữ**, không thẻ, không icon: số `--text-h2` `--color-text`, nhãn `--text-small` muted; phân cách bằng khoảng trắng (≥ md: `gap: 48px`; < md: lưới 2 cột). Không có hiệu ứng đếm số.

**3. Dự án nổi bật** (`featuredProjects`, tối đa 6; trống thì lấy `isFeatured` mới nhất) — BL-020
- Heading căn giữa (đầu khối `SectionHeading` dùng chung — BL-101). Slider **trong khung nội dung** (BL-075, thay "tràn viền" của BL-020/BL-044): vùng cuộn (`ul`) nằm trong `max-w-container`, đệm `px-gutter` như tiêu đề khối và các khối khác (Về TAMI, footer); khi tràn (slider), thẻ đầu ở vị trí đầu thẳng mép nội dung khung; cuộn ngang scroll-snap, vuốt/phím mũi tên, **không autoplay**.
- **Ít thẻ (BL-075):** số thẻ vừa hết một hàng ở breakpoint đang xem (không cuộn được — `pageCount ≤ 1`) → hàng thẻ **căn giữa** trong khung, không mũi tên/chấm. Nhiều hơn một hàng → căn trái (thẻ đầu thẳng mép nội dung khung) + slider như cũ (mũi tên ≥ md, chấm, vuốt). Căn giữa bằng `justify-content: safe center` (trình duyệt không hỗ trợ `safe` → căn trái, an toàn; không dùng `center` thường vì khi tràn sẽ cắt thẻ đầu). *Residual (có từ trước, BL-038):* trước khi JS đo, mũi tên/chấm hiện theo số thẻ rồi ẩn sau hydrate khi vừa một hàng. Ở khung 1280 (≥ lg, thẻ 272px, gap 16px) vừa 4 thẻ/hàng (trước đây tràn viền ≈ 5).
- Mỗi slide là **thẻ lớn ~464×600** (`aspect 464/600`, rộng 464px ≥ sm, 82% < sm để lộ thẻ kế), bo `--radius-xl` 20px, ảnh đại diện phủ kín (`object-cover`, lazy, `sizes` 464px/82vw, khung tỉ lệ cố định → không CLS). Cả thẻ là MỘT link tới chi tiết dự án; hover phóng ảnh nhẹ + tên đổi màu `--color-accent-text` (BL-034).
  - Badge trạng thái mở bán góc trên trái ảnh: Đang mở bán = gradient xanh (`success`), Sắp mở bán = gradient vàng (`primary`), Đã bàn giao = trung tính.
  - **Khung kính mờ** `.glass-panel` đè đáy ảnh (cách mép 12/16px, bo 16px, padding 16/20px): tên dự án `--text-h3` (viết thường, tối đa 2 dòng, **luôn giữ chỗ 2 dòng** `min-h-[2lh]` để khung kính mọi thẻ cùng chiều cao, địa điểm + số liệu thẳng hàng — BL-037), địa điểm (tỉnh/thành, icon pin), hàng **số liệu** `<dl>` từ field sẵn có `scale.landAreaM2` (Diện tích đất, m²), `scale.totalUnits` (Tổng số căn), `scale.handoverTime` (Bàn giao). Ô thiếu dữ liệu **ẩn**; không còn ô nào thì không dựng hàng. Không còn eyebrow/summary/nút "Khám phá dự án".
  - Kính theo quy tắc header: nền `--color-surface` đặc mặc định → `--color-glass` + blur chỉ trong `@supports (backdrop-filter)`, đặc lại khi `prefers-reduced-transparency`. **Chỉ `--color-text`** trên kính (4.5:1 dù ảnh sau kính đen/trắng — `contrast.test`); không dùng muted/accent trên kính.
- Điều khiển: mũi tên ≥ md (44px) + chấm phân trang dưới (cơ chế dùng chung `useSnapSlider`). **Chấm = số vị trí cuộn được thật** (các thẻ cuối không cuộn tới mép trái được gộp thành vị trí cuối; ở 1280px 6 dự án → 5 chấm); chấm active = vị trí gần `scrollLeft` nhất (thẻ đầu đang hiện), cuộn hết → chấm cuối; mũi tên đi đúng 1 vị trí, ở cuối/đầu **vòng** về đầu/cuối; chỉ hiện điều khiển khi > 1 vị trí (BL-038).
- "Xem tất cả dự án →" (`SectionMoreLink`: Button `ghost` + mũi tên, BL-101) → `/du-an`. 0 dự án: ẩn khối. 1 dự án: không điều khiển.

**4. Dịch vụ** (`services.items`)
- Heading **căn giữa + gạch vàng 48px** (`SectionHeading`; *BL-101, user chốt 2026-10-29, thay "căn trái" BL-020*) (sentence case `--text-h2`; market #9 "Đồng hành trọn hành trình" do admin đặt trong CMS).
- **Thẻ dịch vụ** (`ServiceCard`, dùng chung với "Dịch vụ khác" ở S11): ảnh bìa phủ kín bo `--radius-xl` 20px, **khung kính `.glass-panel`** (bo 16px, cách mép 12/16px) đè đáy ảnh chứa tên `h3` + mô tả (≤ 2 dòng) + mũi tên, chỉ dùng `--color-text` (4.5:1 dù ảnh sau kính đen/trắng — `contrast.test`; không còn chữ trắng trên gradient vì ảnh sáng không đạt AA). Không ảnh bìa: nền `--color-dark-deep`. Hover phóng ảnh nhẹ.
- Theo số mục: 1 → thẻ ngang full container 21:9; 2 → 2 thẻ 7/5 cột; **3 (mặc định) → bento: thẻ lớn cột 1-7 cao 2 hàng, 2 thẻ nhỏ cột 8-12 xếp chồng**; ≥ 4 → hàng cuộn ngang scroll-snap.
- < md: 3 thẻ xếp dọc, thẻ 4:3, chữ đè đáy ảnh.
- Thẻ link tới `/dich-vu/[slug]`.

**5. Mua từ chủ đầu tư / Ưu đãi nổi bật** (`featuredOffers`; trống thì `isFeatured` còn hạn) — BL-020
- Heading căn giữa + gạch vàng 48px (`SectionHeading`, BL-101). **Slider thẻ** (trong container): cuộn ngang scroll-snap, vuốt/phím mũi tên, không autoplay; thẻ = `PostCard` (bo 20px, ảnh 16:10 lazy, badge ưu đãi, loại, tiêu đề, giá). Rộng 80% < sm · 2 thẻ ≥ sm · 3 thẻ ≥ lg; tối đa 6 thẻ. Nút trước/sau tròn 44px từ md (≥ 2 thẻ), cuộn ~90% bề rộng. Bài hết hạn **không** xuất hiện (BR-06). 0 bài: ẩn khối.
- Nút **Xem thêm →** (`SectionMoreLink`: `ghost` + mũi tên, *BL-101 thay Outline*) dưới slider → `/tin-bds` (theo ngôn ngữ).

**6. Đối tác** (`partners`, `developers.showAsPartner`, sắp `sortOrder` rồi tên, tối đa 24) — **đã dựng (BL-107, user 2026-11-09 thay lưới chỉ logo / "không marquee")**. Code: `home/PartnersMarquee.tsx` + `PartnersMarqueeShell.tsx`, view `lib/home/home-view-partners.ts`.
- Tiêu đề `--text-h2` căn giữa (`partners.title`, trống → "Đối tác" / "Partners"). Mỗi mục: logo khung 96×48 `object-contain` (grayscale + opacity 0.7, hover/focus về màu gốc; logo trang trí, alt rỗng) + tên; thiếu logo → chỉ tên. Có `website` http(s) → link tab mới `rel="noopener noreferrer"`.
- ≥ 5 đối tác: dải chạy ngang (CSS keyframes, thời lượng theo số mục, mép mờ), bản lặp `aria-hidden` + `inert`; hover / focus chuột → dừng; focus bàn phím → về đầu dải + tắt mép mờ; nút Dừng / Phát 44px. ≤ 4 đối tác: hàng tĩnh căn giữa, xuống dòng. `prefers-reduced-motion`: không chạy, xuống dòng, không nút. 0 đối tác: ẩn khối. `/en`: chỉ đối tác có bản EN (BR-07).

**7. Banner CTA** (đề xuất §6.1; BL-020 #7 "Đăng ký tham quan"): `.theme-dark-block`, tiêu đề `h2` (≤ 8 từ), câu phụ ≤ 20 từ, nút Primary **Nhận tư vấn** → `/lien-he` (hoặc `ctaLink`) + nút phụ tuỳ chọn (`secondaryLabel` + `secondaryLink`, biến thể `chip` viên thuốc viền trắng — chỉ hiện khi có CẢ nhãn lẫn link hợp lệ qua `resolveNavLink`). Căn giữa, padding `--space-section`.
- **Có ảnh** (`ctaBanner.image`; chưa đặt thì dùng `backgroundImage` cũ): ảnh tràn viền phủ kín khung cao `clamp(26rem, 60svh, 40rem)` (cố định → không CLS), lazy, `sizes="100vw"`, ảnh trang trí (`alt=""`), phủ scrim `--color-banner-scrim` (đúng token của PageBanner, 0.6) → tiêu đề, câu phụ (`--color-on-dark`, KHÔNG dùng on-dark-muted) và chữ nút phụ trắng đạt 4.5:1 kể cả ảnh trắng tinh (`contrast.test`); khung cao có `min-h-[26rem]` dự phòng cho trình duyệt chưa hiểu `svh`; vòng focus của link trong khối có ảnh dùng `outline-on-dark` (trắng; vòng mặc định của khối tối `--color-on-dark-accent` #E0BF89 chỉ ~2.95:1 trên scrim đè ảnh trắng). Nút chính giữ nền vàng + chữ tối. **Không ảnh:** khối tối đặc như cũ, câu phụ `--color-text-secondary` của khối tối.
- Component dùng chung `layout/CtaBanner` (cũng là CTA của S11 dịch vụ, không ảnh/nút phụ → giữ nguyên).

**8. Cho thuê** (`rentals`: `enabled`, `title`, `categories` ≤ 4 danh mục scope Cho thuê; BL-020 #8 "Thuê nhà ở / kinh doanh")
- Heading `h2` căn giữa + gạch vàng 48px (`SectionHeading`, BL-101) (tiêu đề CMS; để trống thì dùng chữ mặc định theo ngôn ngữ, không ẩn khối); dưới là **tablist** danh mục (viên thuốc cao 44px, đang chọn nền `--color-dark`, chưa chọn có viền `--color-border` + viền đậm khi hover; ←/→ vòng, Home/End, roving tabindex, `aria-selected`/`aria-controls`). Mỗi tab một `tabpanel` chứa **slider** thẻ `RentalCard` dùng chung (cuộn ngang scroll-snap, vuốt/phím mũi tên, không autoplay; 80% < sm · 2 thẻ ≥ sm · 4 thẻ ≥ lg; nút trước/sau ≥ md khi > 1 thẻ — cơ chế `useSnapSlider`/`SliderArrow` dùng chung với Dự án/Ưu đãi). Nút **Xem thêm →** (`SectionMoreLink` `ghost` + mũi tên, *BL-101 thay Outline*) dưới slider → `/cho-thue/danh-muc/<slug>` · `/en/for-rent/category/<slug>` của tab đang xem.
- Dữ liệu: danh mục admin chọn (theo thứ tự admin, ≤ 4; `/en` chỉ danh mục có EN); để trống (hoặc không tab nào có tin) thì lấy các danh mục cho thuê cấp 1 đang có tin (≤ 4, thứ tự như `/cho-thue`). Mỗi tab ≤ 8 tin **còn trống** mới nhất (cùng `SearchService` + luật hiển thị với trang danh mục: `/en` chỉ tin có bản EN). Tab không có tin bị bỏ; 0 tab: ẩn khối. 1 tab: không dựng tablist (panel gắn nhãn bằng tiêu đề khối).
- Server dựng HTML đủ mọi tab (panel không chọn chỉ có `hidden`), không fetch ở client. Chưa có JS: tab đầu hiện sẵn, thẻ + "Xem thêm" là link thật.

**9. Tin tức** (`news`: `enabled`, `title`, `intro`, `posts` ≤ 3; BL-020 #11)
- Tiêu đề CMS, để trống thì dùng chữ mặc định theo ngôn ngữ (không ẩn khối). `.theme-dark-block` (nền tối thương hiệu, token chữ/viền tự đảo), viền dưới `--color-dark-border`. ≥ lg lưới 1fr / 2fr: **trái** = `h2` tiêu đề + đoạn giới thiệu `intro` (`--text-lead`, ≤ 48ch; trống thì bỏ) + nút **Xem tất cả →** (`SectionMoreLink` `ghost` + mũi tên, *BL-101 thay Outline*; heading giữ căn trái, không gạch — bố cục split) → `/tin-tuc` · `/en/news`; **phải** = 3 `NewsCard` (`h3`, 3 cột ≥ sm, 1 cột < sm). < lg: intro rồi thẻ xếp dọc.
- Dữ liệu: bài admin chọn (theo thứ tự, ≤ 3, đã xuất bản, `/en` chỉ bài có EN); để trống (hoặc không bài nào còn công khai) thì 3 bài mới nhất. 0 bài: ẩn khối.

**Khối chỉ hiện khi có trong `blockOrder`:** bản ghi trang chủ có từ trước (staging/prod) chưa có `rentals`/`news` trong "Thứ tự khối" nên chưa hiện cho tới khi admin thêm; admin có mô tả nhắc ở tab Cho thuê / Tin tức / Thứ tự khối. Không tự thêm lúc render.

**States:** dữ liệu từ global, render server; không có loading riêng. Khối lỗi dữ liệu (quan hệ trỏ tới bài đã ẩn) → bỏ qua mục đó, không vỡ khối.

**Responsive tóm tắt:**

| Mốc | Thay đổi |
|---|---|
| 375 | Mọi khối 1 cột; hero chữ `--text-display` 32px, nút full-width tối đa 320px; slider dự án slide 88% + khung chữ dưới ảnh; dịch vụ xếp dọc; ưu đãi 1 cột; đối tác dải chạy (≤ 4: hàng tĩnh xuống dòng) |
| 640 | Ưu đãi 2 cột |
| 768 | Về TAMI split 5/7; dịch vụ 2 thẻ đầu 50/50 + thẻ 3 full; mũi tên slider dự án |
| 1024 | Hero mũi tên; video hero bật (nếu có); slider dự án khung chữ đè ảnh; dịch vụ bento 7/5; ưu đãi 3 cột |
| 1280 | Menu ngang; nội dung đạt container 1280 |
| 1536 | Chỉ nới khoảng trắng; hero vẫn tràn viền, hero tối đa 1080px cao; slider dự án nổi bật trong khung `max-w-container` (BL-075) |

**A11y:** hero carousel theo §1.4; `h1` là `title` của slide đầu (các slide sau dùng `p` có class display để chỉ có 1 `h1`); số liệu dùng `<dl>`.
**EN:** khối thiếu bản EN thì ẩn; thứ tự khối dùng chung.

### S02. Danh sách dự án · `/du-an` · `/en/projects` (FR-PUB-02)

> **As-built BL-052:** xem khối đầu §4 (khung danh sách / chi tiết chung); các mục "as-built" cũ bên dưới chỉ còn là lịch sử khi mâu thuẫn.

- **Bố cục as-built (BL-020 P3-T02):** page banner gọn 240px (§2.7 `compact`) + **băng tìm kiếm gọn** `ListSearchBar` đè mép dưới banner: hai ô chọn **Tỉnh/thành** ("Tất cả tỉnh/thành") và **Trạng thái** ("Mọi trạng thái") + nút "Lọc"; **không có ô từ khoá** (danh sách dự án không hỗ trợ `q`, không thêm tham số) và **không có nút "Bộ lọc"** (không có lọc phụ). Không tự gửi khi đổi ô (WCAG 3.2.2); form GET thật (`<select name>` gốc trước hydrate, `category` giữ bằng input ẩn), có JS thì `router.push` cùng query. Dưới breadcrumb: hàng chip Loại hình → dòng "Có N kết quả" (aria-live) + link "Xoá bộ lọc" khi đang lọc → lưới 1/2/3/4 cột (4 ≥ xl); thẻ `ProjectCard` trắng bo 20px viền nhạt như `RentalCard`. **URL không đổi.**
- Page banner (§2.7) "Dự án / Projects". Breadcrumb.
- Lọc: hàng chip **Loại hình** (danh mục `scope=project`, chip "Tất cả" đầu); hai select **Tỉnh/thành** và **Trạng thái** (Sắp mở bán / Đang mở bán / Đã bàn giao). URL: `?category=&province=&status=&page=`.
- Lưới thẻ Dự án, 12/trang, sắp mới nhất. Thẻ đầu tiên của trang 1 **không** phóng to (giữ lưới đều, đây là danh sách để duyệt).
- Phân trang §3.6.

| Mốc | Thay đổi |
|---|---|
| 375 | Chip cuộn ngang (scroll-snap, có fade mép phải báo còn), hai ô chọn Tỉnh/thành + Trạng thái và nút "Lọc" xếp dọc trong băng đè banner (§2.7 `overlap`); lưới 1 cột |
| 640 | Lưới 2 cột |
| 1024 | Băng tìm kiếm một hàng (2 ô chọn + "Lọc"); lưới 3 cột |
| 1280 | Lưới 4 cột (giữ 4 cột ở 1536, nới gap) |

**States:** đổi chip/trang: giữ lưới cũ, mờ 50% + `aria-busy`, link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route (§3.2); trống khi lọc §3.9 (câu: "Chưa có dự án phù hợp."); EN: chỉ dự án `hasEnglish`.
**A11y:** chip là `button[aria-pressed]` trong `role="group" aria-label="Loại hình"`; kết quả `aria-live`.
**Eyebrow:** 0. **Watermark:** banner chữ (nếu không có ảnh).

### S03. Chi tiết dự án · `/du-an/[slug]` · `/en/projects/[slug]` (FR-PUB-03)

> **As-built BL-052:** xem khối đầu §4 (khung danh sách / chi tiết chung); các mục "as-built" cũ bên dưới chỉ còn là lịch sử khi mâu thuẫn.

**Cấu trúc:**
1. **Hero** full màn hình (`100svh`, tối đa 900px) ảnh đại diện + scrim; đáy bo 32px (BL-020 P4-T01); đáy trái: badge `salesStatus` (gradient xanh / vàng), tên `--text-display` độ đậm 500 (không viết hoa), địa chỉ ngắn (phường, tỉnh). Nút Primary **Nhận tư vấn** (cuộn tới form) + nút Outline sáng **Tải tài liệu** (nếu có `documents`).
2. Breadcrumb.
3. **Thanh mục con dạng viên thuốc dính** (`z: --z-sticky`; `top: var(--sticky-top)` = 8px / ≥ lg 16px sát đỉnh trang vì header ẩn khi cuộn trên trang chi tiết (BL-027); viên thuốc trắng bo tròn + viền + `--shadow-md`, **rộng bằng khung nội dung** (`nav` `mx-auto max-w-container px-gutter` như lưới `DetailLayout`, `ul` `w-full`): mép trái = mép thẻ trắng, mép phải = mép thẻ Tư vấn ≥ lg (< lg = mép thẻ nội dung), nằm trên/ngoài lưới 2 cột, nút căn trái, cao ~54px không đổi (BL-028; trước là `w-fit` ôm vừa nút), mục đang xem nền `--color-primary` chữ `--color-primary-foreground` (~10:1, BL-027), mục thường `--color-text-secondary`, focus-visible outline `--color-focus-ring`; nav trong suốt `pointer-events-none`): Tổng quan · Nổi bật · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Giá · Thư viện · Tin liên quan · Hỏi đáp (BL-020 P5-T02: thứ tự theo trang). Chỉ hiện mục có dữ liệu (cùng điều kiện với khối): "Tin liên quan" khi dự án có tin (mục 10b), "Pháp lý" khi có richText HOẶC tài liệu PDF, "Vị trí" khi có toạ độ/địa chỉ/tiện ích quanh. Mục đang xem tự đánh dấu (IntersectionObserver; dải quan sát từ 88px dưới đỉnh tới 55% viewport, mục đầu theo thứ tự trang thắng; cuộn qua hết mục cuối — dải rỗng và đáy mục cuối ≤ 88px — thì bỏ active, không nút nào `aria-current`; cuộn ngược vào mục thì active lại; ở đầu trang / trên mục đầu giữ mục đầu active; trong ~1s khoá sau khi bấm nút không đổi/bỏ active — BL-029; áp dụng cả S07), bấm cuộn mượt (tắt khi reduced motion), `scroll-margin-top` = `--sticky-top` + 4.5rem (thanh ~54px + khe 18px). < lg: cuộn ngang, mục đang xem tự cuộn vào giữa.
**Bố cục (BL-020 P4-T01, BL-027 — khung chung `DetailLayout`, dùng cả S07):** nền trang `--color-primary-subtle`; từ mục 4 tới 11 nằm trong lưới 2 cột ≥ lg (`minmax(0,1fr)` + 22rem, xl 24rem; khe 8 / xl 10) trong container; **cột chính là MỘT thẻ trắng** `--color-surface` bo 28px (`p-5` / md `p-8` / xl `p-10`) chứa các khối; cột chính KHÔNG còn nền full-bleed xen kẽ — các khối ngăn bằng đường kẻ trên, Thư viện là thẻ tối bo 20px; cột phải = `aside` thẻ **Tư vấn 1:1** (trắng, bo 20px, viền, `--shadow-md`): tiêu đề "Nhận thông tin dự án", hotline (link `tel:`), form lead (`source=project`). Thẻ (tách riêng, ngoài thẻ trắng) `position: sticky`, **không `max-height` / không thanh cuộn riêng** (BL-031): `top = min(--sticky-top + 4.5rem, 100dvh − --detail-aside-h − 1rem)`; `--detail-aside-h` = chiều cao thẻ do `DetailAsideFit` (client, vỏ `aside`, ResizeObserver) ghi lên `aside`. Thẻ vừa viewport → dính dưới thanh mục con (`--sticky-top + 4.5rem`, như BL-027); thẻ cao hơn → cuộn theo trang tới khi đáy thẻ cách đáy viewport 1rem rồi dính (không cắt, checkbox đồng ý + nút gửi tới được; phần đầu thẻ có thể nằm dưới thanh mục con dính). Chưa hydrate / không JS: biến = 0 → dính trên như cũ. Form chỉ có MỘT bản trong DOM: < lg `aside` nằm sau thẻ nội dung (sau Hỏi đáp) và `ProjectStickyCta` dẫn tới `#lead-form`. **As-built BL-061:** các khối từ Vị trí trở đi cũng nằm trong cột trái dạng thẻ trắng (`DetailPageShell bands`), form dính tới hết lưới rồi thôi khi tới "Dự án tương tự"; cột trái là `@container/detail` nên Vị trí / Nổi bật / Pháp lý & chính sách / Hình ảnh đổi cột theo bề rộng cột (không theo viewport).
4. **Tổng quan**: lưới thông số dạng `<dl>` 2 cột (< md) / 4 cột (≥ md): Chủ đầu tư (link), Loại hình, Quy mô (`scale`), Diện tích, Giá từ, Bàn giao. Không kẻ dòng từng hàng. Dưới: `overview` richText `max-width: 68ch`.
4b. **Điểm nổi bật** (BL-020 P5-T02; `section#highlights`, ngay sau Tổng quan): lưới thẻ trắng bo 20px (viền, padding 20px) — 1 cột < sm, 2 cột ≥ sm, 3 cột ≥ xl (trong cột chính); mỗi thẻ icon chung (`CheckCircle`, trường `icon` chưa có bảng ánh xạ nên không đoán icon), tiêu đề `h3`, mô tả (tuỳ chọn, giữ xuống dòng). Tối đa 8 thẻ. Ẩn khi trống.
5. **Vị trí**: split bản đồ 7 cột + địa chỉ 5 cột (≥ xl; < xl bản đồ trên, địa chỉ dưới, vì cột chính ở lg chỉ ~568px). Bản đồ §3.8. **Tiện ích xung quanh** (BL-020 P5-T02; `h3` trong cùng `section#location`, dưới bản đồ + địa chỉ): tab viên thuốc theo nhóm (Giáo dục · Y tế · Mua sắm · Công viên · Giao thông · Khác — chỉ nhóm có dòng; tab chọn nền `--color-dark`, còn lại viền; ≥ 44px); mỗi dòng tên + khoảng cách (chữ, căn phải), lưới 1 cột < sm / 2 cột ≥ sm. Tablist ARIA (←/→ vòng, Home/End, roving tabindex); HTML đầu có đủ panel (panel không chọn `hidden`) nên chưa có JS vẫn đọc được tab đầu; một nhóm duy nhất không dựng tablist. Dòng có toạ độ hiện thành ghim nhỏ (chấm `--color-dark` 14px) + popup tên trên bản đồ dự án, bản đồ tự khung vừa tất cả điểm (zoom tối đa 15); không có toạ độ dự án thì không dựng bản đồ (chỉ danh sách).
6. **Tiện ích**: lưới icon + tên (`amenities`), 2 cột mobile, 3 cột ≥ lg (cột chính hẹp hơn). Không có icon → chỉ tên dạng danh sách 2 cột.
7. **Mặt bằng**: tab theo `floorPlans.title`, ảnh mặt bằng 4:3 nền trắng, bấm mở lightbox. ≥ 6 mặt bằng → select thay tab trên mobile. Dải tab tràn khung → dùng chung `ListingTabsScroller` (BL-096): từ md hai nút ‹ › (44px, nhãn "Mặt bằng trước/sau") ở làn ngoài vùng cuộn + fade mép phía còn nội dung (< md chỉ fade, vuốt); không tràn → không nút/fade; tab chọn bằng bàn phím được đẩy ra ngoài fade.
8. **Pháp lý** (`legalInfo` richText **+ tài liệu PDF `documents`**, BL-020 P5-T02: mục 10 cũ gộp vào đây) và **Chính sách bán hàng** (`salesPolicy`, vẫn là khối riêng cạnh Pháp lý, mục con "Chính sách"): ≥ xl 2 cột cạnh nhau (lg: xếp dọc trong cột chính), < lg accordion (mở sẵn mục đầu). Trong khối Pháp lý: richText rồi `h3` "Tài liệu" + danh sách PDF (mục 10). Khối Pháp lý hiện khi có richText hoặc tài liệu; neo `#documents` (nút hero "Tải tài liệu") nằm trong khối và tự mở accordion trên mobile.
8b. **Bảng giá** (BL-020 P5-T02; `section#pricing`, sau Pháp lý/Chính sách, trước Thư viện): ngày "Cập nhật ngày dd/MM/yyyy" (`priceUpdatedAt`, chữ nhạt) phía trên; bảng trong thẻ trắng bo 20px, vùng cuộn ngang `role=region` có tên + `tabIndex=0` (min-width bảng 40rem nên < lg cuộn trong thẻ, trang không tràn ngang); `caption` ẩn thị giác; cột Loại căn (`th scope=row`) · Diện tích (m², "từ – đến") · Giá (rút gọn như thẻ danh sách: `3 tỷ – 4 tỷ`; chỉ một đầu → "Từ …"/"Đến …"; trống → "Liên hệ" / "Contact us") · Tình trạng (huy hiệu viên thuốc có chữ: Còn hàng `success-subtle`/`success-text`, Sắp hết `warning-subtle`/`warning`, Hết hàng `error-subtle`/`error` — cặp AA; trống → "—" + chữ ẩn "Chưa cập nhật") · Ghi chú. Ẩn khi không có dòng.
8c. **Hỏi đáp** (BL-020 P5-T02; `section#faq`, khối cuối cột chính sau Tin liên quan): accordion `details/summary` gốc (đóng sẵn, mỗi câu mở độc lập, summary ≥ 44px + chevron xoay khi mở, thẻ trắng bo 20px ngăn dòng kẻ); câu trả lời giữ xuống dòng. Kèm JSON-LD `FAQPage` của đúng ngôn ngữ đang xem (cùng tập câu với accordion: chỉ câu có đủ câu hỏi + trả lời ở ngôn ngữ đó; `/en` không rơi về tiếng Việt; không có câu nào → không khối, không mục con, không JSON-LD; escape `<` nên `</script>` trong nội dung không đóng thẻ sớm).
9. **Thư viện** (`.theme-dark-block` `--color-dark`: thẻ tối bo 20px duy nhất của cột chính; padding 24px, xl 40px): bento §3.7 trên nền tối.
10. **Tài liệu** (nằm trong khối Pháp lý từ BL-020 P5-T02, `h3`): danh sách file PDF (tên, dung lượng) với nút **Tải tài liệu** (Dark). Bỏ nếu trống.
10b. **Tin liên quan** (BL-020 P4-T02; `section#related-listings`, trong cột chính sau Thư viện, trước Hỏi đáp): `h2` "Tin liên quan / Related listings"; hai nhóm — **Cho thuê** (≤ 4 tin `published` có `rentals.project` = dự án) và **Tin BĐS** (≤ 4 bài còn hạn có `property-posts.relatedProject` = dự án) — mới nhất trước; nhãn nhóm là chữ đậm (không heading, thẻ là `h3` ngay dưới `h2`); thẻ trắng bo 20px `RentalCard`/`PostCard` dùng chung, lưới 1 cột < sm, 2 cột ≥ sm; ảnh thẻ lazy (LCP vẫn là ảnh hero). Nhóm trống ẩn; cả hai trống → bỏ khối + bỏ mục con. Không có link "Xem thêm" (URL danh sách chưa lọc được theo dự án). Dữ liệu qua `findPublicList` (như khách; `/en` chỉ tin có bản EN); hai truy vấn song song (+2 truy vấn ảnh gộp cho thẻ cho thuê). Trang ISR làm mới khi tin liên quan đổi (hook `revalidate-project-on-listing`, dự án cũ + mới).
11. **Tư vấn 1:1** (`aside`, `aria-labelledby` = tiêu đề thẻ): thẻ trắng bo 20px ở cột phải ≥ lg, < lg nằm sau thẻ nội dung (sau Hỏi đáp); tiêu đề "Nhận thông tin dự án / Get project information" + hotline (link `tel:`) + Lead form Đầy đủ (`source=project`). `scroll-margin-top` = `--sticky-top` + 4.5rem để thanh mục con dính không che tiêu đề khi nhảy tới `#lead-form`. **As-built BL-074:** < lg thanh mục con thôi dính khi hết cột trái nên không bao giờ chạm/đè thẻ này (luôn có khe ≥ 40px); < lg `#lead-form` dùng `scroll-margin-top` = `--sticky-top` + 1rem (thanh đã trôi khỏi màn), ≥ lg giữ + 4.5rem.
12. **Dự án khác**: 3 thẻ Dự án cùng tỉnh hoặc cùng loại hình (lưới 1/2/3 cột).
13. **CTA "Đăng ký tham quan"** (BL-020 P4-T02, cuối trang sau Dự án khác): `CtaBanner` dùng chung (khối tối, không ảnh): `h2` + câu phụ, nút Primary "Đăng ký tham quan" → `#lead-form` (thẻ Tư vấn, không nhân đôi form) + nút phụ chip "Gọi hotline: <số>" (`tel:`, chỉ khi có hotline). Chữ từ i18n (`page.projectDetail.visitCta`), không thêm trường CMS.

| Mốc | Thay đổi |
|---|---|
| 375 | Hero chữ `--text-display` 32px, 2 nút xếp dọc full-width; thanh mục con cuộn ngang; thông số 2 cột; form 1 cột (tiêu đề trên form); Điểm nổi bật 1 cột; tab tiện ích cuộn ngang, danh sách 1 cột; bảng giá cuộn ngang trong thẻ (tên cột Loại căn là cột đầu); FAQ summary full-width; thanh dính đáy "Nhận tư vấn" (cao 64px, `--color-surface`, `--shadow-md`) xuất hiện khi form chưa trong viewport |
| 768 | Thông số 4 cột; thư viện bento; Điểm nổi bật 2 cột; tiện ích quanh 2 cột; bảng giá cuộn ngang trong thẻ (không tràn trang) |
| 1024 | Lưới 2 cột (cột chính + thẻ Tư vấn dính 22rem); Vị trí xếp dọc (split 7/5 từ xl); bỏ thanh dính đáy; Điểm nổi bật 2 cột (3 cột từ xl), bảng giá cuộn ngang khi cột chính < 40rem |
| 1280 | Container 1280 |

**States:** loading: skeleton hero (khối `--color-surface-muted` 100svh) + thanh mục con; dự án `handed_over` vẫn có form với tiêu đề chung (không thêm ý định CTA mới); form §3.3.
**A11y:** `h1` = tên dự án; mỗi section `aria-labelledby`; thanh mục con là `nav[aria-label="Mục lục dự án"]`.
**Eyebrow:** 0 (badge trạng thái không tính). **Watermark:** 0 (hero ảnh đã là điểm nhấn).
**SEO:** JSON-LD `RealEstateListing` + `BreadcrumbList`, `inLanguage`; thêm `FAQPage` khi có câu hỏi (mục 8c).

### S04. Danh sách Cho thuê · `/cho-thue` · `/en/for-rent` (FR-PUB-04) · density 5

> **As-built BL-052:** xem khối đầu §4 (khung danh sách / chi tiết chung); các mục "as-built" cũ bên dưới chỉ còn là lịch sử khi mâu thuẫn.

- Page banner §2.7: biến thể Ảnh nếu có `pageBanners.rentals` / `pageBanners.default` (FR-ADM-20), không thì **Chữ** gọn (padding `--space-section-tight` × 0.6): tiêu đề "Cho thuê / For rent" + dòng mô tả. Breadcrumb.
- **Bố cục (BL-020 P3-T01):** banner compact 240px (§2.7) → băng tìm kiếm đè mép banner (§3.5) → breadcrumb → chip danh mục → hàng "Đang lọc" → hàng "Có N kết quả" + Sắp xếp → lưới thẻ trắng bo 20px (viền `--color-border`).
- Lưới thẻ Tin cho thuê, 12/trang (`limit=12`), phân trang §3.6.
- Chip danh mục nhanh ngay trên lưới (link tới trang danh mục S05, không phải bộ lọc ẩn).
- Chỉ tin `published` (tin `rented` **không** ở danh sách; chỉ còn truy cập bằng URL).

| Mốc | Thay đổi |
|---|---|
| 375 | Băng tìm kiếm xếp dọc (từ khoá, Loại, Giá, "Bộ lọc" + "Tìm kiếm"), Sheet lọc phụ từ dưới; lưới 1 cột; thẻ ảnh 4:3 |
| 640 | Lưới 2 cột |
| 1024 | Băng tìm kiếm một hàng, lọc phụ trong Popover; lưới 3 cột |
| 1280 | **Lưới 4 cột** (thẻ ~290px) |
| 1536 | Lưới 4 cột (container vẫn 1280, như 1280) |

**States:**
- Đổi bộ lọc/trang/chip: giữ kết quả cũ, mờ 50% + `aria-busy="true"` tới khi có kết quả (không nhảy layout), link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route (`loading.tsx` gây soft-404, §3.2).
- Trống khi lọc: §3.9 kèm danh sách 3 thao tác gợi ý theo bộ lọc đang có (vd bỏ "Phòng ngủ: 3", bỏ khoảng giá).
- Lỗi API: §3.9 lỗi tải phần.
- `q` có trong URL (từ tìm kiếm header): tiêu đề kết quả "Kết quả cho “studio quận 1” / Results for “studio quan 1”".
**A11y:** Sheet lọc là dialog; giá dùng 2 ô số có label "Giá từ / Price from", "đến / to" (không slider kéo thả, dễ dùng bàn phím hơn); kết quả `aria-live`.
**Eyebrow:** 0. **SEO:** trang có tham số lọc ngoài `page` → `noindex, follow`; canonical về trang không tham số (hoặc trang danh mục/khu vực tương ứng).

### S05. Trang danh mục (template dùng chung) ★ mới

Routes:
- Cho thuê: `/cho-thue/danh-muc/[category]` · `/en/for-rent/category/[category]`
- Đăng tin BĐS: `/tin-bds/danh-muc/[category]` · `/en/property-news/category/[category]`
- Tin tức: `/tin-tuc/danh-muc/[category]` · `/en/news/category/[category]`
- Dự án (BL-090): `/du-an/danh-muc/[category]` · `/en/projects/category/[category]`

Bố cục = màn danh sách cha tương ứng (S02, S04, S08, S10) với khác biệt:
- Page banner: tiêu đề = `categories.name`, mô tả = `categories.description` (≤ 60ch, nếu có). Ảnh banner theo `pageBanners` của loại nội dung.
- Breadcrumb: Trang chủ › <Loại> › <Danh mục cha nếu có> › <Danh mục>.
- Danh mục có con: hàng chip danh mục con (chip "Tất cả" = chính danh mục cha, gồm cả bài của con) dưới banner.
- Cho thuê: bộ lọc §3.5 với **Danh mục đã khoá** (hiện như chip cố định, bỏ khỏi Sheet); đổi danh mục = chuyển sang trang danh mục khác.
- Tab danh mục ở S08/S10 là **link** tới trang này (không lọc client), tab hiện tại `aria-current="page"`.
- SEO: trang indexable, canonical chính nó, title/meta từ `categories.seo`. EN: danh mục không `hasEnglish` → 404 EN; slug danh mục theo locale.
- Trống: "Chưa có bài viết trong mục này." + link về danh sách cha.
- **Dự án (BL-090):** khung `/du-an` (BL-052) với danh mục khoá (gồm dự án của danh mục con): hero `h1` = tên danh mục, eyebrow "Dự án" / "Projects", mô tả = `categories.description` (nếu có), ảnh hero của `/du-an`; breadcrumb Trang chủ › Dự án › <Danh mục cha nếu có> › <Danh mục>; `<title>` "<Tên danh mục> – Dự án | <tên site>". Tab danh mục cấp 1 (cả ở `/du-an`) là link: "Tất cả" → `/du-an`, danh mục → trang này (giữ bộ lọc khác, về trang 1), tab đang xem `aria-current="page"` (danh mục con → đánh dấu tab cha). Cột lọc như S02 (không có ô danh mục); bộ lọc / sắp xếp / phân trang / ô tìm `q` ở lại trang danh mục. Link cũ `/du-an?category=<slug có thật>` → 308 sang trang này, giữ các tham số khác; slug lạ → bỏ. Không có dự án: trạng thái trống như S02 + link về `/du-an`. *As-built (BL-090 T01):* không có hàng chip danh mục con (như Cho thuê) — danh mục cấp 2 đánh dấu tab cha; hero không dùng mô tả hero chung khi danh mục không có mô tả (meta description thì rơi về mô tả `/du-an`); trống = "Chưa có dự án trong mục này." + nút "Về danh sách".

Responsive: theo màn cha.

### S06. Trang đích khu vực Cho thuê · `/cho-thue/khu-vuc/[province]` · `/en/for-rent/area/[province]` (FR-PUB-16, Should) ★ mới

- Mục đích: SEO theo khu vực ("cho thuê căn hộ Hà Nội") + điểm vào nhanh.
- Bố cục:
  1. Page banner Chữ: tiêu đề "Cho thuê tại <Tỉnh>" / "For rent in <Province>" (tên tỉnh giữ tiếng Việt); dòng mô tả sinh từ template i18n: "<n> tin cho thuê đang hiển thị tại <Tỉnh>." / "<n> rental listings in <Province>." Nếu có đề xuất `provinces.intro` (§6.3) thì hiện đoạn giới thiệu ≤ 60 từ.
  2. Breadcrumb: Trang chủ › Cho thuê › <Tỉnh>.
  3. **Phường nổi bật**: chip các phường có tin (tối đa 12, sắp theo số tin, kèm số "(<n>)"); bấm = lọc `ward` trên chính trang này (URL `?ward=`), có "Xem tất cả phường" mở danh sách đầy đủ trong Sheet/popover.
  4. **Danh mục tại khu vực**: chip danh mục có tin trong tỉnh kèm số; bấm = `?category=`.
  5. Bộ lọc §3.5 với **Tỉnh đã khoá** + lưới thẻ + phân trang (như S04).
  6. Khối liên kết "Khu vực khác / Other areas": danh sách link chữ tới các tỉnh có tin (lưới 2/3/4 cột), không thẻ ảnh.
- Tỉnh không tồn tại → 404. Tỉnh hợp lệ nhưng 0 tin → trang vẫn trả 200 với trạng thái trống ("Hiện chưa có tin cho thuê tại <Tỉnh>.") + khối "Khu vực khác" + `noindex` (tránh trang mỏng).
- Trang có tham số (`?ward=`, `?category=`…) → `noindex, follow`, canonical về `/cho-thue/khu-vuc/[province]`.
- Sitemap: chỉ tỉnh có ≥ 1 tin, cả VI và EN.

| Mốc | Thay đổi |
|---|---|
| 375 | Chip phường/danh mục cuộn ngang 1 hàng mỗi loại; lưới 1 cột; "Khu vực khác" 2 cột |
| 640 | Lưới 2 cột; "Khu vực khác" 3 cột |
| 1024 | Chip xuống dòng tối đa 2 hàng (phần còn lại vào "Xem tất cả phường"); lưới 3 cột; "Khu vực khác" 4 cột |

**A11y:** chip có số đọc được ("Bến Thành, 12 tin"); **Eyebrow:** 0.

### S07. Chi tiết tin cho thuê · `/cho-thue/[slug]` · `/en/for-rent/[slug]` (FR-PUB-05)

> **As-built BL-052:** xem khối đầu §4 (khung danh sách / chi tiết chung); các mục "as-built" cũ bên dưới chỉ còn là lịch sử khi mâu thuẫn.

**Cấu trúc:**
1. Breadcrumb (Trang chủ › Cho thuê › <Danh mục> › <Mã tin>).
2. Thư viện ảnh §3.7 (bento ≥ md, carousel < md) — ảnh LCP, giữ đầu trang (không là mục con). Video là khối riêng `#video` trong thẻ nội dung (facade).
3. **Khung chi tiết chung (BL-027, như S03):** nền `--color-primary-subtle`; thanh mục con viên thuốc dính 8/16px (**Tổng quan `#overview` · Điều khoản `#terms` · Mô tả `#description` · Video `#video` · Vị trí `#location` · Pháp lý `#legal`** — mục chỉ hiện khi khối có dữ liệu; `nav[aria-label="Mục lục tin cho thuê"]`); header ẩn khi cuộn (§2.1). Lưới ≥ lg `minmax(0,1fr)` + 22rem (xl 24rem): nội dung trong một thẻ trắng bo 28px theo thứ tự Tổng quan (h1 + mã tin/ngày đăng + địa chỉ + Thông số chính + Chi tiết; nhãn khối = h1) → Điều khoản → Mô tả → Video → Vị trí → Pháp lý (tiêu đề `--text-h2`); thẻ liên hệ dính như S03 (không thanh cuộn riêng, `top = min(--sticky-top + 4.5rem, 100dvh − --detail-aside-h − 1rem)`, BL-031). Khối liền trước thanh mục con (thư viện ảnh; tin đã thuê có tin tương tự: khối tin tương tự) có `pb-8` (32px) — thanh mục con không dính sát ảnh (BL-031; breadcrumb giữ nguyên vị trí): **As-built BL-061 (chi tiết Cho thuê, khung `DetailPageShell`):** Vị trí · Tiện ích · Hình ảnh · Điều khoản · Pháp lý là thẻ trắng trong cột trái dưới Tổng quan, thẻ liên hệ dính tới "Căn tương tự".
   - **Nội dung:** tiêu đề cỡ `--text-h2`, chữ thường (§1.7) · mã tin + ngày đăng `--text-xsmall` · địa chỉ (đường + phường + tỉnh; số nhà chỉ khi `showExactAddress`) · **Thông số chính** 4 ô lớn (Giá/tháng, Diện tích, Phòng ngủ, WC) dạng hàng chữ, không thẻ · **Chi tiết** `<dl>` 2 cột: Tầng, Hướng nhà, Hướng ban công, Nội thất, Danh mục, Dự án (link) · **Điều khoản thuê** `<dl>`: Thời hạn tối thiểu, Đặt cọc, Kỳ thanh toán, Ngày trống, Dịch vụ bao gồm (chip trung tính) · **Mô tả** richText · **Vị trí** bản đồ §3.8 · **Pháp lý** (`legalNote`) nếu có.
   - **Thẻ liên hệ** (thẻ trắng bo 20px, viền, `--shadow-md` — cùng kiểu thẻ Tư vấn S03, BL-027; `aside[aria-labelledby]`): giá `--text-price` + "/tháng" · Sale phụ trách (avatar tròn 48px, `fullName`, `phone` → nút **Gọi hotline** `tel:`; sale bị khoá → thay bằng hotline chung, không hiện tên) · Lead form Rút gọn (`source=rental`).
4. **Tin tương tự** (`--color-bg-alt`): 4 thẻ cùng danh mục + cùng tỉnh, giá ±30% (lưới 1/2/4 cột, < sm carousel).

**Trạng thái "Đã thuê"** (`status = rented`, BR-01, Spec § Quy tắc biên) ★
- Trang vẫn mở (200), URL giữ nguyên, **không** vào sitemap; đề xuất `noindex, follow` để không cạnh tranh với tin còn trống (cần confirm §9 mục 5).
- Băng thông báo ngay dưới breadcrumb: nền `--color-dark`, chữ trắng, icon `Info`: "Căn này đã được cho thuê. Xem các căn tương tự bên dưới hoặc để lại thông tin để TAMI tư vấn." / "This unit has been rented. See similar units below or leave your details for advice."
- Badge "Đã thuê / Rented" (Dark) góc trên trái ảnh đầu; ảnh thư viện giữ màu (không làm xám, tránh cảm giác lỗi).
- Giá: vẫn hiện nhưng chữ `--color-text-muted` + nhãn "Giá tham khảo / Reference price".
- Khung phải: tiêu đề form đổi thành **"Nhận tư vấn căn tương tự" / "Find similar units"**, nút gửi cùng nhãn đó; lead vẫn `source=rental`, `sourceId` = tin này (Spec). Ẩn nút Gọi sale? **Giữ** (sale vẫn là người phụ trách khu vực).
- **Tin tương tự** chuyển lên **ngay sau thư viện ảnh** (trước thanh mục con và nội dung), tiêu đề "Căn tương tự đang trống / Similar available units", 4-8 tin.
- Mô tả và thông số vẫn hiện (khách tham khảo), thu gọn `Điều khoản thuê` thành accordion đóng.

| Mốc | Thay đổi |
|---|---|
| 375 | Thư viện carousel 4:3 + đếm ảnh; 1 cột; thẻ liên hệ (giá + form) nằm **sau thẻ nội dung** (BL-027, user 2026-10-20; giá vẫn ở Thông số chính đầu thẻ); thanh dính đáy: giá (trái) + nút **Nhận tư vấn** (phải, cuộn tới form) + icon gọi; ẩn thanh khi form trong viewport |
| 768 | Thư viện bento; thông số chính 4 ô 1 hàng; `<dl>` 2 cột |
| 1024 | 2 cột `minmax(0,1fr)` + 22rem, thẻ liên hệ dính; bỏ thanh đáy |
| 1280 | Container 1280; tin tương tự 4 cột |

**States:** loading skeleton thư viện + 2 cột; form §3.3; ảnh lỗi tải → nền `--color-surface-muted` + icon `ImageBroken`; tin `hidden`/`draft` → 404.
**A11y:** `h1` = tiêu đề tin; thông số dạng `<dl>`; khung dính không che focus (khi focus vào phần tử bị khung dính che, `scroll-padding`).
**Eyebrow:** 0. **SEO:** JSON-LD `RealEstateListing` (offers, price VND/tháng).

### S08. Danh sách Đăng tin BĐS · `/tin-bds` · `/en/property-news` (FR-PUB-06)

> **As-built BL-052:** xem khối đầu §4 (khung danh sách / chi tiết chung); các mục "as-built" cũ bên dưới chỉ còn là lịch sử khi mâu thuẫn.

- **Bố cục as-built (BL-020 P3-T02):** banner gọn 240px; **chưa có băng tìm kiếm** (trang hiện không có từ khoá/lọc/sắp xếp — không thêm); dòng "Có N kết quả" (aria-live, gồm cả bài nổi bật) trên bài nổi bật; lưới 1/2/3/4 cột (4 ≥ xl); thẻ `PostCard` trắng bo 20px viền nhạt, tiêu đề thẻ nổi bật `font-display font-medium lg:text-h2-sm` (Montserrat nạp 400/500/600). Áp cho cả trang danh mục `/tin-bds/danh-muc/[category]`.
- **BL-032 (thay mục bài nổi bật bên dưới):** đồng bộ `/du-an` + `/cho-thue` — bài nổi bật là **thẻ đầu lưới** (ảnh `priority`), không còn thẻ ngang 7/5; hàng "Có N kết quả" + lưới trong `section[aria-label]`; `PostCard` ảnh 4:3, tiêu đề `font-display text-h4` `line-clamp-2`, thân `gap-1` như RentalCard/ProjectCard; trống: tiêu đề riêng ("Chưa có tin đăng." / "Chưa có tin đăng trong mục này." + về `/tin-bds`).
- Page banner + breadcrumb. Tab danh mục (link tới S05): "Tất cả" · Tin BĐS · Voucher / Ưu đãi · … (tab cuộn ngang < md).
- Trang 1, tab Tất cả: **bài nổi bật** đầu tiên (`isFeatured` mới nhất còn hạn) thẻ ngang lớn: ảnh 16:10 7 cột + chữ 5 cột (tiêu đề `--text-h2`, excerpt 3 dòng, hạn ưu đãi) (≥ lg); dưới là lưới thẻ Tin/ưu đãi.
- Thẻ có `offer.endAt`: còn ≤ 3 ngày → badge "Còn <n> ngày / <n> days left" (warning); đã qua → badge "Đã kết thúc / Ended" + ảnh `opacity 0.7`, **vẫn** hiện trong danh sách (BR-06 chỉ rút khỏi khối trang chủ) nhưng xếp sau bài còn hạn.
- 12 bài/trang, phân trang.

| Mốc | Thay đổi |
|---|---|
| 375 | Tab cuộn ngang; bài nổi bật = thẻ dọc thường lớn hơn (ảnh 16:10, tiêu đề `--text-h3`); lưới 1 cột |
| 640 | Lưới 2 cột |
| 1024 | Bài nổi bật split 7/5; lưới 3 cột |
| 1280 | Lưới 4 cột |

**States:** đổi chip/trang như S04 (giữ kết quả cũ mờ 50% + `aria-busy`; không skeleton cấp route); trống §3.9; EN theo `hasEnglish`. **Eyebrow:** 0 (nhãn danh mục trên thẻ là metadata).

### S09. Chi tiết bài Đăng tin BĐS · `/tin-bds/[slug]` · `/en/property-news/[slug]` (FR-PUB-07)

> **As-built BL-052:** xem khối đầu §4 (khung danh sách / chi tiết chung); các mục "as-built" cũ bên dưới chỉ còn là lịch sử khi mâu thuẫn.

> **As-built BL-032 (thay các bước 1–7 về bố cục; nội dung từng khối giữ nguyên):** khung chi tiết chung S03/S07 (`DetailLayout`, nền `--color-primary-subtle`): breadcrumb → ảnh bìa 16:9 trong `max-w-container px-gutter`, bo 20px, `priority`, `pb-8` → thanh mục con Tổng quan · Ưu đãi · Nội dung · Hình ảnh (mục rỗng ẩn; id `overview` / `offer` / `content` / `gallery`) → MỘT thẻ trắng bo 28px: Tổng quan (danh mục, h1 `font-display text-h2`, ngày, `PostShare` < sm 1 nút / ≥ sm hàng ngang — **không còn rail ≥ xl**) · Khối ưu đãi · Nội dung richText 68ch · Thư viện; cột phải ≥ lg thẻ liên hệ `DETAIL_ASIDE_CARD_CLASS` (nút gọi hotline + `LeadFormSlot`/`LeadForm source=property_post`, tiêu đề "Nhận tư vấn"), < lg sau thẻ nội dung + `ProjectStickyCta` "Nhận tư vấn"; Tin liên quan ngoài thẻ nền `bg-bg-alt`. Header ẩn khi cuộn (`data-detail-page`). **As-built BL-061 (chi tiết Tin BĐS):** Vị trí · Hình ảnh là thẻ trắng trong cột trái dưới Tổng quan; thẻ liên hệ dính tới "Tin liên quan".

1. Breadcrumb.
2. Đầu bài (container text 768px, căn trái): danh mục (link), tiêu đề cỡ `--text-h1`, chữ thường (§1.7), ngày đăng, nút chia sẻ (Facebook, Zalo, sao chép link). Chỉ một cụm chia sẻ trong bài (không lặp ở cuối bài); < sm: 1 nút "Chia sẻ / Share" gọi `navigator.share` (tiêu đề + URL canonical), trình duyệt không hỗ trợ hoặc lỗi khác huỷ → mở menu (Facebook, Zalo, sao chép link; `aria-expanded`, Esc/bấm ra ngoài đóng); sm–xl: hàng ngang ngay dưới ngày đăng; ≥ xl: cụm dọc chỉ icon (có `aria-label`) dính (`sticky`) ở lề trái cột chữ suốt phần đầu bài → hết nội dung/thư viện ảnh (không đè form lead, bài liên quan).
3. Ảnh bìa `cover` 16:9, rộng 1024px (≥ lg tràn ra khỏi cột chữ), `priority`.
4. **Khối ưu đãi** (nếu có `offer` / giá / khu vực / liên quan), đặt **trước** nội dung, nền `--color-primary-subtle`, viền 1px `--color-primary`:
   - Giá (`priceVnd` hoặc `priceNote`), khu vực, thời hạn "Từ <startAt> đến <endAt>", trạng thái (badge).
   - Mã voucher: chữ `--text-h3` `tabular-nums` letter-spacing 0.1em trong ô viền nét đứt + nút "Sao chép / Copy" (toast "Đã sao chép mã" / "Code copied"). Hết hạn: mã gạch ngang + "Ưu đãi đã kết thúc / This offer has ended", ẩn nút sao chép.
   - Điều khoản (`offer.terms`) accordion đóng.
   - Liên kết dự án / tin cho thuê liên quan: thẻ nhỏ ngang (ảnh 1:1 80px + tên).
5. Nội dung richText (`max-width: 68ch`), thư viện ảnh (`gallery`) dạng lưới 2/3 cột + lightbox.
6. **Form** Đầy đủ (`source=property_post`) trên nền `--color-primary-subtle`. Bài hết hạn: form vẫn nhận; tiêu đề form "Nhận tư vấn / Get advice" cho mọi trạng thái (không thêm ý định CTA mới).
7. Bài liên quan: 3 thẻ cùng danh mục.

| Mốc | Thay đổi |
|---|---|
| 375 | Ảnh bìa tràn viền (bỏ gutter); khối ưu đãi full-width; nút chia sẻ thành 1 nút "Chia sẻ / Share" dùng Web Share API (fallback menu) — áp dụng < 640 (`sm`) |
| 640 | Nút chia sẻ hàng ngang (Facebook, Zalo, sao chép link) ở đầu bài |
| 1024 | Ảnh bìa rộng 1024 vượt cột chữ; nút chia sẻ dính cột trái (≥ xl) |

**States:** form §3.3; ưu đãi sắp hết hạn → badge warning. **SEO:** JSON-LD `Article`. **Eyebrow:** 0.

### S10. Tin tức · `/tin-tuc` · `/en/news` (FR-PUB-08)

**As-built BL-054 P2-T01 (design `docs/specs/listing-detail-redesign/tin-tuc.webp`; thay các mục as-built cũ bên dưới khi mâu thuẫn):**
- **Hero danh sách** `ListingHero` (BL-052, `PageHero size="list"`): ảnh + chữ `pageHeroes.news` (trang danh mục: eyebrow "Tin tức", tên + mô tả danh mục), breadcrumb kính, ô tìm `q` (placeholder "Tìm bài viết…" / "Search articles…", form GET chạy không JS, giữ `tag` / `sort` bằng input ẩn). Không hàng "Tìm nhanh".
- **Chip danh mục** dưới hero (`CategoryChipList`, viên thuốc link, `aria-current="page"`, < sm cuộn ngang) trên đường kẻ `--color-border`; quy tắc chip như BL-045 (`/tin-tuc`: Tất cả + cấp 1; danh mục có con: Tất cả + con).
- **Khối nổi bật** (trang 1, không lọc; cả trang danh mục, phạm vi danh mục + con): ≥ lg lưới `1.75fr / 1fr`. Trái: bài lớn ảnh phủ (LCP `priority`) + scrim `dark-deep` đậm dần xuống đáy, cao tối thiểu 420px (≥ lg 480px), badge danh mục vàng đặc (`primary` + `badge-foreground`), `h2` `--text-h2` display, tóm tắt 2 dòng, hàng "logo tròn + TAMI HOMES (i18n, không tên `staff`) · ngày · ⏱ N phút đọc", nút mũi tên tròn vàng 48px (trang trí). Phải: thẻ trắng 3 bài nhỏ (ảnh 4:3 128px, danh mục chữ hoa `accent-text`, `h2` 3 dòng, ngày, `CardArrow`). Chọn: `isFeatured` mới nhất rồi mới nhất; 4 bài bị loại khỏi lưới ở mọi trang (không lọc).
- **As-built BL-062 (P1-T01):** cột phải đổi thứ tự bản tin → "Được quan tâm nhiều" → "Chủ đề"; nhãn thẻ nổi bật lớn "TAMI REAL ESTATE" (vi + en).
- **Hai cột ≥ lg** (`1fr / 18rem`, ≥ xl `1fr / 21rem`; < lg cột phụ xuống dưới lưới): trái `h2` "Bài viết mới nhất" + ô "Sắp xếp theo" (`OptionSelect variant="chip" progressive`: Mới nhất / Cũ nhất; không JS = `<select>` + nút "Áp dụng" trong `<noscript>`) → lưới `NewsCard variant="grid"` 1 / 2 (md) / 3 (lg) cột: thẻ trắng bo 20px, ảnh 16:10, badge danh mục (`primary-soft` + `badge-foreground` 9.7:1) + ngày, tiêu đề `h3` 2 dòng, tóm tắt 3 dòng, "⏱ N phút đọc" + mũi tên tròn → phân trang số. Phải (thứ tự BL-062, cũng là thứ tự < lg): "Bản tin thị trường" (`NewsletterSignup` P1-T04), "Được quan tâm nhiều" (EN "Most popular"; thẻ trắng, `<ol>` 5 hàng: số 01–05 display `accent-text` trang trí, ảnh vuông 56px, tiêu đề 2 dòng, ngày), "Chủ đề" (chip `#tag` viền `border`, link `/tin-tuc?tag=`, thẻ đang lọc `primary-soft` + `aria-current`; `/en` ẩn). Khối rỗng / lỗi DB → ẩn.
- **Có lọc** (`q` / `tag` / `sort=oldest`): ẩn khối nổi bật, hàng đầu lưới là `ResultsBar` "**N bài viết** phù hợp" + sắp xếp, thẻ thành `h2`; không khớp → `EmptyState filtered` ("Chưa có bài viết phù hợp." + "Xoá bộ lọc" về trang sạch). Metadata `noindex, follow` + canonical sạch.
- Sau đó: form "Tư vấn nhu cầu" (chỉ `/tin-tuc`, như cũ) → `ConsultBanner`. Ảnh chụp: `.context/review-reports/assets/bl054-p2t01-*.png`.

**As-built (BL-020 P3-T03, market.vinhomes.vn):**
- Banner gọn 240px (`compactBanner`, không băng đè → không đệm đáy) + breadcrumb + **tab danh mục** = hàng viên thuốc là link (`/tin-tuc` = Tất cả, `/tin-tuc/danh-muc/<slug>`), mục hiện tại `aria-current="page"`, cuộn ngang ở < sm (không phải ARIA tabs).
- **Trang 1**: "Tin nổi bật" (h2) = 1 bài lớn (ảnh 16:10, cột 1-7 ≥ lg) + list ≤ 4 bài dạng hàng (ảnh 4:3, cột 8-12); bài `isFeatured` trước rồi mới nhất, không trùng. Tiếp theo **mỗi danh mục cấp 1 một hàng** (h2 tên + "Xem thêm" → trang danh mục, ≤ 4 thẻ 1/2/4 cột; tối đa 6 hàng theo thứ tự CMS; danh mục không có bài công khai ở ngôn ngữ đang xem thì không có hàng; bài của danh mục con tính vào hàng của cha; không loại trùng với "Tin nổi bật"). Cuối cùng **"Tin khác"** (h2, lưới 1/2/3/4 cột, thẻ h3) = 4 bài mới nhất không thuộc "Tin nổi bật"/hàng danh mục (lưới các trang bỏ chúng) + lưới phân trang của trang 1 (12 bài), loại bài đã hiện ở "Tin nổi bật", để mọi bài còn truy cập được ở trang 1 hoặc 2+; nằm trước phân trang. Thẻ là h3 dưới h2 khối. Số truy vấn trang 1 cố định (≤ 12).
- **Trang 2+** (`?page=n`): lưới thẻ 1/2/3/4 cột (4 ≥ xl) + phân trang như trước (12 bài/trang, bỏ 4 bài mới nhất ở mọi trang); canonical, `rel` prev/next, noindex không đổi. Trang 1 vẫn hiện phân trang (link tới trang 2).
- Cuối **mọi trang `/tin-tuc`** (không có ở trang danh mục): section nền sáng `--color-bg-alt`, thẻ trắng bo `--radius-xl` (20px) viền nhạt rộng tối đa 42rem (as-built BL-098: thẻ canh giữa khung nội dung, `mx-auto`) chứa `LeadFormSlot` "Tư vấn nhu cầu" / "Get a consultation" + `LeadForm` (`source=contact`, Turnstile + consent + honeypot/UTM như trang Liên hệ). Một form mỗi trang.
- Trang danh mục (S05 của Tin tức): banner gọn + lưới 4 cột, không form.
- (Bản trước BL-020: 1 bài lớn + 3 bài hàng + lưới 3 cột; "Không có form, không CTA lead" — nay thay bằng form tư vấn trang `/tin-tuc`; BRD: lead Tin tức đi nguồn `contact`.)
- 12 bài/trang (không tính khối nổi bật).

| Mốc | Thay đổi |
|---|---|
| 375 | Tab cuộn ngang; bài lớn thẻ dọc; list bài hàng (ảnh 96px); hàng danh mục 1 cột; form full-width |
| 640 | Hàng danh mục + lưới 2 cột |
| 1024 | Nổi bật 7/5; hàng danh mục 4 cột; lưới trang 2+ 3 cột |
| 1280 | Lưới trang 2+ 4 cột |

**States:** đổi chip/trang như S04 (giữ kết quả cũ mờ 50% + `aria-busy`; không skeleton cấp route); trống; EN. **Eyebrow:** 0.

### S11. Chi tiết tin tức · `/tin-tuc/[slug]` · `/en/news/[slug]` (FR-PUB-08)

> **As-built BL-067 (mục lục cột trái gọn hơn, chỉ ≥ lg; ưu tiên hơn số đo BL-062 bên dưới):** cột trái lưới thân bài `16rem`, ≥ xl `18rem` (trước 15rem); mục `min-h-8` 32px (`py-1.5`, `leading-snug`), số tròn `size-6` 24px, `gap-2.5`, cấp 3 thụt thẳng mép chữ cấp 2; khối dính cao tối đa `max(26rem, 100dvh − --detail-aside-top − 1rem)`, khung mục lục chiếm hết phần cao còn lại (co theo viewport, chỉ cuộn riêng khi bài quá dài, tự cuộn mục active vào giữa), thẻ "Tư vấn miễn phí" `shrink-0` luôn thấy (thay `max-h` cứng trừ 24rem). Bản gập < lg giữ mục 44px.

> **As-built BL-062 (design `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc-v2.webp`; THAY khối as-built BL-054 P2-T02 bên dưới khi mâu thuẫn):** không `DetailLayout`; nền `--color-bg`. **D1 Hero** `NewsArticleHero` (section `data-news-hero`, `theme-dark-block`, min-h 26rem / ≥ lg 28.75rem, ảnh bìa `ResponsiveImage` `priority` trang trí phủ kín + scrim token `banner-scrim`: ≥ lg thêm gradient đậm trái → nhạt phải, < lg đậm dần xuống đáy; không ảnh bìa → nền `bg-dark-deep`): `Breadcrumb variant="overlay"` góc trên-trái → chip danh mục (`NewsCategoryBadge tone="on-image"`, link) → `h1` trắng `--text-h1` (≥ lg `max-w` 36rem) → sapo `text-on-dark` (đặc — AA ≥ 5:1 trên ảnh trắng sau scrim; < lg cắt 4 dòng, ≥ lg đủ chữ) → hàng đáy: logo tròn viền trắng + "Bài viết bởi TAMI REAL ESTATE" / "By TAMI REAL ESTATE" + "<time>Ngày đăng: dd/mm/yyyy</time> • N phút đọc" (`/en` "Published: MM/DD/YYYY"), phải "Chia sẻ:" + 4 nút tròn viền trắng (`ShareButtons variant="icons" tone="on-dark"`; < lg xuống dòng dưới tác giả). Chữ trắng đạt AA kể cả trên ảnh trắng tuyệt đối: scrim nền 0.6 `rgb(20 13 2)` → nền tối nhất-sáng ≈ (114,110,103), tương phản ≈ 5.1:1. **D2** bỏ ảnh bìa trong thân (JSON-LD vẫn lấy ảnh bìa); ảnh chèn trong bài bo `--radius-xl`, chú thích nghiêng canh giữa. **Thân bài** lưới ≥ lg `[15rem][1fr]` gap 3rem, KHÔNG `items-start`: cột bài = (< lg) mục lục gập → `news-prose` → **D7 khung liên hệ** (`NewsArticleContactNote`, `role="note"`, nền `primary-subtle` bo `rounded-xl`, icon `Info` vàng trong vòng `primary-soft`, ≥ md thụt 3.25rem; chữ = `site-settings.newsDetail.contactNote` theo ngôn ngữ, rỗng → i18n mặc định; "TAMI REAL ESTATE" → link `/lien-he#lead-form`; văn bản thuần) → **D8** "Thẻ:" chip pill KHÔNG `#`, không vạch trên (`/en` ẩn). **D4 cột trái** (`NewsArticleSidebar`): `DetailAsideFit as="div"` (không landmark) `[--detail-aside-top:calc(var(--sticky-top)+1.5rem)]` + con đầu `DETAIL_ASIDE_STICKY_CLASS` chứa thẻ trắng viền mảnh "MỤC LỤC" (số tròn 01/02… cho heading cấp 2, cấp 3 thụt không số; mục active vạch vàng trái + số nền vàng + chữ đậm; `max-h` mềm `max(12rem, 100dvh − --sticky-top − 24rem)` cuộn riêng) + thẻ "Tư vấn miễn phí" (nút pill vàng → `/lien-he`); cột dính tới hết thân bài, thôi dính trước "Bài viết liên quan" (nằm NGOÀI lưới). **D5** `h2` cấp gốc số tròn counter, cỡ `--text-h3` 600; ≥ md mọi khối sau `h2` đầu tiên thụt 3.25rem (lead + ảnh trước `h2` đầu full rộng); < md số cùng dòng, không thụt. **D3** đoạn đầu cỡ `--text-lead` `text-secondary`, không khung. **D6** `ul` cấp gốc ✓ tròn `primary-soft` + tích `accent-text`; `ol`, danh sách lồng giữ nguyên. **D9** "Bài viết liên quan": section `bg-surface`, eyebrow vàng + "Xem tất cả tin tức →", thẻ `NewsCard variant="related"` (trắng bo 20px, ảnh 16:7, badge + ngày, `h3` 2 dòng, tóm tắt 2 dòng + nút tròn vàng trang trí, cả thẻ một link) lưới 1/2/3 cột; 0 bài ẩn. **D10** banner tư vấn giữ. Mobile: hero chữ full rộng, chia sẻ dưới tác giả; breadcrumb > 3 mục chỉ còn "← mục cha" (sửa `Breadcrumb` overlay: `hidden` không bị `inline-flex` của khung kính ghi đè). i18n `page.newsDetail.v2` (+ `publishedOn`, `contactNote`, `contactNoteBrand`).

> **As-built BL-054 P2-T02 (design `docs/specs/listing-detail-redesign/chi-tiet-tin-tuc.webp`; ưu tiên hơn các mục as-built cũ bên dưới khi mâu thuẫn):** không `DetailLayout` (không `data-detail-page` → header luôn hiện, `--sticky-top` = `--header-offset`). Nền `--color-bg`, container 1200px, ≥ lg lưới `[13.5rem][1fr]` gap 3rem.
> - **Cột bài:** breadcrumb `plain` → `NewsCategoryBadge` (viên `primary-soft` + `badge-foreground`, bọc link trang danh mục, vùng chạm 44px) → `h1` `--text-h1` ≤ 24ch → sapo `excerpt` `--text-lead` `text-secondary` ≤ 60ch → hàng tác giả: avatar tròn 40px nền `--color-dark` + logo trắng tĩnh, "Ban biên tập TAMI HOMES" / "TAMI HOMES Editorial Team" (i18n cố định, **không** đọc `author`/`staff`) + ngày · "N phút đọc" `--text-xsmall` muted; bên phải "Chia sẻ:" + nút tròn 44px viền `border` (`ShareButtons variant="icons"`: Facebook, Zalo chữ, sao chép (đổi dấu tích `success-text` khi đã chép, báo `aria-live` sr-only), "thêm" `ShareNetwork` chỉ khi có `navigator.share` — đọc bằng `useSyncExternalStore`, server = không có); < sm xuống dòng. → ảnh bìa 2:1 bo 20px `priority` + `figcaption` căn giữa `--text-xsmall` muted (`caption`; không có thì `alt` và ảnh `alt=""`; không có cả hai → không chú thích) → (< lg) `NewsTocDisclosure` → nội dung → "Thẻ:" (vạch trên `border`, chip `#tag` viền, link `/tin-tuc?tag=`; `/en` ẩn cả dòng).
> - **Nội dung `news-prose`** (globals.css, ngoài @layer, chỉ con trực tiếp): ≥ md cột chữ thụt `3.25rem` làm rãnh số; `p`/`ul`/`ol`/`h2`/`h3` ≤ 46rem, khối và trích dẫn rộng hết cột. Đoạn mở đầu = `p:first-child` (chỉ khi nội dung bắt đầu bằng đoạn văn) khung viền `border` nền `primary-subtle` bo 20px, giãn ra hết rãnh. `h2` cấp gốc: số tròn 36px `decimal-leading-zero` (nền `primary-subtle`, viền trong `primary-soft`, chữ `accent-text` 600) nằm trong rãnh trái (< md: đầu dòng, heading thụt 3rem); `content: … / ""` để trình đọc màn hình bỏ qua. Trích dẫn: khung `primary-subtle` bo 20px, chữ body thường (không nghiêng, không viền trái), dấu “ 3.5rem `accent-display` trang trí. `ul.list-disc` (danh sách Lexical; khối "Số liệu nổi bật" cũng là `ul` nên loại): bỏ marker, dấu tích = vòng tròn 22px `primary-deep` + tích viền `surface`; mục chỉ chứa danh sách con không có dấu. `ol` giữ số. Trang dự án / dịch vụ / pháp lý không có lớp này.
> - **Cột trái** (`NewsArticleSidebar`, ≥ lg `sticky top: --sticky-top + 1.5rem`; DOM sau nội dung): "MỤC LỤC" eyebrow muted + `NewsTocSidebar` (vạch trái `border`, mục đang đọc vạch `primary-deep` + đậm + `aria-current="location"`, khung ≤ 45dvh cuộn riêng; chỉ khi có heading; ẩn < lg và khi in) → thẻ trắng viền bo 20px "TƯ VẤN MIỄN PHÍ" / `h2` "Cần chọn dự án phù hợp với ngân sách?" / mô tả / nút primary "Nhận tư vấn →" `/lien-he` (không form). < lg chỉ còn thẻ tư vấn, đứng sau "Thẻ:".
> - **Cuối trang:** "BÀI VIẾT LIÊN QUAN" (`h2` kiểu eyebrow `accent-text`) + link "Xem tất cả tin tức →" `/tin-tuc` bên phải → lưới 1/2/3 cột `NewsCard variant="grid"` (≤ 3 bài cùng danh mục) → `ConsultBanner`. JSON-LD `Article` + `BreadcrumbList`, metadata, canonical, 1 `h1` giữ. `NewsViewBeacon` gửi 1 lượt xem / lần mở trang. i18n `page.newsDetail.v2`.
> - **Lệch design (chấp nhận):** thẻ tư vấn không có ảnh tòa nhà ở đáy (không có trường media cho ảnh này; spec chỉ yêu cầu chữ + nút); avatar tác giả dùng logo trắng trên nền tối thay chữ "T"; nhãn "Chia sẻ:" ẩn với trình đọc màn hình (nhóm đã có tên "Chia sẻ bài viết").

> **As-built BL-033 (thay bố cục "như S09 bước 1-3 và 5"; nội dung từng phần giữ nguyên):** khung chi tiết chung (`DetailLayout`, nền `--color-primary-subtle`, gốc `data-detail-page` → header ẩn khi cuộn, `--sticky-top` 8/16px; **không** thanh mục con viên thuốc, **không** thẻ phụ cột phải): breadcrumb → lưới ≥ lg `[mục lục 15rem (xl 16rem)] [thẻ trắng bo 28px]` → Bài liên quan ngoài thẻ (nền `--color-bg-alt`). Thẻ trắng: danh mục (link) · h1 `font-display` · ngày + thời gian đọc · ảnh bìa 16:9 bo 20px `priority` · nội dung RichText (cột chữ ≤ 68ch) · tags · chia sẻ. **Mục lục** (`nav[aria-label="Mục lục" / "Contents"]`): sinh từ `h2`/`h3` cấp gốc (Lexical `h1`/`h2` → `h2`, `h3`+ → `h3`; `h3` thụt lề), id = slug bỏ dấu của chữ heading, trùng thêm `-2`/`-3`, slug rỗng → `muc-N`, không trùng id sẵn có của trang; ≥ lg thẻ trắng bo 20px dính `top: var(--sticky-top)`, `max-h` = viewport − `--sticky-top` − 1rem, cuộn riêng trong khung (`overscroll-contain`), mục đang đọc nền/chữ nhấn + `aria-current="location"` (heading cuối cùng đã qua vạch dưới đỉnh; phía trên heading đầu → không mục nào), mục active tự cuộn vào khung mục lục (chỉ khung, không cuộn trang); bấm → cuộn mượt (tức thì khi giảm chuyển động) tới heading, heading có `scroll-mt` = `--sticky-top` + 1rem, focus chuyển vào heading; link là neo `#id` thật (chạy khi không JS). < lg: `<details>` "Mục lục / Contents" đóng mặc định trong thẻ trắng, sau ảnh bìa, trước nội dung (cùng danh sách link). Không heading → không mục lục, lưới 1 cột, thẻ trắng không lệch. Ẩn khi in.

- Như S09 bước 1-3 và 5 (không khối ưu đãi, không form). Tiêu đề chữ thường, meta: danh mục, ngày, thời gian đọc ước tính ("5 phút đọc / 5 min read").
- Cuối bài: tags (chip trung tính, không link ở giai đoạn 1 vì chưa có trang tag), chia sẻ, **Bài liên quan** 3 thẻ (cùng danh mục/tag).
- RichText: `h2/h3`, trích dẫn (blockquote) viền trái 2px `--color-primary` (đây là typographic quote, không phải card) chữ `--text-lead` italic, ảnh trong bài full cột + chú thích `--text-small` muted, bảng cuộn ngang trong khung khi tràn.
- Responsive theo blockquote As-built BL-033 (mục lục cột trái ≥ lg, khối gập < lg). **SEO:** `Article`. **Eyebrow:** 0.

### S12. Tuyển dụng · `/tuyen-dung` · `/en/careers` (FR-PUB-09)

> **As-built BL-054 P2-T03 (design `docs/specs/listing-detail-redesign/tuyen-dung.webp`, ưu tiên hơn mô tả cũ bên dưới khi mâu thuẫn):** hero ảnh `PageHero size="list"` (không thẻ đè) + nút chính "Xem vị trí đang tuyển" (link neo `#open-positions`, không JS) → "Vì sao chọn TAMI / Môi trường để bạn **phát triển**" đầu khối **căn giữa** + gạch ngắn (riêng khối này theo design; các khối khác canh trái), 4 ý `careersPerks` dạng cột (ô tròn `primary-soft` icon → `h3` → mô tả; ≥ lg ngăn bằng vạch `border`) → nền `bg`: "Cơ hội nghề nghiệp / Vị trí đang tuyển" + "N vị trí" (`aria-live`) bên phải → hàng chip phòng ban (đang chọn nền `primary`, còn lại thẻ trắng viền `border`) + form GET [ô Khu vực (icon ghim) · ô tìm tên vị trí (icon kính lúp) · nút viền "Tìm"] — **lệch design:** design không vẽ nút, giữ nút "Tìm" vì ô chọn không tự gửi (WCAG 3.2.2) và form phải chạy không JS → danh sách hàng trắng `JobRow` cách 12px: cột 1 phòng ban (eyebrow `accent-text`) + badge "Tuyển gấp" (`error-subtle` / `error`) trên tên vị trí, rồi tỉnh/thành · hình thức · lương (đậm) · "Hạn: dd/mm/yyyy" (`/en` "Deadline: MM/DD/YYYY", badge còn ≤ 3 ngày giữ) · ô tròn mũi tên `primary`; < lg xếp dọc (thông số xuống dòng), < sm ẩn mũi tên; cả hàng là link → phân trang → "Quy trình ứng tuyển / N bước đơn giản" nền `primary-subtle` (bước: ô tròn trắng icon + số 01.. + `h3` + mô tả; ≥ lg một hàng có mũi tên giữa các bước, md 2 cột) → banner ảnh "Gia nhập TAMI HOMES / Chưa tìm thấy vị trí phù hợp?" (ảnh = ảnh hero Tuyển dụng, nút "Gửi CV ngay" `mailto:` email site-settings) → banner tư vấn (giữ, design không vẽ).

- Page banner (ảnh môi trường làm việc nếu có `pageBanners.careers`) + breadcrumb. **As-built (BL-020 P3-T02):** banner gọn 240px (`compactBanner`), thẻ việc làm thêm viền nhạt + bóng khi hover; bộ lọc/URL giữ nguyên, không có băng tìm kiếm.
- Đoạn giới thiệu ngắn (chuỗi i18n hoặc đề xuất `pageBanners` mô tả) ≤ 40 từ.
- Lọc nhẹ: chip danh mục (`scope=job`) + select nơi làm việc (tỉnh). URL params.
- **Danh sách dạng hàng** (thẻ Việc làm §3.2), phân cách bằng khoảng trắng 8px giữa các hàng có nền `--color-surface` (không kẻ dòng). Chỉ vị trí `published` và `deadline ≥ hôm nay`. Sắp xếp mới đăng trước, hiện hạn nộp rõ; còn ≤ 3 ngày: badge warning.
- Trống (không có vị trí): panel căn giữa "Hiện TAMI chưa có vị trí đang tuyển." + "Gửi CV tới <email>" (`site-settings.email`, `mailto:`).

| Mốc | Thay đổi |
|---|---|
| 375 | Hàng xếp dọc: tên → (nơi làm · hình thức) → lương → hạn nộp; mũi tên ẩn, cả hàng là link |
| 768 | Hàng 1 dòng: tên (flex 1) · nơi làm · lương · hạn nộp · mũi tên |

**A11y:** danh sách `ul`, mỗi hàng 1 link có tên vị trí. **Eyebrow:** 0.

### S13. Chi tiết tuyển dụng · `/tuyen-dung/[slug]` · `/en/careers/[slug]` (FR-PUB-09)

> **As-built BL-054 P2-T04 (design `docs/specs/listing-detail-redesign/chi-tiet-tuyen-dung.webp`, ưu tiên hơn mô tả cũ bên dưới khi mâu thuẫn):** khung `DetailLayout` (nền `primary-subtle`, header ẩn khi cuộn như các trang chi tiết) → hero SÁNG `JobDetailHero` (ảnh `pageBanners.careers` + scrim `bg` dày trái nhạt dần phải ≥ lg, < lg phủ gần kín; không ảnh → nền `bg` trơn): breadcrumb `plain` (Trang chủ › Tuyển dụng › tên) → phòng ban (eyebrow `accent-text`) + `UrgentBadge` → `h1` 2 dòng (dòng 2 `accent-display`; `splitJobTitle`: gạch nối có khoảng trắng → từ nối `cho/tại/về/mảng/for/at/in/of` khi ≥ 5 tiếng → ≥ 6 tiếng cắt tiếng chẵn gần nửa → còn lại 1 dòng; mỗi dòng ≥ 2 tiếng) → mô tả ngắn = đoạn dẫn của `description` (P3-T01 C11 `splitDescriptionLead`, quy tắc bảo thủ: chỉ bỏ qua các đoạn RỖNG ở đầu (không chữ, chỉ text trắng / xuống dòng); khối đầu tiên còn lại phải là đoạn văn CHỮ THUẦN — căn lề mặc định, không thụt lề, không link, không xuống dòng, không đậm/nghiêng/gạch chân/gạch ngang/code/style — VÀ phần sau còn chữ → đoạn đó lên hero hiện TOÀN VĂN (không `line-clamp`, `max-w-[56ch]`), "Mô tả công việc" bỏ đúng đoạn đó (cùng các đoạn rỗng trước nó); khối khác đứng trước (ảnh/upload, đường kẻ ngang, relationship, tiêu đề, danh sách, trích dẫn, block…) / đoạn đầu có link, định dạng, căn lề hoặc thụt lề / chỉ 1 khối có chữ → không tách: thân giữ nguyên đủ, hero không có mô tả ngắn; JSON-LD + meta vẫn đủ `description`) → `ul` "Thông tin vị trí" icon `accent-text`: tỉnh/thành · hình thức · lương · "Hạn nộp: <time>" (`/en` MM/DD/YYYY) → bên phải ≥ lg nút "Ứng tuyển ngay →" (neo `#apply-form`, không JS) + "Chia sẻ" (`DetailShareButton` biến thể có chữ: Web Share, dự phòng menu `ShareButtons`). **Bỏ khỏi trang** (theo design): khối tóm tắt cũ (nơi làm chi tiết `workplace`, số lượng) — `workplace` vẫn vào JSON-LD. Cột trái MỘT thẻ trắng: "Mô tả công việc" / "Yêu cầu" / "Quyền lợi" (`h2`, không eyebrow; mục richText trống ẩn), danh sách `ul` thành vòng tròn viền `primary` (chỉ trang này). Cột phải thẻ trắng dính `DETAIL_ASIDE_CARD_CLASS`: "Ứng tuyển vị trí này" + "Phản hồi trong 3 ngày làm việc." (cùng `<header>` với `h2`, P3-T01 C5) → `ApplyForm` (nhãn hiển thị + icon trong ô + placeholder ví dụ; vùng CV ≥ md viền nét đứt icon tải lên + "Kéo thả CV vào đây hoặc **Chọn tệp**" (nút thành chữ nhấn, vẫn vùng chạm ≥ 44px `md:min-h-11` — P3-T01 C1) + định dạng/dung lượng; < md nút viền "Chọn tệp"; tệp đã chọn = thẻ icon tệp + tên + dung lượng + nút xoá `aria-label`; "Lời nhắn" giữ; đồng ý chính sách; nút "Gửi hồ sơ" rộng hết thẻ, giữ % tải lên) + kênh dự phòng email/hotline dưới form (giữ, design không vẽ). Payload / validate / Turnstile / rate limit không đổi. < lg: form sau nội dung + thanh dính đáy "Ứng tuyển". → "Vị trí khác" (`OtherJobs`, cả tin còn hạn lẫn hết hạn): `h2` + gạch vàng ngắn, "Xem tất cả vị trí →" `/tuyen-dung`; ≤ 4 thẻ trắng là link (phòng ban + Tuyển gấp, `h3` tên, tỉnh, lương, ô tròn mũi tên `primary-soft`), 1 → 2 (sm) → 4 cột (lg); nguồn `findOtherOpenJobs` (còn hạn, cùng ngôn ngữ, cùng danh mục trước rồi mới nhất, loại tin đang xem); rỗng ẩn → banner tư vấn (giữ). **Tin hết hạn:** băng "đã hết hạn" dưới hero, không nút "Ứng tuyển ngay" / form / thanh dính, `noindex, follow`, không JSON-LD (kể cả breadcrumb); cột phải = thẻ "Gửi CV để TAMI liên hệ…" + `mailto:` email site-settings + nút "Xem tất cả vị trí". i18n `page.jobDetail.v2`.

- Breadcrumb. Đầu trang: tên vị trí `--text-h1` (chữ thường), hàng meta: nơi làm, hình thức, số lượng, lương, hạn nộp.
- ≥ lg 2 cột: nội dung 8 cột (Mô tả công việc, Yêu cầu, Quyền lợi: 3 khối richText với `h2`) + cột phải 4 cột dính: tóm tắt meta + nút **Ứng tuyển** (cuộn tới form) + chia sẻ.
- Form ứng tuyển §3.4 cuối trang, nền `--color-primary-subtle`, container text 768px.
- Vị trí hết hạn (truy cập URL trực tiếp sau hạn; Spec chỉ nói "tự ẩn khỏi danh sách"). Đề xuất: chi tiết quá hạn **vẫn mở** với băng "Vị trí đã hết hạn nhận hồ sơ / This position is closed", ẩn form, gợi ý vị trí khác; `noindex` và bỏ JSON-LD `JobPosting` (cần confirm §9 mục 6).

| Mốc | Thay đổi |
|---|---|
| 375 | 1 cột; meta dạng `<dl>` 2 cột; thanh dính đáy nút **Ứng tuyển** (ẩn khi form trong viewport) |
| 1024 | 2 cột 8/4 dính; bỏ thanh đáy |

**SEO:** `JobPosting` (salary min/max, `validThrough` = deadline, `inLanguage`). **Eyebrow:** 0.

### S14. Dịch vụ · `/dich-vu/[slug]` · `/en/services/[slug]` (FR-PUB-10)

- Hero ảnh 70svh (ảnh: đề xuất `services.coverImage`, §6.3; chưa có thì banner Chữ) + tên dịch vụ `--text-display` + `summary`.
- Breadcrumb. Nội dung `content` richText trong container text; ảnh trong bài được phép full container (1280) để xen nhịp ảnh-chữ.
- Khối "Dịch vụ khác": 2 thẻ Dịch vụ còn lại (lưới 2 cột ≥ md).
- Banner CTA tối (cùng component S01 khối 7), nút **Nhận tư vấn** → `/lien-he?service=<slug>` (form liên hệ điền sẵn lời nhắn "Tôi quan tâm dịch vụ <tên>").

| Mốc | Thay đổi |
|---|---|
| 375 | Hero 60svh, chữ đáy trái; "Dịch vụ khác" 1 cột |
| 768 | "Dịch vụ khác" 2 cột |
| 1024 | Hero 70svh |

**Eyebrow:** 0. **Watermark:** 0.

### S15. Liên hệ · `/lien-he` · `/en/contact` (FR-PUB-11)

> **As-built BL-054 (design `docs/specs/listing-detail-redesign/lien-he.webp`; ưu tiên hơn mô tả cũ bên dưới khi mâu thuẫn):** `PageHero` cỡ `short` (`pageHeroes.contact`, breadcrumb trên ảnh, eyebrow → `h1` 2 dòng → mô tả; chừa đáy khi có thẻ) → **4 thẻ nổi đè mép dưới hero** (`ContactCards`, `ul` "Kênh liên hệ", thẻ trắng bo 20px `shadow-md`, icon tròn 48px (`size-12`) `primary-soft`): Hotline ("Gọi ngay" `tel:`), Email ("Gửi email" `mailto:`), Zalo OA (giá trị = `siteName`, "Nhắn tin" → `zaloUrl` tab mới `noopener noreferrer`), Giờ làm việc (`workingHours.hours` + `days` chữ vàng); thẻ thiếu dữ liệu ẩn, lưới 1 cột → 2×2 (≥ sm) → N cột (≥ lg, N = số thẻ). → ≥ lg 2 cột bằng nhau: **trái** thẻ trắng `#lead-form` eyebrow "Gửi yêu cầu" + `h2` "Bạn cần TAMI hỗ trợ điều gì?" + `LeadForm` layout `contact` (nhãn hiển thị + icon trong ô, Họ tên / SĐT một hàng ≥ sm, nút "Gửi yêu cầu →"; trường / payload `source=contact` không đổi; **không** chip loại yêu cầu — Quyết định 6) · **phải** thẻ trắng "Hệ thống văn phòng" (`OfficeSystem`, client): mô tả + tab viên thuốc (mẫu ARIA tabs, ẩn khi 1 văn phòng) → `LazyMap` 16:9 của văn phòng đang chọn (không toạ độ → không bản đồ; bỏ link "Mở Google Maps" vì đã có "Chỉ đường") → thẻ văn phòng (ảnh trái ≥ sm, tên `h3`, địa chỉ, `tel:`, `mailto:`, nút "Chỉ đường" → Google Maps theo toạ độ / địa chỉ, tab mới). Văn phòng: `site-settings.offices` (`/en` bỏ hàng thiếu tên/địa chỉ EN) → rỗng thì 1 văn phòng dự phòng từ `address` / `mapLocation` / `hotline` / `email` (tên i18n "Văn phòng {siteName}"). < lg: form → văn phòng. → banner **"Gia nhập TAMI HOMES"** (`JoinTeamBanner`: thẻ tối bo 20px trong container, ảnh `pageBanners.careers` + scrim, nút "Xem vị trí đang tuyển →" `/tuyen-dung`). Không banner tư vấn. Không còn mạng xã hội / chuỗi giờ làm việc i18n cố định ở trang này. i18n `page.contact.v2`.

- Page banner + breadcrumb.
- ≥ lg 2 cột 5/7: **trái** thông tin (`site-settings`): hotline (lớn, `tel:`), email, địa chỉ, giờ làm việc ("08:00 - 17:30, thứ 2 - thứ 7" / "8:00 AM - 5:30 PM, Mon - Sat", lấy từ i18n theo Spec § Quy tắc biên), mạng xã hội; dưới là bản đồ 4:3 (§3.8, ghim văn phòng `mapLocation`). **Phải**: Lead form Đầy đủ (`source=contact`), tiêu đề "Gửi yêu cầu tư vấn / Send an enquiry".
- Query `?service=<slug>` (từ S14): điền sẵn lời nhắn.

| Mốc | Thay đổi |
|---|---|
| 375 | Thứ tự: thông tin → form → bản đồ; hotline là nút lớn full-width |
| 1024 | 2 cột 5/7 |

**Eyebrow:** 0.

### S16. Trang pháp lý · `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` · `/en/privacy-policy`, `/en/terms-of-use` (FR-PUB-14)

- Banner Chữ gọn (không ảnh, không watermark), breadcrumb.
- 1 cột container text 768px; dưới tiêu đề: "Phiên bản <version> · Hiệu lực từ <effectiveDate>" / "Version <version> · Effective <date>".
- Mục lục tự sinh từ `h2` (≥ xl: cột trái dính 240px; < xl: accordion "Mục lục / Contents" đầu bài).
- Bản EN chưa duyệt (`hasEnglish = false`) → 404 EN; nút chuyển ngôn ngữ trên trang VI đưa về `/en` trang chủ (theo FR-PUB-19).
- In ấn: `@media print` ẩn header/footer/nút nổi/cookie banner.

### S17. 404 (Not found, theo ngôn ngữ)

- Dùng `not-found.tsx` trong từng nhánh locale để đúng ngôn ngữ (VI dưới `/`, EN dưới `/en`), có header + footer đầy đủ.
- Bố cục: banner Chữ (không chữ chìm "404" — đã bỏ ở BL-020), tiêu đề "Không tìm thấy trang" / "Page not found", câu "Trang có thể đã đổi địa chỉ hoặc không còn." / "This page may have moved or no longer exists." Hai nút: **Về trang chủ / Back to home** (Dark) · **Xem tin cho thuê / Browse rentals** (Outline). Dưới: link nhanh Dự án, Tin tức, Liên hệ.
- EN 404 do **chưa có bản dịch** (nội dung có bản VI): thêm dòng "This content is available in Vietnamese." + link sang bản VI (chỉ khi xác định được bản VI tương ứng; nếu không thì bỏ).
- Trả status 404, `noindex`.

### S18. 500 (Lỗi máy chủ, theo ngôn ngữ) ★ mới

- `error.tsx` trong từng nhánh locale (lỗi render một route) + `global-error.tsx` (lỗi ở layout gốc).
- `error.tsx`: giữ header/footer, nội dung: icon `WarningCircle` 40px muted, tiêu đề "Đã có lỗi xảy ra" / "Something went wrong", câu "Vui lòng thử lại sau ít phút. Nếu cần gấp, gọi hotline <số>." / "Please try again in a few minutes. For urgent help, call <hotline>." Nút **Thử lại / Try again** (gọi `reset()`) + **Về trang chủ / Back to home**. Mã lỗi tham chiếu (`digest`) chữ `--text-xsmall` muted ("Mã lỗi: abc123") để khách đọc cho tổng đài.
- `global-error.tsx`: không dùng được layout/i18n → HTML tự chứa, logo SVG inline, **song ngữ cùng lúc** (VI trên, EN dưới), style inline tối thiểu, không gọi API, hotline lấy từ biến build (`NEXT_PUBLIC_HOTLINE`) để chắc chắn hiển thị khi DB lỗi.
- Không hiện stack/chi tiết lỗi. Lỗi gửi GlitchTip (ARCHITECTURE giám sát).
- `noindex`, status 500 (Next tự trả).

---

## 5. Kiểm tra responsive (gate cho reviewer)

Áp cho mọi màn ở 375 / 768 / 1280 (thêm 1024, 1536 khuyến nghị):
- Không cuộn ngang (`scrollWidth ≤ clientWidth`); chip/tab cuộn ngang nằm trong vùng có `overflow-x: auto` riêng.
- Font-size `rem`, tiêu đề `clamp()`; không `100vh` (dùng `svh`/`dvh`).
- Touch target ≥ 44px; menu ngang chỉ ≥ xl, < xl dùng menu toàn màn hình.
- Ảnh có `sizes`; video/iframe có `aspect-ratio`.
- Chạy với chuỗi EN và tiêu đề VI dài nhất trong seed; nút không xuống dòng ở desktop.

---

## 6. Quyết định khối trang chủ + đề xuất thay đổi ERD

> ✅ User duyệt 16/10/2026: §6.1 + §6.2 + `services.coverImage` đã đưa vào `docs/ERD.md`. **Không** làm `pageBanners`, `provinces.intro` (đã đổi 19/10/2026: `pageBanners` làm ở BL-017, FR-ADM-20). Hero: admin có thể chỉ dùng ảnh, video hoàn toàn tuỳ chọn.

### 6.1. Ba khối còn lệch (Spec § Câu hỏi mở)

| Khối | Quyết định đề xuất | Lý do |
|---|---|---|
| **Hero video** | **Giữ, tuỳ chọn theo slide**, chỉ phát ≥ lg + không reduced-motion + không Save-Data; ảnh của slide là poster và là ảnh LCP | Đúng cảm giác market.vinhomes.vn nhưng không hại LCP mobile (NFR-01); admin không bắt buộc dùng |
| **Dải 4 lối tắt** (Dự án · Cho thuê · Ưu đãi · Liên hệ) | **Bỏ** | Lặp đúng menu chính + 3 khối ngay bên dưới (Dự án nổi bật, Ưu đãi, CTA); thêm một dải icon 4 ô là mẫu "AI template", trùng ý định CTA "Liên hệ" (taste §4.5). Phương án thay (không làm giai đoạn 1 trừ khi user muốn): thanh tìm nhanh Cho thuê dưới hero (danh mục + tỉnh + giá → `/cho-thue?…`) |
| **Banner CTA** | **Giữ** (khối 7 trang chủ, dùng lại ở S14) | Trang chủ không có form; đây là điểm chuyển đổi lead duy nhất ngoài nút nổi (BO-2). Khối tối tạo nhịp kết trang như vinhomes.vn |

### 6.2. Trường cần thêm vào global `homepage` (ERD §4.15)

| Khối | Trường đề xuất | Kiểu | Localized | Ghi chú |
|---|---|---|---|---|
| `hero.slides[]` | `video` | upload `rel→media` | Không | Tuỳ chọn. MP4 (H.264) hoặc WebM, ≤ 15MB, ≤ 30 giây, không tiếng. `image` vẫn **bắt buộc** (poster + mobile) |
| `ctaBanner` (khối mới) | `enabled` | checkbox | Không | Mặc định `true` |
| | `title` | text | **Có** | R khi `enabled`, ≤ 60 ký tự |
| | `description` | textarea | **Có** | ≤ 160 ký tự |
| | `ctaLabel` | text | **Có** | Mặc định lấy chuỗi khoá "Nhận tư vấn / Get advice" nếu trống |
| | `ctaLink` | text | Không | Khoá trang (vd `contact`) hoặc URL tuyệt đối, như `header.navItems[].link` |
| | `backgroundImage` | upload `rel→media` | Không | Tuỳ chọn, hiển thị mờ 20% |
| `blockOrder` | thêm giá trị `ctaBanner` | | | |

Kéo theo:
- **ERD §4.12 `media`:** cho phép thêm MIME `video/mp4`, `video/webm` (≤ 15MB) **chỉ** dùng cho trường `hero.slides[].video` (hiện media chỉ nhận ảnh + PDF). Kiểm tra MIME thật khi upload như NFR-04.
- **Quy tắc EN (Spec § Quy tắc biên):** `ctaBanner` chưa có `title` EN → ẩn khối ở `/en`.
- Dải 4 lối tắt bị bỏ → **không** thêm trường.

### 6.3. Đề xuất khác (không bắt buộc, đều có phương án mặc định khi không thêm)

| Đề xuất | Kiểu | Dùng ở | Nếu không thêm |
|---|---|---|---|
| `site-settings.pageBanners` (group: `default`, `projects`, `rentals`, `propertyPosts`, `news`, `careers`; mỗi mục upload `rel→media`) — **làm ở BL-017 (FR-ADM-20)**; `contact` (S15) chưa làm | upload | Page banner Ảnh §2.7 (S02, S04, S05, S08, S10, S12) | Dùng banner Chữ (đã thiết kế, không lỗi giao diện) |
| `services.coverImage` | upload `rel→media`, R khi published | Hero S14, thẻ Dịch vụ trang chủ | Thẻ Dịch vụ trang chủ **cần ảnh**; trường `icon` hiện có không đủ cho thẻ ảnh 3:4. **Khuyến nghị thêm** (nếu không, thẻ dịch vụ phải đổi sang dạng chữ trên nền `--color-primary-subtle`) |
| `provinces.intro` | textarea, localized | Trang đích khu vực S06 (SEO) | Dùng câu template i18n |

Không cần đổi ERD cho: cookie consent (cookie client, `gaMeasurementId` đã có), trạng thái "Đã thuê" (lead `source=rental` có sẵn), trang 500, trang danh mục (`categories.description`, `seo` có sẵn).

---

## 7. Danh sách ảnh cần có (taste §4.8)

Code dùng ảnh mẫu (picsum seed) ở dev/staging cho tới khi có Q4. Ảnh thật cần cho go-live:

| Vị trí | Tỉ lệ / cỡ tối thiểu | Số lượng |
|---|---|---|
| Hero trang chủ | 16:9 (desktop) **và** khung an toàn 4:5 ở giữa (mobile cắt) · 2560×1440 | 1-8 |
| Về TAMI | 4:5 · 1200×1500 | 1 |
| Ảnh đại diện dự án | 16:9 · 2400×1350 (slider) | mỗi dự án |
| Dịch vụ (đề xuất `coverImage`) | 3:4 · 1200×1600 | 3 |
| Banner CTA (tuỳ chọn) | 21:9 · 2560×1100 | 1 |
| Page banner (tuỳ chọn) | 21:9 · 2560×1100 | 6 |
| Logo đối tác | SVG hoặc PNG nền trong suốt | mỗi chủ đầu tư |
| Ảnh OG mặc định | 1200×630 (DESIGN.md § Logo) | 1 |

---

## 8. Pre-Flight Check (taste-skill §14) trên spec

| Mục | Kết quả |
|---|---|
| Brief inference + dials | ✅ đầu file + tokens §0 |
| Không em-dash/en-dash trong chuỗi UI | ✅ mọi chuỗi UI trong file này dùng `-`; builder giữ luật trong `vi.json`/`en.json` |
| Theme lock | ✅ light; khối tối có chủ đích (footer, CTA, Tin tức, menu, ≤ 2 section nội dung/trang): ngoại lệ ghi ở tokens §0 |
| Color lock (1 accent) | ✅ chỉ vàng TAMI; trạng thái dùng màu riêng có lý do |
| Shape lock | ✅ 0 / 2px / 12 / 16 / 20px / pill / full theo thang BL-020 (tokens §4) |
| Button + form contrast | ✅ tokens §9 (đã sửa 4 giá trị) |
| CTA không xuống dòng, không trùng ý định | ✅ §1.2 |
| Font | ✅ Một font Montserrat, không serif (BL-036) |
| Palette premium | ⚠️ ngoại lệ có chủ đích (màu thương hiệu đo từ nhận diện TAMI) |
| Hero ≤ 4 phần tử chữ, không strip trang trí; nút cuộn xuống chỉ icon (BL-020 ghi đè "không scroll cue") | ✅ S01.1 |
| Eyebrow ≤ ceil(n/3) | ✅ ghi từng màn (trang chủ 1/3) |
| Không split-header, không zigzag 3 lần, layout family không lặp | ✅ S01 (6 family / 7 section) |
| Logo wall chỉ logo, dưới hero | ✅ S01.6 |
| Không 3 thẻ đều cho Dịch vụ | ✅ bento 7/5 |
| Không kẻ dòng mọi hàng thông số | ✅ `<dl>` lưới, khoảng trắng |
| Reduced motion, không scroll listener | ✅ tokens §6 |
| Dark mode | ⚠️ không làm (user chốt, tokens §0) |
| Empty / loading / error | ✅ §3.9 + từng màn |
| Icon từ thư viện | ✅ Phosphor |
| Ảnh thật | ⚠️ chờ Q4, dùng picsum seed ở dev (§7) |
| CWV | ✅ §1.5 (LCP poster, map/video lười, GA4 sau consent) |

---

## 9. Điểm cần user confirm — ✅ đã chốt 16/10/2026: đồng ý cả 8 mục theo đề xuất (mục 3: chỉ `services.coverImage`; mục 5–6: mở trang + `noindex`)

1. **Tokens:** 4 giá trị đổi so với `docs/DESIGN.md` để đạt AA: Text Muted `#6B6B6B`, Accent Display `#A07A3F`, Warning `#8A5A0A`, thêm Input Border `#857F79`. Đồng ý thì cập nhật luôn DESIGN.md cho khớp.
2. **Homepage:** giữ Hero video (tuỳ chọn) · **bỏ** dải 4 lối tắt · giữ Banner CTA → thêm trường §6.2 + cho `media` nhận video.
3. **`services.coverImage`** (khuyến nghị) và `site-settings.pageBanners`, `provinces.intro` (tuỳ chọn).
4. **Cookie:** GA4 chỉ tải sau khi đồng ý; banner không chặn trang, nút Từ chối ngang hàng nút Đồng ý (§3.10).
5. **SEO tin "Đã thuê":** `noindex, follow` (đề xuất) hay giữ index.
6. **Tuyển dụng quá hạn:** chi tiết vẫn mở + băng "đã hết hạn", ẩn form, `noindex` (đề xuất) hay trả 404.
7. **Eyebrow giới hạn** (≤ 1/3 section) dù mockup/vinhomes dùng nhiều hơn.
8. **Icon:** Phosphor Icons thay Lucide mặc định của shadcn.

---

## 10. Diagram

`skills/archify` **chưa cài** trong repo (không có `bin/archify.mjs`, chưa chạy `npx skills add tt-a1i/archify`). Theo `.agent/design.md` (best-effort) → **ghi blocker, bỏ qua**, không fail bước design. Sơ đồ kiến trúc đã có dạng chữ ở `docs/ARCHITECTURE.md`; bước graph sẽ cần archify cho `docs/diagrams/layer-plan.html` (cài với `--agent claude-code` khi user cho phép tải gói ngoài).
