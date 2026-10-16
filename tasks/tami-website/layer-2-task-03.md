# Task 03: `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: CROSS_CUTTING
- Review level expected: **STRICT** — RBAC tài khoản + audit + schema
- Blast radius: src/collections/AuditLogs.ts; src/lib/audit/write-audit-log.ts; src/collections/Staff.ts (hooks: create, đổi role, khoá, reset mật khẩu, login thất bại); …
- Doc impact (dự kiến): PERMISSION §6 nếu danh sách action đổi
- Decision impact: NO

## Requirements
- FR-ADM-11
- FR-ADM-13
- PERMISSION §3.4, §6
- ERD §4.13

## Description
Nhật ký thao tác chỉ thêm, util `writeAuditLog` dùng chung, và luồng quản trị tài khoản sale có ghi nhật ký.

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)
- `layer-1-task-05` Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash (dùng kết quả của task này)

Mở khoá cho: `layer-3-task-02`, `layer-6-task-10`, `layer-8-task-02`, `layer-9-task-03`, `layer-9-task-05`, `layer-9-task-06`, `layer-10-task-02`

## Acceptance Criteria
- [ ] `audit-logs` chỉ admin đọc; không ai update/delete qua API (kể cả admin)
- [ ] `writeAuditLog({actor, action, collection, docId, summary, meta, req})` ghi `ipHash`, không chứa mật khẩu/token
- [ ] Ghi audit: `staff.create`, `staff.update_role`, `staff.deactivate`, `staff.reset_password`, `auth.login_failed`
- [ ] Hệ thống luôn còn ≥ 1 admin `active`: chặn khoá/hạ quyền/xoá admin cuối cùng
- [ ] Admin tạo sale, khoá (`active=false`), đặt lại mật khẩu; sale không làm được các việc này

## Tests cần viết
- Integration: mỗi action ghi đúng 1 bản audit
- Integration: admin cố update/delete audit-log → 403
- Integration: khoá admin cuối cùng → lỗi validate
- Unit: meta không chứa trường `password`/`salt`/`hash`

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-03-round-<R>-review.md`

## Migration
- Bảng `audit_logs` + index `(created_at DESC)`, `(collection, doc_id)`. Additive.
- Tạo bằng `pnpm payload migrate:create <tên>` trên DB dev (Docker Compose dev); commit file trong `migrations/` cùng task. Không sửa migration đã apply; cấm `db push` / `migrate reset`.
- Trước commit: đọc file migration sinh ra; nếu có DROP / đổi type / SET NOT NULL / UNIQUE/FK trên dữ liệu cũ / backfill → gắn `HIGH_RISK_MIGRATION` và dừng báo user (không dự kiến ở initial build vì toàn bảng mới).

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
- Doc impact result: pending (dự kiến: PERMISSION §6 nếu danh sách action đổi)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-03 audit` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/AuditLogs.ts
- src/lib/audit/write-audit-log.ts
- src/collections/Staff.ts (hooks: create, đổi role, khoá, reset mật khẩu, login thất bại)
- src/hooks/staff/*
- migrations/*

## Notes
- Audit cho lead/CV/dịch/xoá nội dung được gọi từ các task tương ứng bằng util này.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
