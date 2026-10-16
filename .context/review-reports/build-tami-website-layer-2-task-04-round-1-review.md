Agent: reviewer

# Review — build/tami-website layer-2-task-04 (round 1)

Task: `tasks/tami-website/layer-2-task-04.md`: phiên đăng nhập hết hạn sau 8 giờ không hoạt động (làm mới token).
Scope: diff chưa commit so với HEAD `337e52e`. Gồm `src/app/(payload)/admin/importMap.js`, `src/collections/Staff.ts`, `src/payload.config.ts`,
`vitest.config.ts`, cùng các file mới `src/components/admin/SessionKeepAlive.tsx`, `src/lib/session/keepalive.ts`, `tests/unit/session-keepalive.test.ts`,
`tests/integration/session-refresh.test.ts`. `.context/*` nằm ngoài scope.

## Review level
**STRICT**

## Reason
Task đụng security/session/token (thời hạn JWT, cookie flags, refresh-token, chuyển trang khi 401) và gắn provider dùng chung cho mọi màn admin
(`admin.components.providers`). Đây đúng là nhóm "risk đỏ" theo AGENTS.md § Reviewer rules.

## Blast radius
- Mọi màn Payload admin, vì provider `SessionKeepAlive` bọc toàn bộ admin UI. Phần này chạy chung với `AuthProvider` / `useAuthSessionTimers` của `@payloadcms/ui` 3.91.0.
- Collection `staff` (auth): `tokenExpiration` 28800, cookie `payload-token` (login/refresh/logout đều đi qua `payload/dist/auth/cookies.js` và dùng cùng `cookies.secure` / `sameSite`).
- Endpoint `POST /api/staff/refresh-token`: gia hạn `sessions[].expiresAt` trong DB, giữ nguyên `_sid`.
- Cấu hình test: unit project của vitest có thêm `tests/unit/**`.
- `importMap.js` (file sinh): thêm `S3ClientUploadHandler`, ảnh hưởng client upload của storage-s3 (từ task-01).

## Verify commands + result
| Command (`.context/project-config.md`) | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (lần 1) | **FAIL**: 1 failed / 376 passed (377). `src/lib/lint-rules.test.ts > ESLint: chặn lucide-react > báo lỗi khi import lucide-react`: `Test timed out in 5000ms` |
| `pnpm test` (lần 2, chạy lại để xác nhận flaky) | **FAIL**: 1 failed / 376 passed (377), cùng số lượng. Output bị cắt đuôi nên chưa thấy tên test, nhiều khả năng vẫn là lint-rules |
| `pnpm build` | PASS (exit 0) |
| `pnpm install --frozen-lockfile` | không chạy (lockfile không đổi trong diff) |

Các test mới của task đều PASS trong cả hai lần chạy: 11 unit keepalive và 4 integration session-refresh (DB thật).

## Đối chiếu nguồn Payload 3.91 (kiểm tra độc lập)
- `payload/dist/auth/operations/refresh.js`: refresh giữ `_sid`, đặt `existingSession.expiresAt = now + tokenExpiration` rồi ký JWT mới có `exp = now + 8h`. Logout xoá session theo `sid`, nên token đã refresh (cùng sid) bị thu hồi đúng khi logout. **OK.**
- `payload/dist/auth/cookies.js`: cả cookie cấp mới và cookie hết hạn (logout) đều dùng `httpOnly: true` cố định, `sameSite` và `secure: collectionAuthConfig.cookies.secure`. Login, refresh và logout dùng chung cờ. **OK.**
- `NODE_ENV` ở staging: repo chưa có Dockerfile hay compose production (chỉ có `docker/docker-compose.dev.yml`; bước DevOps chưa làm). `next start` / `next build` luôn chạy với `NODE_ENV=production`, nên Secure sẽ bật nếu staging chạy bằng `pnpm start`. Đây là residual risk, xem bên dưới.
- `@payloadcms/ui` 3.91.0, `providers/Auth/index.js` + `useAuthSessionTimers.js` + `sessionTiming.js`: Payload UI **đã có sẵn** cơ chế timer phiên ở client. Cụ thể:
  - Theo dõi hoạt động (focus/keydown/mousemove/route) chỉ trong 4 phút cuối trước `exp`.
  - Tự refresh nếu có hoạt động trong khoảng đó.
  - Hiện modal "Stay logged in" lúc `exp - 60s`.
  - **Đúng thời điểm `exp` đang giữ trong bộ nhớ thì gọi `onExpire` → `logOutSession` (POST `/api/staff/logout`) → chuyển sang `/admin/logout-inactivity`.**

  Mốc `exp` này chỉ được cập nhật qua `setLocalSession` (từ `me` khi mount, refresh của chính Payload, hoặc `setUser`).
- Provider tuỳ biến được render bên trong `RootProvider` → `AuthProvider` (`@payloadcms/next/dist/layouts/Root/index.js` dùng `NestProviders` trong `RootProvider`), nên gọi được `useAuth()`.

## Findings

### [MAJOR] F1: Refresh của SessionKeepAlive không đồng bộ timer phiên của Payload UI. Admin vẫn bị đăng xuất cưỡng bức theo `exp` cũ, AC1/AC2 không đạt trên SPA
- Vị trí: `src/lib/session/keepalive.ts:53-62` (`refreshStaffToken` gọi `fetch` thô), `src/components/admin/SessionKeepAlive.tsx:33-38`.
- Cơ chế: refresh thành công chỉ cập nhật cookie và `sessions[].expiresAt` ở server. Response JSON (`{ user, exp, refreshedToken }`) bị bỏ qua. `AuthProvider` của Payload vẫn giữ `exp` lấy từ lúc mount (`me`). Điều hướng trong admin là client-side nên `AuthProvider` không mount lại, và mốc `exp` này không bao giờ được cập nhật.
- Kịch bản cụ thể:
  1. Đăng nhập lúc 08:00, UI giữ `exp = 16:00`.
  2. Người dùng thao tác liên tục đến 15:50. SessionKeepAlive refresh mỗi 15 phút, server `exp` ≈ 23:45.
  3. Nghỉ 15:50–16:05, không có hoạt động trong cửa sổ [15:56, 15:59), nên Payload không tự refresh.
  4. 15:59 hiện modal "Stay logged in".
  5. **16:00 `onExpire` → POST logout (xoá session) → `/admin/logout-inactivity`.**

  Kết quả: người dùng mới nghỉ khoảng 10 phút đã mất phiên. Như vậy AC "Token hết hạn sau 8 giờ nếu không có hoạt động" và "token mới có hạn +8 giờ" chỉ đúng ở server. Hành vi thực tế vẫn là mặc định của Payload: tính tuyệt đối, trừ khi có thao tác trong khoảng 4 phút cuối. Refresh ở tab A cũng không báo cho timer của tab B.
- Vì sao test không bắt được: unit test chỉ kiểm throttle đã tách riêng, integration test chỉ kiểm endpoint. Không có test nào kiểm tương tác với `AuthProvider` (false confidence).
- Cách fix đề xuất:
  - Trong `SessionKeepAlive` lấy `const { setUser } = useAuth()` (`@payloadcms/ui`). Khi refresh `ok` thì `setUser(await response.json())`, để `setLocalSession` → `sessionTimers.setExpiration(exp*1000)`. Giữ nguyên cách phân loại 401/403 so với 5xx.
  - Hoặc dùng `refreshCookieAsync()` của `useAuth()`. Cách này có cả broadcast đa tab, nhưng Payload sẽ tự xử lý non-200 bằng `logout-inactivity`, nên phải bỏ `redirectToLogin` trùng lặp.
  - Cho `createKeepAlive` / `refreshStaffToken` trả session để test được callback `onRefreshed(session)`. Thêm unit test khẳng định callback nhận `exp` mới.

### [MAJOR] F2: Verify gate `pnpm test` đỏ, tái hiện 2/2 lần
- Vị trí: `src/lib/lint-rules.test.ts:12` (timeout 5000ms mặc định).
- Builder báo đây là flaky lần đầu và chạy lại thì PASS. Reviewer chạy 2 lần liên tiếp, cả 2 lần đều 1 failed / 377. Diff thêm `tests/unit/**` vào unit project (`vitest.config.ts:13`), làm tăng tải song song. Chưa chứng minh được là không liên quan.
- Fix: đặt timeout riêng cho test ESLint programmatic (ví dụ `it(..., 30_000)`), hoặc `testTimeout` cho unit project. Sau đó `pnpm test` phải xanh ổn định. Nếu coi là lỗi có sẵn thì tách task riêng, nhưng gate của task này vẫn cần xanh trước commit.

### [MINOR] F3: Màn `/admin/logout-inactivity` không nằm trong danh sách anonymous
- Vị trí: `src/components/admin/SessionKeepAlive.tsx:12-14`. `"logout"` chỉ khớp `/admin/logout` và `/admin/logout/*`, không khớp `/admin/logout-inactivity` (route mặc định trong `payload/dist/config/defaults.js:26`).
- Hệ quả: khi Payload chuyển sang màn inactivity (session đã bị logout), route change gọi `onActivity`. Nếu đã quá 15 phút kể từ lần thử trước thì refresh → 403 → `window.location.replace('/admin/login?redirect=/admin/logout-inactivity')`. Lệnh này chạy đua với `router.push(login?redirect=<trang gốc>)` của `LogoutClient`, làm mất trang gốc và thừa một lần tải lại trang. Không tạo vòng lặp vô hạn, vì sau khi đăng nhập `LogoutClient` (inactivity) chỉ đẩy về login, rồi login đẩy người dùng đã đăng nhập về dashboard.
- Fix: thêm `logout-inactivity`. Tốt hơn là đọc từ `config.admin.routes` qua `useConfig()` thay vì hardcode.

### [MINOR] F4: Hardcode route/slug và trùng hằng số TTL
- `src/lib/session/keepalive.ts:7` hardcode `/api/staff/refresh-token`. `SessionKeepAlive.tsx:9` hardcode `/admin`. Đổi `routes.api` / `routes.admin` / `Staff.slug` là hỏng mà không có báo lỗi. Nên lấy từ `useConfig()` (`config.routes`, `config.admin.user`).
- `src/collections/Staff.ts:22` `TOKEN_EXPIRATION_SECONDS` trùng giá trị với `SESSION_TTL_SECONDS` (`keepalive.ts:5`). Nên để một nguồn: `Staff.ts` import `SESSION_TTL_SECONDS`.

### [MINOR] F5: Chưa có kiểm chứng tự động cho cờ Secure ở production
- `src/collections/Staff.ts:113`. Integration test chỉ kiểm HttpOnly và SameSite=Lax. Nên thêm một assert config-level: `payload.collections.staff.config.auth.cookies.secure === (process.env.NODE_ENV === "production")`. Hoặc ghi rõ trong task là Secure phụ thuộc `next start`.

### Các điểm builder nhờ đánh giá
- **Open redirect qua `redirect`**: không có. Giá trị là `pathname + search` của chính origin, đã `encodeURIComponent`, và người dùng không chèn được origin ngoài vào. **OK.**
- **Dọn listener / memory leak**: `removeEventListener` dùng cùng tham chiếu `onActivity`, cleanup theo `pathname`. `keepAliveRef` giữ trạng thái `stopped` / throttle qua các lần đổi route. **OK.**
- **"Lần đầu luôn refresh" có giữ phiên sống vô hạn không**: chỉ khi mount hoặc đổi route, và đều do người dùng điều hướng. Throttle vẫn áp dụng sau đó. Tab ẩn thì bỏ qua. Không có timer tự kích. **OK.**
- **`mousemove` và AC "không thao tác không refresh"**: `mousemove` là thao tác thật, không phát khi tab ẩn, và chính Payload cũng dùng sự kiện này. Chấp nhận được.
- **Refresh giữ `_sid` thì logout có thu hồi không**: có. Logout xoá session theo sid, và JWT đã refresh dùng cùng sid nên mất hiệu lực. **OK.**
- **`importMap.js` thêm `S3ClientUploadHandler`**: là file sinh và đúng với plugin storage-s3 đã cấu hình từ task-01. Chấp nhận trong commit này. Commit message nên ghi rõ là regen bổ sung entry còn thiếu từ task-01.
- **`vitest.config.ts`**: thêm `tests/unit/**/*.test.ts` hợp lệ. Xem F2 về ảnh hưởng tải song song.

## Responsive Checklist Gate
N/A. `SessionKeepAlive` không render UI (`<>{children}</>`) và không có CSS/route/layout thay đổi. Layout, Typography, Media, Touch, Viewport: N/A.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: `aislop` không nằm trong verify commands được allow ở `.context/project-config.md` |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`). ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed / không được allow |
| AI-readable | OK: tên rõ, hàm ≤ 50 dòng, file ≤ 300 dòng, comment giải thích WHY. Có 1 indicator (hardcode route, F4), chưa tới ngưỡng 3 |
| ai-friendly-web | N/A: admin nội bộ, không public-facing |
| blitzstrike | skip: không có môi trường pentest được phép. Không có finding STRIKE-validated |

## Doc / decision impact (nhắc close-out)
Task ghi `PERMISSION §7` và `.context/decisions.md` là "pending". Sau khi fix F1, cần ghi lại cơ chế thực tế: keepalive 15 phút cùng đồng bộ timer Payload UI, kèm residual risk "tokenExpiration tuyệt đối ở server".

## Residual risk
- Cờ Secure trên staging phụ thuộc staging chạy `next start` (NODE_ENV=production). Repo chưa có cấu hình deploy để kiểm. Bước DevOps phải bảo đảm không chạy `next dev` sau HTTPS.
- Reviewer không chạy app hay browser. F1 được suy ra từ đọc nguồn `@payloadcms/ui` 3.91.0 (`useAuthSessionTimers.scheduleExpiration` → `onExpire` → `logOutSession`), chưa tái hiện trực tiếp.
- Lần chạy test thứ 2 chỉ thấy tổng 1 failed (output bị cắt đuôi), chưa thấy tên test.

## Verdict
**FAIL**: còn 2 MAJOR (F1 chức năng/AC phiên, F2 verify gate `pnpm test` đỏ). Builder cần sửa F1 và F2. Nên sửa luôn F3–F5 trong cùng round.
