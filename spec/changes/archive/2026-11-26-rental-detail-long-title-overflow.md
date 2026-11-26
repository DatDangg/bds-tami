---
id: rental-detail-long-title-overflow
type: bug
status: done
created: 2026-11-26
---

# Chi tiết tin cho thuê: tiêu đề chuỗi dài liền bị cắt + trang tràn ngang ở 390px — QA 42

## Yêu cầu
Tiêu đề (và nội dung text dài không có khoảng trắng) phải tự xuống dòng; trang không tràn ngang trên mobile.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: Khách, mobile 390 — `/cho-thue/test-thu-sale2`.
- Bước: mở trang ở 390px, vuốt ngang.
- Expected: tiêu đề tự xuống dòng, trang không tràn ngang.
- Actual: tiêu đề "test thu sale2546456565456000…" (chuỗi liền) bị cắt chữ; document rộng 587px trên màn 390px → cuộn ngang được. Ảnh: bug42-1.png, bug42-2.png (sheet QA).

## Acceptance (bắt buộc)
- [ ] 390: `document.documentElement.scrollWidth <= 390` ở trang chi tiết tin cho thuê có tiêu đề chuỗi dài liền
- [ ] Tiêu đề H1 (và breadcrumb/thẻ liên quan nếu cùng lỗi) xuống dòng được (`overflow-wrap:anywhere`/`break-words`), không cắt chữ
- [ ] Kiểm tương tự trang chi tiết Tin BĐS nếu dùng chung layout
- [ ] Desktop không đổi ngoài ý muốn

## Ghi chú
Nguồn: QA sheet dòng 42 (20/11/2026, Trung bình).
