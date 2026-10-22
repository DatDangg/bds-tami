# builder note — feature-listing-sticky-filter-aside / phase-1-task-01 (BL-061, yêu cầu 1 + 2)

- Đã làm: `FilterSidebar` dính + cuộn riêng (`LISTING_FILTER_STICKY_CLASS`, FilterPanel.tsx); thẻ nổi bật bấm cả thẻ bằng link phủ (SpotlightSlider.tsx + hằng mới `listing/spotlight-content-classes.ts` áp cho 3 `*SpotlightContent`); test TDD 5 file; doc as-built design-spec + DESIGN.md; 7 ảnh `bl061-p1t01-*.png`.
- Phát hiện ngoài kế hoạch: `buttonVariants` `active:translate-y-px` làm link phủ co lại lúc nhấn → click không điều hướng; fix `active:translate-none` (+ test). Chi tiết ở `## Verification summary` trong task file.
- Verify: typecheck 0 · eslint scope 0 · pnpm test 4403 pass · pnpm build 0.
- Chưa làm / không thuộc task: yêu cầu 3 (T02). Không commit (chờ reviewer PASS, primary commit).
- Môi trường: dev server cổng 3000 của session khác đang chạy cùng thư mục; `tami-dev` session này không khởi động được (Next chặn 2 dev server cùng dir) — đã dùng 3000 + Edge headless CDP (`scratchpad/shoot.mjs`) để chụp.
