# Spec Update — 2026-10-20 detail-pages-unified-layout (chi tiết dự án + chi tiết cho thuê chung một bố cục, header ẩn khi cuộn)

**spec_version:** 1.22.0 → 1.23.0 (MINOR — đổi bố cục 2 trang chi tiết công khai + hành vi header trên 2 trang đó; không đổi schema, API, quyền, URL, nguồn lead, JSON-LD, noindex)

**BRD:** không đổi (FR-PUB-03, FR-PUB-05 giữ nguyên phạm vi; chỉ bố cục/hình thức).

**Trigger:** feature-update (Change Request **BL-027**, MODIFY). Change doc `spec/changes/2026-10-20-detail-pages-unified-layout.md` (archive ở close-out → `spec/changes/archive/`). Task `tasks/feature-detail-pages-unified-layout/phase-1-task-01.md`, `phase-1-task-02.md`. Review: T01 `.context/review-reports/feature-detail-pages-unified-layout-phase-1-task-01-round-{1,2,3}-review.md` (STRICT, PASS r3) · T02 `...-phase-1-task-02-round-{1,2}-review.md` (FAST, PASS r2) · phase `...-phase-1-spec-validation.md` (COMPLETE / PASS).

> Ngoại lệ có chủ đích cho quy tắc header BL-025/026 ("header sticky mọi trang, cuộn thành thanh nổi") — chỉ áp dụng trên `/du-an/[slug]` và `/cho-thue/[slug]` (+ `/en`). Các trang khác giữ nguyên.

**Quyết định user 2026-10-20 (duyệt phase plan):** (1) mục con chi tiết cho thuê = Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý; (2) cuộn lên **không** đưa header về — chỉ hiện lại ở đầu trang hoặc khi focus bàn phím (Tab) vào header; (3) thẻ liên hệ cho thuê < lg nằm **sau** thẻ nội dung; (4) thẻ trắng bo ~28px. Rủi ro chấp nhận: trước khi hydrate, header đầy đủ có thể che thanh mục con.

## Đã làm

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P1-T01 | MODIFY (UI, component chung) | `046d891` | Khung chi tiết dùng chung `src/components/detail/` (`DetailLayout`, `DetailSubNav` — đổi tên từ `ProjectSubNav`, `DetailSection` — từ `projects/`); `globals.css`: biến `--sticky-top` (`:root` = `--header-offset`; trang có `[data-detail-page]` 0.5rem / ≥ lg 1rem), header `translateY(-100%)` khi `[data-scrolled]:not(:has(:focus-visible))`, `--duration-slow` + `--ease-standard`, reduced-motion `transition: none`; `ProjectDetail` dựng bằng `DetailLayout`; các khối dự án đổi `scroll-mt` sang `--sticky-top`; `LeadFormSlot` mặc định `scroll-mt` theo `--sticky-top + 1rem`; test `DetailLayout.test.tsx`, `detail-header-css.test.ts`, `project-detail.test.tsx` | STRICT PASS r3 |
| P1-T02 | MODIFY (UI) | close-out BL-027 (commit chứa file này) | `RentalDetail` dựng bằng `DetailLayout` + `DetailSection`; `visibleRentalSections` + DOM id (`src/lib/rentals/rental-detail-sections.ts`); `RentalSpecs` (Tổng quan: h1 + mã tin/ngày + địa chỉ + thông số + Chi tiết, tiêu đề `text-h2`), `RentalTerms` (thu gọn khi đã thuê, `scroll-mt` theo `--sticky-top`), `SaleContactBox` thẻ trắng bo 20px + `shadow-md`, dính theo `--sticky-top`, `#lead-form` `scroll-mt` `--sticky-top + 4.5rem`; i18n `page.rentalDetail.subNav.*` + `subNavLabel` (vi/en); test `rental-detail.test.tsx`, `rental-detail-sections.test.ts` | FAST PASS r2 |

## Requirements (SPECIFICATIONS.md)

- **Overview — Khung trang (SỬA, thêm ngoại lệ):** trên chi tiết dự án / chi tiết cho thuê, đầu trang header phẳng như BL-025; **cuộn xuống → header trượt lên ẩn hẳn** (không thành thanh nổi), **không hiện lại khi cuộn lên** — chỉ hiện lại ở đầu trang hoặc khi focus bàn phím vào header; chỉ còn thanh mục con dính **sát đỉnh trang** (8px; ≥ lg 16px); `scroll-margin` neo bù theo vị trí đó. Trước hydrate header có thể che thanh mục con (rủi ro user chấp nhận). Header vẫn chiếm `--header-offset` trong luồng (không CLS).
- **Overview — Giao diện (SỬA):** chi tiết dự án và chi tiết cho thuê **dùng chung một bố cục**: nền trang `--color-primary-subtle`, thanh mục con viên thuốc trắng (mục đang xem nền `--color-primary` chữ `--color-primary-foreground`), các khối nội dung trong **một thẻ trắng bo ~28px** ngăn bằng đường kẻ, ≥ lg 2 cột với thẻ tư vấn / liên hệ dính cột phải tách riêng, < lg thẻ đó sau thẻ nội dung.
- **F2 (SỬA bố cục chi tiết):** thanh mục con dính sát đỉnh trang 8/16px (thay "dưới header nổi"), mục đang xem nền vàng chữ đen; < lg thẻ "Tư vấn 1:1" nằm sau thẻ nội dung (ngoài thẻ trắng). Thứ tự 11 mục, LeadForm duy nhất `source=project`, CTA dính đáy giữ nguyên.
- **F3 (THÊM "Bố cục chi tiết", design-spec S07):** breadcrumb → băng "Đã thuê" (nếu có) → thư viện ảnh (LCP; tin đã thuê: "Căn tương tự đang trống" ngay sau) → thanh mục con **Tổng quan · Điều khoản · Mô tả · Video · Vị trí · Pháp lý** (khối trống ẩn cả mục) → thẻ trắng chứa các khối → thẻ liên hệ (giá, sale/hotline, form `source=rental` duy nhất) dính ≥ lg, < lg sau thẻ nội dung (thanh dính đáy vẫn tới `#lead-form`) → Tin tương tự.
- Design as-built: `.context/design-spec.md` §1 / §2.1 / S03 / S07, `docs/DESIGN.md`, `docs/ARCHITECTURE.md` reconcile cùng close-out.

## Schema / Migration / API

Không. Migration: none. Không đổi route/page data, metadata, JSON-LD (`RealEstateListing`, breadcrumb chỉ khi chưa thuê), noindex tin đã thuê, nguồn lead.

## Hành vi bị thay thế

| Trước | Sau (BL-027) |
|---|---|
| Chi tiết dự án / cho thuê: cuộn xuống header thành thanh nổi bo tròn (BL-025/026) | Cuộn xuống header trượt ẩn hẳn; cuộn lên không hiện lại; hiện lại ở đầu trang hoặc khi Tab focus |
| Thanh mục con dự án dính dưới header nổi (`top: --header-offset`), mục đang xem nền đen chữ sáng | Dính sát đỉnh 8/16px (`top: --sticky-top`), mục đang xem nền `--color-primary` chữ `--color-primary-foreground` |
| Chi tiết dự án: các khối trên nền trang, phân tách đường kẻ | Nền vàng nhạt; các khối trong một thẻ trắng bo ~28px |
| Chi tiết cho thuê: thư viện → 2 cột 8/4, khung phải nền `--color-primary-subtle`, không thanh mục con; < lg khung giá + form sau Thông số chính | Cùng khung với dự án: thanh mục con 6 mục, thẻ trắng nội dung, thẻ liên hệ trắng dính ≥ lg; < lg thẻ liên hệ sau thẻ nội dung |
| `ProjectSubNav`, `ProjectSection` trong `components/projects/` | `DetailSubNav`, `DetailSection`, `DetailLayout` trong `components/detail/` |

## Ảnh hưởng

- Trực tiếp: `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]` (tin `published` và `rented`), mọi breakpoint.
- Phụ thuộc: `.site-header` (`HeaderFrame`, CSS toàn cục) — các trang khác phải giữ header nổi BL-025/026 (`data-detail-page` chỉ có trong `DetailLayout`); `--sticky-top` (= `--header-offset` ngoài trang chi tiết); `LeadFormSlot` (dùng ở nhiều trang — mặc định `scroll-mt` đổi sang `--sticky-top + 1rem`, giá trị giữ như cũ ngoài trang chi tiết); chi tiết liên hệ / tuyển dụng / tin tức vẫn dùng `--header-offset` (`JobDetail`, `ApplyFormSlot`, `PostShare`, `TableOfContents`, `RichText`).

**Residual:** chưa kiểm bằng mắt 768px, reduced-motion, tin `rented`, trình duyệt không hỗ trợ `:has()` (header không ẩn / `OBSERVER_MARGIN` -88px xấp xỉ), focus ring link mục con trên nền vàng nhạt; trước hydrate header che thanh mục con (user chấp nhận); header che thoáng thanh mục con ngay sau khi bấm neo từ đầu trang (T01 m-7, trạng thái cuối đúng); tin đã thuê: neo "Điều khoản" tới accordion đang đóng (không tự mở) và `RentalTerms` lặp lớp khung của `DetailSection` (T02 m-1/m-2); literal offset sticky lặp ở vài chỗ.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 29
