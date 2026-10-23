---
id: news-toc-compact
type: feature
status: done
created: 2026-10-23
---

# Mục lục chi tiết tin tức quá hẹp → quá dài, phải cuộn

## Yêu cầu
Mục lục ở trang chi tiết tin tức (`/tin-tuc/[slug]`, cột trái dính, BL-062) **bé quá** → mỗi mục xuống nhiều dòng → mục lục
**dài, phải cuộn** → giảm UX (user 2026-10-23). Làm mục lục gọn, đọc được trọn mà không phải cuộn với bài thông thường.

## Bối cảnh
- Màn: chi tiết tin tức, ≥ lg (cột trái `15rem` trong lưới `lg:grid-cols-[15rem_minmax(0,1fr)]`, `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:148`).
- Mục lục `NewsTocSidebar` (`src/components/news/NewsToc.tsx`): mỗi mục `min-h-11` + `py-2` + số tròn `size-7` + `pl-16` cho cấp 3 → chữ còn rất hẹp, wrap nhiều dòng.
- Cột dính chung với thẻ "Tư vấn miễn phí" (`NewsArticleSidebar`) → tổng chiều cao vượt màn hình, phải cuộn.

## Acceptance (bắt buộc)
- [ ] Bài có ~8–10 heading: mục lục đọc trọn trong cột dính ở 1440 (và 1280) không cần cuộn riêng; tiêu đề mục ít wrap hơn rõ rệt.
- [ ] Giữ: link `#id`, mục đang đọc (active), số thứ tự cấp 2, cuộn mượt, a11y (vùng chạm vẫn ≥ 24px theo WCAG 2.5.8; hiện tại 44px).
- [ ] Bài rất dài (nhiều heading) vẫn dùng được (vd mục lục có giới hạn chiều cao + tự cuộn mục active vào tầm nhìn, hoặc thu gọn cấp 3).
- [ ] Không vỡ layout < lg (mục lục gập đầu bài) và bản `/en`.

## Ghi chú
Hướng gợi ý (agent đề xuất, user chốt): nới cột trái (vd 15rem → 18–20rem), giảm padding/min-height mỗi mục,
thu nhỏ số tròn / thụt cấp 3, có thể ẩn cấp 3 hoặc chỉ mở cấp 3 của mục đang đọc; tách thẻ tư vấn để mục lục được ưu tiên chiều cao.
