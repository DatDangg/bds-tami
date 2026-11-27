---
id: admin-language-tabs
type: feature
status: pending
created: 2026-11-27
---

# Admin: tab Tiếng Việt / Tiếng Anh đầu form + trạng thái bản tiếng Anh + câu tiếng Việt gốc khi sửa bản tiếng Anh

## Yêu cầu
Form admin khó phân biệt đang sửa bản tiếng Việt hay tiếng Anh (chỉ có ô "Ngôn ngữ" nhỏ góc trên). User chọn phương án tab (2026-11-27, xem mockup trong chat):
- Hai tab "Tiếng Việt | Tiếng Anh" ngay đầu form của mọi collection/global có bản dịch; bấm tab = chuyển ngôn ngữ (như ô Ngôn ngữ).
- Cạnh tab Tiếng Anh: trạng thái bản tiếng Anh (Chưa dịch / Đang dịch / AI đã dịch / Sửa tay / Cần xem lại / Dịch lỗi / Chờ duyệt).
- Ở tab Tiếng Anh: dưới mỗi ô chữ (text/textarea) có bản dịch hiện câu tiếng Việt gốc để đối chiếu.

## Acceptance (bắt buộc)
- [ ] Tab hiện ở News/Projects/Rentals/… và global có bản dịch; không hiện ở collection không có bản dịch, không hiện trong drawer sửa nhanh.
- [ ] Bấm tab đổi `?locale=` giống Localizer của Payload.
- [ ] Trạng thái cạnh tab khớp `translation.*`.
- [ ] Tab Tiếng Anh: ô text/textarea localized có dòng "Bản tiếng Việt: …" (bỏ qua khi bản Việt trống).
