---
id: admin-form-non-tech-friendly
type: feature
status: done
done: 2026-10-21
spec_version: 1.38.0
scopeVersion: 48
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

## Bảng điểm sửa (checkpoint — agent tự duyệt theo chỉ thị user 2026-10-21 "auto proceed, khỏi hỏi lại")
> Đối chiếu code (Payload 3.91, `@payloadcms/richtext-lexical` 3.91) trước khi lập. Ảnh mock thay bằng mô tả (auto proceed). Không đổi schema/DB/access/endpoint.

| # | Màn | Điểm khó dùng | Cách sửa (quyết định) | Task |
|---|---|---|---|---|
| 1 | Mọi form | Đuôi "— Tiếng Việt"/"— vi" sau nhãn trường dịch được (`FieldLabel` `.localized`) | Ẩn bằng CSS admin; ngôn ngữ đang sửa thể hiện 1 chỗ = ô chọn ngôn ngữ ở thanh trên (BL-039 đã có nhãn "Tiếng Việt/English"), thêm tiền tố "Đang sửa:" nếu làm được bằng chữ/CSS, không thay component Payload | T01 |
| 2 | Mọi ô richText | Không thanh công cụ, chữ "nhấn '/'", không viền, "+"/ô vuông lạ | `lexicalEditor` toàn cục: `FixedToolbarFeature` + `admin.hideGutter/hideAddBlockButton/hideDraggableBlockElement`, `placeholder` tiếng Việt "Nhập nội dung tại đây…"; khung viền như ô khác bằng CSS; nút Hoàn tác/Làm lại = feature client nhỏ (lexical không có sẵn) — không được thì residual (Ctrl+Z) | T01 |
| 3 | Mọi form | Trường validate bắt buộc theo ngôn ngữ (`requiredByLocale`, `scopedCategoryField`) không có * | Đánh dấu * cho trường dùng `requiredByLocale`/danh mục bắt buộc (helper chung, chỉ `admin`); lỗi Payload đã hiện dưới ô bằng câu tiếng Việt — giữ | T01 |
| 4 | Mọi nội dung | Ô trống không gợi ý | `admin.placeholder` cho Tiêu đề (theo collection, vd Dự án "VD: Vinhomes Grand Park"), Mô tả ngắn, các ô quan trọng | T01 (chung) + T02 (Dự án) |
| 5 | Mọi nội dung | "Người tạo *" bắt chọn | `defaultValue` = người đang đăng nhập (hàm, không là default DB); hook `defaultToCreator` giữ; quyền đổi giữ (chỉ admin) | T01 |
| 6 | Mọi nội dung | Đường dẫn (slug) ở cột phải | Gom vào khối thu gọn "Nâng cao" ở cột phải (`collapsible` không tên, `initCollapsed`) — đường dẫn dữ liệu không đổi; mô tả ngắn lại | T01 |
| 7 | Mọi nội dung | "Có bản tiếng Anh" khó hiểu; tab "Bản dịch" đầy trường hệ thống | Mô tả 1 câu cho `hasEnglish`; trong nhóm `translation` ẩn (`admin.hidden`) các trường hệ thống, thêm 1 dòng tóm tắt trạng thái ("Bản tiếng Anh: đã dịch tự động lúc …") + giữ nút "Dịch lại" | T01 |
| 8 | Mọi form tạo | Tiêu đề "[Chưa có tiêu đề]" + "Đang tạo mới Dự án" | Ghi đè chữ Payload ở `payload-vi-overrides.ts`: tạo mới = "Thêm {{label}} mới"; tiêu đề trống khi tạo không hiện "[Chưa có tiêu đề]" (chữ thay "Chưa đặt tên") | T01 |
| 9 | Form có quan hệ | Nút "+" không chữ | Nút thêm mới cạnh ô quan hệ hiện chữ/tooltip "Thêm mới" (CSS/ARIA, không thay component) — tab "Nội dung mở rộng" đã đổi "Bảng giá & thông tin thêm" ở BL-040, giữ | T01 |
| 10 | Mọi nội dung | "Ngày xuất bản" xám như khoá | Mô tả: "Tự điền khi xuất bản lần đầu." | T01 |
| 12a | Mọi ô Danh mục | Xổ cả danh mục loại khác | `scopedCategoryField` ĐÃ có `filterOptions: { scope }` — builder xác minh trên app; lỗi thật thì sửa, đúng thì ghi "đã có" | T02 |
| 12b | Mô tả ngắn (mọi collection có `summary`) | Không đếm ký tự | Thành phần `afterInput` đếm ký tự + gợi ý 150–200 | T02 |
| 12c | Dự án | Pháp lý / Chính sách trống trơn | `editor` riêng có `placeholder` mẫu (chỉ placeholder) | T02 |
| 12d | Giá VND (Dự án, Cho thuê, Tin BĐS, bảng giá, lương) | Dễ gõ thừa/thiếu số 0 | `afterInput` dòng đọc bằng chữ "≈ 3,5 tỷ đồng" | T02 |
| 12e | Ngày cập nhật bảng giá | Phải mở lịch | Nút "Hôm nay" (`afterInput`) | T02 |
| 11 | Lead | UTM/URL, mốc thời gian, anonymizedAt, SĐT/email, locale, consent | Collapsible "Dữ liệu chiến dịch marketing" (đóng) gồm UTM + Trang gửi/đến (URL rút gọn, link mở tab mới); consent xuống cuối tab Nguồn chỉ đọc; mốc thời gian ẩn khỏi form, thay 1 dòng tóm tắt (`ui`); `anonymizedAt` `admin.hidden`; nút Gọi (`tel:`) / Zalo (`https://zalo.me/<sđt>`) / Gửi email (`mailto:`); `locale` chỉ đọc dạng nhãn | T03 |
| 13 | Cho thuê | Mã `CT-…` nhỏ | Khối mã to đầu form + nút sao chép (`ui`) | T04 |
| 14 | Tin tuyển dụng | Quá hạn không báo | Badge "Đã quá hạn" ở form + cột danh sách (theo `startOfVietnamDay`) | T04 |
| 15 | Cấu hình chung | privacyPolicyVersion ô to; GA; glossary | Nhãn thông tin nhỏ (`ui`/Field tuỳ biến chỉ đọc); mô tả chỉ chỗ lấy mã GA; ví dụ glossary | T04 |
| 16 | Ảnh | Thiếu alt chặn lưu | Hook `beforeValidate` media: ảnh trống alt → alt = tên file đã làm sạch; validator giữ; ảnh có alt không đổi | T04 |
| — | Các collection khác (Tin tức, Tin BĐS, Dịch vụ, Trang, Chủ đầu tư, Danh mục, Tuyển dụng, Hồ sơ, Nhân sự, globals) | Các điểm 1–10 | Hưởng thay đổi chung T01; placeholder tiêu đề theo collection | T01 |

### Quyết định tự xử lý (auto proceed)
- Q1 Không tạo thanh "Đang sửa: Tiếng Việt" riêng: dùng ô ngôn ngữ sẵn có của Payload (1 chỗ, đã có nhãn từ BL-039) để không thay component Payload.
- Q2 Slug vào khối "Nâng cao" ở cột phải (không chuyển sang tab SEO) để collection không có tab cũng giống nhau.
- Q3 Alt mặc định = tên file đã làm sạch (bỏ đuôi, `-`/`_` → khoảng trắng); không lấy tiêu đề bài (Payload upload drawer không biết bài cha một cách tin cậy) — ghi residual.
- Q4 Zalo dùng `https://zalo.me/<số chuẩn hoá 0xxxxxxxxx>` (không cần app id).
- Q5 Thứ tự task: T01 chung → T02 Dự án + trường số/giá → T03 Lead → T04 Cho thuê/Tuyển dụng/Cấu hình chung/Ảnh; tuần tự (cùng file chung).

## Kết quả (2026-10-21)
- Done: T01 865ee10 · T02 a0aaa2c · T03 f4437c3 · T04 bfa5d5f · T05 2f59c9b (sửa 16 test bộ đầy đủ) + close-out. Spec 1.38.0 / scope v48.
- Residual: tiêu đề lớn màn tạo mới vẫn "[Chưa đặt tên]" (thanh nút "Thêm … mới"); không có tiền tố "Đang sửa:"; dấu * hiện cả bản en; alt tự điền chỉ từ tên file (không lấy tiêu đề bài); chưa kiểm trên trình duyệt (cần QA tay); MINOR review để lại (mailto ?/&, +84 0…, nút Hôm nay bỏ qua readOnly, aria-live bộ đếm).
