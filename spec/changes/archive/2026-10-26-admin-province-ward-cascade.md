---
id: admin-province-ward-cascade
type: bug
status: done
created: 2026-10-26
---

# Admin: ô Tỉnh/thành → Phường/xã không lọc/không bỏ chọn theo tỉnh, lỗi lộ UUID

## Yêu cầu
Trong form Dự án / Cho thuê / Tin BĐS, ô Phường/xã phải đi theo Tỉnh/thành đang chọn và báo lỗi dễ hiểu.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: admin (role admin), form tạo/sửa Dự án, Cho thuê, Tin BĐS.
- Bước tái hiện + Actual:
  1. Chọn tỉnh → mở ngay ô Phường/xã → danh sách chưa lọc theo tỉnh vừa chọn (local).
  2. Chọn tỉnh A + phường của A (vd "Phường Cầu Giấy") → đổi sang tỉnh B → phường của tỉnh A vẫn giữ trong ô (local + staging).
  3. Lưu với phường sai tỉnh → thông báo lỗi lộ mã UUID (local).
- Expected: (1) danh sách phường chỉ gồm phường của tỉnh đang chọn, ngay sau khi chọn tỉnh; (2) đổi tỉnh thì bỏ chọn phường cũ; (3) lỗi là câu tiếng Việt dễ hiểu, không có UUID.
- Evidence: `tests/e2e/admin/location-ward.spec.ts`; `test-results/summary.txt` (3 lỗi × 3 collection), `test-results/summary-staging.txt` (lỗi 2 × 3 collection).

## Acceptance (bắt buộc)
- [x] 3 hành vi trên đúng ở cả 3 collection.
- [x] `tests/e2e/admin/location-ward.spec.ts` PASS.
- [x] Unit/ui test cho logic lọc + reset + câu báo lỗi.

## Ghi chú
Cùng root cause khả năng cao (field ward dùng chung) → gộp 1 change. Phát hiện bằng autotest Playwright admin 2026-10-24.
