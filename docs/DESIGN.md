# Design Specification

> Paste Figma links, design notes, or upload screenshots.
> Agent will extract design tokens and screen specs from this file.

---

## Design References

**Figma Link:** (chưa có)
**Design Tool:** —

**Reference Images:**
- 6 ảnh mockup TAMI HOMES (Trang chủ, Danh sách dự án, Chi tiết dự án, Chi tiết căn, Tin tức, Tuyển dụng), user gửi ngày 16/10/2026.
- Bộ logo chính thức: `assets/brand/` (xem § Logo).
- ⚠️ **Chỉ lấy BẢNG MÀU** từ các ảnh này. **Không** lấy bố cục, menu, component hay nội dung (mockup có mục "Mua bán", "Về chúng tôi"… không khớp phạm vi `docs/BRD.md` v1.3). Bố cục và component sẽ làm ở bước `/design`.

---

## Brand & Visual Identity

### Color Palette

> Đo trực tiếp từ pixel ảnh mockup (16/10/2026). Phong cách: **vàng champagne + đen + nền kem**, cảm giác cao cấp.
> Một số màu chữ đã được **chỉnh đậm hơn mockup** để đạt chuẩn tương phản WCAG AA (cột "Ghi chú").

**Bảng màu chính**

| Token | Value | Usage | Ghi chú |
|-------|-------|-------|---------|
| Primary | `#E0BF89` | Nền nút chính (Liên hệ, Tìm kiếm, Nhận tư vấn), badge trạng thái, tab đang chọn | Đo từ nút chính (#E0BE87 – #E2C491) |
| Primary Foreground | `#141414` | Chữ / icon trên nền Primary | Tương phản 10.5:1 |
| Primary Soft | `#EAD3AE` | Chip danh mục, tab lọc đang chọn, nền hover nhẹ | Đo từ tab "Tất cả", chip "Thị trường" (#E6C89B – #E9D0AA) |
| Primary Subtle | `#F8F3EB` | Nền khối nổi bật (panel lợi ích, vùng nhấn kem) | Đo từ panel bên phải trang chi tiết |
| Accent Text | `#8C6733` | Chữ vàng cỡ nhỏ: link "Xem tất cả", "Đọc thêm", nhãn eyebrow (DỰ ÁN, TIN TỨC), tab active | Mockup ~#B58C50 chỉ đạt 3.1:1 trên nền trắng → **đậm lên** để đạt 5.1:1 |
| Accent Display | `#B58C50` | Giá tiền cỡ lớn (≥ 24px), icon viền vàng, gạch chân tab | Chỉ dùng cho chữ lớn / icon (đạt 3:1) |
| Badge Foreground | `#3C2704` | Chữ trên badge vàng ("Đang mở bán") | Đo từ badge, 8.1:1 |

**Nền & bề mặt**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F7F5F4` | Nền trang (xám ấm rất nhạt) |
| Background Alt | `#FAF8F6` | Nền section xen kẽ |
| Surface | `#FFFFFF` | Card, form, thanh tìm kiếm, dropdown |
| Surface Muted | `#F1F0EE` | Chip/tag trung tính ("Biệt thự", "Căn hộ"), ô input disabled |
| Border | `#E8E6E3` | Viền card, input, đường kẻ chia | 

**Tối (section tối, footer, banner CTA)**

| Token | Value | Usage |
|-------|-------|-------|
| Dark | `#111111` | Footer, section "Kiến tạo giá trị sống", nút tối ("Tải tài liệu PDF") |
| Dark Deep | `#0A0C10` | Banner CTA cuối trang (đen ánh xanh rất nhẹ) |
| Dark Border | `#2A2A2A` | Đường kẻ trong vùng tối |
| On Dark | `#FFFFFF` | Tiêu đề / chữ chính trên nền tối |
| On Dark Muted | `#B3B3B3` | Chữ phụ trên nền tối (9:1) |
| On Dark Accent | `#E0BF89` | Nhãn vàng, icon trên nền tối (10.8:1) |

**Chữ**

| Token | Value | Usage | Ghi chú |
|-------|-------|-------|---------|
| Text Primary | `#141414` | Tiêu đề, tên dự án/tin, giá trị thông số | Đo từ heading (#090909 – #141413) |
| Text Secondary | `#555555` | Đoạn mô tả, nội dung bài viết | 7.5:1 |
| Text Muted | `#767676` | Địa chỉ, ngày đăng, nhãn thông số ("Diện tích", "Bàn giao"), placeholder | Mockup ~#8A–#A0 chưa đạt AA → **đậm lên** để đạt 4.5:1 |

**Trạng thái** (mockup không có, đề xuất cho hợp tông ấm)

| Token | Value | Usage |
|-------|-------|-------|
| Success | `#2F7D5B` | Gửi form thành công, trạng thái "Đã chốt" |
| Warning | `#B7791F` | Sắp hết hạn ưu đãi, cảnh báo |
| Error | `#B42318` | Lỗi form, trạng thái lỗi |
| Info | `#2B6CB0` | Thông báo trung tính |

**Gợi ý CSS variables** (để `/design` sinh tokens chính thức):

```css
:root {
  --color-primary: #E0BF89;
  --color-primary-foreground: #141414;
  --color-primary-soft: #EAD3AE;
  --color-primary-subtle: #F8F3EB;
  --color-accent-text: #8C6733;
  --color-accent-display: #B58C50;
  --color-badge-foreground: #3C2704;

  --color-bg: #F7F5F4;
  --color-bg-alt: #FAF8F6;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F0EE;
  --color-border: #E8E6E3;

  --color-dark: #111111;
  --color-dark-deep: #0A0C10;
  --color-dark-border: #2A2A2A;
  --color-on-dark: #FFFFFF;
  --color-on-dark-muted: #B3B3B3;

  --color-text: #141414;
  --color-text-secondary: #555555;
  --color-text-muted: #767676;

  --color-success: #2F7D5B;
  --color-warning: #B7791F;
  --color-error: #B42318;
  --color-info: #2B6CB0;
}
```

> Website chỉ dùng **giao diện sáng** (light), có các section tối xen kẽ như mockup. Không làm dark mode toàn trang ở giai đoạn 1.

### Logo

Logo chính thức **TAMI HOMES** (biểu tượng mái nhà ghép chữ "T" + chữ "TAMI HOMES" bên dưới). Bản gốc lưu ở `assets/brand/`, **không sửa, không xoá**.

| File | Biến thể | Dùng ở đâu |
|---|---|---|
| `assets/brand/source/tami-homes-logo.ai` | **Bản gốc vector** (Illustrator, tương thích PDF) | Nguồn để xuất SVG / mọi kích thước khác |
| `assets/brand/tami-logo-gold.png` | Vàng gradient, nền trong suốt | **Logo chính**: header nền sáng, trang chủ, ảnh chia sẻ (OG), email |
| `assets/brand/tami-logo-white.png` | Trắng, nền trong suốt | Header đè lên ảnh hero, section tối, footer (`--color-dark`) |
| `assets/brand/tami-logo-dark.png` | Đen, nền trong suốt | Header nền sáng khi cuộn trang (sticky), bản in |
| `assets/brand/tami-logo-gray.png` | Xám, nền trong suốt | Dự phòng (văn bản, in ấn), hạn chế dùng trên web |

**Việc builder phải làm khi dựng giao diện** (sinh vào `public/brand/`, không sửa file trong `assets/brand/`):

1. **Xuất SVG** từ file `.ai` (Inkscape / Illustrator), bản vàng / trắng / đen. SVG là định dạng chính cho web; PNG chỉ là dự phòng.
2. **Cắt sát** (trim): các file PNG gốc có nhiều khoảng trắng thừa quanh logo (khổ ngang ~3000×2100px). Bản web phải sát viền, giữ khoảng thở tối thiểu bằng 1/4 chiều cao biểu tượng mái nhà.
3. **Tạo bản icon** (chỉ biểu tượng mái nhà, không chữ) cho: `favicon.ico` (32×32), `icon.svg`, `apple-touch-icon.png` (180×180, nền `#111111` hoặc `#F7F5F4`), icon PWA 192/512, avatar mạng xã hội.
4. **Ảnh OG mặc định** 1200×630: logo vàng trên nền `#111111` hoặc `#F7F5F4`.
5. Logo chèn qua `next/image` hoặc SVG inline, có `alt="TAMI HOMES"`; header cao ~40–48px trên desktop, ~32px trên mobile.

**Quy tắc dùng logo:**
- Không kéo méo tỉ lệ, không đổi màu ngoài 4 biến thể trên, không thêm bóng đổ / viền.
- Logo vàng chỉ đặt trên nền sáng (`#FFFFFF`, `#F7F5F4`, `#F8F3EB`) hoặc nền tối đặc (`#111111`). Trên ảnh chụp thì dùng bản trắng.
- Màu vàng của logo khớp với `--color-primary` (`#E0BF89`); gradient trong logo giữ nguyên, **không** áp gradient cho các thành phần UI khác.

> Logo cũng được upload vào `site-settings.logo` / `logoDark` trong admin (`docs/ERD.md` §4.15) để admin đổi được mà không sửa code. Bản trong `public/brand/` là bản mặc định khi chưa cấu hình.

### Typography

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Heading 1 | | 36px | 700 | Page titles |
| Heading 2 | | 24px | 600 | Section titles |
| Heading 3 | | 20px | 600 | Card titles |
| Body | | 16px | 400 | Body text |
| Small | | 14px | 400 | Labels, captions |
| XSmall | | 12px | 400 | Meta, hints |

### Spacing Scale

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
| 2xl | 48px |
| 3xl | 64px |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 4px | Inputs, tags |
| md | 8px | Cards |
| lg | 12px | Modals |
| full | 9999px | Pills, avatars |

---

## Screen Inventory

List all screens and their key UI elements:

### Screen: [Name] (e.g. Login)
- **Route:** `/login`
- **Layout:** [Centered / Full width / Split]
- **Components:** Logo, Email input, Password input, Submit button, Forgot password link
- **States:** Default, Loading, Error
- **Notes:** [Any special behavior]

### Screen: [Name] (e.g. Dashboard)
- **Route:** `/dashboard`
- **Layout:**
- **Components:**
- **States:**
- **Notes:**

---

## Component Library

| Component | Variants | Notes |
|-----------|----------|-------|
| Button | Primary, Secondary, Danger, Ghost | Sizes: sm, md, lg |
| Input | Default, Error, Disabled | With/without label |
| Card | Default, Hoverable, Selected | |
| Modal | Small, Medium, Large | |
| Table | Basic, Sortable, Paginated | |
| Badge | Info, Success, Warning, Error | |

---

## Design Style

- **Overall feel:** [Minimal / Modern / Corporate / Playful]
- **Color scheme:** [Light / Dark / Both]
- **UI Library:** [shadcn/ui / MUI / Tailwind only / Custom]
- **Animation level:** [None / Subtle / Rich]

---

## Responsive Breakpoints (Mobile-First)

> **MANDATORY:** Đọc `skills/responsive-web/SKILL.md` + `skills/responsive-web/responsive.md` trước khi thiết kế responsive. Skill chứa kỹ thuật cụ thể (container queries, fluid typography, checklist gate).

| Breakpoint | Width | Tailwind | Target |
|------------|-------|----------|--------|
| Base (Mobile) | < 640px | (default) | Phone — viết styles mặc định trước |
| sm | ≥ 640px | `sm:` | Large phones, small tablets |
| md | ≥ 768px | `md:` | Tablets |
| lg | ≥ 1024px | `lg:` | Laptops |
| xl | ≥ 1280px | `xl:` | Desktops |
| 2xl | ≥ 1536px | `2xl:` | Large screens |

**Nguyên tắc:**
- **Mobile-first**: viết base styles cho mobile → dùng `min-width` media query (Tailwind `sm:`/`md:`/...) để enhance cho màn hình lớn hơn.
- **Content-based breakpoints**: đặt breakpoint nơi content cần thay đổi, không theo thiết bị cụ thể.
- **Ưu tiên fluid** (`clamp()`, `rem`, `%`, `fr`, `vw`) hơn fixed `px`.
- **Container queries** cho component-level responsive (độc lập viewport).

## Responsive Behavior (BẮT BUỘC cho mỗi screen)

Với TỪNG screen trong Screen Inventory, khai báo rõ responsive behavior:

```markdown
### Screen: [Name]
- **Mobile (< 640px):** [layout mobile — stack dọc, hamburger nav, cột đơn, ...]
- **Tablet (≥ 768px):** [layout tablet — 2 cột, sidebar xuất hiện, ...]
- **Desktop (≥ 1024px):** [layout desktop — full grid, nav ngang, ...]
- **Large (≥ 1280px):** [layout large — tối đa columns, nới spacing, ...]
```

Không được bỏ trống mục này — Review sẽ FAIL nếu thiếu.

