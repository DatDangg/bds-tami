---
id: detail-subnav-full-width
type: feature
status: done
created: 2026-10-20
---

# Thanh mục con trang chi tiết dài ngang bằng header

## Yêu cầu
User 2026-10-20 (kèm ảnh chi tiết dự án sau BL-027): thanh mục con (Tổng quan · Vị trí · Tiện ích · Thư viện…) hiện chỉ ôm vừa các nút nên "trông cụt quá" → **cho thanh dài ngang bằng header** (cùng bề rộng/khung và lề trái-phải như thanh header nổi), các nút vẫn nằm trong thanh.

**Sửa lại (user 2026-10-20, ảnh sau bản 84rem):** "sao lại dài hơn cái content ở dưới, phải thẳng nhau chứ" → thanh rộng **bằng khung nội dung bên dưới**: mép trái thẳng mép thẻ trắng nội dung, mép phải thẳng mép thẻ tư vấn (không dùng khung 84rem của header).

## Acceptance (bắt buộc)
- [ ] Trên `/du-an/[slug]` và `/cho-thue/[slug]` (vi + en): thanh mục con rộng bằng lưới nội dung bên dưới (mép trái = mép thẻ trắng, mép phải = mép thẻ tư vấn/liên hệ; < lg = mép thẻ nội dung), cả lúc chưa dính lẫn lúc dính đỉnh.
- [ ] Nút mục con giữ kiểu hiện tại (active nền vàng chữ đen); khi nhiều mục vượt bề rộng thì cuộn ngang trong thanh, trang không tràn ngang.
- [ ] Neo cuộn tới section + highlight mục hiện tại vẫn đúng như BL-027.
- [ ] 375 / 768 / 1280px không tràn ngang.

## Ghi chú
- Classify dự kiến: MODIFY (UI, không đổi schema). Follow-up của BL-027 (`src/components/detail/DetailSubNav`, `DetailLayout`), khung header BL-025 (`max-w-[84rem]`).
- Cần chốt khi build: thanh nằm ngoài lưới 2 cột (trải qua cả cột thẻ tư vấn) — đúng ý "dài ngang header".
