# feature-select-dropdown-styling · phase-1-task-02 — Admin: ô lọc "Trạng thái dịch" dùng SelectInput của Payload

- Change doc: `spec/changes/2026-10-19-select-dropdown-styling.md` (BACKLOG BL-016)
- Spec: FR-ADM-18 (lọc danh sách theo trạng thái dịch)

## Hiện trạng (change-request đã kiểm)
- `src/components/admin/TranslationStatusFilter.tsx` — `<select>` gốc + inline style (`minHeight: 44, minWidth: 220`), lệch với ô lọc react-select của Payload cạnh đó.
- Logic lọc ở `src/lib/translation/admin-ui.ts` (`currentTranslationFilter`, `withTranslationFilter`, `TRANSLATION_FILTER_KEYS`, `TRANSLATION_FILTERS`).
- `@payloadcms/ui` export `SelectInput` (client) — react-select đã theo theme admin (BL-015 đã refresh token admin: `src/components/admin/styles/*`).

## Classification / Risk
- Type: **MODIFY** (UI admin). Không đổi query/where, API, schema, access.
- Risk: **LOW** — 1 component admin. Reviewer: **NORMAL**.

## Quyết định thiết kế (change-request)
1. Thay `<select>` bằng `SelectInput` của `@payloadcms/ui` (KHÔNG dùng Radix trong admin). Options = "Tất cả" + `TRANSLATION_FILTER_KEYS` (label `TRANSLATION_FILTERS[key].label`). Chọn → `refineListData({ where: withTranslationFilter(where, key | ""), page: 1 })` như cũ; xoá (isClearable) hoặc chọn "Tất cả" → `""`.
2. **KHÔNG sửa `src/lib/translation/admin-ui.ts`** (BL-021 đang sửa song song). Chỉ import.
3. Bỏ inline style lệch; nếu cần layout/độ rộng thì dùng class + SCSS trong `src/components/admin/styles/_controls.scss` (hoặc file style admin phù hợp) theo token admin; giữ label liên kết (`path`/`label` của SelectInput hoặc label riêng có `htmlFor` khớp id input). Vùng chạm ≥ 44px.
4. Không cần đổi `importMap.js` nếu path/export component không đổi.
5. Thêm/cập nhật test (mock `useListQuery` + kiểm onChange gọi `refineListData` với where/page đúng; "Tất cả" → bỏ điều kiện). Nếu SelectInput khó render trong jsdom, tách hàm map giá trị thuần ra trong chính file component và test hàm đó.

## Acceptance
- [ ] `TranslationStatusFilter` dùng `SelectInput`/react-select của `@payloadcms/ui`, nhìn đồng bộ với ô lọc Payload sáng + tối
- [ ] Hành vi lọc giữ nguyên (giữ bộ lọc khác, về trang 1, "Tất cả" bỏ lọc dịch)
- [ ] Không sửa `src/lib/translation/admin-ui.ts`; không đổi API/schema/access
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` PASS

## Phạm vi cấm
- Như task-01 (spec/**, progress.json, SPECIFICATIONS.md, admin-ui.ts, migration). KHÔNG commit.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- Report: `.context/review-reports/feature-select-dropdown-styling-phase-1-task-02-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Quyết định 1–5 ở trên.

## Decision log (builder)
- `SelectInput` (`@payloadcms/ui`) với `name`/`path` = `translation-status-filter`, `isClearable`, options = 5 khoá (bỏ mục "Tất cả": đã có nút xoá; `placeholder="Tất cả"` khi không lọc). Label: KHÔNG dùng prop `label` của SelectInput vì `FieldLabel htmlFor=field-translation-status-filter` trỏ vào `<div>` wrapper, không phải input react-select (`ReactSelect` không nhận `inputId`); thay vào đó bọc `SelectInput` trong `<label className="field-label">` để combobox có tên truy cập và click label focus input. onChange → hàm thuần `translationFilterFromSelection` rồi `refineListData({ where: withTranslationFilter(where, key), page: 1 })`.
- Bỏ inline style; SCSS scoped `.translation-status-filter` thêm cuối `styles/_controls.scss` (min-width 220, `.rs__control` min-height 44px, theo token admin sáng/tối sẵn có của `.react-select`).
- Không đụng `admin-ui.ts`, importMap (export không đổi).

## Verification summary
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm vitest run --project ui --project unit` PASS (203 files, 1975 tests; thêm `TranslationStatusFilter.test.tsx`: mapper + onChange chọn/clear với `SelectInput` mock).

## Residual
- Chưa xem bằng mắt trong admin thật (sáng/tối). GAP: không render được `SelectInput`/react-select THẬT trong vitest (import barrel `@payloadcms/ui` lỗi `.css` của node_modules; `fields/Select/Input` không là subpath export) → test dùng mock; accessible name 'Trạng thái dịch' chỉ kiểm qua `<label>` bọc + mock `<select>`, chưa kiểm với input react-select thật (cần xác nhận bằng mắt/trình duyệt: click label focus input, không mở menu kép). Class `field-type` margin-bottom reset dựa vào markup Payload hiện tại.

## Review
- Round 1 — **NORMAL FAIL** (`.context/review-reports/feature-select-dropdown-styling-phase-1-task-02-round-1-review.md`): MAJOR-1 label `FieldLabel` htmlFor trỏ vào div wrapper, không phải input react-select; MINOR-1 placeholder chung.
- Round 2 — **NORMAL FAIL** (`…-round-2-review.md`): a11y đã đúng (label bọc), nhưng MAJOR mới: `label.field-label` của Payload là hàng flex → ô co theo nội dung.
- Round 3 (hẹp, chỉ SCSS; primary sửa 1 khối `_controls.scss`: label cột, gap 4px, rộng 280px max 100%, `.field-type` width 100%) — **FAST PASS** (`…-round-3-review.md`). Round 3 vượt giới hạn 2 vòng theo tiền lệ commit 2cfe320 (round 3 hẹp) vì lỗi chỉ là layout CSS, không phải kiến trúc.
- Residual (chấp nhận): accessible name gộp giá trị đang chọn; `<div>` trong `<label>`; chọn option focus lại input (cảm ứng); SelectInput thật không render được trong vitest (CSS import) — liên kết label kiểm bằng đọc markup; chưa xem admin thật sáng/tối.
- Doc impact: no doc impact (as-built).
