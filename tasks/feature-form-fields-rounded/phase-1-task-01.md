# feature-form-fields-rounded · phase-1-task-01 — Ô nhập form công khai bo góc đồng bộ thẻ/nút (BL-030)

- Change doc: `spec/changes/2026-10-20-form-fields-rounded.md` (BACKLOG BL-030).
- Phụ thuộc: không.
- Trạng thái: `done` (STRICT-light PASS r1, spec 1.25.0 / scope v32) — user duyệt ("làm 29 30 đi", auto proceed) 2026-10-20.

## Classification / Risk
- Type: **MODIFY** (UI; không đổi schema/API/quyền/dữ liệu/i18n)
- Risk: **MEDIUM** — đổi class component chung (`Input`, `Checkbox`, `Select`, `OptionSelect`, `FormField`, `LeadFormSlot`, `CvPicker`) dùng ở mọi form công khai + bộ lọc.
- Expected review level: **NORMAL** (shared component, chỉ đổi lớp bo góc; không logic).
- Blast radius: form lead (Liên hệ, chi tiết dự án/cho thuê, đăng tin BĐS, cuối trang tin tức), form ứng tuyển (S13 + CvPicker), bộ lọc dự án/cho thuê/tuyển dụng, sắp xếp, mặt bằng, tìm kiếm trang chủ (input/select chung). Admin Payload KHÔNG dùng các component này (`src/components/admin/**` không đụng).
- Doc impact: `.context/design-spec.md` §bo góc (dòng 139); `docs/DESIGN.md` bảng radius (`--radius-sm` dòng 94 — bỏ "ô nhập"); `skills/react-nodejs/design-tokens.md` dòng 187; comment `globals.css:98`; `SPECIFICATIONS.md` câu Giao diện (ô nhập bo `--radius-md`) → spec-publisher bump minor.

## Hiện trạng (đã đọc)
- `--radius-sm: 2px`, `--radius-md: 12px`, `--radius-lg: 16px` (`src/app/(frontend)/globals.css:99-101`).
- `rounded-sm` (2px) ở: `src/components/ui/input.tsx:11`, `ui/checkbox.tsx:17`, `ui/select.tsx:21` (trigger), `ui/option-select.tsx:43` (select gốc progressive BL-016), `forms/FormField.tsx:44` (base textarea/file…) + `:46` `file:rounded-sm` (nút chọn file trong ô), `forms/LeadFormSlot.tsx:28` (khung panel form), `careers/CvPicker.tsx:88` (ô thả CV, md+) + `:137` (dòng file đã chọn).
- Đã có override `rounded-md` ở `projects/ProjectFilters.tsx:61,72` (file user đang sửa — KHÔNG đụng) và `rentals/RentalFilters.tsx:96,110` (thừa sau đổi, vô hại — giữ để diff tối thiểu).
- Dropdown Radix `ui/select.tsx:48` đã `rounded-md`.

## Thiết kế (chốt)
- **D1** Input / Select trigger / OptionSelect / FormField base (textarea, file…): `rounded-sm` → `rounded-md` (token `--radius-md` 12px). Viền focus/lỗi là `border` của chính phần tử nên tự theo bo; outline focus-visible (option-select) cũng theo `border-radius`.
- **D2** Checkbox (20px): `rounded-sm` → `rounded-[calc(var(--radius-md)/2)]` = 6px, dẫn xuất từ token md (không thêm token mới, không hardcode px; 12px trên ô 20px gần thành tròn — giống radio).
- **D3** Nút chọn file trong ô FormField: `file:rounded-sm` → `file:rounded-pill` (đồng bộ "mọi nút viên thuốc").
- **D4** `LeadFormSlot` khung panel mặc định `rounded-sm` → `rounded-lg` (16px, design-spec "panel md/lg"): ô nhập 12px nằm trong panel 2px là bo trong > bo ngoài, lệch tông rõ ở Liên hệ / đăng tin / ứng tuyển. Nơi đã override (chi tiết dự án 28px, tin tức `rounded-xl`, cho thuê `bg-transparent p-0`) không đổi.
- **D5** `CvPicker` ô thả `md:rounded-sm` → `md:rounded-md`; dòng file đã chọn `rounded-sm` → `rounded-md`. Nút X icon (`:145`) giữ.
- **Không đổi:** token `--radius-sm` toàn cục; item trong dropdown (`ui/select.tsx:70`, highlight bên trong popup 12px — không phải ô nhập); `ProjectFilters.tsx` (của user).

## Files
- `src/components/ui/{input,checkbox,select,option-select}.tsx`
- `src/components/forms/{FormField,LeadFormSlot}.tsx`, `src/components/careers/CvPicker.tsx`
- Test: `src/components/forms/FormField.test.tsx` (+ test ui nếu cần) — assert `rounded-md` cho input/textarea/select, checkbox lớp 6px, không còn `rounded-sm`.
- Doc: design-spec, docs/DESIGN.md, skills/react-nodejs/design-tokens.md, comment globals.css.

## Acceptance
- [ ] Input, textarea, select (Radix + gốc), ô file của form công khai bo `--radius-md`; checkbox bo 6px (md/2); focus ring / lỗi theo viền bo
- [ ] Nhất quán mọi form công khai dùng component chung (lead, ứng tuyển, liên hệ, lọc)
- [ ] Không đổi admin Payload, không đổi token `--radius-sm`
- [ ] Test cập nhật; `pnpm vitest run src/components`, `pnpm lint`, `pnpm typecheck` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- D1–D5 áp đúng như chốt (class-only; select.tsx:70 và CvPicker:145 giữ). Doc/comment: globals.css:98, design-spec:139, docs/DESIGN.md:94, skills/react-nodejs/design-tokens.md:187.
- Test thêm trong FormField.test.tsx (rounded-md input/textarea/select/file, file:rounded-pill, checkbox 6px, LeadFormSlot rounded-lg + override rounded-xl thắng).
- `pnpm vitest run src/components`: 90 files / 855 tests PASS. `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs). `pnpm typecheck`: PASS.

## Residual risk
- Lớp `rounded-[calc(var(--radius-md)/2)]` chưa kiểm bằng build CSS thực (Tailwind v4 hỗ trợ arbitrary calc; test chỉ assert tên lớp) — nên xem mắt checkbox khi review.
- Chưa kiểm trực quan 375/768/1280.
