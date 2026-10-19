# feature-select-dropdown-styling · phase-1-task-01 — Site public: ô chọn dùng Select TAMI (Radix)

- Change doc: `spec/changes/2026-10-19-select-dropdown-styling.md` (BACKLOG BL-016)
- Spec: design-spec S02 (lọc dự án), S04 (lọc cho thuê, áp dụng ngay), S12 (lọc tuyển dụng); `docs/DESIGN.md` (token form control)

## Hiện trạng (change-request đã kiểm)
- `src/components/ui/select.tsx` — Select TAMI (Radix `radix-ui`), style đúng token, **chưa nơi nào dùng**.
- `<select>` gốc không `appearance-none` (mũi tên trình duyệt dính mép, chữ bị cắt, popup OS):
  - `src/components/rentals/FilterFields.tsx:141,152,162` (danh mục / tỉnh / phường; client component, đổi là áp dụng ngay `onChange(..., "now")`; tỉnh đổi → reset `ward: ""`; phường `disabled` khi chưa chọn tỉnh). **Không có form GET** — trang cho thuê vốn cần JS.
  - `src/components/rentals/SortSelect.tsx:27` (`FIELD_CLASS` export, dùng ở FilterFields).
  - `src/components/projects/ProjectFilters.tsx:39,50` và `src/components/careers/JobFilters.tsx:36` — **Server Component**, `<Form>` của next/form (GET) + nút "Lọc": JSDoc ghi rõ **dùng được không cần JS** (progressive enhancement) và **không tự gửi khi đổi giá trị** (WCAG 3.2.2).
  - `src/components/projects/FloorPlans.tsx:48` (client, < md khi ≥ 6 mặt bằng; value = index số).
  - `src/components/forms/FormField.tsx:55-66` (`as: "select"`) — hiện **chỉ test dùng** (`FormField.test.tsx`), LeadForm/ApplyForm chưa dùng select; form submit qua JS (`use-public-form`).

## Classification / Risk
- Type: **MODIFY** (UI). Không đổi API / schema / access / query param.
- Risk: **MEDIUM** — component dùng chung (`FormField`, `FIELD_CLASS`) + hành vi lọc trên 3 trang danh sách + no-JS fallback. Reviewer: **NORMAL** (nâng STRICT nếu thấy đổi contract URL).

## Quyết định thiết kế (change-request)
1. **Radix SelectItem không cho `value=""`** → các mục "Tất cả …" dùng giá trị sentinel nội bộ (vd `"__all__"`), map ↔ `""` ở ranh giới. URL/searchParams/state **phải giữ nguyên như cũ** (không bao giờ lộ sentinel).
2. **Submit form**: KHÔNG truyền `name` cho Radix Root (input ẩn của Radix sẽ gửi sentinel và chỉ render sau mount). Thay vào đó tự render `<input type="hidden" name={name} value={giá trị đã map}>` cạnh trigger khi cần `name`.
3. **Progressive enhancement cho form GET (`ProjectFilters`, `JobFilters`)**: không được mất khả năng lọc khi không có JS. Làm 1 client component nhỏ (vd `src/components/ui/form-select.tsx` hoặc thêm export trong `select.tsx`) render **`<select>` gốc đã style** (cùng chiều cao/viền/bo góc/padding với Select TAMI, `appearance-none`, `pr-10`, `truncate`, icon `CaretDown` absolute có padding) trong SSR/trước hydrate, rồi **sau mount** (useEffect) chuyển sang Select TAMI + input ẩn `name`. Hai component server vẫn là server, chỉ ô chọn là client. Vẫn không tự gửi khi đổi (giữ nút "Lọc"). Ô gốc fallback dùng chung style để không nháy layout.
4. **Rentals (`FilterFields`, `SortSelect`) + `FloorPlans`**: dùng thẳng Select TAMI (đã cần JS). Giữ đúng callback/semantic hiện có (tỉnh → reset phường, disabled phường, áp dụng ngay). FloorPlans map index ↔ string.
5. **`FormField as: "select"`**: đổi sang Select TAMI; giữ `id` trên trigger (label `htmlFor`), `aria-invalid`, `aria-describedby`, `aria-required`/required, `disabled`; submit qua input ẩn `name` (quyết định 2). Giữ type `options: {value,label}[]`; nếu option có `value=""` thì là placeholder (`SelectValue placeholder`) hoặc sentinel — chọn cách giữ hành vi `required` (giá trị rỗng = chưa chọn). Có thể thu hẹp `SelectProps` (bỏ props chỉ có ở `<select>` gốc như `multiple`) — ghi decision log.
6. Label: dùng `htmlFor` + `id` trên `SelectTrigger` (không bọc button trong `<label>` nếu gây click kép; nếu giữ bọc thì kiểm click label mở đúng 1 lần).
7. Nếu cần chỉnh `select.tsx` (vd `[&>span]:truncate` thay `line-clamp-1`, `min-w-0`, vùng chạm ≥ 44px, `max-h` để cuộn trên mobile, `collisionPadding`) → được phép, giữ token. Không thêm dependency.
8. Xoá `FIELD_CLASS` nếu không còn dùng (grep cả repo trước). Không đổi i18n key trừ khi cần (nếu thêm key → cả `vi` + `en`).

## Acceptance (trích change doc, phần public)
- [ ] Mọi ô chọn public dùng Select TAMI: ô đóng cùng chiều cao/viền/bo góc/đệm với input bên cạnh; `CaretDown` có padding; chữ dài cắt `…` không đè mũi tên; danh sách theo token (popover, highlight accent, ✓ mục chọn); disabled/placeholder/aria-invalid rõ
- [ ] Giữ hành vi: lọc rentals áp dụng ngay (S04), URL/searchParams như cũ, tỉnh → phường đúng; dự án/tuyển dụng vẫn gửi qua nút "Lọc", **vẫn lọc được khi không JS**
- [ ] FormField select: submit được (input ẩn có `name`), required + lỗi + `aria-describedby` giữ nguyên
- [ ] A11y: bàn phím (mở/đóng, mũi tên, typeahead, Esc), label liên kết đúng, AA sáng + tối, vùng chạm ≥ 44px mobile
- [ ] Mobile: danh sách không tràn màn hình, cuộn được khi nhiều mục
- [ ] Test cập nhật/thêm: FormField (name submit qua FormData, aria-*), ProjectFilters/JobFilters SSR vẫn có `<select name>` gốc (no-JS), rentals đổi tỉnh reset phường, sentinel không lộ ra URL
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` PASS

## Phạm vi cấm (song song với session khác)
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**` (CHANGELOG, updates, test-scope, changes, BACKLOG), `.context/progress.json`, `src/lib/translation/admin-ui.ts`, header/layout (`src/components/layout/**` — BL-019 đang sửa), admin list components. Không migration.
- KHÔNG commit (primary commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (lệnh từ `.context/project-config.md`)
- Report: `.context/review-reports/feature-select-dropdown-styling-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Quyết định 1–8 ở trên.

### Decision log (builder)
- Một component dùng chung `src/components/ui/option-select.tsx` (`OptionSelect`): API giống `<select>` (value chuỗi, "" = rỗng), controlled (`value`) hoặc uncontrolled (`defaultValue`). Sentinel `__tami_empty__` chỉ tồn tại trong Radix (`toRadix`/`fromRadix`); `onValueChange`, input ẩn, URL luôn là "".
- Không truyền `name`/`required` cho Radix Root (tránh gửi sentinel + `required` của select ẩn chặn submit); `name` → `<input type="hidden">` tự render; required → `aria-required` trên trigger.
- Progressive enhancement (`progressive`): `useSyncExternalStore` (server snapshot false, client true) thay vì `useEffect+setState` (rule lint `react-hooks/set-state-in-effect`). Trước hydrate render `<select name>` gốc (appearance-none, pr-10, truncate, CaretDown absolute) → sau hydrate Select TAMI + input ẩn. ProjectFilters/JobFilters vẫn Server Component; label chuyển từ `<label>` bọc sang `htmlFor` + id cố định (`project-filter-province|status`, `job-filter-province`) để không click kép. Không tự submit khi đổi.
- Rentals/SortSelect/FloorPlans dùng `OptionSelect` không progressive (đã cần JS). FloorPlans value = `String(index)`. Callback `onChange(..., "now")`, tỉnh → `ward: ""`, phường disabled giữ nguyên.
- `FormField as: "select"`: `SelectProps` thu hẹp còn `name/disabled/value/defaultValue/placeholder/onValueChange` (bỏ `multiple`, `size`... chỉ có ở `<select>` gốc). Option `value=""` hiển thị như mục thường (nhãn hiện ở trigger khi chưa chọn), giá trị rỗng = chưa chọn nên `required` giữ nghĩa.
- `select.tsx`: `[&>span]:line-clamp-1` → `min-w-0 truncate text-left`, trigger `min-w-0`, icon `shrink-0`, `collisionPadding={8}` (danh sách không tràn mép màn hình; đã có `max-h` theo available-height + `overflow-y-auto`).
- Xoá `FIELD_CLASS` (grep: chỉ dùng trong rentals). Không đổi i18n/dependency/migration.
- Test: polyfill jsdom (`hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView`) trong `tests/setup-dom.ts`; helper `chooseOption` trong `src/components/media/test-utils.tsx`.

### Verification summary (builder)
- `pnpm lint` PASS · `pnpm typecheck` PASS · vitest project `ui` 67 files / 624 tests PASS · project `unit` 135 files / 1346 tests PASS.
- Test mới/đổi: FormField (aria-*, FormData qua input ẩn, disabled), ProjectFilters (SSR có `<select name>` gốc, hidden input sau mount, chọn "Tất cả" → rỗng, không submit khi đổi), JobFilters.test.tsx (mới), RentalFilters (chọn tất cả tỉnh → URL không sentinel, các test selectOptions chuyển sang `chooseOption`), FloorPlans, RentalListPage/ProjectListPage/JobListPage.
- `pnpm test` đầy đủ: project `integration` FAIL do môi trường DB worktree (vd smoke: DB `tami_wt_bl016` chỉ có extension `postgis`, thiếu `pg_trgm`, `unaccent`; media-upload cần SeaweedFS) — không liên quan diff này.

### Residual
- Chưa kiểm bằng trình duyệt thật (bàn phím/typeahead/mobile 375): chỉ test jsdom; Reviewer/manual nên mở /du-an, /cho-thue, /tuyen-dung kiểm mở danh sách, cuộn, vùng chạm item (min-h-11 sẵn).
- `FormField` select chưa có nơi dùng thật ngoài test; `placeholder` chưa dùng.

### Decision log (builder, attempt 2 — sửa review round 1)
- MAJOR-1: `radixValue` = `""` khi giá trị rỗng và không có option `value=""` (Radix hiện placeholder + `data-placeholder`); có mục "" thì vẫn dùng sentinel. Test FormField: placeholder + `data-placeholder` + FormData `""`.
- MINOR-1: giá trị không khớp option nào → `current = ""` (trigger hiện mục ""/placeholder, input ẩn gửi `""`). Test `defaultValue="zzz"`.
- MINOR-2: nhánh native dùng `defaultValue` khi uncontrolled, `value` khi controlled (pick trước hydrate không bị React reset trong lúc còn native; sau hydrate state vẫn khởi từ `defaultValue` — chấp nhận, giữ đơn giản).
- MINOR-3: `select.tsx` thêm `max-w-(--radix-select-content-available-width)`. MINOR-4 (hydration test): không làm.

### Verification summary (attempt 2)
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm vitest run --project ui --project unit`: 202 files / 1972 tests PASS (+2 test mới).

## Review
- Round 1 — **STRICT FAIL** (`.context/review-reports/feature-select-dropdown-styling-phase-1-task-01-round-1-review.md`): MAJOR-1 placeholder không hiện (sentinel luôn truyền cho Radix). MINOR-1..4.
- Round 2 — **STRICT PASS** (`.context/review-reports/feature-select-dropdown-styling-phase-1-task-01-round-2-review.md`): MAJOR-1 + MINOR-1, MINOR-3 đã sửa. Còn MINOR (chấp nhận): pick trước hydrate bị bỏ; chưa có hydration test; FormField `SelectProps` còn nhận value không phải string.
- Integration (primary): `pnpm vitest run --project integration` 55/56 file PASS; `jobs-email` timeout `beforeAll` 10s do tải song song, chạy riêng PASS 5/5 (không liên quan diff UI). DB worktree `tami_wt_bl016` đã thêm extension pg_trgm/unaccent + `payload migrate`.
- Doc impact: as-built no doc impact (không đổi API/schema/flow). Spec delta (cho primary publish): design-spec S02/S04/S12 + form control — ô chọn public dùng Select TAMI (Radix), form GET dự án/tuyển dụng giữ `<select>` gốc đã style khi chưa có JS.
