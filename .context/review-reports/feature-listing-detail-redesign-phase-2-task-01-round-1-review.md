Agent: reviewer

# Review — feature-listing-detail-redesign · phase-2-task-01 · round 1

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a3cf329c1da664252` (branch `worktree-agent-a3cf329c1da664252`, base 73543c7, chưa commit). `payload-types.ts` / `importMap.js` chỉ đổi EOL, bỏ qua.
- Review level: **STRICT**
- Reason: đổi API contract dùng nhiều client (`GET /api/public/rentals`: thêm tham số `project`, thêm khoá `category` vào DTO `RentalCard`); SQL thô mới (truy vấn con `project`, `NOT IN` cho tin nổi bật, `GROUPING SETS` cho số đếm); component dùng chung `RentalCard` (trang chủ, danh sách, tin tương tự, trang dự án); quy tắc hiển thị công khai (published/rented, `hasEnglish` ở /en, `showExactAddress`).
- Blast radius: `src/lib/search/{rental-search-sql,search-service,url-params}.ts`, `src/shared/types/api.ts` (schema + DTO), `src/lib/rentals/{rental-list-queries,rental-view,rental-queries}.ts`, `RentalCard.tsx` (dùng ở `RentalListPage`, `RentalsTabs` (trang chủ), `SimilarRentals`, `ProjectListings`), `RentalListPage.tsx`, i18n vi/en (namespace `rentalCard`), `icons.ts`, `docs/API_SPEC.md`, bench script. Client của API: Sheet "Xem n tin" (`rentalCountApiPath`) giờ gửi thêm `project`.

## Verify commands + result (chạy trong worktree, DB `tami_wt52_p2t01`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 lỗi, 2 cảnh báo có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm test src/components/rentals src/lib/rentals src/lib/search src/components/home src/lib/home src/shared/types src/components/layout/PendingRegionSources.test.tsx tests/integration/rental-search.test.ts` | PASS: **33 file / 442 test**, không test nào bị skip (test endpoint `skipIf(!hasRedis)` đã chạy) |

Đã kiểm `searchRentals` sau khi xoá: không còn tham chiếu trong code. Chỉ còn tên biến mock cục bộ trong `src/lib/home/home-queries.test.ts:12` (mock `PostgresRentalSearch.search`, không phải import, vẫn hợp lệ) và một chỗ trong doc `docs/ARCHITECTURE.md:127` (xem MINOR-1).

## Trọng tâm STRICT: đã kiểm
- **SQL an toàn:** `project`, `category`, `province`, `ward`, `locale`, giá, tiện ích đều đi qua tham số `${}` của `sql` (`rental-search-sql.ts:56-59`, `:339-344`). `LIMIT ${RENTAL_FEATURED_LIMIT}` là tham số. `sql.raw` chỉ còn ở `rentalOrderBy` với alias là hằng nội bộ. `slugParam` của zod kiểm định dạng ở API. Không có đường injection.
- **`project` lạ hoặc chưa công khai:** API: `projectCondition` là truy vấn con IN theo slug + `publicProjectConditions` (`PUBLIC_STATUSES.default`, `deleted_at IS NULL`, `/en` cần `has_english`), nên kết quả là 200 rỗng. Integration `:640-641` (slug lạ, dự án nháp) và `:704-706` (endpoint 200 rỗng) bao phủ. Trang: `dropUnknownSlugs` bỏ slug không có trong `options.projects` (`rental-list-queries.ts:120`).
- **Số đếm trừ chính chiều đó:** `byDimension.province` gồm cả `ward`, nên đếm tỉnh bỏ cả phường (unit `rental-search-sql.test.ts:219-221`). `scope` không bao giờ bị bỏ. Danh mục cấp 1 qua `COALESCE(rc.parent_id, rc.id)` với LEFT JOIN, không tính danh mục đã xoá mềm. Danh mục con được đếm vào cha (integration `:674-677`).
- **Nổi bật:** chỉ lấy tin còn trống (`scope` có `available`) khớp bộ lọc, chỉ ở trang 1. `featuredIdsQuery` và truy vấn thẻ nổi bật dùng cùng `where`, cùng `is_featured`, cùng `rentalOrderBy("newest")` (có `id DESC` chốt thứ tự), cùng `LIMIT 5`, nên tập id bị loại khỏi lưới trùng đúng với tập thẻ được hiện, kể cả khi trùng `published_at`. `NOT IN` áp dụng ở mọi trang. `total` gồm nổi bật, `totalPages = ceil((total − LEAST(featured, 5)) / limit)`. Integration `:645-662` kiểm qua 2 trang, trần 5, 2 tin nổi bật vượt trần nằm trong lưới, tin nổi bật đã thuê bị loại.
- **Quy tắc công khai:** `publicConditions` không đổi. Danh mục trên thẻ đi qua `categories_locales` theo `locale`, `/en` cần `has_english`, bỏ danh mục đã xoá mềm. Địa chỉ vẫn là `CASE WHEN show_exact_address` và thẻ `listing` không hiện địa chỉ. `projectOptionsQuery` chỉ trả slug + tiêu đề của dự án công khai.
- **p95:** builder đo `listing` p95 151ms, `search` 79ms trên 100k bản ghi (bench `BENCH_METHOD=listing`), dưới ngân sách 500ms. Reviewer không chạy lại bench (ngoài danh sách lệnh được phép), ghi vào Residual risk.
- **Shape thẻ:** `category: {name, slug} | null` chỉ thêm khoá (additive). Response giữ `{ items, total, page, totalPages }`. Đã ghi `docs/API_SPEC.md`.
- **Trang chủ giữ thẻ cũ:** `RentalsTabs.tsx:32` truyền `variant="home"`. `HomeBody` giữ nguyên markup BL-045. `HomeRentals.test.tsx` có kiểm.
- **RentalListPage tạm:** trang 1 hiện tin nổi bật trước, lưới sau (17 thẻ), và thẻ không bị mất. Phân trang đúng (trang 2 = total − 5 − 12).
- **noindex khi có `project`:** `activeFilterCount` tính `project`, nên `hasNarrowingParams` trả true (`url-params.ts:126`, test `url-params.test.ts:182`).

## Responsive Checklist Gate (diff có đụng UI: `RentalCard` biến thể `listing`)
Không có browser. Kiểm bằng cách đọc class/CSS, kèm bằng chứng builder đo ở 375px.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | `ListingBody` dùng `flex-wrap` + `min-w-0` cho tag và thông số, không có width px cố định. Builder ghi 375px không tràn |
| Mobile-first / grid auto | N/A | diff không đổi grid của trang (khung lưới thuộc P2-T02) |
| Container không fixed px | OK | không thêm `w-[..px]` |
| Typography rem / token | OK | dùng class token `text-small` / `text-xsmall` / `text-body`, không `px` |
| Media | OK | giữ `aspect-[11/10]` + `ResponsiveImage` có `sizes` (`DEFAULT_SIZES`) |
| Touch target ≥ 44px | OK | cả thẻ là một link. `CardArrow` chỉ để trang trí, nằm trong link |
| Nav hamburger / table | N/A | không đụng |
| 100vh / reduced-motion | N/A | không thêm animation hay viewport unit (hover zoom dùng `CARD_IMAGE_ZOOM` có sẵn) |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở khung ảnh, có sẵn từ trước |

## Skill gates
- aislop: skip, lệnh `aislop` không nằm trong danh sách lệnh verify được phép của reviewer.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (không có `.oxlintrc*`). ESLint 0 lỗi.
- ocr (open-code-review): skip, ocr chưa được cài hoặc không được phép chạy.
- AI-readable: OK, có 1 indicator (MINOR-1: doc kiến trúc chưa cập nhật tên hàm đã đổi), dưới ngưỡng 3. Kích thước file: `search-service.ts` 216 dòng, `RentalCard.tsx` 161, `rental-search-sql.ts` 144, `RentalListPage.tsx` 259 (≤ 300). Không hàm nào vượt 50 dòng. Hằng `RENTAL_FEATURED_LIMIT` có tên. Comment giải thích WHY.
- ai-friendly-web: N/A, task không đổi `robots`/`sitemap`/`llms`.
- blitzstrike: skip, không có môi trường được phép. Đã kiểm SQL injection thủ công ở trên.

## Findings
- **[MINOR-1]** `docs/ARCHITECTURE.md:127` vẫn ghi "`searchRentals` cho S04", nhưng hàm này đã bị xoá. Cách sửa: đổi thành `listRentals` (`PostgresRentalSearch.listing`) + `listRentalProjectOptions`. Đây là doc impact as-built, làm khi close-out.
- **[MINOR-2]** `docs/API_SPEC.md` có 2 dòng không liên quan (`POST /api/admin/translations/pages/:id/approve` và đoạn "As-built layer-9-task-03 — giao lead") chỉ đổi khoảng trắng. `git diff --ignore-all-space` cho thấy 2 dòng này biến mất. Đây là drive-by. Cách sửa: hoàn lại 2 dòng đó để diff chỉ còn thay đổi của BL-052.
- **[MINOR-3]** `src/components/rentals/RentalCard.tsx` (`ListingBody`, `tags.map` dùng `key={tag}`): nếu tên danh mục trùng chữ với nhãn nội thất thì React báo trùng key. Cách sửa: dùng key có tiền tố, ví dụ `category:`/`furnishing:`.
- **[MINOR-4]** Ô "Dự án" dùng tiêu chí "≥ 1 tin công khai **còn trống**" (`rental-search-sql.ts:339-344`), chặt hơn AC "≥ 1 tin cho thuê công khai". Builder đã ghi quyết định này, và nó nhất quán vì trang chỉ liệt kê tin còn trống. Ghi lại để spec-validator đối chiếu, không chặn.

## Residual risk
- p95 151ms là số đo của builder (bench 100k bản ghi, DB worktree). Reviewer không chạy lại vì ngoài danh sách lệnh được phép.
- Lúc chạy test có cảnh báo pg "client.query() when the client is already executing". `listing` chạy 4 truy vấn song song qua `sqlExecutorOf(payload)`. Trên Pool ở production thì chạy song song thật. Nếu executor bị gắn vào một client đơn (transaction hoặc test) thì các truy vấn chạy tuần tự, không sai kết quả.
- Tin nổi bật ở trang khác 1 vẫn bị loại khỏi lưới mà không hiện: đúng thiết kế (slider chỉ có ở trang 1, như `/du-an`). P2-T02 cần hiển thị slider đúng như vậy.

## Verdict
**PASS**: không có CRITICAL hay MAJOR. 4 MINOR nên xử lý khi close-out (MINOR-1 thuộc doc reconcile, MINOR-2 và MINOR-3 sửa nhỏ).
