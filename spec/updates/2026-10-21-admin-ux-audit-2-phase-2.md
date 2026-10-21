# Spec Update — 2026-10-21 admin-ux-audit-2-phase-2 (admin gọn — audit lần 2, giai đoạn 2)

**spec_version:** 1.44.0 → 1.45.0 (MINOR — đổi hiển thị/thao tác admin đã định: thanh hàng loạt nổi, cột "Thao tác" theo dòng, Media lưới, Tổng quan thẻ, ô "Liên kết" chọn trang, gom Dịch AI cột phải, Trang chủ 5 tab. Không breaking, không đổi schema/DB/access/API, không migration.)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-051**, MODIFY, giai đoạn 2 — đóng BL-051). Change doc `spec/changes/archive/2026-10-21-admin-ux-audit-2.md` (archive ngay sau bản phát hành này). Báo cáo nguồn: `docs/reviews/2026-10-21-admin-ux-audit-2.md`. Giai đoạn 1: `spec/updates/2026-10-21-admin-ux-audit-2-phase-1.md` (1.44.0).

Tasks + commits:
- `tasks/feature-admin-ux-audit-2/phase-2-task-01.md` — A6 + A12 — `9f18876` — STRICT PASS r1
- `phase-2-task-02.md` — A9 (+ carry-over A12) — `a336fcf` — NORMAL/STRICT PASS r1
- `phase-2-task-03.md` — A8 (+ carry-over A9) — `15d2e8b` — NORMAL FAIL r1 → PASS r2
- `phase-2-task-04.md` — A10 — `e7641aa` — NORMAL PASS r1
- `phase-2-task-05.md` — A11 (+ carry-over A10) — `e2c2473` — STRICT PASS r1
- `phase-2-task-06.md` — A14 (+ carry-over A11) — `6e65c31` — NORMAL PASS r1

Review: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-0{1..6}-round-*-review.md`. Spec validation GĐ2: `.context/review-reports/feature-admin-ux-audit-2-phase-2-spec-validation{,-round-2}.md` (r2 PASS có điều kiện R2-1 — đã xử lý trong P2-T01).

## Requirements (SPECIFICATIONS.md)

- **F10 / FR-ADM-19 — Giao diện quản trị (SỬA, thêm đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)")** + câu hướng dẫn tắt khối Trang chủ (dòng ~75) trỏ tới ô "Thứ tự các khối" ở tab "Chuyển đổi & Bố cục":
  - **A6** Chọn ≥ 1 dòng → cụm hàng loạt Payload thành thanh nổi ghim đáy (nền đặc, bóng, nút ≥ 44px), mất khi bỏ chọn; không che hàng cuối/phân trang; 375px không tràn; hành động/quyền Payload giữ nguyên.
  - **A8** Tổng quan: "Tạo loại khác" là thẻ cùng tỉ lệ các thẻ thao tác nhanh; "Sửa website" là lưới thẻ điều hướng (icon + chevron), tiêu đề mục.
  - **A9** Media (màn danh sách) dạng lưới thẻ: ảnh ≥ 120px giữ tỉ lệ, alt hoặc tên tệp gọn, loại tệp; bấm thẻ → màn sửa; tìm/chip/lọc/phân trang/chọn nhiều vẫn chạy; drawer chọn ảnh giữ bảng.
  - **A10** Ô "Liên kết" (`navLinkField`: menu đầu trang, chân trang, nút Trang chủ) chọn trang theo tên tiếng Việt + "Địa chỉ khác (https://…)"; giá trị lưu giữ nguyên định dạng (mã trang / URL), `validateNavLink` giữ; giá trị cũ hiển thị đúng.
  - **A11** Dịch AI một chỗ: "Có bản tiếng Anh" (chỉ đọc) + tóm tắt + "Dịch lại bằng AI" (+ "Duyệt bản tiếng Anh" Trang pháp lý) cùng một khối cột phải; bỏ tab "Bản dịch" ở collection; đường dẫn `hasEnglish` / `translation.*` giữ; global giữ khối bản dịch ở chỗ cũ.
  - **A12** Cột "Thao tác" cuối bảng 7 collection có trang công khai: Xem trên web (chỉ khi công khai, như A7) · Sửa · Nhân bản (không có ở Trang pháp lý) · Xoá vào Thùng rác (xác nhận). Hiện theo quyền collection **và** quy tắc dòng (sale chỉ dòng `author` = mình); **Xoá** hiện khi admin hoặc `author` là mình, và có quyền sửa — không xét quyền xoá cấp danh sách. Ẩn ở Thùng rác; hiện mặc định; người đã lưu cột riêng phải tự bật.
  - **A14** Global Trang chủ 5 tab theo luồng trang; mỗi khối là collapsible có tiêu đề; công tắc đổi nhãn "Hiện khối này trên web"; đường dẫn dữ liệu/API giữ, không field mới.

## Quyết định as-built

| Mục | Cách làm | Ghi chú |
|---|---|---|
| A6 | Thuần CSS `_list-actions.scss`: desktop `.list-selection` → `position: fixed; bottom: 16px`, nền `--admin-surface`, bóng, z-index 20; ≤ 768px tô thanh `.collection-list__list-selection` có sẵn (BL-024); `.collection-list:has(.list-selection)` đệm đáy 140px; loại trừ `.list-drawer__header` | Không thay view List |
| A12 | Trường `ui` cột cuối qua pipeline `admin-collections.ts` → `RowActionsCell` / `RowActions`; quy tắc `src/lib/admin/row-actions.ts`: `author` so cả id lẫn object populate, thiếu `author` → sale không có Sửa/Xoá; Xoá = (`admin` hoặc sở hữu) **và** `permissions.update`; PATCH `deletedAt` sau hộp xác nhận; 403/404 → toast tiếng Việt "không có quyền"; ẩn khi `drawerSlug`, Thùng rác, dòng đã xoá; `encodeURIComponent(locale)` | Spec-validator R2-1 phương án (a); carry-over P2-T02 thêm điều kiện `update` + 404 |
| A9 | Thuần CSS `_media-grid.scss` phạm vi `.collection-list--media:not(:has(.list-drawer__header))`; `tbody` grid `auto-fill minmax(150px,1fr)`; thẻ `tr` grid 4 hàng, `a` subgrid (Tab tới được, focus ring trên lớp phủ); ẩn mọi ô trừ `_select/filename/alt/mimeType`; checkbox 44×44 góc trái, thẻ chọn viền nhấn; `MediaTypeCell` + `mediaTypeLabel` ("Ảnh · WEBP", "PDF", "Video · MP4") gắn `mimeType.admin.components.Cell` | Drawer giữ bảng gốc (có cột loại tệp dễ đọc) |
| A8 | `QuickActions`: `<details>/<summary>` thẻ `.tami-dash-action`; `.tami-dash-actions` grid `minmax(min(240px,100%),1fr)`; `WebsiteShortcuts`: `<nav>` + `h2.tami-dash__section-title` + lưới thẻ (icon + chevron); transition chỉ khi `prefers-reduced-motion: no-preference` | Vẫn `hideFromNonAdmin` |
| A10 | Field client `NavLinkField` (`useField` + `SelectInput`) + `NavLinkUrlInput`; field vẫn `type: "text"`, `validateNavLink`, hook trim; `navLinkChoice` suy lựa chọn từ giá trị (mã → trang, URL/lạ → "Địa chỉ khác", trống → chưa chọn); ô không bắt buộc xoá → `""` | `payload-types.ts` chỉ đổi chú thích |
| A11 | `gatherTranslationBlock` (`content-defaults.ts`) gom `hasEnglish` + `translationSummary` + `retranslateAction` + actions collection vào collapsible không tên "Bản dịch tiếng Anh" (`position: "sidebar"`, mở sẵn); nhóm `translation` collection = `translationDataGroup()` (ẩn, giữ dữ liệu); global = `translationGroup()` | `payload-types.ts` chỉ hoán vị thứ tự |
| A14 | `homepageTabs()` 5 tab không tên + collapsible không tên (`homepageBlock`) quanh mỗi group (group `label: false`); khối đầu tab mở, sau thu gọn; "Thứ tự các khối" không bọc, cuối tab 4; `enabledField` đổi nhãn (11 công tắc); không thêm cờ cho Banner; test so 97 đường dẫn trước/sau | `migrate:create`: "No schema changes detected" cho cả BL-051 |

## Code (as-built)

- `9f18876`: `src/lib/admin/row-actions.ts` (+test), `src/components/admin/RowActions.tsx` (+test), `RowActionsCell.tsx`, `styles/_list-actions.scss`, `list-actions-style.test.ts`, `custom.scss`, `admin-collections.ts`, `importMap.js`.
- `a336fcf`: `styles/_media-grid.scss`, `MediaTypeCell.tsx` (+test), `src/lib/admin/media-type-label.ts` (+test), `media-grid-style.test.ts`, `src/collections/Media.ts`, `custom.scss`, `importMap.js`, carry-over `row-actions.ts` / `RowActions.tsx` (+test).
- `15d2e8b`: `dashboard/QuickActions.tsx`, `WebsiteShortcuts.tsx`, `DashboardIcons.tsx`, `DashboardParts.test.tsx`, `styles/_dashboard.scss`, `styles/_media-grid.scss`.
- `e7641aa`: `NavLinkField.tsx` (+test), `src/fields/nav-link.ts`, `src/lib/content/nav-link.ts`, `styles/_controls.scss`, `payload-types.ts`, `importMap.js`.
- `e2c2473`: `src/collections/_shared/content-defaults.ts` (+test), `src/fields/translation.ts`, `form-friendly.test.ts`, `src/lib/admin/form-layout.ts` (+test), `src/collections/Pages.ts`, `NavLinkField.tsx` (+test), `tests/integration/retranslate.test.ts`, `payload-types.ts`.
- `6e65c31`: `src/globals/Homepage.ts` (+`Homepage.test.ts`), `src/globals/homepage/blocks.ts`, `src/fields/translation.ts`, `TranslationSummary.tsx`, `styles/_forms.scss`, `tests/unit/admin-labels.test.ts`, `payload-types.ts`.

## Ảnh hưởng

- **Trực tiếp:** danh sách 7 collection nội dung (cột Thao tác, thanh hàng loạt), mọi danh sách có chọn nhiều (A6), Media danh sách + drawer chọn ảnh, `/admin` Tổng quan, Header/Footer/Trang chủ (ô Liên kết), form collection nội dung + Danh mục + Chủ đầu tư + Trang pháp lý (khối dịch), global Trang chủ (5 tab).
- **Phụ thuộc:** drawer chọn quan hệ (không có cột Thao tác, không thanh nổi), website công khai đọc `navLink` + khối Trang chủ (giá trị/đường dẫn không đổi), API dịch lại / duyệt EN.
- **Hồi quy:** giai đoạn 1 (A1–A5, A7, A13), BL-050, chip BL-022/039, ô "Trạng thái dịch", link menu công khai, trang chủ công khai.
- Không migration, không đổi schema/access/API. Doc: no doc impact ngoài spec delta.

## Residual / gap

- **GAP-A11Y-1:** ô "Chọn tất cả trên trang" (Media lưới) không có tên đọc — Payload 3.91 `CheckboxInput` hard-code `aria-label=""`.
- Media lưới mất sắp xếp theo cột (thead ẩn); mặc định mới nhất trước.
- A6 / A9 / A13 dựa class nội bộ Payload 3.91 (`.list-selection`, `.collection-list__list-selection`, `.collection-list--media`, `.list-drawer__header`…) — kiểm lại khi nâng Payload; subgrid cần Chrome 117+ / Safari 16+.
- Sale đã lưu cột riêng trước BL-051 không thấy cột "Thao tác" (không có "Hiển thị cột" để bật) — chấp nhận.
- Cột "Thao tác" vẫn còn tiêu đề (ô trống) ở chế độ Thùng rác.
- Chưa kiểm thật: 403 từ server khi bấm (chỉ test đơn vị), bulk Xoá thật trên Media, thẻ PDF/video, bấm "Dịch lại bằng AI" thật, sáng/tối đủ mọi tổ hợp.
- MINOR review mở: `Homepage.ts` 310 dòng (nên tách helper); JSDoc `blocks.ts:43` còn tên cũ.
