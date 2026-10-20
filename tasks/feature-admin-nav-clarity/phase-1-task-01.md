# feature-admin-nav-clarity · phase-1-task-01 — Sidebar phân cấp rõ + nhóm "Nâng cao" + ẩn mục kỹ thuật + nút "Xem website" (BL-041)

- Change doc: `spec/changes/2026-10-20-admin-nav-clarity.md` (BACKLOG BL-041). Tham khảo `docs/reviews/2026-10-21-admin-audit.md` §1 (chỉ phần đã ghép vào change doc).
- Spec delta: FR-ADM-19 câu "**Điều hướng rõ (BL-041)**" (SPECIFICATIONS.md).
- Trạng thái: `built — chờ review`

## Classification / Risk
- Type: **MODIFY** (chỉ metadata hiển thị admin: `admin.group` qua `ADMIN_NAV_GROUPS`, `admin.hidden`, CSS sidebar, 1 component header admin). **Không đổi** schema/DB/access/API/endpoint.
- Risk: **MEDIUM** — đổi `admin.hidden` của `lead-activities` (form Lead phụ thuộc join field "Lịch sử chăm sóc") + navigation dùng chung mọi màn admin → review **STRICT** (navigation/shared + hidden ảnh hưởng route).
- Blast radius: sidebar mọi màn admin, header admin, `src/components/admin/admin-groups.ts` (+test), `src/collections/LeadActivities.ts`, `src/collections/PrivateFiles.ts`, `src/components/admin/styles/_surfaces.scss` (+ `_controls.scss` focus), `src/payload.config.ts` (`admin.components.actions`), `src/app/(payload)/admin/importMap.js`.
- Doc impact: FR-ADM-19 (spec delta đã ghi). ERD/API_SPEC không đổi. `docs/DESIGN.md`: kiểm có mô tả 7 nhóm menu admin không — có thì reconcile as-built.
- Migration: không.

## Quyết định (auto proceed — user chỉ thị "auto proceed, khỏi hỏi lại", 2026-10-21)
- D1 **Ẩn bằng `admin.hidden: true`** cho `private-files` và `lead-activities` (mọi user). Bằng chứng Payload 3.91 (đã đọc node_modules): `hidden` chặn route list/document (`@payloadcms/next/dist/views/List/index.js:65`, `views/Document/index.js:208` — trừ `overrideEntityVisibility`), nhưng **drawer mặc định `overrideEntityVisibility = true`** (`@payloadcms/ui/dist/elements/DocumentDrawer/DrawerContent.js:22`, `ListDrawer/DrawerContent.js:22`) và bảng join (`RelationshipTable`/`buildTableState`) không kiểm visibleEntities → ô "Lịch sử chăm sóc" trong form Lead (join `activities`, `src/collections/Leads.ts:195`) xem/thêm qua drawer vẫn chạy; nút "Tải CV" đi endpoint riêng `/api/admin/private-files/:id/download`. **Builder phải thử thực tế** (form Lead: thấy danh sách + "Thêm" mở drawer tạo ghi chú lưu được) nếu chạy được app; không chạy được → test/evidence code + ghi residual. Thử hỏng → KHÔNG ẩn `lead-activities`, đưa vào nhóm "Nâng cao" và ghi lại.
- D2 Nhóm **"Nâng cao"** (cuối, sau "Hệ thống"): `provinces`, `wards`, `audit-logs`, `click-events`, `click-stats-daily`, `translation-usage`. "Dữ liệu nền" còn `categories`, `developers`; "Hệ thống" còn `staff`. `private-files` giữ trong "Thư viện", `lead-activities` giữ trong "Khách hàng" trong `ADMIN_NAV_GROUPS` (bị hidden nên không hiện; plugin vẫn cần slug để không throw). Quyền xem giữ nguyên (hidden chỉ-admin cũ vẫn giữ).
- D3 **Mặc định thu gọn "Nâng cao"**: Payload 3.91 NavGroup mở mặc định khi chưa có preference (`@payloadcms/ui/dist/elements/NavGroup/index.js:20`, `@payloadcms/next/dist/elements/Nav/index.client.js:57` đọc `navPreferences.groups[label].open`). Builder chọn cách đơn giản nhất chạy được, không sửa node_modules — gợi ý: client provider (đã có `admin.components.providers`) khi chưa có preference `nav.groups["Nâng cao"]` thì ghi `open:false` một lần (qua `usePreferences().setPreference`) và thu gọn ngay; user mở ra thì Payload tự nhớ. Cách khác (custom Nav) chỉ khi cách này không được. Ghi cách đã chọn vào Verification summary.
- D4 **Phân cấp thị giác** (design tự quyết, không chờ duyệt ảnh — auto proceed): tiêu đề nhóm (`.nav-group__toggle`) 12–13px, đậm 600–700, VIẾT HOA + letter-spacing, màu chữ mạnh (không xám nhạt), chevron rõ xoay theo trạng thái; mục con 14px thường, thụt lề ~12px với vạch dọc mảnh bên trái; vạch ngăn + khoảng giữa các nhóm; mục đang chọn: nền nhấn nhạt + vạch 3px màu nhấn TAMI bên trái + chữ đậm 600; hover nền trung tính; focus-visible outline màu nhấn. Chỉ dùng token sẵn có trong `_tokens.scss`/`admin-tokens.ts` (thêm token mới thì thêm cả vào test contrast). AA ≥ 4.5:1 chữ, ≥ 3:1 vạch/viền, sáng + tối.
- D5 **"Xem website"**: `admin.components.actions` (header Payload) — server component đọc `NEXT_PUBLIC_SITE_URL` qua `getEnv()`/env có sẵn (không hardcode domain), `<a target="_blank" rel="noopener noreferrer">` có chữ "Xem website" + icon mở tab mới (aria-hidden), vùng bấm ≥ 44px trên mobile hoặc chữ ẩn còn icon + `aria-label` ở 375px. Hiện cho mọi nhân viên.

## Scope
1. `src/components/admin/admin-groups.ts`: thêm nhóm "Nâng cao" theo D2, cập nhật comment; test `admin-groups.test.ts` cập nhật (thứ tự nhóm, "Nâng cao" cuối, mọi slug vẫn có nhóm).
2. `LeadActivities.ts` + `PrivateFiles.ts`: `admin.hidden: true` (D1); grep link nội bộ tới `/admin/collections/lead-activities` hoặc `/admin/collections/private-files` (sẽ 404) → sửa nếu có.
3. Thu gọn mặc định "Nâng cao" (D3) + test đơn vị cho logic (chưa có pref → ghi open:false; có pref → không đụng).
4. CSS sidebar (D4) trong `src/components/admin/styles/_surfaces.scss` (và `_controls.scss` nếu focus). Không vỡ 375px (menu thu gọn/hamburger vẫn dùng được); `admin-mobile-overflow.test.ts` vẫn PASS.
5. Nút "Xem website" (D5) + đăng ký `admin.components.actions` trong `src/payload.config.ts` + regenerate `importMap.js` (`pnpm payload generate:importmap`, không được thì sửa tay đúng format) + test component (href = site URL, target/rel đúng, có chữ/aria-label).
6. Ảnh trước/sau (desktop 1440 + 375, sáng/tối) nếu chạy được app + DB local; không thì ghi residual.

## Acceptance
- [ ] Sidebar: tiêu đề nhóm và mục con phân cấp rõ; có vạch/khoảng ngăn nhóm; mở/đóng nhóm dễ nhận; mục đang chọn nổi rõ (nền + vạch nhấn TAMI); AA sáng **và** tối.
- [ ] Hover/focus bàn phím mục sidebar thấy rõ; 375px menu thu gọn vẫn dùng được.
- [ ] Tệp CV ứng viên + Lịch sử chăm sóc không hiện trong menu; form Lead ô Lịch sử chăm sóc xem/thêm vẫn chạy; không xoá collection, không đổi access/API.
- [ ] Nhóm "Nâng cao" cuối sidebar gồm 6 mục D2, mặc định thu gọn; quyền xem giữ nguyên.
- [ ] Header có nút "Xem website" mở tab mới, URL từ cấu hình.
- [ ] Không đổi schema (không migration, `payload-types.ts` không đổi kiểu).

## Verify
`pnpm test` (file liên quan: src/components/admin, src/lib/admin), `pnpm typecheck`, `pnpm lint` (lệnh theo `.context/project-config.md`).

## Verification summary
- Acceptance (code-level): sidebar phân cấp (tiêu đề nhóm HOA đậm + vạch ngăn nhóm + mục con thụt lề với vạch dọc, chevron đậm, active nền+vạch 3px+chữ 600, hover/focus-visible outline) [done, chỉ dùng token sẵn có nên AA giữ nguyên; admin-tokens.test PASS]; 375px: .nav__link 44px giữ nguyên, admin-mobile-overflow.test PASS; private-files + lead-activities `admin.hidden: true` [done]; nhóm "Nâng cao" cuối với 6 mục D2 [done]; thu gọn mặc định [done]; nút "Xem website" [done]; không đổi schema/access/API (không migration, payload-types không đổi).
- D3 cách chọn: provider client `NavAdvancedCollapse` (đăng ký trong admin.components.providers): đọc preference `nav`; chưa có `groups["Nâng cao"]` thì chờ (MutationObserver, tối đa 5s) nút `#nav-group-Nâng cao .nav-group__toggle--open` rồi `click()` — Payload tự lưu open:false; có preference thì không đụng. Lý do: NavGroup giữ state nội bộ (useState từ prop isOpen), ghi preference sau mount không thu gọn ngay. Nhược: lần đầu có thể thấy nhóm mở một khoảnh khắc ngắn (flash) trước khi thu gọn.
- D5: `SiteLink.tsx` (server component, getEnv().NEXT_PUBLIC_SITE_URL) qua `admin.components.actions`; <768px ẩn chữ, còn icon + aria-label, vùng bấm 44px.
- Files: src/components/admin/{admin-groups.ts,admin-groups.test.ts,NavAdvancedCollapse.tsx(+test),SiteLink.tsx(+test)}, src/components/admin/styles/{_surfaces.scss,_controls.scss}, src/collections/{LeadActivities.ts,PrivateFiles.ts (bỏ import ROLES thừa)}, src/payload.config.ts, src/app/(payload)/admin/importMap.js (regen), docs/ARCHITECTURE.md (7→8 nhóm). Grep: không có link nội bộ tới /admin/collections/lead-activities|private-files.
- Verify: `pnpm vitest run src/components/admin src/lib/admin` 33 files/231 tests PASS (+ src/collections 30 files/213 PASS); `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope).
- Runtime check (form Lead join "Lịch sử chăm sóc", ảnh trước/sau, flash thu gọn): CHƯA làm — DB 127.0.0.1:5433 lên nhưng không có tài khoản admin test trong tay và DB dùng chung với repo chính (dev server Payload có thể push schema), nên không khởi dev server. Residual: (1) D1 dựa trên bằng chứng đọc node_modules (drawer overrideEntityVisibility=true), chưa thử thực tế; nếu thử hỏng → bỏ hidden của lead-activities, đưa vào "Nâng cao" (đổi 1 dòng LeadActivities.ts); (2) mức tương phản/hiển thị thật + vị trí vạch active (inset -37px tính theo nav padding 20px + indent 17px) cần mắt người xem ở 1440/375 sáng/tối.

### Round 2 (sửa theo review round 1)
- M1: vạch mục đang chọn = `calc(-1 * var(--nav-padding-inline-start, 20px) - #{$group-indent})`; `$group-indent` (10+6+1) là biến SCSS dùng chung với `.nav-group__content` (var Payload đổi 20/10/16px theo breakpoint — đã kiểm trong `@payloadcms/next/dist/prod/styles.css`). SCSS biên dịch OK bằng sass.
- M2: `.nav-group__toggle` min-height 44px + align-items center trong `@media (max-width: 767px)`.
- m1: vạch ngăn nhóm dùng `--admin-border-strong` (>= 3:1).
- m2: `NavAdvancedCollapse` có comment ghim Payload 3.91 internal markup; trước khi bấm đọc lại preference (vẫn chưa có) và kiểm toggle còn `--open`/còn trong DOM; lỗi đọc preference thì không bấm.
- m3: sửa tên comment ở `admin-groups.ts`.
- Thêm `src/collections/admin-hidden.test.ts` ghim `admin.hidden === true` cho LeadActivities + PrivateFiles.
- Verify: `pnpm vitest run src/components/admin src/lib/admin src/collections` 37 files/257 tests PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ngoài scope). Residual runtime-check như round 1.

## Close-out
- Acceptance: PASS ở mức code/test (6/6); xem trực quan + thử form Lead trên trình duyệt chưa làm (residual).
- Verify: vitest src/components/admin + src/lib/admin + src/collections 37 files / 257 tests PASS · typecheck PASS · lint 0 error.
- Reviewer verdict: PASS (r2, STRICT). MINOR còn lại: n1 toggle 36px đúng tại 768px (cùng breakpoint `.nav__link` sẵn có), n2 chưa test nhánh re-check trước khi click.
- Doc impact: SPECIFICATIONS.md FR-ADM-19 (delta BL-041) · docs/ARCHITECTURE.md (8 nhóm menu) · ERD/API_SPEC: no doc impact.
- Residual risk: chưa thử drawer Lịch sử chăm sóc trong form Lead trên app chạy thật (bằng chứng code node_modules: drawer `overrideEntityVisibility=true`); chưa có ảnh trước/sau 1440/375 sáng/tối; lần đầu vào "Nâng cao" có thể hiện mở thoáng qua rồi thu gọn; NavAdvancedCollapse phụ thuộc DOM Payload 3.91.
