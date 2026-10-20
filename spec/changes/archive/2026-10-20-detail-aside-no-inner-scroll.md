---
id: detail-aside-no-inner-scroll
type: feature
status: done
created: 2026-10-20
---

# Chi tiết: thẻ tư vấn không có thanh cuộn riêng + thanh mục con cho thuê không dính sát ảnh

## Yêu cầu
User 2026-10-20 (ảnh chi tiết cho thuê `/cho-thue/...`): "phần tư vấn lại có scroll, nên là không có" — thẻ tư vấn/liên hệ cột phải có thanh cuộn dọc riêng → bỏ.
(Phần chuyển breadcrumb ở chi tiết cho thuê: user bỏ 2026-10-20 — KHÔNG làm.)

User 2026-10-20 (ảnh thứ 2): "cả phần cái thanh tổng quan … bị dính liền kia nữa" — ở chi tiết cho thuê, thanh mục con (Tổng quan · Điều khoản · Mô tả, trạng thái chưa dính) nằm sát mép dưới thư viện ảnh, không có khoảng cách → thêm khoảng cách giữa thư viện ảnh và thanh mục con (không dùng breadcrumb để tạo khoảng).
Hiện trạng: `src/components/rentals/RentalDetail.tsx:143` — khối Gallery chỉ có `mt-4`, không có khoảng dưới trước `subNav` của `DetailLayout`.

Hiện trạng (đã đọc code): `src/components/detail/DetailLayout.tsx:9` `DETAIL_ASIDE_CARD_CLASS` có `lg:sticky lg:top-[calc(var(--sticky-top)+4.5rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-5.5rem)] lg:overflow-y-auto` → thẻ cho thuê (giá + liên hệ + form) cao hơn viewport nên hiện thanh cuộn.

## Acceptance (bắt buộc)
- [ ] Thẻ tư vấn/liên hệ (dự án + cho thuê, dùng chung `DETAIL_ASIDE_CARD_CLASS`) không có thanh cuộn dọc riêng.
- [ ] Thẻ vừa viewport: vẫn dính dưới thanh mục con như hiện tại (BL-027).
- [ ] Thẻ cao hơn viewport: không bị cắt, nội dung cuối (checkbox đồng ý + nút gửi) tới được bằng cuộn trang — agent chọn cách (vd chỉ dính khi vừa viewport, hoặc dính theo đáy), ghi lý do.
- [ ] Chi tiết cho thuê: có khoảng cách rõ giữa thư viện ảnh và thanh mục con (tương đương khoảng ở chi tiết dự án giữa hero và thanh mục con, theo token spacing), ở mọi breakpoint; tin rented (có banner + tin tương tự) cũng không dính sát. Khi thanh mục con đã dính đầu trang thì không đổi.
- [ ] Breadcrumb giữ nguyên vị trí; < lg thẻ tư vấn không đổi.
- [ ] Test cập nhật.

## Ghi chú
Follow-up BL-027/BL-028. Đụng khung chi tiết dùng chung → review ít nhất NORMAL.
