# feature-admin-list-columns-filters-locale · phase-1-task-04 — Cột nghiệp vụ: Dự án (Quy mô + Khoảng giá), Cho thuê (Phòng · diện tích + Thuộc dự án) (BL-039 #5)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md`. Spec delta: FR-ADM-19 câu "**Cột nghiệp vụ (BL-039)**".
- Phụ thuộc: T01–T03 (cùng `Projects.ts`/`Rentals.ts`). Trạng thái: `done` — Reviewer NORMAL r1 PASS (`.context/review-reports/feature-admin-list-columns-filters-locale-phase-1-task-04-round-1-review.md`); m2 (làm tròn ranh giới đơn vị) + m3 (giá 0 = chưa có giá, quyết định auto proceed) sửa sau r1, primary kiểm lại diff; m1 (cột "Thuộc dự án" nháy "Đang tải…" — ô Relationship mặc định Payload) giữ làm residual.

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
- [x] Dự án hiện cột Quy mô (số căn) + Khoảng giá; Cho thuê hiện "2 PN · 75 m²" + Tên dự án; rỗng `—`.
- [x] Không đổi schema/DB (không migration).

## Verify
`pnpm vitest run src/components/admin src/collections src/lib`, `pnpm typecheck`, `pnpm lint`.

## Verification summary (builder)
- Acceptance: cả 2 mục [x] ở mức code + test (chưa xem trên trình duyệt: không chạy app local vì cần DB/đăng nhập — residual).
- Files: `src/lib/admin/list-summary.ts` (+test), `src/components/admin/ListSummaryCells.tsx` (+test: UnitsSummaryCell/PriceRangeCell/RoomsAreaCell), `src/collections/Projects.ts` (ui `unitsSummary`, `priceRange` + defaultColumns), `src/collections/Rentals.ts` (ui `roomsArea` + defaultColumns), `src/collections/admin-list-columns.test.ts`, `src/app/(payload)/admin/importMap.js` (regen).
- Evidence Payload 3.91: `@payloadcms/ui/dist/providers/TableColumns/buildColumnState/filterFields.js:8` (`type !== 'ui'` miễn kiểm hidden) + `buildColumnState/index.js:96` (`fieldIsPresentationalOnly` → tắt SortColumn) → ui có tên + Cell vào cột, không sắp xếp. `@payloadcms/next/dist/views/List/index.js:159` select chỉ khi `enableListViewSelectAPI` (repo không bật) + `depth: 0` → `rowData` đủ `scale`/giá/`bedrooms`/`areaM2`, `project` là id thô. Cột `project`: Payload `Table/DefaultCell/fields/Relationship` tự tải tên qua `useListRelationships` (hiện tiêu đề dự án sau một nhịp tải, như bộ lọc) → dùng ô mặc định, không viết Cell mới.
- Verify: vitest `src/components/admin src/collections src/lib` = 138 files / 1354 PASS · `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ ở tools/) · `payload generate:types` không đổi `payload-types.ts` (ui không có cột DB) → không migration.
- Quyết định: `hideTechnicalListFields` (T01) đã giữ ui có Cell nên không cần sửa; test T01 không đổi. Chip T03/BL-041 không đụng. Formatter riêng trong `list-summary.ts` (cần chung hậu tố "tỷ" nên không dùng `formatVndCompact` trực tiếp, nhưng dùng `formatNumber`/`formatArea`).
- Residual: (1) người đã lưu cột trong payload-preferences không tự thấy cột mới tới khi bật trong "Hiển thị cột"; (2) ô "Thuộc dự án" có thể nháy "Đang tải…" ngắn do Payload tải tên client-side; (3) chưa kiểm bằng mắt trên app chạy.
- fix MINOR sau r1: m2 chọn đơn vị sau làm tròn (999.999.999 → "1 tỷ") + hai đầu cùng chuỗi → một giá; m3 giá 0 = chưa có giá (0–0 → `—`, 0–3 tỷ → "Đến 3 tỷ"); m1 (nháy "Đang tải" cột dự án) giữ như residual (2).
