---
id: listing-detail-redesign
type: feature
status: done
completed: 2026-10-22
created: 2026-10-21
---

# Redesign màn danh sách + chi tiết: Dự án, Cho thuê, Tin BĐS (BL-052)

## Yêu cầu
Áp design mới (ảnh `docs/specs/listing-detail-redesign/list-du-an.webp` + `detail-du-an.webp`) cho màn
**danh sách** và **chi tiết** của Dự án (`/du-an`), rồi áp cùng layout cho Cho thuê (`/cho-thue`) và Tin BĐS (`/tin-bds`).
Mỗi màn có trường riêng — đã chốt với user 2026-10-21 (xem "Quyết định").

### Layout danh sách (theo ảnh `list-du-an.webp`)
- Hero ảnh nền: eyebrow + tiêu đề 2 dòng (dòng 2 màu nhấn) + mô tả + ô tìm kiếm có nút "TÌM KIẾM" + "Tìm nhanh" (chip từ khoá).
- Thanh tab danh mục có icon + số lượng ("Tất cả · 28 dự án", "Căn hộ chung cư · 18 dự án"…), tab đang chọn gạch chân.
- Cột trái "Bộ lọc" (+ "Xoá tất cả"): Tình trạng (chip), Tỉnh/thành (ô tìm + checkbox có số đếm + "Xem thêm"), Chủ đầu tư (select),
  Mức giá (thanh trượt 2 đầu), Loại hình (checkbox + số đếm), Tiện ích nổi bật (checkbox).
- Cột phải: thẻ "Dự án nổi bật" lớn (slider ảnh + badge + giá từ / diện tích / bàn giao + "XEM CHI TIẾT" + "NHẬN TƯ VẤN"),
  dòng "N dự án phù hợp" + "Sắp xếp theo", lưới thẻ 3 cột (badge tình trạng, tên, vị trí, tag loại sản phẩm, "Giá từ" hoặc "Liên hệ", nút mũi tên), phân trang số.
- Cuối trang: khối "Tìm hiểu thêm" (ảnh/video + tiêu đề + mô tả + nút) bên trái, FAQ accordion bên phải; dải 4 lợi ích; banner tư vấn; footer.
- **Không** làm icon yêu thích (trái tim) — user bỏ.

### Layout chi tiết (theo ảnh `detail-du-an.webp`)
- Hero ảnh full-bleed: badge danh mục + tình trạng, tiêu đề lớn, địa chỉ, mô tả ngắn, nút "Xem video giới thiệu" (chỉ khi có video),
  cột phải 3 ảnh thumbnail, ảnh cuối "Xem tất cả N ảnh".
- Thanh thông số nổi đè mép hero (6 ô có icon).
- Tab dính: Tổng quan · Vị trí · Tiện ích · Hình ảnh (+ tab cho khối giữ lại khi có dữ liệu).
- Tổng quan: đoạn giới thiệu + lưới thông tin (icon + nhãn + giá trị) + thẻ sản phẩm (số lớn · loại · khoảng diện tích).
- Cột phải dính: form "Nhận thông tin dự án" + khối Hotline đen "GỌI NGAY".
- Vị trí: bản đồ + danh sách "Khoảng cách đến các địa điểm quan trọng" (tên + chip thời gian/khoảng cách).
- Tiện ích nổi bật: ảnh lớn trái + danh sách tiện ích (icon + tên + mô tả) + "Khám phá tất cả tiện ích".
- Hình ảnh: lưới 1 ảnh lớn + 4 ảnh nhỏ + "Xem tất cả hình ảnh" (mở lightbox).
- "Dự án tương tự": carousel thẻ có mũi tên trái/phải + "Xem tất cả dự án".

## Quyết định (user chốt 2026-10-21)

### Dự án
1. **Thêm trường "Loại sản phẩm"** (chọn nhiều, danh sách cố định: Căn hộ, Nhà phố/Liền kề, Biệt thự, Shophouse, Đất nền, Nghỉ dưỡng… — agent chốt danh sách)
   → tag trên thẻ + bộ lọc "Loại hình" có số đếm. Tab danh mục trên cùng vẫn dùng `category` hiện có.
2. **Thêm trường mới**: danh sách **Sản phẩm** (số lượng · loại · diện tích từ–đến) cho thẻ sản phẩm; **Link video** giới thiệu;
   **Tiện ích**: thêm mô tả (localized) + ảnh đại diện khối tiện ích. Khối nào không có dữ liệu thì ẩn.
3. **Pháp lý: KHÔNG thêm trường ngắn, bỏ ô "Pháp lý" khỏi thanh thông số trên UI.** (Khối "Pháp lý & chính sách" hiện có vẫn giữ — xem 4.)
4. **Giữ các khối hiện có không có trong design** (mặt bằng, bảng giá, pháp lý & chính sách, tin đăng thuộc dự án, FAQ, tài liệu):
   vẽ lại theo style mới, đặt **sau khối Hình ảnh**, thêm tab tương ứng khi có dữ liệu.
5. **Thêm trường "Tiện ích nổi bật"** (chọn nhiều: gần trường học, gần bệnh viện, gần TTTM, gần metro, view sông/hồ, hồ bơi-gym-spa…) → bộ lọc danh sách.
6. "Mức giá" lấy từ giá thấp nhất trong bảng giá (`priceTable.priceFrom`) — không thêm trường giá; dự án không có giá → "Liên hệ".
7. Thẻ "Dự án nổi bật" dùng cờ `isFeatured` có sẵn.
8. Thanh thông số chi tiết dự án (bỏ Pháp lý): Giá từ · Quy mô · Diện tích · Chủ đầu tư · Bàn giao (+ ô thứ 6 nếu agent thấy hợp lý, vd Loại hình).

### Cho thuê (đã có trường có cấu trúc — duyệt đề xuất)
- Thẻ: Giá/tháng · diện tích · phòng ngủ · phòng tắm; tag = loại hình + nội thất.
- Thanh thông số chi tiết: Giá thuê · Diện tích · Phòng ngủ/tắm · Nội thất · Hướng · Dọn vào từ.
- Bộ lọc trái: Loại hình, Tỉnh/thành, Dự án, Giá thuê, Diện tích, Phòng ngủ, Nội thất, Tiện ích.
- Tab chi tiết: Tổng quan · Vị trí · Tiện ích · Hình ảnh (+ Điều khoản thuê giữ lại phía dưới). Video giới thiệu dùng `videoUrl` sẵn có.

### Tin BĐS
- **Thêm trường có cấu trúc như cho thuê**: Loại hình, Diện tích, Phòng ngủ, Phòng tắm, Hướng nhà, Mặt tiền, Số tầng,
  Tình trạng bàn giao (thô / hoàn thiện…), Địa chỉ + toạ độ → bộ lọc + thanh thông số. Tin cũ để trống (nhập bổ sung sau), UI ẩn ô trống.
- **Voucher/Ưu đãi chung lưới, thẻ riêng**: lọc theo loại tin; thẻ voucher hiện hạn ưu đãi + trạng thái thay cho giá/diện tích;
  chi tiết voucher giữ hộp mã voucher + điều kiện.

### Chung
- **Header, footer, banner tư vấn, dải lợi ích: giữ nguyên** (dùng component dùng chung hiện có) — chỉ đổi phần thân trang danh sách/chi tiết.
- Khối "Tìm hiểu thêm" (video) + FAQ cuối trang danh sách: **nội dung riêng từng màn** (Dự án / Cho thuê / Tin BĐS), nhập trong
  Cài đặt website (hoặc global phù hợp); trống thì ẩn khối.

## Acceptance (bắt buộc)
- [ ] `/du-an` + `/du-an/[slug]` khớp bố cục 2 ảnh design ở desktop; responsive mobile/tablet hợp lý (bộ lọc trái thành sheet trên mobile).
- [ ] `/cho-thue`, `/cho-thue/[slug]`, `/tin-bds`, `/tin-bds/[slug]` (+ trang danh mục `danh-muc/[category]`) dùng cùng layout với trường theo "Quyết định".
- [ ] Trường mới có trong admin (nhãn tiếng Việt, localized khi là chữ), migration versioned, không phá dữ liệu cũ (chỉ ADD).
- [ ] Bộ lọc mới chạy qua `searchParams`, giữ được khi chia sẻ link; số đếm đúng theo bộ lọc khác đang chọn (hoặc ghi rõ cách đếm).
- [ ] Ô Pháp lý không hiện trên thanh thông số dự án.
- [ ] Không có icon yêu thích.
- [ ] Khối trống (video, sản phẩm, tiện ích, FAQ…) ẩn, không để khung rỗng.
- [ ] Bản EN hoạt động như bản VI (nhãn i18n đủ).
- [ ] Test + typecheck + lint + build PASS.

## Ghi chú
- Ảnh design: `docs/specs/listing-detail-redesign/list-du-an.webp`, `docs/specs/listing-detail-redesign/detail-du-an.webp`.
- Code liên quan: `src/components/projects/*`, `src/components/rentals/*`, `src/components/posts/*`, layout chi tiết dùng chung
  (`DetailLayout`, `DetailGalleryHero`, `DetailTitleCard`…), `src/collections/{Projects,Rentals,PropertyPosts}.ts`, `src/collections/projects/market-blocks.ts`.
- Đề xuất chia phase: (1) Dự án list + detail + trường mới; (2) Cho thuê; (3) Tin BĐS + trường mới; khối Video+FAQ có thể làm cùng phase 1 rồi tái dùng.

## Chế độ chạy (user chốt 2026-10-21)
- **auto proceed** — user cho làm từ đầu đến cuối, KHÔNG dừng duyệt plan / duyệt sau phase. Chỉ dừng khi BLOCKED (`architecture_review_needed`) hoặc `HIGH_RISK_MIGRATION`.
- Builder: **`builder-strong`** cho mọi task (user yêu cầu rõ).
- **Chỉ commit trên `staging`, KHÔNG push.**
- Thứ tự: **BL-052 trước, BL-054 sau** (BL-054 tái dùng hero/thẻ/phân trang của BL-052); task độc lập trong 1 phase chạy song song theo worktree.
- **Điền dữ liệu cũ bằng script**: trích từ nội dung có sẵn (tổng quan dự án, tiêu đề/nội dung tin), chỉ điền ô trống, chạy DB dev, xuất báo cáo cho admin soát; staging/prod chỉ chạy khi user bảo.
- Chip **"Tìm nhanh"** ở hero danh sách: sửa trong admin, mỗi màn 1 bộ; trống thì ẩn.
- Danh sách cố định (có bản EN): **Loại sản phẩm** = Căn hộ, Nhà phố/Liền kề, Biệt thự, Shophouse, Đất nền, Nghỉ dưỡng, Condotel, Văn phòng.
  **Tiện ích nổi bật** = Gần trường học, Gần bệnh viện, Gần TTTM, Gần metro, View sông/hồ, Hồ bơi-gym-spa, Công viên cây xanh.
- Form ứng tuyển giữ ô "Lời nhắn" (không bắt buộc).
- Mobile không có design: responsive theo style hiện có (bộ lọc thành sheet, cột phải xuống dưới).
