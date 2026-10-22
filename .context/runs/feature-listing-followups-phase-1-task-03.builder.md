# builder — feature-listing-followups / phase-1-task-03 (BL-055) — đo LCP bản build

- Ngày: 2026-10-22 · base commit `e0a61b3` · branch staging · không worktree (chạy đơn luồng, không commit).
- Đã làm: `pnpm build` (exit 0) → `next start -p 3100` (3000 bị next dev chiếm) → đo LCP 6 trang vi × 1440/390 × 2 lần bằng Lighthouse 12.8.2 headless (Edge, không throttle) + Browser pane (PerformanceObserver). Kết quả max 420 ms, element = ảnh hero đã `priority` (ResponsiveImage preload + fetchpriority=high). Không đổi code.
- Ghi: bảng + cách đo + residual vào `tasks/feature-listing-followups/phase-1-task-03.md` § Verification summary; ảnh `.context/review-reports/assets/bl055-p1t03-*-1440.jpg` (6 file, JPEG từ Lighthouse final-screenshot).
- Bài học: Browser pane bị ẩn → trang chạy nền, không có LCP entry; phải `show_pane preview` trước khi đo. Scratch script/JSON Lighthouse ở scratchpad session (không trong repo).
- Còn dở: không. Server 3100 đã tắt. Verify: skip, no code change.
