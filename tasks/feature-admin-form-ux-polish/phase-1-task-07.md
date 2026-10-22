# feature-admin-form-ux-polish · phase-1-task-07 — Câu giải thích khối SEO ở Danh mục (follow-up BL-058)

- Change doc: `spec/changes/archive/2026-10-22-admin-form-ux-polish.md` (BL-058, follow-up mục 5)
- Nguồn: reviewer T06 r1 MINOR (`.context/review-reports/feature-admin-form-ux-polish-phase-1-task-06-round-1-review.md`)
- Status: **done** — FAST PASS r1 (user 2026-10-22 yêu cầu)

## Hiện trạng
- `src/components/admin/SeoPreview.tsx:22,89`: `SEO_NOTE` cố định "Không bắt buộc. Để trống thì trang tự lấy từ Tiêu đề, Tóm tắt và Ảnh đại diện." hiện cho mọi collection, kể cả Danh mục — sai với Danh mục (metadata trang danh mục lấy Tên + Mô tả, không lấy ảnh của bản ghi).

## Classification / Risk
- MODIFY (chữ UI admin), LOW. Không migration. Reviewer FAST/NORMAL.

## Acceptance
- [ ] Danh mục (loại có trang công khai): câu "Không bắt buộc. Để trống thì trang tự lấy từ Tên và Mô tả danh mục."
- [ ] Danh mục loại không có trang (Dự án / Tuyển dụng): giữ câu báo T06, không hiện câu sai.
- [ ] Collection khác + Trang chủ giữ nguyên câu cũ.
- [ ] Test component/hàm thuần cho câu theo collection; `pnpm exec eslint src tests` · `pnpm typecheck` · vitest unit+ui PASS.

## Phạm vi cấm
- Không sửa `SPECIFICATIONS.md`, `spec/**`, `.context/**`, `src/lib/seo/**`. Không migration.

## Verification summary
- `seoIntroNote(collectionSlug)` trong `src/lib/admin/seo.ts`: categories → "Không bắt buộc. Để trống thì trang tự lấy từ Tên và Mô tả danh mục."; còn lại giữ câu cũ. `SeoPreview` dùng hàm này; nhánh câu báo T06 (Dự án / Tuyển dụng) giữ nguyên.
- Verify: `pnpm exec eslint src tests` 0 · `pnpm typecheck` PASS · vitest unit+ui 3366/3366 PASS.
- Review: FAST **PASS r1** — `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-07-round-1-review.md`.
- Doc impact: spec update BL-058 cập nhật câu Danh mục; không bump version.
