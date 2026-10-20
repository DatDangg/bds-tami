---
id: header-full-width-at-top
type: feature
status: done
created: 2026-10-20
---

# Header: chưa cuộn thì là thanh phẳng full-width, chỉ khi cuộn mới thành thanh nổi bo tròn

## Yêu cầu
MODIFY header công khai (design-spec §2.1, BL-020 P1-T02 `ab3f95a`). Hiện `HeaderFrame` LUÔN là thanh nổi bo tròn
(`rounded-pill`, cách mép 8/16px, max 84rem, shadow) kể cả khi trang ở đầu (chưa cuộn) → user (2026-10-20): "nếu chưa cuộn
nó cũng bị thành 1 thanh bo góc, không ổn".

Hướng đã chốt (user 2026-10-20):
- Ở đầu trang (`scrollY ≈ 0`): header là thanh phẳng full-width sát mép trên/trái/phải, không bo góc, không shadow, không khe lề.
- Khi cuộn xuống: chuyển sang thanh nổi bo tròn kính mờ như hiện tại (lề 8/16px, max 84rem, shadow).
- Chuyển đổi mượt (transition), tắt animation khi `prefers-reduced-motion`.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: mọi trang công khai (`/`, `/du-an/...`, `/cho-thue`...), khách, mọi breakpoint
- Bước tái hiện: mở trang, chưa cuộn
- Expected: header phẳng full-width
- Actual: thanh bo tròn nổi cách mép ngay từ đầu

## Acceptance (bắt buộc)
- [ ] Chưa cuộn: header full-width, góc vuông, không shadow/khe lề — ở 375 / 768 / 1280px, trang có hero và không có hero
- [ ] Cuộn xuống: thành thanh nổi bo tròn như hiện tại; cuộn về đầu thì trở lại phẳng
- [ ] Không CLS: `--header-offset` (hero kéo lên, ProjectSubNav `top`, `scroll-margin-top` neo, aside dính) vẫn đúng ở cả hai trạng thái
- [ ] Chữ/logo vẫn đạt tương phản AA trên nền header ở cả hai trạng thái (kể cả đè hero); `prefers-reduced-transparency` vẫn nền đặc
- [ ] `prefers-reduced-motion`: đổi trạng thái tức thì, không animation
- [ ] Cập nhật design-spec §2.1 + test `HeaderFrame.test.tsx`

## Ghi chú
- `HeaderFrame` hiện là server component "không cần JS/observer" — thay đổi này cần trạng thái cuộn (sentinel + IntersectionObserver
  hoặc scroll listener rẻ) ⇒ client component nhỏ; cân nhắc giữ nguyên chiều cao `<header>` để không đổi `--header-offset`.
- **Đã chốt (user 2026-10-20):** ở đầu trang, kể cả trên hero, header VẪN nền kính mờ sáng như hiện tại — chỉ đổi hình dạng sang phẳng full-width (không biến thể trong suốt).
