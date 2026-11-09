---
id: site-settings-social-duplicate
type: bug
status: done
created: 2026-11-05
---

# Mạng xã hội: cho lưu 2 bản ghi Instagram trùng link (QA bug 28)

## Yêu cầu
Thêm 2 bản ghi Instagram cùng link https://www.instagram.com/tamihomes.test/ vẫn lưu được. Mong đợi: chặn trùng nền tảng hoặc trùng link sau chuẩn hoá URL. Nên làm chung với bug 27 (cùng field array).

Nguồn: QA sheet "TAMI – Báo bug" dòng 28 (https://docs.google.com/spreadsheets/d/1X7IUOEEF7QFD-OHdznjfVwttN0pB6wHGqTBJh1fXBf4).

## Acceptance (bắt buộc)
- [ ] Tái hiện đúng bước QA ghi, thấy lỗi trước khi sửa (root cause trước, không sửa triệu chứng)
- [ ] Sau sửa, bước tái hiện cho kết quả đúng "mong đợi"; có test hồi quy

## Quyết định (user 2026-11-09)
Chặn **trùng nền tảng**: mỗi nền tảng tối đa 1 dòng (trừ "Khác" được nhiều dòng); đồng thời chặn trùng link sau chuẩn hoá (bỏ `www.`, bỏ `/` cuối, không phân biệt hoa thường host). Báo lỗi tiếng Việt tại dòng bị trùng. Làm chung task với BL-108 (cùng field `socialLinks`).
