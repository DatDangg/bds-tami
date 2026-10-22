Agent: reviewer

# Review: feature-project-detail-blocks · phase-1-task-02 · round 1 (BL-060)

> Primary lưu nội dung report (hook guard chặn reviewer Write trong worktree).

- **Review level:** STRICT
- **Reason:** schema + migration (`projects`, `projects_amenities`, `_projects_v*`), view model chi tiết dự án (shape output), allowlist dịch, component màn chi tiết.
- **Blast radius:** `src/collections/Projects.ts` (`amenities[].image`, group `locationMedia`, ẩn khỏi bộ lọc list); `migrations/20261022_043747_project_detail_blocks.{ts,json}` + `migrations/index.ts` (6 bảng + đổi tên 1 index); `src/payload-types.ts`; `src/lib/projects/project-detail-view.ts` (`AmenityView.image`, `locationMedia`, `visibleSections.location`); `src/lib/translation/leaves.ts` (`locationMedia`, chỉ `title` localized được dịch); `/du-an/[slug]`: `ProjectAmenities`, `ProjectLocation`, `ProjectLocationMedia` mới; i18n `page.projectDetail.v2.*`. `CardSlider`, `VideoFacade`, `DetailFeatureList`, `DetailDistanceList` dùng lại không đổi → Cho thuê / Tin BĐS không ảnh hưởng.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 lỗi; 2 warning cũ `tools/task-dashboard/server.mjs`) |
| `pnpm vitest run --project unit --project ui` | PASS 332 file / 3153 test |
| `pnpm vitest run tests/integration/projects.test.ts` | PASS 36/36 |
| `pnpm build` | PASS |
| `pnpm payload migrate:status` (đọc, `tami_bl058`) | `20261022_043747_project_detail_blocks` batch 38 = Yes |
| `pnpm test` full | skip — Postgres container dùng chung crash 2 lần hôm nay ("too many clients"); chạy file integration liên quan thay thế |

## Migration
- up: 8 `ADD COLUMN` nullable, không default, không backfill; 4 FK media `ON DELETE set null`; 5 `CREATE INDEX`; 1 `DROP INDEX "projects_amenities_image_idx"` — trùng tên (tên cũ trên `projects.amenities_image_id` va với tên Drizzle sinh cho `projects_amenities.image_id`), index cũ tạo lại cùng cột tên `projects_amenities_image_1_idx`.
- **Không HIGH_RISK_MIGRATION**: không drop/đổi cột/bảng, không `SET NOT NULL`, không UNIQUE, không backfill; chỉ thiếu index trong transaction migration (bảng nhỏ). Phân loại **SAFE_ADDITIVE (+ đổi tên index)**.
- down đối xứng (drop 4 FK + 5 index, tạo lại `projects_amenities_image_idx` trên `projects.amenities_image_id`, drop 8 cột).
- Snapshot json khớp schema; `migrations/index.ts` đúng (dấu phẩy cuối entry trước là artifact generator).
- Merge: BL-054 có thể thêm migration cùng lúc; migration này chỉ đụng `projects*`; khi rebase kiểm thứ tự/batch.

## Requirements coverage
- Schema: upload chỉ ảnh (`imageMimeType`); `videoUrl` `validateVideoUrl` + `trimText`; `title` localized; không `required`.
- Dịch: chỉ text localized được gửi dịch; `buildEnglishWrite` clone cả group EN như mẫu sẵn có.
- View model: `renderableImage` → null cho PDF/id thô/ảnh đã xoá; alt fallback tên tiện ích / title → tên dự án; video ngoài whitelist → null; không ảnh lẫn video → thẻ null; `visibleSections` hiện Vị trí khi chỉ có thẻ media. Có test.
- UI: `CardSlider` chung `arrows="sides"`, nhãn `{index}/{total}` qua `t.raw`; mục không ảnh ô 4:3 muted + dấu tích; không ảnh nào → kiểu cũ; thẻ `h3` dưới `h2`; thẻ media `figure` + `figcaption`, nút play "Phát video: Kết nối hạ tầng"; không `locationMedia` → class/DOM như cũ (có test).

## Responsive gate
Không tràn ngang (primary đo 1440 sw = cw 1425, 390 sw = 390); mobile-first `lg:`/`xl:`; lưới 12 cột; token chữ; `aspect-[4/3]` + `sizes` khớp `SLIDE_WIDTH`; touch target dùng lại; không `100vh`. 768/1024 chỉ kiểm bằng CSS: < 1024 xếp dọc; 1024–1279 bản đồ 7 + danh sách 5, thẻ xuống hàng 5 cột; ≥ 1280 5/4/3.

## Skill gates
aislop / oxlint / ocr skip (không cấu hình); AI-readable OK; ai-friendly-web, blitzstrike N/A (`videoUrl` chỉ admin, whitelist 2 lớp).

## Findings
Không CRITICAL / MAJOR.
- **[MINOR-1]** `ProjectLocation.tsx` `mediaSpan` (`lg:col-span-5 xl:col-span-3`): 1024–1279 đủ 3 phần → thẻ một mình hàng 2, trống 7 cột. Gợi ý `lg:col-span-12 xl:col-span-3` hoặc `lg:col-start-8`.
- **[MINOR-2]** `ProjectAmenities.tsx` `AmenityCard`: alt fallback = tên tiện ích trùng `h3` → trình đọc màn hình đọc 2 lần. Gợi ý slider dùng `alt=""` khi media không có alt thật.
- **[MINOR-3]** Thiếu integration test `locationMedia.videoUrl` ngoài whitelist bị từ chối / được trim (validator + trim dùng lại, đã test ở `videoUrl` dự án).
- **[MINOR-4]** `ProjectAmenities.tsx` `<p className="sr-only">` lặp tiêu đề `h2` chỉ để đặt nhãn carousel — có thể trỏ `labelledBy` vào heading của `DetailSection`. Cosmetic.

## Residual risk
- Full `pnpm test` chưa chạy (Postgres dùng chung không ổn định).
- 768/1024 chỉ kiểm bằng CSS.
- Dữ liệu mẫu chỉ seed bảng chính, không `_projects_v` → bản nháp/versions với trường mới chưa kiểm UI (schema + migration có phủ `_projects_v*`).

## Verdict: PASS
