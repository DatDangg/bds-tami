Agent: reviewer

# Review — feature-bathrooms-filter · phase-1-task-01 · round 1 (BL-104)

- Review level: **STRICT**
- Reason: chạm SQL tìm kiếm Cho thuê dùng chung (`rentalConditions` → trang `/cho-thue` + `GET /api/public/rentals`), API zod contract (`rentalSearchParamsSchema`), facet/lọc Tin BĐS, logic noindex/badge dùng chung.
- Blast radius: `/cho-thue` (+ danh mục, `/en/for-rent`), `/tin-bds` (+ danh mục, `/en/property-news`), `GET /api/public/rentals` (thêm tham số tuỳ chọn — không phá client cũ), chip "đang lọc" + badge "Bộ lọc (n)", `hasNarrowingParams`/`hasPostFilterParams` (noindex), query string phân trang/sort. Không schema/migration (cột `bathrooms` có sẵn ở `Rentals.ts:212`, `PropertyPosts.ts:71`).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm lint` | PASS (eslint ., không lỗi) |
| `pnpm vitest run` 10 file liên quan (url-params, rental-search-sql, api, active-filters, post-filters, post-listing-queries, rental-filter-params, RentalListPage, PostListPage, tests/integration/rental-search) | 10 files / 230 tests PASS, 0 skip (integration chạy với DB thật) |
| `pnpm test` toàn bộ | không chạy lại toàn bộ (builder báo 461 files / 4863 PASS); test liên quan đã tự chạy |

## Kiểm tra trọng điểm (STRICT)
- **SQL tham số hoá**: `rental-search-sql.ts:143-145` — `= ${params.bathrooms}` qua tagged `sql` (bind param); nhánh `>= 4` là literal cố định. Giá trị đã qua zod `wholeNumber(4)` trước khi tới đây. Không injection. OK.
- **4 = ≥ 4**: rental SQL `>= 4`; posts `matchesRoomCount` (`post-list-facets.ts:20-21`) `chip >= 4 ? value >= chip : value === chip`. Integration: `bathrooms=4` → căn 4 + 6 phòng tắm. OK.
- **NULL không khớp**: SQL so sánh với NULL → không khớp (integration rental "e" không có bathrooms, không xuất hiện); posts `typeof value === "number"` (unit: tin 2/4/6 không có bathrooms bị loại). OK.
- **Đếm/facet cùng WHERE**: điều kiện vào nhóm `other` → mọi đếm (`filterConditions`) đều áp; posts thêm dimension `bathrooms` vào `PostPredicates` (đếm "mọi chiều trừ chính nó"). OK.
- **Giá trị lạ**: URL `/cho-thue` qua `readParam` (schema) + `bathroomsFromUrl` (0 bị bỏ) — test 0/5/abc/-1/1.5/"" bị bỏ, mảng lấy phần tử đầu; `/tin-bds` `parseRoomCount` chỉ nhận 1..4. API: `bathrooms=5|-1` → 400 (integration). OK.
- **Không sót chỗ liệt kê khoá** (grep `bedrooms` toàn `src` không tính test): `QUERY_KEYS` (thứ tự + phân trang/sort giữ tham số), `activeFilterCount` (badge + `hasNarrowingParams` → noindex), `RENTAL_ACTIVE_FILTER_SPEC`/`POST_ACTIVE_FILTER_SPEC`, `KIND_ORDER` + `filtersWithout` (nhánh `default` xoá đúng khoá), `use-active-filter-chips`, `hasPostFilterParams`, `postQueryString`, `POST_SCAN_FIELDS`. Đường trang → SearchService dùng spread (`toRentalSearchParams`, `post-listing.ts:44`) nên tự mang `bathrooms`. Redirect BL-055 (`RentalListPage.tsx:267`) dựa `rentalListQueryString` → có `bathrooms` thì không redirect, đúng. "Xoá tất cả" về URL sạch. Không sót.
- **Không đổi hành vi phòng ngủ**: rental SQL nhánh `bedrooms` không đổi; posts refactor predicate sang `matchesRoomCount` tương đương logic cũ; test `bedrooms` cũ vẫn PASS. OK.
- **i18n VI/EN**: `rentals.fields.bathrooms`, `rentals.bathroomsOption.1-4`, `rentals.active.bathrooms`, `posts.list.filterGroups.bathrooms`, `posts.list.bathroomsOption.1-4` — đủ cả hai file, cùng cấu trúc. OK.
- **Test có ý nghĩa**: dùng contract thật (zod schema thật, SQL thật trên DB integration, loader thật ở post-listing-queries), có case NULL, ≥4, kết hợp phòng ngủ, 400. OK.
- **Spec delta**: SPECIFICATIONS.md F3 + `/cho-thue` + `/tin-bds` có Phòng tắm (BL-104) khớp implementation (chip "đang lọc" chỉ yêu cầu ở Cho thuê).

## Responsive Checklist Gate (diff đụng UI: thêm 1 `FilterGroup` + `ChipChoice` ở 2 body)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout (không h-scroll, mobile-first, grid, container) | OK | Chỉ thêm 1 nhóm dùng lại `FilterGroup`/`ChipChoice` sẵn có, không CSS/class mới; builder đo 390 + 1440 không h-scroll (ảnh `assets/bl104-*.png`) |
| Typography/Spacing | OK | Không thêm style; kế thừa token của component có sẵn |
| Media | N/A | Không thêm ảnh/video |
| Touch/Interaction (≥44px, nav, table) | OK | `ChipChoice` giống ô Phòng ngủ đã qua review trước; Sheet < lg có ô (ảnh `bl104-rent-bath2-390.png`, `bl104-post-bath2-390.png`) |
| Viewport/A11y (100vh, reduced-motion, overflow) | N/A | Không thêm viewport unit/animation/overflow |

## Skill gates
- aislop: skip, aislop not installed.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS thay thế.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`bathroomsFromUrl`, `matchesRoomCount`, `parseRoomCount`), hàm ngắn, magic `4` đã đặt hằng ở posts (`ROOMS_OPEN_ENDED`); 1 comment lỗi thời (MINOR #2). < 3 indicators.
- ai-friendly-web: N/A (không đổi llms/robots/sitemap; trang có lọc vẫn noindex như cũ).
- blitzstrike: skip, không cài/không môi trường; input surface đã kiểm bằng zod + param binding + integration 400.

## Findings
- [CRITICAL] none.
- [MAJOR] none.
- [MINOR] 1. `src/lib/search/url-params.ts:146-147` — docblock `hasNarrowingParams` liệt kê "phòng ngủ, nội thất" chưa thêm "phòng tắm" (hành vi đúng, comment lỗi thời). Fix: thêm "phòng tắm".
- [MINOR] 2. `src/components/rentals/RentalListBody.tsx:24-25` — `BATHROOM_VALUES` lặp nguyên `BEDROOM_VALUES`; posts đã alias (`POST_BATHROOM_VALUES = POST_BEDROOM_VALUES`). Có thể alias tương tự cho DRY; không chặn.
- [MINOR] 3. Bất đối xứng có chủ đích: URL `/cho-thue?bathrooms=0` bị bỏ còn `bedrooms=0` (studio) vẫn lọc; API nhận 0 cho cả hai. Đã ghi lý do trong Builder log + comment `url-params.ts:56`; change-request nên ghi rõ ở `docs/API_SPEC.md` §3.3 khi reconcile.
- [MINOR] 4. Process: Playwright đo trên dev server cổng 3000 (không phải 3100 như Acceptance) vì Next chặn server thứ hai; chỉ GET, không đổi trạng thái. Ghi nhận residual, không ảnh hưởng code.

## Residual risk
- Dữ liệu dev không có tin `bathrooms >= 4` và không đủ cho trang 2: "4+" và giữ tham số khi phân trang/sort chỉ chứng minh bằng unit + integration (đủ mạnh vì đi qua cùng `rentalListQueryString`/`postQueryString`).
- Responsive xác minh bằng ảnh builder + tái dùng component; reviewer không chạy browser.
- Doc reconcile (`docs/API_SPEC.md` §3.3 + bảng Tin BĐS, `.context/design-spec.md` §3.5/BL-052) do change-request lo — chưa có trong phạm vi task.

## Verdict
**PASS** — không CRITICAL/MAJOR; 4 MINOR không chặn.
