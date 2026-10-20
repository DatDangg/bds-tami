Agent: reviewer

# Review — feature-admin-nav-clarity · phase-1-task-02 · round 1 (BL-041 Tổng quan)

- Review level: **STRICT**
- Reason: hiển thị theo vai trò (admin vs sale: thẻ Phân công, hàng Sửa website, banner dịch lỗi), số đếm lead lấy qua Local API `overrideAccess:false`, đổi shape `DashboardData`/`DashboardContext` (shared dashboard module), xoá component + CSS.
- Blast radius: `src/components/admin/dashboard/*` (QuickActions, WebsiteShortcuts, DashboardHeader, DashboardView, dashboard-data, xoá NavGroupCards), `src/components/admin/TranslationFailedBanner.tsx`, `styles/_dashboard.scss`, `_dashboard-lists.scss`, `_surfaces.scss`, `tests/integration/admin-dashboard.test.ts`. Không đổi schema/access/endpoint/API. Chỉ màn Tổng quan admin bị ảnh hưởng (view `admin.components.views.dashboard` trong `src/payload.config.ts:72`).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/admin src/lib/admin` | PASS — 35 files / 242 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `tests/integration/admin-dashboard.test.ts` | skip, cần DB — đã soát tĩnh (xem dưới) |

## Kiểm tra trọng tâm (STRICT)
- **RBAC thẻ Phân công**: `buildQuickActions` (`dashboard-data.ts:211-226`) cần cả `!hideFromNonAdmin({user})` VÀ thẻ đếm `leads-unassigned` tồn tại; thẻ này chỉ có trong `adminCards` (`dashboard-queries.ts:79`) và chỉ được tải khi có quyền `read leads` → hai lớp chặn, sale không thấy. Test unit `dashboard-actions.test.ts` (sale có thẻ đếm giả vẫn không có thẻ phân công) + integration. OK.
- **Sửa website**: `buildWebsiteShortcuts` dùng đúng `hideFromNonAdmin` (`src/access/hideFromNonAdmin.ts:4`), không có quy tắc thứ 2; nhãn từ `ADMIN_GLOBAL_LABELS`, thứ tự homepage/header/footer/site-settings. Sale → `[]` → component trả `null`. OK.
- **Không quyền tạo → không thẻ**: `canCreate` theo `permissions.collections[slug].create`; test `contextOf("sale", [])` → `[]`; `QuickActions` trả null khi cả actions và moreShortcuts rỗng. OK.
- **N chưa giao**: lấy `count` + `href` từ thẻ đếm có sẵn (`status=new` AND `assignedTo exists false`, đếm qua `loadStatCards` Local API `overrideAccess:false` như trước) → đúng điều kiện chip "Mới (chưa giao)" (`quick-filters.ts:112`), href `where[and][0][status][equals]=new&where[and][1][assignedTo][exists]=false` khớp chip. Không viết điều kiện thứ 2. OK.
- **Tạo loại khác**: `buildShortcuts(ctx)` (lọc `create`) trừ `rentals`/`news` → còn projects, property-posts, job-postings, services, pages theo quyền; `<details>` không-JS giữ nguyên. OK.
- **Xoá NavGroupCards**: Grep `NavGroupCard|buildNavGroupCards|navGroups|tami-dash-group` trong `src/` → không còn tham chiếu; CSS `.tami-dash-groups/.tami-dash-group*` (kể cả trong media query) đã xoá; import `ADMIN_NAV_GROUPS`, `labelOf` bỏ theo. OK.
- **Bỏ `visibleEntities` khỏi `DashboardContext`**: không còn ai đọc; Payload vẫn truyền prop thừa vào Server Component — vô hại; integration `contextFor` cập nhật bỏ `getVisibleEntities`. typecheck PASS. OK.
- **Banner**: `role="status"`, `tami-admin-alert--warning` (token `--admin-badge-warning-fg/bg` + viền). Tương phản tính tay: sáng `#854d0e`/`#fdf3dc` ≈ 6.2:1, tối `#fcd34d`/`#3a2a08` ≈ 9.6:1 → AA. Câu khớp spec FR-ADM-19 (N = tổng `group.count`), câu hết hạn mức đúng D10, link "<Loại>: n bài — xem danh sách" giữ href lọc cũ; vẫn chỉ admin + N>0; `findFailedTranslations` không đổi. Test component đủ 4 ca (N>0, hết hạn mức, N=0, sale không gọi API). OK.
- **Integration test** (tĩnh): kỳ vọng admin `["new-rental","assign-leads","new-news"]` + 4 href globals; sale `["new-rental","new-news"]` + `[]` — nhất quán với seed actor (sale có create rentals/news theo test buildShortcuts cùng file). OK.

## Responsive Checklist Gate (diff đụng UI)
Không có browser → xác minh bằng CSS math. Widths 375 / 768 / 1280.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `.tami-dash-actions` flex-wrap; `.tami-dash-action` `flex:1 1 240px`, ≤767px `flex-basis:100%` (1 cột ở 375); nhãn dài xuống dòng theo từ (min-content = từ dài nhất). `.tami-dash-site` + `ul` đều `flex-wrap`. Menu `<details>` ≤767px `left:0`. |
| Mobile-first `min-width` | N/A — ngoài scope | File dùng `max-width` có sẵn từ trước (convention admin); diff chỉ thêm rule vào media query có sẵn. Đề xuất task riêng nếu muốn đổi. |
| Grid auto-fit/minmax, container không fixed px | OK | Hàng thẻ là flex-wrap với flex-basis, không cột cố định. |
| Font-size rem / heading clamp | N/A — ngoài scope | Toàn bộ SCSS admin dùng px theo token thiết kế admin (BL-015); diff theo convention, không hồi quy. |
| Media (ảnh/video) | N/A | Không thêm ảnh/embed (icon SVG inline). |
| Touch target ≥44px | OK | Thẻ `min-height:64px`; `.tami-dash-site a` và `.tami-dash-create__button`/menu link `min-height:44px` ở ≤767px. |
| Nav mobile / table | N/A | Không thêm nav/table. |
| 100vh / reduced-motion / overflow:hidden | OK | Không dùng 100vh, không animation mới, không `overflow:hidden`. |

## Skill gates
- aislop: skip, `aislop` không cài (command -v rỗng).
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`); eslint 0 error.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`buildQuickActions`, `buildWebsiteShortcuts`, `WEBSITE_GLOBAL_SLUGS`), hàm < 50 dòng, file ≤ 300 (dashboard-data.ts 240, _dashboard.scss 281), comment nêu WHY. 1 indicator nhẹ (MINOR-1 trùng slug) < 3.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip — không đổi access/endpoint; chỉ hiển thị, không có môi trường pentest được phép.

## Findings
- [CRITICAL] — không có.
- [MAJOR] — không có.
- [MINOR-1] `src/components/admin/dashboard/dashboard-data.ts:228` `QUICK_ACTION_SLUGS = ["rentals","news"]` lặp lại slug đã hardcode trong `buildQuickActions` (dòng 215-222) và kiểu `readonly string[]` mất kiểm kiểu. Đề xuất: khai `as const satisfies readonly (typeof CREATE_SHORTCUT_SLUGS)[number][]` và dùng chung cho cả hai chỗ.
- [MINOR-2] `src/components/admin/dashboard/DashboardParts.test.tsx` ca "không có gì -> không render": `expect(container).toBeTruthy()` là assert vô nghĩa (luôn đúng). Đề xuất bỏ hoặc thay bằng assert thật.
- [MINOR-3] `src/components/admin/TranslationFailedBanner.tsx:40/49` nhóm global (vd Trang chủ) cũng đếm vào N và hiển thị "Trang chủ: 1 bài — xem danh sách" — chữ "bài"/"danh sách" hơi lệch nghĩa với global (1 trang cấu hình). Không trái spec; cân nhắc nhãn riêng cho global ở lần sau.
- [MINOR-4] `src/components/admin/styles/_dashboard.scss` `.tami-dash-create__menu { right:0 }` ở ≥768px: nếu user không có thẻ nào nhưng có lối tắt phụ (details nằm sát mép trái), menu `min-width:220px` có thể tràn sang trái ngoài container. Trường hợp vai trò hiện tại không xảy ra (admin/sale đều có create rentals/news) → residual.

## Residual risk
- Integration test chưa chạy (cần DB); ảnh 1440/375 sáng/tối chưa có — responsive xác minh bằng CSS math, tương phản bằng tính tay token.
- Live region `role="status"` được chèn sau fetch (không tồn tại sẵn khi rỗng) — một số trình đọc màn hình có thể không đọc tự động; chấp nhận được với cảnh báo nhẹ.

## Verdict
**PASS** — không có CRITICAL/MAJOR; 4 MINOR không chặn.
