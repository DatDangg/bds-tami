Agent: spec-validator

# Spec validation (pre-plan) — feature-admin-list-columns-filters-locale (BL-039, MODIFY) — round 1

**Verdict: ❌ FAIL** (gate: 4 mục ⚠️, ngưỡng là 3; không có ❌, không có conflict HIGH). Mọi gap đều sửa được bằng cách chỉnh spec delta / task file, không cần làm lại plan.

Nguồn đã đọc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md` (Acceptance L22-31, Xử lý L38-42), `git diff SPECIFICATIONS.md` (FR-ADM-19), `tasks/feature-admin-list-columns-filters-locale/phase-1-task-0{1..4}.md`, `src/lib/admin/list-filter.ts`, `src/collections/{Projects,Rentals,News,PropertyPosts,JobPostings,JobApplications,Categories,Staff,Media}.ts`, `src/fields/{status,search-reindex-pending,translation}.ts`, `src/jobs/close-job-postings.ts`, `src/payload.config.ts:102-103`.

## 1. Ma trận phủ acceptance

| # | Acceptance (change doc) | Spec delta | Task | Status | Note |
|---|---|---|---|---|---|
| A1 | "Hiển thị cột" chỉ còn trường nghiệp vụ; cột mặc định giữ nguyên | "Danh sách gọn (BL-039)" | T01 D1/D2/D4 | ⚠️ PARTIAL | Quy tắc D1 bỏ sót trường `ui` không có Cell và trường virtual kỹ thuật (G3). `deletedAt` có trong acceptance nhưng spec delta không nhắc (G2) |
| A2 | "Thêm bộ lọc" ở mọi collection + test phủ | "Danh sách gọn" | T01 D1/D2/D4 | ✅ | `list-filter.ts:4` đã ẩn `ui`/`join`/upload… khỏi bộ lọc; D4 test duyệt config thật |
| A3 | Ô ngôn ngữ "Tiếng Việt"/"English", không che "Thùng rác"/"Tạo mới", desktop + 375px | có | T02 D5/D6 | ✅ | `payload.config.ts:103` hiện là `["vi","en"]`; route frontend dùng `src/i18n/routing.ts` riêng nên đổi sang object không ảnh hưởng. D5 có grep chỗ dùng |
| A4 | Chip: Dự án, Tin tức, Tin BĐS, Tuyển dụng, Hồ sơ ứng tuyển; Lead/Cho thuê giữ | "Chip lọc nhanh mở rộng" | T03 D9/D10/D11 | ✅ (⚠️ nhẹ G5) | Trường có thật (xem §4) |
| A5 | Nút "Lọc nâng cao", **đặt sau hàng chip** | chỉ đổi chữ; **bỏ vị trí** | T02 D7 (có điều kiện, có residual) | ⚠️ PARTIAL | Hạ cấp là hợp lý, nhưng spec delta không ghi lại (G1) |
| A6 | Ô tìm kiếm có gợi ý khớp `listSearchableFields` | có | T02 D8 | ✅ | Trường đều có thật: JobApplications `fullName`/`email`/`phone` (L33-35), Staff `fullName`/`email` (Staff.ts:109), Rentals giữ `["code","title","address"]` (Rentals.ts:145) |
| A7 | Cột Dự án Quy mô + Khoảng giá; Cho thuê "2 PN · 75 m²" + dự án; rỗng `—` | "Cột nghiệp vụ" | T04 D12 | ✅ | Trường `ui` không có cột DB, nên không có migration |
| A8 | Chụp ảnh danh sách để user duyệt trước khi code | — (bước quy trình) | Xử lý L40 | ✅ chấp nhận (residual) | Hạ cấp có lý do: user chỉ thị "auto proceed". Nhưng T01 chưa có dòng residual/evidence (G6) |
| A9 | Không đổi schema/DB/access; Lọc dịch, chip, xuất Excel vẫn chạy | Ràng buộc FR-ADM-19 | T01-T04 Classification + verify | ✅ | `admin.disableList*` / `listSearchableFields` / nhãn locale / trường `ui` đều không đụng DB. Locale code giữ `vi`/`en` |

## 2. Spec delta so với change doc và các câu cũ FR-ADM-19

- ✅ Đã bỏ câu "không áp cho Dự án / Tin bất động sản"; câu "Không có chip diện tích" vẫn giữ. Không mâu thuẫn với BL-022 (cơ chế chip, ghép AND vào từng nhánh "hoặc"), BL-041, BL-043.
- ✅ Câu BL-021 "Thêm bộ lọc của Cho thuê / Dự án / Tin BĐS / Tin tức / Lead…" bị câu BL-039 "ở **mọi** collection" bao hàm. Không mâu thuẫn, chỉ dư chữ.
- ⚠️ G1: change doc bắt nút "Lọc nâng cao" **đặt sau hàng chip**. Spec delta chỉ ghi đổi chữ; vị trí bị bỏ mà không ghi là gap.
- ⚠️ G2: change doc (A1 + Xử lý L42) nêu `ID`/`deletedAt`; spec delta không nhắc.
- Chữ cũ (info): câu thanh công cụ vẫn ghi "hàng tìm kiếm / Hiển thị cột / **Bộ lọc**", nên đổi thành "Lọc nâng cao" cho thống nhất một tên.

## 3. Ràng buộc không đổi schema/DB/access/endpoint

- ✅ `localization.locales` dạng object `{code,label}`: giữ được ràng buộc vì code không đổi (`payload-types` vẫn `'vi'|'en'`).
- ✅ `listSearchableFields`: chỉ là config admin. D8 chỉ dùng trường text/email.
- ✅ Trường `ui` (T04): không có cột DB. `list-filter.ts:4` đã đưa `ui` vào nhóm không lọc nên cột ghép không lọc được, đúng spec.
- ⚠️ G4: T01 D1 nói helper chung đặt cả `disableListColumn` lẫn `disableListFilter`, nhưng không nói `hiddenPaths` riêng **đang có** (vốn chỉ ẩn khỏi bộ lọc) có thành ẩn cả cột hay không. Ví dụ Rentals `address`, `showExactAddress`, `videoUrl` (Rentals.ts:235); PropertyPosts `priceNote`, `offer.voucherCode` (PropertyPosts.ts:117); Projects `address`, `scale`, `priceUpdatedAt` (Projects.ts:190). Nếu cả cây `scale` bị tắt cột thì không sao cho T04, vì cột ghép đọc `rowData`. Nhưng `address` và `priceNote` là trường nghiệp vụ; ẩn khỏi menu cột là đổi hành vi mà không ai quyết.

## 4. Trường tồn tại thật

| Trường | Bằng chứng | OK |
|---|---|---|
| Projects `salesStatus` (SALES_STATUSES upcoming/selling/handed_over) | Projects.ts:26, 144-151 | ✅ |
| Projects `scale.totalUnits` | Projects.ts:67-72 | ✅ |
| Projects `priceFromVnd` / `priceToVnd` | Projects.ts:160 | ✅ |
| Rentals `bedrooms`, `areaM2` (bắt buộc), `project` | Rentals.ts:198, 195, 173 | ✅ |
| JobPostings `deadline` (date dayOnly, bắt buộc), `status` (content) | JobPostings.ts:89-96; `fields/status.ts:4` | ✅ |
| JobApplications `status` (APPLICATION_STATUSES) | JobApplications.ts:8, 98-105 | ✅ |
| News / PropertyPosts `category` (`scopedCategoryField`), Categories `scope` + `sortOrder` | News.ts:38, PropertyPosts.ts:73, Categories.ts:45, 66 | ✅ |
| Content status `draft`/`published`/`hidden` | `fields/status.ts:4` | ✅ (D10: `hidden` chỉ có ở `Tất cả`) |

## Gaps và đề xuất sửa

1. **[PARTIAL] G1 — vị trí "Lọc nâng cao"** (A5; T02 D7). Thêm vào spec delta một câu kiểu: "vị trí sau hàng chip chỉ làm nếu làm được bằng CSS trong cùng container; không làm được thì giữ vị trí Payload và ghi gap". Hoặc ghi vào gap register. Quyết định hạ cấp trong D7 là hợp lý: chip nằm ở slot `beforeListTable`, tách khỏi ListControls, và yêu cầu không override component Payload.
2. **[PARTIAL] G2 — `ID` / `deletedAt`** (A1; T01 D3). Spec delta cần ghi rõ: ẩn `id`/`deletedAt` khỏi "Hiển thị cột" nếu Payload 3.91 cho cấu hình được mà không đổi schema; không được thì là gap đã biết. Quyết định D3 (không thêm `id` vào schema, không patch `node_modules`) hợp lý. Lưu ý JobApplications không bật `trash` (JobApplications.ts:76), nên không có `deletedAt`.
3. **[PARTIAL] G3 — quy tắc D1 bỏ sót trường kỹ thuật ở menu cột** (A1; T01). Ba trường sau vẫn sẽ hiện trong "Hiển thị cột":
   - `ui` chỉ có `Field` (nút thao tác): Pages `approveEnglishAction` (Pages.ts:62), JobApplications `cvDownload` (JobApplications.ts:49-53).
   - Checkbox virtual `searchReindexPending` (`fields/search-reindex-pending.ts:57-65`, có ở Projects và có thể ở các collection khác).

   Đề xuất thêm vào D1: ẩn cột `ui` **không có** `admin.components.Cell`, và ẩn `searchReindexPending`/trường virtual kỹ thuật. Đồng thời ghi rõ helper **không được** tắt cột `ui` có `Cell`, vì cột ghép T04 (`unitsSummary`, `priceRange`, `roomsArea`) phải hiện được. Test D4 sẽ bắt lỗi này khi T04 đưa các cột đó vào `defaultColumns`, nhưng T01 chạy trước nên phải chốt quy tắc ngay trong T01.
4. **[PARTIAL] G4 — nghĩa của `hiddenPaths` hiện có** (T01 D1). Chốt một trong hai:
   - (a) `hiddenPaths` cũ chỉ ẩn bộ lọc, còn ẩn cột khai báo riêng (vd tham số `hiddenColumnPaths`);
   - (b) ẩn cả hai, nhưng liệt kê từng trường vào bảng "Danh sách ẩn thêm" kèm lý do. Ít nhất Rentals `address` và PropertyPosts `priceNote` cần được quyết rõ.
5. **[info / ⚠️ nhẹ] G5 — chip Danh mục** (T03 D10):
   - Giới hạn "tối đa 12" có trong task nhưng không có trong spec. Nên thêm vào spec hoặc coi là chi tiết triển khai, kèm residual.
   - Danh mục cha–con: chip `category equals <id>` của danh mục cha không gồm bài ở danh mục con. Nên ghi một dòng hành vi mong đợi.
   - Gợi ý cho chip Tuyển dụng: dùng lại `startOfVietnamDay` (`src/lib/careers/deadline`) cho mốc "hôm nay", để khớp với `listOpenJobs` và `close-job-postings.ts:33`.
6. **[info] G6 — ảnh chụp checkpoint** (A8). Thêm dòng Residual vào T01 (hoặc T02): "ảnh chụp trước/sau: làm nếu dựng được app local, không thì residual". Có dòng này thì lúc close-out không bị coi là thiếu acceptance.

## Residual risk (không chặn)
- T04: phải kiểm trên Payload 3.91 rằng `rowData` của list view có đủ `scale`/giá/`bedrooms`/`areaM2`/`project`, nhất là khi các cột đó bị tắt (nếu có select API). Task đã ghi việc này.
- T02 D8: cách Payload ghép nhiều `listSearchableFields` thành chữ gợi ý (dấu phẩy / "hoặc") cần kiểm thực tế với khoá `general.searchBy`.
- Chip Tuyển dụng sáng/tắt khi qua ngày: T03 đã ghi residual.
