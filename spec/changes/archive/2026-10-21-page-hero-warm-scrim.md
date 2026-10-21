---
id: page-hero-warm-scrim
type: feature
status: done
created: 2026-10-21
---

# Hero trang con — lớp phủ ảnh đen ánh nâu vàng thay đen lạnh (BL-049)

## Yêu cầu
User 2026-10-21 gửi ảnh hero trang Cho thuê: "cái mờ này là đang dùng màu đen à, dùng màu vàng đậm của hệ thống cho vào rồi mờ thì sao".
Đã phân tích với user: phủ vàng thật (`#e0bf89` / `#8c6733` mờ) làm chữ trắng < 4.5:1 và dòng tiêu đề vàng `--color-on-dark-accent` chìm vào nền → user chọn **phương án A**: giữ độ tối, đổi tông scrim từ đen lạnh `rgb(10 12 16 / 0.6)` sang **đen ánh nâu vàng** (gợi ý ≈ `rgb(28 20 10 / 0.6)`) để ảnh ngả ấm hợp màu TAMI.

Hiện trạng: `src/components/layout/PageHero.tsx:39-41` — `bg-banner-scrim` phủ toàn ảnh + gradient `from-banner-scrim to-transparent` từ trái; token `--color-banner-scrim` ở `src/app/(frontend)/globals.css:31`.

## Acceptance (bắt buộc)
- [x] Hero trang con có ảnh (Cho thuê, Dự án, Tin BĐS, Tin tức, Tuyển dụng… dùng `PageHero`) phủ scrim đen ánh nâu vàng, cả lớp toàn ảnh lẫn gradient trái.
- [x] Chữ trắng (tiêu đề, mô tả, breadcrumb) vẫn ≥ 4.5:1 kể cả trên ảnh trắng tinh; dòng tiêu đề vàng vẫn đọc rõ (đo + ghi số trong task).
- [x] Màu đi qua token trong `globals.css` (không hardcode trong component), có comment lý do như token cũ.
- [x] Test PageHero/trang danh sách hiện có vẫn PASS; cập nhật `design-spec` / `docs/DESIGN.md` phần scrim.

## Ghi chú
- `--color-banner-scrim` còn dùng ở `CtaBanner`, `AboutBlock` (chú thích ảnh), `PageBanner`, và `text-shadow` (globals.css:329). **User chốt 2026-10-21: đổi CHUNG token** → mọi lớp phủ ảnh dùng token này cùng ngả ấm; acceptance tương phản áp cho tất cả các chỗ đó.
- Không đổi độ mờ/độ dày gradient, bố cục, ảnh.
