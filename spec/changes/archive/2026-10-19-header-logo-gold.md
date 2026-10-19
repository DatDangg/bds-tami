---
id: header-logo-gold
type: feature
status: done
created: 2026-10-19
---

# Logo header nền sáng dùng bản vàng

## Yêu cầu
User thấy logo đen ở header nền sáng không đẹp, muốn dùng **logo vàng**. `docs/DESIGN.md` § Logo vốn ghi
`tami-logo-gold.png` là **logo chính** cho header nền sáng, nhưng `src/components/layout/BrandLogo.tsx` đang dùng
`/brand/tami-logo-dark.png` cho `tone="on-light"` → lệch thiết kế.

## Acceptance (bắt buộc)
- [ ] Header nền sáng (sticky khi cuộn + trang không có hero) hiện logo vàng `/brand/tami-logo-gold.png` khi CMS chưa cấu hình logo.
- [ ] Header trong suốt trên hero, footer, menu toàn màn hình giữ logo trắng.
- [ ] Logo vàng đủ nhìn rõ trên nền sáng (kiểm tra tương phản; nếu không đạt thì báo lại user trước khi chốt).
- [ ] Rà lại doc: bản đen chỉ còn dùng cho in ấn / dự phòng (cập nhật `docs/DESIGN.md` nếu đổi vai trò).

## Ghi chú
Logo nhập trong CMS (`site-settings.logo`) vẫn ưu tiên hơn file tĩnh.

## Blocked — chờ user quyết (change-request, 2026-10-19)
Kiểm tương phản (ngưỡng non-text 3:1, WCAG 1.4.11) trên toàn bộ pixel đặc (alpha ≥ 0.9, 62 066 px) của
`public/brand/tami-logo-gold.png` (800×416):

| Nền | Màu TB logo | CR màu TB | min | p10 | trung vị | p90 | max | % px ≥ 3:1 |
|---|---|---|---|---|---|---|---|---|
| `--color-surface` #FFFFFF (header đặc) | rgb(232,206,158) | 1.53 | 1.04 | 1.35 | 1.50 | 1.81 | 2.01 | 0% |
| `--color-bg` #F7F5F4 | rgb(232,206,158) | 1.41 | 1.00 | 1.24 | 1.38 | 1.66 | 1.85 | 0% |
| (đối chứng) `tami-logo-dark.png` trên #FFFFFF | rgb(51,49,50) | 12.90 | 11.99 | — | 12.91 | — | 13.24 | 100% |

⇒ Logo vàng **không đạt 3:1** (tối đa 2.01:1) → theo acceptance "không đạt thì báo lại user trước khi chốt": DỪNG, chưa sửa code.
Phương án chờ user chọn: (A) giữ logo đen cho header đặc, sửa `docs/DESIGN.md` § Logo bỏ "header nền sáng" khỏi vai trò logo vàng;
(B) vẫn dùng logo vàng (chấp nhận ~1.5:1 — logo/logotype được WCAG miễn nhưng nhìn nhạt); (C) xuất bản vàng đậm từ
`assets/brand/source/tami-homes-logo.ai` (vd tông `#8C6733` của admin ≈ 5.1:1 trên trắng) cho header đặc — cần duyệt màu thương hiệu.

## Quyết định user (2026-10-19)
User chọn **phương án B** ("dùng vàng thử đi"): dùng `/brand/tami-logo-gold.png` hiện có cho header nền sáng, **chấp nhận
tương phản ~1.5:1** (trung vị 1.50, 1.04–2.01:1 trên #FFFFFF; 1.38 trên #F7F5F4 — số đo ở trên). Logo/logotype được WCAG
miễn trừ. Bản đen chỉ còn dùng cho in ấn / dự phòng (`docs/DESIGN.md` § Logo đã cập nhật).
