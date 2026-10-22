---
id: news-careers-contact-redesign
type: feature
status: done
completed: 2026-10-22
created: 2026-10-21
---

# Redesign màn Tin tức, Chi tiết tin tức, Tuyển dụng, Chi tiết tuyển dụng, Liên hệ (BL-054)

## Yêu cầu
Áp design mới (ảnh trong `docs/specs/listing-detail-redesign/`) cho 5 màn, đồng bộ style với BL-052 (Dự án / Cho thuê / Tin BĐS):
- `tin-tuc.webp` → `/tin-tuc` (+ `/tin-tuc/danh-muc/[category]`)
- `chi-tiet-tin-tuc.webp` → `/tin-tuc/[slug]`
- `tuyen-dung.webp` → `/tuyen-dung`
- `lien-he.webp` → `/lien-he`
- `chi-tiet-tuyen-dung.webp` → `/tuyen-dung/[slug]` (user gửi 2026-10-21)

Header, footer, banner tư vấn: **giữ nguyên** (component dùng chung) — chỉ đổi phần thân trang.

### Tin tức (danh sách)
- Hero ảnh nền: eyebrow + tiêu đề (phần sau màu nhấn) + mô tả + ô tìm bài có nút "TÌM".
- Chip danh mục (Tất cả + danh mục tin).
- Khối bài nổi bật: 1 bài lớn (ảnh nền, badge danh mục, tiêu đề, tóm tắt, tác giả · ngày · "N phút đọc", nút mũi tên) + cột phải 3 bài nhỏ.
- "Bài viết mới nhất" + sắp xếp; lưới thẻ 3 cột (ảnh, badge danh mục, ngày, tiêu đề, tóm tắt, "N phút đọc", nút mũi tên); phân trang số.
- Cột phải: "Đọc nhiều" (top 5, số thứ tự lớn + ảnh nhỏ + tiêu đề + ngày), khối "Bản tin thị trường" (đăng ký email, nền tối),
  "Chủ đề" (chip tag).

### Chi tiết tin tức
- Badge danh mục, tiêu đề lớn, sapo, tác giả + ngày + "N phút đọc", nút chia sẻ (Facebook, Zalo, copy link, thêm).
- Ảnh bìa + chú thích; đoạn mở đầu đóng khung nền nhạt.
- Cột trái dính: "Mục lục" (mục đang đọc tô đậm, đã có `NewsToc`) + thẻ "Tư vấn miễn phí" (CTA "NHẬN TƯ VẤN").
- Tiêu đề H2 có số thứ tự tròn 01/02/03 tự động; trích dẫn có dấu ngoặc lớn; danh sách dấu tích tròn; dòng "Thẻ:" chip tag.
- "Bài viết liên quan" 3 thẻ + "Xem tất cả tin tức".

### Tuyển dụng
- Hero ảnh: eyebrow + tiêu đề + mô tả + nút "XEM VỊ TRÍ ĐANG TUYỂN" (cuộn tới danh sách).
- "Môi trường để bạn phát triển": 4 phúc lợi (đã có `careersPerks`).
- "Vị trí đang tuyển" + "N vị trí": chip phòng ban (danh mục job), select khu vực, ô tìm; danh sách dạng hàng
  (phòng ban + nhãn "Tuyển gấp", tên vị trí, tỉnh/thành, hình thức, mức lương, "Hạn: dd/mm/yyyy", nút mũi tên).
- "Quy trình ứng tuyển — N bước đơn giản" (icon + số + tiêu đề + mô tả, mũi tên giữa các bước).
- Banner "Chưa tìm thấy vị trí phù hợp? — GỬI CV NGAY" (giữ hành vi gửi CV hiện có).

### Chi tiết tuyển dụng
- Hero ảnh nhạt: breadcrumb, phòng ban + nhãn "Tuyển gấp", tiêu đề 2 dòng (dòng 2 màu nhấn), mô tả ngắn,
  hàng thông tin có icon (tỉnh/thành · hình thức · mức lương · "Hạn nộp: dd/mm/yyyy"), nút "Ứng tuyển ngay" (cuộn tới form) + "Chia sẻ".
- Cột trái (thẻ trắng): "Mô tả công việc", "Yêu cầu", "Quyền lợi" — danh sách dấu chấm tròn màu nhấn (dữ liệu `description` / `requirements` / `benefits` có sẵn).
- Cột phải dính: "Ứng tuyển vị trí này" + "Phản hồi trong 3 ngày làm việc" (chuỗi i18n), form hiện có (Họ tên, SĐT, Email, CV kéo-thả + thẻ file đã chọn có nút xoá,
  đồng ý chính sách, "Gửi hồ sơ"). Ô "Lời nhắn" hiện có giữ lại (tuỳ chọn) dù design không vẽ.
- "Vị trí khác": 4 thẻ (phòng ban, tên, tỉnh/thành, lương, nút mũi tên) + "Xem tất cả vị trí".
- Không cần trường mới ngoài công tắc "Tuyển gấp" (quyết định 7).

### Liên hệ
- Hero ảnh: breadcrumb, eyebrow, tiêu đề 2 dòng, mô tả.
- 4 thẻ nổi đè mép hero: Hotline (Gọi ngay), Email (Gửi email), Zalo OA (Nhắn tin), Giờ làm việc.
- Form "Bạn cần TAMI hỗ trợ điều gì?" (Họ tên, SĐT, Email, Nội dung, đồng ý chính sách, "GỬI YÊU CẦU") — **không** có chip loại yêu cầu.
- "Hệ thống văn phòng": tab chi nhánh + bản đồ + thẻ văn phòng (ảnh, tên, địa chỉ, điện thoại, email, "Chỉ đường").
- Banner "Gia nhập TAMI HOMES" → trang tuyển dụng.

## Quyết định (user chốt 2026-10-21)
1. **"Đọc nhiều": đếm lượt xem bài** — đếm theo ngày (chống đếm trùng cơ bản, không lưu dữ liệu cá nhân), top 5 trong 30 ngày;
   chưa đủ dữ liệu thì bù bằng bài nổi bật / mới nhất.
2. **"Bản tin thị trường": lưu email đăng ký** — danh sách người đăng ký trong admin (email, đồng ý + phiên bản chính sách, ngày, ngôn ngữ),
   chống spam (Turnstile như form lead), xuất Excel. **Chưa** tự gửi mail hàng tuần.
3. **Thêm khối vào trình soạn bài**: "Số liệu nổi bật" (số + mô tả), "Dự án nhắc đến" (chọn dự án → thẻ ảnh/tên/vị trí/loại/tình trạng + "Xem chi tiết"),
   "Ảnh cạnh chữ". Trích dẫn, danh sách tích, số 01/02 cạnh H2 làm bằng style (không cần khối).
4. **Văn phòng: thiết kế cho nhiều văn phòng, hiện dùng 1** — thêm danh sách văn phòng (tên, địa chỉ, ảnh, toạ độ, điện thoại, email) trong Cài đặt website;
   chỉ 1 văn phòng thì ẩn thanh tab. Dữ liệu ban đầu lấy từ `address` / `mapLocation` / hotline / email hiện có (không mất dữ liệu).
5. **Giờ làm việc**: thêm ô giờ + ngày làm việc (localized) trong Cài đặt website; trống thì ẩn thẻ.
6. **Không** làm chip loại yêu cầu trên form liên hệ.
7. **"Tuyển gấp"**: thêm công tắc cho tin tuyển dụng.
8. **Quy trình ứng tuyển**: sửa trong admin (danh sách bước: tiêu đề + mô tả + icon, localized) cạnh `careersPerks`; trống thì ẩn.
9. "N phút đọc": tính tự động từ nội dung bài (không thêm trường).
10. Chi tiết tuyển dụng: theo `chi-tiet-tuyen-dung.webp`, dùng trường hiện có.

## Acceptance (bắt buộc)
- [ ] 5 màn khớp bố cục ảnh design ở desktop; responsive mobile/tablet hợp lý (cột phải tin tức xuống dưới, mục lục chi tiết thành nút gập trên mobile).
- [ ] Trường/collection mới có trong admin (nhãn tiếng Việt, localized khi là chữ), migration versioned, chỉ ADD, không mất dữ liệu cũ.
- [ ] Đếm lượt xem không làm chậm trang ISR (ghi bất đồng bộ / qua API), bot không tính; không lưu IP thô.
- [ ] Đăng ký bản tin: validate email, chống trùng, consent bắt buộc, Turnstile, có thông báo thành công/lỗi.
- [ ] Khối mới trong trình soạn hiển thị đúng ở web, bản EN dùng được.
- [ ] Khối trống (Đọc nhiều, Quy trình, Giờ làm việc, tab văn phòng khi chỉ 1…) ẩn gọn.
- [ ] Bản EN hoạt động như VI (nhãn i18n đủ).
- [ ] Test + typecheck + lint + build PASS.

## Ghi chú
- Liên quan BL-052 (`spec/changes/2026-10-21-listing-detail-redesign.md`): dùng chung hero, thẻ, phân trang, style — nên làm sau/tái dùng component của BL-052.
- Code liên quan: `src/components/news/*`, `src/components/careers/*`, `src/components/contact/*`, `src/collections/{News,JobPostings}.ts`,
  `src/globals/SiteSettings.ts` (+ `site-settings/`), trình soạn richText (`createRichTextEditor`), `src/collections/ClickEvents.ts` (tham khảo cách ghi sự kiện).
- Tuân thủ dữ liệu cá nhân (email bản tin) theo chính sách bảo mật hiện có.

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
