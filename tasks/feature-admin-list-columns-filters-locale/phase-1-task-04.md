# feature-admin-list-columns-filters-locale · phase-1-task-04 — Cột nghiệp vụ: Dự án (Quy mô + Khoảng giá), Cho thuê (Phòng · diện tích + Thuộc dự án) (BL-039 #5)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md`. Spec delta: FR-ADM-19 câu "**Cột nghiệp vụ (BL-039)**".
- Phụ thuộc: T01–T03 (cùng `Projects.ts`/`Rentals.ts`). Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (thêm trường `ui` chỉ có `Cell` + đổi `defaultColumns`). Không đổi schema/DB (trường `ui` không có cột DB — xác nhận không sinh migration).
- Risk: **LOW–MEDIUM** → review **NORMAL**.
- Blast radius: `src/collections/Projects.ts`, `src/collections/Rentals.ts`, Cell mới `src/components/admin/*Cell.tsx` (+test), formatter (tái dùng formatter VND sẵn có nếu có), `importMap.js`.
- Doc impact: FR-ADM-19 (đã ghi). Migration: không.

## Quyết định (auto proceed)
- D12 Cột:
  - **Dự án**: `ui` `unitsSummary` "Quy mô" → `scale.totalUnits` dạng "1.200 căn"; `ui` `priceRange` "Khoảng giá" → `priceFromVnd`–`priceToVnd` rút gọn ("2,1 – 3,5 tỷ", "850 triệu – 1,2 tỷ"; chỉ từ → "Từ 2,1 tỷ"; chỉ đến → "Đến 3,5 tỷ"; bằng nhau → một giá). Số kiểu vi (dấu phẩy thập phân, ≤ 2 chữ số lẻ, bỏ 0 thừa). `defaultColumns`: `["gallery","title","category","salesStatus","unitsSummary","priceRange","status","publishedAt","author"]`.
  - **Cho thuê**: `ui` `roomsArea` "Phòng · diện tích" → "2 PN · 75 m²" (0 PN → "Studio · 30 m²"; thiếu PN → "75 m²"; thiếu cả hai → `—`); "Thuộc dự án" = quan hệ `project` có sẵn (ô mặc định Payload hiện tiêu đề dự án; nếu hiện id/"Đang tải" thì dùng Cell như `LinkedCell`). `defaultColumns`: `["gallery","code","title","category","roomsArea","project","priceMonthlyVnd","status","author"]`.
  - Trường `ui` không render ở form sửa (không có `Field`), không lọc, không sắp xếp; Cell đọc `rowData` (kiểm list view 3.91 có đủ `scale`/giá/bedrooms/areaM2 trong `rowData`).
  - Ô rỗng `—` (khớp `general.noLabel`).
- Residual: người đã tự chọn cột (payload-preferences) không tự thấy cột mới cho tới khi bật trong "Hiển thị cột".
- Test: Cell + formatter (đủ/thiếu/0/Studio/bằng nhau/triệu-tỷ), config `defaultColumns` + ui field không có cột DB.

## Acceptance
- [ ] Dự án hiện cột Quy mô (số căn) + Khoảng giá; Cho thuê hiện "2 PN · 75 m²" + Tên dự án; rỗng `—`.
- [ ] Không đổi schema/DB (không migration).

## Verify
`pnpm vitest run src/components/admin src/collections src/lib`, `pnpm typecheck`, `pnpm lint`.
