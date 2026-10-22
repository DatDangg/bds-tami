---
id: listing-detail-design-match
type: bug
status: done
created: 2026-10-22
---

# Màn chi tiết + danh sách Dự án / Cho thuê / Tin BĐS chưa khớp ảnh design (BL-056)

## Yêu cầu
User so UI local với ảnh `docs/specs/listing-detail-redesign/list-du-an.webp` + `detail-du-an.webp` và thấy chưa đúng.
Bước soi read-only đã ghi lại các chỗ lệch: `tasks/bug-listing-detail-design-match/scan.md`. User chốt sửa gom 1 task gồm **A1–A5 + A8**.
A6 (breadcrumb trên hero) và A7 (carousel "Dự án tương tự") **giữ nguyên**. Nhóm B (thiếu dữ liệu CMS) **không** thuộc change này.

1. **A1. Thanh thông số chi tiết** (cả 3 màn): giá trị dài ("Chủ đầu tư", "Loại hình") đang xuống 3–4 dòng làm thanh cao gấp đôi.
   Design: mỗi giá trị 1 dòng, thanh thấp. Code: `src/components/detail/DetailSpecBar.tsx:31,41`.
2. **A8. Tổng quan chỉ hiện đoạn giới thiệu ngắn** (user chốt 2026-10-22):
   - Ưu tiên `summary`; không có `summary` thì lấy **đoạn đầu** của `overview` (rich text).
   - Nội dung `overview` đầy đủ **gập lại sau nút "Xem thêm"** (bấm để mở/thu), vẫn render trong HTML để SEO không mất chữ.
   - Hiện tại có `overview` là in nguyên bài, gồm bullet Tên dự án / Chủ đầu tư / Vị trí / Quy mô…, trùng với lưới thông tin
     (`src/components/projects/ProjectOverview.tsx:64-68`). Áp cùng cách cho Cho thuê + Tin BĐS (đang có mục "Thông tin chính" dạng bullet).
3. **A2. Bố cục khối Tổng quan dự án**: design có lưới thông tin **2 cột** (icon + nhãn + giá trị) rộng ~55% + thẻ sản phẩm 3 ô + 1 ô bên phải;
   hiện tại lưới 1 cột hẹp + thẻ 2×2 (`ProjectOverview.tsx:69`).
4. **A3. Form "Nhận thông tin dự án"** ở cột phải: design là ô nhập có icon + placeholder (không nhãn trên ô), nút "NHẬN TƯ VẤN NGAY →" full-width.
   Hiện tại nhãn trên ô, nút nhỏ căn trái. Lưu ý giữ accessibility (nhãn ẩn trực quan / `aria-label`), validate + lỗi hiển thị như cũ.
5. **A4. Khối Tiện ích** khi không có ảnh đại diện / mô tả: hiện chỉ còn 1 chip nhỏ trong ô hẹp, trông trống.
   Cần layout danh sách tiện ích (icon + tên [+ mô tả]) chiếm đủ chiều ngang khi thiếu ảnh. Có ảnh thì theo design (ảnh lớn trái + danh sách phải).
6. **A5. Thẻ nổi bật ở trang danh sách**: "NHẬN TƯ VẤN" phải là **nút viền** (outline) cạnh "XEM CHI TIẾT", không phải link chữ (cả 3 màn).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: khách (public), desktop 1440px — `/du-an/the-crown-dai-hoang-son-bac-ninh`, `/du-an/<sun-festo-town…>`,
  `/cho-thue/<slug>`, `/tin-bds/<slug>`, `/du-an`, `/cho-thue`, `/tin-bds` (+ `/en`)
- Bước tái hiện: mở trang chi tiết, so với `detail-du-an.webp`
- Expected: như design (xem từng mục trên)
- Actual: như mô tả A1–A5, A8; ảnh chụp user gửi 2026-10-22 (Tổng quan Sun Festo Town: bullet trùng lưới thông tin)

## Acceptance (bắt buộc)
- [ ] A1: ở ≥ xl, mọi ô thanh thông số giữ 1 dòng giá trị (cắt `…` + `title` hiện đủ, hoặc cách tương đương), thanh không cao hơn ô 1 dòng; mobile/tablet không tràn ngang.
- [ ] A8: Tổng quan hiện `summary`, không có thì hiện đoạn đầu của `overview`; có nội dung đầy đủ thì có nút "Xem thêm" / "Thu gọn" (i18n VI/EN), nội dung đầy đủ có trong HTML; không có nội dung dài thì không hiện nút.
- [ ] A8 áp cho Dự án, Cho thuê, Tin BĐS.
- [ ] A2: ở ≥ xl lưới thông tin 2 cột, thẻ sản phẩm bên phải theo design; không có sản phẩm thì lưới thông tin chiếm full chiều ngang.
- [ ] A3: form có icon trong ô + placeholder, nút full-width; vẫn có nhãn cho trình đọc màn hình; submit/lỗi/captcha chạy như cũ.
- [ ] A4: thiếu ảnh tiện ích thì danh sách tiện ích không bị co trong ô hẹp.
- [ ] A5: "NHẬN TƯ VẤN" trên thẻ nổi bật là nút outline ở cả 3 màn danh sách.
- [ ] Bằng chứng trình duyệt VI/EN × mobile/tablet/desktop cho các màn trên.
- [ ] Test + typecheck + lint + build PASS.

## Ghi chú
- Thuộc phạm vi redesign BL-052 (spec/changes/archive/2026-10-21-listing-detail-redesign.md); không đổi schema / không cần migration.
- Nhóm B (thiếu dữ liệu: header CTA, Tìm nhanh, Tìm hiểu thêm + FAQ, hotline, toạ độ / địa điểm lân cận, ảnh + mô tả tiện ích,
  The Crown `scale.landAreaM2 = 350` nhập sai đơn vị) là việc nhập nội dung trong admin, không thuộc change này.
