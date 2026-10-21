# feature-listing-detail-redesign · phase-1-task-05 — Trang `/du-an` theo design mới

- Nguồn: BL-052 change doc; design `list-du-an.webp`.
- Spec: 1.46.0 khối BL-052 mục "Trang danh sách (khung chung)", "`/du-an`".
- Plan: phase 1 wave C.
- Phụ thuộc: P1-T01 (loader `listingPages`), P1-T02 (component danh sách), P1-T04 (dữ liệu + thẻ).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — trang công khai chính, SEO canonical/noindex, tham số URL.
- Expected review level: **STRICT**.
- Blast radius: `src/components/projects/ProjectListPage.tsx`, `ProjectFilters.tsx`, `ProjectSortControl.tsx`, route `src/app/(frontend)/[locale]/du-an/page.tsx`, i18n `page.projects`.

## Scope
1. Lắp ráp: `ListingHero` (pageHeroes.projects + `q` + Tìm nhanh `listingPages.projects.quickSearch`) → `ListingCategoryTabs` (Tất cả + danh mục cấp 1, số đếm, icon theo danh mục — map slug/icon hợp lý, fallback icon chung) → 2 cột: `FilterSidebar` (Tình trạng chip · Tỉnh/thành ô tìm + ô tích + số đếm + "Xem thêm" sau 6 · Chủ đầu tư Select · Mức giá slider 0–50+ tỷ · Loại hình ô tích + số · Tiện ích nổi bật ô tích + số; "Xoá tất cả" → `/du-an`) | `SpotlightSlider` (trang 1, có nổi bật) → `ResultsBar` ("N dự án phù hợp" + sắp xếp Mới nhất / Giá tăng / Giá giảm) → lưới 3 cột ≥ lg → `Pagination` → `LearnMoreFaq` (`listingPages.projects`) → dải Điểm mạnh (cờ `showProjectStrengths` như hiện tại) → `ConsultBanner`.
2. < lg: nút "Bộ lọc" + badge mở Sheet; lưới 1/2 cột.
3. Empty state: lọc không ra → `EmptyState` filtered (giữ); chưa có dự án → empty.
3b. Link `/du-an?category=<slug>` (trang chủ / link cũ) → tab tương ứng được đánh dấu (test).
4. Metadata: `hasFilterParams` gồm tham số mới → `noindex, follow` + canonical `/du-an`; trang sạch + `?page=n` như cũ. `/en` hoạt động (nhãn i18n đủ: tab, filter, sort, kết quả, Tìm nhanh, Tìm hiểu thêm, FAQ).
5. Xoá/thu gọn code cũ không còn dùng (`ProjectFilters` thẻ lọc nổi BL-045, `ListFilterRow` nếu chỉ Dự án dùng — kiểm Cho thuê còn dùng thì giữ tới P2).
6. Kiểm trình duyệt dev (`.claude/launch.json` `tami-dev` hoặc dev server worktree): so ảnh design 1440px; 390px; VI + EN; không JS (form GET lọc được).

## Acceptance
- [ ] `/du-an` khớp bố cục `list-du-an.webp` ở desktop (hero, tab đếm, sidebar, thẻ nổi bật, lưới 3 cột, phân trang, Tìm hiểu thêm + FAQ, dải lợi ích, banner, footer). Không tim.
- [ ] Bộ lọc chạy qua `searchParams`, chia sẻ link giữ nguyên; số đếm theo quy tắc "trừ chính chiều đó".
- [ ] Mobile: bộ lọc là Sheet; không tràn ngang 375px.
- [ ] Canonical/noindex đúng (test metadata). EN đủ nhãn.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Bổ sung từ review P1-T02 r3 (change-request)
- Lắp ráp: gọi `useListingFilterNav` **một lần** ở component cha client, truyền `navigate` cho mọi ô lọc ở sidebar + Sheet, `reset` → `onClear` của cả hai; import `RangeSliderFacet` từ `./RangeSliderFacet`; `emitJsonLd` chỉ trang sạch; `countActiveFilters` cho badge.
- Sửa MINOR n1–n3 (`src/components/listing/*`): `reset` tăng bộ đếm `generation` dùng làm `key` nội dung bộ lọc (huỷ timer slider + chip đồng bộ khi "Xoá tất cả"/Back); slider commit ngay khi thả chuột/ngón tay, chỉ debounce bàn phím (không mất giá khi bấm "Xem kết quả" ngay). Test cho từng trường hợp.
- Giá "Giá từ": dùng một helper duy nhất (P1-T06 `projectPriceFromVnd` trong `project-detail-view.ts` / P1-T04 `effectivePriceFromVnd`) — gom về một nơi.
- Từ review P1-T04: (m1) tách facet/predicate khỏi `project-queries.ts` (414 dòng) sang `src/lib/projects/project-list-facets.ts`; (m2) thu hẹp populate `developer`/`category` trong `scanPublicProjects` + đo p95 `/du-an` (dev, ghi số); gom `projectPriceFromVnd` (project-detail-view.ts) về `effectivePriceFromVnd` (`project-price.ts`) làm nguồn duy nhất; thay chỗ tạm "nổi bật đầu lưới trang 1" bằng `SpotlightSlider` + `ProjectSpotlightContent`.

## Quyết định (builder)
- **Lắp ráp**: `ProjectListPage` (server) dựng dữ liệu; `ProjectListBody` (client, mới) gọi `useListingFilterNav` MỘT lần → `navigate` cho ô lọc cả `FilterSidebar` lẫn `FilterSheet`, `reset` → `onClear` cả hai, `generation` làm `key` của `ProjectFilterFields`. Spotlight + lưới + phân trang + EmptyState do server dựng, truyền qua prop/children. Toàn trang (hero → banner) nằm trong `ListPendingProvider`; kết quả mờ khi đang điều hướng (`PendingRegion`).
- **Trạng thái lọc thuần** ở `src/components/projects/project-list-state.ts` (`toProjectPageQuery`, `toFilterParams`, `toFilterValues`, `toFilterOptions`) để hàm trang ngắn và một nguồn cho truy vấn, link và ô lọc.
- **Tab**: "Tất cả" + danh mục cấp 1, số = `facets.category` (bỏ chiều danh mục), link `?category=` giữ lọc khác + sort, bỏ trang. Danh mục không có trường icon → `project-category-icon.ts` đoán theo slug VI/EN (căn hộ / đô thị / nhà phố-biệt thự / nghỉ dưỡng / đất nền / shophouse / văn phòng), lạ → `Buildings`. Thêm 7 icon Phosphor vào `src/components/icons.ts`.
- **Chip Tình trạng không có số đếm** (theo design; `ChipChoice` P1-T02 không có slot số). Thứ tự chip theo design: Tất cả · Đang mở bán · Sắp mở bán · Đã bàn giao. Tỉnh / Loại hình / Tiện ích có số. Tỉnh đang chọn nhưng không còn dự án công khai vẫn hiện (đếm 0) để bỏ tích được.
- **"Xoá tất cả" → `/du-an`** (bỏ cả `q` và danh mục), luôn hiện như design. Form hero giữ mọi lọc đang bật (input ẩn) khi gửi từ khoá mới; form bộ lọc không JS giữ `category`, `q`, `sort` bằng input ẩn.
- **Lưới**: 1 / 2 (md) / 3 (lg) cột theo spec; cột lọc 16rem ở lg, 17.5rem ở xl. `sizes` ảnh thẻ chỉnh theo cột lọc. Ảnh LCP là ảnh hero; thẻ đầu chỉ `priority` khi hero không ảnh và không có thẻ nổi bật.
- **Hàng kết quả** luôn hiện (chứa nút "Bộ lọc" < lg, cần cả khi rỗng); ô sắp xếp ẩn khi 0 kết quả. Nhãn sắp xếp đổi thành "Sắp xếp theo" (key mới `sortBy`).
- **FAQ JSON-LD** chỉ khi trang 1 và `!hasFilterParams` (trang sạch). Khối Tìm hiểu thêm + FAQ rộng hết khung, sau thân 2 cột, trước dải Điểm mạnh (theo design).
- **n1–n3 (P1-T02 r3)**: `useListingFilterNav` trả thêm `generation` (tăng ở `reset`); `RangeSliderFacet` commit NGAY khi thả con trỏ (cờ `fromPointer` từ `onPointerDown`/`onKeyDown` trên Slider root), bàn phím vẫn debounce 300ms. Test riêng `listing-filter-reset.test.tsx`. Back/forward khi phím đang chờ commit vẫn là cửa sổ ≤ 300ms (không remount theo URL để không mất focus ô tích sau mỗi lần lọc).
- **`listingHref` ghi dấu phẩy không mã hoá** (`a,b`, như `projectQueryString`) để link chia sẻ dễ đọc, URL cùng dạng; test cập nhật.
- **m1**: facet / predicate / sắp giá tách sang `src/lib/projects/project-list-facets.ts` (thuần); `project-queries.ts` 414 → 271 dòng, re-export kiểu facet. `ProjectPageQuery extends ProjectFilterCriteria`.
- **m2**: `findPublicList` nhận `populate` (tuỳ chọn, additive). Quét chỉ populate tỉnh {slug, name, shortName, sortOrder}, phường {name}, danh mục {parent}, chủ đầu tư {slug}; thẻ (lưới + nổi bật + "Dự án khác") populate tỉnh {name, shortName}, danh mục {name, slug, hasEnglish}. `listDevelopersWithPublicProjects` giữ nguyên (chạy song song, không nằm trên đường găng).
- **Giá**: bỏ `projectPriceFromVnd`; `toProjectDetailView.displayPriceFromVnd` dùng `effectivePriceFromVnd` (`project-price.ts`) — cùng ngữ nghĩa (đã đối chiếu test).
- **Code cũ**: xoá `ProjectFilters.tsx` + test của nó; `ListSearchBar` / `ListFilterRow` / `CategoryListTemplate` giữ (Cho thuê / Tin tức còn dùng). Key i18n cũ của thẻ lọc BL-045 trong `page.projects` để nguyên (tránh xung đột merge song song).
- **i18n**: chỉ thêm cuối `page.projects` (vi + en): `spotlightLabel`, `tabsLabel`, `sortBy`, `filterGroups.{status,province,developer,price,type,feature}`, `provinceSearch`, `allDevelopers`, `priceValue`, `priceValueMax`, `priceLow`, `priceHigh`.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error, 2 warning có sẵn `tools/task-dashboard/server.mjs`) · `pnpm test` PASS **380 file / 3799 test** (gồm integration, một lượt) · `pnpm build` PASS.
- Test mới / sửa: `ProjectListPage.test.tsx` (viết lại: bố cục, cột lọc, tab + `?category=` đánh dấu, cấp 2, tham số đa giá trị + badge + số đếm trừ chiều, EmptyState, EN, không JS bằng `renderToString`, metadata noindex/canonical mọi tham số mới), `listing-filter-reset.test.tsx` (n1, n2, n3), `project-category-icon.test.ts`, `listing-params.test.ts`, `project-detail-view.test.ts`, `project-components.test.tsx` (bỏ khối ProjectFilters).
- Integration `tests/integration/projects.test.ts` PASS với populate thu hẹp (lọc từ khoá theo tên tỉnh / phường, đếm tỉnh vẫn đúng).
- p95 (`pnpm build` + `pnpm start`, DB `tami_wt52_p1t05` = dump DB dev, 61 dự án công khai, 40 request tuần tự sau 5 lượt làm nóng): `/du-an` p50 96 / **p95 110ms**; `/du-an?province=ha-noi,bac-ninh&type=apartment&priceMin=3&priceMax=20&sort=price_asc&q=vin` p50 76 / **p95 81ms**; `/en/projects` p50 48 / **p95 58ms** (ngân sách 500ms). Không đo số "trước" trên cùng máy.
- Trình duyệt (dev `-p 3105`, nội dung `listingPages.projects` nhập thử trên DB worktree: 4 Tìm nhanh, Tìm hiểu thêm có ảnh + video + nút, 4 FAQ, VI + EN): 1440 khớp bố cục `list-du-an.webp` (hero + Tìm nhanh, 5 tab có icon + số, cột Bộ lọc, thẻ nổi bật 1/5, "61 dự án phù hợp" + Sắp xếp theo, lưới 3 cột, phân trang, Tìm hiểu thêm + FAQ, dải lợi ích, banner, footer; không tim). 375: không tràn ngang (`scrollWidth = 375`), nút "Bộ lọc" mở Sheet, tích Hà Nội → URL `?province=ha-noi`, badge 1, "36 dự án phù hợp", Sheet giữ mở. 768 EN: nhãn tiếng Anh đủ, 2 cột. Không JS: GET `?province=ha-noi&province=bac-ninh&type=apartment&priceMin=3` → 20 dự án, ô tích được chọn, ô số giá, 2 form GET (sidebar + details) có "Áp dụng".

## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-1-task-05-round-1-review.md` — **STRICT PASS**. MINOR (→ P3-T06): (1) `project-category-icon.ts` khớp "house" trước Storefront (shophouse ra icon nhà phố; "land" khớp "island") — tách theo đoạn slug + test; (2) `ProjectListPage` ~113 dòng → tách phần kết quả; (3) key i18n cũ `page.projects.sortLabel`, `chips.*`.

## Verification summary (close-out)
- Acceptance: **PASS**. typecheck · lint 0 error · test 380 file / 3799 PASS · build PASS · reviewer 39 file / 381 + integration projects 36 PASS. p95 `/du-an` 110ms (build + start, 61 dự án).
