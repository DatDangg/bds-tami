# Task 04: Trang Danh sách dự án (S02) + trang danh mục dự án

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai, dùng helper đã review
- Blast radius: src/app/(frontend)/[locale]/du-an/page.tsx (route theo pathnames); src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx (nếu S05 áp dụng); src/components/projects/ProjectCard.tsx, ProjectFilters.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-02
- FR-PUB-15
- FR-PUB-18
- design-spec S02, S05

## Description
Trang `/du-an` · `/en/projects` lọc loại hình/tỉnh/trạng thái mở bán, phân trang, chỉ dự án đã xuất bản.

## Dependencies
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`

## Acceptance Criteria
- [ ] Bộ lọc nằm trên URL (chia sẻ được); EN chỉ dự án `hasEnglish`
- [ ] Thẻ dự án: link phủ cả thẻ, nhãn trạng thái mở bán (badge), tiêu đề `line-clamp-2`
- [ ] Meta + breadcrumb + trạng thái trống
- [ ] Responsive 375/768/1280, không cuộn ngang

## Tests cần viết
- Integration (render server component với dữ liệu fixture): lọc theo tỉnh/trạng thái đúng; EN ẩn dự án chưa dịch

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-04-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-6): task-04 pubprojlist` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/du-an/page.tsx (route theo pathnames)
- src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx (nếu S05 áp dụng)
- src/components/projects/ProjectCard.tsx, ProjectFilters.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
