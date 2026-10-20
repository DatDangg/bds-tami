---
id: detail-subnav-clear-active-past-sections
type: bug
status: done
created: 2026-10-20
---

# Thanh mục con chi tiết: cuộn qua mục cuối thì bỏ trạng thái active

## Yêu cầu
User 2026-10-20 (ảnh chụp trang chi tiết dự án): cuộn quá mục "Thư viện" (xuống khối dự án liên quan / "Đăng ký tham quan" / footer) mà nút "Thư viện" vẫn nền vàng như đang ở mục đó. Khi không còn mục nào của thanh mục con trong vùng xem → không nút nào active.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: chi tiết dự án `/du-an/<slug>` (và chi tiết cho thuê, cùng `DetailSubNav`), khách.
- Bước tái hiện: mở chi tiết dự án → cuộn xuống qua hết mục Thư viện tới khối dự án liên quan / CTA Đăng ký tham quan.
- Expected: không nút mục con nào nền vàng / `aria-current`.
- Actual: "Thư viện" vẫn active.
- Root cause (đã đọc code): `src/components/detail/DetailSubNav.tsx:44-45` — callback IntersectionObserver chỉ `setActiveId(current)` khi có mục đang hiện; khi tập `visible` rỗng thì giữ `activeId` cũ.

## Acceptance (bắt buộc)
- [ ] Cuộn qua hết mục cuối (không mục nào giao vùng xem theo OBSERVER_MARGIN) → không nút nào active, không `aria-current`.
- [ ] Cuộn ngược lên vào lại một mục → nút đó active lại như cũ.
- [ ] Đầu trang / trước khi observer chạy giữ hành vi hiện tại (mục đầu active); bấm nút mục con (scrollLocked) không bị nhấp nháy.
- [ ] Áp dụng cả chi tiết dự án lẫn cho thuê; có test.

## Ghi chú
Follow-up BL-027/BL-028. Cân nhắc trường hợp ở trên mục đầu (chưa tới) — giữ mục đầu active hay bỏ: agent đề xuất, mặc định chỉ bỏ khi đã cuộn QUA mục cuối.
