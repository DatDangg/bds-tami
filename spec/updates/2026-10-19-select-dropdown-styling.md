# Spec Update — 2026-10-19 select-dropdown-styling

**spec_version:** 1.13.0 → 1.14.0 (MINOR — chốt yêu cầu giao diện mới cho ô chọn công khai + ô lọc dịch admin; không đổi schema/API/quyền/query param)

**Trigger:** feature-update (Change Request MODIFY, BL-016) — change doc `spec/changes/2026-10-19-select-dropdown-styling.md` (archive → `spec/changes/archive/2026-10-19-select-dropdown-styling.md`), task `tasks/feature-select-dropdown-styling/phase-1-task-01.md` (public, commit `325b9e5`) + `phase-1-task-02.md` (admin, commit `e9e9a6b`)

**Nguồn:** user thấy các ô select "trông lạ" ở site public và admin: `<select>` gốc không `appearance-none` → mũi tên trình duyệt dí mép, chữ bị cắt, popup kiểu OS; admin `TranslationStatusFilter` là `<select>` gốc + inline style lệch react-select của Payload. User chọn dùng Select TAMI (Radix) ở public, `SelectInput` Payload ở admin.

**Requirements:**
- THÊM (Overview "Giao diện") — **ô chọn công khai** dùng Select TAMI (Radix, theo token): ô đóng cùng chiều cao/viền/bo góc với input, chữ dài cắt `…`, danh sách theo token (highlight accent, ✓ mục đang chọn), không tràn màn hình (`collisionPadding`, `max-w`/`max-h` theo vùng còn trống), bàn phím + typeahead, vùng chạm ≥ 44px. Giá trị URL/submit giữ nguyên (mục "Tất cả" = rỗng; sentinel nội bộ không bao giờ lộ ra URL/form).
- THÊM — **progressive enhancement** form GET lọc Dự án (S02) và Tuyển dụng (S12): không JS vẫn lọc được (`<select name>` gốc đã style trước hydrate → Select TAMI + input ẩn `name` sau hydrate); không tự gửi khi đổi (giữ nút "Lọc", WCAG 3.2.2).
- Giữ: lọc Cho thuê (S04) áp dụng ngay khi đổi; đổi tỉnh reset phường; phường khoá khi chưa chọn tỉnh.
- SỬA (F12, FR-ADM-18) — ô lọc "Trạng thái dịch" admin là react-select của Payload (`SelectInput`, `isClearable`, placeholder "Tất cả"), cùng style với ô lọc Payload (khớp FR-ADM-19 "ô chọn admin cùng một style"); hành vi lọc giữ nguyên (về trang 1, "Tất cả" bỏ lọc dịch).

**Code (diff thật):**
- `325b9e5` (public): `src/components/ui/option-select.tsx` (mới, `OptionSelect`), `src/components/ui/select.tsx` (truncate, `collisionPadding`, `max-w`), `src/components/rentals/FilterFields.tsx`, `src/components/rentals/SortSelect.tsx` (bỏ `FIELD_CLASS`), `src/components/projects/ProjectFilters.tsx`, `src/components/projects/FloorPlans.tsx`, `src/components/careers/JobFilters.tsx`, `src/components/forms/FormField.tsx` + test (`JobFilters.test.tsx` mới, `FormField.test.tsx`, `RentalFilters.test.tsx`, `project-components.test.tsx`, …), `tests/setup-dom.ts` (polyfill jsdom pointer capture / scrollIntoView), `src/components/media/test-utils.tsx` (`chooseOption`).
- `e9e9a6b` (admin): `src/components/admin/TranslationStatusFilter.tsx` (+ test mới), `src/components/admin/styles/_controls.scss` (`.translation-status-filter`: nhãn trên ô, rộng 280px max 100%, ô ≥ 44px).

**Schema / API / Access:** không đổi. **Migration:** none. **As-built docs:** no doc impact.

**Ảnh hưởng:**
- `/du-an`, `/cho-thue`, `/tuyen-dung` (VI/EN): bộ lọc + sắp xếp; chi tiết dự án (mặt bằng < md khi ≥ 6 mặt bằng); `FormField` select (hiện chỉ test dùng).
- Admin: mọi danh sách có lọc "Trạng thái dịch" (projects, rentals, property-posts, news, services, job-postings, pages, categories, developers).

**Review:** T01 STRICT FAIL r1 → **STRICT PASS round 2** (`.context/review-reports/feature-select-dropdown-styling-phase-1-task-01-round-2-review.md`); T02 NORMAL FAIL r1, r2 → **FAST PASS round 3** (`.context/review-reports/feature-select-dropdown-styling-phase-1-task-02-round-3-review.md`, round 3 hẹp chỉ SCSS).

**Residual:** chưa kiểm trình duyệt thật (bàn phím/typeahead/mobile 375, admin sáng/tối); chọn trước hydrate trên form GET bị bỏ khi chuyển sang Radix; chưa có hydration test; `SelectInput` thật không render được trong vitest (test dùng mock); accessible name ô lọc dịch gộp giá trị đang chọn.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 16
