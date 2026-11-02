Agent: spec-validator

# Phase review — feature/bathrooms-filter (BL-104, ADDITIVE) · phase 1 · round 1

- Mode: Phase review (đã build đúng và đủ so với spec delta chưa)
- Nguồn: `spec/changes/2026-11-02-bathrooms-filter.md` (Acceptance), `git diff SPECIFICATIONS.md` (1.62.0: mục `/cho-thue` Phòng tắm, mục `/tin-bds` Phòng tắm, F3 danh sách bộ lọc), `spec/updates/2026-11-02-bathrooms-filter.md`, `spec/test-scope/current.json` (scopeVersion 107), `tasks/feature-bathrooms-filter/phase-1-task-01.md` (Builder log), `.context/review-reports/feature-bathrooms-filter-phase-1-task-01-round-1-review.md` (STRICT PASS, 4 MINOR)
- Code: `git diff` của 23 file trong `src/lib/search`, `src/shared/types/api.ts`, `src/lib/rentals`, `src/components/rentals`, `src/lib/posts`, `src/components/posts`, `src/i18n/messages`, `tests/integration/rental-search.test.ts` (file dirty khác không thuộc change thì bỏ qua)
- Không chạy lại verify. Dùng kết quả của builder/reviewer: typecheck PASS, lint PASS, test 461 file / 4863 test PASS, integration rental-search 55/55.

## Verdict: PASS (implementation COMPLETE), còn 1 gap [PARTIAL] trong artifact test-scope

Mọi acceptance của change doc và mọi mệnh đề của spec delta đều có bằng chứng trong code và test. Không có [MISSING]. Gap còn lại nằm trong metadata bàn giao cho tester (`spec/test-scope/current.json`), change-request sửa được lúc close-out, không cần builder. Ngoài ra có 3 ghi chú cần làm rõ, không chặn.

## Ma trận coverage

| # | Requirement | Nguồn | Status | Bằng chứng / ghi chú |
|---|---|---|---|---|
| 1 | `/cho-thue` có ô Phòng tắm cùng kiểu với Phòng ngủ (chip Tất cả · 1 · 2 · 3 · 4+) | change doc AC1; SPEC `/cho-thue` "Phòng tắm (BL-104)" | ✅ | `RentalListBody.tsx` thêm `FilterGroup` `fields.bathrooms` ngay sau Phòng ngủ, `ChipChoice name="bathrooms"` dùng chung `BEDROOM_VALUES` (MINOR 2 đã sửa); test `RentalListPage.test.tsx` |
| 2 | `/tin-bds` có ô Phòng tắm cùng kiểu với Phòng ngủ | AC1; SPEC `/tin-bds` "Phòng tắm (BL-104)" | ✅ | `PostListBody.tsx` thêm `FilterGroup` `list.filterGroups.bathrooms` sau Phòng ngủ, `POST_BATHROOM_VALUES = POST_BEDROOM_VALUES` (`post-filters.ts`); `PostListPage.test.tsx` kiểm thứ tự legend VI/EN và 2 bộ radio |
| 3 | `4` = từ 4 trở lên, 1–3 đúng số | AC1, AC3 | ✅ | Cho thuê: `rental-search-sql.ts` `r."bathrooms" >= 4` / `= $n`; Tin BĐS: `post-list-facets.ts` `matchesRoomCount` (`chip >= 4 ? value >= chip : value === chip`). Test: `rental-search-sql.test.ts`, `post-listing-queries.test.ts`, integration `bathrooms: 4` trả cả căn 4 và căn 6 |
| 4 | URL `bathrooms` đọc/ghi giống `bedrooms`, giá trị lạ bị bỏ qua | AC2 | ✅ | `url-params.ts` (`QUERY_KEYS` có `bathrooms` sau `bedrooms`, `bathroomsFromUrl`); `post-filters.ts` (`parseRoomCount`, `postQueryString` set `bathrooms`, `hasPostFilterParams`); test `url-params.test.ts`, `post-filters.test.ts`. Ghi chú N1 về `0` |
| 5 | Chip "đang lọc" + nút xoá | AC2; SPEC `/cho-thue` | ✅ (Cho thuê) | `active-filters.ts` `ActiveFilterKind`/`KIND_ORDER` có `bathrooms`; `use-active-filter-chips.ts` nhãn `active.bathrooms`; `filtersWithout` nhánh default; test `active-filters.test.ts`, `RentalListPage.test.tsx` (gợi ý bỏ điều kiện có chip "Phòng tắm: 4+") |
| 5b | Chip "đang lọc" ở `/tin-bds` | AC2 (câu chữ chung) | ⚠️ ghi chú N2 | Trang Tin BĐS không có cơ chế chip cho `bedrooms`; SPEC `/tin-bds` delta không đòi chip. Builder theo đúng kiểu phòng ngủ: dùng huy hiệu `POST_ACTIVE_FILTER_SPEC.single` và "Xoá tất cả" |
| 6 | Giữ khi phân trang / đổi sort | AC2 | ✅ | Cả hai trang dựng query string theo danh sách khoá cố định (`rentalListQueryString`, `postQueryString`). Test: link phân trang + tab giữ `bathrooms=3` (`PostListPage.test.tsx`), round-trip (`url-params.test.ts`). Dữ liệu dev không có trang 2 nên không kiểm được bằng E2E (residual của builder) |
| 7 | Lọc đúng dữ liệu; tin không nhập phòng tắm không khớp | AC3; SPEC | ✅ | SQL: NULL không thoả `=`/`>=`; facet: `typeof value === "number"`; `post-queries.ts` thêm `bathrooms: true` vào `POST_SCAN_FIELDS`. Integration: căn "e" không có bathrooms không xuất hiện ở 1–4; unit Tin BĐS: tin không có `bathrooms` bị loại |
| 8 | `GET /api/public/rentals` nhận `bathrooms` như `bedrooms` | SPEC `/cho-thue`; spec update | ✅ | `api.ts` `bathrooms: wholeNumber(4)`. Endpoint `src/endpoints/public/rentals.ts:25` parse cả schema rồi gọi `searchService.search` → `rentalConditions`. Test: `api.test.ts` (0..4 OK; 5/-1/1.5/abc bị từ chối), integration `bathrooms=5`/`-1` → 400 |
| 9 | Nhãn VI/EN đủ | AC4 | ✅ | `vi.json`/`en.json`: `rentals.fields.bathrooms`, `rentals.bathroomsOption.1-4`, `rentals.active.bathrooms`, `posts.list.filterGroups.bathrooms`, `posts.list.bathroomsOption.1-4` (VI "Phòng tắm" / EN "Bathrooms"). Test EN ở cả hai trang |
| 10 | Responsive như các ô lọc hiện có (Sidebar ≥ lg, Sheet < lg) | AC4 | ✅ | Dùng chung `FilterGroup`/`ChipChoice` của khung lọc nên Sidebar và Sheet render cùng thành phần. Playwright 1440 + 390 với ảnh `.context/review-reports/assets/bl104-*.png`, Sheet mobile có ô, không cuộn ngang |
| 11 | Badge "Bộ lọc (n)" và noindex tính `bathrooms` | Task Hướng làm §1, §3 | ✅ | `activeFilterCount` có `filters.bathrooms` → `hasNarrowingParams` noindex (comment đã sửa, MINOR 1); `RENTAL_ACTIVE_FILTER_SPEC.single`, `POST_ACTIVE_FILTER_SPEC.single`; `hasPostFilterParams` có `raw.bathrooms`. Redirect BL-055 `legacyCategoryOnly` xét chung mọi khoá nên tự đúng |
| 12 | Test parse URL + điều kiện lọc | AC5 | ✅ | Test các phần: url-params, rental-search-sql, api zod, active-filters, rental-filter-params, RentalListPage, post-filters, post-listing-queries, PostListPage; integration DB `rental-search.test.ts` |
| 13 | Cập nhật API_SPEC (tham số mới) | AC5; Doc Impact | ✅ | `docs/API_SPEC.md` (phần BL-104 trong bản diff): dòng tham số §3.3 `bathrooms` 0–4; trường `bathrooms` trong item; dòng "Cùng khoá với §3.3" ghi rõ trang 1–4, `0` bị bỏ, API 0–4 (giải quyết MINOR 3); bảng tham số Tin BĐS `bathrooms` 1–4 |
| 14 | Cập nhật design-spec nếu có mô tả bộ lọc | AC5 | ✅ | `.context/design-spec.md` khối BL-052 "Theo màn": S04/S05 và S08 có thêm "Phòng tắm (BL-104…)". Ghi chú N3 về câu chữ |
| 15 | Không đổi hành vi phòng ngủ | Task §4; test-scope regression | ✅ | Đổi tên `parseBedrooms` thành `parseRoomCount` và `matchesRoomCount`, logic giữ nguyên. Test bedrooms cũ vẫn PASS |
| 16 | Không schema/migration; quyết định index | change doc Ghi chú | ✅ | Không có file migration. Builder ghi quyết định không thêm index vì `bedrooms` cũng không có index |
| 17 | spec_version / spec update / CHANGELOG | Feature rule 3b | ✅ | SPEC 1.62.0; `spec/updates/2026-11-02-bathrooms-filter.md` 1.61.0 → 1.62.0; test-scope `specVersion` 1.62.0, `scopeVersion` 107 |
| 18 | test-scope `changed.files` khớp file thực đổi | yêu cầu của primary | ❌ [PARTIAL] | Xem G1 |

## Gaps

### [PARTIAL] G1 — `spec/test-scope/current.json` lệch với as-built (requirement 18; feature rule 3b; task phase-1-task-01)
- Thiếu file production đã đổi: `src/lib/posts/post-queries.ts` (thêm `bathrooms` vào `POST_SCAN_FIELDS`). Nếu thiếu dòng này thì Tin BĐS lọc ra rỗng, nên tester/regression cần biết file này.
- Thiếu `.context/design-spec.md` (doc reconcile) và 10 file test đã đổi: `src/lib/search/url-params.test.ts`, `src/lib/search/rental-search-sql.test.ts`, `src/shared/types/api.test.ts`, `src/lib/rentals/active-filters.test.ts`, `src/components/rentals/rental-filter-params.test.tsx`, `src/components/rentals/RentalListPage.test.tsx`, `src/lib/posts/post-filters.test.ts`, `src/lib/posts/post-listing-queries.test.ts`, `src/components/posts/PostListPage.test.tsx`, `tests/integration/rental-search.test.ts`. Nếu quy ước của repo chỉ liệt kê file production thì bỏ qua phần file test, nhưng `post-queries.ts` vẫn bắt buộc phải thêm.
- `src/lib/posts/post-listing.ts` không có trong list và thực tế cũng không đổi, nên đúng.
- `changed.note` còn ghi "danh sách file là dự kiến theo kế hoạch". Sau build cần đổi thành as-built. `task: null` và `reviewReport: null` nên điền `tasks/feature-bathrooms-filter/phase-1-task-01.md` và đường dẫn report reviewer round 1.
- `impact.direct` có dòng "Giá trị lạ (0, 5, abc, âm) bị bỏ qua, không lỗi", câu này chỉ đúng với trang. Với API, `bathrooms=0` → 200 lọc `= 0`, còn `5`/`-1`/`abc` → 400. Nên tách thành 2 dòng (trang và API) để tester không báo nhầm là lỗi. Dòng "Chip Phòng tắm xuất hiện khi đang lọc" cũng nên ghi rõ chỉ áp dụng cho `/cho-thue` (xem N2).
- Ai sửa: change-request ở bước close-out (spec/** thuộc quyền change-request). Không cần builder.

## Ghi chú (không chặn, không phải gap code)

- **N1 — `bathrooms=0` khác `bedrooms=0` (SPECIFICATIONS `/cho-thue`).** Spec ghi "cùng kiểu/quy tắc với Phòng ngủ… `GET /api/public/rentals` nhận `bathrooms` như `bedrooms`". As-built: API nhận 0–4 giống `bedrooms`, đúng. Trang thì bỏ `bathrooms=0` (không có chip "0"), trong khi `bedrooms=0` (studio) vẫn lọc. Spec không nói rõ khoảng giá trị, và "giá trị lạ → bỏ qua" có thể hiểu là bao gồm `0` vì chip chỉ có 1–4. `docs/API_SPEC.md` đã ghi rõ hành vi này. Đề xuất: khi có CR spec kế tiếp, thêm vào câu `/cho-thue` cụm "(trang nhận 1–4; API nhận 0–4)". Đây là intent doc nên chỉ sửa qua Change Request; spec-validator không tự sửa.
- **N2 — chip "đang lọc" ở `/tin-bds`.** Câu AC2 trong change doc viết chung cho hai trang. Spec delta `/tin-bds` không đòi chip, và trang này cũng không có chip cho `bedrooms`, nên builder làm đúng kiểu phòng ngủ (theo AC1). Ở `/cho-thue`, chip hiện trong phần gợi ý bỏ điều kiện khi kết quả rỗng, giống `bedrooms`, vì hàng chip "Đang lọc" đã bị bỏ từ BL-052. Đề xuất: khi đóng change doc thì ghi rõ AC2 về chip chỉ áp dụng cho `/cho-thue`.
- **N3 — câu chữ design-spec S04/S05.** Cùng một dòng có "Phòng tắm (…, có chip đang lọc)" và "bỏ hàng chip 'Đang lọc'". Hai ý này không mâu thuẫn với code (chip nằm trong gợi ý trạng thái rỗng) nhưng dễ đọc nhầm. Có thể sửa thành "chip trong gợi ý bỏ điều kiện". Không chặn.
- **N4 — câu cũ của BL-045 trong F3.** SPECIFICATIONS F3 vẫn còn danh sách badge/Popover cũ "(tỉnh, phường, diện tích, phòng ngủ, nội thất, …)" mà không có phòng tắm. Đoạn này đã đánh dấu "*(bố cục thay bởi BL-045)*"/BL-052 nên không coi là mâu thuẫn. Dòng "Danh sách có bộ lọc (…, phòng tắm (BL-104), …)" đã được cập nhật.

## Residual risk
- Chưa kiểm E2E "4+" với dữ liệu thật vì dữ liệu dev không có tin `bathrooms >= 4`. Phần này đã có unit và integration test DB che.
- Chưa kiểm E2E việc giữ tham số khi bấm trang 2 vì dữ liệu dev chỉ có 1 trang. Đã có unit test link phân trang và round-trip.
- Playwright chạy trên dev server cổng 3000 thay vì 3100 (MINOR 4 của reviewer), chỉ dùng GET.
- Spec-validator không chạy lại `pnpm typecheck/lint/test` và dựa vào log của builder/reviewer.

## Next
- change-request: sửa G1 trong `spec/test-scope/current.json` (thêm `src/lib/posts/post-queries.ts`, quyết định có liệt kê file test hay không, điền `task`/`reviewReport`, tách dòng giá trị lạ trang/API, ghi rõ chip chỉ ở `/cho-thue`), rồi close-out: progress → commit. N1–N3 là tuỳ chọn và thuộc phạm vi change-request.
