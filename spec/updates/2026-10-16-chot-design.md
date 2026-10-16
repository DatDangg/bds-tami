# Spec Update — 2026-10-16 chot-design

**spec_version:** 1.2.1 → 1.2.2 (PATCH — chốt chi tiết giao diện, chưa có code)

**Nguồn:** `/start` bước 3 (subagent `design`): `.context/design-spec.md`, `skills/react-nodejs/design-tokens.md`. User duyệt 16/10/2026.

**Thay đổi:**
- Trang chủ (F1): hero ảnh bắt buộc, video tuỳ chọn từng slide (chỉ phát ≥ 1024px); bỏ dải 4 lối tắt; thêm banner CTA "Nhận tư vấn"; thẻ Dịch vụ dùng ảnh
- SEO: tin "Đã thuê" và tin tuyển dụng quá hạn vẫn mở trang, `noindex, follow`, không vào sitemap (tuyển dụng quá hạn ẩn form, bỏ JSON-LD)
- Q7 chốt: banner đồng ý cookie, GA4 chỉ tải sau khi khách đồng ý
- Tokens: 4 màu đổi để đạt WCAG AA; icon Phosphor; eyebrow ≤ 1/3 section

**Docs đã cập nhật:** `SPECIFICATIONS.md`, `docs/DESIGN.md` (bảng màu + mục quyết định), `docs/ERD.md` (`homepage.hero.slides[].video`, `homepage.ctaBanner`, `services.coverImage`, `media` nhận MP4/WebM), `.context/design-spec.md`

**Scope sinh:** chưa sinh — dự án chưa có code
