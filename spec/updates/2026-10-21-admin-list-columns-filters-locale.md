# Spec Update — 2026-10-21 admin-list-columns-filters-locale (danh sách admin gọn + ô ngôn ngữ + chip lọc nhanh mở rộng + cột nghiệp vụ)

**spec_version:** 1.36.0 → 1.37.0 (MINOR — đổi hành vi danh sách admin: menu cột/bộ lọc chỉ còn trường nghiệp vụ ở mọi collection, nhãn ô ngôn ngữ, chip lọc nhanh cho 5 màn mới, cột ghép mặc định cho Dự án/Cho thuê; không đổi schema, slug, access control, endpoint)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-039**, MODIFY). Change doc `spec/changes/2026-10-20-admin-list-columns-filters-locale.md` (archive ở close-out → `spec/changes/archive/2026-10-20-admin-list-columns-filters-locale.md`). Task `tasks/feature-admin-list-columns-filters-locale/phase-1-task-01.md` (cột/bộ lọc mọi collection, `35f4517`) · `phase-1-task-02.md` (ô ngôn ngữ + "Lọc nâng cao" + gợi ý tìm kiếm, `38d33c9`) · `phase-1-task-03.md` (chip 5 màn, `e6aee3a`) · `phase-1-task-04.md` (cột Quy mô/Khoảng giá/Phòng · diện tích/Thuộc dự án, `0d4a1f4`). Review: T01 STRICT r1 FAIL → r2 PASS; T02 STRICT r1 PASS; T03 STRICT r1 PASS; T04 NORMAL r1 PASS (MINOR m2/m3 sửa sau r1, m1 residual). Phase review: `.context/review-reports/spec-validation-feature-admin-list-columns-filters-locale-phase-1.md` — GAPS FOUND nhẹ (chỉ doc/làm rõ spec, code đủ); doc reconcile + làm rõ S1–S3 xử lý ở close-out.

## Requirements (SPECIFICATIONS.md)

- **FR-ADM-19 — Giao diện quản trị (ĐỔI):**
  - Thêm câu "**Danh sách gọn (BL-039)**": ở mọi collection admin, "Hiển thị cột" và "Thêm bộ lọc" chỉ còn trường nghiệp vụ — ẩn SEO, `translation.*`, `slug`/`scopeSlug`, `hasEnglish`, trường tìm kiếm/hash/timestamp kỹ thuật, richText/textarea, JSON/mảng/khối/toạ độ, `ui` không ô hiển thị, checkbox ảo kỹ thuật; bộ lọc ẩn thêm media + trường BL-021 (vẫn chọn làm cột); qua helper chung `src/lib/admin/list-filter.ts`. Cột `ID`/`Ngày xoá` giữ (gap — cần đổi schema). Ô ngôn ngữ "Tiếng Việt"/"English" (`localization.locales[].label`), popup trên cùng, nền đặc, không bị đè (desktop + 375px). Nút trình dựng bộ lọc → "**Lọc nâng cao**" (vị trí do Payload). Ô tìm kiếm gợi ý "Tìm theo …" khớp `listSearchableFields`.
  - Thêm câu "**Chip lọc nhanh mở rộng (BL-039)**": Dự án (Tình trạng mở bán; Nháp/Xuất bản), Tin tức + Tin BĐS (Trạng thái; Danh mục ≤ 12 theo `sortOrder`, không gồm danh mục con), Tin tuyển dụng (Đang tuyển / Hết hạn theo `startOfVietnamDay`), Hồ sơ ứng tuyển (trạng thái). Chip Lead/Cho thuê giữ nguyên. Bỏ câu cũ "không áp chip cho Dự án / Tin bất động sản".
  - Thêm câu "**Cột nghiệp vụ (BL-039)**": Dự án "Quy mô" + "Khoảng giá"; Cho thuê "Phòng · diện tích" + "Thuộc dự án"; rỗng `—`; trường `ui` chỉ hiển thị (không sắp xếp/lọc); giá 0 = chưa nhập; hai đầu cùng chuỗi → một giá; người đã lưu cột phải tự bật cột mới.
- Mục Localization: `locales` có `label` (mã `vi`/`en` không đổi). `docs/ERD.md` snippet cập nhật tương ứng.

## Hành vi bị thay thế

| Trước | Sau (BL-039) |
|---|---|
| "Hiển thị cột" liệt kê SEO, Bản dịch tiếng Anh >…, slug, Có bản tiếng Anh, richText/textarea dài | Chỉ trường nghiệp vụ, mọi collection (`ADMIN_COLLECTIONS` trong `admin-collections.ts`); `defaultColumns` không đổi (trừ cột mới T04) |
| "Thêm bộ lọc" gọn chỉ ở 5 màn BL-021 | Mọi collection (21) dùng cùng quy tắc |
| Ô "Ngôn ngữ: vi" / xổ "vi", "en" | "Tiếng Việt" / "English" (ẩn mã "(vi)"), popup z-index tường minh, `max-width` vừa màn |
| Nút "Bộ lọc" | Nút "Lọc nâng cao" (cùng vị trí) |
| Ô tìm "Tìm theo Tiêu đề/ID" chung chung ở nhiều màn | Mỗi màn khai `listSearchableFields` nghiệp vụ → gợi ý đúng trường |
| Chip lọc nhanh chỉ ở Lead + Cho thuê | Thêm Dự án, Tin tức, Tin BĐS, Tuyển dụng, Hồ sơ ứng tuyển (slot chung `CollectionQuickFilterSlot`) |
| Dự án/Cho thuê không thấy quy mô, giá, PN, diện tích, dự án | Cột mặc định "Quy mô", "Khoảng giá" (Dự án); "Phòng · diện tích", "Thuộc dự án" (Cho thuê) |

Không đổi: schema/DB (generate:types không đổi `payload-types.ts`, không migration), access control, endpoint, truy vấn `where`, Lọc dịch, xuất Excel lead, form sửa.

## Code (as-built)

- T01 (`35f4517`): `src/lib/admin/list-filter.ts` (`hideTechnicalListFields`) + test, `src/lib/admin/list-filter-sanitized.test.ts`, `src/collections/admin-collections.ts` (mới), `src/payload.config.ts`, `src/collections/{Leads,Media,News,Projects,PropertyPosts,Rentals}.ts`.
- T02 (`38d33c9`): `src/payload.config.ts` (locale label), `src/lib/admin/payload-vi-overrides.ts` (+test, `general.filters`), `src/collections/admin-collections.ts` (`LIST_SEARCHABLE_FIELDS`), `src/collections/admin-list-search.test.ts`, `src/components/admin/styles/_surfaces.scss`.
- T03 (`e6aee3a`): `src/lib/admin/collection-quick-filters.ts` (+test), `src/components/admin/CollectionQuickFilterSlot.tsx` (+test), `src/lib/admin/quick-filters.ts`, `src/collections/{Projects,News,PropertyPosts,JobPostings,JobApplications}.ts`, `importMap.js`.
- T04 (`0d4a1f4`): `src/lib/admin/list-summary.ts` (+test), `src/components/admin/ListSummaryCells.tsx` (+test), `src/collections/{Projects,Rentals}.ts`, `src/collections/admin-list-columns.test.ts`, `importMap.js`.

## Ảnh hưởng

- **Trực tiếp:** danh sách mọi collection admin (menu cột, bộ lọc, ô tìm kiếm, ô ngôn ngữ, nút Lọc nâng cao); hàng chip 5 màn; cột Dự án/Cho thuê.
- **Phụ thuộc:** chip ghép `where`/Lọc dịch/tìm kiếm; thùng rác + list drawer ẩn chip; preference cột đã lưu.
- **Hồi quy:** chip Lead/Cho thuê, xuất Excel lead, Lọc dịch, frontend `/en` (locale code không đổi), sidebar BL-041.
- Không migration, không đổi quyền, không endpoint mới.

## Ngoài phạm vi / gap

- Ẩn cột `ID` / `Ngày xoá` (Payload 3.91 không cho tắt bằng config — cần thêm trường vào schema).
- Sắp xếp/lọc theo cột ghép (cần cột DB).
- Đưa nút "Lọc nâng cao" xuống sau hàng chip (phải thay ListControls của Payload).
