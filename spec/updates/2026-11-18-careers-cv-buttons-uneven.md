# Spec Update — 2026-11-18 careers-cv-buttons-uneven

**spec_version:** 1.64.1 → 1.64.2 (PATCH — as-built bug-fix UI BL-124, QA 37)
**Trigger:** bug-fix (BL-124, `bug-careers-cv-buttons-uneven`)
**Requirements:** LÀM RÕ mục Tuyển dụng trong SPECIFICATIONS.md (tìm "BL-124"): banner "Chưa tìm thấy vị trí phù hợp?" ở `/tuyen-dung` và `/en/careers` — dưới `sm` nút "Sao chép email" (`CopyEmailButton` tone onDark) bằng nút chính "Gửi CV ngay": cùng rộng tối đa 320px (full width, `max-w-xs`), cùng cao 52px, xếp dọc; từ `sm` giữ nguyên (rộng theo nội dung, cạnh nhau); thông báo sao chép xuống dòng dưới nút, không thụt lề trên mobile.
**Ảnh hưởng:** chỉ class của `src/components/careers/CopyEmailButton.tsx` (+ test). Không API/schema/quyền/migration.
**Không đổi:** panel trạng thái trống (tone light); trạng thái không có email (BL-120: không banner, link "Liên hệ TAMI"); chức năng sao chép (BL-114).
**Evidence:** `.context/review-reports/bug-careers-cv-buttons-uneven-phase-1-task-01-round-1-review.md` (NORMAL PASS r1). Residual risk: chưa đo bằng trình duyệt thật (không có dev server), verify theo class + unit test.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 123, risk low)
