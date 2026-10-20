---
id: homepage-redesign
type: feature
status: pending
created: 2026-10-20
---

# Trang chủ: làm lại giao diện theo mockup mới

## Yêu cầu
User gửi mockup UI trang chủ mới (desktop): `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp`.
Làm lại giao diện trang chủ cho khớp mockup. Ảnh trong mockup là ảnh nội dung (admin tải lên), không phải phần code.

So với trang chủ hiện tại (localhost, 2026-10-20), các điểm khác:

1. **Hero slider** — chữ canh trái (hiện canh giữa): dòng nhỏ "TAMI HOMES" giãn chữ, tiêu đề 2 dòng (dòng 2 màu vàng), mô tả, nút "TÌM CĂN HỘ →". Góc dưới trái: bộ đếm "01 / 03" + thanh tiến trình (thay chấm ở giữa). Mũi tên trái/phải dạng tròn. Góc dưới phải: chú thích ngắn ("Không gian sống đẳng cấp…") + nút cuộn xuống.
2. **Khung tìm kiếm** — icon kính lúp trong ô nhập, nút "TÌM KIẾM →". "Dự án được quan tâm" gọn 1 hàng chip + nút mở thêm. **Hàng mới "Tùy chọn khác"**: dropdown Mức giá / Diện tích / Loại căn hộ / Nội thất / Tiện ích.
3. **Dải 4 điểm mạnh (khối mới)** — icon tròn + tiêu đề + mô tả: Vị trí đắc địa · Căn hộ đa dạng · Hỗ trợ chuyên nghiệp · Thủ tục nhanh gọn.
4. **Về TAMI HOMES** — dòng nhỏ "VỀ CHÚNG TÔI"; tiêu đề "Về **TAMI HOMES**" (tên thương hiệu màu vàng); cụm ảnh chồng (ảnh lớn + ảnh nhỏ + thẻ chú thích có mũi tên); nút play "KHÁM PHÁ TAMI HOMES" trên ảnh lớn; số liệu có icon; nút "TÌM HIỂU THÊM →"; ảnh toà nhà trang trí mép phải.
5. **Dự án nổi bật** — dòng nhỏ + mô tả dưới tiêu đề; thẻ: ảnh + badge trạng thái + **icon tim**, phần thông tin nền trắng (tên, ghim vị trí, nút mũi tên tròn); ~5 thẻ/khung desktop; mũi tên + chấm ở giữa phía dưới; "XEM TẤT CẢ DỰ ÁN →".
6. **Banner tư vấn** — chữ canh trái trên ảnh nền.
7. **Footer** — nền tối: logo + mô tả + icon mạng xã hội, cột "Khám phá" / "Về TAMI", VI|EN, nút lên đầu trang. (Footer dùng chung → đổi toàn site.)

> ⚠️ **User nhấn mạnh (2026-10-20): LÀM ĐÚNG NHƯ ẢNH về bố cục, nhưng GIỮ hệ màu/element hiện tại.**
> - **Theo ảnh:** thứ tự khối, bố cục từng phần, vị trí thành phần (bộ đếm hero, cụm ảnh About, dải 4 điểm mạnh, hàng "Tùy chọn khác",
>   phần thông tin thẻ dự án, vị trí điều hướng slider…), tỉ lệ và khoảng cách.
> - **Giữ hiện tại:** màu và design tokens (`skills/<stack>/design-tokens.md`), font Montserrat, cùng các element sẵn có
>   (nút, chip, badge, ô nhập, mũi tên/chấm slider, icon set). Phần nào mới phải dựng thì ghép từ token/element sẵn có, không thêm màu hay kiểu mới.
> - Không tự "cải tiến". Chỗ nào phải lệch khỏi ảnh thì ghi rõ lý do và hỏi user trước.

## Acceptance (bắt buộc)
- [x] Trang chủ desktop (1440) **khớp bố cục mockup**: chụp màn hình đặt cạnh ảnh để so từng phần (1→7). Reviewer FAIL nếu lệch bố cục/thứ tự/vị trí thành phần thấy được bằng mắt.
- [x] Không có màu hay kiểu element mới ngoài design tokens/component hiện có. Reviewer FAIL nếu có hex hay kiểu nút/chip tự chế.
- [x] Trang chỉ có các khối trong ảnh, đúng thứ tự trong ảnh. Khối không có trong ảnh thì tắt trên trang chủ (không xoá code/dữ liệu, bật lại được trong admin).
- [x] Mobile (390): bản xếp dọc giữ đúng phong cách của ảnh.
- [x] Mọi chữ/ảnh/số liệu mới sửa được trong admin (global `homepage` / footer), có bản EN.
- [x] Đạt AA tương phản, giữ đúng 1 `h1`, tests/typecheck/build PASS.

## Quyết định đã chốt với user (2026-10-20)
1. **Icon tim** trên thẻ dự án: **chỉ trang trí** — vẽ như ảnh, bấm không làm gì (không state, `aria-hidden`).
2. **"Tùy chọn khác"**: **lọc thật** — dropdown lấy giá trị từ bộ lọc sẵn có của `/cho-thue` (giá / diện tích / loại căn hộ / nội thất / tiện ích); bấm Tìm kiếm chuyển sang `/cho-thue` kèm query tương ứng. Tab Dự án giữ hành vi hiện tại.
3. **Nút play "Khám phá TAMI HOMES"**: **mở video YouTube** — admin nhập link trong global `homepage` (khối About); bấm mở video trong hộp thoại; không có link thì ẩn nút.
4. Khối không có trong mockup (Dịch vụ, Ưu đãi, Cho thuê, Tin tức): **tắt trên trang chủ**, bật lại được trong admin.
5. **Mobile**: không có mockup riêng — dev tự làm responsive xếp dọc theo phong cách ảnh desktop.

## Ghi chú
- Ảnh hiện tại: hero/dự án đang là ảnh minh hoạ vẽ; ảnh thật thay qua admin.
- Ảnh hưởng: `src/components/home/*` (HeroSlider, HeroSearch, AboutBlock, ProjectsSlider, CtaBanner), khối mới "điểm mạnh", footer dùng chung, schema global `homepage` (thêm trường → migration).
