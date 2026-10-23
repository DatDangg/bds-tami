Agent: reviewer

# Review — feature-consult-popup-30s · phase-1-task-01 · round 2

- Review level: **STRICT**
- Reason: re-review M1/m1 của round 1 trên island dùng chung `PublicShell` (mọi trang công khai); task gốc đụng enum DB + migration, API contract lead công khai, Turnstile/consent/rate limit.
- Scope round 2: `src/components/leads/ConsultPopup.tsx`, `src/components/leads/ConsultPopup.test.tsx` (+ xác nhận không regress phần còn lại của task — đã PASS ở round 1).
- Blast radius: mọi trang công khai VI/EN (island trong `PublicShell`), các form trang có `<form>` (hoãn popup), các Radix dialog/popover khác (selector chờ modal).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm test src/components/leads src/endpoints/public/leads.test.ts src/lib/leads tests/integration/leads-migration.test.ts` | PASS — 11 file / 165 test |
| `pnpm test` (toàn bộ) | PASS — 427 file / 4472 test |
| `pnpm exec eslint src/components/leads/ConsultPopup.tsx src/components/leads/ConsultPopup.test.tsx` | PASS — 0 problem (`pnpm lint` toàn repo đã xác minh ở round 1: chỉ lỗi ngoài scope `.local-seed/…`, `tools/task-dashboard/server.mjs`) |
| `pnpm build` | Không chạy lại — diff round 2 chỉ đổi logic client trong island, không đổi import server/dynamic API; tin evidence builder (PASS) |

## Kiểm theo yêu cầu round 2
- **M1 (đã sửa):** `formBeingTypedIn()` nhớ `<form>` lúc tới mốc (`ConsultPopup.tsx:60-64,126`); `isBlocked` giữ chặn khi `form.contains(document.activeElement)` → Tab/focus sang nút gửi / iframe Turnstile cùng form vẫn hoãn (`:80-81`). Chặn thêm `pointerdown` trong form tới `pointerup`/`pointercancel` (capture) cho Safari (`:73-84`). `click` được dispatch cùng chuỗi sự kiện ngay sau `pointerup` nên poll 250ms không chen giữa → không nuốt cú bấm Gửi. OK.
- **m1 (đã sửa):** `OPEN_MODAL_SELECTOR` (`:18`) chờ modal khác đóng. **Không tự khớp chính popup**: lúc `whenUnblocked` chạy popup đang `open=false`, Radix `DialogContent` không `forceMount` nên không có trong DOM; sau khi mở thì `check()` đã `dispose()` trước `onClear()` → poll dừng, không còn query. CookieBanner không có `role="dialog"` (grep `src/components`) → không chặn popup vĩnh viễn ở lần vào đầu. OK.
- **Cleanup:** `dispose()` xoá interval + 3 listener (`:86-91`); effect cleanup gọi `clearTimeout(timer)` + `stopWaiting?.()` khi unmount/đổi `pathname` (`:129-132`). Sau khi hiện, `dispose()` được gọi trước `onClear` (`:94-95`) → poll không chạy vĩnh viễn. Gọi `stopWaiting` lần hai vô hại (clearInterval/removeEventListener idempotent). OK.
- **Test bao M1/m1:** `ConsultPopup.test.tsx:167-229` — focus ra hẳn form mới mở; Tab sang nút gửi cùng form không mở; pointerdown trong form chặn tới pointerup; modal khác (`role=dialog aria-modal=true`) chặn tới khi gỡ. Fake timers có `setInterval/clearInterval` (`:47`). OK.
- Phần còn lại (phiên 30s, shown, Liên hệ vi+en, storage lỗi, a11y Esc/nền/Tab trap/trả focus, EN, gửi `source=popup`): test round 1 vẫn PASS.

## Responsive Checklist Gate
Diff round 2 không đổi markup/CSS của dialog (chỉ logic hẹn giờ). Kết quả round 1 giữ nguyên: Layout OK · Typography OK · Media N/A · Touch target OK (× `size-11`) · Nav/table N/A · Viewport OK (`100dvh`, `overflow-y-auto`) · reduced-motion OK · không `overflow:hidden` OK. Không có browser → xác minh bằng CSS (xem round 1).

## Skill gates
- aislop: skip — không nằm trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured. ESLint trên 2 file: 0 problem.
- ocr: skip, ocr not installed / không trong allowlist.
- AI-readable: OK — `whenUnblocked` 27 dòng, tên rõ, hằng `RECHECK_MS`/`OPEN_MODAL_SELECTOR` đặt tên, comment nêu WHY (Safari, chọn poll thay vì nhiều sự kiện); file 151 dòng. 0 indicator.
- ai-friendly-web: N/A.
- blitzstrike: skip — round 2 chỉ logic client, không đổi surface API.

## Findings

### [MINOR] m3 — Thiếu test cleanup khi đang hoãn
- `src/components/leads/ConsultPopup.test.tsx` — chưa có test: đang bị chặn (focus trong form / modal khác) rồi unmount hoặc đổi `pathname` → interval + listener bị gỡ, không mở popup sau đó. Code đúng theo đọc (`ConsultPopup.tsx:129-132`), nhưng nên khoá bằng test (vd spy `clearInterval` / `removeEventListener`, hoặc unmount rồi gỡ chặn + advance → `sessionStorage` shown vẫn `null`). Không chặn PASS.

### [MINOR] m4 — Test lặp hằng `RECHECK_MS`
- `ConsultPopup.test.tsx:24` khai lại `250` thay vì export từ `ConsultPopup.tsx:19` (như đã làm với `POPUP_DELAY_MS`). Đổi giá trị ở code sẽ làm test lệch âm thầm. Đề xuất export và import. Không chặn PASS.

### [MINOR] m5 — `pointerInForm` có thể kẹt
- `ConsultPopup.tsx:73-79` — nhấn chuột trong form rồi nhả ngoài cửa sổ trình duyệt có thể không nhận `pointerup` → còn chặn tới lần nhả chuột kế tiếp ở bất kỳ đâu. Hệ quả chỉ là hoãn thêm, không sai yêu cầu. Ghi nhận, không cần sửa.

### Đã đóng từ round 1
- M1 — CLOSED. m1 — CLOSED. m2 (doc impact `docs/DESIGN.md`) — vẫn để close-out xử lý (ghi cập nhật hoặc `no doc impact`).

## Residual risk
- Chưa kiểm UI/hành vi trong browser thật (Safari pointer, Turnstile iframe) — dựa trên phân tích thứ tự sự kiện + unit test jsdom.
- Radix Popover (`role="dialog"` + `data-state="open"`) đang mở cũng hoãn popup — chấp nhận được (chỉ chờ tới khi đóng).
- Các điểm residual của round 1 (build không chạy lại, `TURNSTILE_SITE_KEY` nướng lúc build, sessionStorage theo tab) giữ nguyên.

## Verdict
**PASS** — không còn CRITICAL/MAJOR; 3 MINOR (m3–m5) không chặn, đề xuất xử lý tuỳ chọn.
