# Spec Update — 2026-10-22 project-detail-blocks

**spec_version:** 1.48.0 → 1.49.0 (MINOR — thêm trường + đổi hiển thị 2 khối chi tiết Dự án; kèm 1 bug-fix component dùng chung)
**Trigger:** feature-update (BL-060, change-request class MODIFY; gốc là BL-058 nhưng trùng số với admin-form-ux-polish đã lên `staging` → đổi mã ở `043d7fa`)
**Work item:** `feature/project-detail-blocks` phase 1 — T01 `6ccfc29` (STRICT r1 FAIL → r2 PASS `.context/review-reports/feature-project-detail-blocks-phase-1-task-01-round-2-review.md`) · T02 `0cfd396` (STRICT r1 PASS `.context/review-reports/feature-project-detail-blocks-phase-1-task-02-round-1-review.md`) · đổi mã `043d7fa`
**Change doc:** `spec/changes/archive/2026-10-22-project-detail-blocks.md` · task `tasks/feature-project-detail-blocks/phase-1-task-0{1,2}.md`

## Lý do
Chi tiết Dự án (redesign BL-052, design `docs/specs/listing-detail-redesign/detail-du-an.webp` + mô tả user 2026-10-22) còn 4 điểm:
bản đồ khối Vị trí trống (canvas MapLibre cao 0px), dải "Dự án tương tự" trắng liền với các dải trên, khối Tiện ích chưa có ảnh
từng tiện ích dạng slider, khối Vị trí chưa có thẻ ảnh/video "Kết nối hạ tầng". Bump spec hoãn tới lúc gộp `staging` (sau BL-054 / BL-058).

## Requirements
- **SỬA (bug, không đổi requirement)** `LazyMap` (Dự án / Cho thuê / Tin BĐS / Liên hệ): bản đồ phủ kín khung bất kể thứ tự nạp CSS
  MapLibre — root cause `maplibre-gl.css` (`.maplibregl-map { position: relative }`) nạp động sau Tailwind đè `absolute inset-0` của
  chính container; as-built wrapper `absolute inset-0` + container `h-full w-full`, test chống tái phát. Không đổi API.
- **SỬA** khung chi tiết dùng chung — dải "… tương tự" (`SimilarCarousel`, 3 màn chi tiết): nền `--color-primary-subtle`
  (`bg-primary-subtle`) + viền trên `--color-border`; thẻ trắng nổi trên nền; link "Xem tất cả …" `accent-text` AA 4.63:1.
- **THÊM** trường Dự án (ERD §4.5, additive, tuỳ chọn): `amenities[].image` (upload ảnh → `media`); group `locationMedia`
  { `title` localized (placeholder "Kết nối hạ tầng"), `image` upload ảnh, `videoUrl` https YouTube/TikTok `validateVideoUrl` + trim }.
  Không bắt buộc / không mặc định / không backfill; `locationMedia` vào `TRANSLATABLE_FIELDS.projects`.
- **SỬA** Chi tiết Dự án — khối **Tiện ích nổi bật** 2 chế độ: ≥ 1 mục có ảnh → slider thẻ ảnh (`CardSlider`, mũi tên hai mép ≥ md,
  vuốt + chấm mobile; thẻ = ảnh 4:3 + `h3` tên + mô tả ≤ 3 dòng; mục không ảnh = thẻ cùng cỡ ô muted + dấu tích; `amenitiesImage`
  không dùng ở chế độ này); không mục nào có ảnh → giữ kiểu cũ (`amenitiesImage` + danh sách tích).
- **SỬA** Chi tiết Dự án — khối **Vị trí**: có ảnh hoặc video hợp lệ → thẻ "Kết nối hạ tầng" (tiêu đề `title` hoặc mặc định VI/EN;
  video qua `VideoFacade`, poster = ảnh, không tải iframe trước khi bấm, `youtube-nocookie.com`; chỉ ảnh → ảnh 4:3) bên phải: ≥ xl
  lưới 5 · 4 · 3 (bản đồ · khoảng cách · thẻ), lg 7/5 + thẻ hàng dưới, < lg xếp dọc; thiếu bản đồ/danh sách → 8/4. Video không qua
  whitelist coi như không có; không ảnh lẫn video → bố cục cũ, DOM không đổi; có `locationMedia` thì khối + tab Vị trí vẫn hiện.
- **Không đổi:** `DetailFeatureList` / `DetailDistanceList` dùng chung (Cho thuê / Tin BĐS giữ nguyên); API công khai, quyền.

## Migration
`20261022_110146_project_detail_blocks` — **SAFE_ADDITIVE**, không HIGH_RISK (sinh lại từ `20261022_043747` cùng SQL sau khi gộp
`staging` BL-054). Cột nullable mới: `projects_amenities.image_id`, `projects.location_media_image_id`,
`projects.location_media_video_url`, `projects_locales.location_media_title` + 4 cột tương ứng ở `_projects_v*`; 4 FK `media`
`ON DELETE SET NULL`; 5 index; **đổi tên 1 index trùng** (`DROP INDEX projects_amenities_image_idx` của `projects.amenities_image_id`
→ tạo lại `projects_amenities_image_1_idx`; tên cũ nay thuộc `projects_amenities.image_id`). Đã migrate DB worktree `tami_bl058`;
DB dev `tami` + staging migrate khi deploy.

## Ảnh hưởng
- Module: `src/components/media/LazyMap.tsx` (+ test), `src/components/detail/SimilarCarousel.tsx` (+ `RelatedPosts`, `SimilarRentals`,
  `ProjectDetail` docstring), `src/collections/Projects.ts`, `migrations/20261022_110146_project_detail_blocks.*` + `index.ts`,
  `src/payload-types.ts`, `src/lib/projects/project-detail-view.ts` (+ test), `src/components/projects/ProjectAmenities.tsx`,
  `ProjectLocation.tsx`, `ProjectLocationMedia.tsx` (mới), `project-detail-blocks.test.tsx` (mới), `src/lib/translation/leaves.ts`,
  i18n `page.projectDetail.v2.amenitiesSlider.*` / `locationMedia.title` (VI/EN).
- Doc as-built: `SPECIFICATIONS.md` (khối BL-052 → mục BL-060), `docs/ERD.md` §4.5, `docs/DESIGN.md`, `.context/design-spec.md`.
- Test: chi tiết Dự án (VI/EN × 390/1024/1440) có/không ảnh tiện ích, có/không `locationMedia` (ảnh / video / cả hai / video sai
  whitelist), bản đồ phủ khung ở 4 nơi dùng `LazyMap`, dải "… tương tự" ở 3 màn chi tiết, admin tab Thông tin dự án (upload ảnh
  tiện ích, thẻ Kết nối hạ tầng, bản nháp `_projects_v`), dịch AI `locationMedia.title`.
- Còn mở (MINOR, review T02 r1, không chặn): M-1 1024–1279 thẻ media một mình hàng 2 (trống 7 cột); M-2 alt fallback trùng `h3`
  trong slider (trình đọc màn hình đọc 2 lần); M-3 thiếu integration test `locationMedia.videoUrl` ngoài whitelist bị từ chối / trim;
  M-4 `sr-only` lặp tiêu đề `h2` làm nhãn carousel.
- Scope: `spec/test-scope/current.json` v64 (v63 lưu `spec/test-scope/archive/test-scope-1.48.0-63.json`).
