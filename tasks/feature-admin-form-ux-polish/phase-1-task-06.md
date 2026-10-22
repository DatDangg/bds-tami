# feature-admin-form-ux-polish · phase-1-task-06 — Khung xem trước SEO cho Danh mục (follow-up BL-058)

- Change doc: `spec/changes/archive/2026-10-22-admin-form-ux-polish.md` (BACKLOG BL-058, follow-up của mục 5)
- Nguồn: spec-validation phase 1 ⚠️-1 (`.context/review-reports/spec-validation-feature-admin-form-ux-polish-phase-1.md`); spec F11 ghi gap "Danh mục … follow-up".
- Status: **done** — NORMAL PASS r1 (user 2026-10-22 "Sửa luôn khung xem trước SEO cho Danh mục")

## Hiện trạng
- `src/collections/Categories.ts:74` không omit `seo` → Danh mục nhận `seoField()` (T05) gồm `SeoPreview` + bộ đếm.
- `useAsTitle: "name"`; `SeoPreview.tsx` đọc cứng `title`; `src/lib/admin/seo.ts` không có route / nguồn mô tả cho `categories` → preview luôn hiện chữ giữ chỗ.
- Trang công khai danh mục chỉ có cho 3 scope: Cho thuê `/cho-thue/danh-muc/[category]`, Tin BĐS `/tin-bds/danh-muc/[category]`, Tin tức `/tin-tuc/danh-muc/[category]` (EN theo `src/i18n/routing.ts`). Metadata: `buildRentalListMetadata` (`src/components/rentals/rental-list-metadata.ts`), `buildPostListMetadata` (`src/components/posts/post-list-metadata.ts`), `buildNewsListMetadata` (`src/components/news/NewsListPage.tsx:108-…`: `seo: category.seo`, `title: category.name`, `description: category.description`, EN chỉ khi `hasEnglish` + có slug EN).
- Scope Dự án / Tuyển dụng: không có trang danh mục công khai.

## Classification / Risk
- MODIFY (UI admin), không migration, giữ `seo.*`. Risk LOW–MEDIUM. Reviewer NORMAL.

## Acceptance
- [ ] Danh mục scope Cho thuê / Tin BĐS / Tin tức: preview tiêu đề = (SEO hoặc Tên danh mục) nối tên website, URL = trang danh mục theo locale (EN chỉ khi có bản EN), mô tả = (SEO hoặc Mô tả danh mục) — khớp metadata thật của từng trang (test parity với hàm metadata thật nếu khả thi, không thì đối chiếu từng quy tắc có file:line).
- [ ] Danh mục scope không có trang công khai (Dự án, Tuyển dụng): không hiện khung xem trước sai; hiện câu ngắn kiểu "Danh mục loại này không có trang riêng trên website" (không thuật ngữ dev). Ghi rõ trong report các ô SEO ở scope đó có tác dụng gì không.
- [ ] Không hồi quy 7 collection + Trang chủ (test T05 giữ PASS).
- [ ] `pnpm exec eslint src tests` · `pnpm typecheck` · vitest unit+ui · `pnpm build` PASS.

## Phạm vi cấm
- Không sửa `SPECIFICATIONS.md`, `spec/**`, `.context/**`, `src/lib/seo/**`, metadata công khai. Không migration.

## Verification Plan
- Như trên; report `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-06-round-<R>-review.md`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Root cause: `SeoPreview` đọc cứng ô `title`; `src/lib/admin/seo.ts` không có route/nguồn mô tả cho `categories` (route phụ thuộc `scope`); `publicPageUrl` chỉ thay `[slug]` (route danh mục dùng `[category]`).
- Fix: `seoTitleSource` (categories → `name`), `CATEGORY_PAGE_ROUTES` (rental / property_post / news), `seoPagePathKey({ scope })`, `seoNoPublicPageNote` (Dự án / Tuyển dụng), mô tả textarea giữ nguyên văn như metadata; `SeoPreview` đọc `scope`.
- Test: parity 12 case với `buildPageMetadata` thật (3 loại × vi/en × có/không EN) + case ô SEO thắng; component test 3 case Danh mục. Test T05 giữ PASS.
- Verify: `pnpm exec eslint src tests` 0 · `pnpm typecheck` PASS · vitest unit+ui 3365/3365 PASS · `pnpm build` PASS (builder). Integration + ảnh BLOCKED (Postgres down).
- Review: NORMAL **PASS r1** — `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-06-round-1-review.md`. 2 MINOR → follow-up: câu giải thích đầu khối SEO ở Danh mục còn ghi "Tiêu đề, Tóm tắt và Ảnh đại diện"; `rental-list-metadata.ts:81` không xét `hasEnglish` cho `paths.en`.
- Doc impact: spec F11 (1.48.0 chưa phát hành ra ngoài branch) cập nhật câu Danh mục as-built + spec update + test-scope riskNote; không bump version.
