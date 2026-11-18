---
id: mobile-card-carousel-nav
type: modify
status: done
created: 2026-11-17
---

# Mobile: dãy thẻ cuộn ngang cắt thẻ kế tiếp, không có mũi tên/dot điều hướng — QA 36

## Yêu cầu
Ở mobile, các dãy thẻ cuộn ngang phải cho người dùng biết và đi được tới các thẻ còn lại: hiển thị phù hợp bề rộng màn, vuốt được, có nút điều hướng và dot chỉ vị trí.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Khách, mobile 375 — Trang chủ (Dự án nổi bật, Thuê nhà ở & kinh doanh); chi tiết dự án (Dự án tương tự); chi tiết tin BĐS (Tin liên quan).
- Bước: mở trang ở mobile → cuộn tới dãy thẻ → quan sát thẻ đầu và thẻ bên phải → thử vuốt / tìm nút điều hướng.
- Expected: thẻ vừa bề rộng màn, xem đủ từng thẻ bằng vuốt hoặc điều hướng, có dot chỉ slide.
- Actual: thẻ kế tiếp chỉ hiện một phần ở mép phải, không có mũi tên next hay chỉ báo cuộn. Ảnh: bug36-1..4.png (sheet QA).

## Acceptance (bắt buộc)
- [ ] Áp dụng cho đủ 4 khu vực trên, dùng chung 1 component/cách làm
- [ ] Vuốt ngang được (scroll-snap), có nút trước/sau và dot chỉ vị trí; dot/nút cập nhật khi vuốt
- [ ] A11y: nút có nhãn, dùng được bàn phím, tôn trọng reduced-motion; vùng chạm ≥ 44px
- [ ] Desktop/tablet không đổi bố cục ngoài ý muốn
- [ ] Ảnh chụp 375 / 768 / 1440 · test hồi quy

## Ghi chú
Đụng design-spec (thêm điều hướng cho dãy thẻ) → cần cập nhật `.context/design-spec.md`. Nguồn: QA sheet dòng 36 (11/11/2026, Trung bình).
