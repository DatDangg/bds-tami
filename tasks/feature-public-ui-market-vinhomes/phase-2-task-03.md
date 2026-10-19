# feature-public-ui-market-vinhomes · phase-2-task-03 — Slider Ưu đãi + Dự án lớn kính mờ có số liệu

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT FAIL r1 (xoá nhầm khoá footer) → PASS r2
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · NORMAL.

## Việc
- FeaturedOffers → slider thẻ căn bo 20px + "Xem thêm" (scroll-snap, vuốt được, nút trước/sau ≥ md; tái dùng cơ chế của ProjectsSlider, không thêm thư viện).
- FeaturedProjects/ProjectsSlider: thẻ lớn ~464×600 bo 20px, khung kính mờ đè ảnh: tên, địa điểm, badge trạng thái gradient, **số liệu từ field sẵn có** `scale.landAreaM2`, `scale.totalUnits`, `scale.handoverTime` (thiếu thì ẩn ô) — theo chốt câu 3.
- Test render số liệu / ẩn khi thiếu.

## Acceptance
- [ ] Hai slider vuốt được trên mobile, dùng bàn phím được trên desktop; chữ trên kính mờ đạt AA


## Decision log (builder)
- Cơ chế slider tách chung `src/components/home/use-snap-slider.tsx`: hook `useSnapSlider(count, trackCurrent)` (listRef, `current` bằng IntersectionObserver, `scrollToSlide`, `scrollByPage`, reduced-motion → cuộn `auto`) + `SliderArrow` (44px, từ md). Không thêm thư viện.
- `ProjectsSlider`: thẻ ~464×600 (`aspect-[464/600]`, 82% < sm, 464px ≥ sm), `rounded-xl` (20px), ảnh phủ kín lazy `sizes="(min-width:640px) 464px, 82vw"`; cả thẻ là một `<Link>`; badge trạng thái dùng `SALES_STATUS_BADGE_VARIANT` + chuỗi `page.projects.salesStatus.*` (cùng thẻ `/du-an`); khung `.glass-panel` (tên serif, địa điểm, `<dl>` số liệu). Bỏ eyebrow/summary/nút "Khám phá" (theo yêu cầu #6) → xoá khoá i18n `page.home.projects.explore` không còn dùng. Dots giữ nguyên (giữ hành vi/test cũ); khi nhiều thẻ cùng hiện, "current" là thẻ vừa vào ≥ 60% — chỉ ảnh hưởng chấm.
- Số liệu: `ProjectSlideView` thêm `salesStatus` + `stats {landAreaM2,totalUnits,handoverTime}` (từ `doc.scale.*`, không dương/rỗng → `null`, ẩn ô). Nhãn mới `page.home.projects.stats.{landArea,units,handover}` (VI/EN): `specs.landArea`/`units` là chuỗi giá trị ("Đất {area}", "{count} căn") không dùng làm nhãn được. Không đổi schema.
- `.glass-panel` (globals.css) copy quy tắc `.site-header-bar`: đặc → `--color-glass` + blur trong `@supports` → đặc khi `prefers-reduced-transparency`. Chỉ `--color-text` trên kính; cặp màu đã được `contrast.test` ("chữ --color-text trên kính trước nền đen/trắng") phủ, không có cặp mới → thêm test cấu trúc CSS cho `.glass-panel`. Badge nằm trên ảnh (có nền gradient riêng như `ProjectCard`), không nằm trên kính.
- `FeaturedOffers` → `OffersSlider` (client) bọc `PostCard` (không đổi giao diện thẻ; thêm prop `imageSizes` tùy chọn để `sizes` đúng khung slider). Nút trước/sau cuộn theo "trang" (~90% bề rộng) vì nhiều thẻ cùng hiện. "Xem thêm" (khoá mới `offers.viewMore`, thay `viewAll` không còn dùng) = Button outline → `/tin-bds` (localized qua `resolveNavLink`).
- Giữ ISR: không đụng route/layout/loader; chỉ đổi component + view model thuần. Không `headers()/cookies()/searchParams`.
- Chưa kiểm bằng trình duyệt: 375/768/1280, hiệu ứng kính thực trên ảnh, CLS/LCP, vuốt thật (jsdom không có scroll-snap) — residual risk cho reviewer/primary.

## Verification summary (builder)
- `pnpm lint` 0 error (2 warning cũ tools/task-dashboard) · `pnpm typecheck` PASS · `pnpm vitest run src/components src/lib src/i18n src/app` 174 file / 1729 PASS. `pnpm build` bỏ qua theo yêu cầu.
- Test mới/đổi: `ProjectsSlider.test` (đủ 3 số liệu + DT/DD, link cả thẻ, badge variant primary/success, ẩn từng ô khi thiếu, không `<dl>` khi rỗng, EN), `OffersSlider.test` (region/list/slide a11y + tabindex, link, "Xem thêm", nút cuộn gọi `scrollBy`, ẩn nút khi 1 thẻ, EN), `home-view.test` (stats/salesStatus, loại bỏ giá trị không dương/khoảng trắng), `HomeBlocks.test` (link thẻ, badge, "Xem thêm" → /tin-bds), `contrast.test` (`.glass-panel`).

## Round 2 fixes (builder) — sau reviewer round 1 FAIL
- MAJOR: khoá `layout.footer.columns.explore` bị xoá nhầm (lệnh `sed '/"explore": /d'` quá rộng) → khôi phục VI "Khám phá"/EN "Explore". Kiểm tra tham chiếu: `page.home.projects.explore` và `page.home.offers.viewAll` không còn nơi dùng (grep `src` 0 kết quả) nên giữ trạng thái đã xoá. Test chặn tái phát: `src/i18n/load-shell-keys.test.ts` (mọi `t("...")` chữ trong `load-shell.ts` phải có chuỗi ở cả vi/en; kiểm regex còn khớp `footer.columns.explore`/`about`).
- MINOR: vòng focus bị cắt bởi `overflow-x-auto` → thẻ dự án dùng outline inset (`outline-offset-[-4px]`); `OffersSlider` thêm `-mx-2 px-2 py-2` + `scroll-padding-inline: 0.5rem` để vòng focus ngoài của `PostCard` không bị cắt.
- MINOR: test nút cuộn ưu đãi stub `clientWidth` = 1000, kiểm `left` +900 / −900. Thẻ dự án: `aria-labelledby` trỏ tiêu đề (tên truy cập chỉ là tên dự án); test đổi sang khớp đúng tên.
- MINOR: comment sửa ("design-spec S01 khối 3"; PostCard "Server hoặc Client Component").
