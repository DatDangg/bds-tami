---
id: header-scroll-transition-smooth
type: feature
status: done
created: 2026-10-20
---

# Header: animation chuyển phẳng ↔ thanh nổi mượt hơn

## Yêu cầu
MODIFY nhỏ sau BL-025 (`f5ed892`). User (2026-10-20): "thêm chút animation cho nó mượt mượt xíu đi". Hiện chuyển trạng thái
(`src/components/layout/HeaderFrame.tsx`) là transition 250ms (`--duration-base`, `--ease-out`) trên `padding` (header),
`max-width` / `border-radius` / `box-shadow` (thanh). Điểm gợn đã thấy khi kiểm trình duyệt:
- `rounded-pill` = 9999px nên khi nội suy 0 ↔ 9999px góc gần như giữ tròn hẳn rồi mới vuông (hoặc ngược lại) → cảm giác "giật" ở cuối.
- 250ms + đường cong ease-out mạnh → đổi hình dạng hơi vội.

Hướng đề xuất (agent tự chọn chi tiết, giữ đơn giản, chỉ CSS):
- Bo góc thanh nổi bằng giá trị thật (≈ nửa chiều cao thanh: 32px / lg 36px) thay vì 9999px để góc bo dần đều.
- Thời lượng dài hơn chút (~350–450ms) với đường cong êm (vd `--ease-standard`), padding/max-width/radius/shadow chạy cùng nhịp.
- Có thể thêm chuyển nhẹ cho nền/viền kính (vd đổ bóng hiện dần) — không thêm thư viện animation.

## Acceptance (bắt buộc)
- [x] Cuộn xuống / về đầu: hình dạng đổi liền mạch, góc bo đổi dần (không giữ tròn rồi bật vuông), không giật ở 375 / 768 / 1280 / 1920px
- [x] Không CLS: chiều cao `<header>` (`--header-offset` 80/104px) không đổi suốt quá trình; logo/nút không nhảy ngang
- [x] `prefers-reduced-motion`: đổi tức thì như hiện tại
- [x] Chỉ animate thuộc tính rẻ hợp lý; không jank thấy được khi cuộn nhanh lên xuống quanh ngưỡng 4px
- [x] Cập nhật design-spec §2.1 (thời lượng/đường cong) + test HeaderFrame nếu class đổi

## Ghi chú
Thuần thẩm mỹ, không đổi behavior/requirement → có thể không cần bump spec_version (agent quyết theo `.agent/spec-publish.md`).

## Kết quả (2026-10-20)
- Thanh nổi bo radius thật 2rem (32px) / lg 2.25rem (36px) thay `rounded-pill`; header + thanh cùng `--duration-slow` (450ms) + `--ease-standard` (cubic-bezier(0.2,0,0,1)); giữ motion-reduce, chiều cao header, khung 84rem.
- Task `tasks/feature-header-scroll-transition-smooth/phase-1-task-01.md`; review NORMAL PASS r1; spec 1.22.0 (không bump) / scope v28; design-spec §2.1 cập nhật.
