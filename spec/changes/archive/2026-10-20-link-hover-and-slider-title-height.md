---
id: link-hover-and-slider-title-height
type: feature
status: done
created: 2026-10-20
---

# Bỏ gạch chân khi hover ở "Xem thêm"/breadcrumb + đều chiều cao khung tên thẻ slider dự án nổi bật

## Yêu cầu
1. Link "Xem thêm"/"Xem tất cả" và breadcrumb khi hover vẫn gạch chân chữ → đồng bộ BL-034: bỏ gạch chân, hover đổi chữ sang vàng thương hiệu (`--color-accent-text`).
2. Trang chủ, khối "Dự án nổi bật" (`ProjectsSlider`): khung kính mờ đè đáy ảnh (tên + địa điểm + số liệu) cao thấp khác nhau giữa các thẻ do tên dài 2 dòng / ngắn 1 dòng (ảnh user: thẻ "Căn hộ Trung Tâm Hà Nội" 1 dòng thấp hơn các thẻ tên 2 dòng) → mọi thẻ khung tên đồng bộ chiều cao dù tên dài/ngắn.

## Acceptance (bắt buộc)
- [ ] Breadcrumb (`src/components/layout/Breadcrumb.tsx` `LINK_CLASS`) hover: không gạch chân, chữ đổi `--color-accent-text`; focus-visible vẫn thấy rõ.
- [ ] Mọi link "Xem thêm"/"Xem tất cả" công khai (Button variant `link` `src/components/ui/button.tsx:21`, `NewsHomeBody`, FeaturedProjects/FeaturedOffers/HomeNews/RentalsTabs/JobDetail, link danh mục ở `tin-tuc/[slug]`, `PostDetail`) hover không gạch chân, đổi màu thương hiệu; trên nền tối dùng biến thể sáng như BL-034 (đạt tương phản AA).
- [ ] Không đổi link trong nội dung bài viết (rich text) — gạch chân ở đó là chỉ báo link cần thiết.
- [ ] Slider dự án nổi bật: khung tên mọi thẻ cùng chiều cao (tên giữ tối đa 2 dòng, tên 1 dòng vẫn chiếm chỗ 2 dòng hoặc khung căn theo thẻ cao nhất); địa điểm + số liệu thẳng hàng giữa các thẻ.
- [ ] Kiểm 390 / 768 / 1280.

## Ghi chú
- Nguồn: user 2026-10-20 (2 ảnh chụp slider dự án nổi bật).
- Footer / LanguageSwitcher / TableOfContents / not-found cũng `hover:underline` — builder đề xuất có gộp không, mặc định chỉ sửa phạm vi user nêu + nhóm "Xem thêm".
