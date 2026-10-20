# feature-admin-nav-clarity · phase-1-task-02 — Tổng quan: thẻ thao tác nhanh + lối tắt "Sửa website" + bỏ "Mục quản lý" + banner dịch lỗi nhẹ (BL-041)

- Change doc: `spec/changes/2026-10-20-admin-nav-clarity.md` (BACKLOG BL-041). Tham khảo `docs/reviews/2026-10-21-admin-audit.md` §2 (chỉ phần đã ghép vào change doc).
- Spec delta: FR-ADM-19 câu "**Tổng quan (BL-041)**" (SPECIFICATIONS.md).
- Phụ thuộc: phase-1-task-01 (đã commit — `ADMIN_NAV_GROUPS` có nhóm "Nâng cao").
- Trạng thái: `pending`

## Classification / Risk
- Type: **MODIFY** (component dashboard admin + banner; không đổi schema/access/API/endpoint).
- Risk: **MEDIUM** — dashboard hiển thị theo quyền (admin vs sale), số đếm lead chưa giao bằng Local API `overrideAccess:false` → review **STRICT** (RBAC hiển thị).
- Blast radius: `src/components/admin/dashboard/*` (+test), `src/components/admin/TranslationFailedBanner.tsx`, `src/components/admin/styles/_dashboard.scss`, `_surfaces.scss` (alert tone).
- Doc impact: FR-ADM-19 (spec delta đã ghi); `docs/DESIGN.md` nếu mô tả dashboard "Mục quản lý"/"Tạo mới" → reconcile as-built. ERD/API_SPEC: no doc impact.
- Migration: không.

## Quyết định (auto proceed — user chỉ thị 2026-10-21)
- D6 **Thẻ thao tác nhanh** (thay `<details>` "Tạo mới ▾" trong `DashboardHeader.tsx`), thứ tự: "Đăng tin cho thuê mới" (`rentals` create) → `/admin/collections/rentals/create`; "Phân công lead (N chưa giao)" — **chỉ admin** (chỉ admin phân công được, `Leads.assignedTo` access create/update `isAdmin`) — N = đếm lead `status = new` VÀ chưa có `assignedTo` (dùng lại đúng điều kiện chip `Mới (chưa giao)` trong `src/lib/admin/quick-filters.ts` / thẻ đếm "lead chưa phân công" có sẵn trong `dashboard-queries.ts`, không viết điều kiện thứ 2), link danh sách Lead đã lọc theo đúng `where` của chip đó; N = 0 vẫn hiện thẻ ("Phân công lead (0 chưa giao)") — hoặc chữ "Không có lead chờ phân công" — builder chọn 1, ghi lại; "Viết tin tức" (`news` create) → `/admin/collections/news/create`. Thẻ không đủ quyền thì không render (như lối tắt cũ). Thẻ lớn: vùng bấm ≥ 44px, chữ rõ, icon có sẵn `DashboardIcons.tsx`, AA sáng/tối, xếp hàng tự xuống dòng (375px 1 cột, không tràn ngang).
- D7 **"Tạo loại khác"**: các slug còn lại của `CREATE_SHORTCUT_SLUGS` (Dự án, Tin bất động sản, Tin tuyển dụng…) giữ trong menu phụ `<details>` nhỏ cạnh hàng thẻ (giữ cách không-JS hiện có), lọc theo quyền create; không còn mục nào → không render.
- D8 **Hàng "Sửa website"** ngay dưới hàng thẻ: Trang chủ · Menu đầu trang · Chân trang · Cấu hình chung → `/admin/globals/{homepage,header,footer,site-settings}`, nhãn từ `ADMIN_GLOBAL_LABELS`; chỉ hiện khi `user.role === "admin"` (cùng quy tắc `hideFromNonAdmin`, `src/access/hideFromNonAdmin.ts`) — dùng chính hàm đó hoặc `visibleEntities.globals`, không tự viết quy tắc khác.
- D9 **Bỏ khối "Mục quản lý"**: xoá `NavGroupCards.tsx`, `buildNavGroupCards`, `navGroups` khỏi `DashboardData`; xoá CSS không còn dùng (`.tami-dash-groups`, `.tami-dash-group*`); cập nhật/loại test tương ứng. `visibleEntities` trong `DashboardContext` giữ nếu D8 dùng, không thì bỏ.
- D10 **Banner dịch lỗi**: tone cảnh báo nhẹ (warning — dùng token warning sẵn có trong `_tokens.scss`/`status-tones.ts`, thêm biến thể `.tami-admin-alert--warning` nếu chưa có, AA sáng/tối), `role="status"` (không `alert`), câu: "**N bài chưa dịch được sang tiếng Anh** — bản tiếng Việt vẫn hiển thị bình thường." (N = tổng count các nhóm) + danh sách link từng loại ("Tin cho thuê: 2 bài — xem danh sách") giữ href lọc hiện có; trường hợp vượt hạn mức: "Dịch tự động tạm dừng vì đã hết hạn mức tháng — bản tiếng Việt vẫn hiển thị bình thường." + cùng danh sách. Vẫn chỉ admin, chỉ khi N > 0, logic `findFailedTranslations` giữ nguyên. Thêm test component (N>0 hiện đúng câu/role; N=0 không render; sale không render).
- D11 Bố cục Tổng quan: lời chào/ngày → hàng thẻ thao tác nhanh (+ "Tạo loại khác") → hàng "Sửa website" (admin) → banner dịch lỗi → thẻ đếm → lead mới nhất + bài của bạn.

## Scope
1. `dashboard-data.ts`/`dashboard-queries.ts`: dữ liệu thẻ thao tác nhanh (quyền + N chưa giao bằng Local API `overrideAccess:false` theo user), hàng Sửa website, bỏ navGroups.
2. Component: `DashboardHeader.tsx` (hoặc component mới `QuickActions.tsx` + `WebsiteShortcuts.tsx`), `DashboardView.tsx`, xoá `NavGroupCards.tsx`.
3. `TranslationFailedBanner.tsx` + style warning.
4. SCSS `_dashboard.scss`: thẻ lớn, hàng Sửa website, xoá CSS chết; responsive 375px.
5. Test: `DashboardParts.test.tsx`/`DashboardLinks.test.tsx`/`dashboard-queries.test.ts` cập nhật (admin thấy 3 thẻ + Sửa website; sale không thấy thẻ phân công + không thấy Sửa website; không quyền tạo → không thẻ; không còn "Mục quản lý"); test banner.
6. Ảnh trước/sau (1440 + 375, sáng/tối) nếu chạy được app; không thì residual.

## Acceptance
- [ ] Hàng "Sửa website" đầu Tổng quan (Trang chủ · Menu đầu trang · Chân trang · Cấu hình chung), chỉ admin.
- [ ] Không còn khối "Mục quản lý"; test dashboard cập nhật.
- [ ] Banner dịch lỗi: cảnh báo nhẹ (vàng/viền), câu trấn an + link danh sách; chỉ khi N > 0.
- [ ] Thẻ thao tác nhanh lớn: "Đăng tin cho thuê mới", "Phân công lead (N chưa giao)" (link danh sách lọc chưa giao), "Viết tin tức" — theo quyền role; còn đường tạo các loại khác.
- [ ] Không đổi schema/access/API.

## Verify
`pnpm test` (src/components/admin, src/lib/admin), `pnpm typecheck`, `pnpm lint`.

## Verification summary
(builder ghi)
