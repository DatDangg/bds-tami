---
id: news-card-hover-brand-color
type: feature
status: done
completed: 2026-10-20
backlog: BL-034
spec_version: 1.29.0
scope_version: 36
task: tasks/feature-news-card-hover-brand-color/phase-1-task-01.md
created: 2026-10-20
---

# Hover tiêu đề tin: bỏ gạch chân, đổi sang màu vàng thương hiệu

## Yêu cầu
Khi hover thẻ tin (tin tức + tin đăng BĐS), tiêu đề hiện đang **gạch chân** (`group-hover:underline`).
User muốn **bỏ gạch chân**, thay bằng **đổi màu chữ sang vàng thương hiệu**.

Vị trí hiện tại:
- `src/components/news/NewsCard.tsx:63` — tiêu đề thẻ tin tức (mọi biến thể: feature/boxed/row).
- `src/components/posts/PostCard.tsx:43` — tiêu đề thẻ tin đăng.
- `src/components/posts/OfferBox.tsx:20` — tiêu đề tin trong khối ưu đãi (chi tiết tin đăng).

## Acceptance (bắt buộc)
- [ ] Hover (và focus-visible qua thẻ) tiêu đề MỌI thẻ (tin tức, tin đăng, ưu đãi, dự án, cho thuê, tuyển dụng, slider dự án): **không** gạch chân, chữ đổi sang vàng thương hiệu.
- [ ] Màu chữ hover dùng token đạt tương phản ≥ 4.5:1 trên nền thẻ — `--color-accent-text` (#8c6733, vàng đậm), **không** dùng `--color-primary` (#e0bf89, quá nhạt cho chữ trên nền trắng).
- [ ] Đổi màu có transition mượt (`transition-colors`), tôn trọng `prefers-reduced-motion`.
- [ ] Không đổi hover các link khác (breadcrumb, footer, mục lục, link danh mục…).
- [ ] Test hiện có kiểm `underline` (nếu có) cập nhật theo.

## Ghi chú
- **User chốt 2026-10-20: áp dụng TẤT CẢ thẻ** — thêm `ProjectCard` (`src/components/projects/ProjectCard.tsx:44`), `RentalCard` (`src/components/rentals/RentalCard.tsx:39`), `JobCard` (`src/components/careers/JobCard.tsx:31`), `ProjectsSlider` (`src/components/home/ProjectsSlider.tsx:91`). ⚠ `ProjectCard.tsx` đang có sửa dở chưa commit của user → chỉ đổi đúng class hover, KHÔNG stage/commit phần dở của user (dùng `git add -p` hoặc để file ngoài commit và báo).
- Nguồn: user 2026-10-20 ("mấy cái hover tin ấy, không để gạch chân mà đổi sang cái màu vàng thương hiệu").
