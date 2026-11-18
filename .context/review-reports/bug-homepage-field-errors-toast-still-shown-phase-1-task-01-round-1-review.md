Agent: reviewer

# Review — bug-homepage-field-errors-toast-still-shown · phase-1-task-01 · round 1 (BL-119)

- Review level: **STRICT**
- Reason: `afterError` toàn cục đổi shape response lỗi 400 của mọi collection/global (REST, production); helper field dùng chung + CSS admin dùng `:has()` ở mức global stylesheet.
- Blast radius: `src/hooks/restore-public-error-message.ts` (mọi lỗi REST có `afterError`), `src/fields/max-selection.ts` (4 ô relationship Homepage: `heroSearch.chipProjects`, `featuredProjects.projects`, `rentals.categories`, `news.posts`), `src/components/admin/MaxSelectionHint.tsx`, `src/components/admin/styles/_field-errors.scss` (stylesheet admin toàn cục), `importMap.js`. Schema/DB/payload-types: không đổi (maxRows đã có từ trước; filterOptions/validate không sinh type).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `npx vitest run src/hooks/restore-public-error-message.test.ts src/fields/max-selection.test.ts src/components/admin/MaxSelectionHint.test.tsx src/components/admin/field-errors-style.test.ts src/globals` | PASS — 9 files, 55 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm lint` | PASS (eslint, không lỗi) |
| `npx playwright test tests/e2e/admin/homepage-max-selection.spec.ts --project=admin-content --reporter=line` | PASS — 3/3 (setup ×2 + spec Cho thuê) trên dev 3000 |

## Ảnh đã xem (Read trực tiếp)
- `bl119-before-prod-save-same-tab.png` — prod: 5 danh mục, toast gom "Trường sau chưa hợp lệ…" góc phải, ô không đỏ. Khớp root cause B.
- `bl119-after-select-hint.png` — dev: 4 danh mục, "Tối đa 4 danh mục." dưới ô, không còn nút "+". OK.
- `bl119-after-prod-legacy-select.png` — prod, dữ liệu cũ 5: chữ đỏ "Tối đa 4 danh mục." + viền đỏ trước khi Lưu. OK.
- `bl119-after-prod-legacy-save-other-tab.png` — prod: khối Cho thuê tự mở, badge "1 Lỗi", lỗi dưới ô + viền đỏ, không toast. Root cause B đã đóng.
- `bl119-after-prod-featured-projects-locked.png` — Dự án hiển thị đúng 6 (= max, KHÔNG vượt) → menu "Không có lựa chọn" (khoá OK) **nhưng ô có viền đỏ** → bằng chứng của finding MAJOR-1 (ô Cho thuê cùng tab đang 5 > 4 làm đỏ lây sang).
- Chưa mở (hết cap đọc STRICT 25): `bl119-before-select.png`, `bl119-before-save-same-tab.png`, `bl119-before-prod-select.png`, `bl119-before-prod-save-other-tab.png`, `bl119-after-select.png`, `bl119-after-prod-select.png`, `bl119-after-prod-legacy-save-same-tab.png` → Residual risk (mô tả của orchestrator khớp với các ảnh đã xem).

## Responsive Checklist Gate
Diff UI = admin Payload (stylesheet nội bộ, 1 dòng chữ nhắc dưới ô); không đổi layout/grid/media/nav.
- Layout (no h-scroll, mobile-first, grid): N/A — không thêm layout; `<p>` block chảy theo ô.
- Typography/Spacing: OK — `font-size: 0.9375rem`, `margin: 0.3rem 0 0` (rem).
- Media: N/A. Touch target: N/A (không thêm control; chỉ ẩn nút "+" có sẵn). Table: N/A.
- Viewport/A11y: OK — không 100vh/animation; `role="status"` cho nhắc. Chưa xác minh 375/768 bằng browser (ảnh chỉ 1440/crop) → Residual risk thấp.

## Skill gates
- aislop: skip — không nằm trong verify commands được allow của profile.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint → PASS).
- ocr (open-code-review): skip, ocr not installed / không trong allow list.
- AI-readable: OK — 1 indicator nhẹ (đếm trùng lặp max trong `validateRentalCategories` + `withMaxSelection`), < 3. Hàm ≤ 50 dòng, file ngắn, comment nêu WHY.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip — không có môi trường pentest được phép.

## Trọng tâm 1 — afterError (OK)
- Điều kiện: `status === 400 && isPublic === true && data.errors` là mảng không rỗng mà mọi phần tử có `path`/`message` string, `message` string, và `result.errors[0].data == null`. `ValidationError` của Payload gọi `APIError(msg, 400, results)` → `isPublic` tự = true (status ≠ 500) (`node_modules/payload/dist/errors/APIError.js:33`, `ValidationError.js:33`). Data trả ra chính là `error.data` = `{collection|global, errors:[{label,message,path}]}` — đúng shape `formatErrors` nhánh 1 ở dev → không lộ thêm gì so với dev.
- Không bắt nhầm: 409/403/413/500 bị loại bởi `status !== 400`; `QueryError` (data là mảng `{path}` không `errors`) bị loại; `errors: []`, phần tử thiếu path, `isPublic:false`, result đã có data → không đụng (có unit test). Nhánh BL-093 vẫn chạy khi hook mới trả undefined (BL-093 yêu cầu `data == null` nên không giao nhau). `stack` giữ nguyên (`...result`), status giữ 400.
- Nhiều lỗi: `data.errors` giữ đủ; chỉ `result.errors` được thay bằng 1 entry — đúng như formatErrors gốc (luôn 1 entry).

## Trọng tâm 2 — withMaxSelection (OK)
- `filterOptions` hàm: base object/hàm/undefined→true/false đều xử lý; ids lấy cả dạng object populate; đủ `max` → `and:[base, {id in ids}]`. `relationship()` validate lúc lưu chạy filterOptions với cùng siblingData → id đã chọn ⊂ lock → hợp lệ; vượt max thì `validate` trả sớm trước khi query. REST read không bị ảnh hưởng (filterOptions chỉ dùng cho admin options + validate).
- `validate`: rental giữ `validateRentalCategories` (scope rental + thông điệp BL-116); các ô khác rơi về `relationship()` mặc định. `maxRows` vẫn được đặt → payload-types không đổi (typecheck PASS).

## Findings

### [MAJOR-1] CSS `:has()` lan ra mọi ô trong cùng collapsible/tab — viền đỏ và ẩn nút "+" ở ô KHÔNG giới hạn
`src/components/admin/styles/_field-errors.scss:67-74`
```scss
.field-type:has(.tami-max-hint[data-over-max]) .rs__control { border-color: … }
.field-type:has(.tami-max-hint) .relationship-add-new { display: none; }
```
`.field-type` (`fieldBaseClass`) không chỉ là wrapper của ô relationship: Collapsible (`@payloadcms/ui/dist/fields/Collapsible/index.js:118`), Group, Tabs, Row, Array cũng mang class này. Vì vậy selector khớp cả `.tabs-field` / `.collapsible-field` tổ tiên:
- Tab "Sản phẩm & Tin nổi bật" (`src/globals/Homepage.ts:285-293`) chứa thêm `services.items` và `featuredOffers.posts` (không giới hạn). Khi `featuredProjects.projects` đủ 6 (trạng thái bình thường, ảnh before-prod cho thấy DB đang có 6) → nút "+ Thêm mới" của **Dịch vụ hiển thị, Tin ưu đãi hiển thị, Danh mục cho thuê, Bài viết** đều bị ẩn dù chưa đủ.
- Khi một ô vượt max (dữ liệu cũ) → **mọi** `.rs__control` trong tab (relationship + select) bị viền đỏ. Ảnh `bl119-after-prod-featured-projects-locked.png` chứng minh: Dự án hiển thị đúng 6 (không vượt) vẫn viền đỏ do Cho thuê cùng tab đang 5.
- Tab "Đầu trang & Banner": `chipProjects` đủ 6 → nút "+" của các relationship/select khác trong tab bị ẩn; vượt → select khác đỏ.
Fix đề xuất: neo vào chính wrapper relationship, vd. `.field-type.relationship:has(> .tami-max-hint…)` (hint là con trực tiếp? kiểm DOM `Relationship/Input.js:777` — AfterInput render trong wrapper `.field-type.relationship`), hoặc tốt hơn `.relationship:has(.tami-max-hint)` + loại tổ tiên bằng `:not(:has(.relationship .tami-max-hint))`; đơn giản nhất: cho `MaxSelectionHint` đặt class/attr lên wrapper (vd. `data-max-reached`) qua selector `.field-type.relationship:has(> … )`. Bổ sung assert e2e: đủ 6 Dự án hiển thị → nút "+" của "Tin ưu đãi hiển thị" vẫn hiện; Cho thuê 5 → `.rs__control` của Dự án hiển thị không đỏ. Rebuild prod và chụp lại ảnh featured-projects-locked.

### [MAJOR-2] Repro Verification chưa đóng
`tasks/bug-homepage-field-errors-toast-still-shown/phase-1-task-01.md:54-55` — "Actual after fix: (điền sau)", "Status: pending". Bug task bắt buộc Status `PASS` + evidence kiểm chứng được (ảnh/log probe prod đã có — cần ghi vào task, kèm đường dẫn ảnh + response 400 sau fix). Acceptance checkbox cũng chưa tick. Theo luật → FAIL cho tới khi điền.

### [MINOR-1] Lặp chữ giới hạn dưới ô
`bl119-after-select-hint.png`: "Tối đa 4 danh mục." ngay trên description "Tối đa 4. Để trống…". Cân nhắc rút description còn "Để trống thì…" (4 ô) để không lặp.

### [MINOR-2] Đếm max trùng lặp
`src/globals/homepage/blocks.ts:53` — `validateRentalCategories` vẫn tự kiểm `> RENTAL_CATEGORIES_MAX`; `withMaxSelection.validate` đã chặn trước → nhánh này là dead code. Có thể bỏ (giữ test BL-116 thông qua field đã bọc).

### [MINOR-3] Test hồi quy hẹp
E2E chỉ phủ Cho thuê (khoá ở 4 + hint). Thiếu: bỏ 1 mục khi đã đủ → menu mở lại; 3 ô còn lại; ca CSS lan (MAJOR-1). Hook afterError ở prod chỉ có probe tạm (`_bl119-probe.spec.ts`, sẽ xoá) — nên giữ unit test hiện có (đủ) và ghi log probe vào task làm evidence.

## Residual risk
- 7 ảnh chưa mở do cap đọc; CSS ẩn nút "+" chỉ có trên dev (không có ảnh prod sau rebuild).
- Responsive 375/768 chưa xác minh bằng browser (admin nội bộ, thay đổi chỉ là 1 dòng chữ).
- Bundle prod nhiều bản sao `payload` vẫn còn (fix là workaround duck-typing) — lỗi `instanceof` khác cùng họ có thể xuất hiện ở chỗ khác.

## Verdict: FAIL
Lý do: MAJOR-1 (CSS `:has()` lan sang ô khác trong cùng tab — có bằng chứng ảnh) và MAJOR-2 (Repro Verification `pending`). Phần backend (afterError, withMaxSelection) đạt; sau khi sửa selector + điền repro PASS có thể PASS ở round 2.
