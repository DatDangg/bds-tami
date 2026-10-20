Agent: spec-validator

# Phase review — feature-admin-list-columns-filters-locale (BL-039) · phase 1 · round 1

- Mode: Phase review (sau build). Scope: commits 35f4517 (T01), 38d33c9 (T02), e6aee3a (T03), 0d4a1f4 (T04); `git diff e738328..HEAD -- src`.
- Nguồn: `SPECIFICATIONS.md:115` (FR-ADM-19 — "Danh sách gọn (BL-039)", "Chip lọc nhanh mở rộng (BL-039)", "Cột nghiệp vụ (BL-039)"), `spec/changes/2026-10-20-admin-list-columns-filters-locale.md` (Acceptance l.22-31, Xử lý l.38-42), `tasks/feature-admin-list-columns-filters-locale/phase-1-task-0{1..4}.md`.
- Verify commands: không chạy lại trong vòng này; dùng evidence trong Verification summary của task + reviewer report (T01 r2 STRICT, T02 r1 STRICT, T03 r1 STRICT, T04 r1 NORMAL — đều PASS; T04 cuối: vitest 138 file/1354 PASS, typecheck PASS, lint 0 error, `payload-types.ts` không đổi).

## Verdict: GAPS FOUND (nhẹ — chỉ tài liệu / làm rõ spec; code đủ so với spec delta)

Không có requirement nào MISSING ở code. Các hạ cấp đều đã được spec delta cho phép từ trước (câu fallback trong FR-ADM-19) hoặc user duyệt (auto proceed). Còn 2 việc reconcile as-built doc và 2 câu spec nên làm rõ.

## Ma trận coverage

| # | Requirement | Nguồn | Implementation | Status | Ghi chú |
|---|---|---|---|---|---|
| 1 | "Hiển thị cột" mọi collection chỉ còn trường nghiệp vụ (SEO, `translation.*`, slug/scopeSlug, hasEnglish, hash/timestamp kỹ thuật, richText/textarea, json/array/blocks/point, `ui` không Cell) | Spec 115 "Danh sách gọn"; CR l.23 | `src/lib/admin/list-filter.ts` `hideTechnicalListFields` (SHARED_HIDDEN_PATHS, HIDDEN_FROM_COLUMNS_AND_FILTERS, TECHNICAL_FIELD_NAME, `admin.hidden`, ui không Cell); áp 21 collection ở `src/collections/admin-collections.ts` (`ADMIN_COLLECTIONS` + `EXTRA_HIDDEN_COLUMNS`); Media `imageSizes[].admin` + stub upload | PASS | Test `list-filter.test.ts` (duyệt 21 collection thật) + `list-filter-sanitized.test.ts` (buildConfig + s3Storage) |
| 2 | Cột mặc định giữ nguyên (trừ cột thêm ở T04); defaultColumns/useAsTitle không bị tắt | Spec 115; CR l.23 | `keptColumns` trong helper; test "cột mặc định và useAsTitle không bị ẩn" | PASS | |
| 3 | `ID` / `Ngày xoá` ẩn nếu cấu hình được không đổi schema, không thì giữ + ghi gap | Spec 115; CR l.42 | Không ẩn được — evidence T01 D3 (`@payloadcms/ui ColumnSelector/index.js:20`, `payload sanitize.js:113-153`) | PASS (hạ cấp hợp lệ) | Gap ghi ở T01 Residual + CR l.42; repo không có gap register (`docs/changes/*GAP*` không tồn tại) |
| 4 | "Thêm bộ lọc" mọi collection chỉ còn trường nghiệp vụ; media chỉ ẩn lọc; hiddenPaths BL-021 chỉ ẩn lọc; test phủ collection mới | Spec 115; CR l.24 | `HIDDEN_FROM_FILTERS_ONLY = upload`, `hiddenPaths` giữ nghĩa cũ; test mẫu job-postings/job-applications/pages/categories | PASS | Test BL-021 cũ cập nhật bỏ `hasEnglish` (đúng spec mới) |
| 5 | Không đổi dữ liệu/form/`where`/Lọc dịch/xuất Excel | Spec 115; CR l.31 | Chỉ cờ `admin.disableList*`; `where` không đụng; `payload-types.ts` không đổi | PASS | |
| 6 | Ô ngôn ngữ "Tiếng Việt"/"English" cả nút lẫn danh sách xổ | Spec 115; CR l.25 | `src/payload.config.ts` locales `{code,label}`; `_surfaces.scss` ẩn `.localizer__locale-code`; test `admin-list-search.test.ts` | PASS | Đã soi bằng next dev ở desktop (T02) |
| 7 | Danh sách xổ trên cùng, nền đặc, không bị "Thùng rác"/"Tạo mới" xuyên/đè — desktop + 375px | Spec 115; CR l.25 | `.popup__content { z-index: var(--z-popup); max-width: calc(100vw - 16px) }` | PARTIAL (verify) | Desktop kiểm computed style; **375px chưa xem trực quan** (T02 Residual). Không phải thiếu code, thiếu bằng chứng |
| 8 | Nút bộ lọc chữ "Lọc nâng cao"; vị trí sau hàng chip chỉ nếu làm được bằng CSS, không thì giữ | Spec 115; CR l.27 | `payload-vi-overrides.ts` `general.filters` | PASS (hạ cấp hợp lệ) | Vị trí giữ nguyên, hàng chip ngay dưới — đúng câu fallback của spec delta (T02 D7) |
| 9 | Gợi ý "Tìm theo …" khớp `listSearchableFields` | Spec 115; CR l.28 | `LIST_SEARCHABLE_FIELDS` + `withListSearchableFields` (13 collection), Lead/Cho thuê giữ; test kiểu text/email | PASS | |
| 10 | Chip Dự án: Tình trạng mở bán (mọi salesStatus) + Trạng thái bài Nháp/Xuất bản | Spec 115 "Chip mở rộng"; CR l.26 | `collection-quick-filters.ts` SALES_STATUS_GROUP + POST_STATUS_GROUP | PASS | |
| 11 | Chip Tin tức/Tin BĐS: Trạng thái bài + Danh mục (scope đúng, sortOrder, ≤ 12, không gồm danh mục con, quyền người xem) | Spec 115; CR l.26 | `categoryQuickFilterGroup` (`overrideAccess:false`, `limit: 12`, try/catch) | PASS | |
| 12 | Chip Tuyển dụng: Đang tuyển (published + hạn ≥ hôm nay VN) / Hết hạn (hạn < hôm nay) theo `startOfVietnamDay` | Spec 115; CR l.26 | `jobPostingQuickFilterGroup(now)` | PASS | Residual: mốc tính lúc render (qua nửa đêm cần tải lại) |
| 13 | Chip Hồ sơ ứng tuyển: mọi trạng thái | Spec 115; CR l.26 | APPLICATION_STATUS_GROUP | PASS | |
| 14 | Chip Lead/Cho thuê giữ nguyên; ẩn thùng rác + drawer; ghép AND với lọc/tìm/Lọc dịch | Spec 115 (BL-022 cơ chế); CR l.26 | Slot chung trả `[]` cho leads/rentals; `CollectionQuickFilterSlot` null ở trash; test withChip/currentChip | PASS | 375px của hàng chip mới: dùng lại CSS BL-022, chưa soi bằng app |
| 15 | Dự án: cột mặc định "Quy mô" ("1.200 căn") + "Khoảng giá" (rút gọn, Từ/Đến) | Spec 115 "Cột nghiệp vụ"; CR l.29 | `Projects.ts` ui `unitsSummary`/`priceRange` + `ListSummaryCells.tsx` + `list-summary.ts` | PASS | Thêm hành vi as-built chưa có trong spec: giá 0 = chưa có giá (xem đề xuất S1) |
| 16 | Cho thuê: "Phòng · diện tích" ("2 PN · 75 m²", 0 PN → Studio) + "Thuộc dự án" (tên dự án); rỗng `—` | Spec 115; CR l.29 | `Rentals.ts` ui `roomsArea`; cột `project` = ô Relationship mặc định Payload | PASS (residual) | Ô dự án tải tên client-side → có thể nháy "Đang tải…" (T04 m1). Spec cùng câu yêu cầu Sale phụ trách "không Đang tải..." nhưng không áp cho cột dự án — xem S2 |
| 17 | Cột ghép là `ui` chỉ hiển thị, không cột DB, không sắp xếp/lọc | Spec 115 | ui + Cell, `filterOnly` luôn true cho ui; `payload-types.ts` không đổi | PASS | |
| 18 | Chụp ảnh danh sách để user duyệt ở checkpoint trước khi code | CR l.30 | Bỏ qua — CR l.40 ghi user chỉ thị auto proceed; thay bằng bảng "Danh sách ẩn thêm" ở T01 | PASS (hạ cấp có duyệt) | |
| 19 | Không đổi schema/DB/access/endpoint, không migration | Spec 115 ràng buộc; CR l.31 | generate:types không đổi; không file migration trong diff | PASS | |

## Gaps

- [PARTIAL] **Bằng chứng 375px** cho popup ngôn ngữ (#7) và hàng chip mới (#14) — chưa xem trên trình duyệt. Task: T02, T03. Đề xuất: kiểm tay 1 lần ở 375px (news + projects list) trước/khi deploy staging; ghi kết quả vào task file. Không chặn close-out code.
- [PARTIAL] **Doc Impact — as-built chưa reconcile** (AGENTS.md § Doc Impact):
  - `docs/specs/2026-10-19-admin-ui-saas-design.md` §4 (l.224-234) đã có mẫu dòng "As-built (T01/T05)" nhưng chưa có as-built BL-039: hàng chip `beforeListTable` (slot chung `CollectionQuickFilterSlot`) trước ô Trạng thái dịch; nút đổi tên "Lọc nâng cao" giữ vị trí Payload; menu cột/lọc lọc qua `hideTechnicalListFields` áp tập trung ở `admin-collections.ts`; `ID`/`Ngày xoá` vẫn hiện. Đề xuất thêm 1 dòng `**As-built (BL-039):** …` vào §4.
  - `docs/ERD.md:33` ghi `localization: { locales: ['vi', 'en'], … }` — nay là `[{ code: 'vi', label: 'Tiếng Việt' }, { code: 'en', label: 'English' }]` (mã không đổi, không đổi schema). Đề xuất sửa snippet hoặc thêm "(mỗi locale có `label` hiển thị ở admin)". Mức thấp.
  - `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/API_SPEC.md`: không mô tả menu cột/bộ lọc/chip admin → no doc impact.
  - Intent docs (`SPECIFICATIONS.md` FR-ADM-19): không bị hạ cấp; delta đã có trước khi build.

## Đề xuất làm rõ spec (as-built, cần qua change-request/user duyệt vì là intent)

- S1 (giá 0): thêm vào câu "Cột nghiệp vụ (BL-039)" sau "chỉ một đầu → "Từ …"/"Đến …"": "; giá bằng 0 coi như chưa nhập (0–0 → `—`, 0–3 tỷ → "Đến 3 tỷ"); hai đầu bằng nhau → một giá".
- S2 (cột dự án nháy tải): thêm sau "Thuộc dự án" (tên dự án)": "(ô quan hệ mặc định của Payload, tên có thể hiện sau một nhịp tải; không bắt buộc như cột Sale phụ trách)". Nếu user muốn "không Đang tải…" như Sale phụ trách thì đây là việc mới (Cell riêng), không phải gap của phase này.
- S3 (tuỳ chọn): ghi "chip Tuyển dụng tính mốc ngày lúc tải trang (qua nửa đêm giờ VN cần tải lại)" và "người đã lưu cột riêng (payload-preferences) phải tự bật cột mới trong Hiển thị cột".

## Danh sách sửa đề xuất (cho primary/loop)

1. Thêm dòng as-built BL-039 vào `docs/specs/2026-10-19-admin-ui-saas-design.md` §4.
2. Cập nhật snippet `docs/ERD.md:33` (locale có `label`).
3. Kiểm tay 375px (popup ngôn ngữ + hàng chip) hoặc giữ residual rõ ở T02/T03.
4. (Qua change-request, user duyệt) bổ sung S1/S2 vào FR-ADM-19.

Không có mục nào yêu cầu sửa code.
