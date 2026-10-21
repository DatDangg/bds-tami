Agent: spec-validator

# Phase review — feature-listing-detail-redesign (BL-052) · phase 3 + kiểm tổng BL-052 · round 1

- Branch `staging`, HEAD `586bfd2`. Không sửa source.
- Nguồn đối chiếu:
  - Spec: `SPECIFICATIONS.md:38-51` (khối BL-052, 1.46.0), `spec/updates/2026-10-21-listing-detail-redesign.md`, change doc `spec/changes/2026-10-21-listing-detail-redesign.md` (Quyết định + Acceptance).
  - Task: `tasks/feature-listing-detail-redesign/phase-3-task-0{1..6}.md`, `phase-2-task-04.md`.
  - Review: 7 report `feature-listing-detail-redesign-phase-{3-task-0*,2-task-04}-round-1-review.md`, phase review trước `feature-listing-detail-redesign-phase-1-2-phase-review.md`.
  - Tiến độ: `.context/progress.json:2203-2343` (`asBuiltPending`, `openItems`).
  - Code đã merge tại HEAD.

## Verdict

**⚠️ GAPS FOUND. Verdict: PASS cho code** (không có gap (a) CRITICAL/MAJOR). **Close-out BL-052 chỉ làm SAU** khi xong 3 việc ở mục "Phải xong trước close-out".
- Phase 3 (T01–T06) và P2-T04 khớp spec ở mọi mục Tin BĐS: trường mới, migration, danh sách, thẻ, chi tiết, backfill, BR-06.
- G1 của lần review trước đã đóng. `/cho-thue` đã đếm ô tích Tiện ích: `search-service.ts:146,171` → `rental-list-state.ts:57-64` → `RentalListBody.tsx:137`.
- Các gap còn lại thuộc 3 loại: giấy tờ (task file thiếu Verification summary), bằng chứng QA trình duyệt cho Acceptance #1, và as-built chưa có trong `asBuiltPending`.

## Verify (chạy tại HEAD 586bfd2, `D:\prj\bds`)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc exit 0) |
| `pnpm lint` | PASS (0 lỗi; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`) |
| `pnpm test` | PASS: 385/385 file, 3878 test, exit 0. Lần này integration không timeout. Log `revalidateTag`/`job dịch` là log có sẵn |
| `pnpm build` | skip (tuỳ chọn). Reviewer P3-T06 báo PASS trên worktree trước merge → residual |
| Migration `20261021_173246_property_post_specs` | `up` chỉ có `CREATE TYPE` / `ADD COLUMN` / `CREATE INDEX`; `DROP` chỉ ở `down` (`migrations/20261021_173246_property_post_specs.ts:3-34`). SAFE_ADDITIVE. Reviewer P3-T06 đã chạy `migrate:create --skip-empty`: không có drift |
| Intent docs | `git diff 65f4cf0^..HEAD` không đụng `SPECIFICATIONS.md`, `spec/**`, BRD/PRD/USER_FLOW |

## Ma trận coverage — Tin BĐS (phase 3)

| # | Requirement | Nguồn spec | Code (HEAD) | Status | Ghi chú |
|---|---|---|---|---|---|
| 1 | Trường mới `propertyType` (index) · `areaM2` (index) · `bedrooms` · `bathrooms` · `houseDirection` · `frontageM` · `floors` · `handoverCondition` (raw/basic/full) · `address` (không localized, công khai) · `location` (point); số ≥ 0; ở tab "Thông tin tin đăng"; tuỳ chọn | SPEC:47 | `src/collections/PropertyPosts.ts:61-79,114-131`; không nằm trong `englishRequiredFields` (:151) | ✅ | ERD `docs/ERD.md:328-335` khớp |
| 2 | Migration versioned, chỉ ADD | Acceptance #3 | `migrations/20261021_173246_property_post_specs.ts` | ✅ | |
| 3 | `/tin-bds` + danh mục: cùng khung danh sách (hero + `q` + Tìm nhanh, tab danh mục có số + `aria-current`, cột Bộ lọc / Sheet, nổi bật, "N phù hợp" + sắp xếp, lưới 3/2/1, phân trang, Tìm hiểu thêm + FAQ, Điểm mạnh, banner) | SPEC:39,48 | `src/components/posts/PostListPage.tsx:153-206`, `PostListBody.tsx:144-169`, route `tin-bds/page.tsx`, `tin-bds/danh-muc/[category]/page.tsx` | ✅ | |
| 4 | Bộ lọc `type` · `province` (nhiều, OR) · giá 0–50+ tỷ bước 1 · diện tích 0–500+ bước 10 · `bedrooms` · `direction` · `handover` · `q` · `sort` (newest/price_asc/price_desc); giá trị lạ bị bỏ | SPEC:48 | `src/lib/posts/post-filters.ts:100-139`, `PostListBody.tsx:52-114` | ✅ | `direction`/`handover` làm ô tích nhiều giá trị (OR) có số. Spec không nói rõ kiểu → B-new-1 |
| 5 | Số đếm "trừ chính chiều đó"; tỉnh chỉ liệt kê tỉnh có tin; mục 0 vẫn hiện | SPEC:39 | `src/lib/posts/post-list-facets.ts:169-178`, `post-list-state.ts:70-78` | ✅ | Chip Phòng ngủ không đếm, theo quyết định B1 |
| 6 | Lọc thuộc tính tự loại tin không có giá trị đó | SPEC:48 | `post-list-facets.ts:89-128` | ✅ | |
| 7 | Lọc / đếm trong bộ nhớ có trần + log khi chạm | SPEC:39 | `post-queries.ts` (`SCAN_MAX_PAGES = 20` × page size, `payload.logger.warn`): xem review P3-T02 mục 7 | ✅ | p95 248ms (builder đo, reviewer không đo) → residual |
| 8 | Thẻ voucher = có ưu đãi **và** không có `priceVnd` lẫn `areaM2`; tin bán kèm ưu đãi dùng thẻ BĐS + badge ưu đãi | SPEC:48 | `src/lib/posts/post-kind.ts:23-25` (một nguồn cho thẻ + chi tiết), `PostCard.tsx:31-36,118-139` | ✅ | |
| 9 | Thẻ BĐS: giá (hoặc ghi chú / "Liên hệ"), diện tích, phòng ngủ, tag loại hình, mũi tên; thẻ voucher: hạn + Còn hạn / Đã kết thúc | SPEC:48 | `PostCard.tsx:39-109` | ✅ | Đọc "Đã kết thúc" 2 lần: đã sửa (`decorative` ở :33) |
| 10 | Trang chủ giữ thẻ cũ | SPEC:43 | `PostCard.tsx:121,142-173` (`variant="home"`) | ✅ | |
| 11 | Nổi bật = `isFeatured` còn hiệu lực, ≤ 5, trang 1, không lặp trong lưới | SPEC:39,48 | `PostListPage.tsx:185`; review P3-T02 mục 4 | ✅ | |
| 12 | BR-06: ưu đãi hết hạn xếp cuối, nhãn "Đã kết thúc", không lộ mã | SPEC:38 | `post-list-facets.ts:184-194`, `OfferBox.tsx:63-71`, `PostCardData` không có mã | ✅ | |
| 13 | noindex + canonical khi lọc; FAQ JSON-LD chỉ ở trang sạch | SPEC:39 | `post-list-metadata.ts:34-36,49-86`, `PostListPage.tsx:200` | ✅ | `?category=` cũ: noindex + canonical sang trang danh mục → openItem 1 |
| 14 | Link cũ `/tin-bds?category=<slug>` lọc + đánh dấu tab | (as-built) | `PostListPage.tsx:43-46,162`, `post-list-metadata.ts:29-31` | ✅ | Đã có trong `asBuiltPending` |
| 15 | Chi tiết: hero ảnh bìa + thư viện, badge danh mục + trạng thái ưu đãi, `h1`, địa chỉ / khu vực, tóm tắt | SPEC:49 | `PostDetail.tsx:64-72,201-234` | ✅ | Hero giữ nút chia sẻ, còn Dự án / Cho thuê đã bỏ → B-new-4 |
| 16 | Thanh thông số tin BĐS: Giá · Diện tích · PN/PT · Hướng · Mặt tiền · Số tầng; voucher: Hạn · Trạng thái (+ Giá); ô trống bỏ | SPEC:49 | `PostDetail.tsx:110-132`, `post-detail-specs.ts:51-69` | ✅ | |
| 17 | Tab: Tổng quan (nội dung + lưới thông tin có Bàn giao, Loại hình) · Ưu đãi (`OfferBox`) · Vị trí (khi có toạ độ / địa chỉ) · Hình ảnh · Tin liên quan; khối trống ẩn | SPEC:49 | `post-detail-sections.ts:5-25`, `PostDetail.tsx:138-197,249-255` | ✅ | |
| 18 | Cột phải: form `source=property_post` duy nhất + hotline | SPEC:49 | `PostContactBox.tsx:16-24`, `tin-bds/[slug]/page.tsx:118-122` | ✅ | Hotline nằm trong LeadForm, không phải khối tối "Gọi ngay" như Dự án. Spec chỉ ghi "+ hotline" nên chấp nhận |
| 19 | Điểm mạnh (`listingPages.propertyPosts.showStrengths`) + banner `#lead-form` ở danh sách và chi tiết | SPEC:44 | `PostListPage.tsx:137,202-203`, `tin-bds/[slug]/page.tsx:14,121-122` | ✅ | |
| 20 | Backfill Tin BĐS: loại hình, diện tích, PN/PT, hướng, mặt tiền, số tầng, địa chỉ từ tiêu đề / tóm tắt / nội dung; chỉ điền ô trống; dry-run mặc định; chặn prod / DB không phải dev; báo cáo MD | SPEC:50 | `src/lib/backfill/property-posts.ts:41-46,81-96`, `property-post-extract.ts:211-224`; báo cáo `docs/reports/backfill-listing-fields-2026-10-22-0134-apply.md` (38 quét / 37 điền / 1 bỏ / 0 lỗi) | ✅ | Bỏ qua **mọi** tin có ưu đãi, kể cả tin bán kèm ưu đãi; giá trị mâu thuẫn thì không điền → B-new-3 |
| 21 | Doc impact: ERD property-posts; API_SPEC tham số `/du-an`, `/tin-bds`, `project`; DESIGN; design-spec; ARCHITECTURE | SPEC:51 | `docs/API_SPEC.md:216-234` (§3.11 khớp `post-filters.ts`), `docs/ERD.md:328-335`, `docs/DESIGN.md` (6 hàng màn + 2 hàng khung), `.context/design-spec.md` §4, `docs/ARCHITECTURE.md` (`listRentals`) | ✅ | Doc as-built khớp code; intent docs không bị sửa |

## Kiểm lại Acceptance change doc (cả 3 màn)

| # | Acceptance | Status | Bằng chứng / ghi chú |
|---|---|---|---|
| A1 | `/du-an` + `/du-an/[slug]` khớp bố cục design ở desktop; responsive hợp lý (bộ lọc thành Sheet trên mobile) | ⚠️ PARTIAL (bằng chứng) | Cấu trúc khớp (phase review P1+P2 dòng 5, 9-12). Bộ lọc → `FilterSheet`. **Chưa có bằng chứng trình duyệt** (1440/768/390, VI/EN, không JS, LCP). Đây là Scope 4 của P3-T06; reviewer P3-T06 ghi là rủi ro còn lại, task file không có số đo → P-2 |
| A2 | `/cho-thue`, `/cho-thue/[slug]`, `/tin-bds`, `/tin-bds/[slug]` (+ danh mục) cùng layout với trường theo "Quyết định" | ✅ | Ma trận trên + phase review P1+P2 dòng 13-16 |
| A3 | Trường mới có trong admin (nhãn VI, localized khi là chữ), migration versioned, chỉ ADD | ✅ | Dự án: `migrations/20261021_135620_*`. Tin BĐS: `20261021_173246_*`. Trường Tin BĐS không có chữ cần localize (`address` công khai, không localized, đúng SPEC:47) |
| A4 | Bộ lọc qua `searchParams`, chia sẻ link giữ nguyên; số đếm đúng theo bộ lọc khác (hoặc ghi rõ cách đếm) | ✅ | 3 màn đều đếm ô tích + tab. Chip đơn chọn không đếm (B1, user duyệt 2026-10-22, đã có trong `asBuiltPending`). Sắp xếp không còn làm mất lọc đang chờ (P3-T06 #4) |
| A5 | Ô Pháp lý không có trên thanh thông số dự án | ✅ | `ProjectDetail` (phase review P1+P2 dòng 9) |
| A6 | Không có icon yêu thích | ✅ | Grep `\bHeart\b` trong `src/components`: 0 kết quả |
| A7 | Khối trống ẩn, không để khung rỗng | ✅ | `visiblePostSections`, `project-detail-view.ts:336`, `rental-detail-sections.ts`; khối LearnMore/FAQ `empty:hidden` (`PostListPage.tsx:199`) |
| A8 | Bản EN chạy như bản VI | ✅ | Test EN `/en/property-news` (`PostListPage.test.tsx`), `listingOptions.*` đủ vi/en (P3-T06 #2). Định dạng ngày hạn ưu đãi `/en` → openItem 3 |
| A9 | Test + typecheck + lint + build PASS | ✅ (build residual) | typecheck/lint/test PASS tại HEAD; build PASS trên worktree P3-T06 |

## Gaps

### (a) Lỗi code cần sửa trước close-out (CRITICAL/MAJOR)

**Không có.** Không thấy lệch chức năng nào so với SPEC:38-51 hay Acceptance.

### Phải xong trước close-out (không phải sửa code)

| # | Gap | Loại | Bằng chứng | Việc cần làm |
|---|---|---|---|---|
| P-1 | **[PARTIAL] Task file thiếu Verification summary / close-out**: `phase-3-task-01..06.md` và `phase-2-task-02.md` không có mục Verification summary, Doc impact hay Residual risk; ô Acceptance vẫn `[ ]`. Phase 1, P2-T01/T03/T04 thì có | Quy trình (AGENTS.md § Commit-First: task file là nguồn sự thật cho verification / doc impact / residual risk) | `phase-3-task-03.md` chỉ có 29 dòng, mục cuối là "Retry / Escalation"; tương tự T01/T04/T05 | Primary ghi close-out cho 7 task từ trailer commit + report review (lệnh, kết quả, số đo p95, doc impact, residual), rồi tick Acceptance |
| P-2 | **[PARTIAL] Acceptance A1, bằng chứng trình duyệt**: P3-T06 Scope 4 (6 trang × VI/EN × 1440/768/390, không JS, LCP, `pnpm build`) chưa có bằng chứng | Bằng chứng QA | Review P3-T06 "Rủi ro còn lại"; `phase-3-task-06.md:18` | Primary chụp hoặc kiểm 6 trang + slider trang chủ (gộp openItem 2), ghi vào `phase-3-task-06.md`. Không làm được thì ghi rõ "Residual: chưa QA trình duyệt" trong close-out và để user chấp nhận. Spec-validator không tự hạ Acceptance |
| P-3 | **as-built thiếu trong `asBuiltPending`** (xem (b)) | Spec | `.context/progress.json:2311-2332` | Thêm trước spec-publish |

### (b) As-built cần ghi spec ở spec-publish

**Đã có trong `asBuiltPending` (21 mục, `progress.json:2312-2331`):** đối chiếu khớp code, gồm B1–B6 của review trước và 7 mục phase 3 (bỏ neo `#content`, `?category=` cũ, PostCard 2 biến thể, hàng N phù hợp, `listingOptions.direction`, điều kiện FAQ JSON-LD 2 màn, chip không đếm).

**Còn thiếu (đề xuất thêm):**

| # | As-built | Bằng chứng |
|---|---|---|
| B-new-1 | `/tin-bds` **Hướng** và **Tình trạng bàn giao** là ô tích nhiều giá trị (`direction`/`handover` phân cách dấu phẩy, OR) **có số đếm**. Spec chỉ nêu tên tham số. Phase review trước (C5) dự đoán là chip | `post-filters.ts:123-124`, `PostListBody.tsx:106-111`, `API_SPEC.md:228-229` |
| B-new-2 | `/tin-bds` `priceMax=0` / `areaMax=0` = không giới hạn trên (`/du-an` vẫn coi `priceMax=0` là bộ lọc, xem (c) C-4) | `post-filters.ts:96-105`, `API_SPEC.md:225-226` |
| B-new-3 | Backfill Tin BĐS: **bỏ qua mọi tin có ưu đãi** (`offer.endAt` hoặc `voucherCode`), kể cả tin bán kèm ưu đãi; nhiều nguồn mâu thuẫn thì không điền mà đưa vào mục soát; hướng đứng một mình chỉ gợi ý | `backfill/property-posts.ts:41,46`; review P3-T05 "Bỏ qua tin voucher" và "Nguồn mâu thuẫn" |
| B-new-4 | Chi tiết Tin BĐS **giữ nút chia sẻ** ở hero (Dự án / Cho thuê đã bỏ, đã có trong `asBuiltPending` mục 1). Cần ghi là ngoại lệ có chủ ý, hoặc đưa vào backlog để thống nhất | `PostDetail.tsx:227-232` |
| B-new-5 | Mục `asBuiltPending` "/tin-bds nhận ?category=<slug> cũ (lọc + tab, noindex)" cần bổ sung: **canonical sang `/tin-bds/danh-muc/<slug>`** (P3-T06) | `post-list-metadata.ts:57-63` |
| B-new-6 | Mục "tab danh mục cho thuê đếm theo danh mục cấp 1" cần ghi rằng quy tắc này áp cho cả **Tin BĐS** (tin ở danh mục con tính vào cha) | `post-list-facets.ts:147-152,172` |
| B-new-7 | Ngày hạn ưu đãi `/en` theo `en-US` (MM/DD/YYYY) như mọi ngày khác trên site. Ghi khi user chốt giữ; nếu user chọn `dd/MM/yyyy` thì chuyển sang (c) | `src/lib/format.ts:5`; review P3-T02 MINOR-2 |
| B-new-8 (tuỳ chọn) | Tham số `q` ở `/tin-bds` khớp tiêu đề + tóm tắt + địa chỉ + phường + tỉnh. API_SPEC đã có, spec intent chưa có | `post-list-facets.ts:85-87`, `API_SPEC.md:222` |

### (c) Backlog sau BL-052

| # | Việc | Nguồn | Ghi chú |
|---|---|---|---|
| C-1 | `/tin-bds?category=<slug thật>` đang noindex kèm canonical sang trang khác (tín hiệu trái nhau). Đề xuất 308 sang trang danh mục cho cả `/tin-bds` và `/cho-thue` | openItem 1; review P3-T06 MINOR-1 | Không gây hại hiện tại (trang danh mục tự index được) → backlog |
| C-2 | QA trực quan `CardSlider` trang chủ 390/768/1280 | openItem 2 | Gộp vào P-2 nếu làm được trước close-out; không thì đưa vào checklist QA staging |
| C-3 | Định dạng ngày `/en`. Nếu user muốn `dd/MM/yyyy` thì đổi `formatDate` cho toàn site (không riêng ưu đãi) | openItem 3 | Chờ user. Spec BL-052 (SPEC:38-51) **không** bắt `dd/MM/yyyy`; chỉ task P3-T02 ghi. Không chặn close-out |
| C-4 | `/du-an` `priceMax=0` vẫn lọc "giá ≤ 0" (ra trang rỗng), lệch với `/tin-bds`. Nên thống nhất với `post-filters.parseRange` | openItem 4; `project-filters.ts:99-105` | MINOR, chỉ xảy ra khi URL gõ tay hoặc kéo đầu trên về 0 |
| C-5 | Index `rentals_amenities(value, parent_id)` nếu số tin lớn; ca `locale=en` cho đếm tiện ích | review P2-T04 residual + MINOR | |
| C-6 | GIST index `property_posts.location` khi có lọc bản đồ | review P3-T01 MINOR-3 | Ngoài phạm vi |
| C-7 | Tăng `hookTimeout` cho integration test (timeout `beforeAll` khi chạy cả bộ, lặp ở nhiều review) | review P2-T04, P3-T02/T05/T06 | Hạ tầng test |
| C-8 | `isOfferPost` (backfill) trùng `hasPostOffer` (`post-kind.ts:18`). Nên gom về một helper | `backfill/property-posts.ts:41` | MINOR DRY |

**`BACKLOG.md` chưa có C-1..C-4** (grep `308|priceMax=0|en-GB|CardSlider` không có kết quả). Primary / change-request cần ghi khi close-out.

## Đánh giá `openItems` (`progress.json:2338-2343`)

| openItem | Trước close-out? | Lý do |
|---|---|---|
| 1. `/tin-bds?category=` noindex + canonical | **Không**, đưa vào backlog (C-1) | Không lệch spec, không gây hại trước mắt; 308 đổi hành vi cả `/cho-thue` nên cần task riêng |
| 2. Chụp `CardSlider` trang chủ | **Nên làm** cùng P-2 | Đụng trang chủ (blast radius rộng). Nếu không làm được thì ghi residual và đưa vào checklist QA staging |
| 3. Ngày `/en` | **Không chặn**; cần user chốt | Spec intent không quy định. Giữ → as-built B-new-7; đổi → C-3 (cả site) |
| 4. `/du-an priceMax=0` | **Không**, đưa vào backlog (C-4) | MINOR, chỉ khi URL gõ tay hoặc kéo về 0 |

## Residual risk

- `pnpm build` không chạy lại tại HEAD (PASS trên worktree P3-T06 trước merge; merge sau đó chỉ có progress).
- Chưa kiểm trình duyệt thật (bố cục desktop so với design, mobile Sheet, không JS, LCP). Xem P-2.
- p95 `/tin-bds` (248ms) và `/cho-thue` sau khi thêm đếm tiện ích (+2–4ms local, 32 tin) do builder đo, chưa đo trên dữ liệu lớn.
- Change doc ghi "Voucher/Ưu đãi: lọc theo loại tin". Spec 1.46.0 hiện thực điều này bằng tab danh mục (không có tham số loại tin riêng). Đúng spec, nhưng phụ thuộc admin có danh mục voucher / ưu đãi riêng.
