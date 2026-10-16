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
- [ ] Chỉ admin (sale 403, khách 401); rate limit 10 lần/giờ/user
- [ ] Lọc theo trạng thái, nguồn, sale, khoảng ngày; stream file, `Cache-Control: no-store`
- [ ] Ô bắt đầu bằng `=`, `+`, `-`, `@` được escape (chống CSV/Excel injection)
- [ ] Ghi audit `lead.export` kèm bộ lọc và số dòng (không kèm dữ liệu khách)
- [ ] Không xuất lead đã ẩn danh dưới dạng có PII

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
- Commit gợi ý: `feat(layer-9): task-05 leadexport` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/endpoints/admin/leads-export.ts
- src/components/admin/LeadExportButton.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
