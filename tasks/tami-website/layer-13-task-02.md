# Task 02: Quản lý chuyển hướng 301 trong admin (FR-ADM-15): kiểm tra hợp lệ, chống vòng/chuỗi

## Layer
13 — Should: dashboard, redirect UI, trang khu vực, đối tác

Checkpoint: ⏸ **Mốc M4** — dừng chờ user duyệt sau layer này (Should xong (dashboard, redirect UI, trang khu vực, đối tác))

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Should
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — chỉ admin, plugin đã có
- Blast radius: src/hooks/redirects/validate-redirect.ts; src/payload.config.ts (overrides plugin redirects)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-ADM-15

## Description
Admin tạo/sửa redirect tay an toàn.

## Dependencies
- `layer-6-task-03` Redirect 301 tự động khi đổi slug (theo từng ngôn ngữ) + xử lý redirect phía website (dùng kết quả của task này)
- `layer-12-task-01` Redeploy staging bản đủ Must + bật giám sát/backup + chạy E2E smoke trên staging (thứ tự ưu tiên: Should làm sau khi toàn bộ Must đã lên staging)

Mở khoá cho: `layer-14-task-01`, `layer-14-task-02`, `layer-15-task-01`

## Acceptance Criteria
- [ ] `from` chuẩn hoá (bắt đầu `/`, không domain, không query trùng); `to` là đường dẫn nội bộ hoặc URL tuyệt đối http(s)
- [ ] Chặn vòng lặp và chuỗi > 1 bước; chặn `from` trùng
- [ ] Chặn `from` thuộc `/admin`, `/api`

## Tests cần viết
- Integration: A→B rồi B→A → lỗi; `from` `/admin` → lỗi

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-13-task-02-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-13): task-02 redirui` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-13/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/hooks/redirects/validate-redirect.ts
- src/payload.config.ts (overrides plugin redirects)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
