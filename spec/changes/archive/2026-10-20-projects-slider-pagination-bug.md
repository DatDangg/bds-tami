---
id: projects-slider-pagination-bug
type: bug
status: done
created: 2026-10-20
---

# Slider "Dự án nổi bật" trang chủ: mũi tên trước/sau + chấm phân trang chuyển sai

## Bối cảnh / tái hiện (bug)
- Màn/route/role: trang chủ `/vi`, khối Dự án nổi bật, khách công khai, desktop (≥ md, thấy mũi tên).
- Bước tái hiện: bấm mũi tên ‹ › hoặc chấm phân trang (6 chấm).
- Expected: mỗi lần bấm chuyển đúng 1 bước/đúng slide, chấm active khớp vị trí; tới cuối không nhảy lung tung.
- Actual (user xác nhận 2026-10-20): bấm › thì nhảy cóc mấy thẻ; chấm active không khớp thẻ đang hiện.

## Giả thuyết root cause (chưa xác minh — Iron Law: xác minh trước khi sửa)
`src/components/home/use-snap-slider.tsx`: `current` lấy từ IntersectionObserver `threshold 0.6` → desktop hiện 3–4 thẻ cùng lúc, `setCurrent` lấy entry giao cắt CUỐI trong batch (không phải thẻ trái nhất) → `scrollToSlide(current ± 1)` nhảy cóc; các slide cuối không cuộn được tới `inline: start` (hết đường cuộn) nên chấm cuối không bao giờ active / bấm "sau" kẹt rồi vòng `% count` về đầu.

## Acceptance (bắt buộc)
- [ ] Repro trước khi sửa (đo `current` khi bấm › liên tiếp ở 1280px).
- [ ] Mũi tên chuyển đúng 1 bước; chấm active khớp thẻ đầu đang hiện; chấm chỉ còn số vị trí cuộn được thật (hoặc chấm cuối active khi cuộn hết).
- [ ] Hành vi ở cuối/đầu nhất quán (dừng hoặc vòng — chốt với user nếu cần).
- [ ] Không vỡ slider Ưu đãi (dùng chung hook) + mobile vuốt; test hook cập nhật.

## Ghi chú
- Nguồn: user 2026-10-20 (ảnh cụm ‹ ● • • • • • ›).
