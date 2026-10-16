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
- Attempt: 3 (sau Reviewer round 2 FAIL)
- Last failure type: review — MAJOR-1 dark mode đảo palette 2 lần (contrast 1.2:1); MAJOR-2 font không tới portal/modal/toast
- Error memory entry: root cause MAJOR-1 = Payload đã tự đảo --theme-success-* ở dark, builder đảo --color-success-* thêm lần nữa; MAJOR-2 = --font-montserrat/--font-body đặt trên wrapper div nằm trong children, ModalContainer/Toast là sibling. Fix: ghi đè thẳng --theme-success-* ở dark (cùng chiều Payload, 500=#E0BF89); htmlProps.className lên <html>, --font-body ở :root; bỏ asset dark không dùng; icon pad vuông 256x256
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: code xong (builder attempt 1). Logo/icon qua `admin.components.graphics`, `meta.titleSuffix " - TAMI Admin"`, màu nhấn #8C6733 (palette success + nút chính; AA: trắng/#8C6733 5.12, hover 6.31; dark #141414/#E0BF89 10.51), Montserrat qua next/font, `i18n.supportedLanguages: { vi }` + `localization` vi/en giữ nguyên. Chưa xác minh bằng trình duyệt /admin/login (không chạy dev server).
- Attempt 2: contrast (đã tính, xem đầu custom.scss): nút primary sáng 5.12/hover 6.31, tối 10.51/hover 12.56; link 5.12 (sáng) / 10.51 (tối); banner success 6.23 (sáng) / 12.30 (tối); pill 10.55 / 14.22; diff added (--diff-create-pill-color ghi đè = theme-success-650 trên nền 200) 5.28 / 10.81 (Payload mặc định dùng 600/200 = 4.39 nên đã ghi đè; 5.28 ở attempt 2 là cặp 650/200); nhãn thẻ chọn 13.28 / 16.66; icon UI 3.55 / 3.78. Tất cả text >=4.5, UI >=3. Montserrat trên <html> qua htmlProps (RootLayout spread htmlProps lên <html>). Xoá tami-logo-dark/tami-icon-dark; icon gold/white pad 256x256 trong suốt (Icon.tsx height 256). Chưa mở trình duyệt /admin/login (không chạy dev server). MINOR-3 ngoài scope: pnpm test chạy 2 lần đều PASS 38 files/388 tests, không tái hiện timeout integration.
- Verify commands + result (attempt 2): lint PASS · typecheck PASS · test PASS x2 · build PASS
- Verify commands + result (attempt 1): pnpm lint PASS · typecheck PASS · test PASS (38 files / 388 tests) · build PASS · generate:importmap đã chạy
- Reviewer verdict: FAST PASS round 3 (.context/review-reports/build-tami-website-layer-2-task-05-round-3-review.md); round 1-2 FAIL (contrast dark, font portal, diff-create 4.39). Residual: chưa kiểm trực quan /admin; integration test round 3 env-blocked (Docker off), round 2 PASS 388 với hạ tầng — rerun pnpm test khi Docker bật.
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: no doc impact (chỉ giao diện admin, không đổi API/schema/flow)
- Decision log: none

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-05 adminbrand` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức FAST)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/components/admin/Logo.tsx, Icon.tsx
- src/app/(payload)/custom.scss
- src/payload.config.ts (`admin.meta`, `admin.components.graphics`, `i18n.supportedLanguages: { vi }`)

## Notes
- Logo dùng file tĩnh trong repo (không phụ thuộc `site-settings`).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

- Attempt 3 (Reviewer round 2): MAJOR-1 đặt `--diff-create-pill-color: var(--theme-success-650)` trong :root (sáng #5B4320/#E0BF89 = 5.28, tối #EFDBB7/#342612 = 10.81; trước đó 600/200 = 4.39). MINOR-1 `.query-inspector { --string-color: var(--theme-success-500) }` (sáng #8C6733/#FFF 5.12, /#F5F5F5 4.69; tối #E0BF89/#141414 10.51; trước 450 ở tối = 3.99). MINOR-2 gộp 2 khối :root thành 1. Đã sửa số contrast trong comment custom.scss.
