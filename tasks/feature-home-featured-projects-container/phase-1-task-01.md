# feature-home-featured-projects-container · phase-1-task-01 — "Dự án nổi bật" trong khung nội dung, ít thẻ thì căn giữa

- Change doc: `spec/changes/2026-10-24-home-featured-projects-container.md` (BACKLOG BL-075)
- Spec: SPECIFICATIONS.md trang chủ bullet "Dự án nổi bật" (đoạn BL-075) · design-spec S01 khối 3 (§ "Dự án nổi bật") + bảng breakpoint 1536
- Auto proceed: KHÔNG — plan đã qua human checkpoint trước khi builder chạy.

## Hiện trạng (change-request đã đọc code)
- `src/components/home/FeaturedProjects.tsx:34` render `<ProjectsSlider>` trực tiếp trong `<section>` (không bọc khung) → `CardSlider` `ul` rộng bằng màn hình, chỉ có `px-gutter` → tràn viền (1880px: thẻ đầu cách mép màn ~24px).
- `src/components/home/ProjectsSlider.tsx` chỉ dùng ở `FeaturedProjects` (grep: 1 nơi) → blast radius của ProjectsSlider = khối này.
- `src/components/layout/CardSlider.tsx` **DÙNG CHUNG**: dùng trực tiếp ở 3 nơi: `ProjectsSlider` (trang chủ), `SimilarCarousel` (Dự án/Căn/Tin tương tự, `arrows="sides"`; `ProjectDetail`, `SimilarRentals`, `RelatedPosts` đi qua nó), `ProjectAmenities` (tiện ích, `--spacing-gutter` đặt lại). → KHÔNG đổi hành vi mặc định của CardSlider.
- Mẫu khung đã có: `SimilarCarousel.tsx:41` bọc `CardSlider` bằng `div.mx-auto w-full max-w-container` (không `px-gutter` vì `ul` của CardSlider tự đệm `px-gutter` + `scroll-padding-inline`) → mép thẻ thẳng mép nội dung khung.
- Điều khiển: `useSnapSlider` đo `pageCount` (vừa một hàng → `maxScroll = 0` → `pageCount = 1`) và CardSlider đã ẩn mũi tên/chấm khi `pageCount ≤ 1` (BL-038). Khung 1280 (`--container-container: 80rem`, gutter ≤ 32px) ≥ lg: thẻ 272 + gap 16 → vừa 4 thẻ; 3 dự án prod → căn giữa; 6 → slider.

## Hướng sửa (quyết định change-request)
1. `FeaturedProjects.tsx`: bọc `<ProjectsSlider>` trong `div.mx-auto w-full max-w-container` (giống SimilarCarousel). Không thêm `px-gutter` ở wrapper (tránh đệm đôi). Cập nhật JSDoc (bỏ "tràn viền").
2. `CardSlider.tsx`: thêm prop opt-in (vd `centerWhenFits?: boolean`, mặc định `false`) → khi bật, `ul` thêm căn giữa **an toàn** bằng CSS `justify-content: safe center` (Tailwind ^4.3.3: `justify-center-safe`; builder xác minh class sinh ra đúng `justify-content: safe center`). **Cấm** dùng `justify-center` thường (kể cả làm fallback): khi tràn sẽ cắt thẻ đầu không cuộn tới được. Trình duyệt không hỗ trợ `safe` → căn trái (xuống cấp an toàn, chấp nhận). Lý do chọn CSS thay vì dựa `pageCount`: chạy ngay từ SSR/không JS, không nháy/CLS khi hydrate; khi tràn, `safe` rơi về `flex-start` nên cuộn/scroll-snap/thẻ đầu thẳng mép như cũ. Mặc định tắt → 4 consumer khác giữ nguyên DOM/class.
3. `ProjectsSlider.tsx`: truyền `centerWhenFits` (hoặc tên builder chọn, ghi Decision log).
4. Mũi tên/chấm: dùng cơ chế sẵn có (`pageCount ≤ 1` → ẩn). Builder kiểm thực tế ở trình duyệt rằng khi vừa một hàng thì `pageCount` = 1 (không lệch 1px vì `px-gutter` + `scroll-padding`) — nếu lệch, sửa trong phạm vi tối thiểu và ghi Decision log.
5. Không đổi `SLIDE_WIDTH`, gap, `IMAGE_SIZES` (ảnh vẫn 272px ≥ lg).

## Classification / Risk
- Type: **MODIFY** (UI layout trang chủ). Không đổi API / schema / i18n / CMS / migration.
- Risk: **MEDIUM** — đụng component dùng chung `CardSlider` (thêm prop opt-in, mặc định không đổi). Reviewer: **STRICT** (shared component theo AGENTS.md § Reviewer rules).
- Blast radius: `/` + `/en` khối Dự án nổi bật; CardSlider consumers (`SimilarCarousel` ở `/du-an/<slug>`, `/cho-thue/<slug>`, `/tin-bds/<slug>`; `ProjectAmenities`; `RelatedPosts`; `SimilarRentals`) phải giữ nguyên class/DOM.
- Doc impact: design-spec S01 khối 3 + bảng 1536 (change-request đã sửa intent); SPECIFICATIONS bullet BL-075 (đã ghi); `docs/DESIGN.md:292` "slider/hero tràn viền" → reconcile as-built ở close-out (change-request).

## Acceptance
- [ ] ≥ lg (1024 / 1440 / 1920), đo `getBoundingClientRect` ±1px, 3 trường hợp:
  - (a) mọi trường hợp: mép trái/phải vùng cuộn `ul` trùng mép khung `max-w-container` của đầu khối (div tiêu đề) / khối Về TAMI;
  - (b) khi tràn (slider, `scrollLeft = 0`): mép trái thẻ đầu = mép nội dung khung (mép khung + gutter);
  - (c) khi vừa một hàng: khoảng trống trái ≈ phải của hàng thẻ trong vùng nội dung.
- [ ] Số thẻ < số thẻ vừa một hàng (vd 3 dự án ở 1440/1920 — khung 1216 vừa 4; ở 1024 khung ≈ 970 vừa 3; 1 dự án ở mọi breakpoint) → hàng thẻ căn giữa trong khung (trường hợp c), sau hydrate không mũi tên / chấm.
- [ ] Số thẻ ≥ một hàng (vd 6 dự án ở 1440, hoặc 3 dự án ở 390/768) → slider như cũ: thẻ đầu thẳng mép khung, mũi tên ≥ md + chấm (số chấm = vị trí cuộn thật), vuốt/phím; `role=region` + `aria-roledescription=carousel` + nhãn slide giữ; < md vuốt ngang được, lộ thẻ kế.
- [ ] Không vỡ layout / không cuộn ngang trang ở 390 / 768 / 1024 / 1440 / 1920; `/en` giống `/vi`.
- [ ] CardSlider consumers khác không đổi class/DOM (test hiện có PASS, thêm 1 test mặc định không có class căn giữa). Comment `CardSlider.tsx:29` "~5 thẻ/khung desktop" cập nhật cho đúng (khung 1280 ≈ 4).
- [ ] Test: `CardSlider.test.tsx` (prop bật → `ul` có class căn giữa an toàn; mặc định không), `ProjectsSlider.test.tsx` (truyền prop), `FeaturedProjects.test.tsx` (slider nằm trong wrapper `max-w-container`).
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `.context/design-spec.md`, `docs/**` (change-request reconcile).
- KHÔNG đụng file dirty không thuộc change: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tools/**`, `.context/review-reports/assets/bl054-*.png`.
- KHÔNG commit (primary commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`)
- Dev server (http://localhost:3000; chưa chạy thì start theo project-config). Đo `/` + `/en` ở 390 / 768 / 1024 / 1440 / 1920 với dữ liệu dev hiện có; nếu dev chỉ có số dự án nổi bật cố định, kiểm cả trường hợp ít thẻ và nhiều thẻ (vd thu hẹp/mở rộng viewport để chuyển giữa vừa-một-hàng và tràn) — ghi số đo trước/sau vào Verification summary.
- Report: `.context/review-reports/feature-home-featured-projects-container-phase-1-task-01-round-<R>-review.md`

## Residual risk (đã biết, ngoài phạm vi)
- `use-snap-slider.tsx:25`: trước khi đo (SSR / chưa hydrate / không JS) `pageCount = count` → mũi tên + chấm hiện rồi ẩn sau hydrate khi vừa một hàng (khối dưới dịch lên ~68px). Có từ trước BL-075 (BL-038), không sửa trong task này; builder KHÔNG mở rộng scope. Ghi vào Verification summary nếu quan sát được.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Bọc khung ở `FeaturedProjects` theo mẫu `SimilarCarousel` thay vì đổi CardSlider cho mọi nơi: giữ nguyên 4 consumer khác.
- (change-request) Căn giữa bằng CSS `safe center` opt-in thay vì JS theo `pageCount`: không CLS, chạy không JS, tự rơi về căn trái khi tràn.
- (change-request) Sau spec-validation round 1 FAIL (G1–G5: chữ spec/task): sửa design-spec As-built BL-044 khối 3 + SPECIFICATIONS "≈ 5 thẻ" → "khung 1280 vừa 4"; acceptance đo theo 3 trường hợp; cấm `justify-center` thường; residual pre-hydrate ghi riêng.
- (change-request) ≥ lg khung 1280 chỉ vừa 4 thẻ (trước tràn viền ≈ 5) — hệ quả chấp nhận của yêu cầu, đã ghi design-spec.

- (builder) Prop tên `centerWhenFits` (default false), class Tailwind 4 `justify-center-safe` → computed `safe center` xác minh ở trình duyệt; không thêm px-gutter ở wrapper; không đổi SLIDE_WIDTH/gap/IMAGE_SIZES; không cần chỉnh pageCount (sw==cw khi vừa).

## Verification summary (builder)
Files: `src/components/home/FeaturedProjects.tsx` (wrapper `div.mx-auto.w-full.max-w-container`, JSDoc), `src/components/layout/CardSlider.tsx` (prop `centerWhenFits`, default false → `justify-center-safe`; comment "khung 1280 vừa 4 thẻ"), `src/components/home/ProjectsSlider.tsx` (truyền `centerWhenFits`); tests: `CardSlider.test.tsx`, `ProjectsSlider.test.tsx`, `FeaturedProjects.test.tsx`.

Verify: `pnpm typecheck` PASS · `pnpm test` PASS (438 files / 4606 tests) · `pnpm exec eslint src/components/layout src/components/home` sạch. `pnpm lint` (toàn repo) FAIL 239 errors nhưng toàn bộ ở file bundle minified (`5:3767 react-hooks/rules-of-hooks`... trong thư mục build sinh ra, không phải source) — có sẵn, ngoài scope, không do thay đổi này.
Tailwind sinh đúng: computed `justify-content` của ul = `safe center` (đo ở trình duyệt).

Đo (dev, `/` và `/en`, 6 dự án; viewport trình duyệt trừ ~15px scrollbar; [trái,phải] px):
BEFORE: 1440: ul [0,1425], thẻ đầu 32, khung tiêu đề [73,1353] → ul lệch khung. 1920: ul [0,1905], thẻ đầu 32 (cách mép màn ~32). 390: ul [0,390], thẻ đầu 16.
AFTER (thẻ đầu = mép khung + gutter ở mọi mốc):
- 1920: head [313,1593] = ul [313,1593]; thẻ đầu 345 (=313+32); sw 1776 > cw 1280 (tràn → slider, jc safe center rơi về trái). docSW 1905 (không cuộn ngang).
- 1440: head [73,1353] = ul [73,1353]; thẻ đầu 105 (=73+32); sw 1776 > cw 1280; docSW 1425.
- 1024 (/en): head [0,1009] = ul; thẻ đầu 27 (=gutter); docSW 1009 (= viewport).
- 768 (/en): ul [0,753]; thẻ đầu 23 (=gutter); sw 2045 > cw 753; docSW 753.
- 390: ul [0,390]; thẻ đầu 16 (=gutter); sw 1872 > cw 390; docSW 390.
Trường hợp vừa một hàng (mô phỏng bằng ẩn các thẻ từ thứ 4, chỉ DOM tạm, không đụng DB): 1920: free trái/phải = 184/184, sw=cw=1280 → pageCount theo công thức hook = 1; 1440: 216/216 (ul 73–1353, thẻ 289–1137), sw=cw; 1024: 53/53, sw=cw. 768/390: 3 thẻ vẫn tràn (sw 1037 > cw 753) → slider như cũ, thẻ đầu ở gutter.
Hạn chế đo: Browser pane không phát `ResizeObserver` (observer thử của chính mình cũng 0 lần), nên không xem được cập nhật `pageCount` sống sau khi đổi kích thước/ẩn thẻ; kết luận `pageCount=1` suy ra từ công thức `use-snap-slider.tsx` (`maxScroll = sw − cw = 0` → thẻ đầu đạt cuối → 1 trang) với sw=cw đo thật (không lệch 1px: cả khi có px-gutter + scroll-padding, sw == cw). Chưa xác minh bằng mount thật với ít thẻ (dev chỉ có 6 dự án nổi bật, không sửa DB) → reviewer/primary nên xác nhận nếu có data 3 dự án.
Residual pre-hydrate (đã biết, không sửa): mũi tên + chấm hiện trước đo (`pageCount = count`) rồi ẩn sau hydrate khi vừa một hàng; không quan sát được trong pane.
