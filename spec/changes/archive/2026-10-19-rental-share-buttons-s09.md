---
id: rental-share-buttons-s09
type: feature
status: done
created: 2026-10-19
backlog: BL-007
---

# Trang Đăng tin BĐS (L8-T04): nút chia sẻ theo design-spec S09

## Yêu cầu
MODIFY — nợ thiết kế L8-T04 (D4 spec-validation layer 8), làm trước M3. Hiện nút chia sẻ ở cuối bài, dùng `ShareButtons` của tin tức. Theo S09: đặt đầu bài; ≤ sm dùng 1 nút "Chia sẻ / Share" Web Share API (fallback menu); ≥ xl nút chia sẻ dính cột trái.

## Acceptance (bắt buộc)
- [x] Nút chia sẻ ở đầu bài (sau tiêu đề/meta), bỏ bản ở cuối bài
- [x] ≤ sm: 1 nút "Chia sẻ / Share" gọi `navigator.share` khi có; không có → menu (Facebook, Zalo, sao chép link)
- [x] ≥ xl: cụm nút dính cột trái khi cuộn; sm–xl hàng ngang
- [x] Không vỡ trang tin tức đang dùng `ShareButtons`; i18n VI/EN; a11y label
- [x] Test component; `pnpm test`/lint/typecheck/build PASS

## Ghi chú
design-spec S09 (dòng ~445-459). Xác minh đúng route trang L8-T04 khi phân tích.

## Kết quả (2026-10-19)
- Task: `tasks/feature-rental-share-buttons-s09/phase-1-task-01.md` · NORMAL PASS round 2 `.context/review-reports/feature-rental-share-buttons-s09-phase-1-task-01-round-2-review.md`
- Spec 1.6.0 / scope v6. Phạm vi: chỉ S09 (`PostDetail`); tin tức S11 + tuyển dụng giữ `ShareButtons`.
- Residual: chưa soi trình duyệt thật (không có bài đã xuất bản ở dev) — kiểm trên staging.
