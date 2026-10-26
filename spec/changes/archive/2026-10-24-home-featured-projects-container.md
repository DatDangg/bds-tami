---
id: home-featured-projects-container
type: feature
status: done
completed: 2026-10-26
created: 2026-10-24
---

# Trang chủ — "Dự án nổi bật" theo khung nội dung, ít thẻ thì căn giữa

## Yêu cầu
MODIFY khối Dự án nổi bật (S01.3) trên trang chủ (user 2026-10-24, ảnh chụp prod màn ≈ 1880px):

1. Slider đang **tràn viền** (`ProjectsSlider` render ngoài `max-w-container`, `src/components/home/FeaturedProjects.tsx`) → thẻ đầu sát mép trái màn hình, không thẳng hàng với các khối khác (Về TAMI, tiêu đề, footer). Đổi sang **cùng khung nội dung** (`max-w-container` + `px-gutter`) như các khối còn lại.
2. Khi số dự án nổi bật **ít hơn số thẻ vừa một hàng** (vd prod hiện 3 dự án), hàng thẻ đang dồn trái để trống bên phải → **căn giữa** hàng thẻ cho cân. Đủ/nhiều hơn một hàng thì giữ hành vi slider (cuộn/mũi tên) như hiện tại.

Thay đổi so với thiết kế cũ: design-spec S01.3 / mockup BL-044 ghi "slider tràn viền" → cần cập nhật design-spec.

## Bối cảnh / tái hiện
- Màn/route: `/` và `/en`, khách, desktop rộng (≥ 1440px rõ nhất); kiểm cả 390 / 768 / 1024.
- Bước: mở trang chủ prod có 3 dự án nổi bật (Maison Privée, Astor 1, The Windsor Collection).
- Expected: mép trái thẻ đầu thẳng mép khung nội dung; 3 thẻ căn giữa trong khung.
- Actual: thẻ đầu cách mép màn ~24px (tràn viền), 3 thẻ dồn trái, nửa phải trống.

## Acceptance (bắt buộc)
- [x] ≥ lg: mép trái/phải vùng thẻ trùng khung `max-w-container` của các khối khác (đo bằng `getBoundingClientRect` so với khối Về TAMI / tiêu đề khối).
- [x] Số thẻ < số thẻ vừa một hàng ở breakpoint đang xem → hàng thẻ căn giữa, không hiện mũi tên/điều khiển slider thừa.
- [x] Số thẻ ≥ một hàng → slider cuộn như cũ (mũi tên, kéo/vuốt, a11y carousel giữ nguyên); < md vẫn vuốt ngang được.
- [x] Không vỡ layout 390 / 768 / 1024 / 1440 / 1920; `/en` giống `/vi`.
- [x] design-spec S01.3 cập nhật (bỏ "tràn viền", ghi quy tắc căn giữa khi ít thẻ).

## Ghi chú
- File liên quan: `src/components/home/FeaturedProjects.tsx`, `src/components/home/ProjectsSlider.tsx` (+ test `ProjectsSlider.test.tsx`, `FeaturedProjects.test.tsx`).
- Kiểm `ProjectsSlider` có dùng ở chỗ khác không (blast radius) trước khi đổi chung.

## Kết quả (close-out 2026-10-26)
- Quy tắc theo spec đã publish (1.59.0): số thẻ **vừa hết** một hàng (không cuộn được) → căn giữa; **nhiều hơn** một hàng → slider (change doc gốc ghi "≥ một hàng" — spec là nguồn chốt).
- T01 `5b0b6cf` STRICT PASS r1 (`.context/review-reports/feature-home-featured-projects-container-phase-1-task-01-round-1-review.md`); spec-validation phase 1 PASS (`.context/review-reports/spec-validation-feature-home-featured-projects-container-phase-1-post-build.md`).
- spec_version 1.59.0 · test-scope v79 as-built. design-spec S01.3 đã cập nhật; `docs/DESIGN.md` reconcile.
- Residual: case ít thẻ mới mô phỏng DOM ở dev (6 dự án) — kiểm lại staging/prod có 3–4 dự án ở 1024/1440/1920; Safari < 17.6 căn trái; mũi tên/chấm nháy trước hydrate (BL-038).
