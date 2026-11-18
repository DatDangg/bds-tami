# bug-homepage-field-errors-toast-still-shown · phase-1-task-01 — Homepage: chọn được quá 4 danh mục cho thuê, toast gom thay vì lỗi dưới ô (BL-119, mở lại BL-116 / QA 33)

- Change doc: `spec/changes/2026-11-09-homepage-field-errors-toast-still-shown.md` (BACKLOG BL-119).
- Phụ thuộc: không. Liên quan BL-116 (d3443df4), BL-058 T02 (364e9c7), BL-093 (2f55b1f5), BL-115.
- Phase plan: user duyệt hướng sửa ("OK, làm luôn") 2026-11-09.
- Trạng thái: `in_review`

## Classification / Risk
- Type: **BUG** (admin UI + xử lý lỗi REST toàn cục; schema/DB không đổi).
- Severity: medium (QA 33 mở lại; phần toast ảnh hưởng MỌI form admin ở build production).
- Risk: **MEDIUM-HIGH** — `afterError` toàn cục đổi response lỗi validate của mọi collection/global ở production; field helper dùng chung cho 4 ô relationship Homepage.
- Expected review level: **STRICT** (shared hook / API error response shape).
- Doc impact dự kiến: `no doc impact` (không đổi contract tài liệu hoá; response lỗi validate trở về đúng shape chuẩn Payload).

## Root cause (đã chứng minh)

### A. Chọn được quá 4, không đỏ lúc chọn
- `validateRentalCategories` (`src/globals/homepage/blocks.ts:50`) trả lỗi ở `onChange` (BL-116), nhưng Payload chỉ hiện lỗi khi `showError = valid === false && submitted` (`node_modules/@payloadcms/ui/dist/forms/useField/index.js:74`) → trước lần Lưu đầu tiên lỗi onChange không hiện. Relationship hasMany của Payload 3.91 không khoá chọn theo `maxRows` (`fields/Relationship/index.js:149` chỉ truyền `maxRows`, Input không chặn) → chọn được mục thứ 5, 6.
- Evidence (Playwright, dev + prod build): chọn tuần tự được 5 danh mục, menu vẫn còn 2 mục, ô không đỏ — `.context/review-reports/assets/bl119-before-select.png`.

### B. Toast gom "Trường sau chưa hợp lệ: …" (môi trường build production — staging/prod)
- Build production (`pnpm build && next start -p 3100`): bấm Lưu với 5 danh mục → `POST /api/globals/homepage` trả 400
  `{"errors":[{"message":"Trường sau chưa hợp lệ: Sản phẩm & Tin nổi bật > Cho thuê > Danh mục cho thuê hiển thị"}]}` — **thiếu `data.errors`** (path + message theo ô). Dev trả đủ `data`.
  → Form Payload không gắn lỗi vào ô (không `.field-error`, không viền đỏ) → `FormErrorFocus` không tìm thấy ô lỗi → `markUnmatchedToasts` gắn cờ → toast hiện. Đúng ảnh QA. Evidence: `.context/review-reports/assets/bl119-before-prod-save-same-tab.png` (toast hiện, ô không đỏ); dev (`bl119-before-save-same-tab.png`): lỗi dưới ô, toast ẩn.
- Vì sao mất `data`: `formatErrors` (`node_modules/payload/dist/utilities/formatErrors.js:5`) chỉ trả `data` khi `incoming instanceof ValidationError || instanceof APIError`. Bundle production có nhiều bản sao `payload/dist` (≥ 6 chunk chứa `followingFieldsInvalid_one` trong `.next/server/chunks`), instance Payload (cache `global._payload`) ném `ValidationError` của một bản sao còn `routeError` của route `/api` kiểm `instanceof` theo bản sao khác → false → rơi xuống nhánh `{ message }`. Cùng họ lỗi với BL-093 (minify tên lớp). Hook `restorePublicErrorMessage` (`src/hooks/restore-public-error-message.ts:14`) bỏ qua lỗi có `data` nên không cứu.
- Phạm vi: mọi lỗi validate theo ô của MỌI form admin trên staging/prod (quy ước BL-058 T02 chưa từng chạy ở production).

## Thiết kế fix
1. `afterError` toàn cục: duck-typing (không dựa `instanceof`) — lỗi status 400, `isPublic === true`, có `data.errors` là mảng `{ path: string, message: string }` mà `result.errors[0].data` thiếu → trả `{ ...result, errors: [{ name: "ValidationError", data: error.data, message: error.message }] }` (đúng shape `formatErrors` nhánh 1). Giữ nguyên các nhánh BL-093.
2. Helper dùng chung cho relationship hasMany có giới hạn (`src/fields/max-selection.ts` hoặc tương đương):
   - `filterOptions` dạng hàm: khi `siblingData[name]` đã đủ `max` → AND với `{ id: { in: <ids đã chọn> } }` (dropdown hết mục để chọn thêm), giữ filter gốc (vd. scope rental).
   - `validate`: kiểm số lượng trước (`Tối đa N <đơn vị>.`), rồi validate gốc / `relationship()` mặc định.
   - `admin.components.afterInput` → client component `MaxSelectionHint` (đọc `useField` value): đủ N → nhắc "Tối đa N <đơn vị>." dưới ô; > N (dữ liệu cũ/API) → chữ đỏ + viền đỏ; ẩn khi ô đang hiện lỗi server (tránh lặp).
3. Áp cho: Cho thuê · Danh mục (4, "danh mục"), Dự án nổi bật · Dự án hiển thị (6, "dự án"), Ô tìm kiếm · Dự án gợi ý (6, "dự án"), Tin tức · Bài viết (3, "bài viết"). Slide hero (array, max 8) + Điểm mạnh (array 2–6): Payload array đã ẩn nút thêm khi đủ maxRows → kiểm trên UI, không đổi nếu đúng.

## Files (dự kiến)
- Sửa: `src/hooks/restore-public-error-message.ts` (+ test), `src/globals/homepage/blocks.ts`, `src/globals/Homepage.ts`, `src/app/(payload)/admin/importMap.js` (generate), styles admin (nếu cần).
- Mới: helper field + `src/components/admin/MaxSelectionHint.tsx` (+ test), `tests/e2e/admin/homepage-max-selection.spec.ts` (Playwright hồi quy).

## Acceptance
- [x] Đủ 4 danh mục → dropdown không còn mục chọn thêm + "Tối đa 4 danh mục." dưới ô.
- [x] > 4 (API/dữ liệu cũ) → Lưu bị chặn, lỗi dưới ô + viền đỏ, khối tự mở + cuộn tới ô, KHÔNG toast gom — kiểm trên build production.
- [x] Cùng cơ chế cho Dự án hiển thị (6), Dự án gợi ý (6), Bài viết tin tức (3); slide hero 8 (array) — Payload tự ẩn nút thêm khi đủ maxRows (kiểm theo code, không đổi).
- [x] Unit test + Playwright có ảnh trước/sau.
- [x] `pnpm typecheck`, `pnpm lint`, vitest liên quan PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: /admin/globals/homepage → Sản phẩm & Tin nổi bật → Cho thuê → chọn 5 → Lưu (build production).
- Expected: không chọn được mục thứ 5; nếu vẫn > 4 → lỗi dưới ô + viền đỏ, không toast.
- Actual before fix: chọn được 5; prod build → toast gom, ô không đỏ, response 400 thiếu `data`.
- Actual after fix (dev 3000 + build production `next start -p 3100`, cùng DB dev):
  - Đủ 4 danh mục → menu "Không có lựa chọn", nút "+ Thêm mới" ẩn, "Tối đa 4 danh mục." dưới ô; bỏ 1 mục → menu có lại mục chọn (e2e `tests/e2e/admin/homepage-max-selection.spec.ts`). Dự án hiển thị 6 → "Không có lựa chọn" (prod).
  - Dữ liệu cũ 5 danh mục (seed SQL vào DB dev để giả lập, đã khôi phục `[]` sau test): trước Lưu chữ đỏ + viền đỏ; Lưu từ tab khác khi khối gập → 400 `{"errors":[{"name":"ValidationError","data":{"errors":[{"message":"Tối đa 4 danh mục.","path":"rentals.categories",…}]},…}]}`, tab + khối tự mở, lỗi dưới ô + viền đỏ, focus `#field-rentals__categories`, toast `visible:false, unmatched:false`.
  - Sau fix review r1 (CSS thu về `.field-type.relationship`): ô khác cùng tab không còn viền đỏ / mất nút "+".
- Evidence: ảnh `.context/review-reports/assets/bl119-before-*.png` (trước) và `bl119-after-select.png`, `bl119-after-select-hint.png`, `bl119-after-prod-select.png`, `bl119-after2-prod-legacy-select.png`, `bl119-after2-prod-legacy-save-other-tab.png`, `bl119-after2-prod-legacy-featured-projects-locked.png` (sau, build prod dựng lại sau fix r1); vitest 74 file / 616 test PASS; e2e 3/3 PASS.
- Status: PASS

## Residual risk
- Chưa kiểm trực tiếp trên staging (cần deploy); đã kiểm bằng build production local cùng code — đây đúng là môi trường tái hiện được lỗi toast.
- Ô đang vượt giới hạn VÀ đang hiện lỗi server: hint ẩn (tránh lặp chữ) nên nút "+ Thêm mới" hiện lại — Lưu vẫn bị chặn.
- filterOptions khoá cập nhật sau debounce form-state (~vài trăm ms); thao tác cực nhanh có thể chọn quá → hint đỏ + Lưu bị chặn.
- Slide hero (8) / Điểm mạnh (2–6) là array: Payload ẩn nút thêm khi đủ maxRows (`@payloadcms/ui/dist/fields/Array/index.js:285,426`), không đổi.

## Doc impact
`no doc impact` — response lỗi validate ở production trở về shape chuẩn Payload (như dev), không đổi contract tài liệu hoá.
