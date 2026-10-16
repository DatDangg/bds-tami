Agent: reviewer

# Review: build/tami-website layer-2-task-04 (round 3)

- Task: `tasks/tami-website/layer-2-task-04.md`. Phiên đăng nhập hết hạn sau 8 giờ không hoạt động (làm mới token).
- Round trước:
  - Round 1: FAIL (F1, F2 mức MAJOR).
  - Round 2: FAIL (N1 mức MAJOR về đa tab; N2, N3, N4 mức MINOR).
  - User đã cho phép vượt quá 2 vòng.
- Scope: toàn bộ diff chưa commit so với HEAD `337e52e`. `.context/*` nằm ngoài scope.
  - File sửa: `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/Staff.ts`, `src/lib/lint-rules.test.ts`, `src/payload.config.ts`, `vitest.config.ts`.
  - File mới: `src/components/admin/SessionKeepAlive.tsx`, `src/components/admin/SessionKeepAlive.test.tsx`, `src/lib/session/keepalive.ts`, `tests/unit/session-keepalive.test.ts`, `tests/integration/session-refresh.test.ts`.

## Review level
**STRICT**

## Reason
Task đụng tới security/session/token: thời hạn JWT, cờ cookie, refresh-token, xử lý 401/403 và đồng bộ phiên giữa nhiều tab qua `AuthProvider` của Payload UI. Task cũng gắn một provider dùng chung cho mọi màn admin và thêm một dependency trực tiếp (lockfile đổi).

## Blast radius
- Mọi màn Payload admin: `SessionKeepAlive` nằm trong `admin.components.providers` và gọi `useAuth().refreshCookieAsync()`, tức đi vào `refreshSession` → `setLocalSession` → `sessionTimers.setExpiration` → `tabSessionSync.broadcast(REFRESHED)`.
- Hành vi nhiều tab: BroadcastChannel, hoặc localStorage fallback kèm `reconcileSession`.
- Collection `staff`: `auth.tokenExpiration`, `auth.cookies`. Không đụng các hook audit hay last-admin guard.
- Dependency trực tiếp `@payloadcms/ui@3.91.0`.
- Vitest: project `unit` có thêm `tests/unit/**`.
- `importMap.js` (file sinh).

## Verify commands + result
| Command (`.context/project-config.md`) | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (exit 0, "Done in 4.2s") |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test`, lần 1 | **exit 1**: 381 passed / 5 skipped (386). Không có test nào fail trong summary, nghĩa là một file có `beforeAll` lỗi nên 5 test bị skip. Xem M1 |
| `pnpm test`, lần 2 | PASS: 37 files / 386 tests |
| `pnpm test`, lần 3 | PASS: 37 files / 386 tests |
| `pnpm build` | PASS (exit 0). Route `/admin/[[...segments]]` build OK |

## Kiểm chứng fix round 2 (đọc nguồn `@payloadcms/ui` 3.91.0 đã cài)

### N1 (MAJOR, đa tab): CLOSED

**1. Có broadcast sang tab khác.**
- `SessionKeepAlive.tsx:23,38`: keepalive gọi `refreshCookieAsync`.
- Trong `Auth/index.js`, `refreshCookieAsync` gọi `refreshSession({isActivityRefresh:false})`.
- Khi nhận 200, `refreshSession` gọi `setLocalSession(json)`, sau đó `tabSessionSync.broadcast({type: REFRESHED, refreshStartedAt, session: json})`.

**2. Tab B thật sự dời mốc hết hạn.**
- `tabSessionSync/index.js`: `handleChannelMessage`, case `REFRESHED`, gọi `onRefreshedSession` rồi `onSessionRefreshed(message.session)`.
- Trong `Auth/index.js`, `onSessionRefreshed` kiểm tra `!authRequests.isLoggingOut()`, gọi `discardPendingResults()` rồi `setLocalSession(session)`.
- `setLocalSession` gọi `sessionTimers.setExpiration(exp*1000)`, nên lịch reminder và force-logout của tab B được lập lại theo `exp` mới.
- Thứ tự lifecycle (`compareLifecycleOrders`) đảm bảo event cũ không ghi đè event mới.
- Khi không có BroadcastChannel, tab B dùng storage notification rồi `reconcileSession` (fetch user và `exp`).
- Kết luận: kịch bản round 2 (tab B để yên tới 16:00 rồi logout làm thu hồi sid của tab A) không còn xảy ra.

**3. Bỏ `?refresh` không gây hành vi phụ.**
- Handler phía server (`payload/dist/auth/endpoints/refresh.js`) không đọc query.
- `isActivityRefresh` chỉ ảnh hưởng URL.
- Đường này không có `openModal(stayLoggedInModalSlug)`. Modal chỉ mở trong `onSessionReminder`.

**4. Không có điều kiện nội bộ nào làm keepalive vô hiệu.**
- `authRequests.refresh` (`authSessionRequests.js`) chỉ trả `null` khi `isLoggingOut`, và gộp promise khi đã có refresh cùng generation đang chạy.
- Không có điều kiện kiểu "chỉ refresh khi gần hết hạn".
- `isResultStale` và `acceptResult` chỉ loại kết quả cũ sau khi session đổi.

### 401/403 và lỗi mạng
- **401/403**: khi `handledUser` khác null, Payload gọi `invalidateWhenIdle` → broadcast `EXPIRED` → `setLocalSession(null)` → `redirectToInactivityRoute()`.
- **Không có vòng lặp**:
  - `/admin/logout-inactivity` thuộc `ANONYMOUS_ROUTE_KEYS`, nên keepalive không chạy ở đó.
  - `LogoutClient` (`@payloadcms/next/dist/views/Logout/LogoutClient.js`) ở chế độ inactivity khi đã mất user chỉ hiển thị thông báo và nút tới `/login?redirect=…`. Không tự refresh.
  - Throttle 15 phút tính cả lần lỗi.
- **Khi chưa có user** (`handledUser` null): không invalidate, trả `null`. Không redirect, không lặp.
- **Lỗi mạng**: hiện `toast.error` và trả `null`, không redirect. `refreshSession` có try/catch nên promise không reject; `void notifyActivity()` không tạo unhandled rejection.
- **AC4**: đạt theo cơ chế native của Payload. Người dùng bị chuyển tới màn inactivity, từ đó tới màn login. Xem M2.

### N2: CLOSED
- `SessionKeepAlive.tsx:13` dùng 7 key tường minh.
- Test `SessionKeepAlive.test.tsx` phủ cả 7 màn không có phiên, và assert `/admin/account`, `/admin/browse-by-folder/x` **có** refresh.

### N3: CLOSED
- Guard `isLoggingOut` nằm trong `authRequests.refresh`.
- Guard `isResultStale` / `acceptResult` nằm trong `refreshSession`.
- Không còn `setUser` ngoài các guard này.

### N4: CLOSED
- Không còn cast, không còn type `RefreshedSession` / `RefreshResult`.
- `keepalive.ts` đã sạch code chết. Chỉ còn 2 hằng số và `createKeepAlive` (41 dòng).

### Giữ nguyên fix F1–F5 round 1
- `Staff.ts`:
  - `tokenExpiration: SESSION_TTL_SECONDS` (28800).
  - `cookies: {sameSite:"Lax", secure: NODE_ENV==="production"}`.
  - Payload cố định HttpOnly.
- `lint-rules.test.ts`: timeout 30s.
- Integration `session-refresh.test.ts` assert:
  - `exp - iat = 28800`;
  - refresh trả `exp` mới lớn hơn `exp` cũ;
  - `Set-Cookie` có HttpOnly và SameSite=Lax;
  - thiếu token thì trả 401/403.
- Dependency `@payloadcms/ui@3.91.0` cùng version với các `@payloadcms/*` khác. `pnpm install --frozen-lockfile` khớp lockfile.

### Không regress audit / last-admin guard
- Diff trong `Staff.ts` chỉ thêm 1 import, 3 dòng `auth` và comment.
- Các test audit-staff và access đều PASS ở lần 2 và lần 3.

### Acceptance Criteria
| AC | Kết quả |
|---|---|
| Hết hạn 8h nếu không hoạt động | OK. `tokenExpiration` 8h là mốc tuyệt đối. Keepalive chỉ refresh khi có activity, tab đang hiển thị, và cách lần trước ≥ 15 phút |
| Có hoạt động thì refresh tối đa 1 lần/15 phút, token mới +8h | OK. Có unit test (fake timers) và integration test (`exp` mới, TTL 8h) |
| Tab ẩn hoặc không thao tác thì không refresh | OK. Có unit test và component test |
| 401 thì về màn đăng nhập, không lặp | OK, đi qua màn inactivity rồi tới login. Không lặp (M2) |
| Cookie HttpOnly, Secure (prod), SameSite=Lax | OK. Có integration test |

## Findings

### [MINOR] M1: `pnpm test` flaky 1/3 lần (một file integration lỗi ở `beforeAll`, 5 test bị skip, exit 1)
- **Hiện tượng**: lần 1 cho 381 passed / 5 skipped và exit 1. Lần 2 và lần 3 đều 386/386 xanh.
- **Chưa xác định được file nào lỗi**: có 2 file đúng 5 test là `tests/integration/jobs-email.test.ts` (đã ghi flaky từ trước, round 2 residual) và `tests/integration/session-refresh.test.ts` (file mới của task). Reviewer không lưu log lần 1 nên không quy trách nhiệm chắc chắn được.
- **Vì sao không chặn PASS**:
  - Mẫu `getPayload` song song trên cùng DB test đã có sẵn ở các file integration khác.
  - Lỗi không tái hiện ở 2 lần chạy sau.
  - Builder báo 2/2 lần xanh.
- **Đề xuất (task riêng)**:
  - `afterAll` của `session-refresh.test.ts:41-44` nên guard `if (staffId)` để lỗi `beforeAll` không sinh thêm lỗi thứ cấp.
  - Cân nhắc `fileParallelism: false` hoặc tách schema DB cho từng file trong project integration.

### [MINOR] M2: AC4 đạt qua màn inactivity chứ không về thẳng login
- 401/403 đưa người dùng tới `/admin/logout-inactivity`. Đây là màn native của Payload: có thông báo và nút "đăng nhập lại" dẫn tới `/admin/login?redirect=…`.
- Hành vi này hợp lý và đúng khuyến nghị round 2.
- Khi close-out, cần ghi rõ cơ chế này vào PERMISSION §7 và `.context/decisions.md` (Doc impact đang `pending`). Không cần sửa code.

## Responsive Checklist Gate
N/A. `SessionKeepAlive` chỉ render `<>{children}</>`. Diff không có route, layout, CSS hay markup mới. Các mục Layout, Typography/Spacing, Media, Touch/Interaction, Viewport/A11y đều N/A.

## Skill gates
| Gate | Result |
|---|---|
| aislop | skip: không nằm trong verify commands được allow |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed / không được allow |
| AI-readable | OK. Tên rõ ràng. `SessionKeepAlive` có 34 dòng thân hàm, `createKeepAlive` 20 dòng. Hằng số có tên (`REFRESH_INTERVAL_MS`, `SESSION_TTL_SECONDS`). Comment giải thích lý do (WHY). Indirection ≤ 2 bước. 0 indicator |
| ai-friendly-web | N/A: admin nội bộ |
| blitzstrike | skip: không có môi trường pentest được phép. Không có finding STRIKE-validated |

## Residual risk
- Reviewer không chạy browser.
  - Đồng bộ đa tab (N1) và guard logout (N3) được kiểm chứng bằng cách đọc nguồn `@payloadcms/ui` 3.91.0 (`Auth/index.js`, `authSessionRequests.js`, `tabSessionSync/index.js`, `useTabSessionSync.js`), chưa tái hiện E2E.
  - Component test mock `useAuth`, nên chỉ chứng minh keepalive gọi `refreshCookieAsync`, không chứng minh broadcast.
- Integration DB flaky (M1).
- Cờ Secure trên staging phụ thuộc vào việc chạy với `NODE_ENV=production`.
- Mỗi tab mới, khi đang hiển thị, sẽ refresh một lần lúc mount (`lastAttemptAt = -∞`). Đây là 1 request mỗi lần mở tab, chấp nhận được.
- Close-out còn treo: Doc impact (PERMISSION §7) và `.context/decisions.md` đang `pending`. Cần reconcile trước khi commit.

## Verdict
**PASS**: không còn CRITICAL hoặc MAJOR. N1 (MAJOR) đã đóng nhờ `refreshCookieAsync` (refresh, `setLocalSession` và broadcast REFRESHED được tab khác áp `setExpiration`). N2, N3, N4 đã đóng. F1–F5 giữ nguyên. lint, typecheck, build xanh; test xanh 2/3 lần, lần lỗi là integration DB flaky chưa quy được cho task này (M1). Hai finding MINOR (M1, M2) xử lý ở close-out hoặc task riêng.
