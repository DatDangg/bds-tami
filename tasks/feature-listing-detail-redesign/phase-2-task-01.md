# feature-listing-detail-redesign · phase-2-task-01 — Dữ liệu danh sách Cho thuê (tham số `project`, số đếm, nổi bật) + thẻ Cho thuê mới

- Nguồn: BL-052 change doc mục "Cho thuê".
- Spec: 1.46.0 khối BL-052 mục "`/cho-thue`", "Trang danh sách (khung chung)" (số đếm, nổi bật).
- Plan: phase 2 wave A (song song P2-T03).
- Phụ thuộc: phase 1 xong (component listing/detail, quy ước số đếm).

## Classification / Risk
- Type: **MODIFY** (+ tham số API mới, additive, không migration).
- Risk: **HIGH** — API contract `GET /api/public/rentals`, query công khai, thẻ dùng chung (trang chủ RentalsTabs/HomeRentals, "Căn tương tự").
- Expected review level: **STRICT**.
- Blast radius: `src/shared/types/api.ts` (`rentalSearchParamsSchema` + `project`), endpoint public rentals, `src/lib/rentals/*` (`rental-list-queries`, `rental-queries`, `rental-view`, `active-filters`), `src/components/rentals/RentalCard.tsx`, `docs/API_SPEC.md`.

## Scope
1. Tham số MỚI `project` (slug dự án công khai; lạ → bỏ qua, không 400 ở trang; API: theo quy ước slugParam — slug không tồn tại trả rỗng/bỏ qua, ghi quyết định) ở trang `/cho-thue` (+ danh mục) và `GET /api/public/rentals`. Danh sách dự án cho ô chọn: dự án có ≥ 1 tin cho thuê công khai.
2. Facet counts (quy tắc "mọi bộ lọc khác trừ chính chiều đó"): tab danh mục (gồm "Tất cả"), tỉnh (chỉ tỉnh có tin công khai). Truy vấn gộp/đếm theo nhóm hiệu quả — p95 ≤ 500ms (đo trên dev, ghi số).
3. Nổi bật: ≤ 5 tin `isFeatured` còn trống khớp bộ lọc, chỉ trang 1, không lặp trong lưới (phân trang trên phần còn lại; `totalDocs` gồm nổi bật). Nếu tách khỏi phân trang DB khó → ghi phương án (vd loại id nổi bật bằng `id not in`) + test.
4. View thẻ: tag danh mục + nội thất, giá/tháng (hoặc "Thương lượng"/"Liên hệ" như hiện tại), diện tích, phòng ngủ, phòng tắm, vị trí; `RentalCard` mới theo khung thẻ dự án (ảnh + badge Đã thuê nếu có, tiêu đề, vị trí, tag, giá, thông số, nút mũi tên; không tim). Biến thể `listing` cho danh sách / "Căn tương tự"; **trang chủ (`RentalsTabs`/`HomeRentals`) giữ biến thể hiện tại**. `SimilarRentals` thuộc P2-T03.
5. `docs/API_SPEC.md` thêm `project`.

## Acceptance
- [ ] Test schema param `project`, test query đếm + nổi bật không lặp, integration `GET /api/public/rentals?project=`.
- [ ] Trang chủ khối Cho thuê vẫn render, giữ giao diện thẻ cũ.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Quyết định (builder)
- **SQL thay vì quét bộ nhớ** (khác Dự án): Cho thuê đã có `PostgresRentalSearch` (SQL tham số hoá, index) và số tin có thể lớn → giữ SQL. Trang `/cho-thue` gọi `PostgresRentalSearch.listing` (qua `listRentals` ở `rental-list-queries.ts`); `search` (API) giữ nguyên khung response.
- **`listing` = 4 truy vấn song song, 1 round-trip**: (1) đếm `total` + `LEAST(count FILTER is_featured, 5)`; (2) lưới với `r.id NOT IN (truy vấn con ≤ 5 id nổi bật mới nhất của CÙNG `where`)` — bí danh `r`/`rl` bên trong che bí danh ngoài nên dùng lại `where` nguyên văn, lưới không lặp nổi bật ở MỌI trang; (3) thẻ nổi bật chỉ khi `page === 1` (mới nhất trước, bất kể `sort`, như Dự án); (4) số đếm một lượt quét `GROUPING SETS ((root), (province), ())` với hai cờ boolean "khớp mọi lọc trừ danh mục" / "trừ tỉnh". `total` gồm nổi bật; `totalPages = ceil((total − số nổi bật) / limit)`.
- **Tách điều kiện**: `rentalConditions(params)` → `scope` (công khai + `available`, không bao giờ bị bỏ khi đếm) · `byDimension.category` · `byDimension.province` (**gồm `ward`** — phường chỉ có nghĩa trong tỉnh, nên đếm tỉnh bỏ cả phường) · `other`. `rentalWhere` = scope + mọi lọc (hành vi cũ không đổi).
- **Tab danh mục** đếm theo danh mục **cấp 1** (`COALESCE(parent_id, id)` qua LEFT JOIN, danh mục xoá mềm không tính; tin không danh mục chỉ vào "Tất cả"). Khoá = id danh mục → `CategoryOption` thêm `id`. **Tỉnh**: chỉ tỉnh có ≥ 1 tin công khai **còn trống**; `toRentalProvinceFacets` ghép tên/slug từ `listProvinces`, sắp theo tổng không lọc giảm dần, hoà theo `sortOrder` (như `/du-an`). Chỉ hai chiều này (đúng scope); chiều khác (nội thất, phòng ngủ, tiện ích) P2-T02 cần thì thêm cờ boolean vào cùng truy vấn.
- **`project`** (schema `slugParam`): khớp tin có `project_id` thuộc dự án **công khai** (`published`, chưa xoá mềm, `en` cần `hasEnglish`) theo slug của `locale`. API: slug lạ / dự án nháp → **200 rỗng** (cùng quy ước `category`/`province`), không 400. Trang: `dropUnknownSlugs` bỏ slug không có trong `options.projects`. Đứng sau `ward` trong URL (`QUERY_KEYS`), tính 1 lọc (`activeFilterCount`) → `noindex`.
- **Ô "Dự án"**: `listRentalProjectOptions` (SQL `projectOptionsQuery`) = dự án công khai có ≥ 1 tin công khai **còn trống** (phạm vi trang danh sách), theo tên; `RentalFilterOptions.projects`.
- **`RentalCard` DTO** thêm `category: { name, slug } | null` (danh mục CỦA TIN, có thể là con; `/en` cần danh mục `hasEnglish`) — additive cho API, đã ghi `docs/API_SPEC.md`.
- **Thẻ**: `RentalCard` prop `variant` — `listing` (mặc định: badge "Đã thuê" **chỉ khi đã thuê** — tin còn trống không badge, theo spec "badge (Đã thuê nếu có)"; ghim khu vực; tag danh mục + nội thất; giá/tháng hoặc "Thoả thuận"; diện tích · PN · PT (+ `sr-only` đầy đủ) + mũi tên) và `home` (markup BL-045 giữ nguyên, chỉ `RentalsTabs` truyền). `data-card-variant` trên `article`. `SimilarRentals` (P2-T03) và tin cho thuê trong trang dự án (`ProjectListings`) tự nhận thẻ `listing` — không sửa file của họ. `RentalCardData` thêm `rented`, `categoryLabel`, `furnishing`, `bathrooms`; `RENTAL_CARD_FIELDS` thêm `category` + `furnishing`.
- **`RentalListPage` (tạm tới P2-T02)**: gọi `listRentals`, tải `projects`, đặt thẻ nổi bật đầu lưới trang 1 (tin nổi bật không biến mất) — không đổi bố cục.
- i18n namespace mới **`rentalCard`** (cuối vi/en). Icon mới `Bathtub` trong `src/components/icons.ts`.
- Bench `scripts/bench/rentals-search.ts`: thêm `BENCH_METHOD=listing`, cột `is_featured` cho tin giả, 2 kịch bản (tỉnh, dự án).

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning có sẵn ở `tools/task-dashboard/server.mjs`) · `pnpm test` **380 file / 3839 test PASS** (gồm integration, DB `tami_wt52_p2t01`, Redis DB 8).
- Unit mới: `search-service.test.ts` (listing: NOT IN, trang > 1 không nổi bật, LEAST trần, `toFacets`), `rental-list-queries.test.ts` (`dropUnknownSlugs` project, `toRentalProvinceFacets`), mở rộng `rental-search-sql.test.ts` (project tham số hoá + công khai, `projectOptionsQuery`, tách chiều), `url-params.test.ts` (project), `rental-view.test.ts`, `RentalCard.test.tsx` (home / listing), `HomeRentals.test.tsx` (trang chủ giữ `home`).
- Integration `tests/integration/rental-search.test.ts` khối "BL-052: project + listing" 7 test (DB tạm): `?project=` đúng tập, slug lạ / dự án nháp → rỗng; nổi bật ≤ 5 không lặp lưới qua 2 trang, `total` gồm nổi bật; số đếm tab cấp 1 + Tất cả + tỉnh; ô Dự án; endpoint `GET ?project=` 200.
- **p95** — bench SQL 100.000 tin giả (DB worktree, `BENCH_RUNS=20`): `listing` p95 **151ms** (p50 117ms; kịch bản chậm nhất `sort giá tăng` p95 183ms); `search` (API) p95 **79ms**. Lần đo đầu (ROOT_CATEGORY là truy vấn con tương quan) p95 355ms / kịch bản mặc định 604ms → đổi sang LEFT JOIN. Dev server (`pnpm dev -p 3201`, 27 tin công khai): `GET /api/public/rentals` p95 **34ms** (n=40, 5 tổ hợp), `/cho-thue` p95 **481ms** (n=30, 5 tổ hợp; chế độ dev — render React dev chiếm phần lớn, phần SQL < 20ms).
- Trình duyệt (dev 3201, DB worktree; đặt 6 tin `isFeatured` + 5 tin gắn dự án + thêm khối `rentals` vào `homepage_block_order` CHỈ trên DB worktree): `/cho-thue` 17 thẻ `listing` (5 nổi bật + 12), "27 căn"; `?page=2` 10 thẻ (27 − 5 − 12); `?project=du-an-mau-can-ho-song-sai-gon` 5 căn; `?project=khong-co` bị bỏ → 27; `/cho-thue/danh-muc/van-phong` 6; 375px không tràn ngang; `/` 24 thẻ Cho thuê đều `home` (badge Còn trống, không tag/PT). Server đã dừng.


## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-2-task-01-round-1-review.md` — **STRICT PASS**. MINOR: (1) `docs/ARCHITECTURE.md:127` còn `searchRentals` → `listRentals` + `listRentalProjectOptions` (P3-T06 doc reconcile); (2) `docs/API_SPEC.md` 2 dòng chỉ đổi khoảng trắng (P3-T06 hoàn lại); (3) `RentalCard` `key={tag}` thêm tiền tố (P2-T02); (4) ô "Dự án" chỉ dự án có tin còn trống — chặt hơn AC, giữ (ghi as-built).

## Verification summary (close-out)
- Acceptance: **PASS**. typecheck · lint 0 error · test 380 file / 3839 PASS (trước khi xoá `searchRentals`; sau xoá rentals/home 201 PASS) · reviewer 33 file / 442 PASS. p95 SQL listing 151ms @100k tin.
