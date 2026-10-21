# feature-listing-detail-redesign · phase-1-task-04 — Dữ liệu danh sách Dự án (lọc / đếm / nổi bật / giá) + thẻ Dự án mới

- Nguồn: BL-052 change doc (Quyết định Dự án 1, 5, 6, 7).
- Spec: 1.46.0 khối BL-052 mục "Giá dự án", "`/du-an`" (tham số + thẻ), "Trang danh sách (khung chung)" (số đếm, nổi bật không lặp).
- Plan: phase 1 wave B (sau P1-T01; song song P1-T06, P1-T07).
- Phụ thuộc: P1-T01 (trường + `payload-types`).

## Classification / Risk
- Type: **MODIFY**.
- Risk: **HIGH** — query công khai, tham số URL, thẻ dùng chung (trang chủ ProjectsSlider, "Dự án tương tự").
- Expected review level: **STRICT**.
- Blast radius: `src/lib/projects/*` (`project-filters`, `project-queries`, `project-view`, `project-listings`), `src/components/projects/ProjectCard.tsx`, thẻ trên trang chủ.

## Scope
1. `effectivePriceFromVnd(project)` (Quyết định 6) = min `priceTable[].priceFrom` > 0; bảng giá không có giá → `priceFromVnd` nếu > 0; không có → `null`. Dùng cho thẻ, lọc giá, sắp `price_asc`/`price_desc` (null xếp cuối). Rút gọn "5,4 tỷ" bằng formatter sẵn có.
2. `parseProjectFilters` mở rộng: `province` nhiều slug (`a,b` / khoá lặp; slug đơn cũ vẫn chạy), `type` (⊂ `PROPERTY_TYPES`, OR), `feature` (⊂ `PROJECT_FEATURES`, AND), `priceMin`/`priceMax` (tỷ, số nguyên 0–50; > 50 kẹp; min > max → đổi chỗ hoặc bỏ — ghi quyết định), giữ `category`/`status`/`q`/`developer`/`sort`/`page`. Giá trị lạ bị bỏ (không 400/500). `projectQueryString` serialize ổn định. `hasFilterParams` tính tham số mới (→ noindex).
3. `listPublicProjects` (lọc/sắp trong bộ nhớ trên ≤ 1000 dự án công khai như BL-045): áp các bộ lọc mới; trả thêm **facet counts** — mỗi chiều (category cấp 1 cho tab, status, province, developer?, type, feature) = số dự án khớp mọi bộ lọc khác trừ chiều đó; tab "Tất cả" = khớp mọi bộ lọc trừ category. Danh sách tỉnh: chỉ tỉnh có ≥ 1 dự án công khai, sắp theo số đếm (không lọc) giảm dần.
4. **Nổi bật**: ≤ 5 dự án `isFeatured` khớp bộ lọc (mới nhất trước), chỉ khi `page === 1`; lưới loại các dự án này ở **mọi trang** (phân trang trên phần còn lại); `totalDocs` ("N phù hợp") = tổng khớp (gồm nổi bật). Ghi rõ trong JSDoc + test.
5. `toProjectCards` / view thêm: `productTypes` (nhãn i18n, ≤ 3 + số còn lại), `priceFromLabel` hoặc cờ "Liên hệ", `areaRange`, `handoverTime`, `summary`, nhãn danh mục — cho thẻ thường + thẻ nổi bật.
6. `ProjectCard` mới theo design (biến thể `listing` — lưới, thẻ nổi bật, "Dự án tương tự", thẻ dự án trong trang chi tiết); **trang chủ (`ProjectsSlider`/`FeaturedProjects`) giữ biến thể hiện tại** (không tag/giá) — spec F3-r1: ảnh + badge tình trạng, tên 2 dòng, ghim tỉnh, tag loại sản phẩm, "Giá từ" (vàng) hoặc "Liên hệ", nút mũi tên tròn; cả thẻ là link (BL-034 hover). Không tim. Kiểm trang chủ không đổi giao diện (test snapshot/attr biến thể cũ). `SimilarProjects` thuộc P1-T06 — chỉ đổi `ProjectCard` + view.
7. Thẻ nổi bật: component nội dung cho `SpotlightSlider` (P1-T02 làm khung; nếu P1-T02 chưa merge thì tạo `ProjectSpotlightContent` thuần nhận props — P1-T05 ghép).

## Acceptance
- [ ] Test parse/serialize (đa giá trị, lạ, slug cũ), test facet counts (bỏ chính chiều), test nổi bật không lặp + `totalDocs`, test giá hiệu lực.
- [ ] Integration test `listPublicProjects` trên DB worktree (dữ liệu tạo trong test, xoá sau).
- [ ] Trang chủ giữ thẻ cũ + `/du-an` hiện tại vẫn render (thẻ mới), không lỗi.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Quyết định (builder)
- **Giá hiệu lực** ở file mới `src/lib/projects/project-price.ts` (`effectivePriceFromVnd`, `BILLION_VND`) để queries / view / (P1-T06 chi tiết) cùng dùng, không vòng import.
- **`listPublicProjects` luôn quét** ≤ 1000 dự án công khai (không điều kiện SQL ngoài `publicWhere`) rồi lọc / đếm / sắp trong bộ nhớ: số đếm "trừ chính chiều đó" + danh sách tỉnh "đếm không lọc" cần tập không lọc. Sau đó **một** truy vấn `id in` lấy trường thẻ cho trang lưới + thẻ nổi bật. Đường SQL phân trang cũ (không q / sort) bị bỏ — mỗi request = 1 lượt quét (1 truy vấn khi ≤ 50 dự án) + 1 truy vấn thẻ.
- **Tỉnh nhiều giá trị**: `parseProjectFilters` trả `provinceSlugs` (không trùng, sắp chữ cái, trần 50); `ProjectPageQuery.provinceId` → `provinceIds` (đổi chữ ký, đã sửa ProjectListPage + test). Khoá lặp (`?province=a&province=b`) nay là nhiều tỉnh (trước: lấy giá trị đầu).
- **Giá `priceMin`/`priceMax` (tỷ)**: chỉ nhận chuỗi chữ số; kẹp ≤ 50; **min > max → đổi chỗ** (URL sửa tay vẫn ra khoảng hợp lý); rồi bỏ đầu ở mép (min 0, max ≥ 50). `priceMax=0` giữ (khoảng "≤ 0 tỷ" → rỗng). `ProjectPageQuery.priceMin/priceMax` cùng đơn vị tỷ; có một đầu → dự án không có giá bị loại.
- **type / feature**: chỉ giữ giá trị trong `PROPERTY_TYPES` / `PROJECT_FEATURES`, theo thứ tự danh sách → URL ổn định. `projectQueryString` nhận mảng, nối dấu phẩy **không mã hoá** (`a,b`, không `%2C`), thứ tự khoá cố định `category, province, status, q, developer, sort, type, feature, priceMin, priceMax, page`.
- **Số đếm**: mỗi chiều = khớp mọi bộ lọc khác trừ chính chiều đó, áp đúng chữ spec cả cho chiều AND (tiện ích): số ở một tiện ích = số dự án có tiện ích đó khi bỏ cả chiều tiện ích (không phải "nếu bật thêm"). Tab danh mục đếm theo **danh mục cấp 1** (dự án ở danh mục con tính vào cha, lấy `category.parent` đã populate — không thêm truy vấn). `facets.provinces` chỉ tỉnh có ≥ 1 dự án công khai, sắp theo tổng không lọc giảm dần, hoà theo `sortOrder`.
- **Nổi bật**: ≤ 5 `isFeatured` khớp bộ lọc, **mới nhất trước bất kể `sort`**; trả ở trang 1, loại khỏi lưới ở mọi trang; `totalDocs` gồm nổi bật, `totalPages` tính trên phần còn lại. `ProjectListPage` (tạm tới P1-T05) đặt thẻ nổi bật đầu lưới trang 1 để dự án nổi bật không biến mất.
- **ProjectCard**: prop `variant` — `listing` (mặc định, có tag loại ≤ 3 + "+n", "Giá từ" vàng / "Liên hệ") và `home` (đúng markup BL-045, chỉ `ProjectsSlider` truyền). `SimilarProjects` / "Dự án khác" tự nhận thẻ mới, không sửa file của P1-T06. `data-card-variant` trên `article` để test/kiểm.
- **Thẻ nổi bật**: P1-T02 (`SpotlightSlider`) chưa có trên staging → tạo `ProjectSpotlightContent` thuần (cột nội dung; ảnh + điều hướng do khung lo). Badge danh mục dùng biến thể `dark` (khác badge tình trạng).
- i18n namespace mới: **`projectCard`** (cuối file vi/en). Nhãn loại dùng `listingOptions.propertyType` sẵn có.

## Verification summary (Builder)
- Xem báo cáo builder (lệnh + số test). Unit mới: `project-price.test.ts`, mở rộng `project-filters.test.ts`, `project-queries.test.ts` (lọc / đếm / nổi bật / phân trang), `project-view.test.ts`, `project-components.test.tsx` (biến thể listing / home, spotlight). Integration: `tests/integration/projects.test.ts` khối "danh sách dự án BL-052" (DB tạm, tạo/xoá trong test).
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs`).
- `pnpm test` toàn bộ (lần 1): 3574 pass / 10 fail — mọi fail là môi trường (hook timeout 60s ở integration khi nhiều worktree chạy song song, timeout 5s ở vài test UI userEvent) + 1 lỗi thật `messages-check` (ICU `projectCard.moreTypesLabel` EN khác VI) → đã sửa. Chạy lại riêng: `src/i18n` + `src/components/projects` + HeroSearch/Header/ApplyForm 12 file / 166 test PASS; `src/lib/projects` 6 file / 62 test PASS; integration `homepage, projects, public-queries-no-status, locale-counterpart, globals, news` 6 file / 133 test PASS (`projects.test.ts` 36 test gồm 4 test BL-052 mới). Chạy lại cả thư mục integration tuần tự bị worker Windows crash (exit 0xC0000142, cạn tài nguyên) — không chạy lại hết 30 file.
- Trình duyệt (dev `-p 3104`, DB `tami_wt52_p1t04` = bản dump DB dev, 61 dự án công khai / 8 nổi bật): `/` 6 thẻ `data-card-variant="home"`, không tag / giá; `/du-an` 17 thẻ `listing` (5 nổi bật + 12), tag loại + "Giá từ"; `/du-an?province=ha-noi,quang-ninh&type=apartment&priceMin=3&priceMax=8&sort=price_asc` → 15 dự án, nổi bật trước rồi lưới tăng giá 3 → 3,6 tỷ, canonical `/du-an`, noindex; 375px không tràn ngang.

## Review
- Round 1: `.context/review-reports/feature-listing-detail-redesign-phase-1-task-04-round-1-review.md` — **STRICT PASS**. MINOR: m1 `project-queries.ts` 414 dòng → tách facet sang `project-list-facets.ts` (P1-T05); m2 quét mọi request + populate đầy đủ → thu hẹp populate + đo p95 (P1-T05); m3 spec/updates dòng 17 thứ tự giá cũ → primary sửa; m4 tham số bị bỏ vẫn noindex — giữ.

## Verification summary (close-out)
- Acceptance: **PASS**. typecheck · lint 0 error · vitest projects/home/i18n 279 PASS · integration projects+homepage 64 PASS.
