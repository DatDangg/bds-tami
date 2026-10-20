# feature-homepage-redesign · phase-1-task-01 — Schema global `homepage` + migration + view model + Hero chữ trái/bộ đếm + ô tìm kiếm "Tùy chọn khác" + khối Điểm mạnh (BL-044)

- Change doc: `spec/changes/2026-10-20-homepage-redesign.md` (BACKLOG BL-044). Spec delta: `SPECIFICATIONS.md` F1 khối "Bố cục theo mockup mới (BL-044)" + `spec/updates/2026-10-20-homepage-redesign.md`.
- **Mockup bắt buộc Read trước khi code:** `docs/specs/homepage-redesign-mockup/homepage-mockup-desktop.webp` (phần hero → ô tìm kiếm → dải 4 điểm mạnh).
- Phụ thuộc **T00** (tham số `amenities` của `/cho-thue`). T02 phụ thuộc schema của task này → **tuần tự** T00 → T01 → T02 → T03.
- Trạng thái: `pending` — **plan đã duyệt 2026-10-20** ("OK, chạy hết 3 task"; Q1 Tiện ích lọc thật → T00; Q3 bỏ mũi tên xổ; Q4 eyebrow/caption chung mọi slide).

## Ràng buộc user (không thương lượng)
- Bố cục/vị trí/tỉ lệ **đúng như ảnh**. Màu/token/font Montserrat/element **giữ nguyên**: chỉ dùng token trong `skills/react-nodejs/design-tokens.md` + class Tailwind đã map (`src/app/globals.css`), Button variant sẵn có (`primary`/`secondary`/`chip`/`outline`/`dark`/`ghost`), chip kiểu `HeroSearch` chip hiện tại, `OptionSelect`, `Input`, icon từ `src/components/icons.ts` (Phosphor — thêm icon vào file này nếu thiếu). **Không hex mới**, không kiểu nút/chip tự chế (`src/components/ui/no-raw-colors.test.ts` là gate).
- Chỗ nào buộc lệch ảnh → ghi "Lệch so với mockup + lý do" trong report, không tự "cải tiến".

## Classification / Risk
- Type: **MODIFY** (đổi bố cục hero/ô tìm kiếm F1) + ADDITIVE (khối Điểm mạnh, field mới).
- Risk: **MEDIUM–HIGH** — schema global `homepage` (migration versioned, additive), view model dùng chung `home-view.ts`, `HeroSearch` gửi query sang `/cho-thue` (contract URL sẵn có, không thêm tham số).
- Expected review level: **STRICT** (schema/migration + shared view model + form GET liên trang).
- Blast radius: trang chủ `/` `/en`; admin tab "Banner đầu trang"/"Thứ tự khối"; `payload-types.ts` regen; test `home-view.test.ts`, `HeroSlider.test.tsx`, `HeroSearch.test.tsx`, `HomeBlocks.test.tsx`.
- Doc impact: spec đã cập nhật (F1); `.context/design-spec.md` S01 mục 1/1b + khối mới (reconcile ở T03); `docs/ERD.md` §4.15 (field mới) — reconcile ở T03.

## Scope / files
1. **Schema** `src/globals/Homepage.ts` + `src/globals/homepage/blocks.ts`:
   - `hero.eyebrow` (text, localized), `hero.caption` (textarea, localized, mô tả "≤ 2 dòng, góc dưới phải hero"), `hero.slides[].titleAccent` (text, localized, "Dòng 2 của tiêu đề, màu vàng").
   - Khối mới `strengths` (group: `enabled`, `items` array minRows 2 maxRows 6: `icon` select từ `STRENGTH_ICONS` = `map-pin | buildings | headset | file-check | shield-check | clock | users | star`, `title` text localized required, `description` text localized). Tab admin "Điểm mạnh". `HOMEPAGE_BLOCKS` thêm `"strengths"` (đặt sau hero → đầu mảng), `BLOCK_LABELS.strengths = "Điểm mạnh"`.
   - Field cho T02 **tạo luôn ở task này** để chỉ có 1 migration: `about.{eyebrow, titleAccent, secondaryImage (upload image), imageCaption (textarea localized), videoUrl (text, validate URL YouTube: youtube.com/watch?v=, youtu.be/, youtube.com/embed/), videoLabel (text localized), ctaLabel (text localized), ctaLink (navLinkField), decorImage (upload image)}`, `about.stats[].icon` (select cùng `STRENGTH_ICONS`, không bắt buộc), `featuredProjects.{eyebrow (text localized), description (textarea localized)}`.
   - Icon: thêm vào `src/components/icons.ts` từ Phosphor; **xác minh tên tồn tại** trong `node_modules/@phosphor-icons/react` trước khi khoá enum (`FileCheck` có thể không có → `SealCheck`/`ClipboardText`); `Heart` cho T02. Màu icon trong ô tròn: `text-accent-display`.
   - `OptionSelect` thêm biến thể `chip` (cao 40px / < md 44px, viền `border-border`, `rounded-pill`, đang chọn `bg-primary-soft`; dropdown giữ kiểu Select TAMI) — dùng cho hàng "Tùy chọn khác".
   - `home-view.ts`: `strengths` vào `TITLE_OPTIONAL_BLOCKS`; `orderedBlocks` fallback khi `blockOrder` rỗng = danh sách mặc định mới (4 khối), không phải toàn bộ `HOMEPAGE_BLOCKS` (cập nhật `home-view.test.ts`). `h1` sr-only = `title + " " + titleAccent` slide 1; bộ đếm `aria-hidden`.
   - `blockOrderField.defaultValue` cho bản ghi mới = `["strengths","about","featuredProjects","ctaBanner"]`; mô tả tab "Thứ tự khối" ghi rõ: "Bố cục mới chỉ gồm Điểm mạnh, Giới thiệu, Dự án nổi bật, Mời tư vấn — các khối khác bỏ khỏi danh sách (hoặc bỏ tích Hiển thị) để tắt, thêm lại để bật". `validateBlockOrder` giữ.
2. **Migration**: `pnpm payload migrate:create homepage_redesign` → `migrations/<ts>_homepage_redesign.{ts,json}` (chỉ ADD COLUMN/TABLE, kiểm không có DROP/ALTER TYPE; nếu Payload sinh lệnh destructive → dừng, báo `HIGH_RISK_MIGRATION`). Chạy `pnpm payload migrate` trên DB dev; regen `src/payload-types.ts` (`pnpm payload generate:types` hoặc lệnh dự án — file này đang dirty bởi việc khác, chỉ thêm phần của mình).
3. **View model** `src/lib/home/home-view.ts` (+ `home-queries.ts`, `load-home.ts` nếu cần dữ liệu mới):
   - `HeroSlideView` + `titleAccent`; `HomeView.hero` kèm `heroEyebrow`, `heroCaption` (text theo locale; trống → null).
   - `HeroSearchView` + `rentalCategories: {slug,name}[]` (danh mục cho thuê cấp 1 đang có, nguồn như `/cho-thue`; `/en` chỉ bản EN) + `furnishings` không cần (hằng `RENTAL_FURNISHINGS`).
   - `StrengthsView {kind:"strengths"; items:{icon,title,description|null}[]}`; `RENDERED_BLOCKS` + `TITLE_OPTIONAL_BLOCKS` (không có h2) thêm `strengths`; `/en` bỏ item thiếu `title`; < 2 item → null.
   - `AboutView`/`featuredProjects` thêm field mới (T02 dùng) — chỉ map, chưa render.
4. **HeroSlider** `src/components/home/HeroSlider.tsx`: chữ canh trái trong `max-w-container` (eyebrow tracking `text-eyebrow` uppercase on-dark → `title` (display) + `titleAccent` dòng 2 `text-primary` → subtitle → Button primary + `ArrowRight`); góc dưới trái: bộ đếm `01 / 03` (`tabular-nums`, số đang xem đậm) + thanh tiến trình = nhóm nút (mỗi đoạn `button` `aria-label` goTo như chấm cũ, đoạn active `bg-primary`, còn lại `bg-on-dark/40`, cao 2px, vùng chạm 44px) + nút Dừng/Phát ngay cạnh; mũi tên Trước/Sau tròn viền `border-on-dark/40` hai mép giữa (≥ lg); góc dưới phải: caption (≤ 2 dòng, `text-small text-on-dark`) + nút cuộn xuống tròn. Bỏ hàng chấm giữa. `overlapsSearch` nâng cụm đáy lên như cũ. Giữ: autoplay/pause/hover/focus/vuốt/phím/aria/`inert`, `h1` sr-only ở `HomeBlocks`.
5. **HeroSearch** `src/components/home/HeroSearch.tsx`: icon `MagnifyingGlass` **trong** ô nhập (mép phải, `aria-hidden`, Input `pr-11`); nút submit "Tìm kiếm" + `ArrowRight`; chip "Dự án được quan tâm" 1 hàng (`overflow-hidden` + nút tròn `CaretDown` `aria-expanded` mở `flex-wrap`; < md giữ vuốt ngang); hàng "Tùy chọn khác" (chỉ panel Cho thuê): nhãn + 4–5 `OptionSelect progressive` kiểu viên thuốc nhỏ (cao 36–40px, dùng class chip hiện tại) `name` = `priceRange` / `areaRange` / `category` / `furnishing` / `amenities` (chọn 1 tiện ích từ `RENTAL_AMENITIES` — **T00 đã thêm**; nhãn i18n `page.rentals.amenityOption.*`; **không** mũi tên xổ cuối hàng — Q3) — **submit qua JS** (`onSubmit` → build query bằng `rentalListQueryString`/`QUERY_KEYS` của `src/lib/search/url-params.ts`: `priceRange` → `priceMin`/`priceMax` từ `PRICE_HINT_RANGES`, `areaRange` → `areaMin`/`areaMax` từ hằng `AREA_HINT_RANGES` mới trong `HeroSearch` (`<30`, `30-50`, `50-80`, `80-120`, `>120`), `router.push(rentalsHref + "?" + qs)`); không JS: form GET gửi `q` + `category` + `furnishing` (+`bedrooms`), hai ô range đặt `name` không trùng tham số `/cho-thue` để trang đích bỏ qua. Nhãn i18n `page.home.search.moreOptions.*` (vi+en). Tab Dự án giữ nguyên.
6. **StrengthsBlock** mới `src/components/home/StrengthsBlock.tsx` (Server Component): `section aria-label` i18n "Điểm mạnh"/"Why TAMI", `ul` 4 cột ≥ lg / 2 md / 1 < md, mỗi `li`: ô tròn 56px `bg-primary-subtle` icon `text-accent-text` 24px + `h3 text-h4 font-semibold` + `p text-small text-text-muted`. Map icon → component Phosphor trong `src/components/home/strength-icons.ts` (dùng lại ở T02 cho số liệu). `HomeBlocks.tsx` thêm case.
7. **i18n** `src/i18n/messages/vi.json` + `en.json`: `page.home.hero.counter` ("Slide {index} / {total}"), `page.home.search.moreOptions.{label,price,area,category,furnishing,bedrooms,all,expandChips}`, `page.home.strengths.region`.
8. **Tests** (vitest, cùng file test hiện có): `home-view.test.ts` (strengths lọc EN/< 2 item, titleAccent, caption, rentalCategories), `HeroSlider.test.tsx` (bộ đếm 01/03, thanh tiến trình = số slide, 1 slide không thanh, Dừng/Phát còn), `HeroSearch.test.tsx` (submit JS tạo đúng query `/cho-thue?...`, "Tất cả" không lên URL, no-JS form có `action`+`name` đúng, chip expand `aria-expanded`), `HomeBlocks.test.tsx` (render strengths, h1 duy nhất), `no-raw-colors.test` PASS. Test migration/schema: `src/collections/*` có test config? → thêm test `Homepage` field tồn tại nếu có mẫu.

## Acceptance
- [ ] Admin: tab "Banner đầu trang" có eyebrow/caption/titleAccent; tab "Điểm mạnh" nhập 4 mục; tab "Thứ tự khối" có "Điểm mạnh"; lưu không lỗi; `/en` tab EN nhập được.
- [ ] Migration versioned additive, `pnpm payload migrate` PASS, không DROP/đổi type.
- [ ] Trang chủ 1440: hero chữ trái + bộ đếm `01 / 03` + thanh tiến trình đáy trái, mũi tên tròn hai mép, caption + nút cuộn đáy phải — **đối chiếu ảnh**; ô tìm kiếm đúng 3 hàng như ảnh; dải 4 điểm mạnh ngay dưới ô tìm kiếm.
- [ ] "Tùy chọn khác" chọn Mức giá + Loại căn hộ + Nội thất → Tìm kiếm → `/cho-thue?q=…&priceMin=…&priceMax=…&category=…&furnishing=…` và trang `/cho-thue` hiện đúng bộ lọc đang chọn (ActiveFilters).
- [ ] Không JS (tắt JS / test HTML server): form Cho thuê gửi `q` + ô đơn trị.
- [ ] Mobile 390: hero chữ trái, cụm đáy không đè chữ, ô tìm kiếm xếp dọc, "Tùy chọn khác" 2 cột, điểm mạnh 1 cột; không tràn ngang.
- [ ] 1 `h1`; nút Dừng/Phát còn; mọi nút có `aria-label`; AA (`contrast.test` nếu có).
- [ ] Không hex/kiểu nút mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify (lệnh từ `.context/project-config.md`)
`pnpm vitest run src/components/home src/lib/home src/components/ui` → `pnpm typecheck` → `pnpm lint` → `pnpm payload migrate` (dev DB) → xem thật trên http://localhost:3000 (dev server đang chạy, **không** chạy thêm `pnpm dev`) ở 1440 và 390, chụp màn hình đặt cạnh mockup.

## Retry / Escalation
Attempt 1 fail → `.agent/error-analyzer.md`, root cause lại, fix tối thiểu. Attempt 2 fail → so pattern đang chạy (BL-020 P2 HeroSearch/HeroSlider), kiểm assumption. Attempt 3 fail → **không fix #4**, status `architecture_review_needed`, ghi blocker/residual/evidence, hỏi human. Mỗi fail append `.context/error-memory.md`.

## Verification summary (builder điền)
- Acceptance criteria: …
- Verify commands + result: …
- Lệch so với mockup + lý do: …
- Reviewer verdict: …
