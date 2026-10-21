# bug-admin-nav-dashboard-sitelink · phase-1-task-01 — Mục "Tổng quan" đầu sidebar + ô Ngôn ngữ không đè "Xem website"

- Nguồn: `spec/changes/2026-10-21-admin-nav-dashboard-sitelink.md` (BL-050). Spec: `SPECIFICATIONS.md` FR-ADM-19. Trạng thái: `done`.
- Plan: 1 phase / 1 task (2 lỗi nhỏ cùng vùng khung admin, cùng FR-ADM-19, cùng file style `_surfaces.scss`; user "tự làm tự quyết" = auto proceed, bỏ checkpoint).

## Classification / Risk
- Type: **BUG** (thiếu lối vào dashboard + lỗi bố cục header). Severity: **medium** (dùng được nhưng khó tìm dashboard; nhãn bị che).
- Scope: khung admin dùng chung (nav trái + header) — mọi màn admin. Không đổi schema/API/auth/access.
- Root cause category: (1) thiếu cấu hình (`beforeNavLinks` chưa khai); (2) CSS — giả định của Payload về `--gutter-h` bị project override làm lệch.
- Expected review level: **NORMAL** (shared component/style khung admin, nhưng không auth/data). Blast radius: mọi trang `/admin/**` đã đăng nhập.
- Doc impact: `docs/DESIGN.md` nếu có mô tả nav admin (as-built); `SPECIFICATIONS.md` FR-ADM-19 thêm câu mục "Tổng quan" (intent, qua change request đã có — user yêu cầu). Decision impact: không.

## Repro (đo bằng trình duyệt, dev server :3000, tài khoản admin tạm, `/admin/collections/rentals`)
| viewport | `--gutter-h` | ô thật `.app-header__localizer` (left→right) | ô giữ chỗ `__localizer-spacing` | "Xem website" right | chồng |
|---|---|---|---|---|---|
| 1600 | 32px | 1325→1495 | 1358→1528 | 1338 | **13px** |
| 1000 | 20px | 737→895 | 782→940 | 745 | **8px** |

## Root cause
### (2) Ô Ngôn ngữ đè "Xem website"
Payload 3.91 `AppHeader` (`node_modules/@payloadcms/ui/dist/elements/AppHeader/index.js` + `index.scss`):
- Ô Ngôn ngữ thật (`.app-header__localizer.localizer`) render NGOÀI vùng `overflow`, `position:absolute; right: base(4.5)` (= 90px, `--base` 20px) — số cứng.
- Trong dòng flex có một bản sao vô hình `.app-header__localizer-spacing` để giữ chỗ, nằm ngay trước avatar (`.app-header__account`, SVG 25px) — mép phải của nó = mép phải header − `--gutter-h` − 25px.
- 90px của Payload ứng với `--gutter-h` mặc định `base(3)` = 60px (60 + 25 = 85, lệch 5px nằm gọn trong `margin-right: var(--base)` 20px của `__actions-wrapper`).
- Project override `--gutter-h` = 32 / 20 / 16px (`src/components/admin/styles/_tokens.scss:75,145,151`, BL-015) nhưng KHÔNG chỉnh `right` của ô thật → ô giữ chỗ dịch sang phải 28–40px còn ô thật đứng yên → ô thật lệch trái 33px (1600) / 45px (1000) so với chỗ giữ, ăn hết 20px khoảng cách và đè đuôi chữ "Xem website".
- Fix đúng gốc: đặt `right` của ô thật theo đúng công thức của chỗ giữ: `calc(var(--gutter-h) + 25px)` (25px = kích thước avatar Payload). Khi đó ô thật trùng khít chỗ giữ ở mọi breakpoint, khoảng cách với "Xem website" = `margin-right` 20px của `__actions-wrapper` (≥ 8px). Mobile (≤768): gutter 16 → 41px ≈ Payload `base(2)` 40px (không đổi hành vi).

### (1) Sidebar không có "Tổng quan"
Payload `DefaultNav` (`@payloadcms/next/dist/elements/Nav/index.js`) chỉ render nhóm collection/global; dashboard (`admin.components.views.dashboard`) không có link nào. Project chưa khai `admin.components.beforeNavLinks` → không có lối vào dashboard ngoài logo/breadcrumb.

## Scope (Builder)
1. Component client mới `src/components/admin/NavDashboardLink.tsx` (+ test `NavDashboardLink.test.tsx`): mục "Tổng quan" dùng đúng markup Payload `DefaultNavClient` để ăn style BL-041 có sẵn: `className="nav__link"`, `id="nav-dashboard"`; đang ở dashboard (pathname === admin route, kể cả `/admin/`) → render `<div class="nav__link">` + `<div class="nav__link-indicator">` (như Payload làm với mục đang chọn — không link tới chính nó); còn lại → `Link` của `@payloadcms/ui` (`prefetch={false}`) tới admin route. Admin route lấy từ `useConfig().config.routes.admin` (không hardcode `/admin`). Dùng `usePathname` của `next/navigation`.
2. `src/payload.config.ts`: `admin.components.beforeNavLinks: ["/components/admin/NavDashboardLink#NavDashboardLink"]` + comment ngắn (BL-050). Regen importMap (`pnpm payload generate:importmap` hoặc lệnh project đang dùng) — CI có check importmap.
3. Style `_surfaces.scss`: mục "Tổng quan" nằm trên nhóm đầu tiên, không thụt lề (không thuộc nhóm) → vạch indicator phải lùi đúng `--nav-padding-inline-start` (không cộng `$group-indent`); thêm vạch ngăn/khoảng với nhóm đầu như giữa các nhóm (`.nav-group + .nav-group`). Không phá `.nav-group` hiện có và `NavAdvancedCollapse`.
4. Style `_surfaces.scss` (gần block `.tami-admin-site-link` / `.app-header__step-nav-wrapper`): `.app-header__localizer.localizer { right: calc(var(--gutter-h) + 25px); }` + `[dir="rtl"]` tương ứng (`left`, `right: unset`) + comment root cause (Payload `right: base(4.5)` giả định gutter mặc định). KHÔNG đổi `--gutter-h`, KHÔNG thêm margin cứng cho SiteLink.
5. Test: unit test NavDashboardLink (active ở `/admin` và `/admin/`, link ở `/admin/collections/rentals`, nhãn "Tổng quan"); test cấu hình (`payload.config` có `beforeNavLinks` trỏ đúng) nếu có file test config sẵn (vd `admin-groups.test.ts`/`admin-mobile-overflow.test.ts` đang đọc SCSS) — thêm assert SCSS có rule `right: calc(var(--gutter-h) + 25px)` cho `.app-header__localizer` theo cách các test SCSS hiện có làm.
6. Doc as-built: `docs/DESIGN.md` nếu có mục nav/header admin.

## Verify
- `pnpm vitest run src/components/admin` , `pnpm typecheck`, `pnpm lint`; importmap check (script CI nếu có).
- Trình duyệt (dev :3000): đo lại bảng repro ở 1600/1000 sáng+tối (khoảng cách ≥ 8px, ô thật trùng chỗ giữ), 375 (icon 44px), màn không có ô Ngôn ngữ (Lead/Media); sidebar có "Tổng quan" active ở `/admin`.

## Acceptance
- [x] Sidebar có "Tổng quan" ở đầu, về `/admin`, active như mục khác (BL-041), "Nâng cao" vẫn thu gọn
- [x] "Xem website" không bị đè ≥ 768px sáng/tối, khoảng cách ≥ 8px; mobile icon 44px
- [x] Root cause ghi ở trên; fix theo công thức chỗ giữ, không số mò
- [x] Kiểm trình duyệt màn có/không có ô Ngôn ngữ

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Decisions (auto proceed, user "tự làm tự quyết")
- Gộp 2 lỗi 1 task: cùng FR-ADM-19, cùng file style, mỗi lỗi vài dòng → tách 2 commit không đáng.
- Dùng `beforeNavLinks` (slot chính thức Payload) thay vì override cả Nav.
- 25px avatar: lấy từ SVG `width="25"` của `@payloadcms/ui/dist/graphics/Account/Default` (Gravatar cũng 25) — hằng của Payload, không phải số mò; ghi comment.

## Verification summary (Builder)
- File đổi: `src/components/admin/NavDashboardLink.tsx` (mới), `NavDashboardLink.test.tsx` (mới, 3 test), `admin-mobile-overflow.test.ts` (+2 test SCSS), `src/payload.config.ts` (`beforeNavLinks`), `src/components/admin/styles/_surfaces.scss` (`.tami-nav-dashboard` + `.app-header__localizer.localizer` + rtl), `src/app/(payload)/admin/importMap.js` (regen bằng `pnpm generate:importmap`; diff chỉ thêm đúng 2 dòng NavDashboardLink).
- `pnpm vitest run src/components/admin`: 36 files / 240 tests PASS. `pnpm typecheck`: PASS. `pnpm lint`: 0 error (warning có sẵn ở tools/task-dashboard).
- Importmap: CI chạy `pnpm payload generate:importmap` — đã chạy, đã commit-ready trong working tree.
- Doc: `docs/DESIGN.md` không có mục nav/header admin → no doc impact.
- Chưa kiểm trình duyệt (change-request tự kiểm). Indicator Tổng quan dùng wrapper `.tami-nav-dashboard` (vạch ngăn + indicator lùi đúng nav padding).
- Fix vòng 1 (change-request): `.tami-nav-dashboard { width: 100% }` (nav__wrap flex column align-items:flex-start làm hẹp 97px) + assert trong admin-mobile-overflow.test.ts.

## Browser check (change-request, dev :3000, admin tạm `@example.test` — đã xoá sau kiểm)
| màn | viewport / theme | "Xem website" right | ô Ngôn ngữ left | khoảng cách | ô thật − ô giữ chỗ |
|---|---|---|---|---|---|
| Cho thuê | 1600 sáng | 1338 | 1358 | **20px** (trước 13px chồng) | 0 |
| Tổng quan | 1600 sáng | 1353 | 1373 | 20px | 0 |
| Lead | 1600 sáng | 1353 | 1373 | 20px | 0 |
| Cho thuê | 1000 tối | 745 | 782 | **37px** (trước 8px chồng) | 0 |
| Cho thuê | 375 sáng | 225 (icon 44×44) | 243 | 18px, không tràn ngang (scrollWidth 375) | 0 |
- Ô Ngôn ngữ hiện ở mọi collection (localization bật toàn cục), Lead cũng vậy — không có màn "không có ô Ngôn ngữ" thật; layout không phụ thuộc theme (chỉ đổi màu).
- Sidebar: "Tổng quan" đầu menu, vạch ngăn với nhóm Khách hàng; ở `/admin` là `<div>` active (nền nhấn nhạt `rgb(248,243,235)`, chữ `rgb(106,78,38)` đậm 600, indicator dính mép nav left=0); ở màn khác là link `/admin`. Rộng 215px = bằng tiêu đề nhóm (sau fix width:100%; trước 97px). "Nâng cao" vẫn thu gọn (`open:false`), các nhóm khác mở.

## Review
- Round 1: `.context/review-reports/bug-admin-nav-dashboard-sitelink-phase-1-task-01-round-1-review.md` — **NORMAL, PASS** (0 CRITICAL/MAJOR). MINOR để task riêng: (1) `_surfaces.scss` > 300 dòng → tách `_nav.scss`; (2) khoảng ngăn dưới "Tổng quan" dư ~8px so với giữa các nhóm; (3) thiếu `aria-current="page"` (cả nav Payload cũng thiếu → task a11y riêng); (4) 25px = avatar mặc định Payload, đổi avatar tuỳ biến khác cỡ thì chỉnh theo.

## Verification summary (close-out)
- Acceptance: **PASS** (4/4). Verify: `pnpm vitest run src/components/admin` 36 files / 241 tests PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error. Browser check PASS (bảng trên). Reviewer: PASS r1.
- Repro-Verification: trước fix ô Ngôn ngữ chồng "Xem website" 13px (1600) / 8px (1000); sau fix cách 20px / 37px, ô thật trùng khít ô giữ chỗ (lệch 0).
- Residual risk: MINOR (2)(3)(4) ở trên; nâng cấp Payload có thể đổi `right: base(4.5)` / markup nav → kiểm lại khi nâng cấp.

## Doc impact
- Intent: `SPECIFICATIONS.md` FR-ADM-19 thêm câu BL-050 (spec 1.43.1, scope v54, `spec/updates/2026-10-21-admin-nav-dashboard-sitelink.md`). As-built: `docs/DESIGN.md` không có mục nav/header admin → no doc impact. Không đổi API/schema.
