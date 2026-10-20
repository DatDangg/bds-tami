# feature-link-hover-and-slider-title-height · phase-1-task-01 — Hover "Xem thêm"/breadcrumb bỏ gạch chân + khung tên slider dự án đều chiều cao (BL-037)

- Change doc: `spec/changes/archive/2026-10-20-link-hover-and-slider-title-height.md` (BACKLOG BL-037).
- Phụ thuộc: chạy SAU BL-038 (`bug-projects-slider-pagination`, cùng `ProjectsSlider.tsx`).
- Trạng thái: `done` — Reviewer STRICT PASS r1, spec 1.32.0 / scope v40 — user "làm đi" (auto proceed).

## Classification / Risk
- Type: **MODIFY** (đổi hiệu ứng hover link + bố cục khung tên thẻ slider; không schema/API/quyền/dữ liệu/i18n).
- Risk: **LOW** — chỉ class Tailwind; `Breadcrumb` + Button `ghost` là component dùng chung (mọi trang trừ trang chủ / EmptyState + FeaturedProjects).
- Expected review level: **NORMAL**.
- Blast radius: breadcrumb mọi trang công khai; "Xem tất cả" khối Dự án nổi bật trang chủ (Button ghost) + nút "Nhận tư vấn" EmptyState (ghost); "Xem thêm" hàng danh mục `/tin-tuc`; link danh mục chi tiết tin tức + tin đăng; "Xem tất cả vị trí" trong hộp cảnh báo tin tuyển dụng hết hạn; slider Dự án nổi bật.
- Doc impact: `.context/design-spec.md` (quy tắc hover link điều hướng + slider S01 khối 3 tên giữ chỗ 2 dòng) → spec-publisher.

## Khảo sát (đã đọc code)
"Xem thêm"/"Xem tất cả" ở FeaturedOffers / HomeNews / RentalsTabs là Button `outline` (không gạch chân, hover nền đảo) → **không đổi**. Link có gạch chân khi hover / gạch chân:
| Vị trí | Hiện tại | Đổi thành |
|---|---|---|
| `src/components/layout/Breadcrumb.tsx:17` `LINK_CLASS` | `hover:text-text hover:underline` | `transition-colors hover:text-accent-text` (bỏ underline) |
| `src/components/ui/button.tsx:21` variant `ghost` (FeaturedProjects "Xem tất cả", EmptyState) | `underline-offset-4 hover:underline` | `hover:text-accent-text` (bỏ underline; giữ transition sẵn có của base nếu có, không thì thêm `transition-colors`) |
| `src/components/news/NewsHomeBody.tsx:21` "Xem thêm" (đã `text-accent-text`) | `hover:underline hover:underline-offset-4` | bỏ underline, `transition-colors hover:text-text` |
| `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:144` link danh mục (đã accent) | `hover:underline` | bỏ, `transition-colors hover:text-text` |
| `src/components/posts/PostDetail.tsx:46` link danh mục (đã accent) | `hover:underline` | bỏ, `transition-colors hover:text-text` |
| `src/components/careers/JobDetail.tsx:75` "Xem tất cả vị trí" (hộp `bg-warning-subtle text-warning`) | `underline underline-offset-4` cố định | giữ gạch chân lúc thường (chỉ báo link trong hộp chữ), hover `hover:no-underline hover:text-accent-text` nếu `#8C6733` trên `#FBF1E0` ≥ 4.5:1 (tính và ghi số), không đạt → `hover:text-text` |
Quyết định: link VỐN đã vàng (`text-accent-text`) thì hover đổi sang `--color-text` (như link RichText) để vẫn có tín hiệu hover; link chữ thường/xám thì hover → `--color-accent-text`. Trong `.theme-dark-block` token tự đổi `#E0BF89` (BL-034).
Không đổi: link RichText (`RichText.tsx`), Footer / FooterLinkColumn / LanguageSwitcher / TableOfContents / NewsToc / not-found (`hover:underline`) — ngoài phạm vi user nêu (đề xuất gộp ở task sau nếu user muốn); link gạch chân cố định trong form/thông báo (ApplyForm, ConsentCheckbox, FormStatus, CookieBanner, ContactDetails, LazyMap, RentalSpecs, ProjectSpecs, PendingLink "xoá lọc"…).
Focus-visible: breadcrumb/ghost giữ outline focus mặc định (global `:focus-visible` / class sẵn có) — kiểm còn thấy.

## Slider khung tên đều chiều cao
`src/components/home/ProjectsSlider.tsx` `h3` (`line-clamp-2 font-display text-h3`): thêm `min-h-[2lh]` → tên 1 dòng vẫn giữ chỗ 2 dòng; khung kính neo đáy nên địa điểm + số liệu thẳng hàng giữa các thẻ có cùng loại dữ liệu. (Thẻ thiếu địa điểm/số liệu vẫn thấp hơn — ghi residual, không thêm placeholder rỗng.)

## Files
- 6 file trên + `ProjectsSlider.tsx` + test liên quan (`Breadcrumb` test, `button.test.tsx` nếu assert `hover:underline` ghost, `ProjectsSlider.test.tsx` assert `min-h-[2lh]`).
- KHÔNG đụng: `next.config.ts`, `src/payload-types.ts`, `src/components/projects/*`, `.claude/launch.json`.

## Acceptance
- [ ] Breadcrumb hover: không gạch chân, chữ `--color-accent-text`; focus-visible còn thấy.
- [ ] Ghost / NewsHomeBody / link danh mục tin tức + tin đăng / JobDetail hover không gạch chân, đổi màu như bảng; nền tối dùng biến thể sáng (token).
- [ ] RichText link không đổi.
- [ ] Slider: `h3` giữ chỗ 2 dòng (`min-h-[2lh]`, vẫn `line-clamp-2`).
- [ ] `pnpm vitest run src/components src/app`, `pnpm typecheck`, `pnpm lint` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary (builder)
- Contrast `#8C6733` trên `#FBF1E0` = **4.57:1** (>= 4.5) → JobDetail "Xem tất cả vị trí": giữ gạch chân lúc thường, hover `hover:no-underline hover:text-accent-text` (+ `transition-colors`).
- Button base đã có `transition-colors` → ghost chỉ đổi `hover:underline underline-offset-4` thành `hover:text-accent-text`.
- Focus-visible: rule toàn cục `:focus-visible { outline: 2px solid var(--color-focus-ring) }` ở `src/app/(frontend)/globals.css:353` → breadcrumb/ghost còn vòng focus; NewsHomeBody giữ class focus-visible tường minh.
- Đổi: Breadcrumb, button ghost, NewsHomeBody, tin-tuc/[slug]/page, PostDetail (link vàng → hover `text-text`), JobDetail, ProjectsSlider h3 `min-h-[2lh]`. Test: button.test (ghost), Breadcrumb.test, ProjectsSlider.test (mới).
- `pnpm vitest run src/components src/app`, `pnpm typecheck`, `pnpm lint`: `pnpm vitest run src/components src/app` 103 file / 970 test PASS (trước khi thêm 2 test mới); sau khi thêm: `src/components/{layout,home,ui}` 29 file / 242 test PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ tools/task-dashboard) (chạy lại sau khi thêm test).
- Residual: thẻ thiếu địa điểm/số liệu vẫn thấp hơn (không thêm placeholder).
- Reviewer r1 STRICT PASS (3 MINOR) `.context/review-reports/feature-link-hover-and-slider-title-height-phase-1-task-01-round-1-review.md`; vitest `src/components src/app` 972/972 PASS, typecheck PASS, lint 0 error.
- Spec 1.31.1 → **1.32.0** (MINOR), scope **v40** — `spec/updates/2026-10-20-link-hover-and-slider-title-height.md`; design-spec "Hover link điều hướng (BL-037)" + S01 khối 3 tên giữ chỗ 2 dòng.

## Residual risk
- JobDetail "Xem tất cả vị trí": màu thường (`--color-warning` #8A5A0A) gần như trùng accent khi hover → tín hiệu hover chủ yếu là mất gạch chân (đạt yêu cầu; muốn rõ hơn dùng `hover:text-text`).
- Thẻ slider thiếu địa điểm / số liệu vẫn có khung kính thấp hơn (không thêm placeholder rỗng).
- Footer / mục lục / LanguageSwitcher / not-found vẫn `hover:underline` — đề xuất task riêng nếu user muốn đồng bộ.
- Chưa xem trình duyệt thật 390/768/1280 (suy luận từ CSS).
