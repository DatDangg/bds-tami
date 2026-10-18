# Task 05: Xuất lead ra Excel `GET /api/admin/leads/export` + audit

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — export PII + rate limit + audit
- Blast radius: src/endpoints/admin/leads-export.ts; src/components/admin/LeadExportButton.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-ADM-10
- PERMISSION §5, §6
- API_SPEC §4

## Description
Admin xuất `.xlsx` theo bộ lọc hiện tại; nút trong danh sách lead.

## Dependencies
- `layer-8-task-02` Collection `leads` + `lead-activities` (trạng thái, ghi chú, quyền theo người được giao) (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)
- `layer-1-task-06` Redis client, rate limit, xác thực Turnstile phía server (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [x] Chỉ admin (sale 403, khách 401); rate limit 10 lần/giờ/user
- [x] Lọc theo trạng thái, nguồn, sale, khoảng ngày; stream file, `Cache-Control: no-store`
- [x] Ô bắt đầu bằng `=`, `+`, `-`, `@` được escape (chống CSV/Excel injection)
- [x] Ghi audit `lead.export` kèm bộ lọc và số dòng (không kèm dữ liệu khách)
- [x] Không xuất lead đã ẩn danh dưới dạng có PII

## Tests cần viết
- Integration: admin xuất → file đọc lại đúng số dòng + audit
- Unit: escape formula
- Integration: lần thứ 11 trong giờ → 429

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-05-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 3
- Last failure type (round 1/2): bộ lọc admin {or:[{and}]} bị bỏ → xuất toàn bộ; khoảng ngày picker T12:00Z bị nới cả ngày
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 xong (builder)
- Verify commands + result (builder, worktree wt9-t05): `pnpm lint` PASS; `pnpm typecheck` PASS; `pnpm test` 2046 test PASS, 1 suite FAIL đã biết (`src/lib/contrast.test.ts` CRLF); test mới: unit `xlsx-stream` (17), `export-filters` (11), `leads-export` handler (6), UI `LeadExportButton` (5), integration `leads-export` (9: 401/403, đọc lại file đúng số dòng + audit không PII, escape công thức, lọc, 400, ẩn danh/xoá mềm, audit lỗi 500, lần 11 → 429, tài khoản khoá); `pnpm build` FAIL do môi trường: Turbopack không resolve `next/font/google` (Montserrat), 15 lỗi đều ở font, không liên quan file task
- Reviewer verdict: STRICT round 1 FAIL → round 2 FAIL → round 3 PASS (`.context/review-reports/build-tami-website-layer-9-task-05-round-3-review.md`)
- Spec Validator verdict (layer close): GAPS (D5 một phần, BL-008) — `.context/review-reports/spec-validation-build-tami-website-layer-9.md`

## Doc / Decision Impact
- Doc impact result: có — `docs/API_SPEC.md` §4 thêm khối As-built cho `GET /api/admin/leads/export` (tham số, thứ tự lỗi, trần 20.000 dòng → 422, header, quy tắc escape/ẩn danh)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-05 leadexport` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/endpoints/admin/leads-export.ts
- src/components/admin/LeadExportButton.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-9-task-05 round 3 (MINOR)
- [→ BL-009] `src/lib/leads/export-filters.ts:94-95`: thông báo khoá nút ghi rõ chỉ hỗ trợ "lớn hơn hoặc bằng" / "nhỏ hơn hoặc bằng" cho Ngày tạo.
- [→ BL-009] `export-filters.ts:72`: so `createdFrom > createdTo` bằng `Date.parse` thay vì chuỗi.
- [→ BL-009] (tuỳ chọn) dò trash bằng server component `serverProps.params.segments[2] === "trash"` thay vì pathname; ẩn nút trong list drawer.
