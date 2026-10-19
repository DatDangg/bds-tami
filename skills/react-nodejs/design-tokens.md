# Design Tokens: Website TAMI

> Sinh bởi bước `/design` (`.agent/design.md` Phase 2), 16/10/2026. **Trạng thái: chờ user confirm.**
> Nguồn: `docs/DESIGN.md` (bảng màu đo từ mockup, logo, typography), phong cách tham chiếu market.vinhomes.vn (bố cục, nhịp section; màu TAMI), `.agent/references/taste-skill-v2.md`, `skills/ui-ux-pro-max`, `skills/responsive-web`.
> Screen specs dùng các token này: `.context/design-spec.md`.
> **Builder phải đọc file này trước khi viết bất kỳ component UI nào.** Component chỉ dùng token (class Tailwind sinh từ token hoặc `var(--…)`), **không** viết mã hex thô.

## 0. Design Read và Dials

**Design read:** website thương hiệu bất động sản cao cấp cho khách mua/thuê Việt Nam và người nước ngoài; ngôn ngữ biên tập sang trọng theo market.vinhomes.vn (ảnh lớn, tiêu đề serif viết thường, nhiều khoảng trắng); Tailwind + shadcn/ui tuỳ biến, EB Garamond + Montserrat, chuyển động tiết chế.

| Dial | Giá trị | Lý do |
|---|---|---|
| `DESIGN_VARIANCE` | **5** | Bố cục đã chốt theo một website tham chiếu; hero căn giữa được phép (ngoại lệ "editorial/brand manifesto" của taste-skill §4.3) |
| `MOTION_INTENSITY` | **4** | DESIGN.md: "Subtle"; NFR-01 (LCP/INP/CLS) ưu tiên hơn hiệu ứng |
| `VISUAL_DENSITY` | **3** trang giới thiệu · **5** danh sách Cho thuê | Trang thương hiệu thoáng; trang lọc cần đọc nhanh thông số |

**Các ngoại lệ có chủ đích so với taste-skill** (brief/brand đã nêu rõ nên được phép, ghi lại để reviewer không đánh FAIL nhầm):

| Luật taste-skill | Ngoại lệ | Căn cứ |
|---|---|---|
| §4.1 hạn chế serif | Dùng EB Garamond cho tiêu đề | Brand brief nêu đích danh font; phong cách luxury/editorial |
| §4.2 cấm nền kem + vàng đồng mặc định | Giữ vàng champagne `#E0BF89` + nền kem | Màu đo từ bộ nhận diện TAMI, không phải chọn mặc định |
| §4.11 khoá một theme | Section tối xen kẽ (footer, banner CTA, menu toàn màn hình, tối đa **2** section nội dung tối mỗi trang: banner CTA + Tin tức trang chủ, BL-020 #11 user chốt 2026-10-19) | DESIGN.md "Color scheme: Light, có section tối xen kẽ" |
| §6.C bắt buộc dark mode | **Không** làm dark mode toàn trang giai đoạn 1 | User chốt trong DESIGN.md ("Không làm dark mode toàn trang") |
| impeccable: cấm eyebrow | Eyebrow được dùng nhưng **tối đa 1 trên 3 section** (taste-skill §4.7) | Nhịp market.vinhomes.vn; giới hạn để không thành template |

## 1. Colors

> Theme duy nhất: **light**, có "khối tối" (`.theme-dark-block`) dùng lại cùng tên token nhưng đổi giá trị (§1.6).
> Ba màu đã **chỉnh so với `docs/DESIGN.md`** để đạt WCAG AA, thêm một màu viền input (đánh dấu ⚠️, xem §9, §12).

### 1.1. Thương hiệu

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-primary` | `#E0BF89` | Nền nút chính, badge "Đang mở bán", gạch chân tab đang chọn, chấm slider đang chọn |
| `--color-primary-hover` | `#D4AF72` | Hover/active của nút chính (chữ `#141414` vẫn 8.9:1) |
| `--color-primary-foreground` | `#141414` | Chữ/icon trên nền primary |
| `--color-primary-soft` | `#EAD3AE` | Chip/tab lọc đang chọn, nền hover nhẹ |
| `--color-primary-subtle` | `#F8F3EB` | Panel nổi bật (khung giá dính, khối voucher) |
| `--color-accent-text` | `#8C6733` | Chữ vàng cỡ nhỏ: link "Xem tất cả", eyebrow, tab đang chọn, focus ring trên nền sáng. **Không** đặt trên `surface-muted` (4.49:1) |
| `--color-accent-display` | `#A07A3F` ⚠️ | Giá cỡ lớn (≥ 24px hoặc ≥ 18.66px đậm), icon viền vàng. DESIGN.md ghi `#B58C50`: chỉ đạt 2.83:1 trên nền trang, hạ xuống để đạt 3:1 |
| `--color-badge-foreground` | `#3C2704` | Chữ trên badge vàng |

### 1.2. Nền và bề mặt

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-bg` | `#F7F5F4` | Nền trang |
| `--color-bg-alt` | `#FAF8F6` | Nền section xen kẽ |
| `--color-surface` | `#FFFFFF` | Card tin, form, thanh lọc, dropdown, cookie banner |
| `--color-surface-muted` | `#F1F0EE` | Chip trung tính, input disabled, skeleton |
| `--color-border` | `#E8E6E3` | Đường kẻ trang trí, viền card (không dùng làm viền input) |
| `--color-input-border` | `#857F79` (mới) | Viền input/select/checkbox: cần ≥ 3:1 cho thành phần UI (WCAG 1.4.11). `--color-border` chỉ 1.25:1 |
| `--color-overlay` | `rgba(10, 12, 16, 0.55)` | Lớp phủ modal/menu, scrim trên ảnh hero |

### 1.3. Chữ

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-text` | `#141414` | Tiêu đề, tên dự án/tin, giá trị thông số |
| `--color-text-secondary` | `#555555` | Đoạn mô tả, nội dung bài |
| `--color-text-muted` | `#6B6B6B` ⚠️ | Địa chỉ, ngày, nhãn thông số, placeholder, helper text. DESIGN.md ghi `#767676`: chỉ 4.18:1 trên `#F7F5F4`, 3.99:1 trên `#F1F0EE` |

### 1.4. Khối tối (footer, banner CTA, menu toàn màn hình)

| Token | Hex | Dùng cho |
|---|---|---|
| `--color-dark` | `#111111` | Footer, section tối, nút Dark |
| `--color-dark-deep` | `#0A0C10` | Banner CTA cuối trang, menu toàn màn hình |
| `--color-dark-border` | `#2A2A2A` | Đường kẻ trong vùng tối |
| `--color-on-dark` | `#FFFFFF` | Chữ chính trên nền tối |
| `--color-on-dark-muted` | `#B3B3B3` | Chữ phụ trên nền tối |
| `--color-on-dark-accent` | `#E0BF89` | Nhãn vàng, icon, focus ring trên nền tối |

### 1.5. Trạng thái

| Token | Hex | Subtle (nền) | Text trên subtle | Dùng cho |
|---|---|---|---|---|
| `--color-success` | `#2F7D5B` | `#EAF4EE` | `#1F6B4A` | Gửi form thành công, badge "Đã chốt" (admin) |
| `--color-warning` | `#8A5A0A` ⚠️ | `#FBF1E0` | `#8A5A0A` | "Sắp hết hạn", cảnh báo. DESIGN.md ghi `#B7791F`: 3.64:1, không đủ cho chữ |
| `--color-error` | `#B42318` | `#FBEAE8` | `#B42318` | Lỗi form, trạng thái lỗi |
| `--color-info` | `#2B6CB0` | `#E8F0F9` | `#245A94` | Thông báo trung tính |

Badge nội dung công khai:

| Badge | Nền | Chữ |
|---|---|---|
| Đang mở bán / Sắp mở bán | `--color-primary` | `--color-badge-foreground` |
| Đã bàn giao | `--color-surface-muted` | `--color-text` |
| Đã thuê | `--color-dark` | `--color-on-dark` |
| Đã kết thúc (ưu đãi) | `--color-surface-muted` | `--color-text-muted` |
| Hạn ưu đãi còn ≤ 3 ngày | `--color-warning-subtle` | `--color-warning` |

### 1.6. Khối tối dùng lại token

Lớp `.theme-dark-block` đặt trên section tối, đổi giá trị biến để component (Button, Input, link) tự đúng màu (khai thật trong CSS ở §11):

```css
.theme-dark-block {
  --color-bg: var(--color-dark);
  --color-surface: #1C1C1C;
  --color-text: var(--color-on-dark);
  --color-text-secondary: var(--color-on-dark-muted);
  --color-text-muted: #9A9A9A;          /* 6.7:1 trên #111111 */
  --color-border: var(--color-dark-border);
  --color-input-border: #6E6E6E;
  --color-accent-text: var(--color-on-dark-accent);
  --color-focus-ring: var(--color-on-dark-accent);
}
```

### 1.7. Focus

| Token | Giá trị |
|---|---|
| `--color-focus-ring` | `#8C6733` (nền sáng) · `#E0BF89` (khối tối) |
| `--focus-ring` | `2px solid var(--color-focus-ring)`, `outline-offset: 2px`, chỉ hiện với `:focus-visible` |

## 2. Typography

**Font** (tự host qua `next/font/google`, subset `latin` + `vietnamese`, `display: swap`, chỉ tải đúng weight dùng):

| Token | Font | Weight tải | Fallback |
|---|---|---|---|
| `--font-display` | EB Garamond | 400 (heading) + 500 (tiêu đề thẻ tin nổi bật `font-semibold`) | `Georgia, 'Times New Roman', serif` |
| `--font-sans` | Montserrat | 400, 500, 600 | `system-ui, -apple-system, 'Segoe UI', Arial, sans-serif` |

Không dùng font thứ 3. Không dùng monospace trừ mã tin (`CT-000123`) nếu cần căn số: dùng `font-variant-numeric: tabular-nums` của Montserrat thay vì đổi font.

### 2.1. Thang chữ fluid

> Đơn vị `rem` (root 16px). `clamp()` nội suy từ viewport 375px tới 1280px.

| Token | Font | Size | Line-height | Weight | Kiểu | Dùng cho |
|---|---|---|---|---|---|---|
| `--text-display` | display | `clamp(2rem, 1.3rem + 3.2vw, 3.75rem)` (32→60px) | 1.08 | 400 | Viết thường, `letter-spacing: 0` | Câu chính hero |
| `--text-h1` | display | `clamp(1.875rem, 1.2rem + 2.9vw, 3.5rem)` (30→56px) | 1.1 | 400 | Viết thường | Tiêu đề trang |
| `--text-h2` | display | `clamp(1.625rem, 1.15rem + 2vw, 2.75rem)` (26→44px) | 1.15 | 400 | Viết thường | Tiêu đề section/khối |
| `--text-h2-sm` | display | `clamp(1.5rem, 1.35rem + 0.62vw, 1.875rem)` (24→30px) | 1.2 | 400 | Viết thường | Heading phụ trong nội dung/trang chi tiết (RichText h2, mục chi tiết, form) |
| `--text-h3` | display | `clamp(1.375rem, 1.32rem + 0.25vw, 1.5625rem)` (22→25px) | 1.25 | 400 | Thường | Tên trên thẻ dự án/dịch vụ, tiêu đề bài trên thẻ lớn |
| `--text-h4` | sans | `1.125rem` (18px) | 1.4 | 600 | Thường | Tiêu đề thẻ tin cho thuê, tiêu đề nhóm thông số |
| `--text-lead` | sans | `clamp(1rem, 0.95rem + 0.2vw, 1.125rem)` (16→18px) | 1.6 | 400 | Thường | Câu phụ hero, đoạn mở đầu |
| `--text-body` | sans | `1rem` (16px) | 1.7 | 400 | Thường | Nội dung |
| `--text-small` | sans | `0.875rem` (14px) | 1.5 | 400 | Thường | Nhãn, chú thích, helper, lỗi form |
| `--text-xsmall` | sans | `0.75rem` (12px) | 1.5 | 500 | Thường | Meta (ngày đăng, mã tin). Không dùng cho đoạn văn |
| `--text-eyebrow` | sans | `0.75rem` → `0.8125rem` | 1.4 | 600 | IN HOA, `0.12em`, `--color-accent-text` | Nhãn trên tiêu đề (theo hạn mức §0) |
| `--text-button` | sans | `0.875rem` (14px) | 1 | 600 | IN HOA, `0.08em` | Nút (md, lg) |
| `--text-button-sm` | sans | `0.8125rem` (13px) | 1 | 600 | IN HOA, `0.08em` | Nút size sm |
| `--text-price` | display | `clamp(1.5rem, 1.35rem + 0.62vw, 1.875rem)` | 1.2 | 500 | `tabular-nums`, `--color-accent-display` hoặc `--color-text` | Giá ở trang chi tiết |

**Quy tắc chữ:**
- Heading viết thường (BL-020); chỉ nút, eyebrow, menu in hoa bằng `text-transform: uppercase`, **không** gõ in hoa trong CMS. Tiếng Việt in hoa bằng CSS vẫn giữ dấu đúng khi có `lang` đúng.
- Độ dài dòng nội dung bài: `max-width: 68ch`.
- Tiêu đề hero tối đa 2 dòng ở desktop; câu phụ ≤ 20 từ (taste-skill §4.7).
- Không gạch ngang dài (em-dash/en-dash) trong chuỗi giao diện `vi.json` / `en.json` (taste-skill §9.G); khoảng giá dùng dấu gạch nối `-`.
- Số, ngày theo `Intl` của locale; tiền luôn VNĐ (`5.500.000 ₫/tháng` · `5,500,000 VND/month`). Giá rút gọn trên thẻ: `5,5 triệu/tháng` · `5.5M VND/month`; dự án: `Từ 2,1 tỷ` · `From 2.1B VND`.

## 3. Spacing

| Token | Giá trị | Tailwind |
|---|---|---|
| `--space-1` | 4px | `1` |
| `--space-2` | 8px | `2` |
| `--space-3` | 12px | `3` |
| `--space-4` | 16px | `4` |
| `--space-6` | 24px | `6` |
| `--space-8` | 32px | `8` |
| `--space-12` | 48px | `12` |
| `--space-16` | 64px | `16` |
| `--space-section` | `clamp(4rem, 2.6rem + 6vw, 7.5rem)` (64→120px) | `py-section` |
| `--space-section-tight` | `clamp(3rem, 2.3rem + 3vw, 5rem)` (48→80px) | `py-section-tight` |
| `--gutter` | `clamp(1rem, 0.6rem + 1.7vw, 2rem)` (16→32px) | `px-gutter` |
| `--container-max` | `80rem` (1280px) | `max-w-container` |
| `--container-text` | `48rem` (768px) | Bài viết, trang pháp lý |

Nhịp: khoảng trên tiêu đề lớn hơn khoảng dưới (heading `mb-4`/`mb-6`, section `pt` = `--space-section`). Lưới thẻ `gap: clamp(1rem, 0.7rem + 1.2vw, 2rem)`.

## 4. Radius (Shape Lock)

Thang bo góc (BL-020): vuông ở khối lớn (hero/section), **12/16/20px** cho dropdown/panel/thẻ, **viên thuốc** cho nút/badge/header nổi:

| Token | Giá trị | Áp cho |
|---|---|---|
| `--radius-none` | 0 | Hero, slider, section |
| `--radius-sm` | 2px | Input, select, checkbox, cookie banner |
| `--radius-md` | 12px | Dropdown, popover, dialog, toast, hộp thông báo |
| `--radius-lg` | 16px | Panel |
| `--radius-xl` | 20px | Thẻ (dự án, cho thuê, tin, việc làm) và ảnh trong thẻ |
| `--radius-pill` | 9999px | Nút (Button), badge |
| `--radius-full` | 9999px | Chấm phân trang slider, avatar sale, nút nổi Hotline/Zalo/Fanpage |

shadcn: `--radius: 2px`. **BL-020:** thang bo góc mới (thẻ 20px, nút/badge viên thuốc); bỏ nguyên tắc "không bo 8-16px"; không còn `--text-watermark`/chữ chìm. Nguồn sự thật: `globals.css` + `docs/DESIGN.md`.

## 5. Shadows (ấm, ít)

Card **không** đổ bóng (phân lớp bằng viền `--color-border` hoặc khoảng trắng). Bóng chỉ cho lớp nổi:

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(40, 30, 15, 0.06)` | Thanh mục con dính (header nổi dùng `--shadow-md`) |
| `--shadow-md` | `0 6px 16px -4px rgba(40, 30, 15, 0.12)` | Dropdown, popover, khung giá dính (desktop) |
| `--shadow-lg` | `0 16px 40px -8px rgba(40, 30, 15, 0.18)` | Dialog, cookie banner, nút nổi |

## 6. Motion

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--duration-fast` | 150ms | Hover màu, focus |
| `--duration-base` | 250ms | Dropdown, accordion, header đổi nền |
| `--duration-slow` | 450ms | Ảnh phóng khi hover, menu toàn màn hình mở |
| `--duration-reveal` | 700ms | Chữ hero hiện dần, nội dung trượt lên khi cuộn tới |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Mặc định (exponential ease-out) |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Chuyển trạng thái UI |
| `--slider-interval` | 6000ms | Hero tự chuyển slide |
| `--hover-zoom` | `scale(1.03)` | Ảnh thẻ khi hover |
| `--reveal-distance` | 24px | Trượt lên khi reveal |

**Quy tắc:**
- Chỉ animate `transform` và `opacity`. Không animate `width/height/top/left`, không blur/backdrop-filter động.
- Reveal khi cuộn: IntersectionObserver hoặc CSS `animation-timeline: view()`, **cấm** `window.addEventListener('scroll')`. Mỗi trang chỉ có **một** kiểu reveal (trượt lên + hiện), stagger 80ms trong lưới, không áp cho nội dung trên màn đầu (giữ LCP).
- Hero: slide tự chạy, có nút Dừng/Phát (WCAG 2.2.2), dừng khi hover/focus, dừng hẳn khi tab ẩn.
- `@media (prefers-reduced-motion: reduce)`: tắt autoplay, tắt reveal/zoom (hiện ngay), chuyển slide tức thì, không phát video nền (hiện ảnh poster).
- Không parallax, không cursor tuỳ biến, không marquee (khối đối tác dùng lưới logo, không chạy chữ).

## 7. Z-index

| Token | Giá trị | Lớp |
|---|---|---|
| `--z-base` | 0 | Nội dung |
| `--z-raised` | 10 | Mũi tên slider, nhãn trên ảnh |
| `--z-sticky` | 20 | Thanh mục con dính (chi tiết dự án), khung giá dính, thanh lọc dính mobile |
| `--z-header` | 30 | Header |
| `--z-floating` | 40 | Nút nổi Hotline/Zalo/Fanpage |
| `--z-cookie` | 45 | Cookie banner |
| `--z-overlay` | 50 | Menu toàn màn hình, sheet bộ lọc mobile, lightbox thư viện ảnh |
| `--z-modal` | 60 | Dialog |
| `--z-toast` | 70 | Toast |

Không dùng z-index ngoài bảng này. Khai trong một file hằng số (vd `src/styles/tokens.css`).

## 8. Breakpoints

| Tên | Min-width | Tailwind | Ghi chú |
|---|---|---|---|
| base | 0 (thiết kế ở **375px**) | (mặc định) | Viết style mobile trước. 375px là chiều rộng kiểm tra tối thiểu, không có media query riêng |
| `sm` | 640px | `sm:` | Điện thoại lớn |
| `md` | 768px | `md:` | Tablet |
| `lg` | 1024px | `lg:` | Laptop |
| `xl` | 1280px | `xl:` | Desktop, menu ngang hiện |
| `2xl` | 1536px | `2xl:` | Màn lớn: chỉ nới khoảng trắng, container vẫn 1280px, hero/slider tràn viền |

Mặc định Tailwind v4 đã đúng các mốc này: **không** khai lại. Component trong lưới (thẻ tin, thẻ dự án) dùng container query `@container` khi bố cục phụ thuộc chiều rộng ô chứ không phải viewport.

Chiều rộng kiểm tra bắt buộc ở review: **375 / 768 / 1280** (gate `skills/responsive-web`), khuyến nghị thêm 1024 và 1536.

## 9. Kiểm tra tương phản WCAG 2.1 AA

> Tính bằng công thức relative luminance của WCAG, 16/10/2026. Ngưỡng: chữ thường 4.5:1, chữ lớn (≥ 24px hoặc ≥ 18.66px đậm) 3:1, thành phần UI 3:1.

| Cặp (chữ / nền) | Tỉ lệ | Kết quả |
|---|---|---|
| `text #141414` / `bg #F7F5F4` | 16.95 | ✅ AAA |
| `text #141414` / `surface #FFFFFF` | 18.42 | ✅ AAA |
| `text-secondary #555555` / `bg #F7F5F4` | 6.86 | ✅ AA |
| `text-secondary #555555` / `primary-subtle #F8F3EB` | 6.75 | ✅ AA |
| `text-muted #6B6B6B` / `bg #F7F5F4` | 4.90 | ✅ AA |
| `text-muted #6B6B6B` / `surface #FFFFFF` | 5.33 | ✅ AA |
| `text-muted #6B6B6B` / `surface-muted #F1F0EE` | 4.68 | ✅ AA |
| `text-muted #6B6B6B` / `primary-subtle #F8F3EB` | 4.82 | ✅ AA |
| ~~`#767676` (DESIGN.md) / `bg #F7F5F4`~~ | 4.18 | ❌ → đã thay bằng `#6B6B6B` |
| `accent-text #8C6733` / `surface #FFFFFF` | 5.12 | ✅ AA |
| `accent-text #8C6733` / `bg #F7F5F4` | 4.71 | ✅ AA |
| `accent-text #8C6733` / `primary-subtle #F8F3EB` | 4.63 | ✅ AA |
| `accent-text #8C6733` / `surface-muted #F1F0EE` | 4.49 | ❌ không dùng cặp này |
| `accent-display #A07A3F` / `bg #F7F5F4` (chữ lớn) | 3.61 | ✅ AA large |
| ~~`#B58C50` (DESIGN.md) / `bg #F7F5F4`~~ | 2.83 | ❌ → đã thay bằng `#A07A3F` |
| `primary-foreground #141414` / `primary #E0BF89` | 10.51 | ✅ AAA |
| `primary-foreground #141414` / `primary-hover #D4AF72` | 8.93 | ✅ AAA |
| `badge-foreground #3C2704` / `primary #E0BF89` | 8.07 | ✅ AAA |
| `on-dark #FFFFFF` / `dark #111111` | 18.88 | ✅ AAA |
| `on-dark-muted #B3B3B3` / `dark #111111` | 9.01 | ✅ AAA |
| `on-dark-muted #B3B3B3` / `dark-deep #0A0C10` | 9.33 | ✅ AAA |
| `on-dark-accent #E0BF89` / `dark #111111` | 10.78 | ✅ AAA |
| `#9A9A9A` (muted trong khối tối) / `dark #111111` | 6.71 | ✅ AA |
| `error #B42318` / `surface #FFFFFF` | 6.57 | ✅ AA |
| `error #B42318` / `error-subtle #FBEAE8` | 5.65 | ✅ AA |
| `#FFFFFF` / `success #2F7D5B` (nút/toast) | 4.99 | ✅ AA |
| `success-text #1F6B4A` / `success-subtle #EAF4EE` | 5.73 | ✅ AA |
| `warning #8A5A0A` / `surface #FFFFFF` | 5.92 | ✅ AA |
| `warning #8A5A0A` / `warning-subtle #FBF1E0` | 5.29 | ✅ AA |
| ~~`#B7791F` (DESIGN.md) / `#FFFFFF`~~ | 3.64 | ❌ → đã thay bằng `#8A5A0A` |
| `info-text #245A94` / `info-subtle #E8F0F9` | 6.16 | ✅ AA |
| **UI:** `input-border #857F79` / `surface #FFFFFF` | 3.96 | ✅ 1.4.11 |
| **UI:** `input-border #857F79` / `bg #F7F5F4` | 3.64 | ✅ 1.4.11 |
| **UI:** `focus-ring #8C6733` / `bg #F7F5F4` | 4.71 | ✅ 1.4.11 |
| **UI:** `border #E8E6E3` / `surface #FFFFFF` | 1.25 | ⚠️ chỉ trang trí, không dùng làm viền input |
| **UI:** nút Primary nền `#E0BF89` / `surface #FFFFFF` | 1.75 | ⚠️ nhận diện nút nhờ chữ 10.5:1 + kích thước; nút Primary trên nền trắng phải có chữ, không làm nút icon-only màu vàng |

**Chữ trên ảnh** (hero, slider, thẻ dịch vụ): chữ `#FFFFFF` luôn có scrim `linear-gradient(to top, rgba(10,12,16,0.72), rgba(10,12,16,0.15) 60%)` hoặc lớp `--color-overlay`; tối thiểu nền dưới chữ tương đương `#59595A` (7.0:1). Reviewer kiểm tra bằng ảnh sáng nhất trong bộ dữ liệu mẫu.

## 10. Component tokens

| Component | Quy định |
|---|---|
| Button | Cao: sm 36px (chỉ desktop), md 44px, lg 52px. Bo viên thuốc `--radius-pill` (BL-020). Padding ngang 20/24/32px. Chữ `--text-button` (sm: `--text-button-sm`). Primary: nền `--color-primary`, chữ `--color-primary-foreground`. Secondary: nền `--color-surface`, viền `--color-border`, chữ `--color-accent-text`. Outline: viền 1px `--color-text`, nền trong suốt, hover nền `--color-text` chữ `--color-surface`. Dark: nền `--color-dark`, chữ `--color-on-dark`. Ghost: chỉ chữ + gạch chân khi hover. Chip: viền `--color-on-dark` 30%, nền trong suốt — CHỈ dùng trong `.theme-dark-block` hoặc trên scrim ≥ `--color-overlay`. `:active` `translateY(1px)`. Disabled: opacity 0.5 + `cursor: not-allowed`. Nhãn 1 dòng ở desktop, không đặt `max-width` |
| Input/Select/Textarea | Cao 48px (textarea ≥ 120px). Viền 1px `--color-input-border`, nền `--color-surface`, focus: viền `--color-focus-ring` + ring. Lỗi: viền `--color-error` + icon + chữ lỗi dưới ô. Label luôn hiện phía trên (không dùng placeholder làm label) |
| Checkbox | Ô 20px, vùng chạm 44px (label bấm được) |
| Chip/Tab lọc | Cao 40px (mobile 44px). Mặc định viền `--color-border` chữ `--color-text-secondary`; đang chọn nền `--color-primary-soft` chữ `--color-text`, `aria-pressed`/`aria-selected` |
| Card ảnh | Tỉ lệ ảnh cố định: dự án 4:5 (mobile) / 4:3 (≥ md); tin cho thuê 4:3; tin/ưu đãi 16:10; dịch vụ 3:4. `object-fit: cover`, `sizes` khai đúng cột |
| Header | Thanh nổi bo viên thuốc kính mờ sáng (BL-020): cao 64px mobile, 72px ≥ lg, cách mép 8/16px; chiếm `--header-offset` trong luồng. Logo 32px mobile, 40px desktop |
| Touch target | ≥ 44×44px cho mọi nút/link điều khiển trên mobile; khoảng cách giữa 2 target ≥ 8px |
| Icon | Bộ **Phosphor Icons** (`@phosphor-icons/react`, weight `light`/`regular`), 20px/24px, `aria-hidden` khi đi kèm chữ. Không emoji, không vẽ SVG tay (trừ logo) |

## 11. Mapping sang Tailwind v4 + shadcn/ui

Ba lớp, **không** khai cùng một tên biến ở hai nơi (tránh vòng tham chiếu `--color-primary` ↔ `--primary`):

1. `@theme` (không `inline`): giá trị gốc TAMI. Tailwind xuất ra `:root` và sinh utility tham chiếu biến (`bg-primary` → `var(--color-primary)`), nên `.theme-dark-block` ghi đè được.
2. `:root, .theme-dark-block`: biến ngữ nghĩa của shadcn trỏ về token TAMI. Khai trên **cả hai** selector để biến được tính lại trong khối tối (custom property tính giá trị tại phần tử khai báo).
3. `@theme inline`: chỉ các tên shadcn **chưa có** ở lớp 1.

`src/app/(frontend)/globals.css` (đường dẫn gợi ý, builder theo ARCHITECTURE §4):

```css
@import "tailwindcss";

/* 1. Token gốc TAMI */
@theme {
  --color-primary: #E0BF89;
  --color-primary-hover: #D4AF72;
  --color-primary-foreground: #141414;
  --color-primary-soft: #EAD3AE;
  --color-primary-subtle: #F8F3EB;
  --color-accent-text: #8C6733;
  --color-accent-display: #A07A3F;
  --color-badge-foreground: #3C2704;

  --color-bg: #F7F5F4;
  --color-bg-alt: #FAF8F6;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F0EE;
  --color-border: #E8E6E3;
  --color-input-border: #857F79;
  --color-overlay: rgb(10 12 16 / 0.55);

  --color-text: #141414;
  --color-text-secondary: #555555;
  --color-text-muted: #6B6B6B;

  --color-dark: #111111;
  --color-dark-deep: #0A0C10;
  --color-dark-border: #2A2A2A;
  --color-on-dark: #FFFFFF;
  --color-on-dark-muted: #B3B3B3;
  --color-on-dark-accent: #E0BF89;

  --color-success: #2F7D5B;  --color-success-subtle: #EAF4EE;  --color-success-text: #1F6B4A;
  --color-warning: #8A5A0A;  --color-warning-subtle: #FBF1E0;
  --color-error: #B42318;    --color-error-subtle: #FBEAE8;
  --color-info: #2B6CB0;     --color-info-subtle: #E8F0F9;    --color-info-text: #245A94;
  --color-focus-ring: #8C6733;

  --font-display: var(--font-eb-garamond), Georgia, "Times New Roman", serif;
  --font-sans: var(--font-montserrat), system-ui, -apple-system, "Segoe UI", Arial, sans-serif;

  --radius-sm: 2px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;  /* thẻ */
  --radius-pill: 9999px;

  --shadow-sm: 0 1px 2px rgb(40 30 15 / 0.06);
  --shadow-md: 0 6px 16px -4px rgb(40 30 15 / 0.12);
  --shadow-lg: 0 16px 40px -8px rgb(40 30 15 / 0.18);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);

  --spacing-section: clamp(4rem, 2.6rem + 6vw, 7.5rem);
  --spacing-section-tight: clamp(3rem, 2.3rem + 3vw, 5rem);
  --spacing-gutter: clamp(1rem, 0.6rem + 1.7vw, 2rem);
  --container-container: 80rem;
  --container-text: 48rem;
}

/* 2. Biến ngữ nghĩa shadcn/ui */
:root,
.theme-dark-block {
  --background: var(--color-bg);
  --foreground: var(--color-text);
  --card: var(--color-surface);
  --card-foreground: var(--color-text);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-text);
  --primary: var(--color-primary);
  --primary-foreground: var(--color-primary-foreground);
  --secondary: var(--color-surface-muted);
  --secondary-foreground: var(--color-text);
  --muted: var(--color-surface-muted);
  --muted-foreground: var(--color-text-muted);
  --accent: var(--color-primary-soft);
  --accent-foreground: var(--color-text);
  --destructive: var(--color-error);
  --border: var(--color-border);
  --input: var(--color-input-border);
  --ring: var(--color-focus-ring);
  --radius: 2px;
}

/* Khối tối: đổi giá trị token gốc (xem §1.6) */
.theme-dark-block {
  --color-bg: var(--color-dark);
  --color-surface: #1C1C1C;
  --color-text: var(--color-on-dark);
  --color-text-secondary: var(--color-on-dark-muted);
  --color-text-muted: #9A9A9A;
  --color-border: var(--color-dark-border);
  --color-input-border: #6E6E6E;
  --color-accent-text: var(--color-on-dark-accent);
  --color-focus-ring: var(--color-on-dark-accent);
  background-color: var(--color-bg);
  color: var(--color-text);
}

/* 3. Tên shadcn chưa có ở lớp 1 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Sau khi `pnpm dlx shadcn init` sinh `components.json` + CSS mặc định, **thay** khối biến mặc định (oklch) bằng khối trên; giữ `cssVariables: true`, `baseColor` không quan trọng vì đã ghi đè.

Biến font sinh bởi `next/font`:

```ts
// src/app/(frontend)/fonts.ts
import { EB_Garamond, Montserrat } from 'next/font/google'
export const ebGaramond = EB_Garamond({ subsets: ['latin', 'vietnamese'], weight: ['400', '500'], variable: '--font-eb-garamond', display: 'swap' })
export const montserrat = Montserrat({ subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600'], variable: '--font-montserrat', display: 'swap' })
```

**Tuỳ biến shadcn bắt buộc** (taste-skill §9.E, không để mặc định): thang radius BL-020 (2/12/16/20px, nút/badge pill), font Montserrat, nút chữ in hoa, focus ring vàng đậm, Dialog/Sheet dùng `--color-overlay`, bỏ shadow mặc định của Card.

## 12. Thay đổi so với `docs/DESIGN.md`

| Token | DESIGN.md | Tokens này | Lý do |
|---|---|---|---|
| Text Muted | `#767676` | `#6B6B6B` | 4.18:1 trên nền trang `#F7F5F4` (ghi chú "đạt 4.5:1" của DESIGN.md chỉ đúng trên nền trắng) |
| Accent Display | `#B58C50` | `#A07A3F` | 2.83:1 trên nền trang, không đạt 3:1 cho chữ lớn |
| Warning | `#B7791F` | `#8A5A0A` | 3.64:1, không đạt cho chữ |
| Input Border | (không có) | `#857F79` | Viền input `#E8E6E3` chỉ 1.25:1, không đạt WCAG 1.4.11 |
| Primary Hover, Overlay, các màu `*-subtle`/`*-text` trạng thái, Focus ring | (không có) | bổ sung | Trạng thái tương tác + badge |

`docs/DESIGN.md` **chưa** được sửa (workflow `.agent/design.md` không yêu cầu). Đề xuất cập nhật 4 giá trị trên vào DESIGN.md sau khi user confirm tokens; tới lúc đó **file này là nguồn đúng** cho builder.
