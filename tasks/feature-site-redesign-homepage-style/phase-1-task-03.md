# feature-site-redesign-homepage-style · phase-1-task-03 — Trang danh sách Dự án + Cho thuê + danh mục Cho thuê: hero danh sách, thẻ lọc nổi, hàng kết quả + sắp xếp, lưới thẻ, dải Điểm mạnh, banner tư vấn (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045) mục 1. Spec delta: khối BL-045 mục "Trang danh sách".
- **Mockup bắt buộc Read:** `docs/specs/site-redesign-mockup/index.html` view `list-project`, `list-rent` (`.phero`, `.fcard`, `.search`, `.frow`, `.toolbar`, `.grid`, `.pager`, `.strengths`, `.cta`).
- Phụ thuộc: **T01** (PageHero, breadcrumb overlay, `CategoryListTemplate` slot `filterCard`, Pagination, ConsultBanner, chữ hero), **T02** (thẻ), **T00** (tham số `q` / `developer` / `sort` + danh sách chủ đầu tư).
- Song song: **được** với T04, T06, T07 (wave B) — file riêng; chỉ trùng `src/i18n/messages/{vi,en}.json` (thêm key namespace `page.projects.*` / `page.rentals.*` của mình).
- Trạng thái: `done` — STRICT PASS round 1, commit `a3d51de` (close-out BL-045 2026-10-21); trước đó `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user
Như T01. **Giữ nguyên hành vi lọc/query/phân trang/canonical/noindex hiện tại** (F2, F3) — chỉ đổi bố cục.

## Classification / Risk
- Type: **MODIFY** (bố cục danh sách F2/F3).
- Risk: **HIGH** — form lọc GET + JS (`RentalFilters`, `FilterFields`, `RentalFilterPopover/Sheet`, `ActiveFilters`, `RentalSortControl`, `use-rental-draft`), URL contract `src/lib/search/url-params.ts`, chạy không JS.
- Expected review level: **STRICT**.
- Blast radius: `/du-an`, `/cho-thue`, `/cho-thue/danh-muc/[category]` (+ `/en`); `HeroSearch` trang chủ dùng chung `OptionSelect chip` (không sửa).
- Doc impact: design-spec S02/S04/S05 — reconcile T08.

## Scope / files
1. **Dự án** `src/components/projects/ProjectListPage.tsx`, `ProjectFilters.tsx`: `PageHero size="list"` (chữ `pageHeroes.projects`, ảnh `pageBanners.projects`) + breadcrumb overlay; thẻ lọc nổi: hàng 1 ô từ khoá `q` + "Tìm kiếm", hàng 2 "Loại hình" chip danh mục (link, `aria-current`, cuộn ngang < sm như hiện tại), hàng 3 "Tùy chọn khác" `OptionSelect variant="chip" progressive`: Tỉnh/thành, Tình trạng, Chủ đầu tư (`developer`); hàng kết quả "N dự án" + "Xoá bộ lọc" + sắp xếp (`sort`: Mới nhất / Giá tăng / Giá giảm); lưới `ProjectCard` 4 cột ≥ xl; phân trang tròn; **dải Điểm mạnh** (`StrengthsBlock` trang chủ, dữ liệu `homepage.strengths`, điều kiện spec + cờ `site-settings.showProjectStrengths`) → `ConsultBanner`.
2. **Cho thuê** `src/components/rentals/RentalListPage.tsx`, `RentalFilters.tsx`, `FilterFields.tsx`, `RentalFilterPopover.tsx`, `RentalFilterSheet.tsx`, `ActiveFilters.tsx`, `RentalSortControl.tsx`, `src/components/listing/ListSearchBar.tsx`: thẻ lọc nổi — hàng 1 ô từ khoá `q` + "Tìm kiếm"; hàng 2 "Danh mục" chip link; hàng 3 "Tùy chọn khác": Khu vực (tỉnh) · Mức giá (4 mốc `PRICE_HINT_RANGES`) · Diện tích (mốc như `HeroSearch` trang chủ — dùng chung hằng, không nhân bản) · **Phòng ngủ** (`bedrooms`; lệch chữ mockup "Loại căn hộ" — ghi lý do) · Nội thất · Tiện ích (**chọn nhiều**, xổ có ô tích, `amenities` AND) · nút "Bộ lọc" + badge → Popover/Sheet hiện có **chỉ còn** phường (khoá khi chưa chọn tỉnh) + khoảng giá/diện tích tự nhập, badge đếm đúng các lọc đó; hàng kết quả "N căn" + `ActiveFilters` + "Xoá bộ lọc" + sắp xếp phải; lưới `RentalCard` 4 cột ≥ xl; phân trang tròn; `ConsultBanner`. Không JS: `q`, tỉnh, `bedrooms`, `furnishing`, danh mục (link) vẫn gửi bằng GET như hiện tại.
3. **Danh mục Cho thuê** `src/app/(frontend)/[locale]/cho-thue/danh-muc/[category]/page.tsx`: cùng khung; hero: ảnh Cho thuê, eyebrow "Cho thuê", tiêu đề = tên danh mục, mô tả = mô tả danh mục; chip danh mục hiện tại `aria-current`.
4. **i18n** key mới namespace `page.projects.*`, `page.rentals.*` (vi + en).
5. **Tests**: `ProjectListPage.test.tsx`, `project-filter-params.test.tsx`, `project-components.test.tsx` (**dirty EOL — chỉ phần mình**), `RentalListPage`/`RentalFilters`/`ActiveFilters`/`FilterFields` tests: URL tạo ra **giống hệt trước** cho cùng lựa chọn (bảng so sánh tham số), badge "Bộ lọc" đếm mới, tiện ích nhiều giá trị, no-JS form `action`+`name`, 1 `h1`, empty state + "Xoá bộ lọc".

## Acceptance
- [ ] `/du-an`, `/cho-thue`, `/cho-thue/danh-muc/<slug>` khớp `list-project` / `list-rent` ở **1440 + 390** (hero chữ trái + breadcrumb khung mờ, thẻ lọc nổi 3 hàng, hàng kết quả + sắp xếp, lưới 4 cột, phân trang tròn, dải Điểm mạnh (Dự án), banner tư vấn) — ảnh chụp cạnh mockup từng phần.
- [ ] Mọi tổ hợp lọc cũ tạo đúng URL cũ; `page`, canonical, `noindex` khi lọc không đổi; form không JS gửi được.
- [ ] Chữ hero đổi trong admin hiện ngay (vi/en); trống → i18n; ảnh trống → mặc định → hero không ảnh.
- [ ] 1 `h1`; AA; không hex mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/components/projects src/components/rentals src/components/listing src/lib/search src/components/ui` → `pnpm typecheck` → `pnpm lint` → xem thật http://localhost:3000 (không chạy thêm `pnpm dev`) 1440 + 390, thử lọc từng ô + tắt JS, chụp màn hình (`.context/review-reports/assets/site-redesign-t03-*.png`).

## Retry / Escalation
Như T01; attempt 2 so pattern `HeroSearch` (BL-044 T01 "Tùy chọn khác") + `RentalFilters` hiện tại.

## Verification summary (builder điền)
- Acceptance criteria: PASS|FAIL|BLOCKED
- Verify commands + result:
- Lệch so với mockup + lý do:
- Reviewer verdict: **STRICT PASS** (round 1) — report `.context/review-reports/feature-site-redesign-homepage-style-phase-1-task-03-round-1-review.md`; commit `a3d51de` trên `staging`.

## Builder note (T03)
- Acceptance: PASS (tu kiem, 1440/390 xem truc tiep, khong h-scroll 390; chua luu anh vao assets vi pane an).
- Verify: typecheck PASS, lint 0 error, vitest src/components + lib/search|content|home + i18n 125 file/1241 test PASS.
- Quyet dinh: the loc = 1 form GET 3 hang (ListSearchBar viet lai, categoryRow); Du an ap dung khi bam Tim kiem, Cho thue ap dung ngay; Tien ich = AmenityMultiSelect (can JS); Popover/Sheet chi con phuong + gia/dien tich tu nhap, badge dem 3 loai do; AREA_HINT_RANGES chuyen sang url-params; PageHero h-* -> min-h-*; Breadcrumb overlay 1 dong + truncate muc cuoi (JSON-LD du); searchBar go khoi template, compactBanner giu (News/Posts/Jobs con dung).
- Con lai: key i18n cu khong dung chua don; sort Du an can JS.
