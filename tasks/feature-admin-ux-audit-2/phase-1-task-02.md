# feature-admin-ux-audit-2 · phase-1-task-02 — Thanh công cụ danh sách: "Tạo mới" nút chính, Thùng rác phụ, "Xuất Excel" tách chip, Cột/Lọc chỉ admin + tách khỏi ô tìm (A4, A5, A13)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051) — giai đoạn 1; quyết định Q1 → A13. Báo cáo §2.1.1–2.1.3, §2.2.1, §4.4.
- Spec: `SPECIFICATIONS.md` F10, đoạn BL-051 — mục A4, A5, A13 (thay câu cũ BL-039 về vị trí "Lọc nâng cao" và câu về hàng "Xuất Excel" của commit c69f6e5).
- Phụ thuộc: sau T01 (cùng `payload.config.ts` / importMap).

## Classification / Risk
- Type: **MODIFY** (bố cục + hiển thị theo role).
- Risk: **MEDIUM-HIGH** — ẩn điều khiển theo role (RBAC hiển thị), CSS chung cho mọi danh sách (shared), đụng style vừa sửa ở BL-050 (827ea1c: `NavDashboardLink` + vị trí ô Ngôn ngữ trong `_surfaces.scss` — **không được phá**).
- Expected review level: **STRICT** (auth/RBAC + shared component/CSS).
- Blast radius: mọi màn danh sách admin (kể cả danh sách trong drawer chọn quan hệ), thanh chip lọc nhanh (BL-022/039), Lọc dịch, nút Xuất Excel Lead.
- Doc impact: spec delta đã có; không đổi API/ERD.

## Scope
1. **A4 — Tạo mới / Thùng rác:** hàng tiêu đề danh sách Payload 3.91 (`@payloadcms/ui` `views/List/ListHeader`, `elements/ListHeader`): "Tạo mới" thành **nút chính** (nền màu nhấn TAMI token sẵn có, chữ đạt AA, cao ≥ 44px) **ở góc phải**; cặp tab "Tất cả …" / "Thùng rác" thành nút/tab **phụ** không lấn nút chính. Ưu tiên CSS (`src/components/admin/styles/_lists.scss` hoặc `_surfaces.scss`); chỉ thêm component khi CSS không đủ, không thay view List gốc. Sáng/tối, 375px + 1280px, không tràn ngang; danh sách xổ Ngôn ngữ vẫn nằm trên cùng, không bị xuyên (BL-039).
2. **A5 — Xuất Excel:** `LeadExportSlot` (hiện ở `beforeListTable` cùng hàng chip qua `.list-toolbar-item`) → **nút hành động phụ** (icon tải xuống + "Xuất Excel") ở **cụm nút bên phải hàng tìm kiếm**, tách khỏi hàng chip. Giữ nguyên quyền, endpoint, tham số `search`/chip/where khi xuất, thông báo lỗi; test hiện có (`LeadExportSlot.test.tsx`, `LeadExportButton.test.tsx`) vẫn xanh hoặc cập nhật đúng hành vi mới. Chọn slot Payload hợp lệ trong 3.91 (vd `listMenuItems`, `afterListHeader`…) hoặc CSS đặt lại vị trí; ghi lý do.
3. **A13 — Cột/Lọc theo role + tách khỏi ô tìm:**
   - `.list-controls__toggle-columns` ("Hiển thị cột") và `.list-controls__toggle-where` ("Lọc nâng cao") **chỉ hiện với role `admin`** (`src/collections/Staff.ts`: admin/sale). Cơ chế đề xuất: client component (provider trong `admin.components.providers`) dùng `useAuth()` đặt `data-admin-role` trên `<html>`; CSS **mặc định ẩn** 2 nút, chỉ hiện khi `[data-admin-role="admin"]` (sale không thấy nháy; admin chậm 1 nhịp chấp nhận được). Nếu Payload 3.91 có cách server-side gọn hơn → ưu tiên, ghi lý do. Đây là gọn giao diện, **không** đổi access control.
   - Đổi tài khoản / đăng xuất → thuộc tính cập nhật theo `user` mới (không giữ role cũ).
   - **Tách khỏi viền ô tìm:** ô tìm có khung riêng (kính lúp + chữ); "Cột" và "Lọc" là 2 nút phụ (viền, icon + chữ) **ngoài khung, bên phải**, cùng hàng với "Xuất Excel" (Lead). Panel cột / trình dựng bộ lọc khi mở vẫn hiển thị đúng dưới hàng. Vùng bấm ≥ 44px, focus thấy rõ, AA sáng/tối, 375px không tràn (xuống dòng gọn).
   - Giữ lọc kỹ thuật BL-039 (`hideTechnicalListFields`), chip lọc nhanh, Lọc dịch, gợi ý "Tìm theo …".
4. Test: unit cho provider (đặt/cập nhật/gỡ `data-admin-role` theo user: admin, sale, null) + test style nếu repo đã có kiểu test đó (`admin-mobile-overflow.test.ts`, `admin-tokens.test.ts`).

5. **Carry-over MINOR từ review T01** (`src/components/admin/UploadButtonLabel.tsx`): ghi chữ vào `.btn__label` (fallback nút) thay vì `textContent` cả nút; bỏ `characterData: true`; test idempotent + disconnect khi unmount.

## Acceptance
- [ ] Mọi danh sách: "Tạo mới" là nút chính góc phải; Thùng rác/Tất cả là phụ; không quyền tạo → không có nút.
- [ ] Lead: "Xuất Excel" là nút hành động bên phải hàng tìm kiếm, không nằm trong hàng chip; xuất vẫn đúng bộ lọc hiện tại.
- [ ] Đăng nhập **sale**: không thấy "Hiển thị cột"/"Lọc nâng cao" ở mọi danh sách (Lead, Cho thuê, Tin tức…); chip + tìm kiếm vẫn chạy; dữ liệu vẫn chỉ lead được giao.
- [ ] Đăng nhập **admin**: thấy 2 nút, ngoài khung ô tìm, bên phải; mở được panel cột + trình dựng lọc như cũ.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang, vùng bấm ≥ 44px; BL-050 (mục Tổng quan, ô Ngôn ngữ / Xem website) không vỡ.
- [ ] Ô "Trạng thái dịch" (danh sách nội dung) vẫn ở hàng thanh công cụ dưới hàng tìm kiếm, cạnh chip, và vẫn hiện khi lọc ra 0 kết quả (spec-validator r2 LOW).
- [ ] Nút "Hiển thị cột" / "Lọc nâng cao" khi rút còn icon (màn hẹp) có `aria-label` đầy đủ; chữ nút giữ "Hiển thị cột" / "Lọc nâng cao" — test chuỗi "Lọc nâng cao" hiện có (`payload-vi-overrides.test.ts`) vẫn xanh.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; importMap regen nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`. Trình duyệt dev server `tami-dev`: admin + 1 tài khoản sale test (`@example.test`, tạo qua script/Local API, **xoá sau khi kiểm**), kiểm 375 + 1280, sáng + tối.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

---

## Builder report (BL-051 GĐ1 T02)

### Decisions (cơ chế + lý do)
- **A13 role gating:** provider client `AdminRoleAttribute` (`admin.components.providers`) dùng `useAuth().user.role` đặt `data-admin-role` trên `<html>`; CSS **mặc định ẩn** `.list-controls__toggle-columns/-where` và cả 2 panel `.list-controls__columns/-where`, chỉ hiện dưới `:root[data-admin-role="admin"]`. Panel cũng ẩn với sale vì URL có `where` (chip lọc nhanh, reload) làm Payload tự mở panel Lọc. Không có cách server-side gọn hơn trong Payload 3.91: `ListControls` không nhận role và `enableColumns/enableFilters` là prop client không cấu hình được theo user; slot server (`beforeList`…) phải khai ở từng collection + drawer. Cleanup effect gỡ thuộc tính khi unmount/đổi user.
- **A4:** thuần CSS (`_list-toolbar.scss`). `.list-header__title-and-actions {display: contents}` + lưới `title tabs create` -> "Tạo mới" nút chính (accent / on-accent, 44px) góc phải, cặp tab Tất cả/Thùng rác phụ (muted). ≤ 767px: 2 hàng (title|create / tabs). Header drawer (`.list-drawer__header`) giữ nguyên. Không quyền tạo -> Payload không render nút (Lead).
- **A5:** `listMenuItems` chỉ render vào popup "⋯" (không phải nút nhìn thấy) và không có slot nào trong `SearchBar`; giữ `LeadExportSlot` ở `beforeListTable` và CSS lưới: `.collection-list__wrap:has(> .list-search-action)` + `.list-controls {display: contents}` đưa nút lên cột 2 hàng 2 cùng hàng ô tìm. Chỉ áp khi nút có mặt (admin, ngoài drawer/thùng rác). `LeadExportButton`: đổi sang `.list-search-action` + icon tải xuống (aria-hidden); thông báo lỗi/khoá chuyển sang `div.list-toolbar-item` riêng (hàng đầy đủ bên dưới). Quyền/endpoint/tham số giữ nguyên.
- **Tách khỏi viền ô tìm:** khung (viền + nền) chuyển từ `.search-bar` sang `.search-filter`; `.search-bar__actions` (Cột/Lọc) ngoài khung, nút phụ viền + 44px. Màn hẹp: ô tìm 1 hàng, cụm nút xuống hàng dưới (flex:1). Nút luôn hiện chữ ("Hiển thị cột"/"Lọc nâng cao") nên không rút còn icon -> không cần thêm aria-label; chuỗi override giữ nguyên.
- **Scope 5:** `UploadButtonLabel` ghi vào `.btn__label` (fallback cả nút), bỏ `characterData`; thêm test fallback, idempotent, disconnect khi unmount.

### Files
- Mới: `src/components/admin/AdminRoleAttribute.tsx` (+ `.test.tsx`), `src/components/admin/styles/_list-toolbar.scss`, `src/components/admin/list-toolbar-styles.test.ts`.
- Sửa: `src/payload.config.ts` (provider), `src/app/(payload)/admin/importMap.js` (regen), `src/app/(payload)/custom.scss` (@use), `src/components/admin/LeadExportButton.tsx`, `src/components/admin/UploadButtonLabel.tsx` + `.test.tsx`, `src/collections/Leads.ts` (chỉ comment).

### Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`) · `pnpm test`: 3539 passed, 1 file fail do timeout hook 10s của `tests/integration/access.test.ts` khi chạy cả bộ cùng dev server; chạy riêng file đó 25/25 PASS (flaky do tải, không liên quan thay đổi). `pnpm generate:importmap` chạy, importMap có `AdminRoleAttribute`.
- Browser (dev server `tami-dev` port 3000, tài khoản test `@example.test` admin + sale, đã xoá bằng Local API; lần xoá đầu tạo nhầm thêm 2 tài khoản, đã dọn sạch bằng truy vấn email `ux-%@example.test`: left 0; có thể còn dòng audit log tạo/xoá staff):
  - Admin 1280 sáng: Lead (Tạo mới ẩn vì không có quyền tạo; Xuất Excel bên phải cùng hàng ô tìm với Cột/Lọc; chip + panel Lọc mở đúng dưới hàng, panel không đè chip), Cho thuê (Tạo mới chính góc phải, Cột/Lọc ngoài khung ô tìm, "Trạng thái dịch" vẫn ở hàng thanh công cụ cạnh chip), Tin tức, Media (Tạo mới + "Tải lên nhiều tệp").
  - Admin 1280 tối: Lead, Tin tức, Thùng rác Lead (không có Xuất Excel, Cột/Lọc hiện): nút chính accent tối chữ on-accent đọc rõ.
  - 375 (sáng): Lead + Cho thuê: `scrollWidth == innerWidth == 375`; ô tìm 343x44, Cột/Lọc 168x44 cùng hàng, Xuất Excel 128x44 hàng riêng, Tạo mới góc phải cùng hàng tiêu đề.
  - Sale 1280 (tối): Lead + Cho thuê (`?where[...]` có chip): `data-admin-role="sale"`, 2 nút + 2 panel `display:none`, ô tìm chiếm trọn hàng, không có Xuất Excel, chip vẫn chạy.
  - List drawer (media từ tin tức): header drawer giữ nguyên nút "Tạo mới" riêng; Cột/Lọc hiện với admin; nút upload đọc "Tải lên" với cấu trúc `.btn__content > .btn__label`.
  - BL-050: "Xem website" + ô "Ngôn ngữ" không đè nhau ở 1280 và 375, mục "Tổng quan" còn đầu sidebar.
  - Không kiểm: danh sách drawer ở role sale; 375 tối; tablet 768; bấm thật "Xuất Excel" tải file (không đổi logic, test unit LeadExportButton xanh).

### Residual risk / Payload 3.91 gaps
- Không có slot Payload nào đặt nút vào hàng tìm (chỉ popup "⋯" qua `listMenuItems`) nên A5 dựa CSS lưới + `:has()` + `display: contents` trên `.list-controls`: phụ thuộc cấu trúc DOM của `DefaultListView` 3.91 (cần kiểm lại khi nâng Payload). Chỉ áp cho danh sách có nút xuất.
- Admin thấy nút Cột/Lọc chậm 1 nhịp sau hydrate (đã chấp nhận); sale không thấy nháy.
- Role chỉ ở UI: sale vẫn có thể lọc bằng URL `?where=`, đúng vì access phía server không đổi.
- Style test chỉ khẳng định chuỗi SCSS nguồn, không thay cho kiểm trình duyệt (đã làm ở trên).

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-1-task-02-round-1-review.md` — **STRICT, PASS**. MINOR mở: (1) breakpoint 767/768 lệch giữa header và search/export → chuyển T03 thống nhất; (2) test style chỉ regex SCSS; (3) `UploadButtonLabel` vẫn ghi vào node React quản lý (rủi ro khi nâng Payload); (4) chưa kiểm trình duyệt Media 375px, 768px, 375 tối, drawer với sale.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1** (STRICT). `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 349 files / 3564 PASS (access.test.ts timeout lần builder là do tải, reviewer chạy full PASS).

## Doc impact
- no doc impact ngoài spec delta F10 (commit cùng spec-publisher cuối BL-051).
