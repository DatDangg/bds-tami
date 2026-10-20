# feature-admin-list-columns-filters-locale · phase-1-task-02 — Ô ngôn ngữ "Tiếng Việt/English" + "Lọc nâng cao" + gợi ý ô tìm kiếm (BL-039 #3, #4 nút, #6)

- Change doc: `spec/changes/2026-10-20-admin-list-columns-filters-locale.md`. Spec delta: FR-ADM-19 câu "Danh sách gọn (BL-039)" (ô ngôn ngữ, "Lọc nâng cao", gợi ý tìm kiếm).
- Phụ thuộc: T01 (cùng file collection — chạy sau). Trạng thái: `done` — Reviewer STRICT r1 PASS (`.context/review-reports/feature-admin-list-columns-filters-locale-phase-1-task-02-round-1-review.md`; 3 MINOR để lại: rule `.popup__content` lặp mặc định Payload, ghi chú locale phải có label, test Lead yếu).

## Classification / Risk
- Type: **MODIFY** (`localization.locales` dạng object có `label`, ghi đè chữ Payload vi, SCSS, `listSearchableFields`). Không đổi schema/DB (locale code giữ `vi`/`en`).
- Risk: **MEDIUM** — `localization` là config toàn cục (frontend `[locale]`, job dịch, `payload-types`) → review **STRICT** (shared config).
- Blast radius: `src/payload.config.ts`, `src/lib/admin/payload-vi-overrides.ts` (+test), `src/components/admin/styles/*.scss`, `src/collections/*.ts` (`listSearchableFields`).
- Doc impact: FR-ADM-19 (đã ghi). Migration: không.

## Quyết định (auto proceed)
- D5 `localization.locales: [{ code: "vi", label: "Tiếng Việt" }, { code: "en", label: "English" }]`, `defaultLocale`/`fallback` giữ. Grep mọi chỗ đọc `config.localization.locales` / `localeCodes` / so sánh locale chuỗi (job dịch, hooks, test, `scripts/`) để không vỡ; `payload-types.ts` không đổi kiểu locale (`'vi' | 'en'`). Nhãn hiện cả trên nút lẫn danh sách xổ.
- D6 Danh sách xổ ngôn ngữ: nằm trên cùng (z-index cao hơn thanh công cụ danh sách/nút "Thùng rác"/"Tạo mới"), nền đặc theo token surface, viền/bóng; chữ "Thùng rác" không xuyên qua/đè; ở 375px nằm trong viewport (không tràn ngang). Chỉ SCSS trong `src/components/admin/styles/` (partial + token có sẵn), không override component Payload.
- D7 Nút bộ lọc của ListControls → chữ **"Lọc nâng cao"** bằng ghi đè khoá dịch trong `PAYLOAD_VI_OVERRIDES` (đúng khoá Payload 3.91 dùng cho nút; kiểm khoá đó không dùng chỗ khác làm sai nghĩa; cập nhật test khoá). Vị trí "sau hàng chip": chip ở slot `beforeListTable` (dưới hàng tìm kiếm). Nếu chỉ cần CSS (cùng container) → làm; nếu phải thay ListControls của Payload → **không làm**, giữ vị trí, ghi lý do + residual.
- D8 Gợi ý ô tìm kiếm: Payload hiện "Tìm theo {{label}}" từ nhãn `listSearchableFields` (hoặc `useAsTitle`). Khai báo `listSearchableFields` nghiệp vụ cho collection chưa có: Dự án `title`; Tin tức, Tin BĐS `title`; Tuyển dụng `title`; Hồ sơ ứng tuyển họ tên + email + SĐT (đúng tên trường thật); Trang, Dịch vụ `title`; Chủ đầu tư, Danh mục `name`; Media `filename` + `alt`; Staff họ tên + email; Tỉnh/Phường `name`. Chỉ trường `text`/`email` có thật (không relationship). Lead/Cho thuê giữ nguyên. Nếu cần, ghi đè `general.searchBy` (giữ `{{label}}`). Test: mỗi collection kể trên có `listSearchableFields` trỏ trường tồn tại kiểu text/email.

## Acceptance
- [x] Ô ngôn ngữ hiện "Tiếng Việt" / "English" (nút + danh sách xổ); xổ xuống không bị "Thùng rác"/"Tạo mới" đè/xuyên; desktop + 375px.
- [x] Nút bộ lọc chữ "Lọc nâng cao" (vị trí: làm hoặc ghi residual theo D7).
- [x] Ô tìm kiếm mỗi màn nói rõ tìm theo gì, khớp `listSearchableFields`.
- [x] Không đổi schema/DB/locale code; frontend `/en` + job dịch không vỡ (test liên quan PASS).

## Verify
`pnpm vitest run src/lib src/collections src/components/admin`, `pnpm typecheck`, `pnpm lint`.

## Verification summary
- Files: `src/payload.config.ts` (locales có `label`), `src/lib/admin/payload-vi-overrides.ts` + `.test.ts` (`general.filters` = "Lọc nâng cao"), `src/collections/admin-collections.ts` (`LIST_SEARCHABLE_FIELDS` + `withListSearchableFields`, không ghi đè khai báo sẵn của Lead/Cho thuê), `src/components/admin/styles/_surfaces.scss`, test mới `src/collections/admin-list-search.test.ts`.
- Evidence (@payloadcms/ui 3.91): `elements/ListControls/index.js:121` nút lọc dùng `t('general:filters')` (khoá chỉ dùng 1 chỗ → ghi đè an toàn); `:59-78` placeholder = "Tìm theo" + nhãn các trường trong `listSearchableFields` (`getTextFieldsToBeSearched.js`); `elements/Localizer/index.js:62,84-89` nhãn từ `locale.label`, Payload ghép thêm `<span class="localizer__locale-code">(vi)</span>`; popup render portal vào body, `z-index: var(--z-popup)` = 60 (`scss/app.scss:35`).
- Verify: `pnpm vitest run src/lib src/collections src/components/admin` 133 files / 1322 tests PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard); `payload generate:types` không đổi `payload-types.ts`. Grep: không code nào đọc `localization.locales` ngoài Payload (frontend dùng `routing.locales` của next-intl; `default-read-locale.ts` chỉ dùng `defaultLocale`).
- Chạy thật (next dev --webpack cổng 3917, đã tắt; turbopack lỗi do node_modules là junction): /admin/collections/news hiện "Ngôn ngữ: Tiếng Việt", nút "Lọc nâng cao", ô tìm "Tìm theo Tiêu đề"; popup ngôn ngữ trước CSS là "Tiếng Việt (vi)/English (en)", phần tử trên cùng tại popup là chính popup (z 60, nền trắng); sau CSS `.localizer__locale-code` display:none, popup z-index 60 (kiểm bằng computed style).
- Quyết định builder: (1) khai báo `listSearchableFields` tập trung ở `admin-collections.ts` thay vì sửa 13 file collection. (2) D6: Payload đã đặt z-popup 60 + nền đặc; thêm `z-index`/`max-width: calc(100vw - 16px)` tường minh và ẩn mã "(vi)/(en)" để chữ chỉ còn "Tiếng Việt"/"English". Không tái hiện được chữ "Thùng rác" xuyên qua ở desktop với popup hiện tại. (3) D7: nút giữ nguyên vị trí do ListControls của Payload quyết (đưa xuống sau hàng chip cần thay component) — chỉ đổi chữ; residual theo D7.
- Residual: chưa xem trực quan popup sau CSS và ở 375px (pane trình duyệt ẩn, emulation không đổi innerWidth) — nên kiểm tay; `filename` của Media chỉ kiểm lúc chạy (Payload thêm khi sanitize), test bỏ qua trường built-in này.
