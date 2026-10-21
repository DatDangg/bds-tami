# feature-admin-form-non-tech-friendly · phase-1-task-01 — Nền chung cho MỌI form admin (BL-042 #1–#10)

- Change doc: `spec/changes/2026-10-20-admin-form-non-tech-friendly.md` (BL-042) — bảng điểm sửa #1–#10. Spec delta: FR-ADM-19 câu "**Form dễ dùng cho người không rành công nghệ (BL-042)**".
- Phụ thuộc: không. Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (config `admin` + editor + CSS + component hiển thị; KHÔNG đổi schema/DB/access/endpoint/URL).
- Risk: **MEDIUM-HIGH** — chạm field dùng chung mọi collection (`content-defaults`, `fields/*`, `payload.config.ts` editor, `payload-vi-overrides.ts`). Review **STRICT** (shared).
- Blast radius: `src/payload.config.ts`, `src/fields/{author,slug,translation,published-at,title,required-by-locale,scoped-category}.ts`, `src/collections/_shared/content-defaults.ts`, `src/lib/admin/payload-vi-overrides.ts`, `src/components/admin/styles/*.scss` (+ component mới trong `src/components/admin/`), importMap.
- Migration: không được sinh. Xác nhận bằng `pnpm payload generate:types` → `src/payload-types.ts` không đổi trường DB (field `ui` không vào types).

## Quyết định (auto proceed — user chỉ thị 2026-10-21)
- D1 **Đuôi locale**: ẩn `.field-label .localized` bằng CSS admin (mọi form). Không thay `FieldLabel`. Ô chọn ngôn ngữ ở thanh trên (BL-039) là chỗ duy nhất thể hiện ngôn ngữ đang sửa; nếu Payload có khoá dịch cho nhãn ô đó → đặt "Đang sửa" trong `payload-vi-overrides.ts` (test khoá tồn tại sẵn có); không có thì giữ, ghi residual. Không phá BL-039 (dropdown nền đặc, nhãn Tiếng Việt/English).
- D2 **RichText**: editor chung (tách ra module, vd `src/lib/admin/rich-text-editor.ts`, factory nhận `placeholder` để T02 dùng lại) = `lexicalEditor({ features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()], admin: { placeholder: "Nhập nội dung tại đây…", hideGutter: true, hideAddBlockButton: true, hideDraggableBlockElement: true } })` (kiểm đúng tên option ở `node_modules/@payloadcms/richtext-lexical/dist/types.d.ts`). Khung viền + nền ô như input khác bằng CSS (token admin sẵn có, AA sáng/tối). Thanh công cụ cố định cần có: đậm, nghiêng, tiêu đề, danh sách, liên kết, chèn ảnh (upload feature có trong default) — kiểm. **Hoàn tác/Làm lại**: lexical của Payload không có sẵn → viết feature nhỏ (nhóm toolbar 2 nút dispatch `UNDO_COMMAND`/`REDO_COMMAND`) nếu gọn (~≤ 100 dòng, không tạo node mới); quá phức tạp → bỏ, ghi residual (Ctrl+Z). Không đổi định dạng dữ liệu lexical đã lưu.
- D3 **Dấu ***: trường bắt buộc qua validate (`requiredByLocale` callers, `scopedCategoryField` khi `required`) hiện `*` như trường `required`. Cách: đánh dấu chung bằng `admin` (vd `admin.className: "tami-required"` + CSS `::after` "*" trên `.field-label`, cùng màu `.required` của Payload) — helper chung (vd `markRequired(field)` hoặc tham số trong `requiredByLocale`), gắn ở `titleField`, mọi field dùng `requiredByLocale` (title/summary/description/content/requirements…), `scopedCategoryField`. KHÔNG chuyển sang `required: true` (đổi schema NOT NULL + chặn sửa bản en). Lỗi validate tiếng Việt sẵn có — giữ.
- D4 **Placeholder**: `titleField({ placeholder })` nhận placeholder theo collection (mặc định "Nhập tiêu đề"); Dự án "VD: Vinhomes Grand Park", Cho thuê "VD: Căn hộ 2PN view sông, đủ nội thất", Tin BĐS "VD: Bán căn 3PN Vinhomes Central Park", Tin tức "VD: Thị trường căn hộ TP.HCM quý 4", Dịch vụ "VD: Tư vấn pháp lý mua nhà", Trang "VD: Giới thiệu", Tuyển dụng "VD: Nhân viên kinh doanh BĐS"; Mô tả ngắn chung "1–2 câu giới thiệu, hiện ở thẻ và kết quả Google". Chỉ `admin.placeholder`.
- D5 **Người tạo**: `defaultValue: ({ user }) => user?.id` trên `authorField` (hàm → không thành DEFAULT DB; xác nhận không sinh migration), giữ hook `defaultToCreator` + access chỉ admin đổi.
- D6 **Slug**: trong `buildSharedFields`, bọc `slug` (+ `scopeSlug`) vào `collapsible` KHÔNG tên `{ label: "Nâng cao", admin: { position: "sidebar", initCollapsed: true } }`; mô tả slug ngắn: "Tự tạo từ tiêu đề. Chỉ sửa khi cần đổi địa chỉ trang." Kiểm `flattenLayoutFields`, `hideTechnicalListFields`, test content-defaults, `omit`/`fieldAccess` (access gắn trên field slug bên trong collapsible), các test tìm field slug theo cấp gốc → sửa test/helper tìm xuyên collapsible. `placeSharedFields` giữ collapsible ở sidebar (Payload chỉ đặt field cấp gốc `position: "sidebar"` vào cột phải — collapsible cấp gốc có `admin.position` được hỗ trợ; kiểm).
- D7 **Bản dịch**: `hasEnglish` thêm `admin.description` "Bật thì website có trang tiếng Anh; hệ thống tự dịch từ bản tiếng Việt." (ô vẫn chỉ đọc). Nhóm `translation`: các trường hệ thống (`status`, `enSource`, `viChangedAfterManual`, `sourceHash`, `translatedAt`, `model`, `lastError`) → `admin.hidden: true` (dữ liệu giữ; kiểm Lọc dịch `TranslationStatusFilter`, StatusBadge, ẩn cột BL-039, dashboard banner dịch lỗi vẫn chạy); thêm field `ui` `translationSummary` (component client đọc `useFormFields`) hiện 1 dòng: "Bản tiếng Anh: chưa dịch" / "đang chờ dịch" / "đã dịch tự động lúc dd/MM/yyyy HH:mm" / "đã sửa tay" (+ cảnh báo nếu `viChangedAfterManual`) / "dịch lỗi — <lastError rút gọn>" / "chờ duyệt"; giữ `retranslateAction`. Mô tả nhóm ngắn lại. `translationGroup()` dùng cả ở globals → áp luôn.
- D8 **Tiêu đề trang tạo mới**: `payload-vi-overrides.ts`: `general.creatingNewLabel` = "Thêm {{label}} mới" (kiểm label truyền vào là số ít); `general.untitled` → "Chưa đặt tên" nếu H1 tạo mới đang hiện "[Chưa có tiêu đề]". Test khoá chuỗi cập nhật.
- D9 **Nút "+"** cạnh ô quan hệ (`relationship-add-new`): hiện chữ "Thêm mới" cạnh dấu + (CSS hoặc khoá dịch tooltip), vùng bấm ≥ 32px, không thay component.
- D10 **Ngày xuất bản**: `admin.description` "Tự điền khi xuất bản lần đầu."
- D11 Test: mở rộng test hiện có (`content-defaults.test.ts`, `payload-vi-overrides.test.ts`, test fields) — slug trong collapsible sidebar + `initCollapsed`; author defaultValue hàm trả user.id; translation fields hidden + có `translationSummary`; trường bắt buộc theo locale có đánh dấu; editor có FixedToolbarFeature + admin options. Component tóm tắt dịch có unit test các trạng thái.

## Acceptance
- [ ] Không còn "— Tiếng Việt"/"— vi" sau nhãn trên mọi form; ô ngôn ngữ BL-039 không vỡ.
- [ ] Mọi ô richText: thanh công cụ cố định luôn hiện, viền như ô khác, chữ gợi ý tiếng Việt, không "+"/tay kéo/"nhấn /".
- [ ] Trường bắt buộc theo ngôn ngữ có `*`.
- [ ] Tiêu đề có placeholder theo collection; Mô tả ngắn có placeholder.
- [ ] Tạo mới: "Người tạo" đã điền người đăng nhập.
- [ ] Slug trong khối "Nâng cao" thu gọn mặc định; vẫn tự sinh.
- [ ] Bản dịch: 1 dòng tóm tắt + nút Dịch lại; trường hệ thống ẩn khỏi form; Lọc dịch / cột vẫn chạy.
- [ ] "Có bản tiếng Anh" + "Ngày xuất bản" có câu giải thích; nút "+" có chữ "Thêm mới"; trang tạo mới "Thêm … mới".
- [ ] Không sinh migration, `payload-types.ts` không đổi trường DB; test cũ PASS.

## Verify
`pnpm vitest run src/lib/admin src/collections src/components/admin src/fields`, `pnpm typecheck`, `pnpm lint`, `pnpm payload generate:importmap` (nếu thêm component) + `pnpm payload generate:types` (không đổi trường). Nếu chạy được app local (`pnpm dev`, `.env.local`) → mở form Dự án tạo mới kiểm trực quan; KHÔNG lưu dữ liệu rác (không lưu, hoặc xoá hẳn bản thử).

## Verification summary
Builder (phase-1-task-01), chưa commit (change-request commit sau review).

**Acceptance (code + test; chưa kiểm trực quan trên app vì cần đăng nhập admin — xem Residual)**
- [x] Đuôi "— Tiếng Việt": `.field-label .localized { display: none }` (`_forms.scss`); ô ngôn ngữ BL-039 không đụng.
- [x] RichText: `createRichTextEditor()` (`src/lib/admin/rich-text-editor.ts`) = defaultFeatures + FixedToolbarFeature + feature Hoàn tác/Làm lại; `hideGutter/hideAddBlockButton/hideDraggableBlockElement/hideInsertParagraphAtEnd`, placeholder "Nhập nội dung tại đây…"; viền/nền như input bằng CSS.
- [x] Hoàn tác/Làm lại BẮT BUỘC: `src/components/admin/lexical/HistoryFeatureClient.tsx` (UNDO/REDO_COMMAND + CAN_UNDO/CAN_REDO, không node mới) + server feature `tamiHistory`.
- [x] Dấu *: `markRequired` (`admin.className: "tami-required"`) ở titleField, mọi `requiredByLocale` (summary/excerpt/content/description/requirements), `scopedCategoryField` khi bắt buộc; CSS `::after "*"` cùng màu `.required`.
- [x] Placeholder tiêu đề theo 7 collection; Mô tả ngắn/Tóm tắt dùng `SUMMARY_PLACEHOLDER`.
- [x] Người tạo: `defaultValue` hàm trả `user.id` (không thành DEFAULT DB); hook + access giữ.
- [x] Slug + scopeSlug trong collapsible KHÔNG tên "Nâng cao" (`position: sidebar`, `initCollapsed`) bọc SAU khi áp access (`resolveSharedFields`); mô tả mới; bỏ `position` trên slug.
- [x] Bản dịch: 7 trường hệ thống `admin.hidden` (giá trị vẫn trong form state), `translationSummary` (ui) + `translationSummary()` ở `lib/translation/admin-ui.ts`, giữ `retranslateAction`; mô tả nhóm ngắn lại; `hasEnglish` có mô tả.
- [x] publishedAt có mô tả; nút "+" (`.relationship-add-new__add-button::after "Thêm mới"`, cao/rộng ≥ 36px); `general.creatingNewLabel` = "Thêm {{label}} mới", `general.untitled` = "Chưa đặt tên".
- [x] Không migration; `generate:types` chỉ đổi JSDoc mô tả (không đổi trường/kiểu DB).

**Quyết định của builder**
- Hoàn tác/Làm lại: 2 nút dùng `Component` riêng (SVG + title/aria-label), group key `history`, `order: 1` (đầu thanh).
- `richTextEditorOptions()` tách khỏi `createRichTextEditor()` để test được và T02 truyền `placeholder` riêng.
- Ô lọc dịch: không đổi (URL `where`); BL-039 đã ẩn cột/lọc `translation.*`.
- CSS gom ở `styles/_forms.scss` mới (+ `@use` trong `custom.scss`), không dùng !important.
- `import "lexical"` không có trong dependencies → dùng `@payloadcms/richtext-lexical/lexical`.

**Files**: src/payload.config.ts · src/lib/admin/{rich-text-editor.ts,payload-vi-overrides.ts} · src/components/admin/{lexical/HistoryFeatureClient.tsx,TranslationSummary.tsx,styles/_forms.scss} · src/app/(payload)/{custom.scss,admin/importMap.js} · src/fields/{required-by-locale,title,author,slug,published-at,scoped-category,translation}.ts · src/lib/translation/admin-ui.ts · src/collections/_shared/content-defaults.ts · 7 collection (title placeholder + markRequired + SUMMARY_PLACEHOLDER) · src/payload-types.ts (chỉ JSDoc).
**Tests**: mới `rich-text-editor.test.ts`, `fields/form-friendly.test.ts`, `collections/form-friendly.test.ts`, `TranslationSummary.test.tsx`; sửa `content-defaults.test.ts`, `form-layout.test.ts`, `payload-vi-overrides.test.ts`.

**Verify**: `pnpm vitest run src/lib/admin src/collections src/components/admin src/fields src/lib/translation src/globals` = 59 files / 477 tests PASS · `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard) · `generate:importmap` (+3 mục: HistoryFeatureClient, FixedToolbarFeatureClient, TranslationSummary) · `generate:types` (chỉ JSDoc).

**Residual**
- Chưa kiểm trực quan trên app (admin cần đăng nhập; không dùng mật khẩu trong .env.local). Reviewer/người duyệt nên mở form Dự án tạo mới: thanh công cụ, viền, dấu *, khối "Nâng cao", dòng tóm tắt dịch, nút "Thêm mới".
- G2: H1 trang tạo mới vẫn "[Chưa đặt tên]" (không có cách sạch không thay view Payload); chỉ thanh nút hiện "Thêm … mới".
- G11 LOW: "Thêm Dự án mới" giữ hoa chữ đầu tên mục.
- G9 LOW: dấu * hiện cả ở bản en.
- G8: lỗi validate là tooltip đỏ tại ô (chưa chỉnh vị trí).
- D1 "Đang sửa:" không làm (Payload không có khoá dịch cho nhãn ô ngôn ngữ).
- Doc impact (G12): reconcile `docs/specs/2026-10-19-admin-ui-saas-design.md` §4 + `docs/DESIGN.md` phần admin ở close-out.

## Bổ sung sau spec-validation plan r1 (`.context/review-reports/spec-validation-feature-admin-form-non-tech-friendly-plan.md`)
- G3 → D2: nút **Hoàn tác / Làm lại BẮT BUỘC** (feature client toolbar nhỏ dispatch `UNDO_COMMAND`/`REDO_COMMAND` qua history sẵn có của editor; không tạo node).
- G6 → D2: thêm `hideInsertParagraphAtEnd: true`.
- G2 → D8: `creatingNewLabel` chỉ đổi chữ nhỏ ở thanh nút. Tiêu đề trang (H1) khi tạo mới: làm "Thêm <tên> mới" nếu có cách không thay view Payload (vd component client nhỏ qua slot edit có sẵn như `beforeDocumentControls`/`Description` của collection + CSS ẩn H1 "[…]" chỉ ở màn tạo — kiểm class/route màn tạo); không có cách sạch → `general.untitled` = "Chưa đặt tên" + residual.
- G11 → D8: chấp nhận "Thêm {{label}} mới" giữ hoa chữ đầu tên mục (tên mục là tên riêng của mục quản lý, như nhãn menu) — ghi residual LOW.
- G8: lỗi validate của Payload hiện dạng tooltip đỏ ngay tại ô — giữ (spec delta sửa "hiện ngay tại ô").
- G9: dấu `*` hiện ở cả bản tiếng Anh (ở đó bắt buộc khi đã bật "Có bản tiếng Anh") — chấp nhận, residual LOW.
- G10 → D6: `withFieldAccess` chỉ map field cấp đầu → bọc collapsible SAU khi áp access (vd trong `placeSharedFields`/sau `resolveSharedFields`), cập nhật `form-layout.test.ts`/test tìm slug.
- Doc impact (G12): `docs/specs/2026-10-19-admin-ui-saas-design.md` §4 As-built + `docs/DESIGN.md` phần admin — reconcile ở close-out.

## Verification summary — Round 2 (sau review r1 FAIL)
- M1: nút "Thêm mới" ≥ 44px ở ≤ 767px (`_forms.scss`), font `0.8125rem`.
- m1: comment `required-by-locale.ts` trỏ `_forms.scss`. m2: `role="status"`. m5: style inline chuyển vào class `.tami-translation-summary(__text/__warning)`.
- m3: `translationSummary()` đổi mã lỗi sang câu tiếng Việt qua `TRANSLATION_ERROR_MESSAGES` (errors.ts); mã lạ → "không dịch được, thử dịch lại sau".
- m4 giữ nguyên: `Cell: StatusBadgeCell` trên `translation.status` (đã `admin.hidden`) vẫn dùng ở danh sách/cột khác, bỏ đi sẽ đổi hành vi BL-039/StatusBadge ngoài phạm vi.
- Verify: vitest (src/lib/admin src/collections src/components/admin src/fields src/lib/translation src/globals), typecheck, lint — xem kết quả cuối phiên.
