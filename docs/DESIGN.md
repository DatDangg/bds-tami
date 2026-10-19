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
- ⚠️ **Chỉ lấy BẢNG MÀU** từ các ảnh này. **Không** lấy bố cục, menu, component hay nội dung (mockup có mục "Mua bán", "Về chúng tôi"… không khớp phạm vi `docs/BRD.md` v1.5).

**Website tham chiếu bố cục & phong cách: https://market.vinhomes.vn** (chốt 16/10/2026; cập nhật BL-020, 19/10/2026: lấy cảm giác của trang market — thẻ bo 20px, nút viên thuốc, header kính nổi, heading serif viết thường — nhưng màu của TAMI)

| Lấy từ market.vinhomes.vn | Không lấy |
|---|---|
| Bố cục trang, nhịp section, cách sắp khối (xem § Design Style) | Logo, tên, slogan, ảnh, video, icon, chữ của Vinhomes |
| Kiểu chữ: tiêu đề serif viết thường (weight 400) + chữ sans-serif | Font thương mại (GaramondPremrPro, UTM…): dùng font miễn phí tương đương (§ Typography) |
| Cách chuyển động: hero full màn hình, slider dự án, hover nhẹ | Màu: dùng bảng màu TAMI bên dưới |
| Cách chia URL theo ngôn ngữ (VI / EN) | Menu, mục nội dung ngoài phạm vi BRD (Mua, Quan hệ cổ đông, Virtual Tour, app cư dân…) |

> "Giống market.vinhomes.vn" nghĩa là **giống bố cục và cảm giác**, không phải sao chép. Toàn bộ nội dung, ảnh, thương hiệu là của TAMI (BRD LGL-04).

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
| Accent Display | `#A07A3F` | Giá tiền cỡ lớn (≥ 24px), icon viền vàng, gạch chân tab | Chỉ dùng cho chữ lớn / icon. Mockup `#B58C50` chỉ 2.83:1 → đổi `#A07A3F` (3.61:1), chốt 16/10/2026 |
| Badge Foreground | `#3C2704` | Chữ trên badge vàng ("Sắp mở bán") | Đo từ badge, 8.1:1 (đầu sáng), 5.9:1 (đầu đậm gradient) |
| Primary Deep | `#C9A15F` | Đầu đậm của `--gradient-gold` (badge/nhấn vàng) | Chữ Badge Foreground trên đó 5.9:1 |

**Nền & bề mặt**

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F7F5F4` | Nền trang (xám ấm rất nhạt) |
| Background Alt | `#FAF8F6` | Nền section xen kẽ |
| Surface | `#FFFFFF` | Card, form, thanh tìm kiếm, dropdown |
| Surface Muted | `#F1F0EE` | Chip/tag trung tính ("Biệt thự", "Căn hộ"), ô input disabled |
| Border | `#E8E6E3` | Viền card, đường kẻ chia (trang trí) |
| Border Input | `#857F79` | Viền input / select / checkbox (≥ 3:1 theo WCAG 1.4.11), chốt 16/10/2026 | 

**Tối (section tối, footer, banner CTA, khối Tin tức trang chủ — tối đa 2 section nội dung tối/trang, BL-020)**

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
| Text Muted | `#6B6B6B` | Địa chỉ, ngày đăng, nhãn thông số ("Diện tích", "Bàn giao"), placeholder | Mockup ~#8A–#A0 chưa đạt AA → **đậm lên** để đạt 4.5:1 |

**Trạng thái** (mockup không có, đề xuất cho hợp tông ấm)

| Token | Value | Usage |
|-------|-------|-------|
| Success | `#2F7D5B` | Gửi form thành công, trạng thái "Đã chốt" |
| Warning | `#8A5A0A` | Sắp hết hạn ưu đãi, cảnh báo |
| Error | `#B42318` | Lỗi form, trạng thái lỗi |
| Info | `#2B6CB0` | Thông báo trung tính |

### Bo góc, kính mờ, gradient (BL-020)

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 2px | Ô nhập nhỏ |
| `--radius-md` / `--radius-lg` | 12px / 16px | Panel, hộp thông báo |
| `--radius-xl` | 20px | Thẻ (dự án, cho thuê, tin, việc làm) và ảnh trong thẻ |
| `--radius-pill` | 9999px | Mọi nút (Button), badge |
| `--color-glass` | `rgb(250 248 246 / 0.8)` | Nền kính mờ sáng của header nổi; đi cùng `--blur-glass` |
| `--blur-glass` | 24px | `backdrop-filter: blur()` của header kính |
| `--gradient-gold` | `135deg, Primary → Primary Deep` | Badge "Sắp mở bán", nhấn vàng |
| `--gradient-success` | `135deg, Success → Success Text` | Badge "Đang bán" (chữ trắng ≥ 5:1 cả hai đầu) |

Biến thể nút `chip` (viền `on-dark/30`, chữ trắng) chỉ dùng trong `.theme-dark-block` hoặc trên scrim ≥ `--color-overlay`; trên nền sáng không đọc được.

Trên kính chỉ dùng chữ `--color-text` (≥ 10.8:1 trên đen, 17.5:1 trên trắng); `--color-accent-text` chỉ ~3.0:1 khi nền sau kính là đen nên mục đang chọn đánh dấu bằng gạch chân/đậm.

**Gợi ý CSS variables** (để `/design` sinh tokens chính thức):

```css
:root {
  --color-primary: #E0BF89;
  --color-primary-foreground: #141414;
  --color-primary-soft: #EAD3AE;
  --color-primary-subtle: #F8F3EB;
  --color-accent-text: #8C6733;
  --color-accent-display: #A07A3F;
  --color-badge-foreground: #3C2704;
  --color-primary-deep: #C9A15F;
  --color-glass: rgb(250 248 246 / 0.8);
  --blur-glass: 24px;
  --radius-xl: 20px;
  --radius-pill: 9999px;

  --color-bg: #F7F5F4;
  --color-bg-alt: #FAF8F6;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F0EE;
  --color-border: #E8E6E3;
  --color-border-input: #857F79;

  --color-dark: #111111;
  --color-dark-deep: #0A0C10;
  --color-dark-border: #2A2A2A;
  --color-on-dark: #FFFFFF;
  --color-on-dark-muted: #B3B3B3;

  --color-text: #141414;
  --color-text-secondary: #555555;
  --color-text-muted: #6B6B6B;

  --color-success: #2F7D5B;
  --color-warning: #8A5A0A;
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
| `assets/brand/tami-logo-white.png` | Trắng, nền trong suốt | Section tối, menu toàn màn hình, footer (không còn dùng ở header từ BL-020: header luôn kính sáng) (`--color-dark`) |
| `assets/brand/tami-logo-dark.png` | Đen, nền trong suốt | Chỉ dùng cho in ấn / dự phòng (không dùng ở header web từ BL-018) |
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

> Theo phong cách market.vinhomes.vn: tiêu đề **serif** viết thường (họ Garamond), chữ thường **sans-serif** (Montserrat).
> Vinhomes dùng font thương mại nên TAMI dùng bản **miễn phí (SIL OFL)** tương đương, tự host bằng `next/font`.
> Cả hai font **phải hiển thị đủ dấu tiếng Việt** (đã có bộ ký tự `vietnamese`). Nếu TAMI có font thương hiệu riêng thì thay ở đây (BRD Q2).

| Vai trò | Font | Fallback |
|---|---|---|
| Display (tiêu đề, tên dự án) | **EB Garamond** (subset `latin`, `vietnamese`) | `Georgia, 'Times New Roman', serif` |
| Text (nội dung, menu, nút, form) | **Montserrat** (subset `latin`, `vietnamese`) | `system-ui, Arial, sans-serif` |

| Token | Font | Size (mobile → desktop) | Weight | Kiểu | Usage |
|-------|------|------|--------|------|-------|
| Display XL | EB Garamond | `clamp(32px, 1.3rem + 3.2vw, 60px)` (60px desktop) | 400 | Viết thường, letter-spacing 0 | Câu chính trên hero |
| Heading 1 | EB Garamond | `clamp(30px, 1.2rem + 2.9vw, 56px)` (56px desktop) | 400 | Viết thường | Tiêu đề trang |
| Heading 2 | EB Garamond | `clamp(26px, 1.15rem + 2vw, 44px)` (44px desktop) | 400 | Viết thường | Tiêu đề section/khối |
| Heading 3 | EB Garamond | 22–25px | 400 | Thường | Tên thẻ (dự án, dịch vụ), tên dự án trên slider |
| Heading 2 phụ (`--text-h2-sm`) | EB Garamond | 24 → 30px | 400 | Thường | Heading phụ trong nội dung/trang chi tiết (RichText, JobDetail, RentalDetail, form tư vấn, liên hệ) — nhỏ hơn Heading 2 (44px) để không phình |
| Eyebrow | Montserrat | 12–13px | 600 | IN HOA, letter-spacing 0.12em, `--color-accent-text` | Nhãn nhỏ trên tiêu đề ("KHU ĐÔ THỊ", "DỰ ÁN") |
| Body | Montserrat | 15–16px, line-height 1.7 | 400 | Thường | Nội dung |
| Small | Montserrat | 14px | 400 | Thường | Nhãn, chú thích |
| XSmall | Montserrat | 12px | 500 | Thường | Meta, ngày đăng |
| Button | Primary (nền vàng) · Secondary (nền surface, viền border, chữ accent) · Outline (viền mảnh, chữ in hoa) · Dark · Ghost · Chip (chỉ trên khối tối/scrim) | Sizes: sm, md, lg. Mọi nút bo viên thuốc. Kiểu outline in hoa giống "XEM TẤT CẢ DỰ ÁN" |

> Heading viết thường (BL-020); chỉ nút, eyebrow, menu in hoa bằng CSS `text-transform: uppercase`, **không** gõ in hoa trong CMS (để SEO và bản dịch giữ chữ thường).
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

> Theo BL-020 (market.vinhomes.vn): khối lớn (hero, section) vuông; thẻ bo 20px, nút/badge viên thuốc, panel 12/16px. Nguồn sự thật: `globals.css`; chi tiết `.context/design-spec.md` §3.

| Token | Value | Usage |
|-------|-------|-------|
| none | 0 | Ảnh full-bleed, slider, section |
| sm | 2px | Ô nhập nhỏ, checkbox, cookie banner |
| md / lg | 12px / 16px | Dropdown, popover, modal, panel, hộp thông báo |
| xl | 20px | Thẻ (dự án, cho thuê, tin, việc làm) và ảnh trong thẻ |
| pill | 9999px | Mọi nút, badge, header nổi |
| full | 9999px | Chấm phân trang slider, avatar sale, nút nổi Hotline/Zalo |

---

## Screen Inventory

> Danh sách màn lấy theo `docs/BRD.md` §2. Cột "Bố cục tham chiếu" là **khung** theo market.vinhomes.vn; spec chi tiết (component, trạng thái, responsive) do bước `/design` viết vào `.context/design-spec.md`.
> Mỗi màn có **2 bản ngôn ngữ**, cùng một bố cục (URL theo `docs/BRD.md` §2.1).

| Màn | Route VI · EN | Bố cục tham chiếu (market.vinhomes.vn) |
|---|---|---|
| Trang chủ | `/` · `/en` | Hero full màn hình (ảnh bắt buộc; video tuỳ chọn theo từng slide, chỉ phát ≥ 1024px, câu chính serif viết thường ở giữa, chữ chạy nhẹ) → dải giới thiệu ngắn + số liệu (kiểu "Thương hiệu… / Top 10…") → **Dự án nổi bật**: tiêu đề (không chữ chìm), slider full-bleed mỗi slide 1 dự án (ảnh lớn + khung chữ: tagline, TÊN DỰ ÁN, mô tả, nút "KHÁM PHÁ DỰ ÁN"), chấm phân trang → **Dịch vụ** ("Đồng hành trọn hành trình"): tiêu đề + 3 thẻ ảnh bo 20px, tên + mô tả trong khung kính mờ đè đáy ảnh → Ưu đãi nổi bật (slider thẻ) → Đối tác (dải logo; chưa dựng giao diện) → banner CTA ("Đăng ký tham quan": ảnh tràn viền + scrim, nút chính vàng + nút phụ viên thuốc viền trắng; không ảnh → khối tối) → **Cho thuê** (tab theo danh mục + slider thẻ tin cho thuê, "Xem thêm" → trang danh mục) → **Tin tức** (khối tối: giới thiệu trái + 3 bài phải, "Xem tất cả" → `/tin-tuc`) → footer tối. Cho thuê/Tin tức là khối trang chủ `rentals`/`news`, chỉ hiện khi có trong "Thứ tự khối" của global Trang chủ, tự ẩn khi không có tin; tin xuất bản/sửa/ẩn làm mới trang chủ (hook `createRevalidateHomepageOnListing`) |
| Danh sách dự án | `/du-an` · `/en/projects` | Banner ảnh + tiêu đề serif → bộ lọc dạng tab/chip → lưới thẻ dự án ảnh lớn (ảnh, eyebrow loại hình, tên serif, địa điểm) |
| Chi tiết dự án | `/du-an/[slug]` · `/en/projects/[slug]` | Hero ảnh full màn hình + tên dự án → thanh mục con dính khi cuộn (Tổng quan · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Thư viện) → các section xen nền sáng/kem/tối → form để lại thông tin |
| Cho thuê (danh sách) | `/cho-thue` · `/en/for-rent` | Banner + thanh tìm kiếm/lọc → lưới thẻ tin (ảnh, giá, diện tích, phòng, khu vực) + phân trang |
| Chi tiết tin cho thuê | `/cho-thue/[slug]` · `/en/for-rent/[slug]` | Thư viện ảnh lớn → 2 cột: thông số + mô tả / khung giá + sale phụ trách + form (dính khi cuộn) → tin tương tự |
| Đăng tin BĐS | `/tin-bds` · `/en/property-news` | Tab danh mục → lưới thẻ tin/ưu đãi (nhãn "Đã kết thúc" khi hết hạn) |
| Chi tiết bài Đăng tin BĐS | `/tin-bds/[slug]` · `/en/property-news/[slug]` | Ảnh bìa → nội dung 1 cột rộng vừa đọc → khối ưu đãi/voucher → form liên hệ |
| Tin tức | `/tin-tuc` · `/en/news` | Bài nổi bật lớn + lưới bài, tab danh mục (giống mục Tin tức của market.vinhomes.vn) |
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
| Header | **Một biến thể (BL-020):** thanh nổi bo viên thuốc, kính mờ sáng (`--color-glass` + blur 24px), logo vàng, chữ `--color-text` | Theo market (vinhomes.vn). Thanh cách mép 8px (16px ≥ lg), cao 64px (72px ≥ lg), dính đầu trang, luôn là thanh nổi kể cả trên hero (không còn biến thể trong suốt, không JS/observer). `<header>` chiếm `--header-offset` (80px; ≥ lg 104px) trong luồng → không che nội dung/CLS; thanh dính phụ và neo dùng biến này. Không hỗ trợ `backdrop-filter` / `prefers-reduced-transparency` → nền đặc. Trên kính chỉ dùng `--color-text` (accent-text ~3:1 trên nền đen): mục đang xem gạch chân, không đổi màu. Vòng focus trong thanh = màu chữ. **Mobile/tablet < 1280px:** **logo ở giữa**, trái là nút tìm kiếm (mở ô từ khoá → chuyển tới `/cho-thue?q=` · `/en/for-rent?q=`; giai đoạn 1 không có tìm kiếm toàn site), phải là **nút chuyển ngôn ngữ VI / EN** + nút menu. **Desktop ≥ 1280px:** một hàng logo trái · menu ngang (mục con dạng dropdown) · tìm kiếm · VI / EN · nút CTA (nếu bật); **không có nút menu** (vinhomes.vn desktop cũng không có, BL-019) |
| Menu toàn màn hình | — | Chỉ ở < 1280px, mở từ nút menu: phủ toàn màn hình nền tối, mục menu chữ lớn, mục con xổ ra; cuối có hotline + mạng xã hội |
| Language Switcher | Chữ `VI | EN` · trong menu toàn màn hình | Chuyển sang **đúng trang tương ứng** ở ngôn ngữ kia; nếu trang đó chưa có bản dịch thì về trang danh sách / trang chủ của ngôn ngữ kia. Có `hreflang`, `aria-label`, ghi nhớ lựa chọn bằng cookie `NEXT_LOCALE` |
| Section Heading | Căn giữa/căn trái (không còn chữ chìm, BL-020) | Eyebrow + tiêu đề serif viết thường + mô tả ngắn |
| Hero Slider | Ảnh · Video | Full màn hình (`100svh`), chữ ở giữa, nút cuộn xuống (chỉ icon, từ `sm`; reduced-motion nhảy ngay) |
| Announcement Bar | — | Chỉ trang chủ (CMS `announcementBar`, mặc định tắt). Dải full-width nền vàng `--color-primary` ở TRÊN CÙNG, phía trên header nổi, nằm trong luồng (cao ≥ 44px, trôi đi khi cuộn, header vẫn dính; render ở `PublicShell`, chỉ dựng ở `/` · `/en`, nên hiện kể cả khi không có slide hero); nút đóng 44px, nhớ theo hash chữ + link trong localStorage (khoá theo ngôn ngữ), script inline giấu trước paint nếu đã đóng; ẩn khi tắt/trống/chưa có EN. Dữ liệu đọc ở layout qua cache tag `global:homepage` (giữ ISR mọi route) → lưu global Trang chủ / dịch vụ, gỡ xuất bản dự án/tin BĐS (hook `revalidate-homepage`) làm mới cache **toàn bộ trang công khai**, không chỉ `/` · `/en` |
| Hero Search | Tab Cho thuê · Dự án + chip | Thẻ trắng bo 20px đè đáy hero từ md (dưới hero trên mobile). Cho thuê: form GET `?q=` tới `/cho-thue` (dùng được không JS); Dự án: form GET tới `/du-an` với `province` + `status` có sẵn (chưa có từ khoá). Chip "Dự án được quan tâm" (CMS ≤ 6, fallback nổi bật), mobile vuốt ngang |
| Project Slider | — | Thẻ lớn ~464×600 bo 20px, ảnh phủ kín, **khung kính mờ** đè đáy ảnh (tên serif, địa điểm, số liệu đất/số căn/bàn giao từ `scale.*`, ẩn ô thiếu), badge trạng thái gradient; scroll-snap + chấm + mũi tên ≥ md, vuốt được trên mobile, không autoplay |
| Offers Slider | — | Slider thẻ Tin/ưu đãi (`PostCard` bo 20px) scroll-snap: 80% < sm, 2 thẻ ≥ sm, 3 thẻ ≥ lg; mũi tên ≥ md; nút Outline "Xem thêm" → `/tin-bds` |
| Card | Dự án (ảnh lớn) · Tin cho thuê (thông số) · Tin/ưu đãi · Dịch vụ (ảnh bo 20px + khung kính) | Hover: ảnh phóng nhẹ (scale 1.03), không đổ bóng đậm |
| Button | Primary (nền vàng) · Secondary (nền surface, viền, chữ accent) · Outline (viền mảnh, chữ in hoa) · Dark · Ghost · Chip (chỉ trên khối tối/scrim) | Sizes: sm, md, lg. Mọi nút bo viên thuốc (BL-020). Kiểu outline in hoa giống "XEM TẤT CẢ DỰ ÁN" |
| Input / Select | Default, Error, Disabled | Có label; lỗi hiện theo ngôn ngữ đang xem |
| Lead Form | Đầy đủ · Rút gọn (trong khung dính) | Consent + Turnstile; chữ, lỗi, thông báo cảm ơn theo ngôn ngữ |
| Badge | Trạng thái mở bán · Đã thuê · Đã kết thúc · Info/Success/Warning/Error | Bo viên thuốc (BL-020); "Đang bán" gradient xanh (`--gradient-success`), "Sắp mở bán" gradient vàng (`--gradient-gold`) |
| Floating Contact | — | Hotline / Zalo / Fanpage góc dưới phải |
| Breadcrumb | — | Theo ngôn ngữ đang xem |
| Footer | — | Nền tối: logo trắng, cột liên kết, thông tin công ty, mạng xã hội, chuyển ngôn ngữ |

---

## Design Style

- **Overall feel:** sang trọng, tối giản, nhiều khoảng trắng — theo phong cách market.vinhomes.vn, mang màu TAMI (vàng champagne + đen + nền kem).
- **Color scheme:** Light, có section tối xen kẽ (footer, banner CTA, khối Tin tức trang chủ, menu toàn màn hình; tối đa 2 section nội dung tối/trang — CTA + Tin tức, BL-020).
- **UI Library:** Tailwind CSS + shadcn/ui (tuỳ biến lại thang bo góc (2/12/16/20px/pill), font, màu theo token trên).
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

---

## Quyết định bước `/design` (16/10/2026)

Nguồn chi tiết: tokens `skills/react-nodejs/design-tokens.md`, screen specs `.context/design-spec.md`.

- **Tokens:** 4 giá trị đổi để đạt WCAG AA (Text Muted `#6B6B6B`, Accent Display `#A07A3F`, Warning `#8A5A0A`, thêm Border Input `#857F79`); bảng màu ở trên đã cập nhật.
- **Trang chủ:** hero dùng ảnh (bắt buộc), video **tuỳ chọn** từng slide: admin có thể chỉ dùng ảnh. **Bỏ** dải 4 lối tắt. **Giữ** banner CTA tối (khối `ctaBanner`). Thẻ Dịch vụ dùng ảnh `services.coverImage`. Không làm `provinces.intro` (dùng câu mẫu). `pageBanners` (ảnh banner trang danh sách + ảnh mặc định trong Cài đặt website) **làm ở BL-017** (FR-ADM-20, user chốt 2026-10-19); chưa có ảnh → banner chữ.
- **SEO:** tin "Đã thuê" và tin tuyển dụng quá hạn vẫn mở trang (có băng thông báo), gắn `noindex, follow`, bỏ khỏi sitemap; tuyển dụng quá hạn ẩn form và bỏ JSON-LD `JobPosting`.
- **Cookie:** banner đồng ý không chặn trang, nút Từ chối ngang hàng Đồng ý; GA4 chỉ tải sau khi đồng ý.
- **Eyebrow:** tối đa 1 trên 3 section.
- **Icon:** Phosphor Icons (thay Lucide mặc định của shadcn).
