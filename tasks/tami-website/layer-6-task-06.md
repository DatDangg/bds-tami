# Task 06: Trang Tin tức: danh sách theo danh mục + chi tiết + bài liên quan (S10, S11)

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai
- Blast radius: src/app/(frontend)/[locale]/tin-tuc/page.tsx, [slug]/page.tsx; src/components/content/RichText.tsx (render Lexical an toàn, dùng chung); src/components/news/NewsCard.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-08
- FR-PUB-15 (Article JSON-LD)
- design-spec S10, S11

## Description
Danh sách tin tức có lọc danh mục + phân trang; chi tiết render richText an toàn, tags, bài liên quan.

## Dependencies
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`

## Acceptance Criteria
- [ ] Test `news_list_idx` tồn tại sau khi chạy migration thật (`pg_indexes`, mẫu `audit-staff.test.ts:95-96`) (MINOR-2) (review L5-T03 round 1)
- [ ] Test nhánh category trong thùng rác (`src/fields/scoped-category.ts:36`) + quyết định UX khi khôi phục bài có category đã xoá (MINOR-3) (review L5-T03 round 1)
- [ ] G14: quan sát `revalidatePath` trúng cache Next thật khi lưu bài (đo `next start`: trước/sau lưu) (spec-validation layer 4)
- [ ] G13: sửa `categories` (route: null) phải làm mới cache trang danh sách theo danh mục (revalidate path/tag tương ứng); test hook (spec-validation layer 4)
- [ ] RichText không render HTML tuỳ ý; link ngoài `rel="noopener"`
- [ ] Bài liên quan cùng danh mục, loại trừ bài hiện tại, tối đa 3
- [ ] JSON-LD `Article` có `inLanguage`
- [ ] Không có form lead

## Tests cần viết
- Unit RichText: node HTML/script không được render
- Integration render: bài liên quan đúng

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-06-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-06 pubnews` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/tin-tuc/page.tsx, [slug]/page.tsx
- src/components/content/RichText.tsx (render Lexical an toàn, dùng chung)
- src/components/news/NewsCard.tsx

## Notes
- `RichText` là component dùng chung cho các trang chi tiết sau.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
