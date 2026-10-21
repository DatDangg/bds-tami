# feature-admin-ux-audit-2 · phase-2-task-01 — Danh sách: thanh thao tác hàng loạt nổi đáy + cột "Thao tác" (A6, A12)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 2. Báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.1.4, §2.1.5, §3.1.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)".
- Plan: GĐ2 = 1 phase / 6 task tuần tự (trùng importMap / payload.config / style admin). Coordinator 2026-10-21: làm cả GĐ2 trong lượt này, không dừng hỏi (user "tự làm tự quyết, đừng hỏi").
- Phụ thuộc: sau phase 1 (d641351).

## Classification / Risk
- Type: **MODIFY** (chỉ `admin` / component hiển thị / CSS; không schema/DB/access/API, không migration).
- Risk: **MEDIUM-HIGH** — nút Xoá/Nhân bản theo quyền trên danh sách nội dung; CSS chung cho mọi danh sách.
- Expected review level: **STRICT**.
- Blast radius: mọi danh sách admin (A6), 7 collection có trang công khai (A12), drawer danh sách.
- Doc impact: spec delta F10 GĐ2; dự kiến không đổi API/ERD.

## Scope
1. **A6:** cụm chọn hàng loạt Payload 3.91 (`@payloadcms/ui` `views/List/ListSelection`, hiện ở hàng tiêu đề khi có dòng chọn) → thanh nổi ghim đáy vùng nội dung (ưu tiên CSS; component chỉ khi CSS không đủ; không thay view List). Nền đặc, bóng, nút ≥ 44px, chừa đệm đáy khi hiện để không che phân trang/hàng cuối; biến mất khi bỏ chọn. Không áp trong drawer chọn quan hệ nếu gây vỡ.
2. **A12:** trường `ui` "Thao tác" (Cell component) cuối `defaultColumns` cho projects, rentals, property-posts, news, job-postings, services, pages — áp chung (vd map trong `src/collections/admin-collections.ts` / helper cạnh `src/lib/admin/document-nav-slot.ts`). Icon + `aria-label` + tooltip: **Xem trên web** (tái dùng `src/lib/admin/public-doc-url.ts` của A7 — cùng điều kiện công khai; dùng `rowData` của Cell, thiếu trường cần thiết thì không hiện, KHÔNG fetch thêm từng dòng), **Sửa** (link màn sửa), **Nhân bản** (chức năng duplicate sẵn có của Payload 3.91; mở bản sao; KHÔNG hiện cho collection `disableDuplicate` — Pages), **Xoá** (đưa vào Thùng rác như nút Xoá của Payload — hộp xác nhận, sau đó làm mới danh sách). Hiện theo quyền Payload trả về (`useAuth().permissions`: create→Nhân bản, update→Sửa, delete→Xoá) **và** quy tắc theo dòng như server (`isAuthorOrAdmin`: sale chỉ Sửa/Xoá dòng có `author` = mình; đọc từ `rowData`, không fetch thêm); server từ chối → toast lỗi tiếng Việt, không vỡ trang. Thêm cột vào cuối `defaultColumns` (ngoại lệ BL-039 đã ghi trong spec). Ẩn ở chế độ xem Thùng rác. Cột không lọc/sắp xếp; `hideTechnicalListFields` không được ẩn cột này khỏi "Hiển thị cột".
3. Test: Cell (quyền, điều kiện xem web, xác nhận xoá), cấu hình cột.

## Acceptance
- [ ] Chọn ≥ 1 dòng: thanh nổi đáy hiện số đã chọn + thao tác Payload; bỏ chọn hết → ẩn; không che hàng cuối/phân trang.
- [ ] Sale, dòng của người khác: không có Sửa/Xoá; dòng của mình: có (Xoá theo quy tắc admin-hoặc-tác-giả, không xét quyền delete cấp danh sách). Test `author` dạng id và dạng object populate. Trang pháp lý không có Nhân bản.
- [ ] 7 danh sách có cột "Thao tác" với đúng nút theo quyền (admin đủ; sale chỉ nút được phép); Xem web chỉ khi công khai; Nhân bản tạo bản sao + mở; Xoá có xác nhận và vào Thùng rác.
- [ ] Không đổi schema (`src/payload-types.ts` không đổi trừ khi regen bắt buộc; không migration), access, API.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang; vùng bấm ≥ 44px; không phá GĐ1 (e83a86b, b7f762c, d641351) và BL-050 (827ea1c).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; `pnpm generate:importmap` nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev` (`.claude/launch.json`); tài khoản test `@example.test`, xoá theo id sau khi kiểm, không ghi mật khẩu ra chat/commit.

## Quyết định
- (change-request, spec-validator GĐ2 r2 R2-1, phương án a) Nút **Xoá** ("Chuyển vào Thùng rác") hiện khi `user.role === "admin"` **hoặc** `author` của dòng = user hiện tại; **không** xét quyền delete cấp danh sách (`permissions.collections[slug].delete`), vì server đã cho sale xoá mềm bài của mình → UI khớp server. Sửa vẫn theo quyền update + quy tắc theo dòng.
- (R2-3) `author` trong `rowData` có thể là id hoặc object đã populate → so cả hai dạng; test bắt buộc cho cả hai; thiếu `author` trong `rowData` → không hiện Sửa/Xoá cho sale (an toàn).
- (builder) **A6 chỉ bằng CSS** (`src/components/admin/styles/_list-actions.scss`, import trong `custom.scss`): Payload 3.91 vẽ cụm chọn hàng loạt ở HAI chỗ — desktop: `.list-selection` trong `.list-header__actions`; ≤ 768px: thanh `.collection-list__list-selection` đã `position: fixed` đáy (BL-024, `_lists.scss`). Desktop → `.list-selection` thành `position: fixed; bottom: 16px` giữa màn, nền `--admin-surface`, viền, `--admin-shadow-md`, `z-index: 20`; mobile → bổ sung nền đặc/viền/bóng cho thanh có sẵn. Nút `.list-selection__button` ≥ 44px. `.collection-list:has(.list-selection)` đệm đáy 140px nên không che hàng cuối/phân trang. Loại trừ `.list-drawer__header` (drawer chọn quan hệ). Không thay view List, không component mới; test chặn hồi quy trong `list-actions-style.test.ts` (các test BL-024 vẫn xanh).
- (builder) **A12 cơ chế:** trường `ui` `rowActions` ("Thao tác") thêm bằng `withRowActionsColumn` (`src/lib/admin/row-actions.ts`) trong pipeline `ADMIN_COLLECTIONS` (admin-collections.ts), nên áp chung cho 7 collection, ở CUỐI `fields` + `defaultColumns`; không đổi file collection riêng, không đổi schema (trường `ui` không có cột DB → không migration, `payload-types.ts` không đổi). `hideTechnicalListFields` giữ cột ui có `Cell` (chỉ ẩn lọc) → vẫn chọn được trong "Hiển thị cột". Cell = `RowActionsCell` (server, đọc `NEXT_PUBLIC_SITE_URL` qua `getEnv()` như `DocumentNavSlot`, chỉ chuyển các trường dòng cần) → `RowActions` (client). Quy tắc hiện nút là hàm thuần `rowActionVisibility` (test riêng); `isRowAuthor` so `author` dạng id (string/number) hoặc object populate `{ id }`, thiếu → false.
- (builder) **Không dùng `DuplicateDocument`/`DeleteDocument` của Payload** vì chúng là `PopupList.Button` gắn `useForm`/`useDocumentInfo` (ngữ cảnh màn sửa, không có ở dòng danh sách). Thay bằng gọi đúng endpoint Payload dùng: Nhân bản `POST /api/<slug>/<id>/duplicate?locale=` (rồi mở bản sao), Xoá `PATCH /api/<slug>/<id> { deletedAt }` (xoá mềm, giống nút Xoá của Payload) sau hộp `ConfirmationModal` của `@payloadcms/ui`, rồi `router.refresh()`. Server từ chối → toast tiếng Việt cố định (403/401: "Bạn không có quyền thực hiện thao tác này."; còn lại: "Không thực hiện được. Vui lòng thử lại."), không hiện thông điệp gốc tiếng Anh. Nhân bản = quyền `create` + không `disableDuplicate` (đọc từ cấu hình client; Pages có `disableDuplicate` nên không hiện).
- (builder) Ẩn nút khi: thùng rác (`viewType === "trash"`), dòng có `deletedAt`, trong `ListDrawer` (`useListDrawerContext().drawerSlug`, tránh xoá/mở trang khi đang chọn quan hệ). Xem trên web dùng `publicDocUrl` (A7) với `rowData` (không fetch); `slug`/`status` có sẵn vì list view lấy full doc.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (Builder)
- Files: `src/lib/admin/row-actions.ts` (+ `.test.ts`), `src/components/admin/RowActionsCell.tsx`, `RowActions.tsx` (+ `RowActions.test.tsx`), `list-actions-style.test.ts`, `src/components/admin/styles/_list-actions.scss`, `src/app/(payload)/custom.scss` (+1 `@use`), `src/collections/admin-collections.ts` (pipeline), `src/app/(payload)/admin/importMap.js` (generate:importmap).
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error, 2 warning cũ ở tools/task-dashboard) · `pnpm test` PASS (3610 test; 1 lỗi tự gây — test CSS đếm "!important" trong comment — đã sửa và chạy lại file đó PASS) · `pnpm generate:importmap` đã chạy (thêm `RowActionsCell`). Không đổi `payload-types.ts`, không migration, access/API không đổi.
- Test mới: 22 (quy tắc hiện nút: admin / sale dòng mình / dòng người khác, author id + populate + thiếu author, không xét quyền delete danh sách, disableDuplicate, chưa đăng nhập; cấu hình cột 7 collection ở cuối + không bị ẩn; Cell: 4 nút, ẩn ở thùng rác/đã xoá/drawer, xác nhận xoá trước khi PATCH, 403 → toast tiếng Việt, lỗi mạng khi nhân bản, nhân bản mở bản sao) + 3 test CSS.

### Bằng chứng trình duyệt (dev server đang chạy sẵn trên :3000, tài khoản admin + sale `@example.test` tạo bằng script tạm, đã xoá)
- Thanh chọn hàng loạt: chọn 1 dòng → thanh nổi đáy (1280px sáng + tối: hiện "Đã chọn 1 — Chọn tất cả (N) — Chỉnh sửa — Xóa"); bỏ chọn → biến mất (không còn `.list-selection`). 375px: thanh cố định đáy rộng 375px, cao 135px (xuống dòng), `scrollWidth = clientWidth = 375`; cuộn tới cuối: đáy phân trang 592px < đỉnh thanh 677px, không che.
- Admin, News: dòng đủ Sửa/Nhân bản/Xoá (+ Xem web khi đã xuất bản). Nhân bản → tạo bản sao và mở màn sửa bản sao. Xoá → hộp xác nhận tiếng Việt có tên bài → vào Thùng rác (bản ghi xuất hiện ở /trash, cột Thao tác trống ở đó).
- Sale, News: dòng của admin chỉ có Nhân bản; dòng của mình có Sửa/Nhân bản/Xoá; xoá dòng của mình thành công (toast "Đã chuyển vào Thùng rác.").
- Admin, 7 danh sách: Pages (2 dòng: Xem web + Sửa + Xoá, KHÔNG Nhân bản), Projects (10/10 dòng, author dạng id do `depth=0`), Rentals, Property-posts (dòng nháp không có Xem web), Job-postings, Services, News đều có cột "Thao tác" cuối; `scrollWidth` không vượt viewport ở 1280.
- Dọn: 3 bài test (kể cả trong Thùng rác) + 2 tài khoản test đã xoá vĩnh viễn; script tạm đã xoá.

## Residual risk
- Cột "Thao tác" vẫn hiện tiêu đề (ô trống) ở chế độ Thùng rác vì Payload không cho ẩn một cột theo `viewType` (chỉ ẩn nút, theo spec).
- Chưa mở thử trong ListDrawer thật (picker quan hệ) bằng trình duyệt — chỉ có test đơn vị (`drawerSlug` → không render) và CSS loại trừ `.list-drawer__header`.
- Trường hợp server từ chối thực tế (403) chỉ kiểm bằng test đơn vị (UI không cho bấm dòng của người khác); Xem trên web chỉ xét ngôn ngữ đang chọn của admin (cùng quy tắc A7).
- Thanh chọn hàng loạt desktop căn giữa viewport (không trừ chiều rộng nav khi nav mở); ở 375px thanh cao 3 hàng khi có "Chọn tất cả (N)".
- `ConfirmationModal` gắn trong từng dòng (render theo dòng, Payload ẩn khi đóng) — chấp nhận ở 10–100 dòng/trang.

## Payload 3.91 gaps
- `DuplicateDocument`/`DeleteDocument` gắn chặt ngữ cảnh form/document → không tái dùng được ở dòng danh sách; dùng endpoint REST giống chúng.
- Không có slot đặt component vào thanh chọn hàng loạt hay ẩn cột theo `viewType`; thanh nổi làm bằng CSS trên selector nội bộ (`.list-selection`, `.collection-list__list-selection`) — có thể vỡ khi nâng Payload.
- Selector dev-only: nút "N" của Next dev overlay chồng góc trái dưới (không có ở production).

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-01-round-1-review.md` — **STRICT, PASS**. MINOR (chuyển P2-T02): (1) `row-actions.ts:51` Xoá thiếu điều kiện quyền `update` (server PATCH deletedAt kiểm update + delete) → `owns && permissions.update`; (2) 404 do `where` access → báo như không có quyền; (3) `encodeURIComponent(locale)`; (4) test CSS chỉ dò chuỗi, chưa thử drawer thật.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1** (STRICT). `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 356 files / 3610 PASS (reviewer chạy full).

## Doc impact
- Spec delta F10 GĐ2 (publish cuối GĐ2). Không đổi API/ERD.
