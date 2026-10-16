# Task 06: Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500

## Layer
5 — Nội dung đợt 1 (dự án, dịch vụ, pháp lý, tin tức, tuyển dụng) + khung website + SEO nền

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — component dùng chung nhiều trang
- Blast radius: src/components/layout/FloatingContact.tsx (sendBeacon `/api/public/click-events`); src/components/layout/Breadcrumb.tsx, PageBanner.tsx, Pagination.tsx, EmptyState.tsx; src/components/templates/CategoryListTemplate.tsx (S05); …
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-12
- FR-PUB-15 (breadcrumb)
- SPECIFICATIONS § Quy tắc biên (bộ lọc trống, trang 500 đúng ngôn ngữ)
- design-spec §2.5–§2.7, §3.6, §3.9, S05, S17, S18

## Description
Các khối dùng lại cho mọi trang danh sách/chi tiết.

## Dependencies
- `layer-4-task-02` Globals `site-settings`, `header`, `footer` (localized, quyền đọc theo trường) (dùng kết quả của task này)
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)
- `layer-2-task-07` Ghi lượt bấm Hotline/Zalo/Fanpage: `click-events`, `click-stats-daily`, endpoint + job gộp (dùng kết quả của task này)

Mở khoá cho: `layer-6-task-01`, `layer-6-task-04`, `layer-6-task-05`, `layer-6-task-06`, `layer-6-task-07`, `layer-6-task-08`, `layer-7-task-03`, `layer-8-task-03`, `layer-8-task-04`, `layer-9-task-01`

## Acceptance Criteria
- [ ] Nút nổi góc dưới phải: Hotline/Zalo/Fanpage từ `site-settings`; bấm gửi `sendBeacon` đúng `type`/`pagePath`; không đè cookie banner
- [ ] Breadcrumb có JSON-LD `BreadcrumbList` (dùng helper ở task SEO nếu đã có, hoặc tự sinh tối thiểu)
- [ ] Phân trang có `aria-current`, link thật (crawl được)
- [ ] Trạng thái trống có nút xoá bộ lọc
- [ ] 404 và 500 hiện đúng ngôn ngữ đang xem, có link về trang chủ ngôn ngữ đó

## Tests cần viết
- RTL: bấm Zalo gọi sendBeacon với body đúng
- RTL: Pagination render link đúng page
- Integration/route: `/en/khong-ton-tai` → trang 404 tiếng Anh

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-5-task-06-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-5): task-06 layoututil` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/layout/FloatingContact.tsx (sendBeacon `/api/public/click-events`)
- src/components/layout/Breadcrumb.tsx, PageBanner.tsx, Pagination.tsx, EmptyState.tsx
- src/components/templates/CategoryListTemplate.tsx (S05)
- src/app/(frontend)/[locale]/not-found.tsx, error.tsx
- src/app/global-error.tsx

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G2 — click-events chưa giới hạn refCollection/refId (src/endpoints/public/click-events.ts:13): giới hạn refCollection theo danh sách collection ERD §2 để không sinh dòng rác trong click-stats-daily; chặn pagePath bắt đầu "//".
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
