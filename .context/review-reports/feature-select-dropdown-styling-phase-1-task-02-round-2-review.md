Agent: reviewer

# Review: feature-select-dropdown-styling · phase-1-task-02 · round 2

> Ghi bởi primary: guard hook chặn reviewer `Write` vào `.context/review-reports/**` trong worktree. Nội dung từ report reviewer.

## Review level
**NORMAL**

## Reason
Một component admin + SCSS scoped. Không đổi API/schema/auth/`where` (vẫn `withTranslationFilter`). Vòng này kiểm lại phần sửa a11y.

## Blast radius
- Ô lọc "Trạng thái dịch" ở list view admin các collection có nhóm `translation` (mount qua `src/collections/_shared/content-defaults.ts` + `importMap.js`; export không đổi). SCSS chỉ trong `.translation-status-filter`.
- Diff: `src/components/admin/TranslationStatusFilter.tsx`, `src/components/admin/styles/_controls.scss`, `src/components/admin/TranslationStatusFilter.test.tsx` (mới). `src/payload-types.ts` chỉ EOL.

## Verify commands + result
- `pnpm lint`: PASS. `pnpm typecheck`: PASS. `pnpm vitest run --project ui --project unit`: PASS 1975/1975.
- Phạm vi cấm (`admin-ui.ts`, `SPECIFICATIONS.md`, `spec/`, `.context/progress.json`): không đụng.

## Kiểm lại round 1 (markup thật `node_modules/@payloadcms/ui/dist`)
- **MAJOR-1 cũ: đã sửa đúng.** Không có prop `label` → `FieldLabel` null (không label lồng); `FieldError` không render labelable khi không lỗi; `name` không xuống ReactSelect (không input ẩn). Thứ tự DOM: A11yText spans → `input.rs__input` (combobox) → ClearIndicator (div role=button) → DropdownIndicator (`<button>` sau input). Trước mount chỉ ShimmerEffect. Click chữ label → focus input; `openMenuOnFocus` false → không mở menu hai lần.
- **MINOR-1 cũ: đã sửa.** `placeholder="Tất cả"`, bỏ option "Tất cả" (đã `isClearable`).
- **Hành vi lọc:** không regression (`translationFilterFromSelection` xử lý option/mảng/null/khoá lạ → `refineListData({ where: withTranslationFilter(where, key), page: 1 })`).
- **Gap test SelectInput thật:** chấp nhận (logic có test hàm thuần + mock; liên kết label kiểm bằng markup).

## Findings
### [MAJOR-1] `<label className="field-label">` bọc ngoài thành hàng flex (mới ở round 2)
- `src/components/admin/TranslationStatusFilter.tsx:32`. Payload `fields/FieldLabel/index.scss`: `label.field-label { display: flex; align-items: center; }`; `_surfaces.scss:12` chỉ đổi font/màu.
- Hệ quả (tính theo CSS): chữ label và `div.field-type.select` cùng một hàng, không gap/wrap; `.field-type.select` không có width → ô co theo nội dung, rộng hẹp theo lựa chọn; `min-width: 220px` (`_controls.scss:301`) nằm ở div ngoài nên ô mất mức 220px; ở 375px label bị ép. Không đạt "đồng bộ với ô lọc Payload".
- Fix (chỉ SCSS): `.translation-status-filter > label.field-label { flex-direction: column; align-items: stretch; gap: 4px; }` (hoặc wrap + `flex: 1 1 220px; min-width: 220px` cho ô). Kiểm mắt 375/1280 sáng/tối.

### [MINOR-1] Accessible name gộp nội dung trong label
- `TranslationStatusFilter.tsx:32-44`: tên = "Trạng thái dịch" + giá trị/placeholder; menu mở bên trong label có thể gộp chữ option. Không chặn (SelectInput không chuyển `inputId`/`aria-label`).

### [MINOR-2] `<div>` trong `<label>` sai content model HTML
- `TranslationStatusFilter.tsx:32`. Trình duyệt vẫn đúng. Không cần sửa.

### [MINOR-3] Chọn option trong menu kích hoạt label → focus lại input
- Trên cảm ứng có thể bật lại bàn phím ảo. Ghi Residual.

## Responsive Checklist Gate (375/768/1280, tính theo CSS)
| Mục | Kết quả |
|---|---|
| Không cuộn ngang | OK |
| Bố cục label / ô chọn | **FAIL** (MAJOR-1) |
| Container không px cố định | OK |
| Touch target ≥ 44px | OK (`.rs__control { min-height: 44px }`) |
| Font/Media/Nav/Table/100vh/reduced-motion/overflow | N/A |

## Skill gates
- aislop skip; oxlint skip (eslint PASS); ocr skip; AI-readable OK (0 indicator); ai-friendly-web N/A; blitzstrike N/A.

## Residual risk
- Chưa xem admin thật (sáng/tối), chưa thử screen reader; reset `.field-type { margin-bottom: 0 }` phụ thuộc markup Payload; MINOR-3 trên cảm ứng.

## Verdict
**❌ FAIL** — 1 MAJOR mới (layout `label.field-label { display: flex }`), sửa 1–3 dòng SCSS. Đây là round 2 (giới hạn 2 vòng) — lỗi không phải vấn đề kiến trúc; primary quyết định cho thêm vòng sửa SCSS hẹp.
