Agent: reviewer

# Review: build/tami-website layer-2-task-04 (round 2)

- Task: `tasks/tami-website/layer-2-task-04.md`. Phiên đăng nhập hết hạn sau 8 giờ không hoạt động (làm mới token).
- Round 1: FAIL (`.context/review-reports/build-tami-website-layer-2-task-04-round-1-review.md`). Có F1, F2 mức MAJOR và F3, F4, F5 mức MINOR.
- Scope: toàn bộ diff chưa commit so với HEAD `337e52e`. Gồm:
  - File sửa: `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/Staff.ts`, `src/lib/lint-rules.test.ts`, `src/payload.config.ts`, `vitest.config.ts`.
  - File mới: `src/components/admin/SessionKeepAlive.tsx`, `src/components/admin/SessionKeepAlive.test.tsx`, `src/lib/session/keepalive.ts`, `tests/unit/session-keepalive.test.ts`, `tests/integration/session-refresh.test.ts`.
  - `.context/*` nằm ngoài scope.

## Review level
**STRICT**

## Reason
Task đụng vào security/session/token: thời hạn JWT, cờ cookie, refresh-token, chuyển trang khi 401/403, và đồng bộ với `AuthProvider` của Payload UI. Ngoài ra task gắn một provider dùng chung cho mọi màn admin và thêm dependency trực tiếp (lockfile đổi).

## Blast radius
- Mọi màn Payload admin, vì `SessionKeepAlive` nằm trong `admin.components.providers` và giờ ghi trực tiếp vào state của `AuthProvider` (`setUser` → `setLocalSession` → `sessionTimers.setExpiration`).
- Hành vi nhiều tab: phiên dùng chung cookie/sid giữa các tab, và đồng bộ qua `tabSessionSync` (BroadcastChannel) của Payload UI.
- Collection `staff`: `tokenExpiration` và `cookies` (login/refresh/logout).
- Dependency: `@payloadcms/ui@3.91.0` thành direct dependency.
- Vitest: unit project có thêm `tests/unit/**`.
- `importMap.js` (file sinh).

## Verify commands + result
| Command (`.context/project-config.md`) | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS ("Done in 2.1s"), lockfile khớp `package.json` |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` lần 1 | PASS: 37 files / 387 tests |
| `pnpm test` lần 2 | PASS: 37 files / 387 tests (15.77s) |
| `pnpm test` lần 3 | PASS: 37 files / 387 tests |
| `pnpm build` | PASS (exit 0) |

## Kiểm chứng các fix round 1

**Dependency `@payloadcms/ui@3.91.0`: OK.**
- Version khớp các `@payloadcms/*` khác (đều `3.91.0`).
- Peer-suffix của importer `@payloadcms/ui` trong lockfile trùng hoàn toàn với `@payloadcms/ui` mà `@payloadcms/next` resolve (`pnpm-lock.yaml:7130`).
- Trên đĩa, `node_modules/@payloadcms/ui` và `node_modules/.pnpm/@payloadcms+next…xhtsfy…/node_modules/@payloadcms/ui` cùng trỏ tới instance `…bvs45wgo…`. Như vậy chỉ có một React context Auth, và `useAuth()` trong provider tuỳ biến lấy đúng context của `AuthProvider`.
- Trong store còn các biến thể cũ (`next@15.4.11`), nhưng importer không dùng tới.

**F1, phần chính: OK cho tab đang thao tác.**
- Trong `@payloadcms/ui/dist/providers/Auth/index.js:155-158`, `setUser` gọi `discardPendingResults()` rồi `setLocalSession()`.
- `setLocalSession` (`index.js:134-153`) gọi `sessionTimers.setExpiration(exp*1000)`.
- `setExpiration` (`useAuthSessionTimers.js:100+`) gọi `resetSessionLifecycle()` rồi lập lại lịch reminder, activity-checkpoint và force-logout theo `exp` mới. Các timeout cũ tự bỏ qua nhờ guard `tokenExpirationMsRef.current !== expirationMs`.
- Shape `{exp, user, refreshedToken}` đúng với `UserWithToken` (`types.d.ts:10-16`).
- Response refresh có `user.collection` (`payload/dist/auth/operations/refresh.js:86`), nên `logOutSession` về sau vẫn POST đúng `/{collection}/logout`. Đây cũng chính là shape mà Payload tự đưa vào `setLocalSession(json)` ở `refreshSession`.
- Không có re-render loop:
  - effect phụ thuộc `[pathname, anonymousKey, endpoint, loginPath]`, không phụ thuộc `setUser` (đi qua ref);
  - `setUser` chỉ làm re-render chứ không chạy lại effect;
  - throttle 15 phút cùng cờ `inFlight` chặn mọi đường gọi lặp.
- Test `SessionKeepAlive.test.tsx` chạy trong project `ui` (jsdom, `src/**/*.test.tsx`) và assert được `setUser` nhận đúng payload.
- Còn sót trường hợp nhiều tab, xem N1.

**F2: OK.** Timeout 30s cho describe ESLint. 3/3 lần `pnpm test` xanh.

**F3: một phần.** Màn inactivity đã được loại. Tuy nhiên danh sách lấy *toàn bộ* `config.admin.routes`, trong đó có cả màn đã đăng nhập. Xem N2.

**F4: OK.**
- Endpoint lấy từ `config.routes.api` + `config.admin.user`.
- Login path lấy từ `config.routes.admin` + `config.admin.routes.login`.
- `SESSION_TTL_SECONDS` là nguồn duy nhất, `Staff.ts` import từ đó.

**F5: OK.** `tests/integration/session-refresh.test.ts:51-54` assert `secure === (NODE_ENV==="production")` và `sameSite === "Lax"`.

**Staff.ts không regress.** Diff chỉ thêm `tokenExpiration` và `cookies`. Các hook audit (`auditStaffChanges`, `auditStaffDelete`, `auditTokenPasswordReset`) và last-admin guard (`guardLastAdminOnDelete/Update`, `rejectBulkChangeOfActiveAdmins`) giữ nguyên. Toàn bộ test audit/guard hiện có đều PASS.

**Flaky DB integration (access, jobs-email, media-upload).** Cả 3 lần reviewer chạy đều không tái hiện. Phần task thêm vào vitest chỉ là 1 file unit chạy node thuần (không DB, không I/O) vào project `unit`, nên không làm tăng tranh chấp DB một cách đáng kể. Không có bằng chứng lỗi này do task gây ra; ghi vào Residual risk.

## Findings

### [MAJOR] N1: Refresh không broadcast sang các tab khác. Tab admin để yên sẽ đăng xuất (thu hồi sid ở server) phiên của tab đang làm việc
- Vị trí:
  - `src/components/admin/SessionKeepAlive.tsx:41-43`: refresh bằng `fetch` riêng, sau đó `setUser`.
  - `src/lib/session/keepalive.ts:77-89`.
- Cơ chế (theo nguồn `@payloadcms/ui` 3.91.0):
  1. Refresh của chính Payload (`refreshSession`, `Auth/index.js:200-256`) sau khi `setLocalSession(json)` còn gọi `tabSessionSync.broadcast({type: REFRESHED, session})`. Nhờ đó các tab khác dời `exp` theo.
  2. `setUser` **không** broadcast.
  3. Mặt khác, tab A được keepalive refresh mỗi 15 phút nên `exp` của A liên tục bị đẩy xa. Vì vậy A không bao giờ chạm tới cửa sổ "4 phút cuối", và refresh có broadcast của Payload không bao giờ chạy nữa.
- Kịch bản cụ thể:
  1. Lúc 08:00 nhân viên mở 2 tab admin, tab B để yên (ẩn).
  2. Tab A thao tác liên tục. Keepalive refresh A, server `exp` luôn khoảng hiện tại + 8h.
  3. Tab B vẫn giữ `exp = 16:00`. Đến 16:00, `onSessionExpiration` của B (`index.js:101-110`) chạy `logOutSession`, tức POST `/api/staff/logout`.
  4. `payload/dist/auth/operations/logout.js:48` xoá session theo `_sid`. Sid này dùng chung với tab A vì cùng cookie.
  5. Tab A: lần refresh kế tiếp bị 403, chuyển sang login. Mọi request API của A cũng bị từ chối ngay.
- Hệ quả: người dùng đang làm việc liên tục vẫn mất phiên sau đúng 8h tuyệt đối, chỉ vì có một tab admin khác đang mở. AC1 ("hết hạn sau 8 giờ **nếu không có hoạt động**") và AC2 không đạt trong trường hợp nhiều tab, vốn rất phổ biến (mở bản ghi ở tab mới). Đây là regression so với hành vi đồng bộ đa tab mặc định của Payload. Round 1 (F1) đã nêu "refresh ở tab A không báo cho timer của tab B", nhưng chưa được xử lý.
- Cách fix đề xuất:
  - Dùng `useAuth().refreshCookieAsync()` (`index.js:257-261` → `refreshSession`) thay cho `fetch` thủ công + `setUser`. Hàm này làm cả 4 việc: refresh, `setLocalSession`, broadcast REFRESHED sang tab khác, và có guard `acceptResult` / `isResultStale` / logout-in-progress.
  - Payload tự xử lý non-200 (`invalidateWhenIdle` → `redirectToInactivityRoute`), nên phải bỏ `onUnauthorized` / `window.location.replace` để không chuyển trang hai lần. Có thể dừng keepalive khi kết quả là `null`.
  - Giữ throttle 15 phút và điều kiện tab ẩn trong `createKeepAlive`. `refresh` trả user hoặc null thay cho `RefreshResult`.
  - Thêm test component: assert keepalive gọi `refreshCookieAsync` (mock `useAuth`) và không tự gọi `fetch`.

### [MINOR] N2: Danh sách "màn không có phiên" bao gồm cả màn đã đăng nhập (`account`, `browseByFolder`)
- Vị trí: `src/components/admin/SessionKeepAlive.tsx:34`, đoạn `Object.values(config.admin.routes)`.
- Theo `payload/dist/config/defaults.js:21-31`, `admin.routes` có cả `account: '/account'` và `browseByFolder: '/browse-by-folder'`. Như vậy ở `/admin/account` và `/admin/browse-by-folder/*`, keepalive không gắn listener và không refresh, dù người dùng vẫn đang thao tác. Payload chỉ còn cơ chế dự phòng là refresh khi có hoạt động trong 4 phút cuối.
- Task ghi danh sách là "login, logout, inactivity, forgot, reset, createFirstUser, unauthorized", khác với code. Mock trong `SessionKeepAlive.test.tsx:14` không có `account`, nên test không bắt được lỗi này.
- Fix: chọn tường minh các key `login`, `logout`, `inactivity`, `forgot`, `reset`, `createFirstUser`, `unauthorized` từ `config.admin.routes`. Thêm test: `/admin/account` **có** refresh.

### [MINOR] N3: Kết quả refresh tới sau khi logout có thể "hồi sinh" user trong bộ nhớ
- Vị trí: `src/components/admin/SessionKeepAlive.tsx:43`.
- Thao tác click nút Logout phát ra `pointerdown`, cũng được tính là activity. Nếu đã quá 15 phút kể từ lần refresh trước, refresh sẽ chạy song song với logout. `setUser` không có guard `isLoggingOut` / `acceptResult` như đường refresh nội bộ của Payload. Response 200 tới muộn sẽ `setLocalSession(user)` sau khi Payload đã xoá state.
- Cửa sổ race nhỏ. Fix N1 bằng `refreshCookieAsync` sẽ xử lý luôn vấn đề này.

### [MINOR] N4: Ép kiểu kép `as unknown as UserWithToken`
- Vị trí: `src/components/admin/SessionKeepAlive.tsx:43`.
- Có thể khai báo `RefreshedSession.user` là `ClientUser`, hoặc type bằng `UserWithToken` trực tiếp. Sẽ tự hết nếu áp dụng fix N1.

## Responsive Checklist Gate
N/A. `SessionKeepAlive` chỉ render `<>{children}</>`, không có route, layout hay CSS mới. Các mục Layout, Typography/Spacing, Media, Touch/Interaction, Viewport/A11y đều N/A.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: không nằm trong verify commands được allow |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed / không được allow |
| AI-readable | OK. Tên rõ ràng, hàm ≤ 50 dòng, file ≤ 300 dòng, comment giải thích lý do (WHY). Có 1 indicator nhẹ (cast kép N4), dưới ngưỡng 3 |
| ai-friendly-web | N/A: admin nội bộ |
| blitzstrike | skip: không có môi trường pentest được phép. Không có finding STRIKE-validated |

## Residual risk
- Reviewer không chạy browser. N1 và N3 được suy ra từ đọc nguồn `@payloadcms/ui` 3.91.0 (`Auth/index.js`, `useAuthSessionTimers.js`, `tabSessionSync/index.js`) và `payload/dist/auth/operations/logout.js`, chưa tái hiện trực tiếp.
- Integration DB fail thoáng qua (builder ghi nhận 1 lần) không tái hiện được trong 3 lần chạy. Không có bằng chứng liên quan tới task này. Nếu tái diễn nên mở task riêng, xem xét `fileParallelism: false` hoặc tách DB/schema cho từng file trong project integration.
- Cờ Secure trên staging phụ thuộc vào việc chạy `next start` (NODE_ENV=production), giống ghi chú round 1.
- Close-out: Doc impact (PERMISSION §7) và `.context/decisions.md` vẫn ghi "pending".

## Verdict
**FAIL**: còn 1 MAJOR (N1: refresh không đồng bộ đa tab, tab để yên thu hồi phiên của tab đang làm việc sau 8h). Builder cần sửa N1, nên dùng `refreshCookieAsync`; cách này xử lý luôn N3 và N4. Sửa N2 trong cùng round.
