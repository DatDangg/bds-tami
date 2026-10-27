# bug-listing-category-tabs-overflow · phase-1-task-01 — Thanh danh mục danh sách: tràn bị cắt, không gợi ý cuộn (BL-084)

- Change doc: `spec/changes/2026-10-27-listing-category-tabs-overflow.md` (BACKLOG BL-084, QA bug 9).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-listing-category-tabs-overflow-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.59.0), test-scope v83. Doc impact: `.context/design-spec.md` (1 dòng hành vi tràn).

## Classification / Risk
- Type: **BUG** (UI responsive; không đổi API/schema/requirement).
- Risk: **MEDIUM** — `ListingCategoryTabs` dùng chung `/cho-thue` (RentalListPage), `/du-an` (ProjectListPage), tin BĐS (PostListPage).
- Expected review level: **STRICT** (shared component, navigation).
- Doc impact: dự kiến `.context/design-spec.md` nếu có mô tả thanh tab danh sách (ghi hành vi tràn) — builder kiểm; không thì `no doc impact`.

## Repro
- `/cho-thue` VI 1920: mục cuối "Mặt bằng kinh doanh" bị cắt mép phải. Nội dung 1413px > khung 1280px.

## Root cause
`src/components/listing/ListingCategoryTabs.tsx:36` — `ul` `max-w-container overflow-x-auto [scrollbar-width:none]`: cuộn được nhưng ẩn thanh cuộn, không fade/nút mũi tên, không cuộn tab đang chọn vào tầm nhìn → người dùng không biết còn mục.

## Thiết kế fix (builder chọn, ghi Decision log)
- Giữ phần link render server (SEO, không JS vẫn là link + cuộn được); thêm lớp client nhỏ bọc `ul`: đo tràn (ResizeObserver + scroll), fade mép trái/phải khi còn nội dung phía đó, nút mũi tên trái/phải ở ≥ md (vùng chạm ≥ 44px, aria-label, ẩn/disable khi không tràn hoặc đã tới mép), < md cuộn vuốt + fade; tab `aria-current` được cuộn vào tầm nhìn theo chiều ngang khi mount (không cuộn trang dọc).
- Tận dụng pattern/hook sẵn có nếu có (vd `CardSlider` mũi tên/đo tràn) thay vì viết mới; dùng design tokens hiện có (`--duration-fast`, màu `surface`, icon `@/components/icons`).
- `prefers-reduced-motion` → cuộn không smooth.

## Files
- `src/components/listing/ListingCategoryTabs.tsx` (+ file client mới cùng thư mục nếu cần) + test.
- KHÔNG đụng file dirty việc khác (`src/collections/*`, `src/fields/ward-in-province.ts`, `package.json`, `pnpm-lock.yaml`, `tools/*`, `.gitignore`, `.claude/settings.json`, importMap.js, BACKLOG.md).

## Acceptance
- [ ] 1920/1440/1280/768/390: hoặc mọi mục vừa khung, hoặc có gợi ý cuộn rõ (fade mép + nút mũi tên ≥ md / vuốt mobile); mục đang chọn nằm trong tầm nhìn.
- [ ] Không vỡ `/du-an`, tin BĐS dùng chung component. Theo design tokens.
- [ ] Ảnh trước/sau (local dev server) lưu `.context/review-reports/assets/bl084-*.png`.
- [ ] Test; `pnpm typecheck` · unit test · eslint file đổi · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (builder): link vẫn render server trong `ListingCategoryTabs`; thêm client `ListingTabsScroller` bọc `ul` (vùng cuộn `max-w-container` giữ nguyên), tái dùng `SliderArrow` (hidden < md, 44px) từ `use-snap-slider` thay vì viết nút mới; không dùng hook `useSnapSlider` vì nó gắn snap/dots theo thẻ, tab cần chỉ đo tràn. Fade = gradient `from-surface`. Tab current căn giữa bằng gán `scrollLeft` (không scrollIntoView để khỏi kéo cuộn dọc). i18n mới `page.listing.tabs.{previous,next}` vi/en.
- Doc impact: `.context/design-spec.md` dòng "Khung danh sách chung" thêm hành vi tràn (BL-084); API/ERD/DESIGN: no doc impact.
- 2026-10-27 (change-request): root cause có file:line trong change doc → không spawn Explore.

## Repro Verification
- Original repro: `/cho-thue` VI 1920 — nội dung tab 1414px > khung 1280px, mục cuối cắt mép phải, không gợi ý.
- Expected: có gợi ý cuộn rõ (fade + nút ≥ md / vuốt mobile); tab đang chọn trong tầm nhìn.
- Actual before fix: scrollbar ẩn, không fade/nút; tab chọn không được cuộn vào (ảnh `bl084-before-sim-rent-{1920,1280,390}.png` = trạng thái sau fix với fade/nút ẩn bằng JS, vì không revert code để chụp).
- Actual after fix (Edge headless qua Playwright, dev server local): /cho-thue 1920/1440/1280/768/390 đều tràn (sw 1414/1414/1412/1395/1230 > cw) → fade cuối + nút "Danh mục sau" 44px (≥ md; ẩn < md, vuốt + fade); /cho-thue/danh-muc/mat-bang-kinh-doanh: tab chọn cuộn vào tầm nhìn (scrollLeft 134/134/132/627/840, curVisible=true), fade đầu + nút "trước"; /du-an: 1920–1280 vừa khung (không fade/nút), 768/390 tràn → fade + nút; /tin-bds: vừa tới 768, 390 tràn → fade; không h-scroll trang ở mọi case. Ảnh `bl084-after-rent-{1920,1280,390}.png`.
- Evidence: `ListingTabsScroller.test.tsx` (5 test: vừa khung, fade/nút theo vị trí cuộn, scrollBy 80%, nút hidden md:inline-flex size-11, cuộn tab hiện tại); typecheck PASS; vitest unit+ui 376 file / 3806 test PASS; eslint 4 file đổi PASS; pnpm build PASS.
- Status: PASS

## Close-out (change-request)
- Reviewer 5 MINOR (không chặn) → follow-up: (1) nút mũi tên bị gỡ khi tới mép làm mất focus bàn phím — nên giữ nút + `disabled`/ẩn mờ; (2) thêm `scroll-px-*` để link focus ở mép không nằm dưới fade/nút; (3) tên test nhắc reduced-motion nhưng chưa test; (4) tách hook `useOverflowEdges` + ghi lý do bỏ `snap-x`; (5) chỉ căn giữa tab hiện tại lúc mount.
