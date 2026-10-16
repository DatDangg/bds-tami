# Task 05: Giao diện admin: logo TAMI, màu nhấn, font, nhóm menu tiếng Việt

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **FAST** — chỉ giao diện admin, không đụng quyền/dữ liệu
- Blast radius: src/components/admin/Logo.tsx, Icon.tsx; src/app/(payload)/custom.scss; src/payload.config.ts (`admin.meta`, `admin.components.graphics`, `i18n.supportedLanguages: { vi }`)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- design-spec (phạm vi file: admin dùng Payload mặc định + logo, `#8C6733`, Montserrat)
- SPECIFICATIONS F12 (admin chỉ tiếng Việt)

## Description
Đổi nhận diện trang `/admin`: logo/icon, màu nhấn, font, ngôn ngữ giao diện chỉ tiếng Việt.

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)
- `layer-1-task-04` Nền UI: tokens → Tailwind v4 + shadcn/ui, font, Phosphor, primitive (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [ ] Màn đăng nhập và thanh bên hiện logo TAMI; tiêu đề tab "TAMI Admin"
- [ ] Màu nhấn `#8C6733`, font Montserrat; chữ trên nút đạt AA
- [ ] Admin chỉ có tiếng Việt (không có bộ chọn ngôn ngữ giao diện); bộ chọn locale nội dung VI/EN vẫn có

## Tests cần viết
- Smoke: build PASS, render component Logo

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-05-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-2): task-05 adminbrand` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức FAST)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/admin/Logo.tsx, Icon.tsx
- src/app/(payload)/custom.scss
- src/payload.config.ts (`admin.meta`, `admin.components.graphics`, `i18n.supportedLanguages: { vi }`)

## Notes
- Logo dùng file tĩnh trong repo (không phụ thuộc `site-settings`).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
