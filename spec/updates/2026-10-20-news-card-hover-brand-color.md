# Spec Update — 2026-10-20 news-card-hover-brand-color (hover tiêu đề mọi thẻ: bỏ gạch chân, đổi chữ vàng thương hiệu)

**spec_version:** 1.28.0 → 1.29.0 (MINOR — đổi yêu cầu trình bày hover của mọi thẻ link, như BL-030; không đổi schema, API, quyền, dữ liệu CMS, URL, metadata, JSON-LD)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-034**, MODIFY UI). Change doc `spec/changes/2026-10-20-news-card-hover-brand-color.md` (archive ở close-out → `spec/changes/archive/2026-10-20-news-card-hover-brand-color.md`). Task `tasks/feature-news-card-hover-brand-color/phase-1-task-01.md`. Review: `.context/review-reports/feature-news-card-hover-brand-color-phase-1-task-01-round-1-review.md` (pending — reviewer điền).

**Quyết định (user chốt 2026-10-20, AUTO PROCEED, phạm vi TẤT CẢ thẻ):** D1 tiêu đề mọi thẻ là link — `ProjectCard`, `RentalCard`, `PostCard`, `NewsCard` (mọi biến thể feature / boxed / row, gồm khối Tin tức nền tối trang chủ), `OfferBox` (chi tiết tin đăng), `JobCard`, `ProjectsSlider` trang chủ — khi hover hoặc focus-visible vào thẻ: **không gạch chân**, chữ đổi sang `--color-accent-text` (`#8C6733`, 5.12:1 trên trắng; trong `.theme-dark-block` token thành `#E0BF89`, 10.8:1 trên `#111`). D2 class `transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text` thay `group-hover:underline(-offset-4)`. D3 reduced motion: rule toàn cục `globals.css` ép `transition-duration` ~0 → đổi màu tức thì. D4 **không** dùng `--color-primary` cho chữ (quá nhạt trên trắng). D5 link khác (breadcrumb, footer, mục lục, link danh mục, nút ghost) giữ hover cũ.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, class hover tiêu đề 7 component thẻ) | close-out BL-034 (commit chứa file này) | `src/components/news/NewsCard.tsx`, `src/components/posts/PostCard.tsx`, `src/components/posts/OfferBox.tsx`, `src/components/projects/ProjectCard.tsx` (chỉ dòng tiêu đề — file có sửa dở của user ngoài scope), `src/components/rentals/RentalCard.tsx`, `src/components/careers/JobCard.tsx`, `src/components/home/ProjectsSlider.tsx` (+ test thẻ nếu builder thêm assert). Doc: `SPECIFICATIONS.md` Overview — Giao diện, `.context/design-spec.md` §3.2 bảng thẻ + đoạn "Hover tiêu đề thẻ (BL-034)" + dòng slider dự án | `.context/review-reports/feature-news-card-hover-brand-color-phase-1-task-01-round-1-review.md` (pending) |

## Requirements (SPECIFICATIONS.md)

- **Overview — Giao diện (SỬA):** mọi thẻ là link (Dự án, Tin cho thuê, Đăng tin BĐS, Tin tức mọi biến thể, Ưu đãi chi tiết tin đăng, Việc làm, slider dự án trang chủ) khi hover / focus bàn phím: tiêu đề không gạch chân, chữ đổi vàng thương hiệu `--color-accent-text` (khối nền tối `#E0BF89`), `transition-colors`, tức thì khi `prefers-reduced-motion`; link khác giữ hover cũ.
- Design as-built: `.context/design-spec.md` §3.2 bảng thẻ (hàng Dự án / Tin cho thuê / Tin-ưu đãi / Việc làm) + đoạn "Hover tiêu đề thẻ (BL-034, user 2026-10-20)" + mô tả slider dự án trang chủ.

## Schema / Migration / API

Không. Migration: none. URL, metadata, JSON-LD, dữ liệu CMS không đổi.

## Hành vi bị thay thế

| Trước | Sau (BL-034) |
|---|---|
| Hover thẻ tin tức / tin đăng / ưu đãi: tiêu đề gạch chân (`group-hover:underline`) | Không gạch chân; chữ đổi `--color-accent-text` + `transition-colors` |
| Hover thẻ dự án / cho thuê / việc làm / slider dự án: tiêu đề giữ màu (chỉ ảnh zoom / bóng / viền / nền) | Thêm: tiêu đề đổi `--color-accent-text` (hiệu ứng ảnh/bóng/viền/nền giữ nguyên) |
| Focus bàn phím vào thẻ: tiêu đề không đổi | Tiêu đề đổi màu như hover (`group-focus-visible`) |

## Số đo / verify

- Tương phản: `#8C6733` trên `#FFFFFF` 5.12:1; `#E0BF89` trên `#111` 10.8:1 (đạt AA chữ thường).
- Builder / reviewer: điền ở task file + report (vitest thẻ liên quan, typecheck, lint).
- Chưa đo trên trình duyệt thật.

## Ảnh hưởng test

- Direct: hover + Tab focus vào thẻ ở `/du-an`, `/cho-thue`, `/tin-bds` (+ danh mục), `/tin-tuc` (feature / boxed / row), `/tuyen-dung`, trang chủ (slider dự án, khối Tin tức nền tối, slider Ưu đãi), chi tiết tin đăng (OfferBox), Tin liên quan / Dự án khác / tin tương tự; cả `/en/...`.
- Dependents: các trang dùng chung `ProjectCard` / `RentalCard` / `PostCard` / `NewsCard`.
- Regression: hover link khác (breadcrumb, footer, mục lục, link danh mục, nút ghost) không đổi; ảnh zoom / bóng / viền / nền hover thẻ giữ nguyên; thẻ vẫn một link, không lồng link.
- Residual: tiêu đề `ProjectsSlider` trên `glass-panel` phủ ảnh rất tối — `--color-accent-text` trường hợp xấu ~3.0:1 (chữ 22–25px, chỉ khi hover, tạm thời); `ProjectCard.tsx` có sửa dở của user ngoài scope (commit chỉ phần BL-034).
