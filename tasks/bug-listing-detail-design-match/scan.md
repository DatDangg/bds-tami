# Scan: UI Dự án / Cho thuê / Tin BĐS so với ảnh design (BL-052)

- Ngày: 2026-10-22 · read-only (`/bug-check`), KHÔNG sửa code
- So với: `docs/specs/listing-detail-redesign/list-du-an.webp`, `detail-du-an.webp`
- Môi trường: local `pnpm dev`, desktop 1440px, dữ liệu DB local
- Trang soi: `/du-an`, `/du-an/the-crown-dai-hoang-son-bac-ninh`, `/cho-thue`, `/cho-thue/<studio Tô Ngọc Vân>`, `/tin-bds`, `/tin-bds/<căn góc Elegant Park>`

## A. Lệch do CODE (layout khác ảnh, dữ liệu đủ vẫn lệch)

| # | Màn | Lệch | Design | Hiện tại | Vị trí code |
|---|-----|------|--------|----------|-------------|
| A1 | Chi tiết (cả 3) | Thanh thông số vỡ dòng | 6 ô, mỗi giá trị 1 dòng, thanh thấp | "Chủ đầu tư" xuống 3 dòng, "Loại hình" (Nhà phố/Liền kề, Biệt thự, Shophouse, Đất nền) 4 dòng → thanh cao gấp đôi | `src/components/detail/DetailSpecBar.tsx:31,41` (`break-words`, không truncate / không giới hạn dòng) |
| A2 | Chi tiết dự án | Bố cục khối Tổng quan | Lưới thông tin **2 cột** (icon + nhãn + giá trị) rộng ~55%, thẻ sản phẩm 3 ô + 1 ô bên phải | Lưới thông tin **1 cột** hẹp, thẻ sản phẩm 2×2; đoạn giới thiệu dài kèm bullet chiếm nhiều chỗ | `src/components/projects/ProjectOverview.tsx:69` |
| A8 | Chi tiết dự án (+ cho thuê/tin BĐS cùng kiểu) | Tổng quan in **toàn bộ** nội dung rich text (danh sách gạch đầu dòng Tên dự án/Chủ đầu tư/Vị trí/Quy mô…), trùng hẳn với lưới thông tin ngay bên dưới (user báo 2026-10-22, ảnh Sun Festo Town) | Chỉ 1 đoạn giới thiệu 2–3 dòng, rồi tới lưới thông tin | Nội dung `overview` render nguyên khối, gồm cả bullet và heading "Thông tin chính" | `src/components/projects/ProjectOverview.tsx:64-68` (có `overview` thì bỏ qua `summary`) |
| A3 | Chi tiết (cả 3) | Form "Nhận thông tin" | Ô nhập có icon + placeholder (không nhãn trên), nút "NHẬN TƯ VẤN NGAY →" full-width | Nhãn nằm trên ô, nút nhỏ căn trái | `LeadForm` trong `DetailContactAside` (`ProjectDetail.tsx:240-241`) |
| A4 | Chi tiết dự án | Khối Tiện ích khi thiếu ảnh | Ảnh lớn trái + danh sách có icon/mô tả bên phải | Không có ảnh → còn 1 chip nhỏ trong ô hẹp, trông trống (nên xem lại cách hiển thị khi thiếu ảnh/mô tả) | `src/components/projects/ProjectAmenities.tsx` |
| A5 | Danh sách (cả 3) | Thẻ nổi bật: nút "NHẬN TƯ VẤN" | Nút viền (outline) cạnh "XEM CHI TIẾT" | Chỉ là link chữ | `src/components/projects/ProjectSpotlightContent.tsx` (+ bản rental/post) |
| A6 | Danh sách + chi tiết | Breadcrumb trên hero | Không có | Có viên breadcrumb trên đầu hero | `ListingHero.tsx`, `DetailPageShell.tsx`. Có thể giữ vì SEO, cần anh chốt |
| A7 | Chi tiết dự án | "Dự án tương tự" | Carousel 4 thẻ + mũi tên trái/phải | 3 thẻ, không mũi tên (chỉ có 3 dự án liên quan, chừa trống cột 4) | Nhẹ, có thể chấp nhận |

## B. Lệch do THIẾU DỮ LIỆU (code đã có, khối tự ẩn hoặc hiện sai vì CMS trống/sai)

| # | Khối | Thiếu gì | Bằng chứng DB |
|---|------|----------|---------------|
| B1 | Header: nút "LIÊN HỆ TƯ VẤN" | `header.ctaButton` chưa nhập | Header không có CTA |
| B2 | Hero danh sách: hàng "Tìm nhanh" | Từ khoá Tìm nhanh trong Cài đặt website | Hàng chip ẩn ở cả 3 màn |
| B3 | Cuối danh sách: "Tìm hiểu thêm" + FAQ | Ảnh/video/FAQ từng màn trong Cài đặt website | Khối ẩn ở cả 3 màn |
| B4 | Chi tiết: khối Hotline đen "GỌI NGAY" | `site_settings.hotline` = NULL | Khối ẩn |
| B5 | Vị trí: bản đồ + "Khoảng cách đến các địa điểm" | Toạ độ + địa điểm lân cận | Chỉ **6/61** dự án có `location`; `projects_nearby_amenities` = **0** dòng → chỉ còn dòng địa chỉ |
| B6 | Tiện ích: ảnh lớn + mô tả | `amenities_image` + mô tả tiện ích | **0/61** dự án có ảnh khối tiện ích, **0** mô tả |
| B7 | "Quy mô 0,04 ha" (The Crown) | Nhập sai đơn vị: `scale.landAreaM2 = 350` (ý là 36,21 ha = 362.100 m²) | Lỗi nhập liệu, code đổi m²→ha đúng |
| B8 | Tin BĐS chi tiết: thanh thông số chỉ 2 ô | Tin cũ chưa nhập trường có cấu trúc (đúng quyết định "tin cũ để trống") | Ô trống bị ẩn đúng spec |

## C. Không phải lỗi
- Ảnh thẻ/thumbnail xám trong ảnh chụp đầu: chỉ là chụp lúc ảnh chưa tải xong (đã kiểm tra `img.complete` = true, ảnh vẫn tải bình thường).

## Đề xuất
- **Gom 1 task code** (cùng khu vực detail shell): A1 + A8 + A2 + A3 (+ A4, A5). A6/A7 chờ anh chốt.
- **Nhóm B**: nhập nội dung trong admin (hoặc seed dữ liệu demo cho local). B7 sửa ngay trong admin. Không cần code, trừ khi anh muốn thêm gợi ý đơn vị "m²" rõ hơn ở ô nhập Quy mô.
