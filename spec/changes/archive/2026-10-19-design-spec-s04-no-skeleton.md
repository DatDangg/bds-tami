---
id: design-spec-s04-no-skeleton
type: feature
status: done
created: 2026-10-19
backlog: BL-011
---

# Sửa intent design-spec §3.5 (S04): bỏ "skeleton khi tải lần đầu"

## Yêu cầu
MODIFY intent doc — user ĐÃ DUYỆT 2026-10-19. design-spec §3.5 (S04) còn câu "Loading lần đầu: skeleton 6 thẻ" trong khi thực tế cấm `loading.tsx` cấp route (gây soft-404, L9-T08). Thay bằng: "Đổi bộ lọc/trang/chip: giữ kết quả cũ, mờ 50% + `aria-busy`, link đang chờ mờ nhẹ (`useLinkStatus`); không skeleton cấp route" (L10-T04).

## Acceptance (bắt buộc)
- [x] `.context/design-spec.md` §3.5 (S04) thay đúng câu trên; S04 không còn yêu cầu skeleton cấp route
- [x] Các chỗ khác trong design-spec nhắc skeleton/`loading.tsx` cấp route → ghi gap (ngoài phạm vi user duyệt thì không tự sửa intent)
- [x] Code hiện tại khớp intent mới (ghi rõ nếu lệch)
- [x] spec-publisher ghi delta

## Ghi chú
Chỉ sửa doc intent đã được duyệt; không đổi code trừ khi phát hiện lệch.

## Kết quả (2026-10-19)
- design-spec §3.2, S02, S04, S08, S10 sửa (không skeleton cấp route, phản hồi chờ như S04); S03/S07 (chi tiết) ghi gap trong task file.
- Code đã khớp (L10-T04) — không builder. Spec 1.4.0 → 1.4.1 (PATCH), scopeVersion 4.
- Task: `tasks/feature-design-spec-s04-no-skeleton/phase-1-task-01.md` · Review NORMAL PASS round 1: `.context/review-reports/feature-design-spec-s04-no-skeleton-phase-1-task-01-round-1-review.md`
