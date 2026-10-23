# feature-ui-polish-sticky-underline-flags · phase-1-task-02 — Bỏ gạch chân link/nút/menu trên site công khai

- Change doc: `spec/changes/2026-10-23-ui-polish-sticky-underline-flags.md` (BACKLOG BL-074, mục 2)
- Spec: SPECIFICATIONS.md Overview "Giao diện" (BL-034/BL-037 hover link) + bullet as-built BL-074 · design-spec §1 / §2.1 / §2.4 (footer), mục "Hover link điều hướng"
- Auto proceed (user "tự làm tự quyết đừng hỏi t").

## Quyết định (đã chốt với user qua primary)
- **GIỮ** gạch chân: link nằm trong đoạn văn nội dung bài (`RichText` — `TEXT_CLASS.link` `src/components/content/RichText.tsx:48`; tin tức/pháp lý/mô tả dự án…) theo WCAG 1.4.1. Định dạng chữ gạch chân do biên tập viên đặt trong RichText (`FORMAT_UNDERLINE`) là nội dung, giữ nguyên.
- **BỎ** gạch chân (cả mặc định `underline` lẫn `hover:underline` / `group-hover:underline` / thanh kẻ dưới chữ khi hover) ở mọi link / nút / mục menu / thẻ / footer / breadcrumb / mục lục / 404 / cookie banner / form… còn lại trên **site công khai** (`src/app/(frontend)/**`, `src/components/**` phía public). Thay bằng **hover đổi màu hoặc nền theo token** (`transition-colors duration-(--duration-fast)`, tức thì khi reduced-motion theo pattern sẵn có), **giữ `focus-visible`** (outline `--color-focus-ring`).
- Link nằm giữa câu chữ ngoài RichText (vd "Chính sách bảo mật" trong `ConsentCheckbox`, link trong `CookieBanner`, `NewsArticleContactNote`, email/hotline trong `ApplyFormSlot`/`JobDetail`/`JobListPage`/`FormStatus`): bỏ gạch chân nhưng phải còn **dấu hiệu không chỉ bằng màu** (WCAG 1.4.1) → `font-semibold` (đậm hơn chữ quanh) + màu `--color-accent-text` (hoặc màu hiện có nếu nền tối/banner), hover đổi màu. Nếu chữ quanh đã semibold → dùng cách khác token-based (vd icon sẵn có) và ghi decision log.
- Header `DesktopNav` (`src/components/layout/DesktopNav.tsx:65`): `border-b-2` + `hover:border-text/40` + `aria-[current=page]:border-text` tạo **vạch dưới chữ** = gạch chân thị giác → bỏ. Hover: đổi màu/nền token (kính sáng chỉ dùng chữ `--color-text` → ưu tiên **nền viên thuốc nhạt** token, vd `hover:bg-surface-muted`/tương đương, `rounded-pill px-3`); mục đang xem (`aria-current=page`): phân biệt không chỉ bằng màu → nền viên thuốc token (đậm hơn hover) — kiểm AA chữ trên nền đó và không làm menu tràn ở 1280 (VI + EN). Giữ `min-h-11`.
- **Ngoài phạm vi (giữ):** chỉ báo tab dạng thanh dưới cả ô tab (`ListingCategoryTabs` `border-b-2` bao icon + nhãn, mẫu tablist) — là chỉ báo tab, không phải gạch chân chữ; viền/border khác không nằm dưới chữ link. Admin Payload (`src/app/(payload)/**`, component admin) ngoài phạm vi.

## Danh sách đã thấy (grep `underline` ngoài test — builder grep lại đầy đủ, kể cả `decoration-`, `text-decoration` trong CSS)
`not-found.tsx:40` · `careers/ApplyForm.tsx:120` · `careers/ApplyFormSlot.tsx:40,45` · `careers/CvPicker.tsx:109` (md:underline nút chọn tệp) · `careers/JobDetail.tsx:104` · `careers/JobFilters.tsx:75` · `careers/JobListPage.tsx:125` · `consent/CookieBanner.tsx:144,160` · `detail/DetailExpandButton.tsx:22` · `detail/DetailGalleryGrid.tsx:73` · `detail/DetailInfoGrid.tsx:26` · `detail/DetailOverviewIntro.tsx:30` · `detail/SimilarCarousel.tsx:34` · `forms/ConsentCheckbox.tsx:51` · `forms/FormStatus.tsx:76` · `layout/Footer.tsx:69` · `layout/FooterLinkColumn.tsx:44` · `legal/TableOfContents.tsx:4` · `listing/FilterFacets.tsx:176` · `listing/FilterPanel.tsx:95` · `media/LazyMap.tsx:242` · `news/NewsArticleContactNote.tsx:31` · `news/NewsToc.tsx:62` · `rentals/RadioFacetList.tsx:67` · `rentals/RentalListPage.tsx:276,290` · `layout/DesktopNav.tsx:65` (vạch border).
Giữ: `content/RichText.tsx:48` (link trong bài).

## Classification / Risk
- Type: **MODIFY** (UI, toàn site công khai). Không đổi API / schema / i18n / migration / hành vi điều hướng.
- Risk: **MEDIUM** — nhiều component dùng chung (footer, header nav, form consent, filter) + a11y (1.4.1, 1.4.3, focus-visible). Reviewer: **STRICT** (shared component, header/footer toàn site).
- Doc impact: SPECIFICATIONS Overview (change-request ghi), design-spec mục hover link + §2.1 menu header (change-request reconcile).

## Acceptance
- [ ] `grep -rn "underline" src` (bỏ test, admin) chỉ còn: `RichText` link + `FORMAT_UNDERLINE` + `no-underline` (nếu có) — liệt kê kết quả grep trong decision log.
- [ ] Mọi link/nút đã đổi có hover nhìn thấy (đổi màu/nền token) + `focus-visible` outline giữ nguyên; link giữa câu chữ vẫn phân biệt không chỉ bằng màu.
- [ ] Header ≥ xl: không vạch dưới mục menu (thường/hover/đang xem); mục đang xem vẫn nhận ra được (nền) + `aria-current`; không tràn 1280 VI/EN; AA.
- [ ] Test cập nhật (test nào đang khẳng định có `underline` → đổi thành khẳng định không có + có hover token); thêm/giữ test `DesktopNav` cho chỉ báo đang xem.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `.context/design-spec.md`, file dirty không thuộc change. Không đụng `DetailLayout`/`DetailSubNav`/`DetailContactAside` (task 01) và `LanguageSwitcher`/`flag-icons` (task 03) ngoài phần underline (không có).
- KHÔNG commit.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- Trình duyệt (dev :3000): header 1280/1440 (vi+en), footer, 404, `/du-an` (lọc), `/cho-thue`, `/tuyen-dung` + chi tiết, chi tiết tin tức (link trong bài còn gạch chân; mục lục không), form lead (consent link).
- Report: `.context/review-reports/feature-ui-polish-sticky-underline-flags-phase-1-task-02-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Ngoại lệ RichText giữ gạch chân (WCAG 1.4.1, user chốt). Tab bar `ListingCategoryTabs` giữ chỉ báo (không phải gạch chân chữ). Link giữa câu ngoài RichText: semibold + màu thay gạch chân.
- (builder) Grep cuối `underline|decoration-|text-decoration` trong `src` (bỏ test, admin scss): chỉ còn `content/RichText.tsx:48` (`TEXT_CLASS.link`). `FORMAT_UNDERLINE` là hằng định dạng (không khớp class). Không còn `underline-offset-*` vô nghĩa. Test còn chữ `underline` chỉ là `not.toHaveClass("hover:underline")` (giữ).
- (builder) Hover theo nhóm: DesktopNav = nền viên thuốc `hover:bg-text/6`, đang xem `aria-[current=page]:bg-text/10` (token `--color-text` nên dark cũng đúng), `rounded-pill px-2.5 (2xl:px-3)`, `gap-1 2xl:gap-2` (khoảng cách chữ giữ 24/32px, không tràn 1280 vi/en: nav right 918–923, kế tiếp 1097); link giữa câu / nút văn bản (Consent, CookieBanner, FormStatus, mailto/hotline, JobFilters, RentalListPage, LazyMap, DetailInfoGrid): `font-semibold text-accent-text` → `hover:text-text`; nút "Xem thêm/Xoá lọc/Thu gọn" (Detail*, SimilarCarousel, Radio/FilterFacets): `hover:text-text`; chữ xám (Footer, FooterLinkColumn, TableOfContents, NewsToc, FilterPanel, 404): giữ `hover:text-text` + `transition-colors`; AnnouncementBar (nền vàng): `font-semibold` + `hover:bg-primary-foreground/10 rounded-sm px-1`; CvPicker: bỏ gạch chân md.
- (builder) Verify: `pnpm lint` · `pnpm typecheck` PASS; `pnpm test` 436 file / 4592 test PASS (thêm test chỉ báo đang xem DesktopNav). Browser: header 1280 vi+en không tràn, mục đang xem nền alpha .1 + aria-current, không text-decoration; fetch SSR 7 trang công khai + 1 bài tin: 0 `underline` trong HTML.
- (builder, attempt 2 sau review R1) FormStatus hotline + RentalListPage ListError "Thử lại": nền `bg-error-subtle` làm accent-text (#8c6733) chỉ 4.40:1 → đổi sang `font-semibold text-text` (kế thừa, đúng cả ngữ cảnh tối) + hover nền `hover:bg-text/6` `rounded-sm px-1`. NewsletterSignup dùng `FormErrorSummary` không truyền `hotline` (chỉ `onRetry`), và chữ link kế thừa `text-text` nên không rơi vào accent trên nền sáng. RentalListPage còn 2 link `PendingLink` chip lọc (nền trang, accent OK).
- (builder) DetailInfoGrid: `dd` đã semibold nên semibold không thêm dấu hiệu; mỗi giá trị là 1 ô riêng, link là giá trị tương tác duy nhất và khác màu accent + hover; chấp nhận (không thêm icon). AnnouncementBar: `font-semibold` + `px-1`/nền hover vì chữ thanh vàng là `font-medium`, link đậm hơn chữ quanh; px-1 chỉ để nền hover có đệm. accent-text trên warning-subtle 4.57:1 (JobDetail, ApplyForm): đạt AA sát ngưỡng, ghi nhận.
- (builder, attempt 2 verify) Sau fix R1: `pnpm lint` PASS, `pnpm typecheck` PASS, `pnpm test` 436 file / 4592 test PASS (1 lần chạy đầu bị ELIFECYCLE do tải/timeout máy khi chạy song song, chạy lại sạch). Không còn `text-accent-text` trên `bg-error-subtle` (grep FormStatus/RentalListPage).
