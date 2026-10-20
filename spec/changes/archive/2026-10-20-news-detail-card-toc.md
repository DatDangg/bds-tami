---
id: news-detail-card-toc
type: feature
status: done
created: 2026-10-20
---

# Chi tiết tin tức (`/tin-tuc/[slug]`): nền màu + nội dung trong thẻ trắng + mục lục cố định bên trái

## Yêu cầu
User 2026-10-20: "cái tin tức thì thiết kế cũng có màu nền như cái đăng tin, content thì trong cái nền trắng,
và bổ sung thêm phần mục lục bên trái nhé kiểu fixed ấy".
Hiện trang chi tiết tin tức (`src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`) dựng trực tiếp `RichText` trên nền trắng, không có mục lục.

## Acceptance (bắt buộc)
- [x] Trang có nền màu giống trang chi tiết (dự án/cho thuê/tin đăng sau BL-032); bài viết (tiêu đề, ảnh bìa, nội dung, chia sẻ) nằm trong thẻ trắng bo góc.
- [x] Cột trái ≥ lg: **mục lục** sinh tự động từ heading (H2/H3) trong nội dung bài; dính (sticky) khi cuộn, không cuộn ra khỏi màn; mục đang đọc được highlight; bấm → cuộn tới heading (trừ chiều cao header nổi).
- [x] Mục lục dài hơn viewport vẫn dùng được (tự cuộn trong khung hoặc giới hạn cao — chốt khi build).
- [x] Bài không có heading → ẩn mục lục, thẻ nội dung không bị lệch.
- [x] < lg: mục lục không chiếm cột trái (ẩn hoặc gập lại phía trên nội dung — chốt khi build).
- [x] Heading có `id` ổn định (slug tiếng Việt), không đổi dữ liệu CMS, SEO/JSON-LD/URL giữ nguyên; /en hoạt động.

## Ghi chú
- Phụ thuộc màu nền/khung của BL-032 (nên làm sau hoặc tái dùng token nền của `DetailLayout`).
- Tin liên quan (`NewsCard`) giữ dưới thẻ bài viết.
