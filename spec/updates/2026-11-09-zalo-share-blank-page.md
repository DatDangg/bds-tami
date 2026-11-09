# Spec Update — 2026-11-09 zalo-share-blank-page

**spec_version:** 1.62.2 → 1.62.3 (PATCH — as-built bug-fix, hành vi nút Zalo theo quyết định user)
**Trigger:** bug-fix (BL-105, QA 24 Cao)
**Requirements:** SỬA mô tả cụm chia sẻ (F7 Tin tức v2 — khối "As-built BL-105"): bỏ link `sp.zalo.me/plugins/share` (trả trang trắng). Có Web Share → 1 nút "Chia sẻ" mở menu chia sẻ hệ điều hành (thay Zalo + "thêm"); không có Web Share → nút "Chia sẻ qua Zalo" sao chép link + thông báo "Đã sao chép liên kết: dán vào Zalo để chia sẻ". Không SDK / OA ID.
**Ảnh hưởng:** `ShareButtons` (chi tiết tin tức, tuyển dụng, menu dự phòng `DetailShareButton` Dự án / Cho thuê / Tin BĐS); i18n `page.news.share.native`, `page.news.share.zaloCopied`.
