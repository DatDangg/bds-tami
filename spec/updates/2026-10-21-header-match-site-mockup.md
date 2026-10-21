# Spec Update — 2026-10-21 header-match-site-mockup (header thấp + chữ menu theo mockup site redesign)

**spec_version:** 1.41.0 → 1.42.0 (MINOR — đổi kích thước header / thanh nổi / chữ menu và khoảng thẻ tiêu đề chi tiết; không đổi schema, API, URL, quyền, nền kính, hành vi cuộn)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-046**, MODIFY). Change doc `spec/changes/archive/2026-10-21-header-match-site-mockup.md` (in-scope = mục "Phạm vi user chốt"; mục "(Không làm)" ngoài phạm vi). Task `tasks/feature-header-match-site-mockup/phase-1-task-01.md`. Review: `.context/review-reports/feature-header-match-site-mockup-phase-1-task-01-round-2-review.md` (STRICT, PASS r2; r1 FAIL 1 MAJOR bo thanh nổi + 3 MINOR — đã đóng).

## Requirements (SPECIFICATIONS.md)

- **Overview — "Khung trang" (SỬA):** `--header-offset` (chiều cao header phẳng ở đầu trang) 80px → **64px**, ≥ lg 104px → **72px** (BL-046, theo mockup site redesign); thanh nổi khi cuộn cách mép trên **6px** (≥ lg **8px**), hai bên 8px (≥ lg 16px) như cũ, cao 64px → **52px** (≥ lg 72px → **56px**); thanh mục con trang chi tiết dính sát đỉnh trang đúng **lề ngang** của header nổi (8px; ≥ lg 16px, cố định). Nền kính, hai hình dạng theo cuộn (BL-025), ngoại lệ ẩn khi cuộn ở trang chi tiết (BL-027/BL-032) giữ nguyên.
- **design-spec §2.1 (as-built):** logo ≥ lg 36px (trước 48px); menu ngang chữ `--text-xsmall` 12px, letter-spacing .04em, gap 24px (trước 14px / 1.12px / 16px); thanh nổi bo 26px (≥ lg 28px = nửa chiều cao). Thẻ tiêu đề trang chi tiết (`DetailTitleCard`) có khoảng **32px** trước thanh mục con (BL-031, mockup `.subnav` margin-top 32px; sửa hồi quy BL-045 T04).

## Hành vi mới

| | Trước | Sau (BL-046) |
|---|---|---|
| Header phẳng đầu trang (`--header-offset`) | 80px / ≥ lg 104px | 64px / ≥ lg 72px |
| Thanh nổi khi cuộn | cao 64/72px, cách mép trên 8/16px, bo theo cũ | cao 52/56px, cách mép trên 6/8px, hai bên 8/16px, bo 26/28px |
| Logo ≥ lg | 48px | 36px |
| Menu ngang (≥ xl) | 14px, letter-spacing 1.12px, gap 16px | 12px, .04em, gap 24px — 1280 VI/EN vẫn 1 hàng |
| Thẻ tiêu đề → thanh mục con (chi tiết dự án / cho thuê / tin BĐS) | dính sát (0px) | 32px (`pb-8`) |

## Code (as-built)

- `src/components/layout/DesktopNav.tsx` — cỡ chữ / giãn chữ / gap menu ngang.
- `src/components/layout/Header.tsx`, `HeaderFrame.tsx` (+ `Header.test.tsx`, `HeaderFrame.test.tsx`) — chiều cao, lề, bo thanh nổi, logo.
- `src/app/(frontend)/globals.css` — `--header-offset` 4rem / ≥ lg 4.5rem.
- `src/components/detail/DetailTitleCard.tsx`, `DetailLayout.tsx`, `DetailSubNav.tsx` (+ `DetailTitleCard.test.tsx`, `detail-header-css.test.ts`) — `pb-8` thẻ tiêu đề, vị trí dính thanh mục con.
- Doc: `docs/DESIGN.md`, `.context/design-spec.md` §2.1.

## Ảnh hưởng

- **Trực tiếp:** header mọi trang public vi/en (đầu trang phẳng thấp hơn; cuộn → thanh nổi nhỏ hơn; trang chi tiết vẫn ẩn khi cuộn), menu desktop 1280 VI/EN 1 hàng.
- **Phụ thuộc `--header-offset`:** hero trang chủ bù header, ô tìm kiếm, mục lục trang pháp lý dính, thanh mục con, aside dính, `scroll-margin` neo mục.
- **Trang chi tiết dự án / cho thuê / tin BĐS:** khoảng 32px giữa thẻ tiêu đề và thanh mục con.
- Không migration, không đổi quyền, không endpoint mới.
- **Ngoài phạm vi (change doc "Không làm"):** nền trắng đặc + viền như mockup, sticky đứng yên, bỏ nút CTA header, gạch chân vàng mục đang xem.
