# Spec Update — 2026-11-09 search-area-still-fails

**spec_version:** 1.62.4 → 1.62.5 (PATCH — quyết định user 2026-11-05: chỉ tìm theo tên hiện hành)
**Trigger:** bug-fix (BL-110, QA 22 "Vẫn lỗi")
**Requirements:** SỬA "Quy tắc biên — Đổi tên tỉnh / phường / dự án": tên cũ của phường (`legacyNames`) KHÔNG còn nằm trong `rentals.searchText`; đổi tên cũ không dựng lại chỉ mục; tên cũ chỉ để tra cứu.
**Ảnh hưởng:** tìm kiếm Cho thuê `q` (vd "ba đình" không còn ra tin phường Hồng Hà qua tên cũ "Phường Phúc Xá, Quận Ba Đình"); gõ tên phường/quận cũ không còn ra tin. Vận hành: chạy `pnpm reindex:rentals-search` trên staging rồi production sau deploy.
