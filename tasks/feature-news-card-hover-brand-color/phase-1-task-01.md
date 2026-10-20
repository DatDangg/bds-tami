# feature-news-card-hover-brand-color · phase-1-task-01 — Hover tiêu đề mọi thẻ: bỏ gạch chân, đổi chữ vàng thương hiệu (BL-034)

- Change doc: `spec/changes/2026-10-20-news-card-hover-brand-color.md` (BACKLOG BL-034).
- Phụ thuộc: không. Một task (7 dòng class, cùng một quy tắc).
- Trạng thái: `done` — reviewer NORMAL PASS r1; user duyệt plan + AUTO PROCEED ("Ok, chạy luôn"), phạm vi TẤT CẢ thẻ.

## Classification / Risk
- Type: **MODIFY** (đổi hiệu ứng hover đã có; không schema/API/quyền/dữ liệu/URL).
- Risk: **LOW** — chỉ class Tailwind trên tiêu đề 7 component thẻ; không logic.
- Expected review level: **FAST/NORMAL** (component thẻ dùng ở nhiều trang danh sách/trang chủ, nhưng chỉ đổi style).
- Blast radius: lưới dự án / cho thuê / tin đăng / tin tức / tuyển dụng, trang chủ (slider dự án, khối Tin tức nền tối, Ưu đãi), chi tiết tin đăng (OfferBox), tin liên quan.
- Doc impact: `.context/design-spec.md` §3.2 bảng thẻ + slider dự án (đã ghi spec delta + đoạn "Hover tiêu đề thẻ (BL-034)"). No API/ERD impact.

## Thiết kế
- Thay `group-hover:underline group-hover:underline-offset-4` (OfferBox: `group-hover:underline`) bằng `transition-colors group-hover:text-accent-text group-focus-visible:text-accent-text` tại:
  - `src/components/news/NewsCard.tsx:63` (mọi biến thể feature/boxed/row; khối Tin tức trang chủ nằm trong `.theme-dark-block` → token = `#E0BF89`, 10.8:1 trên #111)
  - `src/components/posts/PostCard.tsx:43`
  - `src/components/posts/OfferBox.tsx:20`
  - `src/components/projects/ProjectCard.tsx:44` ⚠ file có sửa dở chưa commit của user — chỉ đổi đúng dòng này
  - `src/components/rentals/RentalCard.tsx:39`
  - `src/components/careers/JobCard.tsx:31`
  - `src/components/home/ProjectsSlider.tsx:91` (tiêu đề trên `glass-panel`)
- Reduced motion: `globals.css` đã ép `transition-duration: 0.01ms` dưới `prefers-reduced-motion: reduce` → `transition-colors` an toàn.
- Không đổi hover link khác (breadcrumb, footer, TOC, link danh mục, button ghost).
- Test: không test nào assert `underline` cho các thẻ này (chỉ `button.test.tsx`, ngoài scope); builder thêm assert class hover mới ở test thẻ hiện có nếu phù hợp.

## Files
- 7 file trên (+ test thẻ liên quan nếu thêm assert). KHÔNG đụng: `next.config.ts`, `src/payload-types.ts`, các phần khác của `src/components/projects/*` (sửa dở của user), `.claude/launch.json`.

## Verification
- `pnpm vitest run` các test thẻ liên quan + `pnpm typecheck` + `pnpm lint` (lệnh từ `.context/project-config.md`).

## Retry / Escalation
- Max 3 attempt; sau 3 lần fail → `architecture_review_needed`, dừng.

## Verification summary
- Builder: 7 dòng class đổi đúng vị trí (ProjectCard chỉ dòng 44); test mới assert class hover ở `news-components.test.tsx`, `RentalCard.test.tsx`, `post-components.test.tsx`; `pnpm vitest run src/components/{news,posts,rentals,careers,home,projects}` 28 file / 331 test PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ `tools/task-dashboard/server.mjs`).
- Reviewer r1 NORMAL PASS (3 MINOR) `.context/review-reports/feature-news-card-hover-brand-color-phase-1-task-01-round-1-review.md`; vitest 23 file / 257 test PASS, typecheck PASS, lint 0 error. MINOR-3 (2 con số tương phản nền tối lệch nhau) → design-spec thống nhất 10.8:1 trên `#111`.
- Spec 1.28.0 → **1.29.0** (MINOR), scope **v36** — `spec/updates/2026-10-20-news-card-hover-brand-color.md`.

## Residual risk
- MINOR-1: tiêu đề slider dự án trên `glass-panel` phủ ảnh rất tối → `#8C6733` tệ nhất ~3.0:1 (chữ 22–25px, chỉ khi hover/focus; không hỗ trợ blur → nền đặc 5.1:1). Có thể tách task: giữ màu chữ thường cho slider hoặc tăng độ đặc kính.
- MINOR-2: chưa có assert class hover cho ProjectCard (test dự án đang có sửa dở của user), JobCard, OfferBox, ProjectsSlider.
- Chưa xem trình duyệt thật.
- `ProjectCard.tsx` chỉ commit hunk dòng 44; phần sửa dở của user giữ nguyên trong working tree.
