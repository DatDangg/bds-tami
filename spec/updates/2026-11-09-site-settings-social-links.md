# Spec Update — 2026-11-09 site-settings-social-links

**spec_version:** 1.62.3 → 1.62.4 (PATCH — as-built bug-fix + quy tắc chặn trùng theo quyết định user)
**Trigger:** bug-fix (BL-108 QA 27, BL-109 QA 28)
**Requirements:** THÊM khối F10 "Mạng xã hội trong Cài đặt chung — Link trang bắt buộc, không trùng": Link trang bắt buộc ("Vui lòng nhập Link trang"); mỗi nền tảng ≤ 1 dòng trừ "Khác"; không trùng link sau chuẩn hoá (host thường, bỏ www., bỏ / cuối, http ≡ https, giữ path/query/hash); lỗi tiếng Việt tại dòng sau; kiểm lúc lưu.
**Ảnh hưởng:** global `site-settings` (tab liên hệ / mạng xã hội) — mọi lần lưu global; footer / liên hệ / JSON-LD đọc `socialLinks` không đổi.
