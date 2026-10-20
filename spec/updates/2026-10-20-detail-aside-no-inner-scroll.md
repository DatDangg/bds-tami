# Spec Update — 2026-10-20 detail-aside-no-inner-scroll (thẻ tư vấn chi tiết không thanh cuộn riêng + khoảng ảnh → thanh mục con cho thuê)

**spec_version:** 1.25.0 → 1.26.0 (MINOR — đổi yêu cầu trình bày khung chi tiết chung; không đổi schema, API, quyền, URL, i18n, nguồn lead, JSON-LD)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-031**, MODIFY UI). Change doc `spec/changes/2026-10-20-detail-aside-no-inner-scroll.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-detail-aside-no-inner-scroll/phase-1-task-01.md`. Review: `.context/review-reports/feature-detail-aside-no-inner-scroll-phase-1-task-01-round-1-review.md` (NORMAL, PASS, 4 MINOR) + `...-round-2-review.md` (FAST, PASS).

**Quyết định:** D1 bỏ `lg:max-h-[…]` + `lg:overflow-y-auto` khỏi `DETAIL_ASIDE_CARD_CLASS`; D2 `top = min(calc(--sticky-top + 4.5rem), calc(100dvh − --detail-aside-h − 1rem))` — CSS không biết chiều cao chính thẻ sticky nên cần 1 biến CSS do `DetailAsideFit` (client, vỏ `<aside>`, ResizeObserver đo thẻ con đầu) ghi; DOM thẻ vẫn server render; D3 chi tiết cho thuê: khối thư viện ảnh `pb-8` (32px, token spacing); tin đã thuê có tin tương tự → bọc khối tin tương tự `div.pb-8`. Phần chuyển breadcrumb: user bỏ — KHÔNG làm.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, khung chi tiết dùng chung) | close-out BL-031 (commit chứa file này) | `src/components/detail/DetailLayout.tsx` (class thẻ phụ + dùng `DetailAsideFit`), `src/components/detail/DetailAsideFit.tsx` (mới), `src/components/rentals/RentalDetail.tsx` (`pb-8` ảnh / tin tương tự). Test `src/components/detail/DetailLayout.test.tsx`, `src/components/rentals/rental-detail.test.tsx`, `src/components/projects/project-detail.test.tsx`. Doc: `SPECIFICATIONS.md`, `.context/design-spec.md` S03 + S07 | NORMAL PASS r1 → FAST PASS r2 |

## Requirements (SPECIFICATIONS.md)

- **Overview — Giao diện, khung chi tiết chung (SỬA):** thẻ tư vấn / liên hệ cột phải ≥ lg **không có thanh cuộn riêng**; dính `top = min(--sticky-top + 4.5rem, 100dvh − chiều cao thẻ − 1rem)`; thẻ vừa viewport dính dưới thanh mục con (như BL-027), thẻ cao hơn cuộn theo trang tới khi đáy thẻ chạm đáy viewport − 1rem rồi dính (không cắt, nút gửi tới được); không JS → dính trên như cũ; < lg không đổi.
- **F2 chi tiết dự án — thẻ "Tư vấn 1:1" (SỬA):** bỏ "cao tối đa phần viewport còn lại, cuộn trong thẻ" → mô tả mới như trên.
- **F3 chi tiết cho thuê (SỬA):** khoảng 32px (`pb-8`) giữa thư viện ảnh và thanh mục con; tin đã thuê có tin tương tự: khối tin tương tự cũng `pb-8` trước thanh mục con; thẻ liên hệ không thanh cuộn riêng. Breadcrumb giữ nguyên vị trí.
- Design as-built: `.context/design-spec.md` S03 (bố cục thẻ Tư vấn) + S07 mục 3 reconcile cùng task.

## Schema / Migration / API

Không. Migration: none.

## Hành vi bị thay thế

| Trước | Sau (BL-031) |
|---|---|
| Thẻ phụ ≥ lg `max-height: 100dvh − --sticky-top − 5.5rem` + `overflow-y: auto` → thẻ cho thuê (giá + liên hệ + form) có thanh cuộn dọc riêng | Không `max-height`, không cuộn trong; thẻ cao hơn viewport dính theo đáy (đáy viewport − 1rem) |
| Chi tiết cho thuê: thanh mục con (chưa dính) sát mép dưới thư viện ảnh | Khoảng 32px (`pb-8`); tin đã thuê có tin tương tự cũng vậy |

## Số đo (dev :3000, 1440×900)

- Cho thuê (thẻ 842px): computed top 41.9px, sticky, `overflow-y: visible`, `max-height: none`; khi dính card 42→884, nút gửi bottom 859 < 900. Khoảng ảnh → thanh mục con 32px.
- Dự án (thẻ 706px): top 88px (= 16 + 4.5rem), dính dưới thanh mục con như BL-027.
- vitest detail/projects/rentals 13 file / 166 test PASS; typecheck PASS; lint 0 error.

## Ảnh hưởng test

- Direct: `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]` ≥ lg — thẻ tư vấn / liên hệ không thanh cuộn, vừa viewport dính dưới thanh mục con, cao hơn thì nút gửi tới được bằng cuộn trang; cho thuê khoảng 32px ảnh → thanh mục con (kể cả tin đã thuê có tin tương tự).
- Dependents: `DetailLayout` dùng chung 2 trang chi tiết; `DetailAsideFit` khi đổi kích thước cửa sổ / nội dung thẻ đổi cao (lỗi form, sale khoá).
- Regression: thanh mục con dính + neo `scroll-margin`, active mục (BL-029); lead form chỉ một bản (`#lead-form`); sticky CTA < lg (`ProjectStickyCta` / thanh đáy cho thuê); header ẩn khi cuộn trên trang chi tiết (BL-027); breadcrumb vị trí không đổi.
- Residual: thẻ cao hơn (viewport − thanh mục con) khi dính theo đáy phần đầu thẻ (~28px, chủ yếu padding) nằm dưới thanh mục con (MINOR-2, chấp nhận); không JS → thẻ cao chỉ lộ đáy khi cuộn hết lưới; tin đã thuê chưa đo trực quan (test DOM có); 768/1280 + `/en` chưa đo riêng.
