Agent: reviewer

# Review — feature-listing-detail-redesign · phase-2-task-02 · round 1

- Task: `tasks/feature-listing-detail-redesign/phase-2-task-02.md` (BL-052, `/cho-thue` + danh mục theo khung danh sách mới)
- Code: worktree `D:\prj\bds\.claude\worktrees\agent-a910e54a34f4a96c1` (branch `worktree-agent-a910e54a34f4a96c1`, base staging `a07b8bf`), chưa commit
- Review level: **STRICT**
- Reason: trang công khai + SEO (canonical/noindex/FAQ JSON-LD); sửa component dùng chung (`FilterPanel.tsx`, `DetailInfoGrid.tsx`, `url-params.ts` — `/du-an`, chi tiết, `HeroSearch` trang chủ dùng); xoá hàng loạt component; luồng lọc nhiều tham số + điều hướng client (rủi ro stale closure đã từng gặp P1-T02).

## Blast radius
- `/cho-thue`, `/en/for-rent`, `/cho-thue/danh-muc/[category]` (render + metadata).
- `src/components/listing/FilterPanel.tsx` (nút "Bộ lọc" chuyển từ `ListSearchBar` vào, nội dung y hệt) → `/du-an`.
- `src/components/detail/DetailInfoGrid.tsx` (thêm `dateTime?` tuỳ chọn, additive) → chi tiết dự án/cho thuê/tin BĐS.
- `src/lib/search/url-params.ts` (xoá `secondaryFilterCount`, `rentalCountApiPath` — không còn nơi nào gọi; `PRICE_HINT_RANGES`/`AREA_HINT_RANGES`/`hasNarrowingParams` giữ nguyên) → `HeroSearch`, metadata.
- `RentalCard` (`priceNegotiable` mới trong `RentalCardData`, `MonthlyPrice` export) → trang chủ `HomeRentals`, "Căn tương tự".
- i18n `page.rentals` (vi + en, cùng bộ key).

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, ngoài diff) |
| `pnpm test` | PASS — 381 files / 3803 tests (integration chạy được, không timeout lần này) |
| `pnpm build` | skip — thời gian dài; Builder báo PASS (chưa kiểm độc lập → Residual risk) |

## Kiểm đặc biệt
- **File xoá còn import?** Grep toàn `src/` (gồm test) các tên `RentalFilters` (component), `RentalFilterPopover/Sheet`, `FilterFields`, `AmenityMultiSelect`, `use-rental-draft`, `RentalListNavigation`, `use-ward-options`, `use-api-json`, `SortSelect`, `ActiveFilters`, `ListSearchBar`, `ListFilterRow`, `secondaryFilterCount`, `rentalCountApiPath` → **không còn tham chiếu**. `HeroSearch.tsx:13` chỉ import `AREA_HINT_RANGES, PRICE_HINT_RANGES, RentalFilters (type), rentalListQueryString` — vẫn tồn tại. `CategoryListTemplate` còn dùng ở News/Post → giữ đúng. OK.
- **Link cũ `?category=`**: `currentSlug: categorySlug ?? filters.category` → tab đánh dấu; tab href dùng `withoutCategory` + page 1; `category` nằm trong `HIDDEN_PARAMS` nên form GET (hero + sidebar) giữ. Test `RentalListPage.test.tsx:338/347` (aria-current, cha của danh mục con). Canonical/noindex: `rental-list-metadata.ts` không đổi; test 447–591 PASS (gồm `project`/`amenities` → noindex). OK.
- **Form GET không JS**: ô có `name` (radio province, select ward/project, 2 ô số price/area, chip bedrooms/furnishing, checkbox amenities) + input ẩn q/sort/category; test 420. OK.
- **Stale closure / reset**: theo đúng mẫu `/du-an` — `useListingFilterNav` gọi 1 lần, `generation` làm `key`, `reset` → `onClear` của cả Sidebar và Sheet; đổi tỉnh patch `ward: null`. OK. Riêng ô Sắp xếp: xem MINOR-2.
- **a11y**: tab `aria-current="page"`; radio gốc trong `<label>` min-h-11; Select có label; sort có `<label htmlFor>` (sr-only < sm); nút spotlight có sr-only tiêu đề; `<time dateTime>` ở ngày đăng. OK.
- **i18n EN**: 23 key mới thêm cùng vị trí cuối `page.rentals` ở vi + en; test `/en` (254) PASS. OK.
- **Không phá `/du-an` / trang chủ**: `FilterPanel` chỉ inline lại `ListFiltersButton` (giống hệt bản cũ); `DetailInfoGrid` additive; test `/du-an`, `HomeRentals`, `HeroSearch` PASS.
- **Residual "step chặn submit" có phải MAJOR?** Không. `HeroSearch` chỉ gửi mốc `PRICE_HINT_RANGES` (5/10/20 triệu — bội số 1.000.000) và `AREA_HINT_RANGES` (30/50/80/120 — bội số 5), nên mọi link từ trang chủ hợp lệ với `step`. Chỉ URL tự gõ / bookmark khoảng tuỳ chọn BL-045 (vd `priceMin=7500000`) hoặc giá > 100 triệu mới bị trình duyệt chặn, và chỉ khi **không JS** + bấm "Áp dụng"; trình duyệt báo lỗi tại ô, người dùng sửa được; có JS không ảnh hưởng. → MINOR-1.

## Responsive Checklist Gate (diff đụng UI; không có browser → CSS math)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Khung `grid … lg:grid-cols-[16rem_minmax(0,1fr)]`, cột phải `min-w-0`; tab cuộn ngang (`ListingCategoryTabs` dùng chung). |
| Mobile-first `min-width` | OK | Lưới `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`; spotlight `dl grid-cols-2 sm:grid-cols-3`. |
| Grid không cột cố định px | OK | Cột lọc 16rem/17.5rem (rem, chỉ ≥ lg) — giống `/du-an` đã duyệt. |
| Typography rem / fluid heading | OK | Token `text-h3`/`text-small`/`text-xsmall`; không px mới. |
| Media `max-width`/`sizes` | OK | `GRID_CARD_SIZES` theo cột; ảnh spotlight qua `SpotlightSlider` dùng chung. |
| Touch target ≥ 44px | OK | Radio label `min-h-11`, "Xem thêm" `min-h-11`, nút Bộ lọc `h-11`, link gợi ý trống `min-h-11`. |
| Nav/filter mobile | OK | < lg: `FilterSheet` + badge; không JS: `<details>` (test 420). |
| Table | N/A | Không có bảng. |
| 100vh / reduced-motion / overflow hidden che lỗi | OK | Không thêm `100vh`/animation/overflow-hidden. |
- Chưa xác minh bằng trình duyệt thật ở 375/768/1280 → Residual risk.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS thay thế).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — 1 indicator (hàm `RentalListPage` ~115 dòng, chủ yếu JSX lắp ráp, cùng dáng `/du-an`); tên rõ, không magic number (hằng có tên + comment WHY); < 3 → không FAIL.
- ai-friendly-web: N/A — không đổi `llms.txt`/`robots.txt`/`sitemap.xml`.
- blitzstrike: skip — không có input/auth mới phía server (params đã qua `parseRentalFilters` + `dropUnknownSlugs`).

## Findings

**CRITICAL:** không có.

**MAJOR:** không có.

**MINOR**
1. `src/components/listing/RangeSliderFacet.tsx:78,82` (gọi từ `RentalListBody.tsx:92-113`): không JS, ô số `step=1000000`/`max=100000000` (diện tích `step=5`/`max=300`) chặn submit nếu URL cũ mang giá trị lẻ hoặc vượt mép. Link `HeroSearch` không bị. Đề xuất (task sau): ở nhánh `!hydrated` bỏ `step`/`max` (hoặc `step="any"`) — server đã tự kiểm/đảo cặp; hoặc ghi residual vào task.
2. `src/components/rentals/RentalSortControl.tsx:37`: dựng URL từ `filters` của server, không qua `pendingPatch` của `useListingFilterNav` → đổi một ô lọc rồi đổi sắp xếp trước khi server trả về sẽ đè mất lọc vừa chọn (và ngược lại lọc đè sort). Bản cũ dùng chung draft nên không bị. Cùng mẫu với `ProjectSortControl` (`/du-an`) → không chặn; đề xuất cho sort đi qua `navigate({ sort })` của cùng hook (cả hai trang) ở task dọn sau.
3. Spec "Trang danh sách (khung chung)" nói số đếm ở "tab, ô tích, chip" — `/cho-thue` chỉ có số ở tab + Tỉnh; Tiện ích (ô tích), Phòng ngủ/Nội thất (chip) không có số (data P2-T01 chỉ trả `facets.category/provinces`; task Scope cũng không yêu cầu). Ghi gap để spec-validator cuối phase quyết định (thêm facet hay ghi lệch có lý do).
4. i18n còn key chết sau khi xoá component: `page.rentals.resultSuffix`, `resultsFor`, `fields.amenitiesCount`, `page.rentals.card.negotiable` ("Thoả thuận", vi.json:448) và key "Thoả thuận" ở vi.json:716 / en.json:716 — không còn nơi dùng. Dọn trong P3-T06 (gom MINOR). Lưu ý: bỏ heading "Kết quả cho “q”" — ô `q` vẫn hiện giá trị ở hero, chấp nhận được.
5. `RentalListPage` (hàm ~115 dòng) vượt ngưỡng 50 dòng — có thể tách phần dựng props (`tabs`, spotlight) như helper; không bắt buộc.

## Residual risk
- `pnpm build` không chạy lại độc lập (Builder báo PASS).
- Chưa kiểm trình duyệt thật 375/768/1280, VI/EN, không JS (Scope mục 5) — reviewer không chạy app.
- Clear "Xoá tất cả" trên link cũ `/cho-thue?category=x` về `/cho-thue` (bỏ cả danh mục) — hợp lý vì danh mục là tab, nhưng khác trang danh mục (giữ danh mục).

## Verdict
**PASS** — không CRITICAL/MAJOR; 5 MINOR chuyển P3-T06 / ghi gap.
