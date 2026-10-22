---
id: news-careers-followups
type: feature
status: pending
created: 2026-10-22
---

# Việc còn mở sau BL-054 (Tin tức / Tuyển dụng / Liên hệ) (BL-059)

Nguồn: phase review `.context/review-reports/feature-news-careers-contact-redesign-phase-1-2-phase-review.md` + review các task BL-054 (2026-10-22). Không chặn BL-054 (đã close-out, spec 1.47.1 / scope v62).

## Cần user quyết (NEEDS_USER)
1. **Trang Chính sách bảo mật** (nội dung CMS) đã nhắc việc thu email nhận "Bản tin thị trường" chưa? Nếu chưa → cập nhật nội dung + tăng `privacyPolicyVersion`.
2. **Thời gian lưu** email `newsletter-subscribers`: có đưa vào job data-retention không (bao lâu, xoá khi `unsubscribed`?).
3. **Tag tiếng Anh riêng** cho tin tức (hiện `/en` ẩn "Chủ đề" / "Thẻ:" vì `news.tags` chưa localized) — cần schema mới nếu muốn.

## Kỹ thuật (backlog)
- Xác nhận email (double opt-in) cho bản tin trước khi bắt đầu gửi mail thật; link huỷ đăng ký.
- Đặt `TRUST_CF_CONNECTING_IP` đúng ở staging / prod (đếm lượt xem + rate limit theo IP thật).
- Chi tiết tin: cột trái (mục lục + thẻ tư vấn) dính cả khối — màn lg thấp, bài nhiều heading có thể khuất nút "Nhận tư vấn".
- Tìm `q` tin tức: chữ lưu dạng NFD không khớp; đồng bộ điều kiện SQL nếu thêm hẹn giờ xuất bản (`publishedAt ≤ now`) — `news-search.ts`, `listTopNewsTags`, `most-read.ts`.
- Tìm `q` tuyển dụng quét ≤ 500 tin còn hạn in-memory → cột `searchText` khi số tin lớn.
- Dịch tự động: bản EN của `statHighlights.value/label` vượt `maxLength` làm cả bài dịch `failed`.
- Khoá dedupe lượt xem giữ trước khi cộng → DB lỗi làm mất lượt người đó trong ngày (đếm thiếu).
- Chưa kiểm trên trình duyệt thật: bản đồ + tab văn phòng `/lien-he`, khổ 768.
- `splitDescriptionLead` gọi 2 lần / request (view + component) — gộp.
