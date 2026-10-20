---
id: site-redesign-homepage-style
type: feature
status: done
created: 2026-10-21
---

# Các trang còn lại: làm lại giao diện theo phong cách trang chủ mới

## Yêu cầu
Áp phong cách trang chủ mới (BL-044) cho **toàn bộ các trang còn lại**: Dự án, Cho thuê (danh sách + danh mục + chi tiết),
Tin tức / Tin BĐS (danh sách + danh mục + bài viết), Tuyển dụng (danh sách + chi tiết), Dịch vụ, Liên hệ, Chính sách bảo mật / Điều khoản.

**Mockup đã user duyệt (2026-10-21):** `docs/specs/site-redesign-mockup/index.html`
(chạy: `site-mockup` trong `.claude/launch.json` → http://localhost:4600, thanh trên cùng chuyển 9 trang; nút "Ẩn/hiện chú thích").
**Quyết định đã chốt:** `docs/specs/site-redesign-mockup/DECISIONS.md` — đọc trước khi chia task.

> ⚠️ Như BL-044: **làm đúng bố cục mockup, GIỮ hệ màu/element hiện tại** (token `src/app/(frontend)/globals.css`, font Montserrat,
> nút/chip/badge/ô nhập/icon sẵn có). Phần mới dựng ghép từ token/element có sẵn; không thêm màu/kiểu mới.
> Ngoại lệ đã duyệt: breadcrumb trên ảnh (DECISIONS #1) → thêm token riêng. Chỗ phải lệch mockup → ghi lý do + hỏi user trước.
> Ảnh/chữ/số liệu trong mockup là mẫu.

### Theo loại trang (chi tiết xem mockup + chú thích)
1. **Trang danh sách (Dự án, Cho thuê, Danh mục cho thuê)** — hero ảnh **admin tải lên mỗi trang** (chữ hero sửa được, có EN), chữ trái
   (dòng nhỏ vàng + tiêu đề 2 dòng dòng 2 vàng + mô tả); **bộ lọc thành thẻ trắng nổi đè hero** bố cục như khung tìm kiếm trang chủ
   (ô tìm + TÌM KIẾM · hàng chip loại hình/danh mục · hàng "Tùy chọn khác" dropdown) — **giữ nguyên hành vi lọc/query hiện tại**;
   hàng "N kết quả" + sắp xếp; lưới thẻ kiểu "Dự án nổi bật" (thẻ cho thuê thêm giá + diện tích/phòng ngủ); phân trang mũi tên tròn;
   banner tư vấn cuối trang. Danh sách Dự án có thêm dải Điểm mạnh (dùng lại khối trang chủ).
2. **Trang chi tiết (Dự án, Cho thuê)** — ảnh lớn kiểu hero (bộ đếm 01/N + thanh tiến trình, mũi tên tròn, ảnh nhỏ, nút Video/Xem tất cả ảnh)
   thay lưới ảnh; **khối tiêu đề trắng nổi đè ảnh** (dòng nhỏ loại hình + badge, tên, ghim vị trí, giá vàng, nút chia sẻ) chứa
   **dải thông số icon tròn bên trong** (DECISIONS #5); thanh mục con chip dính; mỗi mục là thẻ trắng có dòng nhỏ vàng + tiêu đề;
   cột phải thẻ liên hệ dính; nền trang **vàng nhạt** `--color-primary-subtle` như hiện tại (DECISIONS #4);
   cuối trang slider "Dự án/Căn tương tự" kiểu "Dự án nổi bật", **đầu khối canh trái, nền trắng** (DECISIONS #6); banner tư vấn.
   Giữ nguyên các component chức năng hiện có (bản đồ, lân cận, mặt bằng, form lead, subnav scroll-spy).
3. **Tin tức / Tin BĐS** — hero thấp; chip danh mục; bài nổi bật (ảnh trái lớn, chữ phải); lưới thẻ chung; **không canh giữa**.
4. **Bài viết** — không hero; breadcrumb trơn; tiêu đề **canh trái**; ảnh bìa bo 20px; cột phải "Bài viết mới" + thẻ tư vấn dính;
   "Bài viết liên quan" canh trái (DECISIONS #3).
5. **Tuyển dụng** — hero thấp; dải 4 ý kiểu Điểm mạnh (canh trái); danh sách vị trí dạng thẻ + nút Ứng tuyển. Chi tiết tuyển dụng theo cùng phong cách.
6. **Liên hệ** — hero thấp; thông tin trái (icon tròn vàng nhạt) + form trong thẻ trắng nổi phải; bản đồ.
7. **Chính sách / Điều khoản** — hero thấp; mục lục dính trái + nội dung thẻ trắng.
8. **Dịch vụ (`/dich-vu/[slug]`)** — không có trong mockup → hero thấp + đầu khối như các trang trên; hỏi user nếu cấu trúc khác lớn.

### Áp dụng toàn site
- **Breadcrumb trên ảnh** (DECISIONS #1): khung bo tròn chỉ bao chữ, góc trên-trái ảnh, nền `--color-primary-deep` @ 13% (`#c9a15f21`),
  blur 4px, chữ trắng + bóng nhẹ, ngăn `›`. Trang không ảnh: breadcrumb trơn. Kiểm độ đọc trên ảnh sáng thật.
- **Bỏ icon tim ở MỌI màn, KỂ CẢ TRANG CHỦ** (DECISIONS #2) — thẻ "Dự án nổi bật" (BL-044), mọi thẻ, nút tim trang chi tiết.

## Acceptance (bắt buộc)
- [ ] Mỗi loại trang 1440 + 390 **khớp bố cục mockup** — chụp màn hình đặt cạnh mockup từng phần; Reviewer FAIL nếu lệch bố cục/thứ tự/vị trí thấy bằng mắt.
- [ ] Không màu/kiểu element mới ngoài token/component hiện có (trừ token breadcrumb đã duyệt). Reviewer FAIL nếu hex/kiểu tự chế.
- [ ] Không còn icon tim ở bất kỳ trang nào, kể cả trang chủ.
- [ ] Không có đầu khối canh giữa ở Tin tức / Bài viết / Tuyển dụng / khối "tương tự".
- [ ] Hành vi hiện có giữ nguyên: lọc/query/phân trang danh sách, form lead, bản đồ, subnav, SEO (1 `h1`/trang, breadcrumb JSON-LD nếu có), i18n vi/en.
- [ ] Ảnh + chữ hero các trang danh sách sửa được trong admin, có bản EN; thiếu ảnh → fallback hợp lý (không vỡ trang).
- [ ] AA tương phản (kể cả chữ breadcrumb trên ảnh sáng), tests/typecheck/build PASS.

## Ghi chú
- Ảnh hưởng dự kiến: `src/components/{listing,projects,rentals,detail,news,posts,careers,contact,legal,services,home,layout}/*`,
  schema global/collection cho hero trang danh sách (thêm trường → migration additive), `globals.css` (token breadcrumb), seed dev.
- Phạm vi lớn → chia task theo nhóm trang, tuần tự; task nền tảng trước (hero trang con + breadcrumb + thẻ dùng chung + bỏ tim).
- Đảo quyết định BL-044 #1 (tim trang trí) → cập nhật spec/test liên quan.
