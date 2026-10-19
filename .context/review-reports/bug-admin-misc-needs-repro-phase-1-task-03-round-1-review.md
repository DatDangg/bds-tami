Agent: reviewer

# Review: bug-admin-misc-needs-repro, phase-1-task-03, round 1

BL-023 #16: toast "Fetching user failed: Failed to fetch" khi chuyển trang nhanh trong admin.

- **Review level:** STRICT
- **Reason:** Provider mới chạy trên mọi trang admin (`admin.components.providers`), nằm cạnh UX auth/session (toast của AuthProvider), và đổi CSS toast toàn cục. Đây là bug task nên phải qua gate repro-closure.
- **Blast radius:** mọi màn `/admin/**` (provider + CSS `html[data-admin-navigating-away] .payload-toast-container`), dashboard `/admin` (Header shortcuts, NavGroupCards, RecentLeads/RecentOwnDocs, StatCards), `TranslationFailedBanner`, `payload.config.ts` providers, `importMap.js`. Không đổi API, schema, auth/token logic.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin/NavigationToastGuard.test.tsx src/components/admin/dashboard` | PASS: 4 files, 40 tests |
| `pnpm lint` | PASS: 0 errors (2 warning có sẵn trong `tools/task-dashboard/server.mjs`, ngoài scope) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (full) | PASS: 276 files, 2884 tests (log WARN của integration là noise có sẵn) |
| Repro trên dev server | Không chạy. Reviewer không có browser, và toast/beforeunload không kiểm được bằng curl |

## Kiểm tra theo yêu cầu STRICT
- **Root cause so với Payload source:** OK. `@payloadcms/ui@3.91.0 dist/providers/Auth/index.js:376-377` catch mọi lỗi của `fetchFullUserResult` rồi gọi `toast.error(\`Fetching user failed: ${e_1.message}\`)`. `fetchUserOnMount` ở dòng 389-395 chạy khi AuthProvider mount. Như vậy mỗi lần điều hướng toàn trang (`<a href>`) là AuthProvider mount lại và gọi `/me`. Nếu request đó bị huỷ thì ra `TypeError: Failed to fetch` và hiện toast. Lập luận này nhất quán.
- **SessionKeepAlive không phải nguồn:** OK. Nhánh `refreshCookieAsync` báo "Refreshing token failed", không phải "Fetching user failed". Task file ghi đúng, và fix không đụng SessionKeepAlive.
- **Các href đổi sang Link đều là đường dẫn admin nội bộ:** OK.
  - `dashboard-data.ts:108,177,195,198` tạo `${adminRoute}/collections|globals/...`.
  - `dashboard-queries.ts:49` tạo `${adminRoute}/collections/<slug>?...`.
  - `RecentLists.tsx:29,38` dùng `${adminRoute}/collections/leads...`.
  - `TranslationFailedBanner.tsx:32,40` dùng `/admin/collections|globals/...`.
  - `next/link` dùng được cả trong server component (dashboard) lẫn client component (banner). `prefetch={false}` theo cùng tiền lệ với `LinkedCell.tsx`.
  - Không đụng `CvDownloadButton`. `LeadExportButton` tạo link `download` (blob), nên không phát `beforeunload`.
- **Unsaved-changes guard của Payload:** OK. `elements/LeaveWithoutSaving/usePreventLeave.js:31-33` gọi `event.preventDefault()` trước rồi mới đặt `event.returnValue = message`, nên `event.defaultPrevented` là true.
  - `setTimeout(0)` đọc `defaultPrevented` sau khi mọi listener `beforeunload` đã chạy, kể cả listener của Payload đăng ký sau provider. Khi người dùng chọn "ở lại" thì cờ được gỡ.
  - Modal "leave without saving" trong app chặn ở click handler (`usePreventLeave.js:119`), không đi qua `beforeunload`, nên không bật cờ.
- **Gỡ cờ:** OK. Cờ được gỡ ở `pageshow`, `pointerdown`, `keydown` và khi unmount. `pageshow` bao trường hợp bfcache restore, vì listener vẫn còn sống.
- **Lỗi mạng thật khi không điều hướng vẫn toast:** OK. Cờ chỉ bật trong `beforeunload`. Có test "không đặt cờ khi chưa có beforeunload".
- **Selector CSS:** OK. `providers/ToastContainer/index.js:24` có `className: "payload-toast-container"` (Sonner Toaster). `dataset.adminNavigatingAway` map đúng sang `data-admin-navigating-away`. `visibility:hidden` chỉ áp dụng khi có cờ.
- **importMap:** OK. Key `/components/admin/NavigationToastGuard#NavigationToastGuard` khớp chuỗi trong `payload.config.ts` và named export. Thứ tự providers là SessionKeepAlive rồi NavigationToastGuard; provider trả nguyên `children`.
- **custom.scss:** OK. Chỉ thêm 1 dòng `@use "../../components/admin/styles/navigation-guard"`. Các dòng `--font-serif` thuộc task 01, không review ở đây.
- **bfcache:** chấp nhận được. Chrome và Safari không loại trang khỏi bfcache vì có listener `beforeunload`. Firefox thì có thể (xem Residual risk).

## Responsive Checklist Gate
Đánh giá N/A cho phần layout. Diff UI chỉ đổi thẻ `<a>` thành `next/link`, và Link vẫn render `<a>` với cùng class/markup, nên layout và touch target không đổi. CSS mới chỉ ẩn toast khi đang rời trang và không ảnh hưởng layout ở 375/768/1280.
- Layout / Typography / Media / Touch / Viewport: N/A, vì không đổi kích thước, cột, font, media hay chiều cao.
- A11y: OK. Markup `<a>` giữ nguyên nên focus và keyboard không đổi. `visibility:hidden` cũng gỡ toast khỏi accessibility tree trong lúc trang sắp đóng, điều này chấp nhận được.

## Skill gates
- aislop: skip, chưa cài (`aislop` không có trong PATH).
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc*`). ESLint PASS.
- ocr (open-code-review): skip, chưa cài.
- AI-readable: OK, 0 indicator. Provider 41 dòng, hàm ngắn, tên rõ. Comment giải thích WHY (thứ tự listener, setTimeout).
- ai-friendly-web: N/A, đây là admin nội bộ.
- blitzstrike: N/A. Không có auth/input/API mới, và chưa cài.

## Findings

### [MAJOR] 1. Thiếu `Repro Verification` cho bug task, nên chưa chứng minh được bug đã hết
- Vị trí: `tasks/bug-admin-misc-needs-repro/phase-1-task-03.md`.
- Hiện trạng:
  - Task file không có block `Repro Verification`. Block này bắt buộc với bug task theo `.agent/workflows/state-commit.md:82`, phải có status và evidence.
  - Mục "Repro / evidence" dòng 18 tự ghi rằng toast gốc chưa từng được chụp lại.
  - Mục Acceptance (dòng 27-29) còn chưa tick.
  - "Verification summary" chỉ có unit test (cơ chế cờ, href) và lint/typecheck. Không có lần chạy lại repro sau fix.
- Unit test hiện có không chứng minh được hành vi end-to-end:
  - Test href pass cả trước lẫn sau fix, vì Link vẫn render `<a href>`.
  - Không có evidence nào cho thấy click thẻ dashboard không còn tải lại toàn trang (không có request `/api/staff/me` mới, AuthProvider không mount lại).
- Theo gate repro-closure, trường hợp này phải FAIL (unverifiable).
- Fix:
  1. Thêm `## Repro Verification` với status `PASS` và evidence sau fix. Có thể chạy lại đúng cách đo đã dùng ở dòng 14-16 (MutationObserver `[data-sonner-toast]`, log network/nav), lần này click các link dashboard (Header shortcut, NavGroupCards, StatCards, RecentLists, TranslationFailedBanner) cách nhau khoảng 300ms. Ghi lại 3 điều: không có document navigation, không có `GET /api/staff/me` mới khi click, 0 toast.
  2. Chạy thêm một vòng F5 hoặc `location.href` khi `/me` đang treo. Xác nhận `html[data-admin-navigating-away]` được bật trước khi reject và không có toast nhìn thấy.
  3. Tick các mục Acceptance tương ứng.
- Nếu muốn có evidence tự động, có thể thêm test component mock `next/link` (như `LinkedCell.test.tsx:12`) để assert từng link dashboard/banner thực sự dùng Link.

### [MINOR] 2. Cờ có thể kẹt nếu `beforeunload` không dẫn tới unload thật
- Vị trí: `src/components/admin/NavigationToastGuard.tsx:18-30`.
- Các trường hợp: link `mailto:`/`tel:` (Chrome có phát `beforeunload`), hoặc response `Content-Disposition: attachment` mà link không có thuộc tính `download`.
- Khi đó cờ ở lại cho tới lần `pointerdown`/`keydown` kế tiếp, và toast thật trong khoảng đó bị ẩn. Hiện chưa thấy link nào như vậy trong admin của dự án, nên mức độ thấp.
- Fix gợi ý: thêm một timeout an toàn gỡ cờ sau khoảng 2-3 giây nếu trang vẫn còn sống, hoặc gỡ cờ ở `focus`/`visibilitychange` (khi `visible`).

### [MINOR] 3. Test `defaultPrevented` chưa tái hiện đúng thứ tự listener
- Vị trí: `src/components/admin/NavigationToastGuard.test.tsx:9-13,44-49`.
- Test gọi `preventDefault()` trước khi dispatch, nên không kiểm được kịch bản thật là một listener khác (của Payload) đăng ký sau và gọi `preventDefault`. Đây chính là lý do code dùng `setTimeout(0)`.
- Fix: trong test, đăng ký thêm `window.addEventListener("beforeunload", e => e.preventDefault())` sau khi render, dispatch một event thường, chạy `runAllTimers`, rồi expect `flagged()` là false. Nhớ gỡ listener đó sau test.

### [MINOR] 4. Dùng `next/link` thay vì `Link` của `@payloadcms/ui`
- Vị trí: `DashboardHeader.tsx:34`, `NavGroupCards.tsx:19`, `RecentLists.tsx:29,38,67`, `StatCards.tsx:32`, `TranslationFailedBanner.tsx:78`.
- `Link` của `@payloadcms/ui` gắn với RouteTransition (thanh tiến trình). `next/link` thì không, nên điều hướng từ dashboard sẽ không có progress bar như sidebar.
- Đây là lựa chọn nhất quán với `LinkedCell.tsx` nên chỉ ghi nhận, không bắt buộc sửa.

## Residual risk
- Firefox có thể loại trang admin khỏi bfcache khi có listener `beforeunload`. Ảnh hưởng thấp vì đây là admin nội bộ, và response admin có thể vốn đã `no-store`. Có thể giảm bằng cách chỉ đăng ký listener khi cần, nhưng sẽ phức tạp hơn và không bắt buộc.
- Không xác minh hành vi trên browser (reviewer không có browser). Phần end-to-end phụ thuộc vào evidence của finding 1.

## Verdict
❌ **FAIL**. Code đúng và không có defect CRITICAL. Lý do FAIL là bug task chưa có `Repro Verification` PASS kèm evidence kiểm chứng được (finding 1, MAJOR), theo gate repro-closure. Builder chỉ cần bổ sung evidence repro sau fix; nên xử lý luôn MINOR 2 và 3 trong cùng vòng.
