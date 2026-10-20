# feature-site-redesign-homepage-style · phase-1-task-02 — Nền tảng B: thẻ dùng chung kiểu "Dự án nổi bật" + bỏ tim mọi màn (kể cả trang chủ) + slider thẻ dùng chung (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045). Spec delta: khối BL-045 mục "Thẻ dùng chung" + F1 thẻ Dự án nổi bật ("không có icon tim").
- **Mockup bắt buộc Read:** `docs/specs/site-redesign-mockup/index.html` (`data-cards="project|rent|news"`, script dựng thẻ, CSS `.card`, `.slider`), DECISIONS #2, #6.
- Phụ thuộc: không. **Song song được với T01** (và T00) — không trùng file.
- Trạng thái: `done` — STRICT PASS round 2, commit `8f586a5` (close-out BL-045 2026-10-21); trước đó `built-awaiting-review` (builder xong 2026-10-21; chưa commit) — trước đó `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user
Như T01: bố cục đúng mockup, giữ token/element; không hex mới; lệch → ghi lý do.

## Classification / Risk
- Type: **MODIFY** (thẻ + slider) + REMOVE (icon tim trang chủ — đảo BL-044 Q1).
- Risk: **MEDIUM–HIGH** — component dùng chung nhiều trang (`ProjectCard`, `RentalCard`, `NewsCard`, `PostCard`, slider trang chủ).
- Expected review level: **STRICT** (shared component).
- Blast radius: trang chủ (Dự án nổi bật, Cho thuê, Tin tức, Ưu đãi), `/du-an`, `/cho-thue` (+ danh mục), `/tin-tuc`, `/tin-bds`, chi tiết (Dự án khác, Căn tương tự, Tin liên quan).
- Doc impact: design-spec S01 dòng tim (`.context/design-spec.md:236`), §3.2 thẻ — reconcile T08.
- Decision impact: DECISIONS #2 thay BL-044 Q1.

## Scope / files
1. **Bỏ tim**: `src/components/home/ProjectsSlider.tsx` bỏ `Heart` + `data-testid="project-heart"`; `ProjectsSlider.test.tsx` đổi thành assert **không** có tim; bỏ `Heart` khỏi `src/components/icons.ts` nếu không còn dùng. Grep toàn `src/` không còn `Heart`/`heart`.
2. **Thẻ Dự án** `src/components/projects/ProjectCard.tsx` = đúng thẻ trang chủ: nền trắng bo 20px viền `border-border`, ảnh 11:10 + badge trạng thái góc trên trái, thân: tên `text-h4` 600 2 dòng (`min-h-[2lh]`, BL-037) + hàng cuối ghim tỉnh (trái) + nút mũi tên tròn `bg-primary-soft` (phải, `aria-hidden`); cả thẻ một link; prop `headingLevel`, `priority`, `sizes`. `ProjectsSlider` dùng lại `ProjectCard` (gộp markup, không còn 2 bản). Dữ liệu `ProjectCardData` / `ProjectSlideView` hợp nhất hoặc adapter (không đổi truy vấn).
3. **Thẻ Cho thuê** `src/components/rentals/RentalCard.tsx`: cùng khung thẻ Dự án; badge (Còn trống/Đã thuê như hiện có); thân: tên 2 dòng → giá/tháng vàng đậm (`text-accent-text` trên nền trắng — AA) → thông số nhanh (diện tích · phòng ngủ, icon Phosphor) → ghim khu vực + nút mũi tên tròn. Theo `data-cards="rent"` mockup.
4. **Thẻ tin** `src/components/news/NewsCard.tsx` (variant `card`) + `src/components/posts/PostCard.tsx`: khung bo 20px nền trắng như thẻ dự án (ảnh trên, eyebrow danh mục, tiêu đề 2 dòng, ngày) theo `data-cards="news"`; giữ variant `feature`/`row`/`onDark` cho chỗ đang dùng (biến thể "bài nổi bật ngang" làm ở T06).
5. **Slider thẻ dùng chung** `src/components/home/use-snap-slider.tsx` + component mới `src/components/layout/CardSlider.tsx` (client): tách từ `ProjectsSlider` (scroll-snap, mũi tên tròn + chấm giữa dưới, BL-038 chấm = vị trí thật, không autoplay, ARIA carousel) nhận `items: ReactNode[]` — dùng cho slider "Dự án tương tự" / "Căn tương tự" (T04/T05) và trang chủ.
6. **Tests**: `ProjectCard.test.tsx`, `RentalCard.test.tsx`, `NewsCard.test.tsx`, `PostCard.test.tsx`, `ProjectsSlider.test.tsx`, `CardSlider.test.tsx` (1 link/thẻ, heading level, không tim, chấm/mũi tên), `no-raw-colors.test` PASS; cập nhật snapshot/DOM test của trang dùng thẻ (`project-components.test.tsx`, `ProjectListPage.test.tsx`, `project-market-blocks.test.tsx` — **các file này đang dirty EOL ở working tree, chỉ sửa phần của mình**).

## Acceptance
- [ ] Không còn icon tim ở bất kỳ trang nào (grep `Heart` = 0 trong `src/components`, trang chủ 1440/390 chụp đối chiếu).
- [ ] Thẻ Dự án ở lưới `/du-an` và slider trang chủ là **cùng một component**, khớp thẻ mockup (ảnh, badge, tên 2 dòng, ghim + mũi tên tròn) 1440 + 390.
- [ ] Thẻ Cho thuê khớp `data-cards="rent"` (giá + thông số nhanh); thẻ tin khớp `data-cards="news"`.
- [ ] Hover giữ BL-034 (tiêu đề đổi vàng thương hiệu), zoom ảnh, focus ring; 1 link/thẻ, không link lồng.
- [ ] Không hex/kiểu mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/components/home src/components/projects src/components/rentals src/components/news src/components/posts src/components/layout src/components/ui` → `pnpm typecheck` → `pnpm lint` → xem thật http://localhost:3000 (không chạy thêm `pnpm dev`) trang chủ, `/du-an`, `/cho-thue`, `/tin-tuc` ở 1440 + 390, chụp màn hình cạnh mockup (`.context/review-reports/assets/site-redesign-t02-*.png`).

## Retry / Escalation
Như T01 (error-analyzer → so pattern `ProjectsSlider` BL-044/BL-038 → attempt 3 `architecture_review_needed`).

## Round 2 (2026-10-21) — sửa theo reviewer round 1
- C1: worktree đã ff-only lên staging e07a160 (stash apply, giải conflict lấy bản staging cho FeaturedProjects/ProjectsSlider/hook/icons rồi áp lại phần task). Gỡ tim thật: `Heart` + `project-heart` khỏi ProjectsSlider.tsx và icons.ts (grep src chỉ còn assertion "không có tim" trong test). Giữ BL-037 (min-h-[2lh]), BL-038 (hook pageCount), BL-044 (FeaturedProjects eyebrow/mô tả/CTA, slide 82%/320/272px, tràn viền).
- C2: `CardSlider` dùng hook staging (`pageCount`/`current`/`scrollToSlide`), dots/mũi tên khi `pageCount > 1`; KHÔNG đổi hook (bản "thẻ đầu tiên" đã bỏ). Test mới: 6 thẻ, hiện 4 → 3 chấm.
- m1: RentalCard theo mockup rent: tên → ghim → thông số → chân thẻ (giá vàng + mũi tên). m2: NewsCard dùng CARD_LINK_CLASS/CARD_IMAGE_ZOOM. m3: hook dời `home/use-snap-slider.tsx` → `layout/use-snap-slider.tsx` (OffersSlider/RentalsTabs import lại). m4: mũi tên tròn `size-10 bg-primary-soft text-accent-text` (token sẵn, như BL-044); nhãn danh mục tin giữ eyebrow dưới ảnh (đã ghi).
- Verify: `pnpm vitest run src` 244 files / 2413 tests PASS; typecheck PASS; lint 0 error. Ảnh chụp chụp lại trên base mới (home 1440/390, rentals/news 1440).

## Quyết định builder tự chọn (2026-10-21)
- Icon tim: HEAD của worktree không còn `Heart`/`project-heart` nào (grep src = 0) nên không có gì để gỡ; thêm test khẳng định không có tim ở ProjectsSlider/ProjectCard/RentalCard.
- Khung thẻ chung tách ra `src/components/layout/card-parts.tsx` (CARD_LINK_CLASS, CARD_IMAGE_ZOOM, CARD_TITLE_CLASS `min-h-[2lh]`, CardFooter/CardPin/CardArrow `bg-primary-soft`). Thêm icon `Bed`, `Ruler`, `Clock` vào `icons.ts`.
- ProjectCard: ảnh 11:10, bỏ dòng "Từ <giá>" (mockup/spec chỉ tên + ghim tỉnh); prop `sizes`; kiểu `ProjectCardView` (salesStatus có thể null) để ProjectsSlider truyền thẳng `ProjectSlideView` làm data — không đổi truy vấn / home-view; `ProjectStats` (số liệu kính mờ) bị bỏ, key i18n `page.home.projects.stats.*` còn trong messages (dọn ở T08 nếu muốn).
- RentalCard: thêm badge "Còn trống" (key mới `page.rentals.card.available`) luôn hiện vì danh sách/tương tự chỉ có tin published; `RentalCardData` chưa có trường rented nên không dựng "Đã thuê".
- NewsCard (variant card, không onDark) + PostCard: khung như thẻ Dự án, bỏ tóm tắt (mockup không có), chân thẻ = ngày (icon Clock) + mũi tên tròn; PostCard giữ giá + "Kết thúc …" + badge ưu đãi. feature/row/onDark giữ nguyên.
- CardSlider (`layout/CardSlider.tsx`): `items: ReactNode[]` + `labels` (chuỗi `{index}`/`{total}`, để Server Component T04/T05 truyền được); 82% mobile / 2 thẻ sm / 4 thẻ lg như `.slider` mockup. Hook `useSnapSlider` sửa: chấm = thẻ ĐẦU TIÊN đang thấy (min của tập thẻ visible) vì nhiều thẻ cùng hiện. Khi cuộn tới cuối, chấm cuối không bao giờ sáng nếu nhiều thẻ cùng hiện (chấp nhận).
- FeaturedProjects: slider đặt trong container (4 cột, đúng mockup) thay vì tràn viền. OffersSlider/RentalsTabs trang chủ chưa chuyển sang CardSlider (dùng scrollByPage, không chấm) — để task trang chủ.

## Verification summary (builder điền)
- Acceptance criteria: PASS (grep Heart = 0; thẻ dự án 1 component lưới + slider; rent/news theo mockup; hover/focus giữ; 1 link/thẻ).
- Verify commands + result: `pnpm vitest run src` 235 files / 2325 tests PASS; `pnpm typecheck` PASS; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs).
- (Round 1, đã thay) Ảnh chụp: `.context/review-reports/assets/site-redesign-t02-{home-projects-1440,home-projects-390,projects-list-1440,rentals-1440,news-1440}.jpg` (định dạng jpg do công cụ chụp).
- Lệch so với mockup + lý do: mockup tin có badge danh mục trên ảnh; giữ eyebrow danh mục dưới ảnh theo spec task. Mockup giá thẻ 15px; dùng `text-body` token.
- Reviewer verdict: **STRICT PASS** (round 2) — report `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-02-round-2-review.md`; commit `8f586a5` trên `staging`.
