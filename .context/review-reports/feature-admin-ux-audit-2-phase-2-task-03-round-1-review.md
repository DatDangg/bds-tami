Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-2-task-03 · round 1

- Task: `tasks/feature-admin-ux-audit-2/phase-2-task-03.md` (BL-051 GĐ2 A8 + carry-over Media grid từ P2-T02)
- Diff reviewed (uncommitted): `src/components/admin/dashboard/{DashboardIcons,QuickActions,WebsiteShortcuts}.tsx`, `src/components/admin/styles/{_dashboard,_media-grid}.scss`

## Review level
**NORMAL**

## Reason
Chỉ markup/CSS màn Tổng quan tuỳ biến + CSS danh sách Media; không đụng schema/DB/access/API/auth. Quy tắc admin-only (`hideFromNonAdmin` trong `dashboard-data.ts:200`) không nằm trong diff. Component dashboard không phải shared ngoài màn Tổng quan.

## Blast radius
- Màn Tổng quan admin: hàng thẻ thao tác nhanh (`.tami-dash-actions` đổi flex → grid), menu "Tạo loại khác", mục "Sửa website".
- `DashboardIcon` thêm tên `chevron` (type union mở rộng, không phá caller cũ).
- Danh sách collection `media` (không áp trong list drawer): bố cục thẻ, focus của link thẻ, ô bị ẩn.
- Không đổi schema / `payload-types.ts` / access / API / migration (xác nhận qua `git diff --stat`).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 errors, 2 warnings cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm test` (full, sau sửa SCSS cuối) | PASS — 359 files / 3620 tests |

Lưu ý: số test 3620 **bằng đúng** số builder ghi trước đó và `DashboardParts.test.tsx` **không có trong diff** → không có test mới nào được thêm (xem F1).

## Responsive Checklist Gate (diff đụng UI)
Không có browser; xác minh bằng CSS math + đối chiếu browser evidence trong task file.

| Mục | KQ | Bằng chứng |
|---|---|---|
| Không horizontal scroll 375/768/1280 | OK | `.tami-dash-actions` `minmax(240px,1fr)` → 1 cột ở 375 (content ~335–343px > 240), `.tami-dash-site__grid` `minmax(200px,1fr)` → 1 cột ở 375; 768 → 2–3 cột; 1280 → 4/5 cột. Media `minmax(150px,1fr)` → 2 cột 375. Builder evidence: scrollWidth = viewport ở 375. |
| Grid auto-fit/minmax, không cột cố định | OK | Cả 3 lưới dùng `repeat(auto-fill, minmax(...))`. (Gợi ý độ bền: F3) |
| Container không fixed px | OK | Không có width px trên container; `min-width: 220px` menu có sẵn từ trước, mobile đặt `left:0`. |
| Typography rem / clamp | N/A (theo convention) | Toàn bộ admin SCSS dùng px theo token admin hiện có; code mới nhất quán với file. Không tính FAIL cho task này — ngoài scope. |
| Media max-width / aspect-ratio | OK | `.thumbnail` `aspect-ratio: 4/3`, img `object-fit: contain` (không đổi trong diff). |
| Touch target ≥ 44px | OK | `.tami-dash-action`/summary `min-height: 64px`; `.tami-dash-site__card` `min-height: 56px` (mobile rule 44px); checkbox Media 44×44; menu link 44px mobile. |
| Nav trên mobile không tràn | OK | Lưới 1 cột ở 375; tên thẻ `overflow-wrap: anywhere`, `min-width: 0`. |
| Table mobile | OK | Media list là lưới thẻ (card layout). |
| 100vh | N/A | Không dùng. |
| prefers-reduced-motion | **FAIL** | Diff thêm 2 transition mới (`_dashboard.scss:154` chevron `transform/color 0.15s` + `translateX(2px)` khi hover; `_dashboard.scss:206` chevron rotate) — đây là 2 transition duy nhất trong admin SCSS và không có `@media (prefers-reduced-motion)` nào trong `src/components/admin/styles`. Xem F2. |
| Không che lỗi bằng overflow:hidden | OK | `overflow: hidden` trên `tbody tr` (bo góc thẻ) có sẵn từ P2-T02; filename dùng ellipsis có chủ đích. |

## Skill gates
| Gate | KQ | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` → không có |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc.json`/`oxlint.json`; `pnpm lint` (eslint) 0 error |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` → không có |
| AI-readable | OK | Tên class BEM rõ, comment nêu WHY (subgrid / display: contents mất focus), không magic number lạ, không indirection; 1 indicator nhẹ (style trùng lặp, F4) < 3 |
| ai-friendly-web | N/A | Màn admin nội bộ |
| blitzstrike | N/A | Không phải task STRICT/nhạy cảm |
| Raw color gate | OK | Mọi màu trong diff là `var(--admin-*)`; các token dùng mới (`--admin-surface-hover`, `--admin-shadow-sm`, `--admin-focus`, `--admin-accent-soft-text`, `--admin-radius-m/l`) tồn tại trong `_tokens.scss` |

## Kiểm tra theo yêu cầu coordinator
- **Admin-only "Sửa website"**: không đổi — `buildWebsiteShortcuts` vẫn `if (hideFromNonAdmin(...)) return []` (`dashboard-data.ts:200`), component vẫn `return null` khi rỗng. OK.
- **`<details>/<summary>` semantics**: summary giữ vai trò button gốc + trạng thái expanded native; tên đọc = "Tạo loại khác" (icon/chevron `aria-hidden` qua `DashboardIcon`); Enter/Space mở được; menu `ul aria-label`. Esc không đóng — hành vi cũ, không hồi quy. OK.
- **Heading hierarchy**: `h1` (DashboardHeader) → `h2` "Sửa website" ngang hàng `h2` của RecentLists. OK. `nav aria-label` trùng text h2 — chấp nhận được (có thể dùng `aria-labelledby` trỏ h2, không bắt buộc).
- **Focus visible**: `.tami-dash-site__card:focus-visible` + summary `:focus-visible` dùng `--admin-focus`; Media link focus ring vẽ trên `::after`. OK.
- **Media link Tab được + tên đọc**: `a` hết `display: contents`, là grid box thật → focusable; tên đọc = alt ảnh thumbnail + tên tệp (nội dung `.file`). OK.
- **Hidden cells rule**: `tbody tr td:not(.cell-_select, .cell-filename, .cell-alt, .cell-mimeType)` — specificity (3 class + 3 type) thắng `tbody tr td { display:block }` (2 class + 3 type). Đúng; ô người dùng bật thêm cũng ẩn. OK.
- **Subgrid fallback**: subgrid baseline từ 2023 (Chrome 117/Safari 16/Firefox 71); fallback chỉ lệch hàng, thẻ vẫn bấm được qua overlay. Chấp nhận cho admin nội bộ (residual).
- **GAP-A11Y-1**: xác nhận — `node_modules/@payloadcms/ui/dist/fields/Checkbox/Input.js:64-65` hardcode `"aria-label": ""` + `"aria-labelledby": name`. Gap hợp lý.

## Findings

### [MAJOR] F1 — Verification summary khai có test mới nhưng test không tồn tại; markup đổi không có test hồi quy
- `tasks/feature-admin-ux-audit-2/phase-2-task-03.md:39` ghi "`DashboardParts.test.tsx` thêm ca 'Sửa website là thẻ điều hướng' (heading, class card, icon+chevron, grid)". Thực tế `git status`/`git diff` không có `DashboardParts.test.tsx`; file chỉ còn ca cũ `DashboardParts.test.tsx:76` "hàng Sửa website liệt kê globals"; tổng test 3620 không đổi.
- Hệ quả: evidence sai (false-confidence) + Scope mục 3 chưa làm; markup mới (h2, `.tami-dash-site__card`, chevron trong summary) không được khoá.
- Fix: thêm thật ca test trong `src/components/admin/dashboard/DashboardParts.test.tsx`: `getByRole("heading", { level: 2, name: "Sửa website" })`, mỗi link có class `tami-dash-site__card` và href đúng; summary "Tạo loại khác" có `getByText` 1 khớp + có `.tami-dash-create__chevron`; WebsiteShortcuts rỗng → không render. Sửa lại Verification summary cho đúng số test.

### [MINOR — gate-blocking] F2 — Transition mới không tôn trọng prefers-reduced-motion
- `src/components/admin/styles/_dashboard.scss:154` và `:206`.
- Fix: bọc `transition` trong `@media (prefers-reduced-motion: no-preference) { ... }` hoặc thêm khối `@media (prefers-reduced-motion: reduce) { .tami-dash-site__chevron, .tami-dash-create__chevron { transition: none; } }` (có thể bỏ `translateX(2px)` khi reduce).

### [MINOR] F3 — `minmax(240px, 1fr)` / `minmax(200px, 1fr)` không chặn min theo container
- `_dashboard.scss:39`, `_dashboard.scss` `&__grid`. Ở 375 OK, nhưng container < 240px (zoom 200% trên 375, sidebar mở) sẽ tràn ngang.
- Fix: `minmax(min(240px, 100%), 1fr)` / `minmax(min(200px, 100%), 1fr)`.

### [MINOR] F4 — Style tiêu đề mục trùng lặp
- `.tami-dash-site__title` lặp y hệt `.tami-dash__section-title` (`_dashboard.scss:26-32`).
- Fix: dùng `className="tami-dash__section-title"` trên h2 và xoá block `&__title`.

### [MINOR / residual] F5 — `display: flex` trên `<details>`
- `_dashboard.scss` `.tami-dash-create { display: flex }` + summary `flex: 1`: Chromium trước bản hỗ trợ `::details-content` (~131) không cho `<details>` làm flex container → summary không giãn theo chiều cao hàng khi thẻ khác cao hơn (nhãn dài xuống dòng). Hiện tất cả `min-height: 64px` nên lệch chỉ xảy ra khi wrap. Không chặn PASS; cân nhắc `height: 100%`/`box-sizing` trên summary hoặc ghi residual.

## Residual risk
- Không có browser trong quyền reviewer: 768/1280 và theme sáng/tối 1280 xác minh bằng CSS math + evidence builder (tối 1024, sáng 375).
- Subgrid fallback trên trình duyệt cũ: hàng alt/tên tệp có thể chồng nhau.
- GAP-A11Y-1 còn mở (đã ghi trong task).

## Verdict
**FAIL** — F1 (MAJOR: test khai báo không tồn tại, evidence sai) + Responsive gate mục prefers-reduced-motion FAIL (F2). Builder cần: thêm test thật (F1), xử lý reduced-motion (F2); F3–F4 nên sửa cùng lượt (rẻ). Sau đó chạy lại `pnpm typecheck`, `pnpm lint`, `pnpm test` và cập nhật Verification summary đúng số liệu.
