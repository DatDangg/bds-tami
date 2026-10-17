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
- [x] Nút nổi góc dưới phải: Hotline/Zalo/Fanpage từ `site-settings`; bấm gửi `sendBeacon` đúng `type`/`pagePath`; không đè cookie banner
- [x] Breadcrumb có JSON-LD `BreadcrumbList` (dùng helper ở task SEO nếu đã có, hoặc tự sinh tối thiểu)
- [x] Phân trang có `aria-current`, link thật (crawl được)
- [x] Trạng thái trống có nút xoá bộ lọc
- [x] 404 và 500 hiện đúng ngôn ngữ đang xem, có link về trang chủ ngôn ngữ đó (sau hydrate — xem Residual risk 1)

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
- Attempt: 1
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 PASS + follow-up G2 (click-events: `refCollection` enum `CLICK_REF_COLLECTIONS`, chặn `pagePath` bắt đầu `//` hoặc `/\`)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 93 file 954 test PASS; pnpm build PASS (`/[locale]/[...rest]` dynamic). Builder kiểm `/en/khong-ton-tai` trên trình duyệt ở 375: không cuộn ngang, touch target ≥44
- Reviewer verdict: STRICT PASS round 1 — `.context/review-reports/build-tami-website-layer-5-task-06-round-1-review.md`
- Residual risk:
  1. HTML server của 404/500 là shell `__next_error__` rỗng (root layout nằm dưới `[locale]` động); nội dung đúng ngôn ngữ chỉ có sau hydrate. Status 404 + noindex đúng. Hướng sửa: `app/layout.tsx` trả children + `app/not-found.tsx` theo next-intl, hoặc `experimental.globalNotFound`; 404 locale sai ở `[locale]/layout.tsx:28` cùng gốc. Nêu ở checkpoint layer / spec-validator.
  2. Cookie banner chưa có: banner phải đặt `--floating-bottom-offset` trên `<html>` khi hiện (đã ghi vào L5-T07).
  3. EN 404 không có dòng "có bản tiếng Việt" — đúng design-spec S17 (không xác định được trang VI).
  - MINOR (reviewer): FloatingContact chưa gửi `refCollection`/`refId` (§2.5, ghi vào L6-T05, L7-T03); beacon nên `text/plain`; `json-ld.ts:19` `new URL` ném lỗi nếu `NEXT_PUBLIC_SITE_URL` sai; `EmptyState.tsx:28` biểu thức khó đọc; `CategoryListTemplate` chưa có test riêng (kèm test trang danh mục L6-T04); `Pagination.tsx:43` `aria-live` thừa; 11 tên collection trong `click-types.ts` cần đối chiếu ERD ở spec-validation layer 5.
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-5.md`

## Doc / Decision Impact
- Doc impact result: `docs/API_SPEC.md` §3.4 (ràng buộc `pagePath` chặn `//`, `/\`, có `trim`; `refCollection` là enum `CLICK_REF_COLLECTIONS`) + `docs/ERD.md` §4.13 (`click-events.refCollection` giới hạn theo ERD §3) — reconciled as-built lúc đóng layer 5 (G16 spec-validation layer 5). Không đổi schema.
- Decision log: none

## Commit / Tracking
- Commit gợi ý: `feat(layer-5): task-06 layoututil` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-5/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/components/layout/FloatingContact.tsx (sendBeacon `/api/public/click-events`)
- src/components/layout/Breadcrumb.tsx, PageBanner.tsx, Pagination.tsx, EmptyState.tsx
- src/components/templates/CategoryListTemplate.tsx (S05)
- src/app/(frontend)/[locale]/not-found.tsx, error.tsx
- src/app/global-error.tsx

## Notes
- Follow-up spec-validation layer 2 (.context/review-reports/spec-validation-build-tami-website-layer-2.md): G2 — click-events chưa giới hạn refCollection/refId (src/endpoints/public/click-events.ts:13): giới hạn refCollection theo danh sách collection ERD §3 để không sinh dòng rác trong click-stats-daily; chặn pagePath bắt đầu "//".
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
