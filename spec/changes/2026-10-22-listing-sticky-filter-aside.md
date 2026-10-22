---
id: listing-sticky-filter-aside
type: feature
status: in_progress
created: 2026-10-22
---

# Dự án / Cho thuê / Tin BĐS — bộ lọc dính cuộn riêng, thẻ nổi bật bấm cả thẻ, chi tiết 2 cột + form tư vấn dính tới "liên quan"

## Yêu cầu
Áp chung cho cả 3 màn **Dự án**, **Cho thuê**, **Tin BĐS** (vi + en):

1. **Danh sách — bộ lọc dính, cuộn riêng.** Hiện cột "Bộ lọc" cuộn theo cả trang. Đổi thành: ≥ lg cột bộ lọc `sticky` ngay dưới header,
   cao tối đa bằng phần màn hình còn lại, **tự cuộn bên trong** (overflow-y) khi dài hơn; cột kết quả cuộn theo trang như cũ.
   Bộ lọc "di chuyển theo nội dung" — luôn thấy khi kéo danh sách. Hết danh sách (tới khối sau lưới, vd FAQ/CTA) thì thôi dính. Mobile/tablet giữ ngăn kéo hiện tại.
2. **Khối "Dự án nổi bật" / "Tin nổi bật" (SpotlightSlider)** — hiện chỉ nút "Xem chi tiết" mở được chi tiết. Đổi: **bấm vào bất kỳ chỗ nào trên thẻ** (ảnh, tiêu đề,
   mô tả, thông số) đều mở chi tiết. Ngoại lệ giữ hành vi riêng: nút "Nhận tư vấn", mũi tên/chấm chuyển slide, link khác bên trong (nếu có).
   Không lồng `<a>` trong `<a>` (dùng kỹ thuật link phủ / stretched link), focus bàn phím rõ ràng, con trỏ pointer.
3. **Chi tiết — layout 2 cột, form tư vấn dính tới hết nội dung.** Mục tiêu: người dùng đọc thấy hay → muốn tư vấn → form luôn bên cạnh.
   Hiện (đo `/du-an/sun-festo-town-ha-long` 1440): chỉ khối Tổng quan nằm trong lưới 2 cột (`DetailPageShell` children), các khối Vị trí / Tiện ích / Thư viện ảnh /
   Mặt bằng / Pháp lý-Chính sách / Tin đăng / FAQ là `bands` full width ⇒ cột phải chỉ cao bằng form (652px) nên form hết dính gần như ngay.
   Đổi: **mọi khối nội dung** nằm ở cột trái; cột phải (`DetailContactAside`: form + hotline) dính suốt từ đầu nội dung tới khi gặp khối
   "Dự án tương tự" / "Tin liên quan" (`after`) thì kết thúc dính. Khối `after` (liên quan, điểm mạnh, banner tư vấn) vẫn full width.

## Acceptance (bắt buộc)
- [ ] ≥ lg, 3 màn danh sách: kéo trang, bộ lọc luôn nằm trong màn hình dưới header; bộ lọc dài hơn màn hình thì cuộn được bên trong, không bị cắt; cuộn bộ lọc không cuộn trang (overscroll-contain).
- [ ] Hết lưới kết quả thì bộ lọc thôi dính, không đè FAQ/CTA/footer. < lg không đổi (ngăn kéo).
- [ ] Thẻ nổi bật ở 3 màn: bấm ảnh / tiêu đề / vùng trống trên thẻ → vào chi tiết; bấm "Nhận tư vấn" → hành vi cũ (không vào chi tiết); mũi tên/chấm slide không điều hướng. Không lồng `<a>`; Tab tới thẻ được, Enter mở.
- [ ] Chi tiết Dự án / Cho thuê / Tin BĐS ≥ lg: tất cả khối nội dung ở cột trái, form tư vấn + hotline dính cột phải trong suốt quá trình cuộn qua các khối đó; tới "Dự án tương tự"/"Tin liên quan" thì form dừng (không đè khối liên quan).
- [ ] Các khối rộng (bản đồ + danh sách gần đây, thư viện ảnh, bảng giá, mặt bằng, pháp lý-chính sách 2 cột) vẫn đẹp trong cột hẹp hơn — xếp dọc/thu cột khi cần, không tràn ngang.
- [ ] Thanh mục con (sub-nav) + `scroll-mt` các khối vẫn đúng; CTA dính đáy mobile + `#lead-form` vẫn hoạt động.
- [ ] Kiểm 1440 / 1024 / 768 / 390, vi + en.

## Ghi chú
- File liên quan: `src/components/detail/DetailPageShell.tsx` (`bands` vs children), `DetailLayout.tsx` (`DETAIL_ASIDE_STICKY_CLASS`, `DetailAsideFit`), `DetailContactAside.tsx`,
  `src/components/projects/ProjectDetail.tsx` (`useProjectBands`), `rentals/RentalDetail.tsx`, `posts/PostDetail.tsx`; `listing/FilterPanel.tsx`, `listing/SpotlightSlider.tsx`,
  `projects/ProjectSpotlightContent.tsx`, `posts/PostSpotlightContent.tsx`, `*ListBody.tsx`.
- Đây là thay đổi bố cục so với design BL-052 (`docs/specs/listing-detail-redesign/detail-du-an.webp` để các khối full width) — user 2026-10-22 chốt bố cục 2 cột.
- Không đổi schema/API → không migration dự kiến.
