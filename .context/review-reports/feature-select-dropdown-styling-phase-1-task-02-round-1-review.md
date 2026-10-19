Agent: reviewer

# Review: feature-select-dropdown-styling · phase-1-task-02 · round 1

> Ghi bởi primary: guard hook chặn reviewer `Write` vào `.context/review-reports/**` trong worktree. Nội dung từ report reviewer.

## Review level
**NORMAL**

## Reason
Một client component admin + SCSS scoped. Không đổi API, schema, auth, shape `where`; không đụng `admin-ui.ts`.

## Blast radius
- `src/components/admin/TranslationStatusFilter.tsx` — mount qua `src/collections/_shared/content-defaults.ts` ở list view mọi collection nội dung có lọc dịch.
- `src/components/admin/styles/_controls.scss` — khối mới scoped `.translation-status-filter`.
- Test mới. `src/payload-types.ts` chỉ EOL, bỏ qua.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project ui --project unit` | PASS 1975/1975 |
| Integration / build | Không chạy (theo task) |

## Đối chiếu API (`@payloadcms/ui/dist/fields/Select/Input.{d.ts,js}`)
- Props `name`/`path` (bắt buộc), `label`, `isClearable`, `options`, `value?: string`, `className`, `onChange` dùng đúng.
- Giá trị hiển thị từ `currentTranslationFilter(where)` → đồng bộ `where`. `value === ""` → `valueToRender` null → placeholder (MINOR-1).
- Ngoài Form: `FieldLabel`/`FieldError` chỉ đọc context mặc định; không đăng ký field/dispatch. OK.
- Hành vi lọc: giữ where khác, về trang 1, clear/"Tất cả" bỏ điều kiện dịch. OK.
- Phạm vi cấm: không đụng. OK.

## Findings
### [MAJOR-1] Label không liên kết với input; decision log builder sai
- `src/components/admin/TranslationStatusFilter.tsx:36-45`. `FieldLabel` render `htmlFor="field-translation-status-filter"`, nhưng `SelectInput` gắn id đó lên **`<div>` wrapper**; `ReactSelect` không nhận `id`/`inputId` (chỉ `instanceId: useId()`) → input thật id `react-select-<uuid>-input`.
- Hệ quả: combobox không có accessible name; click label không focus input. `<select>` cũ liên kết đúng; vi phạm quyết định 3 của task. Test mock `SelectInput` bằng `<label>` bọc nên không bắt được.
- Fix: (a) bỏ prop `label`, bọc `SelectInput` trong `<label className="field-label">Trạng thái dịch …</label>` của mình; hoặc (b) cách khác đặt accessible name cho input. Test với `SelectInput` thật: `getByRole("combobox", { name: "Trạng thái dịch" })`, hoặc ghi gap vào Residual.

### [MINOR-1] Không lọc thì hiện placeholder chung thay vì "Tất cả"
- `TranslationStatusFilter.tsx:44`. Fix: `placeholder="Tất cả"`; có thể bỏ option "Tất cả" vì đã `isClearable`.

### [MINOR-2] Reset margin SCSS dựa vào markup Payload
- `src/components/admin/styles/_controls.scss:305-307`. Scoped, không rò. Builder đã ghi Residual — không cần làm.

## Responsive Checklist Gate
- Horizontal scroll OK (`min-width: 220px; max-width: 100%`). Container OK. Spacing OK (12px như cũ). Touch target ≥ 44px OK (`.rs__control { min-height: 44px }`). Còn lại N/A. Không có browser — chưa xem sáng/tối.

## Skill gates
- aislop skip; oxlint skip (eslint PASS); ocr skip; AI-readable OK (0 indicator); ai-friendly-web N/A; blitzstrike N/A.

## Residual risk
- Chưa xem admin thật (sáng/tối, 375/768/1280). Test mock `SelectInput`.

## Verdict
**FAIL** — MAJOR-1 (label không liên kết input thật). Sửa MAJOR-1 (+ MINOR-1 nên làm luôn) rồi round 2.
