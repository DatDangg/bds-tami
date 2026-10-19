# bug-admin-misc-needs-repro · phase-1-task-02 — Form admin tràn ngang ở 375px (#10)

- Change doc: `spec/changes/2026-10-19-admin-misc-needs-repro.md` (BACKLOG BL-023, bug #10)

## Classification / Risk
- Type: **BUG** (responsive) · Severity: **medium** (mobile: trang bị thu nhỏ/cuộn ngang)
- Root cause category: CSS (Payload 3.91 mặc định, không do SCSS của TAMI)
- Risk: **LOW–MEDIUM** — CSS admin dùng chung cho header mọi màn + màn tài khoản; không đổi schema/API.
- Expected review level: **NORMAL** (component shared: header admin) · Blast radius: header admin (breadcrumb) mọi màn, khối "Cài đặt" ở `/admin/account`.
- Doc impact: dự kiến `no doc impact` · Decision impact: không.

## Repro (đã tái hiện 2026-10-20, viewport 375×812, đo bằng `documentElement.scrollWidth` + iframe 375px)
| Form | scrollWidth trước | Phần tử gây tràn |
|---|---|---|
| `/admin/account` | 435 | `.payload-settings::before/::after` (vạch kẻ) |
| `/admin/collections/rentals/0e6b861d-…` | 430 | header: breadcrumb `.app-header__step-nav-wrapper` không co → nút ngôn ngữ + avatar bị đẩy ra ngoài |
| `/admin/collections/leads/6312f4de-…` | 386 | header (breadcrumb) |
| `/admin/collections/projects/43c57ff6-…` | 375 (bản ghi tên ngắn) — user đo 411 với tên dài | header (breadcrumb) |

## Root cause (có evidence)
1. **Header/breadcrumb** — `node_modules/@payloadcms/ui/dist/styles.css`: `.app-header__step-nav-wrapper{flex-grow:0;display:flex;width:100%}` (có rule ẩn scrollbar `::-webkit-scrollbar{display:none}` nhưng **không** có `overflow-x`, và `min-width:auto` của flex item) trong `.app-header__controls-wrapper{display:flex;flex:1;min-width:0}`. Breadcrumb (`.step-nav`, mỗi `span` max 160px nowrap) giữ nguyên bề rộng nội dung → `.localizer-button.app-header__localizer-spacing` + `.app-header__account` (flex-shrink:0) bị đẩy ra ngoài 375px (đo: account R431 ở rentals). Thử `min-width:0; overflow-x:auto` cho wrapper → rentals 430→375, leads 386→375.
2. **Màn tài khoản** — `node_modules/@payloadcms/next/dist/prod/styles.css`: `.payload-settings:before,.payload-settings:after{width:calc(100% + var(--base) * 5);left:calc(var(--gutter-h) * -1);position:absolute}` → ở 375px vạch kẻ rộng 435px (đo `::after` width 435.3, right −76px). Hiển thị ở ≤1024px (`::after display:block`). Thử `width:auto; right:calc(var(--gutter-h) * -1)` → account 435→375.
- Không do `nav__header` (bị `.nav{overflow:hidden}` cắt), không do `doc-controls__meta`/`doc-tabs`/`tabs-field__tabs` (nằm trong vùng `overflow:auto` của Payload, cuộn nội bộ).

## Fix (phạm vi)
- Thêm vào SCSS admin (`src/components/admin/styles/_surfaces.scss` — đúng file "bề mặt/nav/header"):
  - `.app-header__step-nav-wrapper { min-width: 0; overflow-x: auto; }` (breadcrumb co lại/cuộn nội bộ; scrollbar đã bị Payload ẩn).
  - `.payload-settings::before, .payload-settings::after { width: auto; right: calc(var(--gutter-h) * -1); }` (vạch kẻ tràn đúng lề gutter hai bên, không vượt viewport).
- **Cấm** `overflow-x: hidden` trên `html`/`body`/khung trang (luật change doc).
- Test: vitest đọc SCSS nguồn khẳng định có 2 rule trên (kiểu test tĩnh hiện có) + kiểm tra trình duyệt 375px cho 4 form.

## Acceptance
- [x] `documentElement.scrollWidth == 375` ở 375px trên `/admin/account`, rentals/projects/leads chi tiết (+ `create` của rentals/news).
- [x] Breadcrumb dài vẫn đọc được (cuộn ngang nội bộ, không cắt nút ngôn ngữ/avatar); desktop 1280 không đổi giao diện.
- [x] Không thêm `overflow-x: hidden` toàn cục.
- [x] `pnpm test`, `pnpm lint`, `pnpm typecheck` PASS.

## Ngoài phạm vi (ghi nhận)
- Dashboard `/admin` (506px) và danh sách `/admin/collections/rentals` (576px) cũng tràn ở 375px — không thuộc #10 ("form chi tiết"); đề xuất mục backlog riêng.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Fix: `_surfaces.scss` thêm `.app-header__step-nav-wrapper{min-width:0;overflow-x:auto;scrollbar-width:none}` + `.payload-settings::before/::after{width:auto;right:calc(var(--gutter-h) * -1)}` (ngoài `@layer`, thắng `@layer payload-default`; không đụng html/body).
- Test mới `src/components/admin/admin-mobile-overflow.test.ts` (3 test, đọc SCSS đã bỏ comment): FAIL trước fix (2/3), PASS sau fix (3/3).
- `pnpm test` 276 files / 2884 tests PASS · `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard) · `pnpm typecheck` PASS.
- Repro Verification (change-request, Chrome dev, iframe 375px, 2026-10-20): **PASS** — `documentElement.scrollWidth` = 375 ở `/admin/account` (trước 435), rentals `0e6b861d…` (trước 430), projects `43c57ff6…`, leads `6312f4de…` (trước 386), `rentals/create`, `news/create`; avatar `.app-header__account` R=344 (trong viewport).

## Doc impact / Reconcile
- no doc impact — chỉ CSS admin; FR-ADM-19 đã yêu cầu "responsive không vỡ ở 390px", code nay khớp.

## Review
- NORMAL PASS round 1 — `.context/review-reports/bug-admin-misc-needs-repro-phase-1-task-02-round-1-review.md` (3 MINOR: vạch kẻ `payload-settings` desktop ngắn hơn 36px mép phải — chấp nhận, cân 2 lề; viền focus link breadcrumb có thể bị cắt dọc do overflow; thanh cuộn breadcrumb ẩn như Payload).

## Residual risk
- Dashboard `/admin` (506px) và danh sách `/admin/collections/rentals` (576px) vẫn tràn ở 375px — ngoài phạm vi #10 (form chi tiết); đề xuất backlog mới.
- Viền focus breadcrumb có thể bị cắt mép trên/dưới (overflow-x:auto) — chưa kiểm Tab thủ công.
- Vạch kẻ màn tài khoản desktop ngắn hơn 36px mép phải (đổi thị giác nhỏ).
- Chỉ kiểm Chrome; Safari iOS chưa thử thiết bị thật.
