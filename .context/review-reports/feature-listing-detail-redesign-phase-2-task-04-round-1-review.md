Agent: reviewer

# Review — feature-listing-detail-redesign · phase-2-task-04 · round 1 (BL-052, gap G1: số đếm ô Tiện ích `/cho-thue`)

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a8dac0ad1547957b1` (branch `worktree-agent-a8dac0ad1547957b1`, base staging `2abc135`), code chưa commit.
- Review level: **STRICT**
- Reason: truy vấn SQL công khai mới (đầu vào người dùng trong SQL), thêm 1 query vào mọi lượt tải `/cho-thue` (hiệu năng), đổi shape `RentalListingFacets` (type dùng chung giữa service và UI).
- Blast radius: `src/lib/search/rental-search-sql.ts` (`RentalFacetDimension`, `rentalConditions` — dùng bởi `rentalWhere` cho search API + lưới + facets), `src/lib/search/search-service.ts` (`PostgresRentalSearch.listing/facets`, `toFacets`, mới `toAmenityCounts`), `src/components/rentals/rental-list-state.ts` (`toFilterOptions`), `RentalListBody.tsx`, `RentalListPage.tsx`. `RentalListingFacets` không trả qua route API công khai nào (Grep `src/app` không có `.listing(`/`facets`) → không đổi contract `docs/API_SPEC.md`.
- `src/payload-types.ts`: `git diff --ignore-cr-at-eol --stat` và `git diff -w --stat` rỗng → chỉ EOL, không thuộc task.
- Không đụng file P3-T01 (`PropertyPosts.ts`, `migrations/*`, `Rentals.ts`, `src/shared/listing-options.ts`, `docs/ERD.md`): xác nhận qua `git status --short` (8 file đã kể + payload-types EOL).

## Kiểm riêng theo yêu cầu

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| SQL injection / tham số hoá | OK | `amenityCounts` chỉ ghép fragment `sql\`\``; giá trị tiện ích đi qua `${value}` (`rental-search-sql.ts:114`); không `sql.raw` mới. Tên cột/bảng là hằng. |
| Điều kiện công khai giống lưới | OK | Cùng `rentalFrom(params.locale)` (join `rentals_locales` theo locale) + `conditions.scope` (`publicConditions`: status công khai, `deleted_at IS NULL`, `en` → `has_english`; `available` → `status='published'`) — đúng nguồn với `rentalWhere`. Integration test chèn `pool` vào tin đã thuê `f` + tin nháp → không được tính (`pool: 1`). |
| Đếm khớp khi có/không chọn tiện ích | OK | `filterConditions(conditions, "amenity")` bỏ cả cụm EXISTS tiện ích, giữ category/province/other. Integration: `amenities=pool,kitchen` và không chọn cho ra cùng số đếm; `bedrooms=1` thu hẹp; tỉnh DN → toàn 0. Unit: query đếm không chứa EXISTS tiện ích, vẫn chứa `bedrooms`/`province_id`; GROUPING SETS vẫn AND tiện ích (4 EXISTS). |
| Giá trị tiện ích lạ | OK | Đầu vào: schema đã loại giá trị ngoài danh sách (test cũ `gym,khong-co`). Dữ liệu DB lạ: `toAmenityCounts` dùng `Object.hasOwn` trên map khởi tạo từ `RENTAL_AMENITIES` → bỏ `sauna`, `constructor` (unit test). |
| `DISTINCT` / nhân dòng | OK | `count(DISTINCT r."id")` + `GROUP BY ra."value"` → giá trị lặp trong hasMany không đếm đôi. |
| Lỗi truy vấn → UI không vỡ | OK | Query chạy trong `Promise.all` của `facets()` → lỗi đi chung nhánh lỗi listing sẵn có; `RentalListPage` truyền `result?.facets.amenities ?? null` → `toFilterOptions` không gắn `amenityCounts` → ô tích hiện không số. Test trạng thái lỗi: `Hồ bơi` không có số, sidebar vẫn render. |
| Quy tắc faceted so với `/du-an` | OK | `/du-an` `computeFacets`: `feature: countBy(without("feature"), …)` (`src/lib/projects/project-list-facets.ts:174`) — bỏ toàn chiều tiện ích, tiện ích đang chọn vẫn có khoá. `/cho-thue` cùng nghĩa (đủ khoá, thiếu = 0). |
| Index `rentals_amenities.parent_id` | OK | `migrations/20261020_095907_rentals_amenities.ts:24` `CREATE INDEX "rentals_amenities_parent_idx" … ("parent_id")`. |
| Hiệu năng | OK (residual) | +1 query song song (4→5), join qua index parent; builder đo +2–4ms local (32 tin). Không có index `value` nhưng GROUP BY trên tập đã lọc — chấp nhận ở quy mô hiện tại. |
| a11y tên ô tích có số | OK | Component dùng chung `CheckboxFacetList` (`src/components/listing/FilterFacets.tsx:153-164`) — số đếm nằm trong `<label>` → tên truy cập `Hồ bơi(3)`, giống `/du-an`; mục đếm 0 chỉ mờ (`opacity-60`), không disable — test xác nhận `Bếp riêng(0)` đang tích vẫn enabled. |
| Chip Phòng ngủ / Nội thất không số | OK | Test: label radio `Đầy đủ` / `2` khớp `^…$` (không số). |

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 errors, 2 warnings ở `tools/task-dashboard/server.mjs` (có sẵn, ngoài diff) |
| `pnpm test` (full) | 377/381 files pass, 3752 tests pass; 4 file integration FAIL do `beforeAll` hook timeout 10s (vd `tests/integration/session-refresh.test.ts:28`) khi chạy song song toàn suite — môi trường/tải, không thuộc diff (đã biết, như builder báo) |
| `pnpm exec vitest run tests/integration/rental-search.test.ts src/lib/search src/components/rentals` | PASS — 11 files, 185 tests (integration rental-search chạy thật trên DB, không skip) |
| `pnpm build` | skip — builder báo PASS; diff không đổi config/route, typecheck PASS |

## Responsive Checklist Gate

Diff UI chỉ truyền thêm prop `count` vào component có sẵn; không đổi CSS/markup. Xác minh bằng CSS math (không có browser):
- Layout (no horizontal scroll): OK — hàng label `flex`, chữ `min-w-0 flex-1 break-words`, số `shrink-0` ngắn (`(n)`) → không tràn ở 375/768/1280.
- Typography/spacing: OK — `text-small`/`text-xsmall` token (rem), không px mới.
- Media: N/A.
- Touch target: OK — label `min-h-11` (44px) mobile, `lg:min-h-10`.
- Viewport/A11y: N/A (không đổi vh/motion); không dùng `overflow:hidden` che lỗi.

## Skill gates

- aislop: skip — không chạy (ngoài allow-list verify commands của profile); diff nhỏ, tên rõ, hàm ngắn.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint `pnpm lint` 0 error.
- ocr (open-code-review): skip, ocr not installed / không trong allow-list.
- AI-readable: OK — 0 indicator (hàm mới < 20 dòng, tên `amenityCounts`/`toAmenityCounts` rõ, comment nêu WHY: DISTINCT vì join nhân dòng, truy vấn riêng vì nhân dòng). File `search-service.ts` ~246 dòng (< 300).
- ai-friendly-web: N/A (không đổi SEO/robots/sitemap).
- blitzstrike: skip — chưa cấu hình môi trường pentest; SQL tham số hoá kiểm bằng đọc code.

## Findings

- [MINOR] `tasks/feature-listing-detail-redesign/phase-2-task-04.md:12` — Blast radius ghi `src/lib/rentals/rental-list-queries.ts` / `listRentals()` không tồn tại; thực tế là `src/lib/search/rental-search-sql.ts` + `search-service.ts` (`PostgresRentalSearch.listing`). Acceptance chưa tick, chưa có Verification summary + số đo (+2–4ms). Fix: cập nhật ở close-out.
- [MINOR] `tests/integration/rental-search.test.ts:686` — chưa có ca `locale=en` cho số đếm tiện ích (tin thiếu `has_english` không được tính). Rủi ro thấp vì dùng chung `scope`/`rentalFrom` với lưới đã test; có thể bổ sung sau.
- [MINOR] Full `pnpm test` có 4 file integration timeout `beforeAll` dưới tải song song — ngoài scope, đề xuất task riêng (tăng `hookTimeout` cho project integration).

Không có CRITICAL / MAJOR.

## Residual risk

- Hiệu năng chỉ đo local 32 tin; chưa có `EXPLAIN` trên dữ liệu lớn. Không index `rentals_amenities.value` — nếu số tin lớn có thể cân nhắc index `(value, parent_id)` (task riêng, đụng migrations thuộc P3-T01 nên không làm ở đây).
- Build không chạy lại (tin builder PASS).

## Verdict

**PASS**
