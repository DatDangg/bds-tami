# feature-admin-form-ux-polish · phase-1-task-03 — Nút tạo mới cạnh ô quan hệ: tách rời ô, chỉ icon "+"

- Change doc: `spec/changes/2026-10-22-admin-form-ux-polish.md` (BACKLOG BL-058, mục 3)
- Spec: FR-ADM-19 (BL-042 "nút thêm nhanh cạnh ô quan hệ có chữ/tooltip 'Thêm mới'") — đổi theo spec delta mục 3
- Status: approved 2026-10-22 · Wave 1 (song song với T01, T02)

## Hiện trạng (change-request đã kiểm)
- `src/components/admin/styles/_forms.scss:83-93` `.relationship-add-new__add-button` thêm chữ bằng `&::after { content: "Thêm mới"; }`, `min-height/min-width: 36px`; `:110-115` mobile 44px.
- Payload `@payloadcms/ui/dist/elements/AddNewRelation/index.scss:14-36` dán nút vào ô: `margin-left: -1px`, `border-top-left-radius: 0; border-bottom-left-radius: 0` (cả nhánh 1 collection và nhánh popup nhiều collection, `.doc-drawer__toggler`).
- Markup: `AddNewRelation/index.js:211-236` — 1 collection: nút + `Tooltip` (`relationship-add-new__tooltip`, chữ `t("fields:addNew")`); nhiều collection: `Popup` button có `tooltip`.
- Thấy ở: "Danh mục" (Tin BĐS), "Dự án liên quan", "Tin cho thuê liên quan" (Dự án/Cho thuê) và mọi ô relationship có quyền tạo.

## Classification / Risk
- Type: **MODIFY** (CSS admin dùng chung). Risk: **LOW–MEDIUM** (mọi ô quan hệ). Reviewer: **NORMAL**.

## Yêu cầu thực hiện
1. Bỏ `::after "Thêm mới"`. Nút là **ô vuông** chỉ icon "+" (giữ icon Payload), **cách ô ~8px**, viền + bo góc đủ 4 góc theo token control admin, cùng chiều cao ô chọn
   (desktop ≥ 36px, < 768px ≥ 44px), hover/focus-visible rõ (AA sáng/tối). Ghi đè `margin-left:-1px` + radius 0 của Payload cho cả nhánh popup (`.doc-drawer__toggler`).
2. Tên đọc / tooltip "Thêm mới": xác minh accessible name của nút (Tooltip text trong nút có đủ không — kiểm bằng accessibility tree). Thiếu thì bổ sung (ưu tiên giải pháp không thay component Payload; nếu phải dùng provider gắn `aria-label` thì ghi decision log).
   Tooltip hiện khi hover/focus, không bị cắt.
3. Ô `hasMany` (nhiều giá trị, ô cao lên) — nút căn trên, không kéo giãn. Màn hẹp 390px: ô + nút không tràn, không xuống dòng lệch.
4. Cập nhật test style nếu có test khoá CSS này (hiện chưa có test khoá chữ "Thêm mới"); thêm test nhỏ khoá: không còn `content: "Thêm mới"`, có radius/margin tách rời (theo mẫu `list-actions-style.test.ts`).

## Acceptance
- [ ] Nút tạo mới tách rời ô (khoảng cách rõ), chỉ icon "+", có tên đọc + tooltip "Thêm mới"; bấm vẫn mở drawer tạo mới như cũ (1 collection và nhiều collection).
- [ ] Không vỡ ở 390px; ô hasMany đúng; sáng + tối đạt AA viền/focus.
- [ ] Ảnh 1440 trước/sau: Danh mục (Tin BĐS), Dự án liên quan + Tin cho thuê liên quan (Dự án).
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `src/app/(payload)/custom.scss` (T02 thêm dòng `@use`), `payload.config.ts`, `importMap.js`, `RetranslateButton.tsx`. Chỉ sửa khối nút tạo mới trong `_forms.scss` (+ test). Không migration.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test`.
- Trình duyệt 1440 + 390, sáng + tối. Ảnh: `.context/review-reports/feature-admin-form-ux-polish/screens/t03-{before,after}-1440-*.png`.
- Report: `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-03-round-<R>-review.md`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Chỉ CSS + (nếu cần) tên đọc; không thay component `AddNewRelation` của Payload.

## Decision log (builder) — attempt 1
- Chỉ CSS trong `src/components/admin/styles/_forms.scss` (khối nút tạo mới): bỏ `::after "Thêm mới"`; nút 36x36 (mobile 44x44) chỉ icon, `margin-left: 8px`, viền `--admin-border-strong`, `border-radius: var(--admin-radius-s)` đủ 4 góc, nền `--admin-surface`, hover `--admin-surface-hover`, focus-visible outline 2px `--admin-focus`. Selector nhân đôi (`:not(--unstyled)` và `…doc-drawer__toggler`) để thắng đúng đặc hiệu của Payload; Payload nằm trong `@layer payload-default` nên CSS ngoài layer thắng không cần `!important`.
- `.relationship-add-new { align-items: flex-start }` + `.popup__trigger-wrap { height: auto }`: nút cao cố định, căn trên với ô hasMany (Payload mặc định `stretch`/`height:100%`).
- Tên đọc: theo mã nguồn Payload (`AddNewRelation/index.js:211-236`) Tooltip chứa chữ `fields:addNewLabel`/`fields:addNew` nằm TRONG nút nên là nội dung → tên đọc của nút; không thay component, không thêm `aria-label`. CHƯA kiểm được bằng accessibility tree (xem Residual).
- Test mới `src/components/admin/relationship-add-new-style.test.ts` (3 test, theo mẫu `list-actions-style.test.ts`): không còn `content: "Thêm mới"`, margin 8px + radius đủ góc + phủ `.doc-drawer__toggler`, mobile 44px, không `!important`.

## Verification summary (builder) — attempt 1
- `pnpm lint`: PASS (0 error; 2 warning có sẵn ở file khác, không thuộc scope).
- `pnpm typecheck`: PASS.
- `pnpm vitest run src/components/admin/relationship-add-new-style.test.ts`: 3/3 PASS.
- `pnpm test` (toàn bộ): xem dòng cập nhật bên dưới.

## Residual (builder)
- KHÔNG kiểm được trên trình duyệt và KHÔNG chụp được ảnh `t03-{before,after}-*.png`: Postgres server cổng 5433 kẹt ở "the database system is in recovery mode" suốt >10 phút (dev server trả 500 ở /admin/login, `pg` connect cùng lỗi) — lỗi hạ tầng dùng chung, không do code task. Chưa kiểm bằng mắt: khoảng cách 8px, căn trên ô hasMany, 390px, tương phản sáng/tối, tooltip không bị cắt, tên đọc trong accessibility tree (1 collection: Tin BĐS/Danh mục; nhiều collection). Reviewer/dispatcher cần chạy lại bước này khi DB lên (`pnpm dev --port 3103`, mở Danh mục ở Tin BĐS, Dự án liên quan + Tin cho thuê liên quan ở Dự án).
- Nếu accessibility tree cho thấy nút KHÔNG có tên: cần bổ sung `aria-label` — phương án không thay component Payload là CSS không đủ; sẽ phải dùng provider/`ButtonFromProps`, cần quyết định riêng.

### Cập nhật `pnpm test` (builder)
- FAIL toàn bộ chạy: 56 file fail / 336 pass; 6 test fail, 3227 pass, 720 skip. Nguyên nhân chính: ~50 file `tests/integration/*` không kết nối được Postgres ("recovery mode") — hạ tầng. 3 file ui fail (`ApplyForm.test.tsx`, `use-public-form.test.tsx`, `Header.test.tsx` focus trap) không liên quan scope (không đụng SCSS/relationship), nghi flake do tải máy (3 builder song song) — cần chạy lại khi DB lên + máy rảnh. Test mới của task PASS.

## Verification summary bổ sung (builder) — sau khi Postgres lên lại
- Kiểm trên Edge headless (CDP) với dev server cổng 3103, DB `tami_wt_bl058_t03`; trang `/admin/collections/property-posts/create` (Danh mục; tab "Thông tin tin đăng": Dự án liên quan, Tin cho thuê liên quan) và `/admin/collections/projects/create` (Danh mục; tab "Thông tin dự án": Chủ đầu tư).
- Sau: nút 36x36 (390px: 44x44), khoảng cách tới ô đúng 8px, `border-radius` 6px đủ 4 góc, `margin-left` 8px, `::after` = none (không chữ). Trước: 101x36, gap -1px, radius `0 6px 6px 0`, `::after "Thêm mới"`.
- Tên đọc: cả 6 nút đều có `aria-label` do Payload cấp, dạng "Thêm mới: Danh mục" / "Thêm mới: Dự án" / "Thêm mới: Tin cho thuê" / "Thêm mới: Chủ đầu tư"; accessibility tree (Accessibility.getFullAXTree) xác nhận. KHÔNG cần thêm gì. Nhánh nhiều collection: không có ô nào trong admin hiện tại dùng (đều 1 collection) nên chưa kiểm được; mã Payload dùng `Button` có tooltip `fields:addNew` ("Thêm mới").
- 390px: `scrollWidth` = 390, không tràn; ô + nút cùng hàng. Sáng/tối xem ảnh (viền border-strong, nền surface).
- Không có ô hasMany nào có nút tạo mới trong admin hiện tại → căn trên (`align-items:flex-start`) chưa kiểm bằng mắt; chỉ dựa CSS.
- Ảnh (png) tại `.context/review-reports/feature-admin-form-ux-polish/screens/`: `t03-before-1440-light-{property-posts,projects}-tab{0,1}.png`, `t03-after-1440-light-…`, `t03-after-1440-dark-…`, `t03-after-390-light-…`.
- `pnpm vitest run --project unit --project ui --maxWorkers=2`: 335 file / 3178 test PASS (3 file ui fail lần trước = do tải máy/DB). Integration KHÔNG chạy theo chỉ đạo.
- `pnpm lint` / `pnpm typecheck`: PASS (xem trên).

## Residual (cập nhật)
- Chưa kiểm bằng mắt: ô hasMany có nút tạo mới, nhánh Popup nhiều collection, tooltip hiện khi hover (không mô phỏng hover).
- `src/payload-types.ts` hiện báo modified chỉ do dev server ghi lại khác kết thúc dòng (không khác nội dung); KHÔNG stage file này.
- Đầu lượt `rm screens/*.png` để dọn ảnh nháp của tôi; ảnh jpg của T01/T02 còn nguyên (nếu T01/T02 từng có png trong thư mục này thì đã bị xoá — chụp lại nếu cần).
