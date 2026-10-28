---
id: admin-date-format-vi
type: bug
status: done
created: 2026-10-26
---

# Admin: ô ngày ở màn chi tiết hiện định dạng tiếng Anh ("Oct 19, 2026 10:29 AM")

## Yêu cầu
Ô ngày/giờ trong admin (form chi tiết + cột phải) hiển thị theo định dạng tiếng Việt, không còn tên tháng tiếng Anh / AM-PM.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: admin (role admin), màn chi tiết bản ghi có sẵn của Dự án, Cho thuê, Tin BĐS, Tin tức, Trang pháp lý, Tuyển dụng — local + staging.
- Bước tái hiện: mở 1 bản ghi có sẵn → xem các ô ngày (ngày đăng, cập nhật…) ở form và cột phải.
- Expected: định dạng tiếng Việt (vd `19/10/2026 10:29`).
- Actual: "Oct 19, 2026 10:29 AM", "Jul 6, 2016 10:00 AM", Trang pháp lý "Oct 18".
- Evidence: Playwright `tests/e2e/admin/collection-suite.ts` test "07 mở bản ghi có sẵn" (assert "Ô ngày hiện định dạng tiếng Anh"); kết quả `test-results/summary.txt` (local) + `test-results/summary-staging.txt`; ảnh `test-results/admin-shots/<collection>/`.

## Acceptance (bắt buộc)
- [x] Mọi ô ngày ở 6 collection trên (và collection khác dùng cùng field/config) hiện tiếng Việt, không còn tên tháng EN / AM-PM.
- [x] Test "07 mở bản ghi có sẵn" của bộ e2e admin PASS cho 6 collection.
- [x] Unit test cho cấu hình định dạng ngày (nếu đặt ở config chung).

## Ghi chú
Phát hiện bằng bộ autotest Playwright admin chạy 2026-10-24 (124 test, local + staging). Root cause chưa xác định (có thể `admin.date.displayFormat` / i18n Payload).

## Kết quả (2026-10-28)
Done — `tasks/bug-admin-date-format-vi/phase-1-task-01.md`: helper `adminDate()` (`src/fields/admin-date.ts`) đặt `displayFormat` VN + giờ 24h cho mọi field date; e2e "07" 4 failed → 10 passed; STRICT PASS r1; no spec change (1.61.0) / test-scope v97.
