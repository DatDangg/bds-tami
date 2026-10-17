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
- Blast radius: src/app/(frontend)/[locale]/du-an/page.tsx (route theo pathnames); src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx (bỏ theo quyết định user 2026-10-18: chỉ `/du-an?category=`); src/components/projects/ProjectCard.tsx, ProjectFilters.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: YES — user 2026-10-18 bỏ route danh mục dự án, chip = `?category=` (S02)

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
- [x] Bộ lọc nằm trên URL (chia sẻ được); EN chỉ dự án `hasEnglish`
- [x] Thẻ dự án: link phủ cả thẻ, nhãn trạng thái mở bán (badge), tiêu đề `line-clamp-2`
- [x] Meta + breadcrumb + trạng thái trống
- [x] Responsive 375/768/1280, không cuộn ngang

## Tests cần viết
- Integration (render server component với dữ liệu fixture): lọc theo tỉnh/trạng thái đúng; EN ẩn dự án chưa dịch

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-04-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): MAJOR-1 route `/du-an/danh-muc/[category]` ngoài BRD/design-spec — gỡ theo quyết định user
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS toàn bộ + follow-up L5-T01 (dữ liệu mẫu có ảnh, published)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 132 file 1.429 PASS (gồm integration seed + listing); pnpm build PASS (chỉ route `/[locale]/du-an`). Trình duyệt next start :3226: chip → `/du-an?category=khu-do-thi&province=ha-noi` (giữ bộ lọc, chip current, 1 kết quả); 375/768/1280 không cuộn ngang, chip 44px, select 48px, chip cuộn ngang ở 375; `/du-an/danh-muc/can-ho` → 404 có nội dung; lọc → `noindex, follow` + canonical `/du-an`; danh sách `public, s-maxage=60, stale-while-revalidate=300`. Ảnh mẫu: 6 WebP tự tạo CC0 (94 KB, `seed/sample/images/README.md`), seed 6 dự án published idempotent (chạy lại tạo 0, bỏ qua 6)
- Reviewer verdict: STRICT FAIL round 1 → STRICT PASS round 2 — `.context/review-reports/build-tami-website-layer-6-task-04-round-2-review.md`
- Lệch chấp nhận: chip là link + `aria-current` trong `nav` (S02 ghi `button[aria-pressed]` — link đúng ngữ nghĩa, chạy không cần JS); chưa có skeleton 6 thẻ (`loading.tsx`)
- Residual risk: 404 `?page` vượt phạm vi vẫn `public, s-maxage=60` (giống /tin-tuc) → L15-T01. `ProjectListPage` ~70 dòng; chưa có test chứng minh `select` bỏ trường dài; seed có thể ghi đè tên EN danh mục trùng tên VI (staging) → L15-T01. Thẻ dự án trỏ `/du-an/[slug]` 404 tới khi xong L6-T05
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5.1 (as-built layer-6-task-04)
- Decision log: user 2026-10-18 bỏ route danh mục dự án (progress.json decisions)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-04 pubprojlist` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức NORMAL)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/du-an/page.tsx (route theo pathnames)
- src/app/(frontend)/[locale]/du-an/danh-muc/[category]/page.tsx (bỏ theo quyết định user 2026-10-18: chỉ `/du-an?category=`)
- src/components/projects/ProjectCard.tsx, ProjectFilters.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-01
- [x] Dữ liệu mẫu dự án đang là 2 bản draft không ảnh (`seed/sample/projects.ts`): trước khi dựng trang danh sách/staging, seed mẫu phải có ảnh và `published` — commit vài ảnh nhẹ trong `seed/sample/images/` (không cần mạng; upload qua Payload Local API vào S3/SeaweedFS) thay vì tải picsum lúc seed.

## Quyết định user 2026-10-18
- User cho phép commit ảnh mẫu nhẹ (giấy phép tự do hoặc placeholder tự tạo, tổng < 2 MB) vào `seed/sample/images/`; ghi nguồn/giấy phép ảnh trong `seed/sample/images/README.md`.

## Ghi chú từ layer-6-task-06
- Trang danh mục tin tức `/tin-tuc/danh-muc/[category]` (S05) đã làm ở L6-T06; task này chỉ làm danh mục dự án. Dùng lại `CategoryListTemplate`, `resolve-missing-page.ts` (404 có nội dung) và `RichText`.
