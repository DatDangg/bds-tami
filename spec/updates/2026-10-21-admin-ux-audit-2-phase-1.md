# Spec Update — 2026-10-21 admin-ux-audit-2-phase-1 (admin gọn cho người không rành kỹ thuật — audit lần 2, giai đoạn 1)

**spec_version:** 1.43.1 → 1.44.0 (MINOR — đổi hành vi/hiển thị admin đã định: ẩn API, bỏ thêm nhanh dữ liệu nền, nút Cột/Lọc chỉ admin, vị trí "Xuất Excel" và "Lọc nâng cao", thêm "Quay lại danh sách" / "Xem trên website". Không breaking, không đổi schema/API/quyền.)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-051**, MODIFY, giai đoạn 1). Change doc `spec/changes/2026-10-21-admin-ux-audit-2.md` (vẫn pending — giai đoạn 2 tiếp theo). Báo cáo nguồn: `docs/reviews/2026-10-21-admin-ux-audit-2.md`.
Tasks: `tasks/feature-admin-ux-audit-2/phase-1-task-01.md` (A1–A3, commit `e83a86b`), `phase-1-task-02.md` (A4, A5, A13, commit `b7f762c`), `phase-1-task-03.md` (A7, commit close-out cùng bản phát hành này).
Review: T01 NORMAL PASS r1 · T02 STRICT PASS r1 · T03 STRICT PASS r1 (`.context/review-reports/feature-admin-ux-audit-2-phase-1-task-0{1,2,3}-round-1-review.md`). Spec validation: `.context/review-reports/feature-admin-ux-audit-2-spec-validation{,-round-2}.md`.

## Requirements (SPECIFICATIONS.md)

- **F10 / FR-ADM-19 — Giao diện quản trị (SỬA, thêm đoạn "Admin gọn cho người không rành kỹ thuật — audit lần 2, giai đoạn 1 (BL-051)")**; đoạn này **thay** các câu cũ về vị trí "Lọc nâng cao" (BL-039) và hàng "Xuất Excel" (commit c69f6e5), và câu "còn lại lọc qua Lọc nâng cao" đối với sale:
  - **A1** Mọi collection + global: không còn nút/tab "API" (`admin.hideAPIURL`). REST/GraphQL không đổi.
  - **A2** Ô quan hệ tới `provinces`, `wards`, `staff` không còn "+ Thêm mới" inline (`admin.allowCreate: false`, helper chung, test quét config). Ô quan hệ khác (Danh mục, Chủ đầu tư, Dự án…) giữ nút.
  - **A3** Nút "Tạo mới" của khung upload đọc "Tải lên" (chữ + tên đọc). Ngoại lệ hẹp quy tắc BL-040: chuỗi khai ở `payload-vi-overrides.ts`, áp bằng provider riêng.
  - **A4** Danh sách: "Tạo mới" là nút chính (màu nhấn, ≥ 44px) góc phải; "Tất cả"/"Thùng rác" là phụ.
  - **A5** Lead: "Xuất Excel" là nút phụ (icon + chữ) bên phải hàng tìm kiếm, tách khỏi hàng chip; quyền/endpoint/tham số giữ nguyên.
  - **A13** "Hiển thị cột" và "Lọc nâng cao" chỉ hiện với role `admin` (ẩn mặc định, không nháy với sale); là gọn UI, **không** phải ranh giới quyền. Ô tìm có khung riêng; Cột/Lọc là 2 nút phụ ngoài khung, bên phải. Hệ quả (Q1): sale chỉ lọc bằng chip + ô tìm.
  - **A7** Màn sửa/tạo: thanh Lưu luôn thấy khi cuộn (nền đặc sáng/tối); "Quay lại danh sách" (collection); "Xem trên website" (tab mới, URL đúng ngôn ngữ) chỉ khi đã lưu + công khai.
- Giai đoạn 2 (thao tác hàng loạt, Tổng quan, Media lưới, chọn trang cho menu, gom Dịch AI, cột thao tác dòng, gom tab Trang chủ) **chưa** thuộc bản này.

## Quyết định as-built

| Mục | Cách làm | Ghi chú |
|---|---|---|
| A1/A2 | `src/lib/admin/master-data-relations.ts` (`withAdminUxDefaults`, `disableInlineCreateForMasterData`) áp trong `ADMIN_COLLECTIONS` + `ADMIN_GLOBALS` (`admin-collections.ts`); `redirects` (plugin) qua `overrides.admin.hideAPIURL` | `categories` không tắt (spec-validator F1) |
| A3 | Provider `UploadButtonLabel` (MutationObserver, ghi `.btn__label`, idempotent, disconnect khi unmount) | Không ghi đè `general:createNew` toàn cục |
| A4 | Thuần CSS `_list-toolbar.scss` (lưới title/tabs/create; ≤ 768px 2 hàng) | Không quyền tạo → Payload không render nút |
| A5 | Giữ `LeadExportSlot` ở `beforeListTable`, CSS lưới `:has(> .list-search-action)` + `.list-controls {display: contents}` | Payload 3.91 không có slot trong hàng tìm |
| A13 | Provider `AdminRoleAttribute` đặt `data-admin-role` trên `<html>` từ `useAuth()`; CSS ẩn nút + panel trừ `:root[data-admin-role="admin"]` | Sale vẫn lọc được qua URL `?where=` (đúng — access server không đổi) |
| A7 | Slot `edit.beforeDocumentControls` → `DocumentNavSlot` (server: `NEXT_PUBLIC_SITE_URL`) + `DocumentNavLinks` (client: `useDocumentInfo().savedDocumentData`, `useLocale`); URL qua `src/lib/admin/public-doc-url.ts` → `resolveInternalDocHref`; điều kiện = `buildPublicWhere` (status công khai, Cho thuê thêm `rented`, `deletedAt` rỗng, EN cần `hasEnglish`) | Không dùng `admin.preview`; ẩn trong drawer (`useEditDepth() > 1`) và khi chưa có `id`; global không gắn |

## Code (as-built)

- T01 (`e83a86b`): `src/lib/admin/master-data-relations.ts` (+test), `src/components/admin/UploadButtonLabel.tsx` (+test), `src/lib/admin/payload-vi-overrides.ts`, `src/collections/admin-collections.ts`, `src/collections/redirects-plugin.ts`, `src/payload.config.ts`, `importMap.js`.
- T02 (`b7f762c`): `src/components/admin/AdminRoleAttribute.tsx` (+test), `src/components/admin/styles/_list-toolbar.scss`, `list-toolbar-styles.test.ts`, `LeadExportButton.tsx`, `UploadButtonLabel.tsx` (+test), `custom.scss`, `payload.config.ts`, `Leads.ts` (comment), `importMap.js`.
- T03: `src/components/admin/DocumentNavSlot.tsx`, `DocumentNavLinks.tsx` (+test), `src/lib/admin/public-doc-url.ts` (+test), `src/lib/admin/document-nav-slot.ts` (+test), `src/components/admin/styles/_doc-controls.scss` (+`doc-controls-styles.test.ts`), `admin-collections.ts`, `custom.scss`, `_list-toolbar.scss` (breakpoint 767 → 768) + test, `importMap.js`.

## Ảnh hưởng

- **Trực tiếp:** mọi màn sửa/tạo admin (API, thanh Lưu, 2 link), mọi ô quan hệ Tỉnh/Phường/nhân viên, mọi ô upload, mọi màn danh sách (Tạo mới/Thùng rác, Cột/Lọc theo role, khung ô tìm), Lead (Xuất Excel).
- **Phụ thuộc:** list drawer chọn quan hệ, drawer sửa nhanh, Media upload/thư viện.
- **Hồi quy:** header BL-050 (Tổng quan, ô Ngôn ngữ / Xem website), chip lọc nhanh BL-022/039, lọc kỹ thuật BL-039, ô "Trạng thái dịch", Xuất Excel đúng bộ lọc, drawers.
- Không migration, không đổi schema/access/API. Doc: no doc impact ngoài spec delta (không đổi `docs/API_SPEC.md` / `docs/ERD.md`).

## Residual / gap

- A3, A5, A7 dựa cấu trúc DOM/class Payload 3.91 (`.upload__createNewToggler`, `DefaultListView`, `.doc-controls`) — kiểm lại khi nâng Payload.
- `public-doc-url.ts` chép điều kiện `buildPublicWhere`; khi thêm hẹn giờ `publishedAt` (FR-ADM-16) phải sửa cả hai.
- Tin tuyển dụng quá hạn vẫn có "Xem trên website" (trang chi tiết công khai vẫn mở).
- Chưa kiểm: Lưu thật rồi thấy "Xem trên website" hiện ngay; cảnh báo rời trang chưa lưu của "Quay lại danh sách"; drawer ở role sale; 768px; 375 tối; bấm thật "Xuất Excel".
