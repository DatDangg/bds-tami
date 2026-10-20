# feature-admin-form-non-tech-friendly · phase-1-task-02 — Dự án + ô số/giá dùng chung (BL-042 #12)

- Change doc: BL-042 bảng điểm #4 (Dự án), #12a–#12e. Phụ thuộc: T01 (đã commit). Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (admin component + `admin.*`; KHÔNG schema). Risk: **MEDIUM** — component dùng ở nhiều collection (Dự án, Cho thuê, Tin BĐS, Tuyển dụng, bảng giá). Review **NORMAL** (lên STRICT nếu chạm helper dùng chung của T01).
- Blast radius: `src/collections/{Projects,Rentals,PropertyPosts,JobPostings,News,Services}.ts`, `src/collections/projects/market-blocks.ts`, `src/fields/scoped-category.ts`, component mới `src/components/admin/*`; tái dùng formatter "tỷ/triệu" sẵn có (vd `src/lib/admin/list-summary.ts`) — không viết formatter thứ 2.

## Quyết định (auto proceed)
- D1 **Danh mục**: `scopedCategoryField` đã có `filterOptions: { scope: { equals } }`. Builder xác minh (đọc cách Payload 3.91 áp `filterOptions` cho ô chọn + drawer; nếu được, thử app). Đúng → ghi "đã có, không sửa" + evidence; sai → sửa ở `scoped-category.ts`. Validator cũ giữ nguyên.
- D2 **Bộ đếm Mô tả ngắn**: component client (`admin.components.afterInput` hoặc `Description`) đọc `useField` → "123 ký tự · nên 150–200" (nhắc nhẹ khi ngoài khoảng, không chặn lưu). Áp mọi collection có `summary` textarea qua 1 helper dùng chung (kèm placeholder T01).
- D3 **Pháp lý / Chính sách bán hàng / Tổng quan** (Dự án): `editor` riêng = factory editor của T01 + placeholder mẫu: Pháp lý "VD: Quyết định phê duyệt quy hoạch 1/500 số …; Giấy phép xây dựng số …; Sổ hồng lâu dài." · Chính sách "VD: Chiết khấu 5% khi thanh toán sớm; Hỗ trợ vay 70%, miễn lãi 18 tháng." · Tổng quan "Giới thiệu vị trí, quy mô, điểm nổi bật của dự án…". Chỉ placeholder.
- D4 **Giá đọc bằng chữ**: component client (`afterInput`) → "≈ 3,5 tỷ đồng" / "≈ 15 triệu đồng" / trống hoặc 0 thì không hiện; `aria-live="polite"`. Áp `priceFromVnd`, `priceToVnd` (Dự án), `priceMonthlyVnd` (Cho thuê), `priceVnd` (Tin BĐS), giá trong `priceTable` (market-blocks), `salaryMinVnd`/`salaryMaxVnd` (Tuyển dụng) qua helper chung. Số Việt (dấu phẩy thập phân).
- D5 **"Hôm nay"**: nút cạnh `priceUpdatedAt` (`afterInput`) → `setValue` ngày hôm nay theo giờ VN (tái dùng helper ngày VN sẵn có, vd `startOfVietnamDay`); `type="button"`, ≥ 32px.
- D6 Placeholder thêm cho Dự án: Địa chỉ "VD: Phường Long Thạnh Mỹ, TP Thủ Đức", Thời gian bàn giao "VD: Quý 4/2026", tên tiện ích "VD: Hồ bơi".
- D7 Test: unit test component/helper (counter; đọc giá: undefined/0, 950.000, 15.000.000, 3.500.000.000, 1.000.000.000); test config gắn đúng component vào các field nêu trên.

## Acceptance
- [ ] Ô Danh mục chỉ danh mục đúng loại (xác minh/ghi evidence).
- [ ] Mô tả ngắn có bộ đếm + gợi ý 150–200 ở mọi collection có `summary`.
- [ ] Pháp lý / Chính sách / Tổng quan có chữ gợi ý mẫu (không chèn nội dung).
- [ ] Ô giá VND (Dự án, Cho thuê, Tin BĐS, bảng giá, lương) có dòng "≈ … đồng".
- [ ] "Ngày cập nhật bảng giá" có nút "Hôm nay".
- [ ] Không schema/migration; test cũ PASS.

## Verify
`pnpm vitest run src/lib/admin src/collections src/components/admin src/fields`, `pnpm typecheck`, `pnpm lint`, importmap + generate:types không đổi trường.

## Verification summary
- D1 (Danh mục): ĐÃ CÓ, không sửa. Evidence: `@payloadcms/ui` addFieldStatePromise.js ~L485 gán `fieldState.filterOptions = { categories: { scope: { equals } } }` cho relationship khi `filterOptions` là object; Relationship/Input.js (L112-143, L192) áp vào cả ô xổ lẫn list drawer. Thêm test config: category dự án có `filterOptions: { scope: { equals: "project" } }`.
- D2: `SummaryCounter` (afterInput) + `withSummaryCounter` (`src/fields/form-hints.ts`) áp Projects.summary, Services.summary, News.excerpt, PropertyPosts.excerpt; logic `describeSummaryLength` ở `src/lib/admin/form-hints.ts`.
- D3/D6: Pháp lý, Chính sách, Tổng quan dùng `createRichTextEditor(placeholder)` của T01; placeholder Địa chỉ, Thời gian bàn giao, Tên tiện ích.
- D4: `PriceInWords` + `withPriceInWords` áp priceFromVnd/priceToVnd, priceMonthlyVnd, priceVnd, priceTable.priceFrom/priceTo, salaryMinVnd/salaryMaxVnd; hàm `formatPriceInWords` thêm vào `list-summary.ts` dùng lại `compactParts` (không formatter thứ 2).
- D5: `TodayButton` (afterInput) trên priceUpdatedAt; giá trị = ngày VN (`vietnamDate`+`startOfVietnamDay`, export thêm `vietnamDate` ở deadline.ts) ghim 12:00Z như ô chọn ngày; type=button, 36px (44px ≤767px).
- CSS: `.tami-field-hint`, `.tami-today-button` ở `_forms.scss` (token sáng/tối, rem). importmap đã regen.
- Verify: vitest (lib/admin, collections, components/admin, fields, translation, globals) 61 file / 504 test PASS; typecheck PASS; lint 0 error (2 warning cũ ở tools/task-dashboard); generate:types không đổi file; không migration.
- Residual: chưa chạy thử bằng trình duyệt (afterInput trong hàng array priceTable dựa vào prop `path` của Payload; test mock `useField`).

## Bổ sung sau spec-validation plan r1
- G4 → D2: bộ đếm áp cả `excerpt` ("Tóm tắt") của Tin tức + Tin BĐS (và mọi textarea mô tả ngắn hiển thị ở thẻ/Google), cùng helper.
