# Spec Update — 2026-10-20 form-fields-rounded (ô nhập form công khai bo góc đồng bộ thẻ/nút)

**spec_version:** 1.24.1 → 1.25.0 (MINOR — đổi yêu cầu trình bày ô nhập / khung form công khai; không đổi schema, API, quyền, URL, i18n, nguồn lead, dữ liệu submit)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-030**, MODIFY UI). Change doc `spec/changes/2026-10-20-form-fields-rounded.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-form-fields-rounded/phase-1-task-01.md`. Review: `.context/review-reports/feature-form-fields-rounded-phase-1-task-01-round-1-review.md` (STRICT-light, PASS r1).

**Quyết định (task D1–D5):** D1 input / select trigger (Radix) / `<select>` gốc progressive / base `FormField` (textarea, file…) `rounded-sm` (2px) → `rounded-md` (`--radius-md` 12px); D2 checkbox → `rounded-[calc(var(--radius-md)/2)]` = 6px (dẫn xuất token, không thêm token); D3 nút chọn file trong ô → `file:rounded-pill`; D4 khung panel mặc định `LeadFormSlot` → `rounded-lg` (16px), các override sẵn có (chi tiết dự án 28px, tin tức `rounded-xl`, cho thuê `bg-transparent p-0`) giữ nguyên; D5 `CvPicker` ô thả `md:rounded-md` + dòng file đã chọn `rounded-md`. Không đổi token `--radius-sm` toàn cục, item trong dropdown, admin Payload.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, component chung) | close-out BL-030 (commit chứa file này) | `src/components/ui/{input,checkbox,select,option-select}.tsx`, `src/components/forms/{FormField,LeadFormSlot}.tsx`, `src/components/careers/CvPicker.tsx`: chỉ đổi lớp bo góc (D1–D5). Comment `src/app/(frontend)/globals.css`. Test `src/components/forms/FormField.test.tsx`: `rounded-md` cho input/textarea/select/file, `file:rounded-pill`, checkbox 6px, `LeadFormSlot` `rounded-lg` + override `rounded-xl` thắng. Doc: `.context/design-spec.md`, `docs/DESIGN.md` (bảng radius), `skills/react-nodejs/design-tokens.md` | STRICT-light PASS r1 |

## Requirements (SPECIFICATIONS.md)

- **Overview — Giao diện (SỬA):** ô nhập form công khai (input, textarea, select Radix + `<select>` gốc progressive, ô file, ô thả CV) bo `--radius-md` (12px) đồng bộ thẻ 20/28px + nút viên thuốc; checkbox bo 6px (= `--radius-md`/2); khung form lead/ứng tuyển mặc định (`LeadFormSlot`) bo `--radius-lg` (16px); admin Payload không đổi. Câu Select TAMI "cùng chiều cao/viền/bo góc với input" giữ nguyên — nay cả hai cùng 12px.
- Design as-built: `.context/design-spec.md` §bo góc, `docs/DESIGN.md` bảng radius (`--radius-sm` bỏ "ô nhập"), `skills/react-nodejs/design-tokens.md` reconcile cùng task.

## Schema / Migration / API

Không. Migration: none.

## Hành vi bị thay thế

| Trước | Sau (BL-030) |
|---|---|
| Input / textarea / select / ô file / checkbox / ô thả CV bo `--radius-sm` 2px — gần vuông, lệch tông với thẻ 20/28px + nút viên thuốc | Ô nhập bo `--radius-md` 12px, checkbox 6px, nút chọn file viên thuốc |
| Khung form `LeadFormSlot` mặc định bo 2px (ô nhập trong panel bo lớn hơn panel) | Khung mặc định bo `--radius-lg` 16px; override sẵn có không đổi |

## Ảnh hưởng test

- Direct: mọi form công khai — Liên hệ, form lead chi tiết dự án / cho thuê, Đăng tin BĐS, form cuối tin tức, form ứng tuyển + CvPicker (VI + EN): ô nhập 12px, checkbox 6px, nút chọn file viên thuốc, khung form 16px (nơi không override).
- Dependents: bộ lọc dự án / cho thuê / tuyển dụng, sắp xếp, select mặt bằng, tìm kiếm trang chủ (dùng `Input`/`Select` chung).
- Regression: focus ring + viền lỗi theo bo góc; dropdown Select mở/đóng/bàn phím; checkbox đồng ý (consent) tick/focus; input file chọn/xoá; override `LeadFormSlot` (chi tiết dự án 28px, tin tức `rounded-xl`, cho thuê trong suốt); admin `/admin` không đổi.
- Residual: chưa kiểm trực quan 375 / 768 / 1280; lớp `rounded-[calc(var(--radius-md)/2)]` chỉ assert tên lớp trong test, chưa kiểm CSS build thật.
