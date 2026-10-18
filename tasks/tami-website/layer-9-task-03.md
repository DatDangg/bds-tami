# Task 03: Phân công lead: hook `leads.afterChange` (nơi duy nhất) + `POST /api/admin/leads/:id/assign`

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — RBAC + side effect email/audit + BOLA
- Blast radius: src/hooks/leads/on-assignment-change.ts; src/endpoints/admin/lead-assign.ts; src/lib/email/templates/lead-assigned.ts
- Doc impact (dự kiến): API_SPEC §4, §5 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-09
- BR-12, BR-13
- API_SPEC §4, §5
- PERMISSION §4, §5, §6
- design doc D6

## Description
Mọi thay đổi `assignedTo` (endpoint, form admin, tự giao) sinh activity `assignment` + email sale mới + audit `lead.assign` (trừ tự giao) ở đúng một hook.

## Dependencies
- `layer-8-task-02` Collection `leads` + `lead-activities` (trạng thái, ghi chú, quyền theo người được giao) (dùng kết quả của task này)
- `layer-1-task-07` Payload Jobs Queue + email Brevo SMTP + job `send-notification-email` (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`, `layer-13-task-01`

## Acceptance Criteria
- [x] Endpoint: authenticate → admin (403) → lead tồn tại (404) → `staffId` là sale `active` (400) → chỉ cập nhật `assignedTo` qua Local API
- [x] Hook: `assignedTo` đổi → 1 activity `assignment` (from/to), `assignedAt`, enqueue email cho sale mới, audit `lead.assign` (bỏ audit khi tự giao bởi hệ thống)
- [x] Admin đổi trong form admin cho kết quả giống hệt endpoint (không sinh trùng)
- [x] Sale không đổi được `assignedTo`

## Tests cần viết
- Integration: assign qua endpoint → đúng 1 activity, 1 job email, 1 audit
- Integration: đổi qua REST admin → cùng kết quả; lưu lại không đổi `assignedTo` → không sinh gì
- Integration: sale gọi endpoint → 403

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-03-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): MAJOR-1 form/REST gán lead cho sale khoá/admin (assignedTo không validate) → email PII tới người đã nghỉ
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm test` (179 file, 1.943) · `pnpm build` PASS
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-9-task-03-round-2-review.md`); MINOR-B/C → `layer-9-task-02.md`
- Spec Validator verdict (layer close): GAPS (D5 một phần, BL-008) — `.context/review-reports/spec-validation-build-tami-website-layer-9.md`

## Doc / Decision Impact
- Doc impact result: API_SPEC §4 as-built (endpoint + luật sale active mọi đường ghi + khi không email), ERD §4.11, PERMISSION §3.3
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-03 leadassign` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/hooks/leads/on-assignment-change.ts
- src/endpoints/admin/lead-assign.ts
- src/lib/email/templates/lead-assigned.ts

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
- Round 1 fix (L9-T03): rule `validate` trên `leads.assignedTo` (`src/collections/Leads.ts`) từ chối khi giá trị ĐỔI sang người không phải sale `active` (dùng `isAssignableSale` chung với endpoint), lỗi ValidationError 400, message `ASSIGNEE_NOT_ASSIGNABLE_MESSAGE` (`src/lib/leads/assignable-sale.ts`). Cho L9-T02 (BR-12 tự giao `assignedTo = author`): author là sale active thì qua; author admin/bị khoá thì `payload.create` ném ValidationError (status 400, path `assignedTo`) trước khi ghi gì -> T02 phải tự kiểm bằng `isAssignableSale(author)` (hoặc bắt lỗi) và fallback tạo lead không giao.
