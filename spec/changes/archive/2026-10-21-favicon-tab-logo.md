---
id: favicon-tab-logo
type: feature
status: done
created: 2026-10-21
completed: 2026-10-21
---

# Thêm logo TAMI lên tab trình duyệt (favicon)

## Yêu cầu
User 2026-10-21: "thêm cái logo ở tab đi". Hiện site chưa khai favicon nào (không có `src/app/**/icon.*`,
`favicon.ico` hay `metadata.icons`) nên tab trình duyệt hiện icon mặc định.
Dùng icon thương hiệu có sẵn `public/brand/tami-icon-gold.png` (mái nhà vàng, ảnh vuông nền trong suốt).

## Acceptance (bắt buộc)
- [ ] Mọi trang public (vi + en) và trang quản trị `/admin` hiện logo TAMI trên tab trình duyệt.
- [ ] Có `apple-touch-icon` cho iOS (thêm vào màn hình chính).
- [ ] Icon đọc rõ ở cỡ 16/32px trên cả tab sáng và tối.

## Ghi chú
- Next.js App Router: đặt `icon.png` / `apple-icon.png` (hoặc `favicon.ico`) trong `src/app/` hoặc khai `metadata.icons`.
- Admin Payload (`/admin`): **làm luôn** (user chốt 2026-10-21) — favicon admin cũng là logo TAMI (vd `admin.meta.icons`).
- Không đổi contract/schema → dự kiến `no doc impact`.
