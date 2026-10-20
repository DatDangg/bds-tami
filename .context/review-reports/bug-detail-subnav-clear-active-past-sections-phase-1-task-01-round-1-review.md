Agent: reviewer

# Review — bug-detail-subnav-clear-active-past-sections · phase-1-task-01 · round 1 (BL-029)

- Review level: **NORMAL**
- Reason: Bug UI client-side trong component dùng chung `DetailSubNav` (2 trang chi tiết). Không đụng auth/tenant/schema/API/data. Diff nhỏ (1 nhánh callback + 1 hằng), có test mới tái hiện được bug. Không có risk đỏ nào nên không cần STRICT; vì là component dùng chung nên không hạ xuống FAST.
- Blast radius: `src/components/detail/DetailSubNav.tsx`, được `DetailLayout.tsx` dùng → `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]`. Chỉ ảnh hưởng trạng thái active (`aria-current` / `bg-primary`) của thanh mục con, cùng effect auto-scroll ngang.
- Scope reviewed: `git diff src/components/detail/DetailSubNav.tsx`, `src/components/detail/DetailSubNav.test.tsx` (file mới), task file. Các file dirty khác trong working tree không thuộc scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/detail src/components/projects/project-detail.test.tsx` | PASS — 4 files, 41 tests (gồm 6 case mới + suite `DetailSubNav` có sẵn trong project-detail.test.tsx) |
| `pnpm typecheck` | PASS (tsc --noEmit sạch) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |

## Root cause
Đúng. Code cũ `if (current && !scrollLocked.current) setActiveId(current);` không có nhánh nào chạy khi tập `visible` rỗng, nên id cũ (mục cuối) vẫn active sau khi đã cuộn qua hết. Kết luận này đọc thẳng từ code là thấy.

## Kiểm fix theo acceptance
- Qua mục cuối thì không mục nào active: OK. Khi tập rỗng, không bị khoá và `lastTarget.getBoundingClientRect().bottom <= OBSERVER_TOP_PX` thì gọi `setActiveId("")`; không còn `aria-current` / `bg-primary` (test case 3).
- Cuộn ngược vào lại thì active lại: OK. Có `current` → nhánh `setActiveId(current)` (test case 4).
- Ở trên mục đầu / khe giữa mục thì giữ nguyên: OK. Mục cuối còn bên dưới → không đổi (test case 5).
- scrollLocked không bị phá: OK. `if (scrollLocked.current) return;` đặt trước cả hai nhánh, giữ nguyên hành vi cũ khi khoá và chặn luôn nhánh xoá (test case 6).
- Effect auto-scroll ngang khi `activeId=""`: OK. Không có `[aria-current]` → `link` null → return sớm (`DetailSubNav.tsx:68-69`).
- Trường hợp desktop có 2 khối cạnh nhau (Pháp lý / Chính sách): chỉ xoá khi tập rỗng, nên khối anh em cao hơn mà còn trong dải sẽ thắng qua nhánh `current`. Không có hồi quy.
- `OBSERVER_TOP_PX` được tách hằng và dùng lại cho `OBSERVER_MARGIN`, không có magic number lặp lại.

## Repro Verification
- Status: **PASS**. Case 3 ("cuộn qua hết mục cuối…") chạy trên code cũ chắc chắn FAIL: code cũ không có đường nào đổi `activeId` khi tập rỗng nên vẫn còn `["Thư viện"]`, đúng như builder ghi. Trên code mới case này PASS và tôi đã chạy lại. Test dùng contract thật của component (callback IntersectionObserver + `getBoundingClientRect` của mục cuối), không mock chính logic đang kiểm.

## Responsive Checklist Gate
Diff không đổi markup/CSS/class (chỉ đổi logic state + comment JSDoc), nên không có thay đổi layout ở 375/768/1280.
- Layout: N/A (không đổi class/CSS)
- Typography/Spacing: N/A
- Media: N/A
- Touch/Interaction: N/A (nút giữ `min-h-11`, không đổi)
- Viewport/A11y: OK. `aria-current` bị gỡ đúng khi không có mục nào đang xem, phù hợp ngữ nghĩa "location".

## Skill gates
- aislop: skip. Reviewer chỉ được chạy verify command trong profile + git; `aislop` không có trong allow-list. Tự đọc diff thì không thấy dấu hiệu slop.
- oxlint (anti-slop): skip. Không xác minh được repo có config oxlint (Glob ở root bị timeout); ESLint (`pnpm lint`) 0 error.
- ocr (open-code-review): skip, ocr không có trong allow-list / chưa xác minh đã cài.
- AI-readable: OK. 0 indicator (tên rõ `OBSERVER_TOP_PX`/`lastTarget`; callback ~15 dòng; comment nói WHY; không magic number mới; không đổi luồng chính kiến trúc).
- ai-friendly-web: N/A (không đổi routing/meta/robots).
- blitzstrike: N/A (không phải STRICT / không có bề mặt bảo mật).

## Findings
- [MINOR] `src/components/detail/DetailSubNav.test.tsx:97-103`: case scrollLocked cũng PASS trên code cũ (code cũ không bao giờ xoá), nên nó chỉ chặn hồi quy về thứ tự kiểm `scrollLocked`, không chứng minh thêm gì. Có thể thêm `vi.advanceTimersByTime(1000)` rồi `report(...)` rỗng để khẳng định sau khi hết khoá thì nhánh xoá chạy lại. Không bắt buộc.
- [MINOR] `src/components/detail/DetailSubNav.tsx:84-86` (hành vi có từ trước, không do diff): khi hết khoá không đánh giá lại trạng thái. Nếu người dùng cuộn qua mục cuối trong 1s khoá thì active vẫn giữ cho đến event observer kế tiếp. Ngoài scope, nếu cần thì đề xuất task riêng.
- [MINOR] Đã ghi ở residual risk của task: mục cuối ngắn hơn dải quan sát có thể thoáng mất active ở khe cuối trang; mới kiểm trên jsdom, chưa kiểm trên trình duyệt thật. Doc impact S03 mục 3 còn chờ spec-publisher.

Không có CRITICAL/MAJOR. Diff gọn, không có thay đổi drive-by.

## Residual risk
- Chưa kiểm trên trình duyệt thật (reviewer không chạy app). Ngưỡng 88px là xấp xỉ cho ≥ lg; < lg lệch khoảng 8px, chỉ ảnh hưởng thời điểm xoá active, không gây lỗi chức năng.

## Verdict
**PASS**
