---
id: admin-form-non-tech-friendly
type: feature
status: pending
created: 2026-10-20
---

# Admin: form soạn nội dung dễ dùng cho người KHÔNG rành công nghệ (bắt đầu từ Dự án → áp mọi collection)

## Yêu cầu
User 2026-10-20 (kèm ảnh màn **Dự án → Tạo mới**): "admin là cho người dùng không biết tech chứ không phải cho người dùng biết tech mà làm như này".

Nguyên tắc: người nhập liệu là nhân viên văn phòng/sale — nhìn form phải biết ngay **ô nào bắt buộc, gõ gì vào, bấm gì để định dạng**, không gặp ký hiệu/thuật ngữ dev. BL-040 lo **chữ** (nhãn/mô tả); change này lo **cách form hiển thị và hoạt động**.

Điểm khó dùng thấy trên ảnh:
1. **Đuôi "— vi"** sau mọi nhãn trường dịch được (Tiêu đề — vi, Mô tả ngắn — vi, Pháp lý — vi…) → người dùng không hiểu "vi" là gì.
2. **Ô soạn thảo văn bản (Tổng quan dự án / Pháp lý / Chính sách bán hàng)**: không có thanh công cụ, chỉ chữ mờ "Bắt đầu gõ, hoặc nhấn '/' để gọi lệnh…" — người dùng không biết gõ "/"; không có khung viền như các ô khác nên không nhận ra là ô nhập; "Tổng quan dự án" hiện dấu "+" và ô vuông lạ trông như lỗi.
3. **Không biết ô nào bắt buộc**: "Mô tả ngắn" bắt buộc (validate) nhưng không có dấu *; chỉ biết khi bấm Lưu bị lỗi.
4. **Ô trống không có gợi ý** (placeholder/ví dụ): Tiêu đề, Mô tả ngắn, Đường dẫn…
5. **"Người tạo *"** bắt người dùng tự chọn → phải tự điền người đang đăng nhập.
6. **"Đường dẫn (slug)"** + mô tả "Trùng sẽ tự thêm -2, -3…" nằm ngay cột phải — trường kỹ thuật, nên tự sinh và để gọn vào phần nâng cao/SEO.
7. **"Có bản tiếng Anh"** checkbox + tab **"Bản dịch"** (dấu nội dung nguồn, mô hình AI, lỗi gần nhất…) — người dùng không hiểu bật để làm gì, tab đầy thông tin hệ thống.
8. **Tiêu đề trang "[Chưa có tiêu đề]"** + "Đang tạo mới Dự án" — nên là "Thêm dự án mới".
9. **Tab "Nội dung mở rộng"** mơ hồ; nút "+" cạnh Danh mục/Người tạo không có chữ (người dùng không biết là "thêm mới").
10. "Ngày xuất bản" xám như bị khoá — không rõ để trống thì sao.

## Acceptance (bắt buộc)
- [ ] **Checkpoint trước khi code:** rà form tạo/sửa của **mọi** collection + global (Dự án trước) → bảng `màn / điểm khó dùng / cách sửa` + ảnh mock (hoặc mô tả) cho user duyệt.
- [ ] Bỏ đuôi "— vi"/"— en" khỏi nhãn; ngôn ngữ đang sửa thể hiện 1 chỗ rõ ràng (vd thanh trên: "Đang sửa: Tiếng Việt").
- [ ] Ô soạn thảo văn bản có **thanh công cụ cố định luôn hiện** (đậm, nghiêng, tiêu đề, danh sách, liên kết, chèn ảnh, hoàn tác) + khung viền như ô khác + chữ gợi ý tiếng Việt dễ hiểu; không còn ký hiệu "+"/ô vuông lạ khi trống.
- [ ] Mọi trường bắt buộc (kể cả validate theo ngôn ngữ) có dấu *; lỗi hiện ngay dưới ô bằng câu dễ hiểu.
- [ ] Ô quan trọng có placeholder/ví dụ (vd Tiêu đề: "VD: Vinhomes Grand Park").
- [ ] "Người tạo" tự điền người đang đăng nhập (vẫn đổi được nếu có quyền).
- [ ] Đường dẫn tự sinh từ tiêu đề, chuyển vào phần SEO/nâng cao (thu gọn mặc định); trường hệ thống của bản dịch ẩn hoặc chỉ hiện trạng thái tóm tắt 1 dòng ("Bản tiếng Anh: đã dịch tự động lúc …") + nút "Dịch lại".
- [ ] "Có bản tiếng Anh" có giải thích 1 câu (bật thì website hiện trang tiếng Anh, hệ thống tự dịch).
- [ ] Nút "+" có chữ/tooltip "Thêm mới"; tiêu đề trang tạo mới = "Thêm <tên mục> mới".
- [ ] Không đổi schema/slug/URL/access/dữ liệu đã có; test hiện có PASS.

## Ghi chú
- Liên quan: BL-040 (chữ/nhãn — bảng chữ dùng chung, tránh sửa trùng), BL-039 (danh sách/cột), BL-041 (sidebar).
- Kỹ thuật dự kiến (agent phân tích lại): Lexical `FixedToolbarFeature` trong editor config; nhãn locale qua custom Label/CSS; `defaultValue` người tạo từ `req.user`; `admin.placeholder`; `admin.condition`/collapsible cho slug + nhóm dịch.
- Doc impact dự kiến: FR-ADM (form admin) trong spec, `docs/DESIGN.md` phần admin.
