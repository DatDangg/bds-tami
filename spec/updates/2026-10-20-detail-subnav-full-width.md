# Spec Update — 2026-10-20 detail-subnav-full-width (thanh mục con trang chi tiết rộng bằng khung nội dung)

**spec_version:** 1.23.0 → 1.24.0 (MINOR — đổi bề rộng thanh mục con trên 2 trang chi tiết công khai; không đổi schema, API, quyền, URL, i18n, nguồn lead)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-028**, MODIFY UI — follow-up BL-027). Change doc `spec/changes/2026-10-20-detail-subnav-full-width.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-detail-subnav-full-width/phase-1-task-01.md`. Review: `.context/review-reports/feature-detail-subnav-full-width-phase-1-task-01-round-1-review.md` (FAST, PASS r1).

**Quyết định user 2026-10-20:** yêu cầu ban đầu "dài ngang bằng header" (bản 84rem = header nổi) bị user loại khi xem: "sao lại dài hơn cái content ở dưới, phải thẳng nhau chứ" → thanh rộng **bằng khung nội dung bên dưới**. D2 giữ thanh trên/ngoài lưới 2 cột; D3 nút căn trái; D4 kiểu nút / chiều cao / neo giữ nguyên.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, component chung) | close-out BL-028 (commit chứa file này) | `src/components/detail/DetailSubNav.tsx`: `nav` giữ `mx-auto w-full max-w-container px-gutter` (= khung lưới `DetailLayout`), `ul` `w-fit max-w-full` → `w-full`; JSDoc BL-028. Hằng 4.5rem / `OBSERVER_MARGIN` / logic cuộn không đổi. Test `src/components/projects/project-detail.test.tsx`: nav `max-w-container` + `px-gutter`, ul `w-full`, không `w-fit` | FAST PASS r1 |

## Requirements (SPECIFICATIONS.md)

- **Overview — Giao diện (SỬA):** thanh mục con viên thuốc trắng của khung chi tiết chung **rộng bằng khung nội dung bên dưới** (`max-w-container` + `px-gutter`): mép trái thẳng mép thẻ trắng nội dung, mép phải thẳng mép thẻ tư vấn / liên hệ (≥ lg); < lg thẳng mép thẻ nội dung; nút căn trái, tràn thì cuộn ngang trong thanh.
- **F2 — Bố cục chi tiết (SỬA):** thanh mục con rộng bằng khung nội dung, trải qua cả cột thẻ "Tư vấn 1:1" ≥ lg, nút căn trái. F3 dùng cùng khung (theo "như S03").
- Design as-built: `.context/design-spec.md` §2.1 dòng Sticky + S03 mục 3 reconcile cùng close-out.

## Schema / Migration / API

Không. Migration: none.

## Hành vi bị thay thế

| Trước (BL-027) | Sau (BL-028) |
|---|---|
| Viên thuốc thanh mục con `w-fit` — ôm vừa các nút ("trông cụt") | Viên thuốc `w-full` trong khung `max-w-container` + `px-gutter` — mép thẳng thẻ nội dung (trái) và thẻ tư vấn/liên hệ (phải) |

## Ảnh hưởng test

- Direct: thanh mục con `/du-an/<slug>`, `/en/projects/<slug>`, `/cho-thue/<slug>`, `/en/for-rent/<slug>` — mép trái/phải trùng thẻ nội dung / thẻ tư vấn, cả lúc chưa dính và dính đỉnh; 375 / 768 / 1280 / 1440 không tràn ngang.
- Regression: neo cuộn + highlight mục hiện tại (BL-027), cuộn ngang khi nhiều mục, kiểu nút active.
