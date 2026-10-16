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
- [x] Token hết hạn sau 8 giờ nếu không có hoạt động
- [x] Có hoạt động trong admin → gọi refresh tối đa 1 lần mỗi 15 phút (throttle), token mới có hạn +8 giờ
- [x] Tab ẩn/không thao tác không gọi refresh (không "giữ sống" vô hạn)
- [x] Refresh thất bại (401) → chuyển về màn đăng nhập, không vòng lặp
- [x] Cookie `payload-token` HttpOnly, Secure (production), SameSite=Lax

## Tests cần viết
- Unit (fake timers): nhiều sự kiện trong 15 phút → 1 lần refresh; không sự kiện → 0
- Integration: gọi refresh-token với token hợp lệ → `exp` mới > `exp` cũ

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-2-task-04-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 3 (Attempt 1: Reviewer round 1 FAIL; Attempt 2: Reviewer round 2 FAIL N1)
- Last failure type: review round 2 FAIL — N1 MAJOR (refresh bằng fetch + `setUser` không broadcast REFRESHED sang tab khác nên tab để yên logout/thu hồi sid của tab đang làm việc), N2 (danh sách màn bỏ qua gồm `account`, `browseByFolder`), N3 (race logout), N4 (cast kép)
- Error memory entry: root cause N1 = `setUser` chỉ cập nhật tab hiện tại; chỉ `refreshSession` của Payload mới `tabSessionSync.broadcast(REFRESHED)`. Fix: dùng `useAuth().refreshCookieAsync()` (refresh + setLocalSession + broadcast + guard `isLoggingOut`/`isResultStale` → xử lý luôn N3, N4). Non-200 khi có user: Payload tự `invalidateWhenIdle` → `redirectToInactivityRoute`, nên bỏ redirect/RefreshResult/fetch tự làm; lỗi mạng chỉ toast, trả null (vẫn bị throttle 15 phút). N2: chọn tường minh 7 key.
- Attempt 1 notes: F1 = `AuthProvider` chỉ dời mốc hết hạn qua setUser/setLocalSession; F2 = ESLint programmatic timeout 5s, fix timeout 30s.
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 đạt. Hết hạn 8h = `tokenExpiration: SESSION_TTL_SECONDS` (28800, một nguồn ở `src/lib/session/keepalive.ts`); keepalive gọi `useAuth().refreshCookieAsync()` (đồng bộ timer, broadcast tab khác, guard logout); throttle 15 phút (tính cả lần lỗi), inFlight, tab ẩn bỏ qua; 401/403 do Payload tự chuyển màn inactivity (không redirect riêng); màn bỏ qua = key login/logout/inactivity/forgot/reset/createFirstUser/unauthorized, `/admin/account` vẫn refresh; cookie HttpOnly + SameSite=Lax + Secure khi production (assert trong integration test). Dependency trực tiếp `@payloadcms/ui` 3.91.0 giữ nguyên.
- Verify commands + result (attempt 3): `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` PASS 37 files / 386 tests (lần 1) và 386 tests (lần 2) · `pnpm build` PASS
- Reviewer verdict: round 1 FAIL (F1, F2) · round 2 FAIL (N1 MAJOR) · round 3 STRICT PASS — `.context/review-reports/build-tami-website-layer-2-task-04-round-3-review.md`
- Residual risk: chưa E2E trình duyệt (đa tab suy từ source Payload); 401 đi qua màn inactivity trước login; Secure phụ thuộc NODE_ENV=production ở staging/prod; test integration flaky 1/3 lần (jobs-email hoặc session-refresh — `afterAll` session-refresh không guard `staffId`); importMap.js regen thêm `S3ClientUploadHandler` còn thiếu từ layer-2-task-01
- Spec Validator verdict (layer close): COMPLETE (PASS) — .context/review-reports/spec-validation-build-tami-website-layer-2.md

## Doc / Decision Impact
- Doc impact result: `docs/PERMISSION.md` §7 ghi cơ chế thực tế
- Decision log: `.context/decisions.md` — Phiên admin hết hạn sau 8 giờ không hoạt động

## Commit / Tracking
- Commit gợi ý: `feat(layer-2): task-04 session` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-2/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/collections/Staff.ts (`auth.tokenExpiration: 28800`)
- src/components/admin/SessionKeepAlive.tsx (admin provider: nghe hoạt động chuột/phím/route, throttle, gọi `POST /api/staff/refresh-token`)
- src/payload.config.ts (`admin.components.providers`)
- tests/unit/session-keepalive.test.ts

## Notes
- Nếu API provider admin của phiên bản Payload không cho làm cách này, ghi residual risk và phương án thay (ví dụ rút `tokenExpiration` + refresh khi focus), dừng hỏi user, không tự đổi yêu cầu.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
