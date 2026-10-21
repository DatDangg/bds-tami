Agent: reviewer

# Review: feature-listing-detail-redesign · phase-3-task-06 · round 1

- Task: `tasks/feature-listing-detail-redesign/phase-3-task-06.md` (BL-052: gom MINOR, dọn code, reconcile doc, kiểm tổng thể)
- Worktree: `D:\prj\bds\.claude\worktrees\agent-afed16067ec55c7b8` (branch `worktree-agent-afed16067ec55c7b8`, base staging `c43f3fd`), chưa commit. 66 file sửa, 8 file mới, +907 / −1991.
- `src/payload-types.ts`: chỉ đổi EOL, bỏ qua theo yêu cầu.

## Review level: STRICT

**Lý do:** task xoá component và key i18n dùng chung, đổi hành vi sắp xếp/lọc trên 3 trang danh sách, sửa SEO (canonical, noindex, FAQ JSON-LD), sửa `CardSlider` dùng chung (cả trang chủ), refactor field factory của collection Payload (có rủi ro lệch schema) và sửa doc as-built.

## Blast radius

- Trang danh sách `/du-an`, `/cho-thue`, `/tin-bds` (+ trang danh mục), qua các file `*ListBody`, `*SortControl`, `use-listing-filter-nav.ts` (context mới `ListingNavigateContext`) và `RangeSliderFacet`.
- SEO: `post-list-metadata.ts` (mới), cờ `emitJsonLd` trong `RentalListPage` và `PostListPage`.
- `CardSlider` dùng chung: các slider trên trang chủ, slider tương tự / liên quan, slider nổi bật.
- Trang chi tiết: `DetailHeroMosaic`, `DetailInfoGrid` (union `kind`), `DetailLayout` / `DetailContactAside` (gom hằng sticky), `ProjectDetail`, `ProjectOverview`, `RentalDetail`, `PostDetail`, `ProjectListings`.
- Payload: `Projects.ts`, `Rentals.ts`, `PropertyPosts.ts`, `projects/listing-fields.ts` chuyển sang `src/fields/listing-field-helpers.ts`.
- i18n: `vi.json` / `en.json` xoá 148 key mỗi ngôn ngữ; thêm `listingOptions.direction`.
- Backfill: `property-posts.ts` tách thành `property-post-extract.ts`.
- Doc: `docs/API_SPEC.md` §3.9–3.11, `docs/DESIGN.md`, `docs/ERD.md`, `docs/ARCHITECTURE.md`, `.context/design-spec.md`.

## Lệnh kiểm tra và kết quả (chạy trong worktree, `.env.local` trỏ DB `tami_wt52_p2t03`, redis 15)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 lỗi; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, file nằm ngoài diff) |
| `pnpm test` | 384/385 file pass, 3858 test pass, 20 skip. File lỗi duy nhất: `tests/integration/media-upload.test.ts`, `beforeAll` hết giờ 10000ms (hạ tầng chậm khi chạy cả bộ; file này không nằm trong diff) |
| `pnpm test tests/integration/media-upload.test.ts` (chạy riêng) | PASS 20/20 |
| `pnpm build` | PASS (exit 0) |
| `pnpm payload migrate:create drift_check --skip-empty` | Không tạo file migration nào (`git status` sau khi chạy: không có file chưa theo dõi trong `src/migrations`). **Schema không lệch.** |

## Kết quả kiểm theo từng điểm được giao

1. **Lệch schema sau refactor field helper: OK.** `migrate:create --skip-empty` không tạo file. `nonNegativeNumber` chỉ thêm `index: true` khi có yêu cầu. Trước đây `PropertyPosts` ghi `index: false` tường minh, nay bỏ: Payload hiểu hai cách như nhau, và lệnh kiểm drift xác nhận điều đó.
2. **Key i18n bị xoá: OK.**
   - Lấy mẫu các key xoá (`media.gallery.*`, `page.rentalDetail.direction/video/subNav/sanitary/houseDirection/negotiable/bannerTitle/hotlineTitle`, `page.projectDetail.nearby/subNav/specs.label/facts.label/location.address/amenitiesLabel/leadForm.hotline/similar.description`, `page.postDetail.eyebrow/overview/related.description`, `page.posts.subNav/sections`, `page.listing.sortLabel/moreOptions`, `page.rentals.mobile/chips/fields.*/active.label/clearAll/remove/empty.suggestion*/card.negotiable/resultsFor/searchBarLabel`, `page.projects.filtersLabel/categoriesLabel/clear/resultCount/sortLabel/chips`, `detailKit.hero.region`). Không còn tham chiếu trong `src` (không tính test).
   - Đã đối chiếu namespace của mọi `useTranslations` / `getTranslations` thuộc `page.projects|rentals|rentalDetail|projectDetail|postDetail|posts|listing`, `media`, `detailKit`.
   - Các lời gọi trùng tên lá đều trỏ tới key còn giữ:
     - `RentalDetail` `t("facts.label")` → `page.rentalDetail.facts.label` (còn).
     - `RentalListPage` `t("categoriesLabel")` → `page.rentals.categoriesLabel` (còn).
     - `ProjectOverview` `eyebrow.overview` → `page.projectDetail.v2.eyebrow` (còn).
     - `RentalCard` `tPrice("negotiable")` → `page.rentalDetail.v2.spec.negotiable` (còn).
     - `RentalAmenities` `amenitiesLabel` → `page.rentalDetail.amenitiesLabel` (còn).
   - Key động `t(\`…${x}\`)`: chỉ dùng `sort.*`, `v2.tabs.*`, `tabs.*`, `bedroomsOption/furnishingOption/amenityOption.*`, `terms.*`, `salesStatus.*`, `listingOptions.(direction|propertyType|handoverCondition|projectFeature).*`. Không có namespace nào bị xoá; `listingOptions.direction` đã được thêm vào cả vi lẫn en.
   - HeroSearch trang chủ (`page.projects` / `page.rentals`: `moreOptions.*`, `areaHints`, `priceHints`, `allStatuses`, `salesStatus`) còn đủ key. Tuyển dụng dùng `page.careers.*` (`filtersLabel` / `categoriesLabel` của namespace riêng), không bị đụng.
3. **Component xoá: OK.** Không còn import `media/Gallery`, `DetailGalleryHero`, `DetailTitleCard`, `DetailGalleryParts` trong repo, ngoài các ghi chú lịch sử "*Trước BL-052*" trong `docs/DESIGN.md`. Vẫn còn `DetailLayout.tsx`, `CategoryListTemplate.tsx`, `layout/PageHero.tsx`, `layout/Pagination.tsx`. `DetailLayout` chỉ tách hằng `DETAIL_ASIDE_STICKY_CLASS`; chuỗi class giữ nguyên nên Tailwind vẫn quét được.
4. **Sắp xếp + lọc: OK.**
   - Cả 3 ô sắp xếp dùng `navigate` của `useListingFilterNav` qua context. `navigate` gộp `pendingPatch`, nên đổi lọc rồi đổi sắp xếp ngay vẫn giữ được lọc đang chờ.
   - `listingHref` bỏ `page` (`RESET_ON_CHANGE`).
   - Không có vòng lặp điều hướng: chỉ `onValueChange` gọi `navigate`, không có effect nào tự đẩy URL.
   - `reset` vẫn xoá `pendingPatch` và tăng `generation`.
   - Ô sắp xếp chỉ được dựng ở prop `sort` của `*ListBody`, tức là luôn nằm trong provider. Gọi ngoài provider thì báo lỗi rõ ràng (có test).
   - Test `listing-sort-control.test.tsx` phủ cả 3 trang: giữ tham số, bỏ `page`, "Mới nhất" không lên URL, và đổi lọc rồi đổi sắp xếp nhanh.
5. **SEO: OK, có test cho từng trường hợp** (`PostListPage.test` dòng 239/298/305/314/323, `RentalListPage.test` dòng 238/478–622, `ProjectListPage.test` dòng 158/278/286).
   - `/tin-bds`:
     - FAQ JSON-LD phát khi `!categorySlug && page===1 && !isFilteredList`. Điều kiện này giống điều kiện noindex của metadata.
     - Có lọc, `q`, `sort` khác mặc định hoặc `?category=` bất kỳ → noindex, follow.
   - `/cho-thue`: FAQ JSON-LD chỉ phát khi URL không có tham số đã parse nào. Cách này chặt hơn noindex (lọc đúng 1 tỉnh vẫn index nhưng không phát FAQ), chấp nhận được và an toàn hơn.
   - `/du-an`: dùng `cleanPage`, giữ nguyên.
   - Khuyến nghị cho câu hỏi noindex: xem MINOR-1.
6. **`CardSlider`: OK, rủi ro thấp.** Thay đổi duy nhất là thêm `relative` vào `<li>` của slide. Không có `z-index` nên không tạo stacking context. Phần tử tuyệt đối trong thẻ (badge góc ảnh, link phủ thẻ) vốn đã định vị theo khối chứa `relative` gần nhất bên trong thẻ, nên giao diện trang chủ không đổi. Riêng `sr-only` nay bị giữ trong slide. Có test khẳng định class. Chưa kiểm được trên trình duyệt: ghi vào Rủi ro còn lại.
7. **Doc: OK.**
   - Không file intent nào bị sửa: không có `SPECIFICATIONS.md`, `spec/**`, BRD/PRD/USER_FLOW trong diff.
   - `API_SPEC` §3.9 (`/du-an`: province nhiều giá trị, type/feature/priceMin/priceMax) khớp `project-filters`.
   - §3.11 (`/tin-bds`: `priceMax=0` = không giới hạn, `category` cũ, canonical về trang danh mục) khớp `post-filters.parseRange` và `post-list-metadata.ts`.
   - `ARCHITECTURE` đã đổi `searchRentals` thành `listRentals`.
   - `ERD` ghi `listingOptions.direction`.
   - Các nhắc tới `DetailGalleryHero` trong `DESIGN.md` nằm ở đoạn lịch sử "*Trước BL-052*".
8. **Regex backfill: OK.** `property-posts.test.ts` có các trường hợp:
   - "hướng Bắc Ninh", "hướng Tây Hồ", "chính Nam Từ Liêm" → không điền.
   - "cách 50m mặt tiền", "cách mặt tiền 30m" → không nhận.
   - "MT: 11m", "mặt tiền 5m" → nhận.
   - "3.5 tầng" và "3 tầng 1 tum" → điền và có ghi chú soát.
   - Hướng đứng một mình trong tiêu đề → chỉ gợi ý.
   - Danh sách `NOT_PLACE` (`từ liêm|hồ|anh|ninh|định|giang|kạn|hà|…`) chặn ngay sau chữ chỉ hướng và có ranh giới chữ.

## Responsive Checklist Gate

Diff có đụng UI: `CardSlider`, các ô sắp xếp, `RangeSliderFacet` (nhánh chưa có JS), badge, `DetailHeroMosaic` / `ProjectDetail` (tách hàm). Không có trình duyệt, nên các mục dưới được xác minh bằng CSS math và diff.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | `relative` trên slide giữ phần tử `sr-only` trong vùng cuộn `overflow-x` của slider, sửa đúng lỗi tràn ở 390px. Các wrapper `*ListBody` giữ nguyên class lưới (`lg:grid-cols-[16rem_minmax(0,1fr)]`), chỉ bọc thêm provider không sinh DOM. |
| Mobile-first / grid | OK | Không đổi breakpoint hay lưới. Ô sắp xếp giữ `w-full min-w-[11rem] sm:w-52`. |
| Typography / spacing | N/A | Không đổi token chữ hay khoảng cách. |
| Media | N/A | `DetailHeroMosaic` chỉ tách hàm, không đổi `sizes` hay `aspect-ratio` (theo diff). |
| Touch target ≥ 44px | OK | Ô "Từ / Đến" của `RangeSliderFacet` vẫn `h-11` (44px). Ô sắp xếp dùng `OptionSelect` chip, không đổi. |
| Nav / table | N/A | Không đụng. |
| 100vh / reduced-motion / overflow:hidden | OK | Hằng sticky vẫn dùng `100dvh`. Không thêm `overflow:hidden`. |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: `aislop` không nằm trong danh sách lệnh kiểm tra được phép của reviewer |
| oxlint (anti-slop) | skip: oxlint chưa được cấu hình (không có `.oxlintrc*`). ESLint PASS. |
| ocr (open-code-review) | skip: ocr chưa được cài |
| AI-readable | OK: mọi file đổi ≤ 300 dòng (lớn nhất `RentalListPage.tsx` 285, `PostDetail.tsx` 260). Các hàm dài (DetailHeroMosaic, ProjectDetail, các ListPage) đã tách. Comment ghi lý do, không chỉ mô tả việc code làm. Không có magic number mới. Doc ARCHITECTURE/DESIGN đã cập nhật. Ghi nhận 0 indicator. |
| ai-friendly-web | N/A: không đổi `robots`, `sitemap`, `llms` |
| blitzstrike | N/A: không có bề mặt auth hay input mới |

## Findings

**[CRITICAL]** Không có.

**[MAJOR]** Không có.

**[MINOR-1] Khuyến nghị cho `/tin-bds?category=<slug thật>`** (`src/components/posts/post-list-metadata.ts:59-63`)
- **Hiện trạng:** trang trả về noindex kèm canonical trỏ sang URL khác (`/tin-bds/danh-muc/<slug>`). Google coi noindex + canonical khác trang là tín hiệu trái nhau: có thể bỏ qua canonical, và về lâu dài có nguy cơ truyền tín hiệu noindex sang trang đích. Hiện tại không gây hại vì trang danh mục tự index được.
- **So với `/cho-thue?category=`:** trang đó để index và canonical trỏ về trang danh mục.
- **Đề xuất (theo thứ tự ưu tiên):**
  1. Chuyển hướng 308 `/tin-bds?category=<slug thật>` (khi không còn tham số lọc nào khác) sang `/tin-bds/danh-muc/<slug>`, rồi áp dụng cùng cách đó cho `/cho-thue?category=` để 2 trang nhất quán.
  2. Nếu không làm chuyển hướng: bỏ `forceNoindex` khi chỉ có `?category=<slug thật>` (index + canonical về trang danh mục), giống `/cho-thue`.
- Không chặn task này. Nên ghi vào backlog.

**[MINOR-2] Rủi ro hình ảnh của `CardSlider` chưa kiểm trên trình duyệt** (`src/components/layout/CardSlider.tsx:67`)
- Theo CSS math thì giao diện không đổi.
- Nên chụp nhanh slider trang chủ ở 390 / 768 / 1280 khi QA.

## Rủi ro còn lại

- Chưa kiểm trực quan (Lighthouse/LCP, 6 trang × VI/EN × 1440/768/390, không JS) vì reviewer không được chạy app. Task yêu cầu mục này ("ghi số nếu đo"); builder hoặc primary cần ghi bằng chứng vào task file nếu có.
- Test integration `media-upload` hết giờ khi chạy cả bộ là do hạ tầng chậm (chạy riêng thì PASS) và nằm ngoài diff.

## Verdict: PASS

Không có CRITICAL hay MAJOR. Typecheck, lint, test và build đều PASS. Schema không lệch. Key i18n và component xoá không còn được dùng.
