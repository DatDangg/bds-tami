Agent: spec-validator

# BL-051 feature-admin-ux-audit-2 — Phase review (GĐ1 + GĐ2), round 1

- Mode: Phase review (post-build), cả 2 giai đoạn.
- Nguồn đối chiếu: `SPECIFICATIONS.md` F10 dòng 132 (GĐ1: A1–A5, A7, A13) + dòng 134 (GĐ2: A6, A8–A12, A14); `spec/changes/2026-10-21-admin-ux-audit-2.md` (bảng A1–A12, quyết định Q1–Q3, Acceptance); 9 task file `tasks/feature-admin-ux-audit-2/*.md`; review reports `.context/review-reports/feature-admin-ux-audit-2-*`; code tại HEAD `6e65c31`.
- Commit: e83a86b, b7f762c, d641351 (GĐ1); 9f18876, a336fcf, 15d2e8b, e7641aa, e2c2473, 6e65c31 (GĐ2).
- Bỏ qua dòng version/CHANGELOG/test-scope (spec-publisher đang chạy song song).

## Verdict: PASS (built đủ; không có MISSING; gap đều là giới hạn Payload 3.91 đã ghi, hoặc residual MINOR)

## Kiểm tra chéo bất biến "không đổi schema/DB/access/API"
- `git diff --stat e83a86b~1 6e65c31 -- migrations src/access src/endpoints src/payload-types.ts` → chỉ `src/payload-types.ts` (197+/197-). Task P2-T05/T06 + reviewer xác minh là hoán vị thứ tự thành viên + chú thích (sorted diff); P2-T06 chạy `payload migrate:create` → "No schema changes detected". Không có migration, không đổi access/endpoint. Khớp spec.

## Ma trận coverage

| Req | Spec / change doc | Implementation (cite) | Task / review | Status | Note |
|---|---|---|---|---|---|
| A1 ẩn API | F10:132 (A1) | `src/lib/admin/master-data-relations.ts:27-29` `withAdminUxDefaults` → `hideAPIURL: true`; áp `ADMIN_COLLECTIONS` + `ADMIN_GLOBALS` (`src/collections/admin-collections.ts:64-69`, `src/payload.config.ts:64-65`); plugin `redirects` `src/collections/redirects-plugin.ts:24`; test quét `master-data-relations.test.ts:28-37` | P1-T01, r1 PASS | built | Collection hệ thống của Payload (`payload-preferences`, `payload-jobs`…) không qua map — vốn ẩn khỏi admin, không ảnh hưởng. |
| A2 tắt "+ Thêm mới" provinces/wards/staff | F10:132 (A2); CD acceptance "không chặn chọn giá trị có sẵn" | `master-data-relations.ts:4-24` đệ quy tabs/blocks/fields, chỉ đổi `allowCreate`; test quét relationship khác không đổi (`master-data-relations.test.ts:43`) | P1-T01 | built | Browser: Danh mục/Thuộc dự án vẫn có "+". Không thêm `categories` (quyết định ghi trong task, khớp spec liệt kê). |
| A3 "Tải lên" | F10:132 (A3) + ngoại lệ "ghi đè một nơi" | `UPLOAD_BUTTON_LABEL` trong `src/lib/admin/payload-vi-overrides.ts` (~:155), provider `UploadButtonLabel` (`payload.config.ts:45`) đổi `.btn__label` + `aria-label` | P1-T01 (+ carry-over P1-T02) | built | Gap 3.91 có lý do: `Upload/Input.js` hard-code `general:createNew`, không có slot. |
| A4 "Tạo mới" nút chính, Thùng rác phụ | F10:132 (A4); CD sáng/tối 375+1280 | `src/components/admin/styles/_list-toolbar.scss` (CSS lưới header) | P1-T02 STRICT PASS | built | Kiểm 1280 sáng/tối, 375 sáng; 375 tối/768 chưa chụp (residual). |
| A5 "Xuất Excel" tách chip | F10:132 (A5) | `LeadExportButton.tsx` (`.list-search-action` + icon), CSS `:has()` + `display: contents` | P1-T02 | built | Gap 3.91: không có slot trong SearchBar (chỉ `listMenuItems` popup) → CSS phụ thuộc DOM `DefaultListView`. |
| A13 Cột/Lọc chỉ admin, tách khỏi ô tìm | F10:132 (A13); CD Q1 | `AdminRoleAttribute.tsx` (provider), `_list-toolbar.scss:150-179` mặc định ẩn, chỉ hiện dưới `:root[data-admin-role="admin"]` (gồm cả panel) | P1-T02 | built | Spec cho phép rút icon ở màn hẹp — builder giữ chữ luôn hiện (hợp lệ, "được rút"). Không đổi access (URL `where` vẫn chạy, đúng spec). |
| A7 Lưu dính + Quay lại + Xem trên website | F10:132 (A7) | `DocumentNavLinks.tsx:18-44` (ẩn khi không collection / drawer `editDepth>1`; site link chỉ khi có `id` + `publicDocUrl(savedDocumentData)`), `src/lib/admin/public-doc-url.ts`, `withDocumentNavSlot`, `_doc-controls.scss` nền đặc | P1-T03 STRICT PASS | built | Sticky đã có sẵn ở 3.91 (Bước 0); gap ghi: `admin.preview` không phù hợp, `.doc-controls` thiếu nền, server slot thiếu `collectionSlug`. |
| A6 thanh hàng loạt nổi đáy | F10:134 (A6); CD sáng/tối 375+1280 | `src/components/admin/styles/_list-actions.scss` (`.list-selection` fixed bottom, đệm đáy `:has(.list-selection)`, loại trừ `.list-drawer__header`) | P2-T01 STRICT PASS | built (lệch nhỏ) | Spec: "ghim đáy **vùng nội dung**"; desktop căn giữa **viewport**, không trừ nav khi nav mở (residual ghi trong task). Không che phân trang (đo 375). |
| A8 Tổng quan thẻ | F10:134 (A8) | `QuickActions.tsx` (summary dạng `.tami-dash-action`, grid `minmax(min(240px,100%),1fr)`), `WebsiteShortcuts.tsx` (`<nav>`+h2+lưới thẻ icon+chevron), `hideFromNonAdmin` giữ | P2-T03 r1 FAIL → r2 PASS; F5 kiểm ở P2-T04 | built | 1280 sáng đo cùng cao 74px; 1280 tối chưa chụp (token chung). |
| A9 Media lưới | F10:134 (A9); CD "thumbnail, alt/tên, tìm/lọc/chọn, drawer không vỡ" | `_media-grid.scss` scope `.collection-list--media:not(:has(.list-drawer__header))`; `MediaTypeCell` + `media-type-label.ts` | P2-T02 PASS; carry-over P2-T03 (Tab tới link, ẩn ô thừa) | built | Drawer giữ bảng (spec cho phép). "Thùng rác như cũ" = Media không có trash → N/A, không mâu thuẫn. Mất sort theo cột trong lưới (residual). GAP-A11Y-1 (dưới). |
| A10 ô Liên kết dropdown | F10:134 (A10); CD "giữ format, không migration" | `NavLinkField.tsx` (SelectInput + "Địa chỉ khác (https://…)" :12, URL input con), `PAGE_LINK_KEY_MEANINGS` `src/lib/content/nav-link.ts:26-36` đúng 9 trang spec liệt kê; field vẫn `text` + `validateNavLink` | P2-T04 PASS; carry-over P2-T05 | built | Giá trị cũ URL → "Địa chỉ khác" (không mất dữ liệu). Xoá ô ghi `""` như cũ. |
| A11 Dịch AI một chỗ | F10:134 (A11) | `content-defaults.ts:156-157` collapsible không tên "Bản dịch tiếng Anh" sidebar; `hasEnglish` readOnly (test `form-friendly.test.ts:49`); Pages "Duyệt bản tiếng Anh" qua `translationActions`; global giữ `translationGroup()` | P2-T05 STRICT PASS; carry-over P2-T06 | built | Path `hasEnglish`/`translation.*` giữ (vỏ không tên). Chưa bấm dịch AI thật (fetch stub). |
| A12 cột "Thao tác" | F10:134 (A12) | `src/lib/admin/row-actions.ts:4` (7 slug khớp spec), `:48-52` edit = update∧owns, trash = update∧owns (khớp câu "admin hoặc author là mình, và có quyền sửa"), duplicate = create∧!disableDuplicate; `RowActions.tsx:69` ẩn ở trash/drawer/dòng đã xoá, `:53` 401/403/404 → tiếng Việt, ConfirmationModal; cột cuối `defaultColumns` (`row-actions.ts:10-15`) | P2-T01 + carry-over P2-T02 | built | Header cột vẫn hiện (ô trống) ở Thùng rác — Payload không ẩn cột theo `viewType`; spec yêu cầu ẩn nút → đạt. |
| A14 Trang chủ 5 tab | F10:134 (A14); CD Q3 | `src/globals/Homepage.ts:263-288` 5 tab không tên đúng nhóm (tab 1 gồm "Ô tìm kiếm trên banner"), mỗi khối collapsible không tên; `enabledField` đổi nhãn; test 97 đường dẫn y hệt (`Homepage.test.ts`) | P2-T06 PASS | built | Không thêm cờ Banner (spec cho phép). `blockOrder` không bọc collapsible (có lý do: điều khiển cả trang). |
| CD Acc: "Test hiện có xanh; gap 3.91 ghi rõ" | change doc | Lần cuối `pnpm test` 361 files / 3639 PASS, typecheck/lint 0 error | P2-T06 close-out | built | — |
| CD Acc: A4/A5/A6/A8 sáng/tối 375+1280 | change doc | xem từng dòng | — | partial (bằng chứng) | Mỗi mục thiếu 1–2 tổ hợp chụp (vd 375 tối A4/A5, 1280 tối A8); dùng token chung — residual, không chặn. |

## Câu spec bị code mâu thuẫn
- Không có mâu thuẫn chặn. Một lệch nhỏ về chữ: A6 "ghim đáy **vùng nội dung**" vs desktop `position: fixed` căn giữa viewport (không trừ nav mở). Đề xuất: hoặc chỉnh CSS căn theo vùng nội dung, hoặc chấp nhận và ghi residual (đã ghi trong P2-T01). Không cần sửa spec.
- Spec delta không còn câu cũ mâu thuẫn ("Hiển thị khối này", tab "Bản dịch", "Mã trang có sẵn" chỉ còn trong `docs/reviews/*` lịch sử).

## Gaps
- [MISSING]: không có.
- [PARTIAL]:
  - A6 vị trí thanh nổi theo viewport thay vì vùng nội dung (lệch chữ nhỏ) — P2-T01.
  - Acceptance kiểm sáng/tối × 375/1280 chưa đủ mọi tổ hợp cho A4/A5/A6/A8 — P1-T02, P2-T01, P2-T03.

## Payload 3.91 gaps (đã ghi, hợp lệ theo spec "giữ mặc định và ghi gap")
- A3: không có prop/khoá riêng cho nút upload → provider đổi DOM `.upload__createNewToggler`.
- A5/A6/A9: không có slot SearchBar / thanh chọn / view lưới → CSS trên selector nội bộ (`.list-controls`, `.list-selection`, `.collection-list--media`, `.thumbnail--size-small`) — dễ vỡ khi nâng Payload.
- A7: `admin.preview` không kiểm soát được điều kiện/nhãn; `.doc-controls` thiếu nền; server slot thiếu `collectionSlug`.
- A12: `DuplicateDocument`/`DeleteDocument` gắn ngữ cảnh form → dùng REST endpoint tương đương; không ẩn cột theo `viewType`.
- GAP-A11Y-1 (A9): ô "Chọn tất cả trên trang" (Media) không có accessible name — `CheckboxInput` 3.91 hard-code `aria-label=""`.

## Residual MINOR còn mở (nên ghi vào backlog/residual)
1. P2-T06 r1: `src/globals/Homepage.ts` 310 dòng (> 300) nên tách helper sang `src/globals/homepage/`; JSDoc `blocks.ts:43` còn "Thứ tự khối"; tên test nhắc "group/array"; `PATHS_BEFORE_A14` nên ghi nguồn commit `e2c2473`.
2. P1-T03: `public-doc-url.ts` chép logic `buildPublicWhere` — khi thêm hẹn giờ `publishedAt` (FR-ADM-16) phải sửa cả hai (ảnh hưởng A7 + A12); tin tuyển dụng quá hạn vẫn có "Xem trên website" (khớp trang công khai); guard "rời trang chưa lưu" của "Quay lại danh sách" chưa test; chưa thử Lưu thật để thấy link hiện ngay.
3. P1-T02: test style chỉ regex SCSS; `UploadButtonLabel` ghi vào node React quản lý (rủi ro khi nâng Payload); chưa kiểm Media 375/768, 375 tối, drawer với role sale.
4. P2-T01: ListDrawer thật chưa kiểm trình duyệt (chỉ unit); 403 thực tế chỉ unit; `ConfirmationModal` render theo từng dòng; thanh 375 cao 3 hàng.
5. P2-T02: nhãn loại tệp dài bị cắt; thẻ PDF/video chưa kiểm; mất sort theo cột trong lưới Media.
6. P2-T03: subgrid cần Chrome 117+/Safari 16+/Firefox 71+.
7. P2-T04: test mock `SelectInput`.
8. P2-T06: CSS `.collapsible__toggle` min-height 44px ở ≤767px áp mọi collapsible admin (blast radius nhỏ, có chủ đích).

## Verify
- Không chạy lại test suite (đã có kết quả close-out P2-T06: typecheck PASS, lint 0 error, test 361/3639 PASS). Lệnh git chỉ dùng `git log` / `git show --stat` / `git diff --stat`.
