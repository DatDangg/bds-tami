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

### Bổ sung 2026-10-21 (user duyệt ghép từ `docs/reviews/2026-10-21-admin-audit.md` §3–§8 — chỉ phần sửa UI, không đổi schema)
11. **Form Lead:** 5 ô UTM + Trang gửi/Trang đến (URL dài) phơi ra tab Nguồn; 5 mốc thời gian/số (`assignedAt`, `firstContactedAt`, `lastActivityAt`, `mergedCount`, `remindedAt`) chiếm hết cột phải; `anonymizedAt` ("Ngày xoá thông tin cá nhân") làm sale tưởng sắp mất khách; SĐT/email chỉ là chữ, không bấm gọi/nhắn được; `locale` hiện như ô phải chọn; ngày đồng ý chính sách nằm lẫn với dữ liệu nghiệp vụ.
12. **Form Dự án:** ô Danh mục xổ ra cả danh mục của loại khác, chọn nhầm thì lưu mới báo lỗi; Mô tả ngắn không có bộ đếm ký tự; ô Pháp lý / Chính sách bán hàng trống trơn, biên tập viên không biết viết gì; giá VND dài dễ gõ thừa/thiếu số 0; "Ngày cập nhật bảng giá" phải mở lịch chọn.
13. **Form Cho thuê:** mã tin `CT-…` nằm nhỏ ở cột phải — khách đọc mã qua điện thoại, sale khó đối chiếu.
14. **Tin tuyển dụng:** quá hạn nộp thì web tự ẩn nhưng admin không báo → nhân sự tưởng tin vẫn chạy.
15. **Cấu hình chung:** `privacyPolicyVersion` hiện thành ô text to (chỉ đọc); ô mã GA không hướng dẫn lấy ở đâu; bảng từ khoá dịch không có ví dụ.
16. **Ảnh (media):** thiếu "Mô tả ảnh (alt)" thì không lưu được → tải nhiều ảnh phải gõ từng cái.

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
- [ ] **Lead:** UTM (5 ô) + Trang gửi/Trang đến gom vào khối thu gọn "Dữ liệu chiến dịch marketing" (mặc định đóng; URL rút gọn, bấm mở được); ngày/phiên bản đồng ý chính sách xuống cuối tab Nguồn dạng chỉ đọc; các mốc thời gian gom thành 1 dòng tóm tắt (vd "Hoạt động gần nhất: 2 giờ trước · khách gửi lại 2 lần"); **ẩn `anonymizedAt`** khỏi form; SĐT có nút **Gọi** (`tel:`) + **Zalo**, email có nút **Gửi email** (`mailto:`); ngôn ngữ khách hiện dạng nhãn chỉ đọc.
- [ ] **Dự án / mọi trường Danh mục:** ô chọn chỉ liệt kê danh mục đúng loại (`filterOptions` theo scope) — validator cũ giữ nguyên.
- [ ] **Mô tả ngắn** (mọi collection có `summary`): bộ đếm ký tự + gợi ý độ dài 150–200.
- [ ] **Pháp lý / Chính sách bán hàng** (Dự án): chữ gợi ý mẫu khi trống (vd "Quyết định phê duyệt 1/500 số…", "Chiết khấu 5% khi thanh toán sớm…") — chỉ placeholder, không chèn sẵn nội dung.
- [ ] **Ô giá VND** (Dự án, Cho thuê, bảng giá, lương): dòng đọc bằng chữ ngay dưới ô (vd "≈ 3,5 tỷ đồng").
- [ ] **Ngày cập nhật bảng giá:** nút 1 chạm "Hôm nay".
- [ ] **Cho thuê:** mã tin `CT-…` hiện to ở đầu form (cạnh tiêu đề), có nút sao chép.
- [ ] **Tin tuyển dụng:** badge "Đã quá hạn" (form + cột danh sách) khi `deadline` < hôm nay.
- [ ] **Cấu hình chung:** `privacyPolicyVersion` thành nhãn thông tin nhỏ; mô tả ô mã GA chỉ chỗ lấy mã (Google Analytics → Quản trị → Luồng dữ liệu); bảng từ khoá dịch có ví dụ ("Căn hộ dịch vụ" → "Serviced Apartment").
- [ ] **Ảnh:** khi tải lên mà trống alt → tự điền alt mặc định (tên file đã làm sạch, hoặc tiêu đề bài nếu tải từ form bài) thay vì chặn lưu; vẫn sửa được; ảnh đã có alt không đổi. Agent xác nhận cách này không làm yếu kiểm tra a11y/SEO ở web công khai.
- [ ] Không đổi schema/slug/URL/access/dữ liệu đã có; test hiện có PASS.

## Ghi chú
- Liên quan: BL-040 (chữ/nhãn — bảng chữ dùng chung, tránh sửa trùng), BL-039 (danh sách/cột), BL-041 (sidebar).
- Kỹ thuật dự kiến (agent phân tích lại): Lexical `FixedToolbarFeature` trong editor config; nhãn locale qua custom Label/CSS; `defaultValue` người tạo từ `req.user`; `admin.placeholder`; `admin.condition`/collapsible cho slug + nhóm dịch.
- Doc impact dự kiến: FR-ADM (form admin) trong spec, `docs/DESIGN.md` phần admin.
- Nguồn bổ sung: `docs/reviews/2026-10-21-admin-audit.md` (đối chiếu code trước khi sửa — tài liệu chưa kiểm hết). Phạm vi lớn → agent nên chia nhiều task theo màn.
- **Ngoài phạm vi** (cần đổi schema hoặc component lớn — hoãn, chưa BL): bản đồ chọn vị trí, bộ chọn icon, lý do "Không thành" dạng danh sách, tên hiển thị tài liệu PDF, quý/năm bàn giao, tạo tiêu đề chuẩn + tự điền Tỉnh/Phường cho Cho thuê, thời hạn ưu đãi 7/15/30 ngày, gợi ý tag, cắt ảnh bìa, Lead dạng dòng thời gian.
