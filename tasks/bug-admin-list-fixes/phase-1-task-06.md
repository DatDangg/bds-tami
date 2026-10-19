# bug-admin-list-fixes · phase-1-task-06 — Xuất Excel + Lọc dịch vào hàng thanh công cụ danh sách (#08)

- Change doc: `spec/changes/2026-10-19-admin-list-fixes.md` (BACKLOG BL-021, T6). Làm sau BL-016 (ô Lọc dịch đã là `SelectInput`).

## Classification / Risk
- Type: **MODIFY** (vị trí/bố cục UI admin; không đổi dữ liệu, API, quyền).
- Risk: **LOW–MEDIUM → NORMAL** (đổi slot của shared helper `withContentDefaults` → áp mọi collection nội dung; không đụng access/schema).

## Hiện trạng (đã xác minh trên code, Payload 3.91)
- `src/collections/Leads.ts:218` gắn `LeadExportSlot` vào `admin.components.beforeList`; `src/collections/_shared/content-defaults.ts:173` gắn `TranslationStatusFilter` vào `beforeList`.
- `@payloadcms/ui/dist/views/List/index.js:152`: `BeforeList` render **ngoài** `Gutter` (`collection-list__wrap`), trên cả tiêu đề danh sách → hai control lơ lửng trên đầu trang, lệch lề với tiêu đề / ô tìm kiếm / pill Cột–Bộ lọc, mỗi control một khối riêng (`margin-bottom: 12px`, nút xuất còn inline style `display:flex; marginBottom:12`).
- `BeforeListTable` render **trong** Gutter, ngay sau `ListControls` (hàng tìm kiếm + Cột + Bộ lọc), trước bảng — và vẫn render khi danh sách rỗng (`docs.length === 0` → `NoListResults` đứng sau), nên bỏ lọc vẫn được khi lọc ra 0 kết quả.
- Không có slot cấu hình nào chèn thẳng vào hàng `SearchBar` của `ListControls` (`beforeActions` chỉ từ list drawer chọn nhiều; `listMenuItems` nằm trong popup "⋯" — không hợp với select + nút cần thấy ngay). Không dùng portal vào DOM nội bộ của Payload (giòn khi nâng cấp).

## Fix (phạm vi)
- Chuyển cả hai sang `admin.components.beforeListTable` (Leads + `withContentDefaults`, giữ nguyên nối thêm vào mảng có sẵn của collection).
- Một lớp CSS dùng chung cho mục thanh công cụ (vd `.list-toolbar-item`, trong `src/components/admin/styles/_controls.scss` hoặc `_lists.scss`): các mục `beforeListTable` xếp **cùng một hàng** ngay dưới hàng tìm kiếm/Cột/Bộ lọc, căn đáy (nút thẳng hàng với ô select), khoảng cách đều, tự xuống dòng khi hẹp; mobile (375px) mỗi mục full width hoặc wrap gọn, **không tràn ngang**; vùng bấm nút + select ≥ 44px.
- `LeadExportButton`: bỏ inline style bố cục, dùng class; giữ nguyên logic (quyền admin, drawer, trash, thông báo lỗi, `role=status/alert`). Thông báo dài wrap trong mục, không đẩy tràn.
- `TranslationStatusFilter`: giữ `SelectInput` + `<label>` bọc (a11y của BL-016), chỉ đổi class/khoảng cách cho hợp hàng.
- Cập nhật comment `LeadExportSlot` (beforeList → beforeListTable) + test liên quan; sinh lại `src/app/(payload)/admin/importMap.js` nếu cần (`pnpm generate:importmap`).
- KHÔNG đổi endpoint export, `export-filters`, `admin-ui` logic, quyền.

## Acceptance
- [ ] Danh sách nội dung (rentals/projects/property-posts/news…): ô "Trạng thái dịch" nằm ngay dưới hàng tìm kiếm/Cột/Bộ lọc, trong lề trang (thẳng lề tiêu đề), không còn ở trên tiêu đề.
- [ ] Leads (admin): nút "Xuất Excel" cùng vị trí thanh công cụ; sale không thấy; thùng rác + list drawer vẫn ẩn.
- [ ] Nếu một collection có cả hai mục → cùng một hàng (desktop ≥1024px), wrap gọn ở 375px, không tràn ngang.
- [ ] Vùng bấm nút + select ≥ 44px desktop + mobile.
- [ ] Lọc ra 0 kết quả vẫn thấy ô Lọc dịch để bỏ lọc.
- [ ] `pnpm test` (unit/ui liên quan) / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
- `pnpm vitest run --project unit --project ui`: 207 files / 2019 tests PASS (thêm test content-defaults: ô lọc dịch ở `beforeListTable`, giữ slot có sẵn, omit translation; test Leads dùng `beforeListTable`).
- `pnpm lint`: 0 error (2 warning cũ ở file khác). `pnpm typecheck`: PASS. `pnpm generate:importmap`: importMap không đổi nội dung (đường dẫn component giữ nguyên).
- Kiểm tra trực quan dev server (1280/375px): CHƯA chạy (DB worktree chưa migrate, không có tài khoản admin test); dựa trên đọc `@payloadcms/ui` List view: `BeforeListTable` render trực tiếp trong Gutter, ngay sau `ListControls`, kể cả khi 0 kết quả.

## Doc impact / Reconcile
- `no doc impact` (docs/DESIGN.md không mô tả vị trí control danh sách admin; không đổi API/schema/quyền).

## Kiểm tra trực quan (primary, dev :3026, DB tami_wt_bl021t6, admin test)
- 1024px: rentals — "Trạng thái dịch" ngay dưới hàng tìm kiếm/Hiển thị cột/Bộ lọc, x=20 thẳng lề tiêu đề; leads — "Xuất Excel" cùng vị trí (x=20, cao 44). Ghép thử cả hai: cùng một hàng (select 280×44 ở x=20, nút 104×44 ở x=316), thông báo dài wrap trong mục; 0 kết quả vẫn thấy ô lọc.
- 375px: hai mục xuống dòng gọn, `scrollWidth` = 375 (không tràn ngang), select + nút cao 44px, thông báo wrap cạnh nút.

## Review
- NORMAL PASS round 1 — `.context/review-reports/bug-admin-list-fixes-phase-1-task-06-round-1-review.md`; MINOR-1 (class modifier không dùng) đã bỏ; MINOR-2/3 ghi nhận, không sửa.

## Residual risk
- Không collection nào hiện có cả hai mục; "cùng hàng" kiểm bằng cách chèn tạm (DOM, chỉ để xem) mục xuất cạnh ô Lọc dịch ở rentals. Đáy nút lệch đáy ô select ~5px (khoảng dưới của wrapper field Payload).
- Đổi slot trong `withContentDefaults` áp mọi collection nội dung; phụ thuộc vị trí `BeforeListTable` của Payload 3.91 (nâng cấp Payload có thể đổi).
