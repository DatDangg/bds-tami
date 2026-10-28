---
id: admin-media-list-columns
type: bug
status: done
created: 2026-10-28
---

# Admin Thư viện media: bật cột Người tải lên / ID / Chú thích / Ngày cập nhật / Ngày tạo nhưng không hiện (QA sheet bug 16, Thấp)

## Yêu cầu
Bật/tắt cột ở danh sách Thư viện ảnh & tệp phải cập nhật bảng đúng.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/collections/media?columns=[filename,alt,mimeType,uploadedBy,id,caption,updatedAt,createdAt]`, Admin, 1920
- Bước tái hiện: đăng nhập Admin → Thư viện ảnh & tệp → Hiển thị cột → bật Người tải lên, ID, Chú thích, Ngày cập nhật, Ngày tạo
- Expected: cột bật hiện trong bảng, không vỡ bố cục
- Actual: bật các cột đó nhưng không hiện

## Acceptance (bắt buộc)
- [x] Bật từng cột trên → cột hiện với dữ liệu đúng; tắt → ẩn
- [x] Lựa chọn cột lưu theo preferences như các collection khác
- [x] Không ảnh hưởng list view collection khác

## Ghi chú
Nguồn: QA sheet 28/10/2026 dòng 16. Có thể do view danh sách media tuỳ biến (lưới ảnh) không đọc `columns`.

## Kết quả
- Done 2026-10-29: `tasks/bug-admin-media-list-columns/phase-1-task-01.md`, review `.context/review-reports/bug-admin-media-list-columns-phase-1-task-01-round-1-review.md` (NORMAL PASS r1). no spec change (1.61.0) / scope v103.
