# feature-admin-list-quick-filter-chips · phase-1-task-01 — chip lọc nhanh Tin cho thuê

- Change doc: `spec/changes/2026-10-19-admin-list-quick-filter-chips.md` (BACKLOG BL-022, ưu tiên 1). Spec: `SPECIFICATIONS.md` FR-ADM-19 "Chip lọc nhanh (BL-022)" (1.18.0).

## Classification / Risk
- Type: **ADDITIVE** (UI admin danh sách). Risk: **MEDIUM** — helper `where` dùng lại cho Lead (T02); slot `beforeListTable` dùng chung với ô Lọc dịch. Không schema/API/quyền, không migration.
- Expected review level: NORMAL (STRICT nếu đụng shared helper `src/lib/translation/admin-ui.ts` hoặc `content-defaults.ts`).
- Blast radius: danh sách `/admin/collections/rentals` (thanh công cụ), helper chip mới. Doc impact: no doc impact ngoài spec (đã cập nhật).
- Decision impact: quyết định D1–D7 trong change doc ("quyết định agent, user ủy quyền 2026-10-20").

## Scope
1. Helper thuần (vd `src/lib/admin/quick-filters.ts`) — nhóm chip `{ id, label, fields[], chips: [{ key, label, conditions: Where[] }] }`:
   - `currentChip(where, group)` → key chip đang sáng khi **mọi** nhánh OR chứa đúng toàn bộ điều kiện của chip; "" nếu không.
   - `withChip(where, group, key | "")` → trong **từng** nhánh: bỏ mọi điều kiện lá có khoá thuộc `group.fields`, thêm điều kiện chip; giữ dạng `{ or: [{ and }] }` nếu đầu vào là or, ngược lại `{ and }` (cùng cách `withTranslationFilter` — tách `toBranches` dùng chung thay vì copy nếu gọn, không đổi hành vi lọc dịch).
   - Thiết kế sẵn cho T02: mỗi chip có thể khai báo thêm trường nó thay (vd `replaces?: string[]`, mặc định = `group.fields`) — Lead `Mới (chưa giao)` thay cả `status` + `assignedTo`, chip khác chỉ thay `status`, và rời chip đó chỉ bỏ đúng điều kiện của nó trên trường phụ (spec-validation W1).
   - Điều kiện đọc lại từ URL (qs) có thể là chuỗi (`"10000000"`, `"false"`, mảng chuỗi) → so sánh phải chuẩn hoá, kiểm dạng thực tế của `useListQuery().query.where`.
2. Nhóm Tin cho thuê đúng bảng spec + D4/D5: Trạng thái (`Tất cả` · `Đang cho thuê`=published · `Đã thuê`=rented · `Nháp`=draft), Số phòng ngủ (`Tất cả` · Studio=0 · 1 PN · 2 PN · 3 PN+ ≥3), Khoảng giá `priceMonthlyVnd` (Dưới 10tr `<10.000.000` · 10–20tr `>=10tr & <20tr` · 20–50tr `>=20tr & <=50tr` · Trên 50tr `>50tr`). Bấm lại chip đang sáng = bỏ lọc nhóm.
3. Component client `QuickFilterChips` (`useListQuery` + `refineListData({ where, page: 1 })`), trong thanh công cụ `.list-toolbar-item` (BL-021): mỗi nhóm `role="group"` + `aria-label`, chip `<button type="button" aria-pressed>`; thanh cuộn ngang nội bộ, 375px không tràn trang; vùng bấm ≥ 44px; focus-visible rõ; màu theo token admin hiện có (AA sáng/tối).
4. Đăng ký vào `beforeListTable` của Rentals, giữ ô Lọc dịch (cùng hàng, tự xuống dòng). Không hiện ở thùng rác / list drawer nếu phân biệt được (theo cách `LeadExportSlot`).
5. Test: unit helper (where rỗng, `{and}`, or 1/nhiều nhánh, kết hợp điều kiện dịch, bộ lọc tay cùng trường, dạng chuỗi từ URL); UI test component (aria-pressed, bấm chip → refineListData đúng where, bấm lại bỏ lọc).

## Acceptance
- [ ] 3 nhóm chip đúng bảng; áp/bỏ 1 chạm; AND với bộ lọc khác + tìm kiếm + Lọc dịch (đổi Lọc dịch sau khi chọn chip vẫn giữ chip và ngược lại).
- [ ] F5 giữ chip (where trên URL); bộ lọc tay cùng trường khác chip → chip bỏ sáng.
- [ ] Bàn phím: Tab tới chip, Enter/Space bật/tắt; aria-pressed đúng.
- [ ] 375px không cuộn ngang trang do thanh chip.
- [ ] `pnpm test` / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
**Files**
- Mới: `src/lib/admin/quick-filters.ts` (+ `.test.ts`), `src/components/admin/QuickFilterChips.tsx` (+ `.test.tsx`), `src/components/admin/RentalQuickFilterSlot.tsx`.
- Sửa: `src/collections/Rentals.ts` (đăng ký slot `beforeListTable`, đứng trước ô Lọc dịch), `src/components/admin/styles/_lists.scss` (`.quick-filter-chips`), `src/lib/translation/admin-ui.ts` (chỉ `export` `toBranches`/`isOrForm` + tách `rebuildWhere` dùng chung, hành vi lọc dịch không đổi), `src/app/(payload)/admin/importMap.js` (sinh bằng `payload generate:importmap`).

**Thiết kế**
- `QuickFilterGroup { id, label, fields, allLabel?, chips[] }`, chip `{ key, label, conditions[], replaces? }`. `currentChip` / `withChip` thuần, dùng chung `toBranches`/`rebuildWhere` với lọc dịch.
- So sánh điều kiện qua chữ ký chuẩn hoá (giá trị → chuỗi, `in/not_in/all` → mảng chuỗi đã sắp): Payload đọc lại `where` từ URL bằng `qs.parse` nên số/boolean thành chuỗi (`"10000000"`, `"false"`) — đã xác nhận trong `node_modules/@payloadcms/ui` (`parseSearchParams`, không ép kiểu) và kiểm trên trình duyệt (F5 giữ chip).
- Chip sáng khi mỗi nhánh có đúng (không thừa/thiếu) điều kiện lá trên các trường chip thay thế. Chọn chip bỏ mọi điều kiện lá trên `replaces ?? group.fields` + điều kiện chip của nhóm trên trường phụ → T02 khai báo Lead: `fields: ["status"]`, chip `new` có `replaces: ["status","assignedTo"]` (đã có test mô phỏng; rời chip chỉ bỏ `assignedTo exists:false`, giữ "Sale phụ trách" tay).
- Slot server `RentalQuickFilterSlot` ẩn ở thùng rác (`params.segments[2]==="trash"`); `QuickFilterChips` tự ẩn trong list drawer (`isInDrawer`). Chip: `<button aria-pressed>`, nhóm `role="group" aria-label`, cao 44px, hàng chip cuộn ngang nội bộ, token admin sáng/tối.

**Kết quả**
- `pnpm test` 279 file / 2905 test PASS; `pnpm lint` 0 lỗi (2 warning có sẵn ở `tools/task-dashboard/server.mjs`); `pnpm typecheck` PASS.
- Trình duyệt (dev server :3000 đã chạy sẵn, 375px): 13 chip, cao 44px, `scrollWidth`=375 (không tràn trang); bấm Đang cho thuê + 2 PN + 10–20tr → URL `where[and][..]` đúng, 3 chip sáng, F5 giữ nguyên chip.

**Residual risk**: chưa kiểm dark mode / bàn phím thủ công (dùng token đã có test contrast, nút gốc nên Tab/Enter/Space mặc định); chưa kiểm sau khi đổi Lọc dịch trên trình duyệt (có unit test kết hợp). Bộ lọc tay thừa điều kiện trên cùng trường khiến chip tắt (theo D3). Hiển thị chip lọc nhanh cũng xuất hiện trong panel "Bộ lọc" dưới dạng các dòng điều kiện (theo D2).

## Review
- STRICT PASS round 1 — `.context/review-reports/feature-admin-list-quick-filter-chips-phase-1-task-01-round-1-review.md` (0 critical / 0 major / 3 minor). Minor #1 (`Tất cả` sáng khi có bộ lọc tay cùng trường ngoài chip) + #3 (bấm `Tất cả` đang sáng vẫn tải lại) → sửa trong T02 (cùng component); #2 (entry nhiều trường trong 1 điều kiện chỉ có ở URL viết tay) → ghi residual — quyết định agent (user ủy quyền 2026-10-20).

## Doc impact / Reconcile
- no doc impact ngoài spec delta FR-ADM-19 (1.18.0) đã cập nhật; không API/schema.
