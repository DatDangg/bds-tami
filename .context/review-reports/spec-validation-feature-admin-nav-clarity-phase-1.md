Agent: spec-validator

# Phase review — feature-admin-nav-clarity (BL-041) · phase 1 · round 1

- Mode: **Phase review** (sau T01 PASS r2 STRICT, T02 reviewer r1 PASS)
- Sources: `spec/changes/2026-10-20-admin-nav-clarity.md` (10 acceptance + "Xử lý" D1–D11), `SPECIFICATIONS.md:115` FR-ADM-19 ("Điều hướng rõ (BL-041)", "Tổng quan (BL-041)"), `tasks/feature-admin-nav-clarity/phase-1-task-0{1,2}.md`
- Implementation: T01 = commit `f3d5291`; T02 = working tree chưa commit (`git diff HEAD` + file mới `QuickActions.tsx`, `WebsiteShortcuts.tsx`, `dashboard-actions.test.ts`, `TranslationFailedBanner.test.tsx`; xoá `NavGroupCards.tsx`)
- Không sửa source. Không chạy app/DB (kiểm trực quan = residual).

## Verdict: ⚠️ GAPS FOUND (chỉ tài liệu; code đủ)

Code + test đáp ứng đủ 10/10 acceptance ở mức code. Có **1 [PARTIAL] doc reconcile** (design doc as-built của BL-015 vẫn mô tả sidebar 7 nhóm / dashboard "Tạo mới" + "Mục quản lý"), mức LOW, không chặn code nhưng phải xử lý trước khi đóng phase (doc reconcile là bước close-out bắt buộc).

## Ma trận coverage

| # | Acceptance (change doc) | Spec / Decision | Implementation evidence | Status | Note |
|---|---|---|---|---|---|
| 1 | Sidebar phân cấp rõ nhóm/mục; vạch/khoảng ngăn nhóm; mở/đóng dễ nhận; mục chọn nổi rõ (nền + vạch TAMI); AA sáng+tối | FR-ADM-19 "Điều hướng rõ"; D4 | `_surfaces.scss` (f3d5291): `.nav-group + .nav-group` margin-top 8px + `border-top --admin-border-strong`; `__toggle` 12px/700/uppercase/letter-spacing 0.06em/`--admin-text`; `__indicator svg .stroke` → `--admin-text-muted`; `__content` thụt `$group-indent` + border-inline-start; `.nav__link.active` nền `--admin-accent-soft`; `.nav__link-indicator` 3px, inset `calc(-1*var(--nav-padding-inline-start,20px) - $group-indent)` | COMPLETE | Chỉ dùng token sẵn có (admin-tokens test contrast PASS theo task). Ảnh trước/sau + mắt người xem AA = residual |
| 2 | Hover/focus bàn phím rõ; 375px menu thu gọn dùng được | FR-ADM-19; D4 | `_controls.scss` thêm `.nav-group__toggle:focus-visible`, `.tami-admin-site-link:focus-visible`; `_surfaces.scss` `.nav__link:focus-visible` outline 2px `--admin-focus`; toggle hover `--theme-elevation-100`; `@media (max-width:767px)` toggle `min-height:44px` | COMPLETE | Reviewer r2 n1: toggle 36px đúng tại 768px (cùng breakpoint `.nav__link` sẵn có) — không phải gap. Kiểm 375px thực tế = residual |
| 3 | Tổng quan: hàng "Sửa website" đầu trang (Trang chủ · Menu đầu trang · Chân trang · Cấu hình chung), chỉ admin (`hideFromNonAdmin`) | FR-ADM-19 "Tổng quan"; D8, D11 | `dashboard-data.ts` `WEBSITE_GLOBAL_SLUGS` + `buildWebsiteShortcuts` dùng `hideFromNonAdmin({user})`; `WebsiteShortcuts.tsx:5-18` (`<nav aria-label="Sửa website">`, rỗng → null); `DashboardView.tsx` thứ tự Header → QuickActions → WebsiteShortcuts → Banner; test `dashboard-actions.test.ts:40-50` (admin 4 link đúng thứ tự/href, sale rỗng) | COMPLETE | Vị trí "dưới hàng thẻ thao tác" thay "cạnh Tạo mới" — đúng spec delta (nút Tạo mới đã bị thay) |
| 4 | Bỏ khối "Mục quản lý" (`NavGroupCards`); cập nhật test dashboard | FR-ADM-19 "không còn khối Mục quản lý"; D9 | `NavGroupCards.tsx` xoá (D trong git status); `buildNavGroupCards`, `navGroups`, `visibleEntities` bỏ khỏi `dashboard-data.ts`; CSS `.tami-dash-group*` bỏ (`_dashboard-lists.scss` −50); Grep `tami-dash-group|NavGroupCards|buildNavGroupCards|navGroups` trong `src/**`,`tests/**` = 0 kết quả; test cập nhật `DashboardParts.test.tsx`, `DashboardLinks.test.tsx`, `tests/integration/admin-dashboard.test.ts:212` | COMPLETE | Integration test cần DB, chưa chạy = residual |
| 5 | Ẩn `private-files` + `lead-activities` khỏi menu; thử join Lịch sử chăm sóc trong form Lead; không xoá collection/không đổi access/API | FR-ADM-19; D1 | `src/collections/LeadActivities.ts:86-87` `hidden: true`; `src/collections/PrivateFiles.ts:26-27` `hidden: true`; access không đổi (chỉ bỏ import `ROLES` thừa); test `src/collections/admin-hidden.test.ts` ghim; slug vẫn trong `ADMIN_NAV_GROUPS` | COMPLETE (code) | **Residual chính:** change doc yêu cầu "trước khi chốt ẩn `lead-activities` phải thử" — chưa thử runtime, chỉ có bằng chứng đọc node_modules (drawer `overrideEntityVisibility=true`). Ghi rõ ở task T01 Close-out. Cần QA/user thử form Lead (xem + "Thêm") trước release; hỏng → chuyển "Nâng cao" (1 dòng) |
| 6 | Nhóm "Nâng cao" cuối sidebar (6 mục), mặc định thu gọn; quyền xem giữ nguyên | FR-ADM-19; D2, D3 | `admin-groups.ts` `ADVANCED_NAV_GROUP_LABEL = "Nâng cao"`, nhóm cuối gồm `provinces, wards, audit-logs, click-events, click-stats-daily, translation-usage`; "Dữ liệu nền" còn `categories, developers`, "Hệ thống" còn `staff`; `NavAdvancedCollapse.tsx` (provider, đăng ký `payload.config.ts` providers) bấm toggle Payload một lần khi chưa có preference; test `NavAdvancedCollapse.test.tsx`, `admin-groups.test.ts` | COMPLETE | `admin.hidden` của các collection chỉ-admin không bị đụng → quyền xem giữ nguyên. Residual: flash mở thoáng qua lần đầu; phụ thuộc DOM Payload 3.91 (đã comment) |
| 7 | Header có "Xem website" (icon mở tab mới) trỏ trang chủ, URL từ cấu hình | FR-ADM-19 (`NEXT_PUBLIC_SITE_URL`); D5 | `SiteLink.tsx:8` `href={getEnv().NEXT_PUBLIC_SITE_URL}` `target="_blank" rel="noopener noreferrer"` + svg `aria-hidden` + `aria-label`; `payload.config.ts` `actions: [SiteLink]`; `importMap.js` regen; `SiteLink.test.tsx`; mobile ẩn chữ, 44px | COMPLETE | Không hardcode domain |
| 8 | Banner dịch lỗi: cảnh báo nhẹ vàng/viền, câu trấn an + link danh sách; chỉ N > 0 | FR-ADM-19 (không `role=alert`); D10 | `TranslationFailedBanner.tsx:70-87` `role="status"`, `tami-admin-alert--warning`, câu "`${total} bài chưa dịch được sang tiếng Anh — bản tiếng Việt vẫn hiển thị bình thường.`" / câu hết hạn mức; link "`<loại>: n bài — xem danh sách`"; guard `!isAdmin || groups.length === 0` giữ nguyên; `_surfaces.scss` `&--warning` (token `--admin-badge-warning-bg/fg` + viền); test `TranslationFailedBanner.test.tsx:30` | COMPLETE | Nhãn loại dùng `COLLECTION_LABELS` cũ (vd "Cho thuê") — ngoài scope BL-041, đã ghi ở task |
| 9 | Thẻ thao tác nhanh lớn thay "＋ Tạo mới ▾": Đăng tin cho thuê mới · Phân công lead (N chưa giao, link lọc chưa giao) · Viết tin tức — theo quyền; giữ đường tạo loại khác | FR-ADM-19; D6, D7 | `dashboard-data.ts` `buildQuickActions`: rentals/news theo `canCreate`, phân công chỉ khi `!hideFromNonAdmin` và có thẻ `leads-unassigned` (N + href từ `dashboard-queries.ts:79-84` — `status=new` & `assignedTo exists false`, cùng điều kiện chip `quick-filters.ts:112`); `moreShortcuts` = `CREATE_SHORTCUT_SLUGS` trừ rentals/news; `QuickActions.tsx:14-39` (thẻ link + `<details>` "Tạo loại khác"); `DashboardHeader.tsx` chỉ còn lời chào; CSS `.tami-dash-action` min-height 64px, 375px `flex-basis:100%`; test `dashboard-actions.test.ts:16-38` (admin 3 thẻ, N=0, sale không thẻ phân công, không quyền → không thẻ) | COMPLETE | Không viết điều kiện "chưa giao" thứ 2 (đúng D6) |
| 10 | Chỉ phạm vi trên; không đổi schema/access; chỉ `admin.group/hidden` + CSS + component admin; ảnh trước/sau 1440 + 375 sáng/tối | Ràng buộc FR-ADM-19 | Diff chỉ chạm `src/components/admin/**`, 2 collection (`admin.hidden`), `payload.config.ts` (đăng ký provider/action), `importMap.js`; không migration, không endpoint | COMPLETE (code) / ảnh = residual | Ảnh trước/sau chưa chụp (không dựng dev server vì chung DB) |

## Cross-doc conflict check

| Vị trí | Nội dung | Mức | Kết luận |
|---|---|---|---|
| `SPECIFICATIONS.md:115` FR-ADM-19 phần còn lại | Danh sách nhóm đã có "Nâng cao"; "Màn Tổng quan tuỳ biến: thẻ đếm nhanh…, lead mới nhất + bản sửa gần đây" — không còn "lối tắt tạo nội dung"/"7 nhóm"/"Danh mục quản lý" | — | Nhất quán, không conflict |
| `docs/ARCHITECTURE.md:129` | Đã cập nhật "8 nhóm nav gồm Nâng cao", NavAdvancedCollapse, SiteLink (f3d5291) | — | OK. Dòng `dashboard/ (DashboardView Tổng quan theo quyền)` không liệt kê component cụ thể → không stale |
| `docs/DESIGN.md` | Không mô tả sidebar/dashboard admin | — | no doc impact (đúng ghi nhận T02) |
| `docs/PERMISSION.md:67,69` | Ma trận quyền `lead-activities`/`private-files` — không nói về menu | — | Không conflict (access không đổi) |
| `docs/specs/2026-10-19-admin-ui-saas-design.md:156-176` (§2) | Bảng 7 nhóm (Tỉnh/Phường trong "Danh mục", audit/click/translation trong "Hệ thống", `lead-activities`/`private-files` hiện trong menu); style sidebar "nhãn nhóm 12/600 `text-subtle`"; có các ghi chú **As-built (T03)**, **As-built (BL-040)** nhưng **chưa có As-built (BL-041)** | LOW | **[PARTIAL] doc reconcile** — doc này đang đóng vai as-built (có ghi chú As-built), nay lệch code |
| cùng file `:186-194` (§3.1), `:216-218` | Layout Tổng quan: `[＋ Tạo mới ▾]` ở header, banner "alert danger", "Lối tắt tạo nội dung", "Danh mục quản lý"/"Mục quản lý" cuối trang | LOW | cùng gap trên |
| cùng file `:172`, `:282` (Q3) | "Câu hỏi mở: lead-activities nên ẩn…"; Q3 "duyệt 7 nhóm… không ẩn mục nào (giữ lead-activities, click-events)" | LOW | Quyết định lịch sử đã bị BL-041 (user duyệt 2026-10-21) thay thế; nên thêm ghi chú "superseded by BL-041" thay vì sửa lời quyết định cũ |
| `docs/reviews/2026-10-21-admin-audit.md` | Mô tả "7 nhóm", "Mục quản lý", "Tạo mới ▾" | — | Là ảnh chụp audit trước khi sửa (nguồn của BL-041) — không cần reconcile |

## Gaps

- **[PARTIAL] Doc reconcile as-built — `docs/specs/2026-10-19-admin-ui-saas-design.md`** (§2 dòng 156-176, §3.1 dòng 186-194, dòng 216-218, Q3 dòng 282).
  Requirement: AGENTS.md § Doc Impact & Reconcile (kiến trúc/flow/current behavior → reconcile as-built). Task liên quan: T01 (Doc impact chỉ kiểm `docs/DESIGN.md`, cập nhật `docs/ARCHITECTURE.md`) và T02 (Doc impact chỉ kiểm `docs/DESIGN.md`). Đề xuất cho builder: thêm khối **"As-built (BL-041, 2026-10-21)"** ở §2 (8 nhóm, "Nâng cao" thu gọn mặc định, `private-files`/`lead-activities` `admin.hidden`, style nhóm HOA 700 `--admin-text` + vạch ngăn + thụt lề, nút "Xem website") và §3 (thao tác nhanh + "Tạo loại khác" → "Sửa website" → banner warning `role=status` → thẻ đếm → danh sách; bỏ "Mục quản lý"); ghi "superseded by BL-041" cạnh câu hỏi mở dòng 172 và Q3 dòng 282. Không sửa lời quyết định cũ.

Không có [MISSING].

## Residual risk (không phải gap — có bằng chứng code/token)

1. **Join "Lịch sử chăm sóc" trong form Lead sau `admin.hidden: true`** chưa thử runtime; change doc đặt điều kiện "phải thử trước khi chốt ẩn". Bằng chứng hiện có là đọc node_modules Payload 3.91. Nên QA thử (xem + "Thêm" ghi chú) trước release/close-out BL-041; hỏng → chuyển `lead-activities` sang "Nâng cao".
2. Ảnh trước/sau 1440 + 375 sáng/tối, cảm nhận AA thực tế (vạch active, warning banner, thẻ 375px) — chưa chụp.
3. `tests/integration/admin-dashboard.test.ts` (đã sửa) chưa chạy vì cần DB.
4. `NavAdvancedCollapse` phụ thuộc markup nội bộ Payload 3.91 (`#nav-group-<label>`, `.nav-group__toggle--open`); lần đầu có thể thấy nhóm mở thoáng qua.
5. T02 chưa commit — validation dựa trên working tree tại thời điểm kiểm.

## Verify commands

Không chạy lại (spec-validator chỉ cross-check). Kết quả builder/reviewer đã ghi: T01 vitest 37 files/257 PASS · typecheck PASS · lint 0 error; T02 vitest 35 files/242 PASS · typecheck PASS · lint 0 error (`.context/review-reports/feature-admin-nav-clarity-phase-1-task-02-round-1-review.md:12-14`).
