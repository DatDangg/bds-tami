---
id: news-consult-form-layout
type: bug
status: done
created: 2026-10-28
---

# Tin tức: form "Tư vấn nhu cầu" lệch trái, bên phải trống lớn (QA sheet bug 14, Thấp)

## Yêu cầu
Bố trí lại khối form "Tư vấn nhu cầu" cuối trang /tin-tuc cho cân đối với khung nội dung.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/tin-tuc` (VI), Khách, 1920
- Bước tái hiện: mở Tin tức → cuộn xuống cuối danh sách bài → xem khối "Tư vấn nhu cầu"
- Expected: form cân đối trong khu vực nội dung, không tạo khoảng trống lớn bất thường; trường nhập + nút gửi rõ ràng
- Actual: form chỉ chiếm phần nhỏ bên trái, bên phải bỏ trống lớn

## Acceptance (bắt buộc)
- [ ] Khối form cân đối ở 1920 / 1440 / 768 / 390, theo design-spec của trang Tin tức
- [ ] Không đổi hành vi gửi form (lead vẫn tạo đúng nguồn)
- [ ] Ảnh Playwright trước/sau

## Ghi chú
Nguồn: QA sheet 28/10/2026 dòng 14 — https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4 (gid 642400866). Sheet không đính ảnh.
