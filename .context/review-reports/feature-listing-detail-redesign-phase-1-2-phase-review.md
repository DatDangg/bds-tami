Agent: spec-validator

# Phase review — feature-listing-detail-redesign (BL-052) · phase 1 + phase 2 · round 1

- Branch `staging`, HEAD `4cab858`. Không sửa source.
- Nguồn đối chiếu: `SPECIFICATIONS.md:38-51` (khối BL-052, spec 1.46.0), `spec/updates/2026-10-21-listing-detail-redesign.md`, `spec/changes/2026-10-21-listing-detail-redesign.md` (Quyết định + Acceptance), design `docs/specs/listing-detail-redesign/list-du-an.webp`, task `tasks/feature-listing-detail-redesign/phase-{1,2}-task-*.md`, review task (15 file `feature-listing-detail-redesign-phase-*-review.md`), `.context/progress.json:2270-2280` (`asBuiltPending`), `tasks/feature-listing-detail-redesign/phase-3-task-06.md:32-42` (MINOR đã gom).

## Verdict

**⚠️ GAPS FOUND. Verdict: FAIL (chỉ phase 2), không chặn P3-T01.**
- **Phase 1 (T01–T07): ✅ COMPLETE.** Không có gap (a). Các lệch còn lại thuộc nhóm (b) hoặc (c).
- **Phase 2 (T01–T03): ⚠️ 1 gap MAJOR (G1).** Ô tích Tiện ích ở `/cho-thue` không có số đếm. Spec yêu cầu số đếm cho ô tích, và `/du-an` đã đếm cho ô tích Tiện ích của nó. Không có bug chức năng, không có CRITICAL.
- G1 không đụng file của P3-T01 (schema Tin BĐS), nên P3 wave A chạy được ngay. G1 phải đóng **trước khi close-out BL-052** và **trước P3-T02**, vì `/tin-bds` cần quy tắc đếm đã chốt.

## Verify

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 381 file / 3803 test (gồm integration, không timeout) |
| `pnpm build` | skip (tuỳ chọn; builder/reviewer P2-T03 báo PASS) → residual |
| `git diff src/payload-types.ts` | chỉ khác đuôi dòng LF/CRLF, không đổi nội dung |

## Ma trận coverage

| # | Requirement | Nguồn spec | Code (đã merge) | Status | Ghi chú |
|---|---|---|---|---|---|
| 1 | Trường Dự án mới: `productTypes`, `featuredAmenities` (index, hasMany), `products` ≤ 8 (đến ≥ từ), `videoUrl`, `amenities[].description`, `amenitiesImage` | SPEC:41 | `src/collections/projects/listing-fields.ts:17-57`, `Projects.ts:188-217` | ✅ | P1-T01 PASS |
| 2 | Migration versioned, chỉ ADD | change doc Acceptance; SPEC:41 | `migrations/20261021_135620_listing_detail_redesign.ts` (DROP chỉ có ở `down`, từ :281) | ✅ | FK > 63 ký tự đã có trong asBuiltPending |
| 3 | `site-settings.listingPages.{projects,rentals,propertyPosts}` (quickSearch ≤ 8, learnMore, faqs ≤ 10, showStrengths); EN thiếu chữ thì bỏ hàng | SPEC:40 | P1-T01 (`listing-pages.ts`, `load-listing-page`) | ✅ | |
| 4 | "Giá từ" = min `priceTable.priceFrom` > 0, fallback `priceFromVnd`, nếu không có thì "Liên hệ" | SPEC:42; updates:17,38 | `src/lib/projects/project-price.ts:12-16`, dùng chung cho facets/queries/view/detail | ✅ | Spec đã sửa mâu thuẫn P1-T04 m3 (updates:17 khớp) |
| 5 | Khung danh sách chung (hero + q + Tìm nhanh, tab có icon + số, cột Bộ lọc/Sheet, nổi bật ≤ 5 không lặp lưới, "N … phù hợp", lưới 3/2/1, phân trang, Tìm hiểu thêm + FAQ, Điểm mạnh, banner) | SPEC:39 | `src/components/listing/*` (P1-T02), `ResultsBar.tsx:6,15`, `ListingCategoryTabs.tsx:29-37` | ✅ | |
| 6 | **Số đếm (tab, ô tích, chip)** "trừ chính chiều đó"; tỉnh chỉ liệt kê tỉnh có tin | SPEC:39 | `/du-an`: `project-list-facets.ts:166-177` (category/status/developer/type/feature/provinces), `project-list-state.ts:73-84` (render tỉnh, loại hình, tiện ích). `/cho-thue`: `rental-list-queries.ts:124-151` (chỉ category + provinces), `RentalListBody.tsx:115-139` | ⚠️ PARTIAL | G1 (a) + B1 (b), xem dưới |
| 7 | `/du-an` lọc: status chip, province nhiều (OR) + ô tìm + 6 tỉnh + "Xem thêm", developer, giá 0–50+ tỷ, type (OR) có số, feature (AND), q, sort, giá trị lạ bị bỏ | SPEC:43 | P1-T04/T05 (`project-queries.ts`, `project-list-state.ts`, `ProjectListBody.tsx`) | ✅ | |
| 8 | Thẻ Dự án mới (≤ 3 tag + "+n", Giá từ/Liên hệ, mũi tên), trang chủ giữ thẻ cũ; thẻ nổi bật | SPEC:43 | P1-T04/T05 | ✅ | |
| 9 | Chi tiết Dự án: hero + 3 thumbnail + "Xem tất cả N ảnh", nút video khi có; thanh thông số ≤ 6 ô, **không Pháp lý** | SPEC:44 | `ProjectDetail.tsx:104-115` (Giá từ · Quy mô · Diện tích · Chủ đầu tư · Bàn giao · Loại hình) | ✅ | |
| 10 | Thứ tự tab/khối: Tổng quan · Vị trí · Tiện ích · Hình ảnh · Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp; khối trống ẩn cả khối lẫn tab | SPEC:44 | `project-detail-view.ts:336`, `ProjectDetail.tsx:97-102` (gộp legal + policy thành một tab) | ✅ | |
| 11 | Cột phải cạnh Tổng quan: form `source=project` `#lead-form` + Hotline "Gọi ngay"; các dải full-width | SPEC:44 | `ProjectDetail.tsx:208-209`, `DetailPageShell` | ✅ | |
| 12 | Vị trí (khoảng cách, > 8 thì "Xem thêm"), Tiện ích (ảnh + > 5), Hình ảnh 1 + 4, "Dự án tương tự" + "Xem tất cả dự án", Điểm mạnh, banner `#lead-form` + `tel:` | SPEC:44 | `ProjectDetail.tsx:215-223`, kit detail P1-T03 | ✅ | "Tin liên quan" còn dùng thẻ cũ, đã có trong P3-T06 |
| 13 | `/cho-thue` + danh mục: tab = danh mục (link, `?category=` cũ vẫn chạy), Tỉnh radio + số, Phường, Dự án (`project`), giá 0–100+ triệu, diện tích 0–300+, PN chip, Nội thất chip, Tiện ích ô tích (AND) | SPEC:45 | `RentalListPage.tsx:90-196`, `RentalListBody.tsx:61-142`, `rental-list-queries.ts:99-122` | ⚠️ | Thiếu số đếm, xem G1/B1 |
| 14 | Tham số `project` ở `GET /api/public/rentals` + doc | SPEC:45,51 | P2-T01; `docs/API_SPEC.md:109` | ✅ | |
| 15 | Thẻ Cho thuê (badge Đã thuê, tag danh mục + nội thất, giá/tháng hoặc Thương lượng/Liên hệ, DT · PN · PT) + nổi bật = `isFeatured` còn trống | SPEC:45 | `RentalCard.tsx` (key P2-T01 MINOR-3 đã sửa :102), `RentalSpotlightContent.tsx` | ✅ | |
| 16 | Chi tiết Cho thuê: thanh thông số Giá · DT · PN/PT · Nội thất · Hướng · Dọn vào từ; tab Tổng quan · Vị trí · Tiện ích · Hình ảnh · Điều khoản · Pháp lý; form `source=rental`; Căn tương tự; Điểm mạnh + banner `#lead-form` | SPEC:46 | `RentalDetail.tsx:115-123,187,206`, `rental-detail-sections.ts:7-29`, `cho-thue/[slug]/page.tsx:115-144` | ✅ | |
| 17 | FAQ JSON-LD chỉ ở trang sạch | SPEC:39 | `RentalListPage.tsx:190` | ✅ | Trang danh mục không phát; đã có trong asBuiltPending |
| 18 | Backfill `pnpm backfill:listing-fields` (dry-run mặc định, `--apply`, chỉ ô trống, chặn prod / DB không phải dev, báo cáo MD) | SPEC:50 | `package.json:31`, `scripts/backfill-listing-fields.ts:2-33`, `docs/reports/backfill-listing-fields-2026-10-21-2238-apply.md` | ✅ | Tên báo cáo khác spec, xem B2 |
| 19 | Không icon tim; EN đủ nhãn; 1 `h1`; noindex/canonical khi lọc | change doc Acceptance | test `RentalListPage.test.tsx`, `rental-list-metadata`, review P1-T05/P2-T02 | ✅ | |
| 20 | Doc impact (`design-spec.md`, `DESIGN.md`, `API_SPEC.md` tham số `/du-an`, `ARCHITECTURE.md:127`) | SPEC:51 | Grep `docs/{API_SPEC,DESIGN}.md`: chưa có tham số `/du-an` mới | ⏳ | (c) P3-T06 Scope 3 (đã lên kế hoạch) |

## Gaps

### (a) Lỗi code cần sửa

**G1 [MAJOR · PARTIAL]: `/cho-thue` không đếm cho ô tích Tiện ích.**
- Requirement: SPEC:39 "Số đếm (tab, ô tích, chip): số tin công khai khớp mọi bộ lọc đang chọn trừ chính chiều đó"; change doc Acceptance "số đếm đúng theo bộ lọc khác đang chọn (hoặc ghi rõ cách đếm)".
- Code: `src/components/rentals/RentalListBody.tsx:132-138` dựng `CheckboxFacetList` cho tiện ích mà không truyền `count`. `src/lib/rentals/rental-list-queries.ts:145-151` (`listRentals` → `PostgresRentalSearch.listing`) chỉ trả `facets.category` và `facets.provinces`. Builder P2-T01 ghi rõ: "chiều khác (nội thất, phòng ngủ, tiện ích) P2-T02 cần thì thêm cờ boolean vào cùng truy vấn" (`phase-2-task-01.md:37`). P2-T02 không thêm.
- Vì sao xếp (a), không phải (b): ô tích Tiện ích ở `/du-an` có đếm (`project-list-state.ts:82`, chiều AND, bỏ cả chiều khi đếm). Design cũng hiện số trên ô tích. Không có lý do design hay kỹ thuật để `/cho-thue` khác. Cùng một khung danh sách mà ô tích có số ở màn này, không số ở màn kia.
- Task (task ID mới, primary/change-request tạo): **`phase-2-task-04`: số đếm Tiện ích `/cho-thue`**. Chạy song song P3-T01 trong wave 3A, không trùng file.
  - Phạm vi: thêm chiều `amenities` vào `rentalConditions.byDimension` và đếm từng tiện ích trên tập "khớp mọi lọc trừ chiều amenities" (cùng quy tắc `/du-an` feature). Truyền `count` vào `RentalListBody`. Test đếm (unit SQL + integration). Đo lại p95 `listing`, ngân sách ≤ 500ms.
  - Risk HIGH (query công khai), review STRICT.
  - Nếu chốt đếm cả chip (xem B1, phương án 2) thì làm luôn trong task này.

### (b) Quyết định as-built hợp lý, cần ghi spec khi close-out

| # | Lệch | Bằng chứng | Có trong `asBuiltPending`? |
|---|---|---|---|
| B1 | **Chip chọn một không hiện số đếm**: `/du-an` Tình trạng; `/cho-thue` Phòng ngủ, Nội thất. Lệch chữ "chip" ở SPEC:39. Design `list-du-an.webp` cũng không có số trên chip Tình trạng. `facets.status` đã tính (`project-list-facets.ts:171`) nhưng `ChipChoice` (`FilterFacets.tsx:48-88`) không có prop count. | design + code | **Chưa**, cần thêm |
| B2 | Tên báo cáo backfill `backfill-listing-fields-<ngày>-<giờ>-<dry-run\|apply>.md` thay cho `-<ngày>.md` | `docs/reports/backfill-listing-fields-2026-10-21-2238-apply.md` | **Chưa**, cần thêm |
| B3 | Khối "Hình ảnh" (chi tiết Dự án / Cho thuê) chỉ hiện khi ≥ 2 ảnh, vì ảnh 1 đã là nền hero | `project-detail-view.ts:350`, `rental-detail-sections.ts:10-24` | **Chưa**, cần thêm |
| B4 | Tab danh mục Cho thuê đếm theo danh mục cấp 1 (tin ở danh mục con tính vào cha; tin không danh mục chỉ vào "Tất cả") | `phase-2-task-01.md:37` | **Chưa**, cần thêm (ngắn) |
| B5 | "Xoá tất cả" trên link cũ `/cho-thue?category=x` về `/cho-thue` (bỏ luôn danh mục); trang danh mục giữ danh mục | review P2-T02 Residual | **Chưa**, tuỳ chọn |
| B6 | Bỏ nút chia sẻ hero (Dự án + Cho thuê); bỏ neo `#details`/`#video`; Thương lượng/Liên hệ; nhãn "Hồ bơi, gym, spa"; FK > 63 ký tự; ô Dự án chỉ dự án có tin còn trống; bỏ hàng chip Đang lọc; FAQ JSON-LD chỉ ở `/cho-thue` sạch; slider giá VNĐ kẹp 0–100 triệu | review P1-T06 MINOR-1, P2-T03 M3, P1-T01 MINOR-1/2, P2-T01 MINOR-4, P2-T02 | **Có** (9 mục `progress.json:2271-2279`) |

### (c) Để P3 xử lý (đã có hoặc cần thêm vào task)

| # | Việc | Task | Đã có? |
|---|---|---|---|
| C1 | MINOR P1-T03/T05/T06, P2-T01/T02/T03 (tách hàm dài, icon shophouse/land, `DetailInfoGrid` union type, `RangeSliderFacet` step/max khi chưa hydrate, sort qua `navigate`, dọn key i18n chết, ZWSP `RentalPriceText`) | P3-T06 | Có (`phase-3-task-06.md:33-41`). P2-T03 M1 (ZWSP literal `RentalPriceText.tsx:20`) chưa thấy trong danh sách, **nên thêm** |
| C2 | Doc reconcile: `design-spec.md`, `docs/DESIGN.md`, `docs/API_SPEC.md` tham số `/du-an` mới (`type`, `feature`, `priceMin/Max` tỷ, `province` nhiều), `docs/ARCHITECTURE.md:127` | P3-T06 Scope 3 | Có |
| C3 | Ghi chú P1-T04 m2: `scanPublicProjects` populate đầy đủ (hiệu năng). Hiện ~61 dự án, ổn | P3-T06 (tuỳ chọn) | Chưa, không bắt buộc |
| C4 | `report.ts` dòng lỗi vẫn tính "Đã điền" (P1-T07 r2 N1) | P3-T05 | Có |
| C5 | `/tin-bds`: áp **cùng quy tắc đếm** đã chốt từ G1/B1 ngay từ đầu (tab + ô tích Loại hình/Tỉnh có số; chip Phòng ngủ/Hướng/Tình trạng bàn giao theo B1) | P3-T02 | **Chưa**, thêm 1 dòng vào Scope P3-T02 |

## Đề xuất xử lý gap số đếm (câu hỏi P2-T02 review MINOR-3)

Tách làm hai, không gộp:
1. **Ô tích Tiện ích `/cho-thue` → sửa code (G1)** bằng task riêng `phase-2-task-04`, chạy trong wave 3A cùng P3-T01.
   - Không đưa vào P3-T06: P3-T06 là task dọn + doc. Thêm facet SQL vào truy vấn công khai là thay đổi HIGH risk cần review STRICT riêng.
   - Không ghi as-built: chính khung chung đã có tiền lệ đếm ô tích Tiện ích ở `/du-an`.
2. **Chip (Phòng ngủ, Nội thất; cả Tình trạng `/du-an`) → ghi as-built (B1)** "chip chọn một không hiện số, theo design `list-du-an.webp`", ghi trong close-out spec BL-052. Lý do: design gốc không có số trên chip, và `/du-an` đã làm vậy từ P1.
   - Nếu change-request/user muốn bám chữ spec: gộp vào `phase-2-task-04` (Phòng ngủ/Nội thất là cột đơn trị, đếm được bằng GROUPING SETS sẵn có; `/du-an` chỉ cần truyền `facets.status` vào `ChipChoice`). Chi phí nhỏ.
   - Đây là đổi intent text, nên change-request phải chốt một trong hai phương án. Spec-validator không tự chọn.
3. P3-T02 phải theo đúng phương án đã chốt (C5).

## Residual risk
- `pnpm build` không chạy lại độc lập trong lần review này.
- Chưa kiểm trình duyệt thật (375/768/1280, VI/EN, không JS). Chỉ dựa vào test `renderToString` và evidence của builder/reviewer.
- p95 `/cho-thue` sau khi thêm đếm tiện ích phải đo lại (bench P2-T01: 151ms @100k tin trước khi đổi).
