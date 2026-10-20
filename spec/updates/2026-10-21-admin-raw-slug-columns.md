# Spec Update — 2026-10-21 admin-raw-slug-columns (cột loại dữ liệu hiện tên tiếng Việt thay mã thô)

**spec_version:** 1.34.1 → 1.35.0 (MINOR — thêm yêu cầu hiển thị admin; không đổi schema, slug, URL, access control, endpoint)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-043**, MODIFY). Change doc `spec/changes/2026-10-20-admin-raw-slug-columns.md` (archive ở close-out → `spec/changes/archive/2026-10-20-admin-raw-slug-columns.md`). Task `tasks/feature-admin-raw-slug-columns/phase-1-task-01.md`. Review: `.context/review-reports/feature-admin-raw-slug-columns-phase-1-task-01-round-1-review.md` (NORMAL, PASS r1).

## Requirements (SPECIFICATIONS.md)

- **FR-ADM-19 — Giao diện quản trị (ĐỔI):** thêm câu "**Cột loại dữ liệu (BL-043)**": ô "Loại dữ liệu" (Nhật ký thao tác, trường `collection`) và "Loại nội dung" (Lượt bấm liên hệ + Thống kê liên hệ theo ngày, trường `refCollection`) hiện tên tiếng Việt số ít lấy từ `collection-labels.ts` thay mã thô, cả danh sách lẫn màn chi tiết; mã lạ hiện nguyên giá trị, trống → `—`; lọc/sắp xếp/xuất/API vẫn theo giá trị gốc, không đổi schema.

## Hành vi bị thay thế

| Trước | Sau (BL-043) |
|---|---|
| Ô danh sách hiện mã thô `leads`, `rentals`, `job-applications`… | Hiện tên số ít: "Lead", "Tin cho thuê", … (từ `collectionDisplayName`) |
| Màn chi tiết chỉ có ô mã read-only | Ô mã read-only giữ nguyên + dòng gợi ý "Tên gọi: <tên>" ngay dưới |
| — | Mã không có trong `collection-labels.ts` → hiện nguyên giá trị; rỗng/null → `—` |

Không đổi: giá trị lưu DB, ô lọc (ô chữ, nhập mã gốc), sắp xếp, xuất, API.

## Code (as-built)

- `src/lib/admin/collection-labels.ts` — thêm `collectionDisplayName(slug)` (`Object.hasOwn`, chặn key prototype) + test.
- `src/components/admin/CollectionNameCell.tsx` (+ test) — ô danh sách, dựa trên `LinkedCell`.
- `src/components/admin/CollectionNameHint.tsx` — gợi ý "Tên gọi" ở màn chi tiết.
- `src/collections/AuditLogs.ts` (`collection`), `src/collections/ClickEvents.ts` + `src/collections/ClickStatsDaily.ts` (`refCollection`) — gắn Cell + Description component.
- `src/app/(payload)/admin/importMap.js` — đăng ký component.

## Bổ sung sau phase review (D5)
- Spec-validator phase 1 chỉ ra nhật ký "Dịch lại nội dung" của global ghi mã global → helper tra thêm `ADMIN_GLOBAL_LABELS` (`site-settings` → "Cấu hình chung", `homepage` → "Trang chủ", `header` → "Menu đầu trang", `footer` → "Chân trang"). Gợi ý "Tên gọi: …" ở màn chi tiết chỉ hiện khi tên khác mã gốc. Câu delta FR-ADM-19 đã ghi theo bản này. Reviewer r2 PASS.

## Ảnh hưởng

- **Trực tiếp:** danh sách + chi tiết Nhật ký thao tác, Lượt bấm liên hệ, Thống kê liên hệ theo ngày.
- **Hồi quy:** các ô admin khác dùng `LinkedCell` (VndCell…), test quét nhãn admin.
- Không migration, không đổi quyền, không endpoint mới.
