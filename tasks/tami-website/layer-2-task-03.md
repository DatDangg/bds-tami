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
- Attempt: 2 (sau Reviewer round 1 FAIL)
- Last failure type: review FAIL MAJOR-1 (guard afterChange/afterDelete bị vô hiệu ở bulk update/delete: Payload bulk gom lỗi từng doc rồi vẫn commit)
- Error memory entry: guard phải chạy TRƯỚC khi ghi (beforeChange/beforeDelete) + từ chối bulk chạm admin active ở beforeOperation; cờ req.context phải khoá theo doc id. Đã fix, tests bulk thêm vào audit-staff.test.ts.
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 đạt
- Verify commands + result (attempt 2): lint OK · typecheck OK · test 34 files / 362 tests PASS (thêm 6 integration bulk/cờ mật khẩu) · build OK
- Reviewer verdict: STRICT PASS round 2 (round 1 FAIL MAJOR-1 bulk bypass last-admin guard → đã sửa) — `.context/review-reports/build-tami-website-layer-2-task-03-round-2-review.md`
- Residual risk: `auth.login_failed` không ghi cho Local API `payload.login`; khe thời gian nhỏ ở check bulk `beforeOperation` (ngoài lock); `disableTransaction: true` bỏ qua advisory lock; cảnh báo deprecation `pg` (query chồng trên 1 connection, lỗi ở pg@9); MINOR-4 test "tái dùng req sau lỗi" không chứng minh được (password ngắn bị chặn trước khi set cờ); MINOR-5 test file 521 dòng
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.13 (thêm `staff.activate`, `staff.delete`; index `audit_logs` thực tế) + `docs/PERMISSION.md` §3.4 (luật admin cuối + chặn bulk chạm admin) và §6 (mở lại/xoá tài khoản)
- Decision log: none

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-03 audit` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/AuditLogs.ts
- src/lib/audit/write-audit-log.ts
- src/collections/Staff.ts (hooks: create, đổi role, khoá, reset mật khẩu, login thất bại)
- src/hooks/staff/*
- migrations/*

## Notes
- Audit cho lead/CV/dịch/xoá nội dung được gọi từ các task tương ứng bằng util này.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
