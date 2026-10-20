# bug-detail-subnav-clear-active-past-sections · phase-1-task-01 — Thanh mục con chi tiết: cuộn qua mục cuối thì bỏ active (BL-029)

- Change doc: `spec/changes/2026-10-20-detail-subnav-clear-active-past-sections.md` (BACKLOG BL-029) — follow-up BL-027 / BL-028.
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer NORMAL PASS r1, spec 1.24.1 / scope v31 — user duyệt 2026-10-20 ("làm 29 30 đi", auto proceed).

## Classification / Risk
- Type: **BUG** (UI client-side; không đổi schema/API/quyền/dữ liệu/i18n)
- Risk: **LOW–MEDIUM** — component chung `DetailSubNav` (2 trang).
- Expected review level: **NORMAL**.
- Blast radius: `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]` — chỉ trạng thái active của thanh mục con.
- Doc impact: `SPECIFICATIONS.md` / `.context/design-spec.md` S03 mục 3 (hành vi mục đang xem: cuộn qua mục cuối → không mục nào active) → spec-publisher.

## Root cause (đã chứng minh bằng đọc code)
- `src/components/detail/DetailSubNav.tsx:39-46` — callback IntersectionObserver chỉ `setActiveId(current)` khi tập `visible` có mục; khi đã cuộn QUA mục cuối (tập rỗng) không có nhánh nào đổi `activeId` → giữ id cũ ("Thư viện") → nền vàng + `aria-current="location"`.

## Thiết kế fix
- Tách hằng `OBSERVER_TOP_PX = 88`, dựng `OBSERVER_MARGIN` từ nó (không lặp số).
- Trong callback: có `current` → như cũ. Không có `current` (tập rỗng) và không `scrollLocked` → lấy mục cuối (`document.getElementById(ids[ids.length-1])`); nếu `getBoundingClientRect().bottom <= OBSERVER_TOP_PX` (đã nằm hẳn phía trên dải quan sát = đã cuộn qua) → `setActiveId("")`. Ngược lại (ở trên mục đầu, hoặc khe giữa mục) → giữ nguyên (mục đầu active khi ở đầu trang — D1 mặc định của change doc).
- Cuộn ngược vào một mục → observer báo isIntersecting → active lại (nhánh cũ).
- Effect auto-scroll ngang (`:58-64`): `activeId=""` → không có `[aria-current]` → `link` null → return sớm; không cần đổi.
- `handleClick` không đổi (scrollLocked chặn cả nhánh xoá).

## Files
- `src/components/detail/DetailSubNav.tsx`
- Test: `src/components/detail/DetailSubNav.test.tsx` (mới) — fake IntersectionObserver + stub getBoundingClientRect.

## Acceptance
- [ ] Cuộn qua hết mục cuối (tập visible rỗng + mục cuối phía trên dải) → không nút nào `aria-current` / `bg-primary`.
- [ ] Cuộn ngược vào lại một mục → nút đó active lại.
- [ ] Ban đầu / ở trên mục đầu (visible rỗng, mục cuối còn bên dưới) → mục đầu giữ active.
- [ ] Trong lúc scrollLocked (vừa bấm nút) → không bị xoá active.
- [ ] `pnpm vitest run src/components/detail src/components/projects src/components/rentals`, `pnpm lint`, `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Trước fix: `pnpm vitest run src/components/detail/DetailSubNav.test.tsx` → case "cuộn qua hết mục cuối ... không mục nào active" FAIL (còn `["Thư viện"]` aria-current, kỳ vọng `[]`); 5 case còn lại pass.
- Sau fix: 6/6 PASS (gồm cuộn ngược active lại, giữ active khi mục cuối còn bên dưới, không xoá khi scrollLocked).

## Verification summary
- `pnpm vitest run src/components/detail src/components/projects src/components/rentals`: 13 files, 162 tests PASS. `pnpm typecheck`: PASS. `pnpm lint`: 0 error, 2 warning có sẵn ở tools/task-dashboard/server.mjs (ngoài scope).
- Đổi: `DetailSubNav.tsx` (hằng OBSERVER_TOP_PX, nhánh tập rỗng + !scrollLocked + mục cuối bottom <= 88 → setActiveId("")), test mới `DetailSubNav.test.tsx`. Effect auto-scroll ngang chịu được activeId rỗng (không có [aria-current] → return sớm).

## Residual risk
- Chỉ kiểm bằng jsdom + fake observer, chưa xem trên trình duyệt thật. Mục cuối ngắn hơn dải quan sát có thể thoáng không active ở khe cuối trang (chấp nhận theo thiết kế D1). Chưa spec-publish (doc impact S03 mục 3).
