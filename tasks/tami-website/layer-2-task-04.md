# Task 04: Phiên đăng nhập hết hạn sau 8 giờ không hoạt động (làm mới token)

## Layer
2 — Upload, địa giới, audit, phiên đăng nhập, health, component media/form

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — security/session/token
- Blast radius: src/collections/Staff.ts (`auth.tokenExpiration: 28800`); src/components/admin/SessionKeepAlive.tsx (admin provider: nghe hoạt động chuột/phím/route, throttle, gọi `POST /api/staff/refresh-token`); src/payload.config.ts (`admin.components.providers`); …
- Doc impact (dự kiến): PERMISSION §7: ghi cơ chế thực tế; nếu không làm được → ghi residual risk trong task + `.context/decisions.md`
- Decision impact: YES — ghi `.context/decisions.md`

## Requirements
- PERMISSION §7
- SPECIFICATIONS § Authentication (ghi chú tokenExpiration tuyệt đối)
- design doc §5 (residual risk)

## Description
Payload `tokenExpiration` tính tuyệt đối; để đạt "8 giờ không hoạt động", admin UI làm mới token khi người dùng còn thao tác.

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)

Mở khoá cho: `layer-12-task-01`

## Acceptance Criteria
- [ ] Token hết hạn sau 8 giờ nếu không có hoạt động
- [ ] Có hoạt động trong admin → gọi refresh tối đa 1 lần mỗi 15 phút (throttle), token mới có hạn +8 giờ
- [ ] Tab ẩn/không thao tác không gọi refresh (không "giữ sống" vô hạn)
- [ ] Refresh thất bại (401) → chuyển về màn đăng nhập, không vòng lặp
- [ ] Cookie `payload-token` HttpOnly, Secure (production), SameSite=Lax

## Tests cần viết
- Unit (fake timers): nhiều sự kiện trong 15 phút → 1 lần refresh; không sự kiện → 0
- Integration: gọi refresh-token với token hợp lệ → `exp` mới > `exp` cũ

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-04-round-<R>-review.md`

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
- Doc impact result: pending (dự kiến: PERMISSION §7: ghi cơ chế thực tế; nếu không làm được → ghi residual risk trong task + `.context/decisions.md`)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-04 session` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/collections/Staff.ts (`auth.tokenExpiration: 28800`)
- src/components/admin/SessionKeepAlive.tsx (admin provider: nghe hoạt động chuột/phím/route, throttle, gọi `POST /api/staff/refresh-token`)
- src/payload.config.ts (`admin.components.providers`)
- tests/unit/session-keepalive.test.ts

## Notes
- Nếu API provider admin của phiên bản Payload không cho làm cách này, ghi residual risk và phương án thay (ví dụ rút `tokenExpiration` + refresh khi focus), dừng hỏi user, không tự đổi yêu cầu.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
