---
id: admin-author-name-for-sale
type: bug
status: done
created: 2026-10-27
---

# Admin: cột "Người tạo" hiện "Chưa đặt tên - ID: …" khi Sale xem tin của người khác

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/collections/rentals`, Sale (sheet QA bug 7, Trung bình)
- Bước: đăng nhập Sale 1 → danh sách Cho thuê → cột Người tạo.
- Expected: hiện tên hoặc email nhận diện được.
- Actual: "Chưa đặt tên - ID: e23c0ba2-…"; mở hồ sơ → "Không tìm thấy". Tin của chính Sale 1 hiện email.
- Root cause: `src/collections/Staff.ts:120` `read: selfOrAdmin` → Payload không populate được `author` (`src/fields/author.ts`, relationTo `staff`) của nhân viên khác cho Sale.

## Quyết định user (2026-10-27)
**Hiện tên/email, KHÔNG mở hồ sơ**: Sale thấy họ tên (hoặc email) người tạo ở cột/ô Người tạo của mọi collection dùng `authorField()`, nhưng vẫn KHÔNG đọc/mở được hồ sơ staff khác (giữ `read: selfOrAdmin`, PERMISSION §4 không nới).

## Acceptance (bắt buộc)
- [ ] Sale xem danh sách + màn sửa các collection có `author`: thấy tên (fallback email) của người tạo, không còn "Chưa đặt tên - ID".
- [ ] Sale vẫn không truy cập được `/admin/collections/staff/<id khác>` hay API staff của người khác; chỉ lộ tên/email hiển thị, không lộ trường khác.
- [ ] Admin không đổi hành vi. Test access + hiển thị.

## Ghi chú
Rủi ro auth/RBAC → reviewer STRICT. Không sửa `src/collections/Rentals.ts` nếu tránh được (file đang có thay đổi dở chưa commit của BL-077).
