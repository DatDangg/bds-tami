# Spec Update — 2026-10-20 detail-subnav-clear-active-past-sections (thanh mục con chi tiết: cuộn qua mục cuối thì bỏ active)

**spec_version:** 1.24.0 → 1.24.1 (PATCH — làm rõ hành vi "mục đang xem" của thanh mục con trên 2 trang chi tiết công khai; không đổi schema, API, quyền, URL, i18n, nguồn lead)

**BRD:** không đổi.

**Trigger:** bug-fix (Change Request **BL-029**, BUG UI client-side — follow-up BL-027 / BL-028). Change doc `spec/changes/2026-10-20-detail-subnav-clear-active-past-sections.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/bug-detail-subnav-clear-active-past-sections/phase-1-task-01.md`. Review: `.context/review-reports/bug-detail-subnav-clear-active-past-sections-phase-1-task-01-round-1-review.md` (NORMAL, PASS r1).

**Root cause:** `src/components/detail/DetailSubNav.tsx` — callback IntersectionObserver chỉ `setActiveId(current)` khi tập mục đang hiện có phần tử; cuộn qua hết mục cuối (tập rỗng) không nhánh nào đổi `activeId` → mục cuối ("Thư viện") giữ nền vàng + `aria-current`.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | BUG (UI, component chung) | close-out BL-029 (commit chứa file này) | `DetailSubNav.tsx`: tách hằng `OBSERVER_TOP_PX = 88` (dựng `OBSERVER_MARGIN` từ đó); callback: đang khoá cuộn → bỏ qua; có mục trong dải → active mục đầu theo thứ tự trang (như cũ); dải rỗng và đáy mục cuối ≤ 88px (đã cuộn qua) → `setActiveId("")`; còn lại giữ nguyên. Test mới `src/components/detail/DetailSubNav.test.tsx` (6 case, fake IntersectionObserver + stub `getBoundingClientRect`) | NORMAL PASS r1 |

## Requirements (SPECIFICATIONS.md)

- **F2 — Bố cục chi tiết (LÀM RÕ):** mục đang xem của thanh mục con — cuộn qua hết mục cuối (không mục nào trong dải quan sát và mục cuối nằm hẳn phía trên dải) → **không nút nào active / `aria-current`**; cuộn ngược vào một mục → mục đó active lại; ở đầu trang / phía trên mục đầu → mục đầu giữ active; vừa bấm nút (khoá cuộn ~1s) không bị bỏ active. F3 dùng cùng component (`DetailSubNav`).
- Design as-built: `.context/design-spec.md` S03 mục 3 (S07 "như S03") reconcile cùng close-out.

## Schema / Migration / API

Không. Migration: none.

## Hành vi bị thay thế

| Trước (BL-027 / BL-028) | Sau (BL-029) |
|---|---|
| Cuộn qua mục cuối (xuống Dự án liên quan / CTA "Đăng ký tham quan" / footer) → mục cuối vẫn nền vàng + `aria-current` | Không nút nào active, không `aria-current`; cuộn ngược vào mục → active lại |

## Ảnh hưởng test

- Direct: `/du-an/<slug>`, `/en/projects/<slug>`, `/cho-thue/<slug>`, `/en/for-rent/<slug>` — cuộn qua hết mục cuối → 0 nút `aria-current` / nền `--color-primary`; cuộn ngược → active lại; đầu trang → mục đầu active; bấm nút mục con → nút đó active suốt lúc cuộn mượt.
- Regression: neo cuộn + `scroll-margin` (BL-027), cuộn ngang < lg + mục đang xem tự vào giữa (không lỗi khi không có mục active), bề rộng thanh (BL-028), header ẩn khi cuộn (BL-027).

## Residual risk

- Chỉ kiểm jsdom + fake observer; chưa xem trình duyệt thật. Ngưỡng 88px xấp xỉ ≥ lg (< lg lệch ~8px, chỉ lệch thời điểm bỏ active).
- Mục cuối ngắn hơn dải quan sát có thể thoáng không active ở khe cuối trang (chấp nhận theo thiết kế D1).
- Hết khoá cuộn 1s không đánh giá lại: cuộn qua mục cuối trong lúc khoá thì active còn tới event observer kế tiếp (hành vi có từ trước, ngoài scope).
