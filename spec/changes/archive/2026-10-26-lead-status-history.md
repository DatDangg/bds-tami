---
id: lead-status-history
type: bug
status: done
created: 2026-10-26
---

# Lead: đổi trạng thái không ghi dòng lịch sử "Mới → Đã liên hệ"

## Yêu cầu
Khi admin đổi trạng thái lead, lịch sử xử lý phải có dòng ghi đổi trạng thái (từ → tới).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: admin (role admin), chi tiết Lead — local.
- Bước tái hiện: gửi form Liên hệ ở website → mở lead trong admin → đổi trạng thái Mới → Đã liên hệ → lưu → xem lịch sử.
- Expected: có dòng "Mới → Đã liên hệ".
- Actual: không có dòng đó (assert "Dòng lịch sử đổi trạng thái không ghi Mới → Đã liên hệ").
- Evidence: `tests/e2e/admin/inbox.spec.ts` test 20 Lead; `test-results/summary-new.txt`, `test-results/summary-inbox.txt`.

## Acceptance (bắt buộc)
- [x] Đổi trạng thái lead tạo dòng lịch sử đúng từ/tới (kiểm cả khả năng test sai selector/nhãn trước khi sửa code).
- [x] Test 20 Lead trong `inbox.spec.ts` PASS ở local.
- [x] Kèm: chạy lại test 20 Hồ sơ ứng tuyển ở local để chốt lỗi "khách chưa đăng nhập tải được CV" — lần chạy 2026-10-24 có thể báo nhầm (context khách thừa hưởng cookie admin, test đã sửa ở `inbox.spec.ts:299` nhưng chưa chạy lại; `PrivateFiles.access.read = isAdmin`). Nếu vẫn FAIL → ghi bug riêng, ưu tiên cao (lộ dữ liệu cá nhân).

## Ghi chú
Phát hiện bằng autotest Playwright admin 2026-10-24.

## Kết quả (2026-10-28)
- Lead: bug app (hiển thị) — activity `status_change` lưu đúng từ/tới nhưng bảng "Lịch sử chăm sóc" không có cột trạng thái trước/sau → thêm `admin.defaultColumns` cho join. Task `tasks/bug-lead-status-history/phase-1-task-01.md`.
- CV khách chưa đăng nhập: **báo nhầm** — chạy lại test 20 Hồ sơ ứng tuyển (context khách sạch): khách nhận 401, admin 200 PDF. Không tạo bug mới.
