---
id: careers-empty-state-no-cta
type: bug
status: done
created: 2026-11-10
---

# Tuyển dụng — trạng thái "chưa có vị trí" mời gửi CV nhưng không có nút/email nào

## Yêu cầu
User (2026-11-10, ảnh chụp `/tuyen-dung` mục "Vị trí đang tuyển"): khi không có vị trí, panel hiện
"Hiện TAMI chưa có vị trí đang tuyển." + "Bạn vẫn có thể gửi CV để TAMI liên hệ khi có vị trí phù hợp." nhưng **không có nút**
→ câu mời gửi CV treo, người xem không biết gửi bằng cách nào.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/tuyen-dung` (VI, có thể cả `/en/careers`), khách vãng lai, 0 vị trí còn hạn, không lọc.
- Expected: câu mời gửi CV luôn đi kèm cách gửi (nút "Gửi CV tới <email>" + "Sao chép email" — BL-114), hoặc không hiện câu mời khi không có cách gửi.
- Actual: chỉ có tiêu đề + câu mô tả, không nút.

## Root cause (đã xác định)
`src/components/careers/JobListPage.tsx:120-135` (`NoJobsPanel`): câu `noJobsDescription` (`src/i18n/messages/vi.json:811`) luôn render,
còn nút mailto + `CopyEmailButton` chỉ render khi `loadContactEmail` (`JobListPage.tsx:110-117`, `buildContact(siteSettings).email`)
trả về email. Môi trường đang xem chưa nhập email liên hệ trong **Cài đặt website** (hoặc đọc settings lỗi) → nút ẩn, câu mời vẫn hiện.
Cần kiểm thêm banner "Gửi CV ngay" cuối trang có cùng lỗi khi thiếu email không.

## Hướng sửa đề xuất (change-request chốt)
- Khi **không có email**: đổi câu mô tả không nhắc gửi CV (vd "Hãy quay lại sau hoặc liên hệ TAMI để được tư vấn.") + nút "Liên hệ TAMI" về trang Liên hệ;
  hoặc ẩn hẳn câu mô tả. Có email: giữ nguyên BL-114.
- Đồng thời (dữ liệu, không code): nhập email tuyển dụng/liên hệ trong Cài đặt website ở môi trường bị lỗi.

## Acceptance
- [x] Không có email: panel trống không còn câu mời gửi CV mà không có cách gửi (VI + EN)
- [x] Có email: vẫn hiện "Gửi CV tới <email>" + "Sao chép email" như BL-114
- [x] Banner "Gửi CV ngay" xử lý nhất quán khi thiếu email
- [x] Test `JobListPage.test.tsx` thêm case thiếu email

## Ghi chú
Liên quan BL-114 (`spec/changes/archive/*careers-cv-mailto-no-action*`), design-spec S12.

## Kết quả (2026-11-10)
Done: không email → câu trung tính + link "Liên hệ TAMI" (`/lien-he`, `/en/contact`), banner "Gửi CV ngay" ẩn; có email giữ BL-114. Task `tasks/bug-careers-empty-state-no-cta/phase-1-task-01.md`, NORMAL PASS r1, spec 1.63.2 / scope v119. Việc dữ liệu (nhập email trong Cài đặt website ở môi trường lỗi) vẫn do admin làm.
