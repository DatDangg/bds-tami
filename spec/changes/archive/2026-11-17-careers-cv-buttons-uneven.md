---
id: careers-cv-buttons-uneven
type: bug
status: done
created: 2026-11-17
---

# Tuyển dụng mobile: nút "Gửi CV ngay" và "Sao chép email" lệch kích thước — QA 37

## Yêu cầu
Hai nút ở khu vực "Chưa tìm thấy vị trí phù hợp" phải cân đối, cùng kích thước/căn chỉnh trên mobile.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Khách, mobile 375 — `/tuyen-dung`, khu vực "Chưa tìm thấy vị trí phù hợp".
- Expected: 2 nút cùng chiều rộng/chiều cao, căn thống nhất.
- Actual: "Gửi CV ngay" rộng hơn "Sao chép email". Ảnh: bug37.png (sheet QA).

## Acceptance (bắt buộc)
- [ ] 375 / 390: 2 nút cùng chiều rộng (xếp dọc full-width hoặc chia đều 1 hàng), cùng chiều cao ≥ 44px
- [ ] Desktop không đổi ngoài ý muốn; trạng thái không có email (BL-120) không hỏng
- [ ] Ảnh chụp 375 / 768 / 1440

## Ghi chú
Liên quan BL-114 (nút Sao chép email), BL-120. Nguồn: QA sheet dòng 37 (11/11/2026, Thấp).
