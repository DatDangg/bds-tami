---
id: site-settings-social-link-validation
type: bug
status: done
created: 2026-11-05
---

# Mạng xã hội: Link trang bắt buộc nhưng thêm mới = Unknown error, cập nhật xoá link vẫn lưu được (QA bug 27)

## Yêu cầu
Cài đặt chung > Mạng xã hội. TH1 thêm mới để trống Link trang -> hiện "Unknown error" (mong đợi: thông báo bắt buộc nhập). TH2 sửa bản ghi cũ, xoá Link trang -> vẫn lưu được (mong đợi: chặn + validation). Thống nhất validation hai luồng.

Nguồn: QA sheet "TAMI – Báo bug" dòng 27 (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4).

## Acceptance (bắt buộc)
- [ ] Tái hiện đúng bước QA ghi, thấy lỗi trước khi sửa (root cause trước, không sửa triệu chứng)
- [ ] Sau sửa, bước tái hiện cho kết quả đúng "mong đợi"; có test hồi quy

## Điều tra (2026-11-09)
Root cause: `validateHttpUrl` (`src/globals/SiteSettings.ts:18`) là validate tuỳ biến, thay thế validate mặc định của Payload nên bỏ mất kiểm tra `required`; giá trị rỗng trả `true`. Thêm mới: `url` undefined → DB NOT NULL lỗi → "Unknown error". Sửa: `""` lưu được. Hướng sửa: validate kiểm `options.required` → trống báo "Vui lòng nhập Link trang".
