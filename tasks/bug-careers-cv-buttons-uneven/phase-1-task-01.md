# bug-careers-cv-buttons-uneven · phase-1-task-01 — Banner "Gửi CV ngay": nút "Sao chép email" hẹp hơn nút chính trên mobile (BL-124)

- Change doc: `spec/changes/2026-11-17-careers-cv-buttons-uneven.md` (BACKLOG BL-124, QA 37, Thấp).
- Phụ thuộc: không (BL-114, BL-120 đã done).
- Trạng thái: `review_passed` — NORMAL PASS round 1 (`.context/review-reports/bug-careers-cv-buttons-uneven-phase-1-task-01-round-1-review.md`); 1 MINOR không chặn (`max-w-xs` lặp lại từ `CtaBanner.tsx`, đổi một bên sẽ lệch). Spec 1.64.2 / scope v123. Chưa commit (user 2026-11-18).

## Classification / Risk
- Type: **BUG** (thứ tự bug user duyệt 2026-11-17 "Ok, theo thứ tự đó").
- Severity: low (thẩm mỹ, không mất chức năng).
- Risk: **LOW** — chỉ banner `CareersCvBanner` trên `/tuyen-dung` (+ `/en/careers`). `CopyEmailButton` dùng ở 2 chỗ (banner tone `onDark`, panel trống tone `light`); `CtaBanner` dùng chung (trang chủ, dịch vụ, chi tiết dự án, ConsultBanner) → KHÔNG đổi `CtaBanner`.
- Expected review level: NORMAL.
- Doc impact dự kiến: không đổi API/ERD/schema. SPECIFICATIONS: as-built PATCH (spec-publisher).

## Root cause (đã chứng minh)
`src/components/layout/CtaBanner.tsx` khối nút: dưới `sm` là `flex w-full flex-col items-start`; nút chính `Button size="lg" className="w-full max-w-xs sm:w-auto"` → rộng full tới 320px. `extraAction` của banner là `<CopyEmailButton tone="onDark" />` (`src/components/careers/CopyEmailButton.tsx`): wrapper `div.flex.flex-wrap.items-center` không có độ rộng, trong cột `items-start` nên co theo nội dung; `Button` không có `w-full` → chỉ rộng theo chữ "Sao chép email". Cùng cao (lg = 52px) nhưng khác rộng ở 375/390. Có từ BL-114 (`fcc1e44e`).
Panel trống `NoJobsPanel` (tone `light`, link mailto + nút) không phải phạm vi QA 37 (mailto là link chữ, không phải nút "Gửi CV ngay") → không đổi.

## Thiết kế fix
- Chỉ đổi `CopyEmailButton` khi `tone="onDark"` (bản trong banner) cho khớp quy ước nút của `CtaBanner`: dưới `sm` wrapper `w-full max-w-xs`, Button `w-full`; từ `sm` trở lên `sm:w-auto` (và wrapper `sm:max-w-none` nếu cần) → desktop giữ nguyên như hiện tại (nút theo nội dung, cạnh nút chính).
- Dòng báo "Đã sao chép"/lỗi: dưới `sm` xuống dòng dưới nút, không thụt lề lệch (vd `ms-3` chỉ áp từ `sm`); từ `sm` giữ như cũ.
- Tone `light` (panel trống) KHÔNG đổi class.
- Không đổi `CtaBanner`, i18n, `JobListPage.tsx`.

## Files
- Sửa: `src/components/careers/CopyEmailButton.tsx`, `src/components/careers/CopyEmailButton.test.tsx`.
- KHÔNG đụng: file bẩn ngoài scope (BL-119/121/122/123), `.context/runs/*`, `CtaBanner.tsx`.

## Acceptance
- [ ] 375 / 390: "Gửi CV ngay" và "Sao chép email" cùng rộng (xếp dọc, cùng `max-w-xs`), cùng cao 52px (≥ 44).
- [ ] ≥ sm (768, 1440): bố cục banner không đổi ngoài ý muốn (nút cạnh nhau theo nội dung).
- [ ] Panel trống tone light + trạng thái không email (BL-120: không banner, link "Liên hệ TAMI") không đổi.
- [ ] Test hồi quy (class tone onDark có `w-full` + `sm:w-auto`, tone light không có `w-full`) FAIL trước / PASS sau.
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/components/careers src/components/layout/CtaBanner.test.tsx` PASS.
- [ ] Ảnh 375 / 768 / 1440 trên dev local (nếu dev server chạy được) → `.context/review-reports/assets/bl124-*.png`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: `/tuyen-dung` mobile 375, banner "Chưa tìm thấy vị trí phù hợp?" (có email trong Cài đặt website): nút "Gửi CV ngay" rộng hơn "Sao chép email".
- Expected: 2 nút cùng rộng/cao.
- Actual before fix: test hồi quy FAIL — wrapper `flex flex-wrap items-center gap-y-2` không có `w-full`, Button không `w-full` → "Sao chép email" chỉ rộng theo chữ, hẹp hơn "Gửi CV ngay" (w-full max-w-xs) ở 375/390.
- Actual after fix: tone onDark: wrapper `w-full max-w-xs sm:w-auto sm:max-w-none`, Button `w-full sm:w-auto`, dòng báo `sm:ms-3` (không thụt lề dưới sm) → cùng rộng/cao với nút chính dưới sm, từ sm theo nội dung. Tone light class giữ nguyên.
- Evidence: 2 test mới trong `CopyEmailButton.test.tsx` (onDark có w-full/max-w-xs/sm:w-auto/sm:max-w-none; light không w-full) FAIL trước fix, PASS sau. `pnpm vitest run src/components/careers src/components/layout/CtaBanner.test.tsx` 5 file / 68 test PASS; `pnpm typecheck` sạch; eslint 2 file sạch. Screenshots: skip, không có dev server chạy ở localhost:3000 (cần DB, không dựng).
- Status: PASS (chờ reviewer)

## Residual risk
- Chưa đo bounding box 375/390 và 768/1440 trên trình duyệt thật (không có dev server) — dựa vào assertion class; reviewer nên kiểm bằng ảnh nếu có môi trường. Lớp `sm:` nhất quán với CtaBanner (nút chính `sm:w-auto`).

## Doc impact
- Không đổi API/ERD/schema/DESIGN. SPECIFICATIONS as-built PATCH qua spec-publisher.
