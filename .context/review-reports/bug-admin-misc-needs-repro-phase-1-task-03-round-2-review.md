Agent: reviewer

# Review: bug-admin-misc-needs-repro, phase-1-task-03, round 2

BL-023 #16: toast "Fetching user failed: Failed to fetch" khi chuyển trang nhanh trong admin.

- **Review level:** STRICT
- **Reason:** Provider dùng chung chạy trên mọi trang `/admin/**`, nằm cạnh UX auth/session (toast của AuthProvider), có CSS toast toàn cục. Là bug task nên phải qua gate repro-closure.
- **Blast radius:**
  - Mọi màn `/admin/**`: provider `NavigationToastGuard` và CSS `html[data-admin-navigating-away] .payload-toast-container`.
  - Dashboard `/admin`: DashboardHeader, NavGroupCards, RecentLists, StatCards.
  - `TranslationFailedBanner`.
  - `payload.config.ts` (providers) và `importMap.js`.
  - Không đổi API, schema hay logic auth/token.
- **Scope round 2:** so với round 1 chỉ đổi `NavigationToastGuard.tsx` (thêm listener `focus`), `NavigationToastGuard.test.tsx` (thêm test thứ tự listener và test `focus`), file mới `dashboard/DashboardLinks.test.tsx`, và task file (thêm `## Repro Verification`). Phần còn lại (banner, các component dashboard, config, importMap, scss) giống round 1. `next.config.ts` và `src/payload-types.ts` không thuộc task này, không review.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin/NavigationToastGuard.test.tsx src/components/admin/dashboard` | PASS: 5 files, 46 tests |
| `pnpm test` (full) | PASS: 277 files, 2890 tests, exit 0 |
| `pnpm lint` | PASS: 0 errors. 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, ngoài scope |
| `pnpm typecheck` | PASS (exit 0) |
| Repro trên browser | Reviewer không chạy (không có browser, ngoài quyền verify). Đánh giá dựa trên evidence trong task file, xem finding 1 |

## Đối chiếu các finding của round 1

### 1. [MAJOR] Thiếu Repro Verification: ĐÃ XỬ LÝ
`tasks/bug-admin-misc-needs-repro/phase-1-task-03.md:40-41` đã có `Status: PASS` kèm evidence sau fix:
- (a) Click stat card, sau 400ms click link Lead, sau 400ms nữa `history.back()`. Window marker vẫn còn, tức là không có full reload và AuthProvider không mount lại. Không có `/api/staff/me` mới, 0 toast.
- (b) Đối chứng trước fix: mỗi click là một full reload (`GET /api/staff/me` cộng khoảng 15 request mount).
- (c) Guard: `beforeunload` đặt `data-admin-navigating-away`, `pointerdown` gỡ cờ.
- (d) Điều hướng sidebar 3 vòng cách 300ms: 0 toast.

Window marker là cách đo hợp lệ để chứng minh "không điều hướng toàn trang", và đó đúng là root cause chính. Giới hạn đã được ghi rõ: kịch bản F5 khi `/me` đang treo không tái hiện xác định được. Nhánh này có unit test và cơ chế CSS bù. Ngoài ra `DashboardLinks.test.tsx` là bằng chứng tự động rằng các link dashboard đi qua `next/link` (mock gắn `data-next-link`): nếu ai đó đổi lại `<a>` thì test fail. Acceptance đã được tick.

### 2. [MINOR] Cờ kẹt khi `beforeunload` không dẫn tới unload: ĐÃ XỬ LÝ
`NavigationToastGuard.tsx:31-34` thêm `focus` để gỡ cờ. Lập luận trong comment là đúng:
- **Không dùng timer:** khi server chậm, trang cũ có thể sống thêm vài giây và fetch chỉ reject lúc commit. Timer sẽ gỡ cờ quá sớm và toast giả quay lại.
- **Không dùng `visibilitychange`:** event này cũng bắn trong lúc unload.

Đã kiểm thứ tự event ở các đường điều hướng phổ biến:
- Click link: window đã có focus nên không bắn `focus`.
- F5 / Ctrl+R: `keydown` chạy trước `beforeunload`, nên cờ được đặt sau khi gỡ.
- Nút back chuột (mouse 4): `pointerdown` chạy trước `beforeunload`.
- mailto/tel: khi quay lại tab sẽ bắn `focus` và gỡ cờ.

Không thấy đường nào gỡ cờ sai thời điểm (xem Residual risk về omnibox).

### 3. [MINOR] Test `defaultPrevented` chưa đúng thứ tự listener: ĐÃ XỬ LÝ
Test `NavigationToastGuard.test.tsx:51-63` đăng ký listener `preventDefault` sau khi render provider, rồi dispatch event thường. Test kiểm hai mốc: cờ là true ngay sau dispatch, và false sau `runAllTimers`. Listener được gỡ trong `finally`. Như vậy test tái hiện đúng lý do code dùng `setTimeout(0)`.

### 4. [MINOR, optional] Test mock Link: ĐÃ THÊM
`DashboardLinks.test.tsx` phủ StatCards, NavGroupCards, DashboardHeader và RecentLeadsCard. Riêng `TranslationFailedBanner` chưa có test tương ứng, xem finding mới A.

## Kiểm tra regression
- Logic provider chỉ thêm 1 listener `focus`, và cleanup gỡ đúng listener đó (`:36`). Không có leak.
- Các phần đã PASS ở round 1 (root cause, href nội bộ, selector CSS, khoá importMap, thứ tự providers, guard "unsaved" của Payload) không đổi.
- Full suite xanh.

## Responsive Checklist Gate
Diff UI chỉ đổi `<a>` thành `next/link` (vẫn render `<a>` với cùng class/markup) và thêm 1 rule CSS ẩn toast khi có cờ. Không đổi layout, kích thước hay font.

| Mục | Kết quả | Ghi chú |
|---|---|---|
| Layout | N/A | Không đổi cột, container hay width ở 375/768/1280 |
| Typography/Spacing | N/A | Không đổi font-size hay spacing |
| Media | N/A | Không đổi ảnh/video |
| Touch/Interaction | OK | Markup `<a>` giữ nguyên nên touch target không đổi |
| Viewport/A11y | OK | Không dùng `100vh`, không có animation mới. `visibility:hidden` chỉ áp dụng khi trang đang rời đi, không dùng `overflow:hidden` để che lỗi |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, chưa cài |
| oxlint (anti-slop) | skip, chưa cấu hình oxlint. ESLint PASS |
| ocr (open-code-review) | skip, chưa cài |
| AI-readable | OK, 0 indicator. Provider 46 dòng, tên rõ, comment giải thích WHY |
| ai-friendly-web | N/A, admin nội bộ |
| blitzstrike | N/A. Không có auth/input/API mới, và chưa cài |

## Findings

### [MINOR] A. `TranslationFailedBanner` chưa có test assert dùng `next/link`
- Vị trí: `src/components/admin/TranslationFailedBanner.tsx:78`. `DashboardLinks.test.tsx` không phủ component này.
- Code đúng: diff cho thấy đã dùng `Link prefetch={false}`. Chỉ là chưa có guard chống regression.
- Fix (không bắt buộc): thêm 1 case dùng cùng mock `next/link`, mock fetch đếm để render được danh sách, rồi assert `data-next-link`.

### [MINOR] B. Mock `@payloadcms/ui` có `Link: () => null`
- Vị trí: `DashboardLinks.test.tsx:13`.
- Nếu sau này có component dashboard dùng `Link` của Payload, test sẽ render rỗng và `getByRole` fail, tức là fail rõ ràng chứ không phải false-pass. Chỉ ghi nhận, không cần sửa.

## Residual risk
- **Gõ URL ở omnibox:** nếu một trình duyệt trả focus về trang cũ trước khi commit trang mới, `focus` có thể gỡ cờ sớm. Hậu quả chỉ là toast giả có thể lộ ra như trước fix, không mất chức năng.
- **Chọn "Rời trang" trong hộp thoại "chưa lưu":** cờ bị gỡ vì `defaultPrevented` là true, nên toast giả có thể chớp lên. Hạn chế này có từ round 1, ảnh hưởng thấp.
- **Firefox bfcache với listener `beforeunload`:** như round 1.
- **F5 khi `/me` đang treo:** chưa có evidence browser. Phần này dựa vào unit test và cơ chế CSS.

## Verdict
✅ **PASS**. Finding MAJOR của round 1 đã có `Repro Verification` PASS kèm evidence kiểm chứng được cho root cause chính. MINOR 2 và 3 đã sửa đúng, test Link tuỳ chọn cũng đã thêm. Không có regression: 46 test targeted, full suite 2890 test, lint và typecheck đều PASS. Chỉ còn 2 MINOR không chặn.
