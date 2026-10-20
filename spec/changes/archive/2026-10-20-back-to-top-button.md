---
id: back-to-top-button
type: feature
status: done
completed: 2026-10-20
created: 2026-10-20
---

# Nút "Lên đầu trang"

## Yêu cầu
Thêm nút nổi "Lên đầu trang" trên site công khai. Hiện chưa có (đã grep `src/`).

## Acceptance (bắt buộc)
- [x] Nút tròn nổi góc phải dưới, nằm **chung cụm** với `FloatingContact` (`src/components/layout/FloatingContact.tsx`) — không chồng lên nút liên hệ, CTA dính đáy (`--sticky-cta-height`) hay cookie banner.
- [x] Chỉ hiện khi đã cuộn quá ~1 màn hình; ẩn khi ở gần đầu trang (ẩn/hiện có fade, tắt khi `prefers-reduced-motion`).
- [x] Bấm → cuộn mượt về đầu trang (`behavior: "instant"` nếu reduced-motion); focus chuyển về đầu trang/skip target hợp lý.
- [x] A11y: `<button>` có `aria-label` ("Lên đầu trang" / bản EN theo locale), vùng chạm ≥ 44px, focus-visible ring theo token.
- [x] Style theo token thương hiệu (nền/viền vàng hoặc trắng đồng bộ nút nổi hiện có), ẩn khi in (`print:hidden`).
- [x] Áp dụng mọi trang công khai (frontend layout), **không** áp dụng admin.

## Ghi chú
- Nguồn: user 2026-10-20 ("thêm cái lên đầu trang đi").
- Giả định vị trí/ngưỡng hiện ở trên; user chưa nói khác.
- Lưu ý: `FloatingContact` trả `null` khi không có hotline/Zalo/fanpage → nút lên đầu trang vẫn phải hiện độc lập trong trường hợp đó.

## Kết quả
- Done 2026-10-20: task `tasks/feature-back-to-top-button/phase-1-task-01.md`, reviewer NORMAL PASS r1 (`.context/review-reports/feature-back-to-top-button-phase-1-task-01-round-1-review.md`), spec **1.30.0 / scope v37** (`spec/updates/2026-10-20-back-to-top-button.md`).
