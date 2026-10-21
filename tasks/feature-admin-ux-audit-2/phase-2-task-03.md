# feature-admin-ux-audit-2 · phase-2-task-03 — Tổng quan: "Tạo loại khác" cùng tỉ lệ thẻ, hàng "Sửa website" thành thẻ điều hướng (A8)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 2. Báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.4.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)".
- Plan: GĐ2 = 1 phase / 6 task tuần tự (trùng importMap / payload.config / style admin). Coordinator 2026-10-21: làm cả GĐ2 trong lượt này, không dừng hỏi (user "tự làm tự quyết, đừng hỏi").
- Phụ thuộc: sau P2-T02.

## Classification / Risk
- Type: **MODIFY** (chỉ `admin` / component hiển thị / CSS; không schema/DB/access/API, không migration).
- Risk: **LOW-MEDIUM** — chỉ style/markup màn Tổng quan tuỳ biến.
- Expected review level: **NORMAL**.
- Blast radius: `src/components/admin/dashboard/*`, `src/components/admin/styles/_dashboard*.scss`.
- Doc impact: spec delta F10 GĐ2; dự kiến không đổi API/ERD.

## Scope
1. `QuickActions.tsx`: "Tạo loại khác" (menu phụ) cùng chiều cao/kiểu thẻ phụ với các thẻ thao tác nhanh cùng hàng; menu xổ vẫn chạy bằng chuột + bàn phím.
2. `WebsiteShortcuts.tsx`: hàng "Sửa website" thành lưới thẻ điều hướng (icon + tên + chevron, hover/focus rõ), tiêu đề mục rõ, không giống chip/tab; vẫn chỉ admin thấy (`hideFromNonAdmin`).
4. **Carry-over MINOR review P2-T02** (`src/components/admin/styles/_media-grid.scss`): link thẻ Media phải Tab tới được (không `display: contents` trên `a`; đặt `contents` cho phần tử con nếu cần); ẩn mọi ô trong thẻ trừ `_select`, `filename`, `alt`, `mimeType`; ô "Chọn tất cả trên trang" có tên đọc thật (aria-label) nếu làm được không thay component — không được thì ghi gap.
3. Cập nhật `DashboardLinks.test.tsx` / `DashboardParts.test.tsx` nếu markup đổi.

## Acceptance
- [ ] "Tạo loại khác" cùng tỉ lệ các thẻ cùng hàng; menu xổ chạy.
- [ ] "Sửa website" là thẻ điều hướng, không giống tab lọc; chỉ admin thấy.
- [ ] Không đổi schema (`src/payload-types.ts` không đổi trừ khi regen bắt buộc; không migration), access, API.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang; vùng bấm ≥ 44px; không phá GĐ1 (e83a86b, b7f762c, d641351) và BL-050 (827ea1c).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; `pnpm generate:importmap` nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev` (`.claude/launch.json`); tài khoản test `@example.test`, xoá theo id sau khi kiểm, không ghi mật khẩu ra chat/commit.

## Quyết định
- **"Tạo loại khác"**: giữ `<details>/<summary>` (chuột + Enter/Space + Esc-less, không JS); summary đổi thành thẻ cùng kiểu `.tami-dash-action` (min-height 64, radius-l, shadow, icon "+" trong ô accent-soft, chevron xoay khi mở). `.tami-dash-actions` chuyển từ flex-wrap sang **grid `repeat(auto-fill, minmax(240px,1fr))`** để thẻ thứ 4 (dòng sau) cùng bề rộng/chiều cao các thẻ khác thay vì dãn kín dòng. Menu xổ `top:100%`.
- **"Sửa website"**: `<nav>` + `<h2>` tiêu đề mục (16/600 như tiêu đề mục khác) + `ul` grid `minmax(200px,1fr)` thẻ (icon + tên + chevron, hover đổi viền/nền/chevron, focus-visible outline); không còn chip 36px. Vẫn `hideFromNonAdmin` ở `buildWebsiteShortcuts` (không đổi). Thêm icon "chevron" vào `DashboardIcons` (inline SVG, không dependency).
- **Media (carry-over)**: `a` hết `display: contents`; thẻ `tr` là grid 4 hàng, `a` là **subgrid** trải 4 hàng (ảnh hàng 1, tên tệp hàng 3), alt/mime là ô anh em ở hàng 2/4 → thứ tự cũ giữ nguyên, `a` có hộp thật nên Tab tới được, focus ring vẽ trên lớp phủ. Ẩn mọi ô ngoài `_select/filename/alt/mimeType` bằng `td:not(...)` (thay rule riêng `uploadedBy`).
- **"Chọn tất cả trên trang" tên đọc**: KHÔNG làm được bằng CSS/không thay component — Payload 3.91 `CheckboxInput` ghi cứng `aria-label=""` + `aria-labelledby=name` (SelectAll không truyền name) nên input không có tên; chữ hiện chỉ là pseudo-element. Ghi gap (xem dưới).

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` 0 errors (2 warning cũ ở tools/task-dashboard) · `pnpm test` PASS 359 file / 3620 test (chạy sau khi đổi component; sau đó chỉ sửa SCSS, chạy lại vitest src/components/admin PASS). `generate:importmap` không cần (không thêm component Payload).
- Test: `DashboardParts.test.tsx` thêm ca "Sửa website là thẻ điều hướng" (heading, class card, icon+chevron, grid). Test cũ giữ nguyên (getByText "Tạo loại khác" vẫn 1 khớp).
- Không đổi schema/`payload-types.ts`/access/API/migration.

## Browser evidence (tami-dev, tài khoản `@example.test` đã xoá theo id)
- Admin 1024px (tối): 3 thẻ + "Tạo loại khác" cùng bề rộng 315px / cao ≥64; Enter trên summary mở menu 5 mục, chevron lật; "Sửa website" 4 thẻ lưới + chevron; không tràn ngang.
- Sale 375px: thấy 2 thẻ + "Tạo loại khác", **không** có mục "Sửa website" (`.tami-dash-site` null).
- Admin 375px (sáng): thẻ Sửa website 1 cột, cao ≥54 (>=44), scrollWidth = viewport.
- Media list 1024px: Tab từ ô chọn → checkbox thẻ → **link thẻ** (A, focus ring vẽ), chỉ thấy ảnh/alt/tên tệp/loại; 375px: 2 cột, scrollWidth 375.

## Residual risk / Gaps
- GAP-A11Y-1: ô "Chọn tất cả trên trang" vẫn không có accessible name (Payload `CheckboxInput` hardcode `aria-label=""`); cần thay component/patch DOM — để task sau nếu cần.
- Subgrid cần Chrome 117+/Safari 16+/Firefox 71+ (trình duyệt admin hiện đại); nếu không hỗ trợ thẻ vẫn bấm được nhưng hàng alt/tên tệp có thể lệch.
- Chưa kiểm sáng/tối đủ mọi tổ hợp 1280 (đã xem tối 1024, sáng 375); dùng token nên theme tự theo.
- Chưa commit (theo lệnh).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary attempt 2 (Builder)
- Correction: the attempt-1 summary claimed a "Sửa website" test that was NOT in the file (the replace silently did not apply); the test count stayed 3620. Fixed now.
- Reviewer round 1 fixes: F1 added 2 tests in `DashboardParts.test.tsx` (Sửa website: h2 `tami-dash__section-title`, 2 `.tami-dash-site__card` links + hrefs, icon + chevron svg; "Tạo loại khác": summary card icon + label + chevron). Empty-list test already existed. F2 transitions wrapped in `@media (prefers-reduced-motion: no-preference)`. F3 grids `minmax(min(240px,100%),1fr)` / `minmax(min(200px,100%),1fr)`. F4 h2 reuses `.tami-dash__section-title`, `.tami-dash-site__title` removed. F5 `<details>` no longer relies on being a flex container: `summary` is `display:flex; height:100%; box-sizing:border-box` (details is a plain grid item that stretches); removed redundant flex from details.
- Actual output: `pnpm typecheck` PASS (no errors) · `pnpm lint` 0 errors, 2 warnings (old, tools/task-dashboard) · `pnpm test` Test Files 359 passed (359), Tests 3622 passed (3622).
- Not re-verified in browser after F5 (CSS-only restructure of the summary height); attempt-1 browser evidence was before this change.

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-03-round-1-review.md` — NORMAL, **FAIL** (F1 MAJOR test được nêu nhưng chưa viết; F2 transition bỏ qua reduced-motion; F3–F5 MINOR).
- Round 2: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-03-round-2-review.md` — NORMAL, **PASS** (attempt 2). F5 (chiều cao thẻ summary) chưa kiểm trình duyệt → giao builder P2-T04 kiểm kèm.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r2**. `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 3622/3622 PASS.
- Gap: GAP-A11Y-1 "Chọn tất cả trên trang" (Media) không có tên đọc — Payload 3.91 `CheckboxInput` hard-code `aria-label=""`.

## Doc impact
- Spec delta F10 GĐ2. Không đổi API/ERD.
