# Design Spec: Website TAMI (website công khai)

- **Sinh bởi:** bước `/design` (`/start` bước 3), 16/10/2026 · **Trạng thái:** chờ user confirm tokens + các quyết định ở §6, §9
- **Tokens:** `skills/react-nodejs/design-tokens.md` (nguồn đúng cho màu/chữ/khoảng cách; ghi đè 4 giá trị của `docs/DESIGN.md`, xem §12 file đó)
- **Nguồn:** `SPECIFICATIONS.md` v1.2.1 · `docs/DESIGN.md` (màn, component, logo) · `docs/BRD.md` §2, §2.1, §3.1 · `docs/ERD.md` §4 · `docs/API_SPEC.md` §3 · `docs/ARCHITECTURE.md` §5 · design doc `docs/specs/2026-10-16-tami-website-design.md`
- **Tham chiếu phong cách:** vinhomes.vn (bố cục, nhịp section, kiểu chữ). **Không** dùng nội dung, ảnh, icon, chữ của Vinhomes (LGL-04).
- **Phạm vi file:** website công khai VI + EN. Trang quản trị `/admin` dùng giao diện Payload mặc định (chỉ đổi logo, màu nhấn `#8C6733`, font Montserrat qua `admin.components`/CSS), không có screen spec riêng.

**Design read:** website thương hiệu bất động sản cao cấp cho khách mua/thuê Việt Nam và người nước ngoài; ngôn ngữ biên tập sang trọng theo vinhomes.vn; Tailwind + shadcn/ui tuỳ biến, EB Garamond + Montserrat, chuyển động tiết chế.
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
- `alt` lấy từ `media.alt` (localized). Ảnh trang trí (watermark, nền banner) `alt=""`.
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

### 1.6. Ngân sách eyebrow và chữ chìm
- Eyebrow (nhãn nhỏ in hoa trên tiêu đề): tối đa **ceil(số section / 3)** mỗi trang (taste-skill §4.7). Mỗi screen dưới đây ghi rõ section nào có.
- Chữ chìm (watermark): tối đa **2** mỗi trang, `aria-hidden="true"`, chỉ hiện ≥ md (mobile ẩn để không chiếm chiều cao).

### 1.7. In hoa
- **In hoa** (CSS `uppercase`): tiêu đề trang/section, tên dự án trên hero/slider, nút, eyebrow, menu.
- **Chữ thường**: tiêu đề bài viết, tin cho thuê, việc làm, tên trên thẻ tin (câu dài in hoa khó đọc, nhất là tiếng Việt có dấu).

---

## 2. Khung trang (layout shell)

### 2.1. Header

| Thuộc tính | Spec |
|---|---|
| Biến thể | **Trong suốt** (trang có hero ảnh: trang chủ, chi tiết dự án, dịch vụ): nền trong suốt + gradient đen 40% → 0 phía trên, logo trắng, icon trắng. **Đặc**: nền `--color-surface`, `--shadow-sm`, logo đen. Chuyển sang Đặc khi hero ra khỏi viewport (IntersectionObserver trên sentinel), transition `--duration-base` |
| Trang không có hero | Luôn Đặc |
| Cao | 64px (< lg) · 72px (≥ lg) |
| Bố cục < xl | Trái: nút Tìm kiếm (icon kính lúp). Giữa: logo. Phải: `VI \| EN` (ẩn < sm, khi đó nằm trong menu) + nút Menu (icon 3 gạch, nhãn "Menu") |
| Bố cục ≥ xl | **Một hàng** (user quyết 2026-10-19, BL-001): logo trái · menu ngang giữa (7 mục: Trang chủ · Dự án · Cho thuê · Đăng tin BĐS · Tin tức · Tuyển dụng · Liên hệ, chữ `--text-small` 600 in hoa `0.08em`) · phải: nút Tìm kiếm, `VI | EN`, nút CTA (nếu bật), nút Menu (mở menu toàn màn hình §2.2). Cao 72px như ≥ lg, không còn hàng 2. Mục có con: dropdown khi hover/focus/Enter, `aria-expanded`. Menu ngang không xuống dòng, không tràn ở 1280px |
| Mục đang xem | Gạch chân 2px `--color-primary` (header trong suốt) / `--color-accent-text` (header đặc), `aria-current="page"` |
| Sticky | Có, `position: sticky; top: 0; z: --z-header` |
| Logo | Lấy từ `site-settings.logo` (bản cho nền sáng: header đặc) và `site-settings.logoDark` (bản cho nền tối: header trong suốt trên hero, menu toàn màn hình, footer). Thiếu bản nào → dùng logo tĩnh mặc định cho bản đó (`/brand/tami-logo-dark.png` / `/brand/tami-logo-white.png`) |
| Nút CTA | Từ global `header.ctaButton`: "bật" = có cả `label` ở ngôn ngữ đang xem và `link` hợp lệ → hiện nút CTA (nút chính cỡ nhỏ) ở cụm phải header (≥ md) và trong menu toàn màn hình; thiếu nhãn ở ngôn ngữ đang xem (vd chưa có bản EN) hoặc thiếu link → ẩn, không mượn chữ ngôn ngữ kia (BR-07) |

**Tìm kiếm (D7):** bấm icon mở thanh tìm (Sheet trên xuống, cao 160px desktop / toàn màn mobile): ô `q` (label ẩn trực quan "Tìm tin cho thuê / Search rentals"), gợi ý tĩnh 4 danh mục Cho thuê dạng chip. Enter → `/cho-thue?q=` · `/en/for-rent?q=`. Không autocomplete (ngoài phạm vi).

### 2.2. Menu toàn màn hình
- Mở từ nút Menu, phủ toàn màn hình, lớp `.theme-dark-block` nền `--color-dark-deep`, `z: --z-overlay`.
- Cột trái (≥ lg) / toàn bộ (< lg): 7 mục chữ `--text-h2` serif in hoa, mục có con xổ accordion (chữ `--text-body`). Cột phải (≥ lg): hotline, email, địa chỉ, mạng xã hội, `VI | EN`.
- Accordion menu con: link cha giữ điều hướng, nút caret riêng cạnh link (≥ 44px, `aria-expanded`, `aria-controls`, nhãn "Mở menu con <mục>"), đóng mặc định, mở bằng Enter/Space/chạm; chuyển động mở/đóng `--duration-base`, tắt khi `prefers-reduced-motion`. Menu toàn màn hình dùng ở mọi breakpoint (≥ xl mở từ nút Menu trong header 1 hàng).
- Mở: menu trượt mờ dần `--duration-slow`, các mục stagger 40ms (tắt khi reduced motion).
- Nút đóng ở đúng vị trí nút Menu (cùng toạ độ), `aria-label="Đóng menu / Close menu"`.

### 2.3. Chuyển ngôn ngữ (FR-PUB-19)
- Chữ `VI | EN`, ngôn ngữ đang xem đậm + `aria-current="true"`; mỗi mục là `<a hreflang lang>` với `aria-label="Tiếng Việt"` / `"English"`.
- Đích: trang tương ứng ở ngôn ngữ kia (route map BRD §2.1 + slug localized). Không có bản dịch → trang danh sách của loại đó, hoặc trang chủ. Bấm ghi cookie `NEXT_LOCALE` (client).
- Xuất hiện ở: header (≥ sm), menu toàn màn hình, footer.

### 2.4. Footer
- `.theme-dark-block` nền `--color-dark`, padding `--space-section-tight`.
- Hàng 1: logo trắng + mô tả ngắn công ty (≤ 25 từ, `footer.contactBlock`).
- Hàng 2: các cột `footer.columns` (lưới `auto-fit minmax(160px, 1fr)`): Dự án, Cho thuê, Dịch vụ (3 link dịch vụ), Về TAMI (Tuyển dụng, Liên hệ, Chính sách bảo mật, Điều khoản). Cột "Liên hệ": hotline (`tel:`), email (`mailto:`), địa chỉ.
- Hàng 3 (đường kẻ `--color-dark-border` phía trên): copyright, mạng xã hội (icon 24px, vùng chạm 44px), `VI | EN`, link "Cài đặt cookie / Cookie settings" (mở lại banner §3.10).
- Responsive: < md xếp dọc, mỗi cột link thành accordion (tiêu đề cột là heading chứa nút, đóng mặc định, `aria-expanded` + `aria-controls`); cột Liên hệ luôn mở; ≥ md lưới (không accordion, mọi link hiện); ≥ xl 5 cột.

### 2.5. Nút liên hệ nổi (FR-PUB-12)
- Góc dưới phải, cách mép `max(16px, env(safe-area-inset-right))` và đáy `max(16px, env(safe-area-inset-bottom))`, `z: --z-floating`.
- 3 nút tròn 48px (`--radius-full`, `--shadow-lg`): Hotline (`tel:`, nền `--color-primary`), Zalo, Fanpage (nền `--color-dark`, icon trắng). Mobile: mặc định thu gọn thành 1 nút "Liên hệ nhanh / Quick contact" bung lên 3 nút (tránh che nội dung); ≥ md hiện cả 3 xếp dọc.
- Bấm: `navigator.sendBeacon('/api/public/click-events', {type, pagePath, refCollection?, refId?})` rồi mở link. Link lấy từ `site-settings`; thiếu link nào thì ẩn nút đó.
- Khi cookie banner đang hiện, nút nổi đẩy lên trên banner (không chồng).
- Trang chi tiết có khung giá dính ở đáy mobile (§4.7): nút nổi đẩy lên trên thanh đó.

### 2.6. Breadcrumb
- Mọi trang trừ trang chủ. `nav[aria-label="Breadcrumb"]` + `ol`, mục cuối `aria-current="page"`, không là link. Chữ `--text-small` `--color-text-muted`, phân cách icon `CaretRight` 12px `aria-hidden`.
- Trên trang có hero ảnh: breadcrumb đặt **dưới** hero (không đè lên ảnh). Mobile: rút gọn còn "← <mục cha>" nếu > 3 mục.
- Kèm JSON-LD `BreadcrumbList` theo ngôn ngữ.

### 2.7. Page banner (đầu trang danh sách)
- Biến thể **Ảnh**: cao `clamp(240px, 42svh, 440px)`, ảnh `object-cover` + scrim, tiêu đề `--text-h1` trắng căn giữa. Ảnh lấy từ đề xuất `site-settings.pageBanners` (§6.3).
- Biến thể **Chữ** (khi chưa cấu hình ảnh): nền `--color-bg-alt`, tiêu đề `--text-h1` + watermark phía sau (≥ md), mô tả danh mục nếu có (`categories.description`, `max-width: 60ch`). Padding `--space-section-tight`.
- Header trên trang có banner ảnh: biến thể Trong suốt.

---

## 3. Component và pattern dùng chung

### 3.1. Section heading
- Thành phần: [eyebrow tuỳ chọn theo ngân sách §1.6] + tiêu đề `--text-h1` + mô tả tuỳ chọn (≤ 25 từ, `--text-lead`, `max-width: 60ch`) + link "Xem tất cả" (Ghost, `--color-accent-text`).
- Căn giữa (trang chủ) hoặc căn trái (trang trong). **Không** dùng kiểu tiêu đề trái + đoạn nhỏ trôi bên phải (split-header ban). Link "Xem tất cả" đặt **dưới** nội dung khối trên mobile, cạnh tiêu đề (căn đáy) ≥ md.

### 3.2. Thẻ (Card)

| Thẻ | Ảnh | Nội dung | Hover/focus |
|---|---|---|---|
| **Dự án** | 4:5 (< md) / 4:3 (≥ md), `--radius-none` | Badge `salesStatus`; tên `--text-h3` serif; tỉnh/thành `--text-small` muted; "Từ <giá>" `--text-small` 600 nếu có | Ảnh `--hover-zoom` `--duration-slow`; tên gạch chân. Cả thẻ là 1 link (`<a>` bọc, không lồng link) |
| **Tin cho thuê** | 4:3, `--radius-sm` trên, nền `--color-surface`, viền `--color-border` | Giá/tháng `--text-h4` `--color-text` (hoặc "Thoả thuận / Negotiable"); tiêu đề 2 dòng `--text-body` 600; hàng thông số icon + số: diện tích, phòng ngủ, WC (`tabular-nums`); phường, tỉnh `--text-small` muted; mã tin `--text-xsmall` muted | Ảnh zoom; viền đổi `--color-input-border`. Tin `rented` không bao giờ xuất hiện trong lưới/tin tương tự nên thẻ không cần badge "Đã thuê" |
| **Tin/ưu đãi** (Đăng tin BĐS, Tin tức) | 16:10 | Danh mục `--text-xsmall` 600 `--color-accent-text` (đây là metadata, không tính eyebrow section); tiêu đề 2-3 dòng `--text-h4`; excerpt 2 dòng (chỉ thẻ lớn); ngày `--text-xsmall` muted; Đăng tin BĐS: badge "Đã kết thúc" / "Còn <n> ngày" nếu có `offer.endAt` | Ảnh zoom; tiêu đề gạch chân |
| **Dịch vụ** | 3:4 (nhỏ) / 4:5 (lớn), scrim dưới | Tên `--text-h2` trắng đè trên ảnh (đáy trái), `summary` 2 dòng `--color-on-dark-muted` ≥ md | Ảnh zoom; mũi tên `ArrowRight` trượt 4px |
| **Việc làm** (hàng) | không ảnh | Tên vị trí `--text-h4`; nơi làm, hình thức, lương (`salaryText`), hạn nộp; nút mũi tên | Nền `--color-surface` → `--color-primary-subtle` |

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
- Trường: Từ khoá (`q`) · Danh mục · Tỉnh/thành · Phường/xã (phụ thuộc tỉnh, disabled khi chưa chọn tỉnh) · Giá/tháng (2 ô min-max + gợi ý mốc: < 5tr, 5-10tr, 10-20tr, > 20tr) · Diện tích (min-max) · Phòng ngủ (chip 1, 2, 3, 4+) · Nội thất (chip Không, Cơ bản, Đầy đủ) · Sắp xếp (Mới nhất, Giá tăng dần, Giá giảm dần).
- **Nguồn sự thật là URL** (query params như API_SPEC §3.3). Đổi bộ lọc → `router.replace` với `scroll: false`, debounce 300ms cho ô số và từ khoá; trang về `page=1`.
- Hàng "Đang lọc": chip từng điều kiện có nút xoá (`aria-label="Bỏ lọc <tên>"`) + "Xoá tất cả / Clear all".
- Số kết quả `aria-live="polite"`: "128 tin phù hợp / 128 listings".
- Mobile (< lg): thanh dính dưới header gồm ô từ khoá + nút "Bộ lọc (n)" + nút Sắp xếp; bấm mở **Sheet từ dưới lên** (cao 90svh) chứa toàn bộ trường, chân Sheet dính: "Xoá / Clear" + "Xem <n> tin / Show <n> listings" (số cập nhật sống). ≥ lg: thanh ngang trên lưới (hàng 1: từ khoá, danh mục, tỉnh, phường, giá; hàng 2: diện tích, phòng ngủ, nội thất, sắp xếp) hoặc popover cho giá/diện tích.

### 3.6. Phân trang
- Số trang có link thật (`?page=n`, SEO được), hiện tối đa: đầu, cuối, hiện tại ±1, dấu "…". Nút Trước/Sau có nhãn. `nav[aria-label="Phân trang / Pagination"]`, trang hiện tại `aria-current="page"`.
- Mobile: chỉ "Trước · Trang 2/12 · Sau".
- Đổi trang: cuộn về đầu lưới (focus tiêu đề kết quả).

### 3.7. Thư viện ảnh + lightbox
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

> Bảng responsive mỗi màn: chỉ ghi mốc **có thay đổi**; mốc không ghi = giữ như mốc nhỏ hơn. Kiểm tra bắt buộc 375 / 768 / 1280.
> "EN" ghi điểm khác riêng của bản tiếng Anh (ngoài §1.1).

### S01. Trang chủ · `/` · `/en` (FR-PUB-01, 17)

**Thứ tự khối** theo `homepage.blockOrder` (admin đổi được); mặc định và bố cục:

| # | Khối | Layout family | Nền | Eyebrow / watermark |
|---|---|---|---|---|
| 1 | Hero | Full-bleed media, chữ giữa | Ảnh/video | Không |
| 2 | Về TAMI (`about`) | Split ảnh-chữ 5/7 + hàng số liệu | `--color-bg` | Watermark "TAMI" |
| 3 | Dự án nổi bật | Slider full-bleed | `--color-bg-alt` | Watermark "DỰ ÁN"/"PROJECTS"; eyebrow = loại hình trên từng slide (1) |
| 4 | Dịch vụ | Bento bất đối xứng | `--color-bg` | Không |
| 5 | Ưu đãi nổi bật | Lưới thẻ | `--color-bg-alt` | Không |
| 6 | Đối tác | Lưới logo | `--color-bg` | Không |
| 7 | Banner CTA (đề xuất §6.1) | Khối tối full-width | `.theme-dark-block` `--color-dark-deep` + ảnh mờ | Không |
| | Footer | | `--color-dark` | |

7 section → 6 layout family khác nhau; eyebrow 1/3 cho phép; 1 khối tối nội dung (CTA) + footer: đúng ngoại lệ tokens §0.

**1. Hero** (`homepage.hero.slides`, 1-8)
- Cao `100svh` (tối thiểu 560px, tối đa 1080px), header Trong suốt đè lên.
- Ảnh `object-cover` + scrim (tokens §9); slide có video (đề xuất §6.1) phát `muted loop playsinline` chỉ khi ≥ lg, không reduced-motion, không Save-Data; còn lại hiện ảnh (= poster, cũng là ảnh LCP).
- Chữ căn giữa, `max-width: 22ch` cho tiêu đề: `title` (`--text-display`, ≤ 2 dòng desktop), `subtitle` (`--text-lead`, ≤ 20 từ, `#FFFFFF` opacity 0.85 trên scrim), nút Primary `ctaLabel` → `ctaLink`. Tối đa 3 phần tử chữ.
- Chữ slide hiện dần (trượt 24px + opacity, `--duration-reveal`) khi slide vào; ảnh chuyển crossfade 700ms.
- Điều khiển (≥ 2 slide): chấm phân trang đáy giữa (chấm 8px trong vùng chạm 44px, đang chọn `--color-primary` rộng 24px), nút Dừng/Phát góc dưới phải cạnh chấm. Mũi tên Trước/Sau ≥ lg ở hai mép giữa. Vuốt trên cảm ứng. Autoplay `--slider-interval`, dừng khi hover/focus/tab ẩn/reduced motion.
- Không có chữ "Scroll" hay icon cuộn (taste §9.F).
- 1 slide: không chấm, không autoplay.

**2. Về TAMI** (`about`)
- < md: tiêu đề → ảnh 4:3 → nội dung (richText, tối đa ~120 từ hiển thị, phần còn lại không cắt: admin chịu trách nhiệm độ dài) → số liệu.
- ≥ md: lưới 12 cột: ảnh cột 1-5 (4:5), chữ cột 7-12; watermark "TAMI" sau tiêu đề.
- Số liệu `stats` (2-4 mục): **một hàng chữ**, không thẻ, không icon: số `--text-h1` serif `--color-text`, nhãn `--text-small` muted; phân cách bằng khoảng trắng (≥ md: `gap: 48px`; < md: lưới 2 cột). Không có hiệu ứng đếm số.

**3. Dự án nổi bật** (`featuredProjects`, tối đa 6; trống thì lấy `isFeatured` mới nhất)
- Heading căn giữa + watermark. Slider full-bleed (tràn viền, không theo container).
- Mỗi slide: ảnh đại diện dự án tỉ lệ 16:9 (≥ md) / 4:5 (< md).
  - ≥ lg: khung chữ `--color-surface` rộng 440px đè lên ảnh, đáy trái lệch vào trong `--gutter`, padding 40px: eyebrow loại hình (`category.name`), tên `--text-h2`, tỉnh/thành, `summary` 3 dòng, nút Outline **Khám phá dự án**.
  - < lg: khung chữ nằm **dưới** ảnh (không đè), cùng nội dung, `summary` 2 dòng.
- Điều khiển: mũi tên ≥ md (ngoài khung chữ), chấm phân trang dưới. Không autoplay (người dùng tự chuyển). Hiện một phần slide kế bên ở mobile (slide rộng 88%) để gợi ý vuốt.
- "Xem tất cả" → `/du-an`.
- 0 dự án: ẩn khối. 1 dự án: không điều khiển.

**4. Dịch vụ** (`services.items`)
- Heading căn trái.
- Theo số mục: 1 → thẻ ngang full container 21:9; 2 → 2 thẻ 7/5 cột; **3 (mặc định) → bento: thẻ lớn cột 1-7 cao 2 hàng, 2 thẻ nhỏ cột 8-12 xếp chồng**; ≥ 4 → hàng cuộn ngang scroll-snap.
- < md: 3 thẻ xếp dọc, thẻ 4:3, chữ đè đáy ảnh.
- Thẻ link tới `/dich-vu/[slug]`.

**5. Ưu đãi nổi bật** (`featuredOffers`; trống thì `isFeatured` còn hạn)
- Heading căn giữa + "Xem tất cả" → `/tin-bds`.
- Lưới thẻ Tin/ưu đãi: < sm 1 cột · sm 2 cột · lg 3 cột; tối đa 6 thẻ. Bài hết hạn **không** xuất hiện (BR-06). 0 bài: ẩn khối.

**6. Đối tác** (`partners`, `developers.showAsPartner`)
- Tiêu đề `--text-h2` căn giữa. Lưới logo **chỉ logo** (không chữ dưới logo), ô cao 80px, logo `max-height: 48px`, grayscale + opacity 0.7, hover/focus về màu gốc. Logo có link `website` (tab mới) nếu có, `alt` = tên chủ đầu tư.
- < sm 2 cột · sm 3 · md 4 · lg 6. Không marquee. 0 đối tác: ẩn khối.

**7. Banner CTA** (đề xuất §6.1): khối tối, ảnh nền mờ 20% (tuỳ chọn), tiêu đề `--text-h1` (≤ 8 từ), câu phụ ≤ 20 từ, nút Primary **Nhận tư vấn** → `/lien-he` (hoặc `ctaLink`). Căn giữa, padding `--space-section`.

**States:** dữ liệu từ global, render server; không có loading riêng. Khối lỗi dữ liệu (quan hệ trỏ tới bài đã ẩn) → bỏ qua mục đó, không vỡ khối.

**Responsive tóm tắt:**

| Mốc | Thay đổi |
|---|---|
| 375 | Mọi khối 1 cột; hero chữ `--text-display` 32px, nút full-width tối đa 320px; slider dự án slide 88% + khung chữ dưới ảnh; dịch vụ xếp dọc; ưu đãi 1 cột; đối tác 2 cột |
| 640 | Ưu đãi 2 cột; đối tác 3 cột |
| 768 | Về TAMI split 5/7; watermark hiện; dịch vụ 2 thẻ đầu 50/50 + thẻ 3 full; đối tác 4 cột; mũi tên slider dự án |
| 1024 | Hero mũi tên; video hero bật (nếu có); slider dự án khung chữ đè ảnh; dịch vụ bento 7/5; ưu đãi 3 cột; đối tác 6 cột |
| 1280 | Menu ngang; nội dung đạt container 1280 |
| 1536 | Chỉ nới khoảng trắng; hero/slider vẫn tràn viền, hero tối đa 1080px cao |

**A11y:** hero carousel theo §1.4; `h1` là `title` của slide đầu (các slide sau dùng `p` có class display để chỉ có 1 `h1`); số liệu dùng `<dl>`.
**EN:** khối thiếu bản EN thì ẩn; thứ tự khối dùng chung.

### S02. Danh sách dự án · `/du-an` · `/en/projects` (FR-PUB-02)

- Page banner (§2.7) "Dự án / Projects". Breadcrumb.
- Lọc: hàng chip **Loại hình** (danh mục `scope=project`, chip "Tất cả" đầu); hai select **Tỉnh/thành** và **Trạng thái** (Sắp mở bán / Đang mở bán / Đã bàn giao). URL: `?category=&province=&status=&page=`.
- Lưới thẻ Dự án, 12/trang, sắp mới nhất. Thẻ đầu tiên của trang 1 **không** phóng to (giữ lưới đều, đây là danh sách để duyệt).
- Phân trang §3.6.

| Mốc | Thay đổi |
|---|---|
| 375 | Chip cuộn ngang (scroll-snap, có fade mép phải báo còn), 2 select xếp hàng 50/50; lưới 1 cột |
| 640 | Lưới 2 cột |
| 1024 | Chip + select cùng 1 hàng (select bên phải); lưới 3 cột |
| 1536 | Giữ 3 cột, nới gap |

**States:** đổi chip/trang: giữ lưới cũ, mờ 50% + `aria-busy`, link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route (§3.2); trống khi lọc §3.9 (câu: "Chưa có dự án phù hợp."); EN: chỉ dự án `hasEnglish`.
**A11y:** chip là `button[aria-pressed]` trong `role="group" aria-label="Loại hình"`; kết quả `aria-live`.
**Eyebrow:** 0. **Watermark:** banner chữ (nếu không có ảnh).

### S03. Chi tiết dự án · `/du-an/[slug]` · `/en/projects/[slug]` (FR-PUB-03)

**Cấu trúc:**
1. **Hero** full màn hình (`100svh`, tối đa 900px) ảnh đại diện + scrim; đáy trái: badge `salesStatus`, tên `--text-display`, địa chỉ ngắn (phường, tỉnh). Nút Primary **Nhận tư vấn** (cuộn tới form) + nút Outline sáng **Tải tài liệu** (nếu có `documents`).
2. Breadcrumb.
3. **Thanh mục con dính** (`z: --z-sticky`, dưới header): Tổng quan · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Thư viện. Chỉ hiện mục có dữ liệu. Mục đang xem tự đánh dấu (IntersectionObserver), bấm cuộn mượt (tắt khi reduced motion), `scroll-margin-top` = header + thanh. < lg: cuộn ngang, mục đang xem tự cuộn vào giữa.
4. **Tổng quan** (`--color-bg`): lưới thông số dạng `<dl>` 2 cột (< md) / 4 cột (≥ md): Chủ đầu tư (link), Loại hình, Quy mô (`scale`), Diện tích, Giá từ, Bàn giao. Không kẻ dòng từng hàng. Dưới: `overview` richText `max-width: 68ch`.
5. **Vị trí** (`--color-bg-alt`): split bản đồ 7 cột + địa chỉ 5 cột (≥ lg); < lg bản đồ trên, địa chỉ dưới. Bản đồ §3.8.
6. **Tiện ích** (`--color-bg`): lưới icon + tên (`amenities`), 2 cột mobile, 4 cột ≥ lg. Không có icon → chỉ tên dạng danh sách 2 cột.
7. **Mặt bằng** (`--color-bg-alt`): tab theo `floorPlans.title`, ảnh mặt bằng 4:3 nền trắng, bấm mở lightbox. ≥ 6 mặt bằng → select thay tab trên mobile.
8. **Pháp lý** (`legalInfo`) và **Chính sách bán hàng** (`salesPolicy`) (`--color-bg`): 2 khối richText; ≥ lg 2 cột cạnh nhau, < lg accordion (mở sẵn mục đầu).
9. **Thư viện** (`.theme-dark-block` `--color-dark`: section nội dung tối duy nhất của trang): bento §3.7 trên nền tối.
10. **Tài liệu**: danh sách file PDF (tên, dung lượng) với nút **Tải tài liệu** (Dark). Bỏ nếu trống.
11. **Form** (`--color-primary-subtle`): split: trái tiêu đề "Nhận thông tin dự án / Get project information" + hotline + sale/hotline chung; phải Lead form Đầy đủ (`source=project`).
12. **Dự án khác**: 3 thẻ Dự án cùng tỉnh hoặc cùng loại hình (lưới 1/2/3 cột).

| Mốc | Thay đổi |
|---|---|
| 375 | Hero chữ `--text-display` 32px, 2 nút xếp dọc full-width; thanh mục con cuộn ngang; thông số 2 cột; form 1 cột (tiêu đề trên form); thanh dính đáy "Nhận tư vấn" (cao 64px, `--color-surface`, `--shadow-md`) xuất hiện khi form chưa trong viewport |
| 768 | Thông số 4 cột; thư viện bento |
| 1024 | Vị trí split 7/5; pháp lý + chính sách 2 cột; form split 5/7; bỏ thanh dính đáy |
| 1280 | Container 1280 |

**States:** loading: skeleton hero (khối `--color-surface-muted` 100svh) + thanh mục con; dự án `handed_over` vẫn có form với tiêu đề chung (không thêm ý định CTA mới); form §3.3.
**A11y:** `h1` = tên dự án; mỗi section `aria-labelledby`; thanh mục con là `nav[aria-label="Mục lục dự án"]`.
**Eyebrow:** 0 (badge trạng thái không tính). **Watermark:** 0 (hero ảnh đã là điểm nhấn).
**SEO:** JSON-LD `RealEstateListing` + `BreadcrumbList`, `inLanguage`.

### S04. Danh sách Cho thuê · `/cho-thue` · `/en/for-rent` (FR-PUB-04) · density 5

- Page banner **Chữ** gọn (padding `--space-section-tight` × 0.6): tiêu đề "Cho thuê / For rent" + dòng mô tả. Breadcrumb.
- Bộ lọc §3.5 + hàng "Đang lọc" + số kết quả + sắp xếp.
- Lưới thẻ Tin cho thuê, 12/trang (`limit=12`), phân trang §3.6.
- Chip danh mục nhanh ngay trên lưới (link tới trang danh mục S05, không phải bộ lọc ẩn).
- Chỉ tin `published` (tin `rented` **không** ở danh sách; chỉ còn truy cập bằng URL).

| Mốc | Thay đổi |
|---|---|
| 375 | Thanh lọc dính (từ khoá + "Bộ lọc (n)" + Sắp xếp), Sheet lọc từ dưới; lưới 1 cột; thẻ ảnh 4:3 |
| 640 | Lưới 2 cột |
| 1024 | Thanh lọc ngang 2 hàng trên lưới (không dính); lưới 3 cột |
| 1280 | Lưới 3 cột, thẻ rộng ~400px |
| 1536 | Lưới 4 cột (container vẫn 1280 → thẻ ~300px; dùng `@container` để thẻ tự chuyển hàng thông số xuống 2 dòng khi < 320px) |

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

Bố cục = màn danh sách cha tương ứng (S04, S08, S10) với khác biệt:
- Page banner: tiêu đề = `categories.name`, mô tả = `categories.description` (≤ 60ch, nếu có). Ảnh banner theo `pageBanners` của loại nội dung.
- Breadcrumb: Trang chủ › <Loại> › <Danh mục cha nếu có> › <Danh mục>.
- Danh mục có con: hàng chip danh mục con (chip "Tất cả" = chính danh mục cha, gồm cả bài của con) dưới banner.
- Cho thuê: bộ lọc §3.5 với **Danh mục đã khoá** (hiện như chip cố định, bỏ khỏi Sheet); đổi danh mục = chuyển sang trang danh mục khác.
- Tab danh mục ở S08/S10 là **link** tới trang này (không lọc client), tab hiện tại `aria-current="page"`.
- SEO: trang indexable, canonical chính nó, title/meta từ `categories.seo`. EN: danh mục không `hasEnglish` → 404 EN; slug danh mục theo locale.
- Trống: "Chưa có bài viết trong mục này." + link về danh sách cha.

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

**Cấu trúc:**
1. Breadcrumb (Trang chủ › Cho thuê › <Danh mục> › <Mã tin>).
2. Thư viện ảnh §3.7 (bento ≥ md, carousel < md), nút "Xem video" nếu có `videoUrl` (facade).
3. Hai cột (≥ lg: nội dung 8 cột + khung phải 4 cột dính `top: header + 24px`):
   - **Nội dung:** tiêu đề cỡ `--text-h2`, chữ thường (§1.7) · mã tin + ngày đăng `--text-xsmall` · địa chỉ (đường + phường + tỉnh; số nhà chỉ khi `showExactAddress`) · **Thông số chính** 4 ô lớn (Giá/tháng, Diện tích, Phòng ngủ, WC) dạng hàng chữ, không thẻ · **Chi tiết** `<dl>` 2 cột: Tầng, Hướng nhà, Hướng ban công, Nội thất, Danh mục, Dự án (link) · **Điều khoản thuê** `<dl>`: Thời hạn tối thiểu, Đặt cọc, Kỳ thanh toán, Ngày trống, Dịch vụ bao gồm (chip trung tính) · **Mô tả** richText · **Vị trí** bản đồ §3.8 · **Pháp lý** (`legalNote`) nếu có.
   - **Khung phải** (`--color-primary-subtle`, padding 24px): giá `--text-price` + "/tháng" · Sale phụ trách (avatar tròn 48px, `fullName`, `phone` → nút **Gọi hotline** `tel:`; sale bị khoá → thay bằng hotline chung, không hiện tên) · Lead form Rút gọn (`source=rental`).
4. **Tin tương tự** (`--color-bg-alt`): 4 thẻ cùng danh mục + cùng tỉnh, giá ±30% (lưới 1/2/4 cột, < sm carousel).

**Trạng thái "Đã thuê"** (`status = rented`, BR-01, Spec § Quy tắc biên) ★
- Trang vẫn mở (200), URL giữ nguyên, **không** vào sitemap; đề xuất `noindex, follow` để không cạnh tranh với tin còn trống (cần confirm §9 mục 5).
- Băng thông báo ngay dưới breadcrumb: nền `--color-dark`, chữ trắng, icon `Info`: "Căn này đã được cho thuê. Xem các căn tương tự bên dưới hoặc để lại thông tin để TAMI tư vấn." / "This unit has been rented. See similar units below or leave your details for advice."
- Badge "Đã thuê / Rented" (Dark) góc trên trái ảnh đầu; ảnh thư viện giữ màu (không làm xám, tránh cảm giác lỗi).
- Giá: vẫn hiện nhưng chữ `--color-text-muted` + nhãn "Giá tham khảo / Reference price".
- Khung phải: tiêu đề form đổi thành **"Nhận tư vấn căn tương tự" / "Find similar units"**, nút gửi cùng nhãn đó; lead vẫn `source=rental`, `sourceId` = tin này (Spec). Ẩn nút Gọi sale? **Giữ** (sale vẫn là người phụ trách khu vực).
- **Tin tương tự** chuyển lên **ngay sau thư viện ảnh** (trước nội dung), tiêu đề "Căn tương tự đang trống / Similar available units", 4-8 tin.
- Mô tả và thông số vẫn hiện (khách tham khảo), thu gọn `Điều khoản thuê` thành accordion đóng.

| Mốc | Thay đổi |
|---|---|
| 375 | Thư viện carousel 4:3 + đếm ảnh; 1 cột; khung giá + form nằm **sau** Thông số chính; thanh dính đáy: giá (trái) + nút **Nhận tư vấn** (phải, cuộn tới form) + icon gọi; ẩn thanh khi form trong viewport |
| 768 | Thư viện bento; thông số chính 4 ô 1 hàng; `<dl>` 2 cột |
| 1024 | 2 cột 8/4, khung phải dính; bỏ thanh đáy |
| 1280 | Container 1280; tin tương tự 4 cột |

**States:** loading skeleton thư viện + 2 cột; form §3.3; ảnh lỗi tải → nền `--color-surface-muted` + icon `ImageBroken`; tin `hidden`/`draft` → 404.
**A11y:** `h1` = tiêu đề tin; thông số dạng `<dl>`; khung dính không che focus (khi focus vào phần tử bị khung dính che, `scroll-padding`).
**Eyebrow:** 0. **SEO:** JSON-LD `RealEstateListing` (offers, price VND/tháng).

### S08. Danh sách Đăng tin BĐS · `/tin-bds` · `/en/property-news` (FR-PUB-06)

- Page banner + breadcrumb. Tab danh mục (link tới S05): "Tất cả" · Tin BĐS · Voucher / Ưu đãi · … (tab cuộn ngang < md).
- Trang 1, tab Tất cả: **bài nổi bật** đầu tiên (`isFeatured` mới nhất còn hạn) thẻ ngang lớn: ảnh 16:10 7 cột + chữ 5 cột (tiêu đề `--text-h2`, excerpt 3 dòng, hạn ưu đãi) (≥ lg); dưới là lưới thẻ Tin/ưu đãi.
- Thẻ có `offer.endAt`: còn ≤ 3 ngày → badge "Còn <n> ngày / <n> days left" (warning); đã qua → badge "Đã kết thúc / Ended" + ảnh `opacity 0.7`, **vẫn** hiện trong danh sách (BR-06 chỉ rút khỏi khối trang chủ) nhưng xếp sau bài còn hạn.
- 12 bài/trang, phân trang.

| Mốc | Thay đổi |
|---|---|
| 375 | Tab cuộn ngang; bài nổi bật = thẻ dọc thường lớn hơn (ảnh 16:10, tiêu đề `--text-h3`); lưới 1 cột |
| 640 | Lưới 2 cột |
| 1024 | Bài nổi bật split 7/5; lưới 3 cột |

**States:** đổi chip/trang như S04 (giữ kết quả cũ mờ 50% + `aria-busy`; không skeleton cấp route); trống §3.9; EN theo `hasEnglish`. **Eyebrow:** 0 (nhãn danh mục trên thẻ là metadata).

### S09. Chi tiết bài Đăng tin BĐS · `/tin-bds/[slug]` · `/en/property-news/[slug]` (FR-PUB-07)

1. Breadcrumb.
2. Đầu bài (container text 768px, căn trái): danh mục (link), tiêu đề cỡ `--text-h1`, chữ thường (§1.7), ngày đăng, nút chia sẻ (Facebook, Zalo, sao chép link).
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
| 375 | Ảnh bìa tràn viền (bỏ gutter); khối ưu đãi full-width; nút chia sẻ thành 1 nút "Chia sẻ / Share" dùng Web Share API (fallback menu) |
| 1024 | Ảnh bìa rộng 1024 vượt cột chữ; nút chia sẻ dính cột trái (≥ xl) |

**States:** form §3.3; ưu đãi sắp hết hạn → badge warning. **SEO:** JSON-LD `Article`. **Eyebrow:** 0.

### S10. Tin tức · `/tin-tuc` · `/en/news` (FR-PUB-08)

- Page banner + breadcrumb + tab danh mục (link S05).
- Trang 1 tab "Tất cả": **bố cục nổi bật**: 1 bài lớn (ảnh 16:10, cột 1-7) + 3 bài dạng hàng (ảnh 4:3 nhỏ 120px + tiêu đề + ngày) cột 8-12 (≥ lg). Bên dưới: lưới thẻ Tin/ưu đãi 3 cột cho phần còn lại. Khác layout với S08 (S08 = 1 bài ngang + lưới) để mỗi mục có nhận diện riêng.
- Không có form, không CTA lead (BRD: Tin tức không thu lead).
- 12 bài/trang (không tính khối nổi bật ở trang 1).

| Mốc | Thay đổi |
|---|---|
| 375 | Bài lớn thẻ dọc; 3 bài hàng (ảnh 96px); lưới 1 cột |
| 640 | Lưới 2 cột |
| 1024 | Khối nổi bật 7/5; lưới 3 cột |

**States:** đổi chip/trang như S04 (giữ kết quả cũ mờ 50% + `aria-busy`; không skeleton cấp route); trống; EN. **Eyebrow:** 0.

### S11. Chi tiết tin tức · `/tin-tuc/[slug]` · `/en/news/[slug]` (FR-PUB-08)

- Như S09 bước 1-3 và 5 (không khối ưu đãi, không form). Tiêu đề serif chữ thường, meta: danh mục, ngày, thời gian đọc ước tính ("5 phút đọc / 5 min read").
- Cuối bài: tags (chip trung tính, không link ở giai đoạn 1 vì chưa có trang tag), chia sẻ, **Bài liên quan** 3 thẻ (cùng danh mục/tag).
- RichText: `h2/h3` serif, trích dẫn (blockquote) viền trái 2px `--color-primary` (đây là typographic quote, không phải card) chữ `--text-lead` italic, ảnh trong bài full cột + chú thích `--text-small` muted, bảng cuộn ngang trong khung khi tràn.
- Responsive như S09. **SEO:** `Article`. **Eyebrow:** 0.

### S12. Tuyển dụng · `/tuyen-dung` · `/en/careers` (FR-PUB-09)

- Page banner (ảnh môi trường làm việc nếu có `pageBanners.careers`) + breadcrumb.
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
- Bố cục: banner Chữ, watermark "404", tiêu đề "Không tìm thấy trang" / "Page not found", câu "Trang có thể đã đổi địa chỉ hoặc không còn." / "This page may have moved or no longer exists." Hai nút: **Về trang chủ / Back to home** (Dark) · **Xem tin cho thuê / Browse rentals** (Outline). Dưới: link nhanh Dự án, Tin tức, Liên hệ.
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

> ✅ User duyệt 16/10/2026: §6.1 + §6.2 + `services.coverImage` đã đưa vào `docs/ERD.md`. **Không** làm `pageBanners`, `provinces.intro`. Hero: admin có thể chỉ dùng ảnh, video hoàn toàn tuỳ chọn.

### 6.1. Ba khối còn lệch (Spec § Câu hỏi mở)

| Khối | Quyết định đề xuất | Lý do |
|---|---|---|
| **Hero video** | **Giữ, tuỳ chọn theo slide**, chỉ phát ≥ lg + không reduced-motion + không Save-Data; ảnh của slide là poster và là ảnh LCP | Đúng cảm giác vinhomes.vn nhưng không hại LCP mobile (NFR-01); admin không bắt buộc dùng |
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
| `site-settings.pageBanners` (group: `projects`, `rentals`, `propertyPosts`, `news`, `careers`, `contact`; mỗi mục upload `rel→media`) | upload | Page banner Ảnh §2.7 (S02, S04, S05, S08, S10, S12, S15) | Dùng banner Chữ (đã thiết kế, không lỗi giao diện) |
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
| Theme lock | ✅ light; khối tối có chủ đích (footer, CTA, menu, ≤ 1 section nội dung/trang): ngoại lệ ghi ở tokens §0 |
| Color lock (1 accent) | ✅ chỉ vàng TAMI; trạng thái dùng màu riêng có lý do |
| Shape lock | ✅ 0 / 2px / 4px / full theo quy tắc tokens §4 |
| Button + form contrast | ✅ tokens §9 (đã sửa 4 giá trị) |
| CTA không xuống dòng, không trùng ý định | ✅ §1.2 |
| Serif | ✅ EB Garamond do brand nêu, không Fraunces/Instrument Serif |
| Palette premium | ⚠️ ngoại lệ có chủ đích (màu thương hiệu đo từ nhận diện TAMI) |
| Hero ≤ 4 phần tử chữ, không scroll cue, không strip trang trí | ✅ S01.1 |
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
