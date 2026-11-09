---
id: careers-cv-mailto-no-action
type: bug
status: done
created: 2026-11-09
---

# Tuyển dụng: bấm "Gửi CV tới <email>" không có phản ứng (QA bug 31)

## Bối cảnh / tái hiện (bug)
- Màn/route/role: /tuyen-dung (trạng thái chưa có vị trí), Khách, 1920
- Bước: bấm nút "Gửi CV tới tami@gmail.com"
- Expected: mở ứng dụng/giao diện soạn email, điền sẵn người nhận
- Actual: không có thao tác nào

## Điều tra sơ bộ (2026-11-09)
Nút là `mailto:` đúng (`src/components/careers/JobListPage.tsx:125`, banner `CareersCvBanner.tsx:23`). `mailto:` chỉ chạy khi máy có ứng dụng email mặc định → máy chỉ dùng webmail bấm không thấy gì. Không phải lỗi link.
Hướng xử lý: giữ `mailto:` + thêm nút "Sao chép email" (toast "Đã sao chép") cạnh nút, cho cả trạng thái trống và banner "Gửi CV ngay"; có bản EN.

## Acceptance (bắt buộc)
- [ ] Máy không có mail client vẫn lấy được email (copy) + có phản hồi
- [ ] Test hồi quy

Nguồn: QA sheet "TAMI – Báo bug" (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4) dòng 31.
