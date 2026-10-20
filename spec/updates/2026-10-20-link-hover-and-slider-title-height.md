# Spec Update — 2026-10-20 link-hover-and-slider-title-height (hover link điều hướng bỏ gạch chân + khung tên slider dự án đều chiều cao)

**spec_version:** 1.31.1 → 1.32.0 (MINOR — đổi hành vi hover link điều hướng + bố cục khung tên thẻ slider; không đổi schema, API, quyền, dữ liệu CMS, URL, i18n)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-037**, MODIFY). Change doc `spec/changes/2026-10-20-link-hover-and-slider-title-height.md` (archive ở close-out → `spec/changes/archive/2026-10-20-link-hover-and-slider-title-height.md`). Task `tasks/feature-link-hover-and-slider-title-height/phase-1-task-01.md`. Review: `.context/review-reports/feature-link-hover-and-slider-title-height-phase-1-task-01-round-1-review.md` (STRICT, PASS round 1, 3 MINOR không bắt buộc sửa).

**Quyết định:** D1 đồng bộ BL-034 cho link điều hướng: hover không gạch chân, `transition-colors`; link chữ thường/xám → `--color-accent-text` (trong `.theme-dark-block` token tự thành `#E0BF89`); link vốn đã `--color-accent-text` → hover `--color-text` để vẫn có tín hiệu hover. D2 "Xem tất cả vị trí" trong hộp cảnh báo tin tuyển dụng hết hạn giữ gạch chân lúc thường (chỉ báo link trong hộp chữ), hover bỏ gạch chân + accent (`#8C6733` trên `#FBF1E0` = 4.57:1). D3 link trong nội dung bài (RichText) giữ gạch chân. D4 Footer / TableOfContents / NewsToc / LanguageSwitcher / not-found chưa đổi (ngoài phạm vi user nêu; đề xuất task riêng). D5 slider Dự án nổi bật: `h3` tên dự án thêm `min-h-[2lh]` (vẫn `line-clamp-2`) → tên 1 dòng giữ chỗ 2 dòng, khung kính neo đáy cùng chiều cao. Nút `outline` "Xem thêm" (FeaturedOffers / HomeNews / RentalsTabs) vốn không gạch chân → không đổi.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (class Tailwind; Breadcrumb + Button `ghost` dùng chung) | (commit close-out BL-037) | Sửa: `src/components/layout/Breadcrumb.tsx` (`LINK_CLASS`), `src/components/ui/button.tsx` (variant `ghost`), `src/components/news/NewsHomeBody.tsx`, `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, `src/components/posts/PostDetail.tsx`, `src/components/careers/JobDetail.tsx`, `src/components/home/ProjectsSlider.tsx`. Test: `src/components/layout/Breadcrumb.test.tsx`, `src/components/ui/button.test.tsx`, `src/components/home/ProjectsSlider.test.tsx`. Doc: `SPECIFICATIONS.md` (Giao diện, F1 Dự án nổi bật), `.context/design-spec.md` (đoạn "Hover link điều hướng (BL-037)" + S01 khối 3) | `.context/review-reports/feature-link-hover-and-slider-title-height-phase-1-task-01-round-1-review.md` (STRICT PASS) |

## Requirements (SPECIFICATIONS.md)

- **Giao diện — hover link điều hướng (MỚI):** breadcrumb, nút `ghost` ("Xem tất cả" Dự án nổi bật, "Nhận tư vấn" EmptyState), "Xem thêm" hàng danh mục `/tin-tuc`, link danh mục chi tiết tin tức + tin đăng, "Xem tất cả vị trí" tin tuyển dụng hết hạn: hover không gạch chân, đổi màu như D1/D2; focus-visible giữ outline chung (`:focus-visible` `--color-focus-ring`); RichText giữ gạch chân (BL-037).
- **F1 Trang chủ — Dự án nổi bật (ĐỔI):** tên dự án tối đa 2 dòng, luôn giữ chỗ 2 dòng → khung kính mọi thẻ cùng chiều cao, địa điểm + số liệu thẳng hàng (BL-037).
- Design as-built: `.context/design-spec.md` đoạn "Hover link điều hướng (BL-037)" + S01 khối 3.

## Schema / Migration / API

Không. Migration: none. Không đổi i18n key.

## Hành vi bị thay thế

| Trước | Sau (BL-037) |
|---|---|
| Breadcrumb hover: chữ `--color-text` + gạch chân | Hover: không gạch chân, chữ `--color-accent-text` |
| Button `ghost` hover gạch chân (`underline-offset-4`) | Hover: không gạch chân, chữ `--color-accent-text` |
| "Xem thêm" `/tin-tuc`, link danh mục chi tiết tin tức / tin đăng (chữ vàng) hover gạch chân | Hover: không gạch chân, chữ `--color-text` |
| "Xem tất cả vị trí" luôn gạch chân | Lúc thường gạch chân; hover bỏ gạch chân, chữ accent |
| Slider Dự án nổi bật: thẻ tên 1 dòng có khung kính thấp hơn thẻ tên 2 dòng | Mọi thẻ khung kính cùng chiều cao (tên giữ chỗ 2 dòng) |

## Số đo / verify

- Tương phản `#8C6733` trên `#FBF1E0` = 4.57:1 (AA); `#8C6733` trên trắng 5.12:1; `#E0BF89` trên `#111` 10.8:1 (BL-034).
- Verify (lệnh từ `.context/project-config.md`, reviewer STRICT round 1): `pnpm vitest run src/components src/app` 972/972 PASS (gồm 2 test mới BL-037), `pnpm typecheck` PASS, `pnpm lint` 0 error (2 warning cũ `tools/task-dashboard/server.mjs`).
- Chưa kiểm trên trình duyệt thật (390 / 768 / 1280).

## Ảnh hưởng test

- Direct: breadcrumb mọi trang công khai; "Xem tất cả" Dự án nổi bật trang chủ; "Xem thêm" `/tin-tuc`; link danh mục chi tiết tin tức + tin đăng BĐS; "Xem tất cả vị trí" tin tuyển dụng hết hạn; khung tên slider Dự án nổi bật.
- Dependents: mọi chỗ dùng Button `ghost` (EmptyState "Nhận tư vấn").
- Regression: link RichText vẫn gạch chân; hover tiêu đề thẻ (BL-034) giữ; điều khiển slider Dự án nổi bật (BL-038) giữ; nút `outline` "Xem thêm" không đổi.
- Residual (reviewer MINOR): "Xem tất cả vị trí" màu lúc thường `text-warning` `#8A5A0A` gần accent `#8C6733` → tín hiệu hover chủ yếu là bỏ gạch chân; thẻ slider thiếu địa điểm/số liệu vẫn thấp hơn (không placeholder); Footer / mục lục / LanguageSwitcher / 404 còn `hover:underline` (task riêng nếu user muốn).
