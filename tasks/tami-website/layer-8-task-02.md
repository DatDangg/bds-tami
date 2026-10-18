# Task 02: Collection `leads` + `lead-activities` (trạng thái, ghi chú, quyền theo người được giao)

## Layer
8 — Global trang chủ, dữ liệu lead, danh sách Cho thuê, trang Đăng tin BĐS, sitemap

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — PII khách hàng + RBAC theo bản ghi + schema
- Blast radius: src/collections/Leads.ts, LeadActivities.ts; src/hooks/leads/generate-code.ts (`LD-000001`); src/hooks/leads/status-activity.ts (status_change, firstContactedAt, lastActivityAt); …
- Doc impact (dự kiến): ERD §4.11, PERMISSION §3.3 nếu lệch
- Decision impact: NO

## Requirements
- FR-ADM-09
- BR-11, BR-17, BR-30, BR-32
- ERD §4.11, §5
- PERMISSION §3.3, §4

## Description
Lưu lead và lịch sử chăm sóc; sale chỉ thấy lead được giao; admin quản lý toàn bộ trong `/admin`.

## Dependencies
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-7-task-01` Collection `property-posts` (Đăng tin BĐS) + job `expire-offers` (dùng kết quả của task này)
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)
- `layer-1-task-05` Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash (dùng kết quả của task này)

Mở khoá cho: `layer-9-task-02`, `layer-9-task-03`, `layer-9-task-04`, `layer-9-task-05`, `layer-9-task-06`

## Acceptance Criteria
- [x] Đủ trường ERD §4.11; `code` sequence chỉ đọc; `phoneNormalized` index
- [x] Không ai tạo lead qua REST công khai (chỉ endpoint ở task sau)
- [x] Sale: đọc/sửa lead được giao (status, ghi chú); không sửa `fullName/phone/email/message/locale`; không xoá; không xuất
- [x] Chuyển `lost` bắt buộc `lostReason`; trạng thái theo BR-11
- [x] Đổi `status` → activity `status_change` (hook); `firstContactedAt` lần đầu rời `new`
- [x] `lead-activities` chỉ thêm (không sửa/xoá); sale thêm được note/call trên lead được giao
- [x] Danh sách admin lọc theo trạng thái/nguồn/sale/thời gian; lead có sale `active=false` hiện cảnh báo
- [x] SĐT/email chỉ admin và sale phụ trách thấy (BR-32)

## Tests cần viết
- Integration: sale A đọc lead của sale B → 404/không thấy; sale sửa `phone` → bị chặn
- Integration: `lost` thiếu lý do → lỗi
- Integration: đổi status → 1 activity
- Integration: sale xoá activity → 403

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-02-round-<R>-review.md`

## Migration
- Bảng `leads`, `lead_activities`, sequence `leads_code_seq`, index `(phone_normalized, source, created_at DESC)`, `(status, assigned_to_id, created_at DESC)`. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): M1 access create `lead-activities` trả false khi không có data → admin UI ẩn nút thêm note/call
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: `pnpm lint` · `pnpm typecheck` · `pnpm test` (164 file, 1.788) · `pnpm build` PASS; migration up→down→up (đã áp DB dev, batch 23)
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-8-task-02-round-2-review.md`)
- Ghi chú: Payload trả 403 (không phải 404) khi sale update by id lead không được giao — test assert 403; id là uuid
- Spec Validator verdict (layer close): GAPS (task đạt AC; gap G31 ngoài task) — `.context/review-reports/spec-validation-build-tami-website-layer-8.md`

## Doc / Decision Impact
- Doc impact result: ERD §4.11 as-built (+ quy tắc `asSystemActivity`), PERMISSION §3.3, ARCHITECTURE §4
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-8): task-02 leads` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Leads.ts, LeadActivities.ts
- src/hooks/leads/generate-code.ts (`LD-000001`)
- src/hooks/leads/status-activity.ts (status_change, firstContactedAt, lastActivityAt)
- src/components/admin/LeadAssigneeWarning.tsx (cảnh báo "sale đã khoá")
- migrations/*

## Notes
- Side effect phân công (activity assignment, email, audit) KHÔNG làm ở đây — task lead-assignment, một nơi duy nhất (design D6).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5 addendum
- [x] G23: thống nhất cách ẩn danh PII với `job-applications` (giá trị thay thế, không NULL khi cột NOT NULL).
