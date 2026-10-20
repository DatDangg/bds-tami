# feature-detail-subnav-full-width · phase-1-task-01 — Thanh mục con trang chi tiết rộng bằng khung nội dung bên dưới (BL-028)

- Change doc: `spec/changes/2026-10-20-detail-subnav-full-width.md` (BACKLOG BL-028) — follow-up BL-027 (commit 046d891, ec762c3), khung header BL-025.
- Phụ thuộc: không (BL-027 đã done).
- Trạng thái: `in_progress` — user duyệt plan 2026-10-20 ("ok", giữ D1–D4 mặc định).

## Classification / Risk
- Type: **MODIFY** (UI; không đổi schema/API/quyền/dữ liệu/i18n)
- Risk: **LOW–MEDIUM** — sửa component chung `DetailSubNav` dùng ở 2 trang.
- Expected review level: **NORMAL** (component chung, nhưng chỉ đổi lớp bố cục; logic observer/neo không đổi).
- Blast radius: `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]` (thanh mục con, ở cả trạng thái chưa dính lẫn dính đỉnh).
- Doc impact: `.context/design-spec.md` S03 mục 3 (thanh mục con) + §2.1 dòng Sticky; `SPECIFICATIONS.md` "Giao diện khung chi tiết chung" (bề rộng thanh = khung `max-w-container`, thẳng mép thẻ nội dung + thẻ phụ) → spec-publisher bump minor ở close-out.

## Hiện trạng (đã đọc)
- `src/components/detail/DetailSubNav.tsx:83` — `nav`: `sticky top-(--sticky-top) mx-auto w-full max-w-container px-gutter` (khung 80rem + lề gutter = khung nội dung); `ul` (`:86`): `w-fit max-w-full` → viên thuốc ôm vừa nút ("cụt").
- Header nổi `src/components/layout/HeaderFrame.tsx:41-43`: header đệm `px-2` (< lg) / `lg:px-4`, thanh `max-w-[84rem]` căn giữa, bo `rounded-[2rem]` / `lg:rounded-[2.25rem]`.
- `DetailLayout.tsx:35` đặt `DetailSubNav` **ngoài** lưới 2 cột (đã trải qua cả cột thẻ tư vấn về vị trí — chỉ bề rộng là hẹp).

## Thiết kế (đề xuất mặc định — chờ user chốt)
- **D1 — khung = lưới nội dung (sửa theo user 2026-10-20 "phải thẳng nhau"):** `nav` giữ `mx-auto max-w-container px-gutter` (cùng khung lưới thẻ nội dung + thẻ phụ của DetailLayout); `ul` đổi `w-fit max-w-full` → `w-full`. Bản 84rem (= header nổi) bị user loại vì dài hơn nội dung bên dưới.
- **D2 — vị trí:** giữ thanh **trên/ngoài lưới 2 cột**, trải qua cả cột thẻ tư vấn — mép phải trùng mép thẻ tư vấn. Không đổi `DetailLayout`.
- **D3 — căn nút:** nút **căn trái** trong thanh (giữ thứ tự đọc, giống tham chiếu; dàn đều sẽ giãn rỗng khi ít mục và xấu ở trang cho thuê 2–3 mục). Tràn → cuộn ngang trong thanh như hiện tại (logic tự cuộn mục đang xem vào giữa giữ nguyên).
- **D4 — giữ nguyên:** kiểu nút (active `bg-primary text-primary-foreground`), bo `rounded-pill`, viền + `shadow-md`, chiều cao thanh 54px (nên hằng `4.5rem` của thẻ dính / `scroll-mt` / `OBSERVER_MARGIN` không đổi), `pointer-events` (nav trong suốt chỉ còn lề 8/16px).

## Files (dự kiến)
- `src/components/detail/DetailSubNav.tsx` (lớp `nav` + `ul`, cập nhật JSDoc)
- Test: `src/components/detail/DetailLayout.test.tsx` (hoặc `src/components/projects/project-detail.test.tsx`) — assert nav `max-w-container` + `px-gutter`, ul `w-full`, không `w-fit`

## Acceptance
- [ ] `/du-an/[slug]` và `/cho-thue/[slug]` (vi + en): thanh mục con rộng bằng lưới nội dung (mép trái = thẻ trắng, mép phải = thẻ tư vấn; < lg = thẻ nội dung), cả lúc chưa dính lẫn dính đỉnh
- [ ] Thanh trải qua cả cột thẻ tư vấn/liên hệ (≥ lg); nút căn trái
- [ ] Nút giữ kiểu hiện tại (active nền vàng chữ đen); nhiều mục vượt bề rộng → cuộn ngang trong thanh, trang không tràn ngang
- [ ] Neo cuộn tới section + highlight mục hiện tại đúng như BL-027 (thẻ dính / `scroll-mt` không bị che)
- [ ] 375 / 768 / 1280px không tràn ngang
- [ ] `pnpm vitest run src/components/detail src/components/projects src/components/rentals`, `pnpm lint`, `pnpm typecheck` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Attempt 1 (84rem = header nổi) bị user loại khi xem: "sao lại dài hơn cái content ở dưới, phải thẳng nhau chứ".
- Attempt 2: `DetailSubNav.tsx` `nav` = `mx-auto w-full max-w-container px-gutter` (như trước BL-028), `ul` `w-fit max-w-full` → `w-full`; JSDoc ghi BL-028. Hằng 4.5rem / OBSERVER_MARGIN / logic cuộn không đổi.
- Test `src/components/projects/project-detail.test.tsx`: nav `max-w-container` + `px-gutter`; ul `w-full`, không `w-fit`.
- `pnpm vitest run src/components/detail src/components/projects src/components/rentals` 12 file / 156 PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ).
- Đo trên dev server :3000: 1440px `/cho-thue/can-cho-thue-san-van-phong-...-bac-tu` thanh 105→1321px = thẻ trắng 105 → thẻ liên hệ 1321; 1440px `/du-an/the-crown-dai-hoang-son-bac-ninh` thanh 105→1321 = thẻ 105 → aside 1321; 375px dự án thanh 16→359 = thẻ 16→359; scrollWidth = viewport (không tràn).

## Residual risk
- 768px chưa kiểm bằng mắt (cùng lớp khung với lưới nên mép vẫn trùng).
- Bản /en chưa đo riêng (cùng component).
