# feature-admin-ux-audit-2 · phase-1-task-01 — Ẩn API, tắt "+ Thêm mới" inline ô dữ liệu nền, chữ "Tải lên" (A1, A2, A3)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 1. Báo cáo: `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.3.1, §2.3.4, §2.3.5.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn … audit lần 2, giai đoạn 1 (BL-051)" — mục A1, A2, A3.
- Plan: phase 1 = 3 task tuần tự (T01 cấu hình, T02 thanh công cụ danh sách, T03 màn sửa). User: "tự làm tự quyết nhé, đừng hỏi t" = auto proceed, bỏ checkpoint.

## Classification / Risk
- Type: **MODIFY** (chỉ cấu hình `admin` + chữ hiển thị).
- Risk: **MEDIUM** — helper áp cho mọi collection + global (shared config); không đổi schema/DB/access/API, không migration.
- Expected review level: **NORMAL** (reviewer tự nâng nếu thấy cần).
- Blast radius: mọi màn sửa/tạo admin (nút API), mọi ô quan hệ tới provinces/wards/staff, mọi ô upload.
- Doc impact: `SPECIFICATIONS.md` (đã có spec delta); dự kiến không đổi `docs/API_SPEC.md`/`docs/ERD.md`.
- Decision impact: không thêm `categories` (xem Quyết định).

## Scope
1. **A1 — ẩn API:** `admin.hideAPIURL: true` cho **mọi** collection (chỗ map chung `src/collections/admin-collections.ts` → `ADMIN_COLLECTIONS`) và **mọi** global (`src/payload.config.ts` `globals: [SiteSettings, Homepage, Header, Footer]` — thêm 1 chỗ map chung tương tự, không sửa lẻ từng file nếu tránh được). Collection do plugin sinh (vd `redirects` từ `src/collections/redirects-plugin.ts`) cũng phải ẩn nếu cấu hình được (`overrides`); không được thì ghi gap.
2. **A2 — tắt "+ Thêm mới" inline:** helper chung (đặt cạnh `src/lib/admin/list-filter.ts`, vd `src/lib/admin/master-data-relations.ts`) duyệt đệ quy fields (tabs/row/collapsible/group/array/blocks) và đặt `admin.allowCreate: false` cho field `relationship` có `relationTo` thuộc `provinces`, `wards`, `staff` (cả `relationTo` dạng mảng nếu mọi phần tử thuộc tập này). Áp trong cùng chỗ map chung collection + global. Không đổi `filterOptions`, `validate`, access, giá trị lưu. Field `relationship` khác (categories, developers, projects, rentals…) giữ nguyên.
   - Kiểm tra trong `node_modules/payload` 3.91 types rằng `admin.allowCreate` đúng là option của relationship field và ẩn cả nút "+" trong ô chọn lẫn hàng "Thêm mới" trong danh sách xổ.
3. **A3 — chữ "Tải lên":** khung upload (`@payloadcms/ui/dist/fields/Upload/Input.js`, class `.upload__createNewToggler`) dùng `t('general:createNew')` chung với nút "Tạo mới" ở danh sách → **KHÔNG** ghi đè `general:createNew` toàn cục. Chọn cách ít hack nhất, theo thứ tự ưu tiên:
   a) nếu Payload 3.91 có prop/khoá riêng cho nút này → dùng;
   b) client component nhẹ (gắn vào `admin.components.providers` có sẵn hoặc provider mới) đổi chữ + `aria-label` của `.upload__createNewToggler` thành "Tải lên" (MutationObserver giới hạn, idempotent, ngắt khi unmount);
   c) CSS thay chữ chỉ là phương án cuối (không đổi tên đọc cho trình đọc màn hình → không đạt acceptance a11y).
   Chuỗi "Tải lên" khai báo trong `src/lib/admin/payload-vi-overrides.ts` (export riêng, có test) — đây là ngoại lệ hẹp đã ghi trong spec delta cho quy tắc BL-040 "ghi đè ở MỘT nơi". Áp cho mọi ô upload (ảnh đơn, `gallery` hasMany, drawer chọn ảnh). Ghi lý do chọn vào mục "Quyết định" của file này.

## Acceptance
- [ ] Không còn nút/tab "API" ở màn sửa mọi collection + global (test quét config; kiểm trình duyệt ít nhất Cho thuê + global Trang chủ).
- [ ] Ô Tỉnh/thành, Phường/xã (Dự án, Cho thuê, Tin BĐS, Tin tuyển dụng, Phường/xã→Tỉnh), Người tạo, Sale phụ trách, Người tải lên (Media): không còn "+ Thêm mới"/nút "+"; vẫn chọn/tìm được giá trị có sẵn; admin vẫn tạo Tỉnh/Phường/Nhân viên ở màn riêng.
- [ ] Ô upload hiện "Tải lên" (chữ + tên đọc); "Chọn từ thư viện" và kéo thả vẫn chạy; nút "Tạo mới" ở danh sách vẫn là "Tạo mới".
- [ ] Test quét config: mọi collection/global `hideAPIURL === true`; mọi relationship tới 3 slug trên có `allowCreate === false`; relationship khác không bị đổi.
- [ ] Không đổi schema (không migration; `src/payload-types.ts` không đổi trừ khi regen bắt buộc), không đổi access/API.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; importMap regen nếu thêm component (`pnpm generate:importmap`).

## Quyết định (change-request, auto proceed)
- **Không** thêm `categories` (spec-validator F1): change doc chỉ nêu Tỉnh/Phường/Người tạo/Sale phụ trách; tạo danh mục vốn đã chỉ admin (`Categories.ts` access) nên rủi ro rác thấp. Chủ đầu tư giữ nút (luồng hợp lệ khi đăng dự án mới).

## Verify
- `pnpm typecheck` · `pnpm lint` · `pnpm test` (lệnh từ `.context/project-config.md`).
- Trình duyệt (dev server `tami-dev`, `.claude/launch.json`): màn sửa Cho thuê (không có API, ô Tỉnh/Phường/Người tạo không có "+", ô ảnh "Tải lên"), global Trang chủ (không API). Tài khoản test nếu cần: email `@example.test`, xoá sau.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Quyết định (Builder)
- **A3 = phương án (b)**: Payload 3.91 không có prop/khoá riêng cho nút này (`Upload/Input.js` hard-code `t('general:createNew')` trong `.upload__createNewToggler`; không có `Label`/custom component slot) → (a) không khả thi. Dùng provider client `src/components/admin/UploadButtonLabel.tsx` (gắn vào `admin.components.providers`) đổi `textContent` + `aria-label` của `.upload__createNewToggler` thành "Tải lên" bằng MutationObserver (idempotent: chỉ ghi khi khác; ngắt khi unmount). Chuỗi nằm ở `UPLOAD_BUTTON_LABEL` trong `payload-vi-overrides.ts` (có test). Không ghi đè `general:createNew`.
- A1/A2: helper `src/lib/admin/master-data-relations.ts` (`withAdminUxDefaults`, `disableInlineCreateForMasterData`) áp trong `ADMIN_COLLECTIONS` và `ADMIN_GLOBALS` (mới, cùng file `admin-collections.ts`; `payload.config.ts` dùng `globals: ADMIN_GLOBALS`). `redirects` (plugin) ẩn API qua `overrides.admin.hideAPIURL`. `admin.allowCreate` là option có thật của relationship field (types.d.ts); xác nhận bằng trình duyệt.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở tools/task-dashboard/server.mjs) · `pnpm test` PASS 347 files / 3549 tests (gồm test mới `master-data-relations.test.ts`, `UploadButtonLabel.test.tsx`).
- `pnpm generate:importmap` chạy; `importMap.js` thêm `UploadButtonLabel`.
- Trình duyệt (dev `localhost:3000`, tài khoản admin `@example.test` tạo tạm rồi xoá): Cho thuê edit — mọi tab không có nút "API" (doc-tabs chỉ còn "Chỉnh sửa"); Tỉnh/thành, Phường/xã, Người tạo không có nút "+" (Danh mục, Thuộc dự án vẫn còn "+"); tab Hình ảnh nút upload "Tải lên" (chữ + aria-label); mở drawer "Chọn từ thư viện" nút "Tạo mới" trong drawer vẫn "Tạo mới" (aria "Thêm mới: Ảnh, tệp"); danh sách Nhân viên nút "Tạo mới" giữ nguyên; global Trang chủ không có API; Media create: Người tải lên không có "+".
- Không đổi schema/access/API; `payload-types.ts` không đổi.

## Residual risk / gap
- Nút "Chọn tệp" của form tạo Media (upload collection gốc) không thuộc `.upload__createNewToggler`, giữ nguyên.
- A3 dựa vào class `.upload__createNewToggler` của Payload 3.91: nâng Payload cần kiểm lại (test jsdom chỉ khoá hành vi provider, không khoá class của Payload).
- Chưa kiểm GraphQL (đã tắt) và responsive (không đổi CSS).

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-1-task-01-round-1-review.md` — **NORMAL, PASS**. MINOR mở (không chặn), chuyển sang T02 xử lý: (1) `UploadButtonLabel` ghi `textContent` thay span `.btn__label` → ghi vào `.btn__label` nếu có; (2) bỏ `characterData: true`; (3) test unmount/idempotent; (4) rủi ro nhỏ cảnh báo hydration.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1**. `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 347 files / 3549 PASS.
- Spec Publisher: chạy 1 lần cuối BL-051 (spec delta F10 đã viết, chưa bump ở commit này).

## Doc impact
- no doc impact ngoài spec delta `SPECIFICATIONS.md` F10 (commit cùng spec-publisher cuối BL-051). Không đổi API/ERD.
