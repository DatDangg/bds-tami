---
id: consult-popup-30s
type: feature
status: done
created: 2026-10-23
---

# Popup "Nhận tư vấn" tự hiện sau 30 giây ở mọi trang

## Yêu cầu
Thêm popup form điền thông tin nhận tư vấn (lead) hiển thị trên **mọi màn public** khi khách ở lại **30 giây**,
**tối đa 1 lần / lượt truy cập** (user 2026-10-23).

## Acceptance (bắt buộc)
- [ ] Popup tự mở sau 30s khách ở trên site (đếm theo lượt truy cập, không reset khi chuyển trang trong cùng lượt).
- [ ] Mỗi lượt truy cập chỉ hiện 1 lần (đã hiện / đã đóng / đã gửi → không hiện lại trong lượt đó).
- [ ] Form gửi lead dùng đúng luồng lead hiện có (collection leads, validate, chống spam như form tư vấn khác), có nguồn lead phân biệt được là "popup".
- [ ] Đóng được bằng nút ×, Esc, click nền; focus trap + trả focus; đủ a11y (dialog có nhãn).
- [ ] Song ngữ vi / en; responsive 390 / 768 / 1440; dark mode.
- [ ] Không hiện ở admin (`/admin`).

## Ghi chú
**User đã chốt (2026-10-23):**
- "1 lần / truy cập" = theo **phiên trình duyệt** (sessionStorage): trong lúc xem, chuyển trang không hiện lại; đóng hết tab rồi vào lại web → hiện lại sau 30s. Không reset theo ngày.
- **Không hiện ở `/lien-he`** (vi + en); khách đang gõ dở form khác (focus trong form) → hoãn tới khi rời form mới hiện.
- **Cố định 30s trong code**, không có cấu hình admin (không migration).
- Trường form: tái dùng form tư vấn hiện có (`LeadForm`), nguồn lead = popup.
- Nguồn lead: **thêm giá trị `popup`** vào `leads.source` (migration additive `ALTER TYPE enum_leads_source ADD VALUE 'popup'`, user duyệt 2026-10-23); "không migration" chỉ áp cho cấu hình admin.
