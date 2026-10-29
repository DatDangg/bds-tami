# bug-home-section-heading-consistency · phase-1-task-01 — Trang chủ: đầu khối + nút "xem thêm" đồng bộ (BL-101)

- Change doc: `spec/changes/2026-10-29-home-section-heading-consistency.md` (BACKLOG BL-101, QA sheet 28/10 bug 19, 20, 21, Thấp).
- Phụ thuộc: không. User duyệt hướng 2026-10-29: Q1 = A, Q2 = A, Q3 = A (+ Tin tức theo kiểu nút).
- Trạng thái: `done` — Reviewer NORMAL PASS r1 (`.context/review-reports/bug-home-section-heading-consistency-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v105. Doc impact: `.context/design-spec.md` S01.

## Classification / Risk
- Type: **BUG** (UI trang chủ; không đổi API/schema/dữ liệu, không đổi link đích/nội dung).
- Risk: **LOW–MEDIUM** — thêm thành phần dùng chung trong `src/components/home/` (chỉ trang chủ dùng), sửa 5 khối trang chủ.
- Expected review level: **NORMAL**.
- Doc impact: `.context/design-spec.md` S01 khối 3/4/5/8/9 (as-built BL-101, ghi đè "căn trái" S01.4 và "Nút Outline" S01.5/8/9 theo quyết định user).

## Repro
- `/` và `/en` (Khách), dev local đã BẬT Dịch vụ / Ưu đãi nổi bật / Cho thuê (blockOrder) + chọn 3 dịch vụ cho khối Dịch vụ (user cho phép, giữ bật).
- Ảnh trước: `.context/review-reports/assets/bl101-before-{vi,en}-{1920,1440,768,390}.png`.
- Đo (Playwright Edge): `Dịch vụ` h2 `text-align: start` (lệch trái), các khối khác `center`; chỉ `Dự án nổi bật` có gạch 48px; nút: Dự án `ghost` + mũi tên, Ưu đãi/Cho thuê/Tin tức `outline` không mũi tên.

## Root cause
Mỗi khối tự dựng đầu khối + nút, không có thành phần chung; hai đợt thiết kế khác nhau:
- `FeaturedProjects.tsx:26-43` (mockup BL-044): căn giữa + `span h-0.5 w-12 bg-primary` + `Button variant="ghost"` + `ArrowRight`.
- `ServicesBento.tsx:48` (S01.4 BL-020 "Heading căn trái"): `h2` không `text-center`, không gạch.
- `FeaturedOffers.tsx:18,23` / `RentalsTabs.tsx:77,113` (S01.5/S01.8): `h2 text-center` không gạch; `Button variant="outline"` "Xem thêm".
- `HomeNews.tsx:26` (S01.9): `Button variant="outline"` "Xem tất cả".

## Thiết kế fix (user chốt 2026-10-29)
1. `src/components/home/SectionHeading.tsx` (Server Component, không client): props `id`, `title`, `eyebrow?`, `description?`, `className?` — dựng cột căn giữa: eyebrow (nếu có) → `h2 font-display text-h2` (id) → gạch `span aria-hidden h-0.5 w-12 bg-primary` → mô tả (nếu có) `max-w-[80ch] text-lead text-text-secondary`. Markup/class giống hệt đầu khối Dự án nổi bật hiện tại (không đổi giao diện khối này).
2. `src/components/home/SectionMoreLink.tsx`: `Button asChild variant="ghost"` + `Link href` + nhãn + `ArrowRight size={16} aria-hidden` — giống nút Dự án hiện tại. Props `href`, `children`, `className?`.
3. Áp dụng: `FeaturedProjects` (dùng 2 thành phần, giao diện không đổi), `ServicesBento` (heading căn giữa + gạch; KHÔNG thêm nút — khối không có link xem thêm), `FeaturedOffers` (heading + gạch; nút → SectionMoreLink), `RentalsTabs` (heading + gạch; nút từng tab → SectionMoreLink, giữ href theo tab), `HomeNews` (CHỈ nút → SectionMoreLink, giữ bố cục 2 cột + heading trái, giữ `mt-2`; kiểm tương phản ghost trên `.theme-dark-block`).
4. Giữ khoảng cách dưới đầu khối như cũ từng khối (mb-10 / mb-8 Cho thuê), giữ `aria-labelledby`/`labelledBy` id, giữ nội dung + href + i18n key.
5. Không over-engineer: không variant `align`, không prop thừa.

## Files
- Mới: `src/components/home/SectionHeading.tsx`, `src/components/home/SectionMoreLink.tsx` (+ test `SectionHeading.test.tsx` hoặc gộp vào test khối sẵn có).
- Sửa: `FeaturedProjects.tsx`, `ServicesBento.tsx`, `FeaturedOffers.tsx`, `RentalsTabs.tsx`, `HomeNews.tsx` + test tương ứng (`HomeBlocks.test.tsx`, `HomeRentals.test.tsx`, `HomeNews.test.tsx`, `OffersSlider.test.tsx`/`FeaturedProjects.test.tsx` nếu kiểm class/variant cũ).
- KHÔNG đụng: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tools/agent-live.mjs`, `tools/vibe-studio/src/live-state.ts`, `.claude/hooks/live-studio.mjs`, `.context/review-reports/assets/bl054-*`, `spec/changes/*`.

## Acceptance
- [x] Dự án / Dịch vụ / Ưu đãi / Cho thuê: h2 căn giữa (`text-align: center`, tâm h2 = tâm khung ±2px) + gạch 48×2 `bg-primary` ngay dưới, 1920/1440/768/390, VI + EN.
- [x] Nút xem thêm Dự án / Ưu đãi / Cho thuê / Tin tức: cùng `ghost` + mũi tên → (cùng class), href/nhãn không đổi; focus-visible ring như Button chung; Tin tức trên nền tối đủ tương phản AA.
- [x] Tin tức giữ bố cục 2 cột + heading trái.
- [x] Không tràn ngang (`scrollWidth` = viewport) ở 390/768.
- [x] Ảnh sau `.context/review-reports/assets/bl101-after-{vi,en}-{1920,1440,768,390}.png` (script `node C:/Users/datda/AppData/Local/Temp/claude/D--prj-bds/252b8873-425c-4c6a-966c-b60b663a3c53/scratchpad/shot.mjs .context/review-reports/assets after` từ `D:\prj\bds`; dev `http://localhost:3000` đang chạy — KHÔNG dừng/khởi động bản khác). Dev dùng cache: nếu trang chưa đổi, đó là HMR code — code component đổi thì HMR tự áp.
- [x] Test mới (FAIL trước / PASS sau) + `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-29 (change-request): root cause từ code + design-spec + mockup BL-044 (không spawn Explore). Design-spec mâu thuẫn với kỳ vọng QA → hỏi user; user chốt A/A/A + Tin tức theo nút.
- 2026-10-29 (change-request): dev DB — blockOrder thêm `services`, `featuredOffers`, `rentals`; `homepage.services.items` = 3 dịch vụ có sẵn (Phân phối, Môi giới, Khai thác căn hộ dịch vụ); revalidate `/vi`, `/en` qua `/api/internal/revalidate`. Giữ bật theo yêu cầu user.

## Repro Verification
- Expected: Dự án/Dịch vụ/Ưu đãi/Cho thuê h2 căn giữa + gạch 48x2; nút xem thêm 4 khối cùng ghost + mũi tên.
- Actual before fix: Dịch vụ h2 `start`, chỉ Dự án có gạch; Ưu đãi/Cho thuê/Tin tức `outline` không mũi tên.
- Actual after fix (Playwright Edge, VI+EN, 1920/1440/768/390): h2 `center`, tâm h2 = tâm viewport (960/720/384/195); gạch 48x2 ở 4 khối; 0 link `outline` trên trang, mọi nút xem thêm `ghost` + svg aria-hidden; scrollWidth = viewport ở 390/768/1440. Ảnh `bl101-after-{vi,en}-{1920,1440,768,390}.png`. Tin tức không bật trong blockOrder dev nên chưa có ảnh (chỉ test unit); ghost trên `.theme-dark-block`: #fff/#111 ≈ 18:1, hover #e0bf89/#111 ≈ 10:1 → AA.
- Evidence: test mới SectionHeading.test.tsx, HomeBlocks/HomeRentals/HomeNews BL-101; `pnpm typecheck`, `pnpm lint`, `pnpm test` (461 files / 4847 tests) PASS.
- Status: PASS

## Close-out (change-request)
- r1 NORMAL PASS, 2 MINOR: (1) JSDoc `eyebrow`/`description` tách comment — đã sửa ở close-out; (2) test Tin tức chỉ kiểm cha không `text-center` — chấp nhận.
- Dev DB (user cho phép, giữ bật): `homepage.blockOrder` thêm `services`, `featuredOffers`, `rentals` (thứ tự strengths, about, featuredProjects, services, featuredOffers, ctaBanner, rentals); `homepage.services.items` = 3 dịch vụ sẵn có; revalidate `/vi` `/en`. Tin tức chưa bật trên dev (không có ảnh, chỉ unit test).
- Spec: no spec change (1.61.0); test-scope v105 (v104 archive). Doc impact: design-spec S01 (ghi chú as-built BL-101 + khối 3/4/5/8/9).
