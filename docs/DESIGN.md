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
- ⚠️ **Chỉ lấy BẢNG MÀU** từ các ảnh này. **Không** lấy bố cục, menu, component hay nội dung (mockup có mục "Mua bán", "Về chúng tôi"… không khớp phạm vi `docs/BRD.md` v1.3).

**Website tham chiếu bố cục & phong cách: https://vinhomes.vn** (chốt 16/10/2026)

| Lấy từ vinhomes.vn | Không lấy |
|---|---|
| Bố cục trang, nhịp section, cách sắp khối (xem § Design Style) | Logo, tên, slogan, ảnh, video, icon, chữ của Vinhomes |
| Kiểu chữ: tiêu đề serif in hoa + chữ thường sans-serif | Font thương mại (GaramondPremrPro, UTM…): dùng font miễn phí tương đương (§ Typography) |
| Cách chuyển động: hero full màn hình, slider dự án, hover nhẹ | Màu: dùng bảng màu TAMI bên dưới |
| Cách chia URL theo ngôn ngữ (VI / EN) | Menu, mục nội dung ngoài phạm vi BRD (Mua, Quan hệ cổ đông, Virtual Tour, app cư dân…) |

> "Giống vinhomes.vn" nghĩa là **giống bố cục và cảm giác**, không phải sao chép. Toàn bộ nội dung, ảnh, thương hiệu là của TAMI (BRD LGL-04).

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

> Theo phong cách vinhomes.vn: tiêu đề **serif** (họ Garamond), chữ thường **sans-serif** (Montserrat).
> Vinhomes dùng font thương mại nên TAMI dùng bản **miễn phí (SIL OFL)** tương đương, tự host bằng `next/font`.
> Cả hai font **phải hiển thị đủ dấu tiếng Việt** (đã có bộ ký tự `vietnamese`). Nếu TAMI có font thương hiệu riêng thì thay ở đây (BRD Q2).

| Vai trò | Font | Fallback |
|---|---|---|
| Display (tiêu đề, tên dự án, chữ chìm) | **EB Garamond** (subset `latin`, `vietnamese`) | `Georgia, 'Times New Roman', serif` |
| Text (nội dung, menu, nút, form) | **Montserrat** (subset `latin`, `vietnamese`) | `system-ui, Arial, sans-serif` |

| Token | Font | Size (mobile → desktop) | Weight | Kiểu | Usage |
|-------|------|------|--------|------|-------|
| Display XL | EB Garamond | `clamp(32px, 5vw, 56px)` | 500 | IN HOA, letter-spacing 0.02em | Câu chính trên hero |
| Watermark | EB Garamond | `clamp(64px, 14vw, 180px)` | 500 | IN HOA, màu `--color-primary` độ mờ ~12% | Chữ chìm to phía sau tiêu đề section (vd "TAMI", "DỰ ÁN") |
| Heading 1 | EB Garamond | `clamp(28px, 4vw, 40px)` | 500 | IN HOA | Tiêu đề section, tiêu đề trang |
| Heading 2 | EB Garamond | `clamp(24px, 3vw, 30px)` | 500 | IN HOA | Tên dự án trên slider, tiêu đề khối |
| Heading 3 | EB Garamond | 22–25px | 500 | Thường | Tên thẻ (dự án, dịch vụ) |
| Eyebrow | Montserrat | 12–13px | 600 | IN HOA, letter-spacing 0.12em, `--color-accent-text` | Nhãn nhỏ trên tiêu đề ("KHU ĐÔ THỊ", "DỰ ÁN") |
| Body | Montserrat | 15–16px, line-height 1.7 | 400 | Thường | Nội dung |
| Small | Montserrat | 14px | 400 | Thường | Nhãn, chú thích |
| XSmall | Montserrat | 12px | 500 | Thường | Meta, ngày đăng |
| Button | Montserrat | 13–14px | 600 | IN HOA, letter-spacing 0.08em | Nút ("KHÁM PHÁ DỰ ÁN", "XEM TẤT CẢ") |

> In hoa bằng CSS `text-transform: uppercase`, **không** gõ in hoa trong CMS (để SEO và bản dịch giữ chữ thường).
> Tiếng Anh thường **ngắn hơn** tiếng Việt khoảng 10–20%, nhưng một số nhãn lại dài hơn (vd "Liên hệ" → "Contact us"): nút và menu không đặt chiều rộng cố định.

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

> Theo vinhomes.vn: góc **vuông hoặc gần vuông**, cảm giác kiến trúc, sang trọng. Không bo tròn lớn.

| Token | Value | Usage |
|-------|-------|-------|
| none | 0 | Ảnh full-bleed, slider, section, thẻ dự án |
| sm | 2px | Nút, input, tag, thẻ tin |
| md | 4px | Dropdown, popover, modal |
| full | 9999px | Chấm phân trang slider, avatar sale, nút nổi Hotline/Zalo |

---

## Screen Inventory

> Danh sách màn lấy theo `docs/BRD.md` §2. Cột "Bố cục tham chiếu" là **khung** theo vinhomes.vn; spec chi tiết (component, trạng thái, responsive) do bước `/design` viết vào `.context/design-spec.md`.
> Mỗi màn có **2 bản ngôn ngữ**, cùng một bố cục (URL theo `docs/BRD.md` §2.1).

| Màn | Route VI · EN | Bố cục tham chiếu (vinhomes.vn) |
|---|---|---|
| Trang chủ | `/` · `/en` | Hero full màn hình (ảnh/video, câu chính serif in hoa ở giữa, chữ chạy nhẹ) → dải giới thiệu ngắn + số liệu (kiểu "Thương hiệu… / Top 10…") → dải 4 lối tắt (Dự án · Cho thuê · Ưu đãi · Liên hệ) → **Dự án nổi bật**: tiêu đề + chữ chìm phía sau, slider full-bleed mỗi slide 1 dự án (ảnh lớn + khung chữ: tagline, TÊN DỰ ÁN, mô tả, nút "KHÁM PHÁ DỰ ÁN"), chấm phân trang → **Dịch vụ**: tiêu đề giữa + 3 thẻ ảnh có eyebrow → Ưu đãi nổi bật (lưới thẻ) → Đối tác (dải logo) → banner CTA tối → footer tối |
| Danh sách dự án | `/du-an` · `/en/projects` | Banner ảnh + tiêu đề serif → bộ lọc dạng tab/chip → lưới thẻ dự án ảnh lớn (ảnh, eyebrow loại hình, tên serif, địa điểm) |
| Chi tiết dự án | `/du-an/[slug]` · `/en/projects/[slug]` | Hero ảnh full màn hình + tên dự án → thanh mục con dính khi cuộn (Tổng quan · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Thư viện) → các section xen nền sáng/kem/tối → form để lại thông tin |
| Cho thuê (danh sách) | `/cho-thue` · `/en/for-rent` | Banner + thanh tìm kiếm/lọc → lưới thẻ tin (ảnh, giá, diện tích, phòng, khu vực) + phân trang |
| Chi tiết tin cho thuê | `/cho-thue/[slug]` · `/en/for-rent/[slug]` | Thư viện ảnh lớn → 2 cột: thông số + mô tả / khung giá + sale phụ trách + form (dính khi cuộn) → tin tương tự |
| Đăng tin BĐS | `/tin-bds` · `/en/property-news` | Tab danh mục → lưới thẻ tin/ưu đãi (nhãn "Đã kết thúc" khi hết hạn) |
| Chi tiết bài Đăng tin BĐS | `/tin-bds/[slug]` · `/en/property-news/[slug]` | Ảnh bìa → nội dung 1 cột rộng vừa đọc → khối ưu đãi/voucher → form liên hệ |
| Tin tức | `/tin-tuc` · `/en/news` | Bài nổi bật lớn + lưới bài, tab danh mục (giống mục Tin tức của vinhomes.vn) |
| Chi tiết tin tức | `/tin-tuc/[slug]` · `/en/news/[slug]` | Tiêu đề serif, meta, nội dung, bài liên quan |
| Tuyển dụng | `/tuyen-dung` · `/en/careers` | Banner + danh sách vị trí dạng hàng (tên, nơi làm, hạn nộp) |
| Chi tiết tuyển dụng | `/tuyen-dung/[slug]` · `/en/careers/[slug]` | Nội dung + form ứng tuyển kèm CV |
| Dịch vụ | `/dich-vu/[slug]` · `/en/services/[slug]` | Hero ảnh + nội dung xen ảnh + CTA liên hệ |
| Liên hệ | `/lien-he` · `/en/contact` | 2 cột: thông tin + bản đồ / form |
| Pháp lý | `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` · `/en/privacy-policy`, `/en/terms-of-use` | 1 cột văn bản |
| 404 | — | Thông báo + link về trang chủ, đúng ngôn ngữ đang xem |

---

## Component Library

| Component | Variants | Notes |
|-----------|----------|-------|
| Header | Trong suốt (đè lên hero, logo trắng) · Đặc (nền sáng khi cuộn, logo đen) | Theo vinhomes.vn: **logo ở giữa**, trái là nút tìm kiếm, phải là **nút chuyển ngôn ngữ VI / EN** + nút menu. Desktop ≥ 1280px có thể hiện menu ngang dưới logo |
| Menu toàn màn hình | — | Mở từ nút menu: phủ toàn màn hình nền tối, mục menu chữ lớn, mục con xổ ra; cuối có hotline + mạng xã hội |
| Language Switcher | Chữ `VI | EN` · trong menu toàn màn hình | Chuyển sang **đúng trang tương ứng** ở ngôn ngữ kia; nếu trang đó chưa có bản dịch thì về trang danh sách / trang chủ của ngôn ngữ kia. Có `hreflang`, `aria-label`, ghi nhớ lựa chọn bằng cookie `NEXT_LOCALE` |
| Section Heading | Có/không chữ chìm · căn giữa/căn trái | Eyebrow + tiêu đề serif in hoa + mô tả ngắn; chữ chìm to mờ phía sau |
| Hero Slider | Ảnh · Video | Full màn hình (`100svh`), chữ ở giữa, nút cuộn xuống |
| Project Slider | — | Slide full-bleed, khung chữ đè lên ảnh, chấm phân trang + mũi tên, vuốt được trên mobile |
| Card | Dự án (ảnh lớn) · Tin cho thuê (thông số) · Tin/ưu đãi · Dịch vụ (ảnh + eyebrow) | Hover: ảnh phóng nhẹ (scale 1.03), không đổ bóng đậm |
| Button | Primary (nền vàng) · Outline (viền mảnh, chữ in hoa) · Dark · Ghost | Sizes: sm, md, lg. Kiểu outline in hoa giống "XEM TẤT CẢ DỰ ÁN" |
| Input / Select | Default, Error, Disabled | Có label; lỗi hiện theo ngôn ngữ đang xem |
| Lead Form | Đầy đủ · Rút gọn (trong khung dính) | Consent + Turnstile; chữ, lỗi, thông báo cảm ơn theo ngôn ngữ |
| Badge | Trạng thái mở bán · Đã thuê · Đã kết thúc · Info/Success/Warning/Error | |
| Floating Contact | — | Hotline / Zalo / Fanpage góc dưới phải |
| Breadcrumb | — | Theo ngôn ngữ đang xem |
| Footer | — | Nền tối: logo trắng, cột liên kết, thông tin công ty, mạng xã hội, chuyển ngôn ngữ |

---

## Design Style

- **Overall feel:** sang trọng, tối giản, nhiều khoảng trắng — theo phong cách vinhomes.vn, mang màu TAMI (vàng champagne + đen + nền kem).
- **Color scheme:** Light, có section tối xen kẽ (footer, banner CTA, menu toàn màn hình).
- **UI Library:** Tailwind CSS + shadcn/ui (tuỳ biến lại góc vuông, font, màu theo token trên).
- **Animation level:** Subtle — hero chữ hiện dần, ảnh phóng nhẹ khi hover, nội dung trượt lên khi cuộn tới (tắt khi `prefers-reduced-motion`). Không dùng parallax nặng làm hỏng LCP/CLS (NFR-01).
- **Ảnh:** ảnh lớn chất lượng cao là trung tâm; tỉ lệ cố định (16:9 hero/slider, 4:3 thẻ) để không nhảy layout.
- **Khoảng cách section:** rộng (`64–120px` theo màn hình), nội dung tối đa ~1280px, slider/hero tràn viền.
- **Song ngữ:** cùng một bố cục cho VI và EN; không chèn chữ vào ảnh (để dịch được).

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

