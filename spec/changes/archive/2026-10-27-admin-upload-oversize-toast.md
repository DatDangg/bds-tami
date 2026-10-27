---
id: admin-upload-oversize-toast
type: bug
status: done
created: 2026-10-27
---

# Admin: tải ảnh > 10 MB hiện cùng lúc thông báo lỗi và "Successfully saved 1 files" (BL-088)

Nguồn: QA sheet "TAMI – Báo bug" dòng 10 (27/10/2026, mức Trung bình, ảnh bug10-1.png / bug10-2.png).

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/collections/projects/<id>` → tab Hình ảnh · Admin · 1920
- Bước tái hiện: đăng nhập Admin → mở một dự án → tab Hình ảnh → thêm ảnh dung lượng > 10 MB → xem thông báo và danh sách ảnh.
- Expected: ảnh > 10 MB bị từ chối; chỉ một thông báo lỗi rõ ràng (nêu giới hạn 10 MB); không có thông báo thành công khi upload thất bại.
- Actual: hai thông báo "An unknown error occurred" và "Successfully saved 1 files" hiện chồng lên nhau (phải trỏ chuột vào mới thấy cả hai) — kết quả upload mâu thuẫn.

## Acceptance (bắt buộc)
- [ ] Ảnh > 10 MB bị chặn, không thêm vào danh sách ảnh dự án, không tạo bản ghi media mồ côi.
- [ ] Chỉ hiện 1 thông báo lỗi tiếng Việt nêu rõ vượt giới hạn 10 MB; không hiện "Successfully saved".
- [ ] Ảnh ≤ 10 MB vẫn tải lên bình thường; kiểm tra cả ô ảnh khác dùng chung upload (Cho thuê, Tin BĐS, Tin tức) nếu cùng đường đi.

## Ghi chú
Cần root cause: giới hạn 10 MB đặt ở đâu (Payload `upload.limits` / proxy / validate hook) và vì sao bulk-upload báo thành công khi request lỗi.

## Kiểm tra 2026-10-27 (đọc code, chưa tái hiện trên admin)
- **Xác nhận là bug.** Server chặn đúng: `inspectUpload` trả 413 "File vượt quá 10MB." (`src/lib/upload/validate-file.ts:66`; trần request 20 MB, nginx 25 MB) → ảnh không được lưu.
- Thông báo "Successfully saved" do Payload UI 3.91.0 `BulkUpload/FormsManager` (`node_modules/@payloadcms/ui/dist/elements/BulkUpload/FormsManager/index.js:361–447`): khi gặp 413 nó tính lại `errorCount` bằng `getFormState` phía server; state mới không giữ cờ lỗi file → `errorCount = 0` → bị đếm là thành công → `toast.success("Successfully saved 1 files")` cùng lúc với `toast.error(...)`. Lỗi nằm ở thư viện, phía mình cần chặn sớm ở client (kiểm dung lượng trước khi gửi) hoặc vá/nâng Payload.
- Chưa rõ vì sao chữ lỗi là "An unknown error occurred" thay vì "File vượt quá 10MB." — cần tái hiện trên admin.

## Kết quả (2026-10-28)
- Done — task `tasks/bug-admin-upload-oversize-toast/phase-1-task-01.md`, STRICT PASS r2 (`.context/review-reports/bug-admin-upload-oversize-toast-phase-1-task-01-round-2-review.md`). Chữ "An unknown error occurred": build production minify làm `APIError.name` rỗng → `formatErrors` trả fallback. No spec change (1.59.0) / test-scope v90.
