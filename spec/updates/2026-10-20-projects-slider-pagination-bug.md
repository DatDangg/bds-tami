# Spec Update — 2026-10-20 projects-slider-pagination-bug (slider Dự án nổi bật: mũi tên / chấm chuyển sai)

**spec_version:** 1.31.0 → 1.31.1 (PATCH — làm rõ hành vi điều khiển slider đã có, sửa bug; không đổi schema, API, quyền, dữ liệu CMS, URL, i18n)

**BRD:** không đổi.

**Trigger:** bug-fix (Change Request **BL-038**, BUG). Change doc `spec/changes/2026-10-20-projects-slider-pagination-bug.md` (archive ở close-out → `spec/changes/archive/2026-10-20-projects-slider-pagination-bug.md`). Task `tasks/bug-projects-slider-pagination/phase-1-task-01.md`. Review: `.context/review-reports/bug-projects-slider-pagination-phase-1-task-01-round-1-review.md` (STRICT, PASS round 1).

**Root cause:** `src/components/home/use-snap-slider.tsx` lấy `current` từ IntersectionObserver `threshold 0.6`; desktop có ≥ 2 thẻ cùng hiện ≥ 60% → vòng `for` gọi `setCurrent` cho mọi entry, entry cuối (thẻ phải nhất) thắng → `current` lệch về phải, `scrollToSlide(current ± 1)` nhảy cóc 2 thẻ; số chấm = số thẻ dù ở 1280px 6 thẻ chỉ có 5 vị trí cuộn được (thẻ 5/6 không cuộn tới mép trái) → chấm 1/3/5 gần như không active.

**Quyết định:** D1 bỏ IntersectionObserver; đo offset thẻ (theo `getBoundingClientRect`, độc lập `scrollLeft`) + `max = scrollWidth − clientWidth`, tính `pageCount` = số vị trí cuộn được thật. D2 `current` = vị trí có `min(offset, max)` gần `scrollLeft` nhất; cuộn hết (`≥ max − 1`) → vị trí cuối. Cập nhật theo sự kiện `scroll` (passive, gộp rAF) + `ResizeObserver` đo lại. D3 `scrollToSlide` dùng `list.scrollTo({ left })`, đầu/cuối **vòng** (giữ hành vi cũ, không cần user chốt); chưa đo → fallback `scrollIntoView`. D4 `ProjectsSlider` render chấm theo `pageCount`, ẩn điều khiển khi ≤ 1 vị trí. `scrollByPage` (slider Ưu đãi, Cho thuê) không đổi; mobile vuốt + snap CSS giữ.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | BUG (hook slider dùng chung) | (commit close-out BL-038) | Sửa: `src/components/home/use-snap-slider.tsx`, `src/components/home/ProjectsSlider.tsx`. Test: `src/components/home/ProjectsSlider.test.tsx` (test repro BL-038 layout giả lập 1280px). Doc: `SPECIFICATIONS.md` (F1 trang chủ — Dự án nổi bật), `.context/design-spec.md` S01 khối 3 "Điều khiển" | `.context/review-reports/bug-projects-slider-pagination-phase-1-task-01-round-1-review.md` (STRICT PASS) |

## Requirements (SPECIFICATIONS.md)

- **Trang chủ — Dự án nổi bật (LÀM RÕ):** chấm = số vị trí cuộn được thật; chấm active = vị trí gần `scrollLeft` nhất, cuộn hết → chấm cuối; mũi tên đi đúng 1 vị trí, đầu/cuối vòng; chỉ hiện điều khiển khi > 1 vị trí (BL-038).
- Design as-built: `.context/design-spec.md` S01 khối 3 "Điều khiển".

## Schema / Migration / API

Không. Migration: none. Không đổi i18n key (nhãn chấm `goTo` giữ).

## Hành vi bị thay thế

| Trước | Sau (BL-038) |
|---|---|
| Chấm = số thẻ (1280px, 6 dự án → 6 chấm) | Chấm = số vị trí cuộn được (1280px, 6 dự án → 5 chấm) |
| Chấm active = thẻ phải nhất đang hiện ≥ 60% (lệch) | Chấm active = vị trí gần `scrollLeft` nhất (thẻ đầu đang hiện); cuộn hết → chấm cuối |
| Bấm › nhảy cóc 2 thẻ (1→3→5→đầu) | Bấm › đi đúng 1 vị trí; ở cuối vòng về đầu, ‹ ở đầu vòng về cuối |
| Bấm chấm tới thẻ không cuộn tới mép trái → kẹt | Bấm chấm cuộn tới `min(offset, max)` |

## Số đo / verify

- Repro trước fix: test `ProjectsSlider > BL-038` FAIL (6 chấm, mong 5). Sau fix PASS (scroll 0 → chấm 1; › → `left 488`; scroll 1702 → chấm 5; › cuối → `left 0`; ‹ đầu → `left 1702`; chấm 3 → `left 976`).
- Verify (lệnh từ `.context/project-config.md`, reviewer STRICT round 1): `pnpm vitest run src/components/home` 82/82 PASS, `pnpm typecheck` PASS, `pnpm lint` 0 error.
- Chưa kiểm trên trình duyệt thật (390 / 1280).

## Ảnh hưởng test

- Direct: slider Dự án nổi bật trang chủ ≥ md — mũi tên ‹ › đi đúng 1 vị trí, chấm đúng số vị trí cuộn được, chấm active khớp thẻ đầu đang hiện, vòng ở đầu/cuối.
- Dependents: trang chủ `/` và `/en` — slider Ưu đãi nổi bật + tab Cho thuê (dùng chung `useSnapSlider`, chỉ `scrollByPage`).
- Regression: vuốt mobile (390) + snap giữ; slider Ưu đãi / Cho thuê không đổi; hover tiêu đề thẻ (BL-034) giữ.
- Residual: chưa kiểm trực quan trình duyệt thật — smooth scroll + snap khi bấm › nhanh liên tiếp, `scrollLeft` lẻ pixel khi zoom (dung sai 1px); risk medium (hook dùng chung).
