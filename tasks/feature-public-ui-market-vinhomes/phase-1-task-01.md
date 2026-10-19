# feature-public-ui-market-vinhomes · phase-1-task-01 — Design tokens phong cách mới (màu TAMI)

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **done** — STRICT PASS round 2 (r1 FAIL M1 font 400, M2 thứ bậc heading)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · Risk MEDIUM (token dùng chung mọi trang) → Reviewer STRICT.

## Việc
- `src/app/(frontend)/globals.css`: thang radius mới `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl` = thẻ 20px, `--radius-pill: 9999px`; giữ `--radius-sm` cho ô nhập nhỏ.
- Nút (`src/components/ui/button.tsx`): mọi variant bo viên thuốc; primary nền vàng `--color-primary` chữ `--color-primary-foreground`; secondary nền trắng viền + chữ `accent-text`; chip trên khối tối viền `on-dark/30`.
- Heading: bỏ `uppercase` ở h1/h2/display (HeroSlider, AboutBlock, FeaturedProjects, FeaturedOffers, ServicesBento, PageBanner), weight 400, **giữ EB Garamond + Montserrat** (không đổi sang Playfair/Mulish); tăng `--text-display`/`--text-h1` desktop (~56–60px; h2 ~44–48px), mobile giữ clamp. Watermark chữ chìm: bỏ (hợp phong cách mới, bớt nhiễu).
- Token mới: `--color-glass` (nền kính mờ header), `--blur-glass: 24px`, `--gradient-gold` (vàng champagne → vàng đậm) cho badge/nhấn; badge "Đang bán" gradient xanh từ `--color-success`.
- Test: contrast AA cho cặp mới (chữ/nút trên nền sáng + `.theme-dark-block`, chữ trên kính mờ trường hợp xấu nhất); cập nhật test khoá token (`no-raw-colors`, contrast test).
- Docs: `.context/design-spec.md` §1.7 (in hoa → viết thường), §3.1–3.2 (heading, thẻ, nút); `docs/DESIGN.md` bảng token.

## Acceptance
- [ ] Token + nút + heading theo phong cách mới, màu TAMI; AA khối sáng & khối tối (test)
- [ ] Không màu raw ngoài token; không CLS do đổi cỡ chữ (font đã preload)


## Decision log (builder)
- Radius: `--radius-md/lg/xl` = 12/16/20px, thêm `--radius-pill`; `--radius-sm` 2px giữ. Thẻ (ProjectCard, RentalCard, PostCard, NewsCard, JobCard) chỉ đổi class `rounded-sm` → `rounded-xl` trên link và thêm `rounded-xl` cho khung ảnh (không đổi layout).
- Button: mọi variant `rounded-pill`; thêm variant `secondary` (nền surface, viền border, chữ accent-text) và `chip` (viền `on-dark/30`). Giữ `uppercase` của nút (task chỉ bỏ in hoa ở heading).
- Heading: bỏ `uppercase` ở HeroSlider, AboutBlock, FeaturedProjects, FeaturedOffers, ServicesBento, CtaBanner, PageBanner, dịch vụ/[slug], error.tsx. Token: display 60px, h1 56px, h2 44px desktop, letter-spacing 0, weight 400 (mặc định preflight). Các h2 trang chủ chuyển `text-h1` → `text-h2` (44px). Để các chỗ dùng `text-h2` làm heading phụ không phình lên 44px, hạ về `text-h3`: RichText h2, ProjectsSlider h3, RentalDetail h1, JobDetail h2 mục, LeadFormSlot, ContactDetails, MobileMenu (giữ in hoa; restyle header là task sau). Số liệu AboutBlock `dd` h1 → h2.
- Watermark: bỏ token `--text-watermark` (+ khỏi `FONT_SIZE_TOKENS`), prop `watermark` của PageBanner, chữ chìm ở AboutBlock/FeaturedProjects/not-found, khoá i18n `page.home.about.watermark` và `page.home.projects.watermark` (vi/en).
- Token mới: `--color-glass` (rgb 250 248 246 / 0.8), `--blur-glass` 24px, `--color-primary-deep` #c9a15f, `--gradient-gold`, `--gradient-success` (success → success-text). Badge: bo pill; `primary` dùng gradient vàng; thêm `success`. `SALES_STATUS_BADGE_VARIANT` (project-view.ts): selling → success, upcoming → primary, handed_over → neutral (ProjectCard, ProjectHero).
- Phát hiện: `--color-accent-text` trên kính khi nền sau là đen chỉ 3.01:1 (không đạt) → trên kính chỉ dùng `--color-text`; mục đang chọn của header (task 02) phải đánh dấu bằng gạch chân/đậm, không bằng màu accent. Ghi trong docs/DESIGN.md + comment test.

## Verification summary (builder)
- Contrast (test `src/lib/contrast.test.ts`): kính trên nền đen text 10.83:1, trên trắng 17.55:1; badge vàng (badge-foreground) đầu sáng 8.07, đầu đậm 5.89; badge Đang bán (trắng) đầu 4.99, cuối 6.44; Button secondary accent-text/surface 5.12 (khối tối: on-dark-accent/#1c1c1c 9.72); chip trắng/nền tối ≥ 4.5.
- `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard). `pnpm typecheck`: PASS. `src/components/ui/no-raw-colors.test.ts`: PASS.
- `pnpm test`: 2756/2757 pass; 1 fail = Header.test "bẫy focus" timeout 5s khi chạy full suite song song; chạy riêng file đó PASS 16/16 (flaky tải, không liên quan thay đổi).
- `pnpm build`: FAIL do môi trường — Turbopack không resolve `next/font/google` (Montserrat/EB Garamond, cần mạng); không liên quan thay đổi. Chưa verify build.
- Chưa kiểm responsive/CLS bằng trình duyệt thật (font preload không đổi).

## Round 2 fixes (builder)
- M1: `src/lib/fonts.ts` EB Garamond tải weight `["400","500"]` (400 cho heading; 500 giữ vì PostCard feature dùng `font-display` + `font-semibold`, tránh bold giả). Vẫn qua next/font (preload giữ). Test mới `src/lib/fonts.test.ts`.
- M2: token mới `--text-h2-sm` (cỡ h2 cũ 24→30px, đăng ký trong `FONT_SIZE_TOKENS`). Dùng cho RichText h2, JobDetail (summary, mục, other-jobs), LeadFormSlot, ContactDetails, RentalDetail SECTION_HEADING/RentalSpecs/RentalTerms, SimilarRentals. RentalDetail h1 → `text-h2` (44px) ≥ mọi h2 (30px) ≥ h3 (25px). Các trang chi tiết khác (project/post/news/dịch vụ) giữ h2 `text-h2` dưới h1/display lớn hơn.
- m1: design-spec: số liệu About `--text-h2`, tên slide dự án `--text-h3`; §1.7 nêu `--text-h2-sm`.
- m2: `skills/react-nodejs/design-tokens.md` cập nhật (không watermark, thang radius, heading viết thường weight 400, font 400+500, ghi chú BL-020).
- m3: `src/lib/utils.ts` thêm `theme.radius: ["pill"]` cho tailwind-merge + test trong `utils.test.ts`.
- m4: ghi chú `chip` chỉ dùng trong `.theme-dark-block`/trên scrim ≥ `--color-overlay` ở `button.tsx` và `docs/DESIGN.md`.
- Verify: `pnpm lint` 0 error; `pnpm typecheck` PASS; `vitest run src/components src/lib src/i18n src/app` 171 files / 1679 tests PASS. Build bỏ qua theo chỉ đạo (primary verify).
