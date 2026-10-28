---
id: admin-job-deadline-date-format
type: bug
status: done
created: 2026-10-28
---

# Admin Tuyển dụng: "Hạn nộp hồ sơ" hiện dạng "thg 10 30" thay vì dd/MM/yyyy (QA sheet bug 18, Trung bình)

## Yêu cầu
Ô Hạn nộp hồ sơ ở admin hiển thị dd/MM/yyyy thống nhất với trang khách; giá trị lưu đúng ngày đã chọn.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/collections/job-postings/<id>`, Admin, 1920
- Bước tái hiện: mở tin tuyển dụng → trường Hạn nộp hồ sơ → chọn ngày, lưu → mở lại
- Expected: dd/MM/yyyy, giá trị đúng ngày đã chọn (không lệch múi giờ)
- Actual: hiển thị "thg 10 30"

## Acceptance (bắt buộc)
- [x] Kiểm lại trên code hiện tại (có BL-076 `af1e983`, chưa deploy) — nếu đã hết thì đóng với evidence
- [x] Ô + ô chọn ngày hiển thị dd/MM/yyyy; lưu/mở lại đúng ngày (GMT+7)
- [x] Cột danh sách (nếu có) cùng định dạng

## Ghi chú
Nguồn: QA sheet 28/10/2026 dòng 18. `src/collections/JobPostings.ts:99` dùng `adminDate("dayOnly")`.

## Kết quả (2026-10-29)
Không tái hiện trên HEAD 7b0a315 — fixed by `af1e983` (BL-076), chờ deploy. Evidence: `tasks/bug-admin-job-deadline-date-format/phase-1-task-01.md`.
