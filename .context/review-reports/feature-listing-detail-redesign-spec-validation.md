Agent: spec-validator

# Spec validation (pre-plan): feature-listing-detail-redesign (BL-052), round 1

- Mode: **Spec validation** (trước khi chạy task), kèm kiểm plan 16 task + waves.
- Nguồn đã đọc: `spec/changes/2026-10-21-listing-detail-redesign.md`; ảnh `docs/specs/listing-detail-redesign/list-du-an.webp`, `detail-du-an.webp`; `git diff SPECIFICATIONS.md` (1.45.1 → 1.46.0: khối BL-052 ở Giao diện + ghi chú F2/F3/F4 + nhãn "(bố cục thay bởi BL-052)" trên khối BL-045); `spec/updates/2026-10-21-listing-detail-redesign.md` (có); `spec/test-scope/current.json` (specVersion 1.46.0, scopeVersion 58); `tasks/feature-listing-detail-redesign/phase-{1,2,3}-task-0N.md` (16 file); `.context/progress.json` feature `listing-detail-redesign` (L2041–2228).
- Code đối chiếu: `src/collections/Projects.ts`, `src/collections/projects/market-blocks.ts`, `src/collections/Rentals.ts`, `src/collections/PropertyPosts.ts`, `src/globals/SiteSettings.ts`, `src/lib/projects/project-filters.ts`, `src/lib/projects/project-queries.ts`, `src/shared/types/api.ts`, `src/components/home/HeroSearch.tsx`, `src/i18n/routing.ts`, `src/lib/i18n/counterpart-url.ts`, route `src/app/(frontend)/[locale]/{du-an,cho-thue,tin-bds}/**`, nơi import component cũ.

## Verdict: PASS có điều kiện

Không có BLOCKER. Có 3 MAJOR cần xử lý trước khi chạy wave 1A (F1, F2) hoặc trước P1-T04 / P2-T02 (F3). Còn lại là MINOR, xử lý trong task tương ứng hoặc gom ở P3-T06.

Điều kiện để chạy:
1. **F1:** ghi rõ trong spec rằng thứ tự "Giá từ" lệch quyết định 6 của change doc (kèm lý do), hoặc đảo lại cho khớp change doc.
2. **F2:** chốt một cách tránh xung đột file `src/i18n/messages/{vi,en}.json` giữa các task chạy song song.
3. **F3:** ghi rõ thẻ mới cũng đổi giao diện các khối trang chủ (BL-044) và thêm việc kiểm `ProjectListings` vào task.

## 1. Ma trận phủ: Quyết định + Acceptance của change doc → spec delta → task

| # | Yêu cầu (change doc) | Spec 1.46.0 (khối BL-052) | Task | Trạng thái | Ghi chú |
|---|---|---|---|---|---|
| D-DA1 | Loại sản phẩm chọn nhiều, danh sách cố định; tag thẻ + lọc "Loại hình" có đếm; tab vẫn là `category` | "Dự án — trường mới" `productTypes` (8 giá trị theo "Chế độ chạy") · "`/du-an`" tab = `category`, lọc `type` | P1-T01, P1-T04, P1-T05 | OK | Danh sách khớp đúng 8 giá trị ở "Chế độ chạy" L93 |
| D-DA2 | Sản phẩm (số lượng · loại · diện tích), Link video, mô tả tiện ích + ảnh khối tiện ích; khối trống thì ẩn | `products` ≤ 8, `videoUrl`, `amenities[].description`, `amenitiesImage`; "Khối trống … ẩn cả khối lẫn tab" | P1-T01, P1-T06 | OK | `notBelow` có sẵn (`market-blocks.ts:43`), validator video có sẵn (`Rentals.ts:224`) |
| D-DA3 | Không thêm trường pháp lý ngắn; bỏ ô Pháp lý trên thanh thông số | "**Không** thêm trường giá / pháp lý ngắn"; thanh thông số "**không có ô Pháp lý**"; lưới thông tin không có Pháp lý | P1-T06 | OK | Ảnh design còn hàng "Pháp lý" trong lưới thông tin; spec đã bỏ, đúng quyết định 3 |
| D-DA4 | Giữ các khối cũ, vẽ lại, đặt sau Hình ảnh, có tab khi có dữ liệu | "Tab dính … Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách (kèm PDF, `#documents`) · Tin liên quan · Hỏi đáp — đặt sau khối Hình ảnh" | P1-T06 | OK | Thêm "Nổi bật" (highlights có sẵn): hợp lý |
| D-DA5 | Tiện ích nổi bật chọn nhiều → bộ lọc | `featuredAmenities` 7 giá trị; lọc `feature` AND | P1-T01, P1-T04, P1-T05 | OK | AND là quyết định của agent (giống tiện ích Cho thuê F3), có ghi |
| D-DA6 | Mức giá = giá thấp nhất trong `priceTable.priceFrom`, không thêm trường giá; không có giá → "Liên hệ" | "Giá dự án …": `priceFromVnd` > 0 **trước**, rồi mới min `priceTable[].priceFrom` | P1-T04, P1-T06 | **PARTIAL / lệch** | Xem **F1** |
| D-DA7 | Thẻ nổi bật dùng `isFeatured` | Thẻ nổi bật ≤ 5 tin `isFeatured` khớp bộ lọc, chỉ trang 1, không lặp trong lưới | P1-T04, P1-T05 | OK | Có `isFeatured` trên projects (`content-defaults.ts:98`) |
| D-DA8 | Thanh thông số: Giá từ · Quy mô · Diện tích · Chủ đầu tư · Bàn giao (+ ô 6) | + "Loại hình" (`productTypes`) | P1-T06 | OK | `handoverTime` thật ra là `scale.handoverTime` (`Projects.ts:82`), xem F15 |
| D-CT | Thẻ Cho thuê: giá/tháng · DT · PN · PT; tag loại hình + nội thất | "`/cho-thue`" thẻ | P2-T01 | OK | |
| D-CT | Thanh thông số chi tiết 6 ô | "Chi tiết Cho thuê": Giá thuê · DT · PN/PT · Nội thất · Hướng · Dọn vào từ | P2-T03 | OK | Trường có sẵn (`Rentals.ts:128, 203–205`) |
| D-CT | Lọc trái: **Loại hình**, Tỉnh, Dự án, Giá, DT, PN, Nội thất, Tiện ích | Không có "Loại hình" trong lọc trái, vì tab danh mục đóng vai này; ghi "lệch change doc có lý do" | P2-T02 | OK (có ghi lệch) | Lý do hợp lý: Cho thuê chỉ có một trục loại hình (`category`) |
| D-CT | Tab chi tiết + Điều khoản; video `videoUrl` | "Chi tiết Cho thuê" | P2-T03 | OK | |
| D-BDS | Trường có cấu trúc: Loại hình, DT, PN, PT, Hướng, Mặt tiền, Số tầng, Tình trạng bàn giao, Địa chỉ + toạ độ; tin cũ trống, UI ẩn | "Tin BĐS — trường mới" | P3-T01 | OK | Xem F9 (quyền xem địa chỉ/toạ độ) |
| D-BDS | Voucher chung lưới, thẻ riêng; chi tiết giữ hộp mã + điều kiện | "`/tin-bds`" thẻ voucher; "Chi tiết Tin BĐS" giữ `OfferBox` | P3-T02, P3-T03, P3-T04 | OK | Xem F10 (cách nhận biết voucher) |
| D-Chung | Header/footer/banner tư vấn/dải lợi ích giữ nguyên | "Giữ nguyên: header, footer, `ConsultBanner`, `StrengthsBlock` …" | mọi task trang | OK | |
| D-Chung | "Tìm hiểu thêm" + FAQ riêng từng màn, nhập trong Cài đặt website; trống thì ẩn | `listingPages.{projects,rentals,propertyPosts}.learnMore/faqs` | P1-T01, P1-T02, P1-T05, P2-T02, P3-T03 | OK | Xem F8 (trang ≥ 2) |
| CĐ-chạy | Chip "Tìm nhanh" sửa trong admin, mỗi màn 1 bộ | `quickSearch` ≤ 8 | P1-T01, P1-T02 | OK | |
| CĐ-chạy | Backfill bằng script, chỉ ô trống, DB dev, báo cáo | "Điền dữ liệu cũ (script, dev only)" | P1-T07, P3-T05 | OK | |
| CĐ-chạy | Form **ứng tuyển** giữ ô "Lời nhắn" | — | — | Ngoài phạm vi | Thuộc BL-054 (Tuyển dụng), xem F14 |
| CĐ-chạy | Mobile: bộ lọc thành sheet, cột phải xuống dưới | Có ở đầu khối BL-052 | P1-T02, P1-T03, các task trang | OK | |
| AC1 | `/du-an` + chi tiết khớp ảnh desktop; responsive | Khung danh sách + "Chi tiết Dự án" | P1-T05, P1-T06 | OK | Xem F13 (vị trí ô "Xem tất cả N ảnh") |
| AC2 | Cho thuê / Tin BĐS (+ danh mục) cùng layout | Có | P2-T02, P2-T03, P3-T03, P3-T04 | OK | Xem F4 (trang khu vực) |
| AC3 | Trường mới trong admin, nhãn VI, localized với chữ, migration chỉ ADD | Có; mỗi phase 1 migration (P1-T01, P3-T01) | P1-T01, P3-T01 | OK | |
| AC4 | Lọc qua `searchParams`, giữ khi chia sẻ link; số đếm đúng hoặc ghi rõ cách đếm | "Số đếm … trừ chính chiều đó"; mục 0 mờ; danh sách tỉnh chỉ tỉnh có tin | P1-T04, P2-T01, P3-T02 | OK | Cách đếm ghi rõ, kiểm được |
| AC5 | Không ô Pháp lý | Có | P1-T06 | OK | |
| AC6 | Không icon tim | Có | P1-T02 … | OK | Ảnh design có tim, spec bỏ đúng |
| AC7 | Khối trống ẩn | Có | P1-T03, P1-T06, P2-T03, P3-T04 | OK | |
| AC8 | EN như VI (nhãn i18n đủ) | BR-07 giữ; `/en` bỏ hàng thiếu EN; nhãn select qua i18n | mọi task trang | OK | Xem F2 (xung đột file i18n) |
| AC9 | test + typecheck + lint + build PASS | Có trong mọi task (build ở các task trang) | tất cả | OK | |
| NFR | p95 ≤ 500ms | "Trang danh sách (khung chung)" p95 ≤ 500ms; Dự án lọc trong bộ nhớ, trần 1000 | P1-T04, P2-T01, P3-T02 | OK, có rủi ro | Xem F11 |

## 2. Đối chiếu với spec còn hiệu lực

- **BL-045:** các đoạn "Trang danh sách", "Thẻ dùng chung", "Trang chi tiết", "Đăng tin BĐS danh sách" đã gắn "(bố cục thay bởi BL-052)"; F2/F3/F4 có câu dẫn sang khối BL-052. Khối BL-052 giữ các hành vi BL-045 (tham số `q`/`developer`/`sort`, trần 1000, canonical/noindex, breadcrumb trên ảnh, scroll-spy, tin đã thuê). Có ghi rõ hai chỗ đảo quyết định cũ: "thêm lại khối ảnh mà BL-045 đã bỏ" và `/tin-bds` dùng hero danh sách thay hero thấp. Không thấy mâu thuẫn chưa ghi, trừ F1 (thứ tự giá) và F3 (thẻ trang chủ).
- **BR-06:** thẻ voucher hiện trạng thái Còn hạn / Đã kết thúc; thẻ nổi bật chỉ lấy tin còn hiệu lực. OK.
- **BR-07:** `h1` luôn có (lấy chữ `pageHeroes` mặc định); `/en` bỏ hàng thiếu EN, không rơi về VI. OK.
- **F2 tham số cũ:** `province` một slug vẫn chạy (link từ trang chủ `HeroSearch.tsx:77` chỉ gửi `province` + `status`). OK.
- **NFR p95:** có ghi; rủi ro thực thi ở F11.

## 3. Các quyết định agent tự chốt

| Quyết định | Đánh giá |
|---|---|
| Cho thuê không lặp "Loại hình" trong lọc trái | Hợp lý, có ghi "lệch change doc có lý do". OK |
| Giá dự án = `priceFromVnd`, rồi mới min `priceTable.priceFrom` | Lệch quyết định 6 nhưng **không ghi là lệch** → F1 |
| Tham số giá dự án tính bằng **tỷ** (0–50, bước 1; 50 = không giới hạn) | Rõ, kiểm được. Không nhất quán với Cho thuê (VNĐ, giữ để link cũ chạy). Chấp nhận được vì đã ghi. Tin BĐS cũng tính bằng tỷ nhưng chưa ghi khoảng/bước → F12 |
| Thẻ nổi bật không lặp trong lưới ở mọi trang; "N phù hợp" gồm thẻ nổi bật | Rõ, có test trong P1-T04/P2-T01/P3-T02. OK |
| Số đếm "trừ chính chiều đó"; mục 0 mờ; tỉnh chỉ liệt kê nơi có tin | Rõ, kiểm được. OK |
| Tỉnh Cho thuê chọn **một**, vì phường phụ thuộc tỉnh | Hợp lý; nhưng "ô tích một lựa chọn" sai ngữ nghĩa a11y → F16 |
| Tiện ích nổi bật dự án lọc AND | Hợp lý (thống nhất với F3), có ghi. OK |
| Nhận biết voucher theo `offer.endAt`/`voucherCode` | Có ghi, còn trường hợp biên → F10 |
| Lọc + đếm Dự án trong bộ nhớ (trần 1000) | Theo cách BL-045 đang chạy (`project-queries.ts:84–128`). OK |

## 4. Plan: dependency, wave, migration, review level

- Wave: 1A {T01, T02, T03} → 1B {T04, T06, T07} → 1C {T05} → 2A {P2-T01, P2-T03} → 2B {P2-T02} → 3A {P3-T01} → 3B {P3-T02, P3-T04, P3-T05} → 3C {P3-T03} → 3D {P3-T06}. Thứ tự phụ thuộc đúng.
- Migration: phase 1 chỉ P1-T01; phase 2 không có; phase 3 chỉ P3-T01. Đạt.
- Review level: STRICT ở mọi task. Hợp lý: schema, thẻ dùng chung, query công khai, script ghi hàng loạt, xoá component dùng chung.
- Acceptance từng task kiểm được: có test cụ thể (parse/serialize, đếm, nổi bật không lặp, guard, idempotent, migration up/down/up).
- Hai task song song sửa cùng file:
  - **`src/i18n/messages/vi.json` + `en.json`** là file duy nhất cho mỗi ngôn ngữ (Glob xác nhận). Gần như mọi task đều thêm key, kể cả các task cùng wave (1A: T01/T02/T03; 1B: T04/T06; 2A; 3B) → **F2**.
  - `RelatedPosts.tsx` nằm trong blast radius của cả P3-T02 lẫn P3-T04 (cùng wave 3B) → F6.
  - `SimilarProjects` (test): P1-T04 "cập nhật test liên quan … Dự án tương tự", còn P1-T06 thay khối này bằng `SimilarCarousel` (cùng wave 1B) → F6.
  - `src/lib/projects/project-listings.ts` có trong blast radius P1-T04 nhưng thuộc "Tin liên quan" của trang chi tiết (P1-T06). Scope P1-T04 không cần sửa file này → F6.

## 5. Findings

### F1 — MAJOR — Thứ tự "Giá từ" của dự án lệch quyết định của user nhưng không ghi là lệch
- Change doc, Quyết định 6: "Mức giá lấy từ giá thấp nhất trong bảng giá (`priceTable.priceFrom`) — không thêm trường giá".
- Spec 1.46.0, mục "Giá dự án …": "`priceFromVnd` nếu > 0, không thì giá thấp nhất > 0 trong `priceTable[].priceFrom`". P1-T04 scope 1 làm theo spec.
- Hậu quả: dự án có `priceFromVnd` khác giá thấp nhất trong bảng giá sẽ hiện, lọc và sắp theo `priceFromVnd`, trái với quyết định đã chốt. Chế độ auto proceed nên không có checkpoint nào bắt được lệch này. Ở chỗ khác (Cho thuê) spec đã ghi "lệch change doc có lý do", ở đây thì không.
- Cách sửa (chọn một):
  - (a) Đảo theo change doc: min `priceTable[].priceFrom` > 0 trước, rồi mới `priceFromVnd`.
  - (b) Giữ thứ tự hiện tại, nhưng ghi "lệch Quyết định 6 — lý do: `priceFromVnd` là ô admin nhập tay và đang là nguồn sắp xếp BL-045 / 'Giá từ' chi tiết" ngay trong mục "Giá dự án". Cập nhật P1-T04 scope 1 cho khớp.
- Tôi không tự chọn thay user.

### F2 — MAJOR — Các task song song cùng sửa file i18n duy nhất
- `src/i18n/messages/vi.json` và `en.json` là file i18n duy nhất. Blast radius ghi "i18n `messages/*`" ở P1-T01, P1-T02, P1-T03 (wave 1A), P1-T04, P1-T06 (1B), P2-T01, P2-T03 (2A), P3-T02, P3-T04 (3B).
- Việc này vi phạm nguyên tắc "không hai task song song sửa cùng file chính". JSON dễ xung đột khi merge; nếu dispatcher phải chạy lại tuần tự thì mất lợi thế song song.
- Cách sửa: giao mỗi task một namespace riêng, thêm vào **cuối** object gốc (vd T01 `listingOptions`, T02 `listing`, T03 `detail`, T04 `page.projects.card`, T06 `page.projects.detail`…), và ghi luật này vào từng task. Một cách khác: cho P1-T01 tạo trước toàn bộ khung key của phase 1. Ghi quy ước vào phần "Plan" của các task trên.

### F3 — MAJOR — Thẻ mới đổi giao diện trang chủ, nhưng change doc chỉ nói đổi thân trang danh sách / chi tiết
- `ProjectCard` đang dùng ở `src/components/home/ProjectsSlider.tsx:5`, `RentalCard` ở `src/components/home/RentalsTabs.tsx:6`, `PostCard` ở `src/components/home/OffersSlider.tsx:4`. Spec chỉ ghi rõ cho thẻ Dự án ("dùng chung lưới, slider trang chủ, 'Dự án tương tự'"). Với thẻ Cho thuê và thẻ BĐS/voucher, spec không nói trang chủ đổi theo; P2-T01 và P3-T02 chỉ ghi "cập nhật nơi dùng".
- Change doc mục "Chung": "chỉ đổi phần thân trang danh sách/chi tiết". Đổi thẻ ở trang chủ (BL-044, đã duyệt) là thay đổi ngoài phạm vi được nói rõ, trong khi đang chạy auto proceed.
- `src/components/projects/ProjectListings.tsx:3–4` (Tin liên quan trong chi tiết dự án) dùng `PostCard` và `RentalCard`. Nó sẽ đổi ở P2-T01 và P3-T02, nhưng P2-T01 không liệt kê nơi này.
- Cách sửa: thêm một dòng vào khối BL-052, mục thẻ: "Thẻ mới thay cả ở trang chủ (Dự án nổi bật, Cho thuê, Ưu đãi) và Tin liên quan của chi tiết dự án — quyết định agent, lý do thống nhất thẻ như BL-045". Nếu không muốn đổi trang chủ thì giữ biến thể thẻ cũ cho trang chủ. Thêm `ProjectListings` vào acceptance của P2-T01.

### F4 — MINOR — "Trang khu vực" Cho thuê chưa có route
- `src/i18n/routing.ts:20` và `src/lib/i18n/counterpart-url.ts:24` có khai `/cho-thue/khu-vuc/[province]`, nhưng không có `page.tsx` (Glob `src/app/**/khu-vuc/**` rỗng).
- Spec BL-052 ghi "`/cho-thue` (+ danh mục / khu vực)". P2-T02 ghi "trang khu vực (nếu có)", acceptance ghi "(+ khu vực)".
- Cách sửa: ghi vào spec / P2-T02 rằng trang khu vực chưa có (lọc tỉnh dùng `?province=`), và acceptance chỉ áp dụng cho `/cho-thue` + `danh-muc/[category]`. Không thêm route mới.

### F5 — MINOR — `/cho-thue?category=` từ ô tìm kiếm trang chủ và tab danh mục dạng route
- `HeroSearch.tsx:55–60` gửi `category` dưới dạng tham số query (`/cho-thue?category=can-ho…`), còn tab mới là link tới `/cho-thue/danh-muc/[category]`.
- Cách sửa: ghi vào P2-T02 rằng `?category=` vẫn lọc đúng và tab tương ứng hiện là đang chọn (hoặc chuyển hướng sang route danh mục, giữ các tham số khác), kèm test.

### F6 — MINOR — Các task cùng wave chồng nhau ở file phụ
- P3-T02 và P3-T04 cùng ghi `RelatedPosts`: giao `RelatedPosts.tsx` cho P3-T04; P3-T02 chỉ sửa `PostCard`.
- P1-T04 và P1-T06 cùng đụng "Dự án tương tự": P1-T04 không sửa `SimilarProjects*`.
- Bỏ `project-listings.ts` khỏi blast radius của P1-T04.

### F7 — MINOR — Dọn component cũ: nêu rõ những nơi còn dùng phải giữ
- `DetailLayout` / `DETAIL_ASIDE_CARD_CLASS` còn dùng ở `src/app/(frontend)/[locale]/dich-vu/[slug]/page.tsx:11` và `src/components/careers/JobDetail.tsx:7` (BL-054 chưa làm). P3-T06 liệt kê "biến thể `DetailLayout`" vào danh sách xoá.
- Cách sửa: ghi tên hai nơi này vào P3-T06 là phải giữ; chỉ xoá `DetailGalleryHero` / `DetailTitleCard` / `DetailGalleryParts` / `ListSearchBar` sau khi grep không còn import.
- Nếu P1-T02 chỉnh `Pagination` thì Tin tức / Tuyển dụng / các nơi khác đổi theo. Cần ghi như vậy trong P1-T02, hoặc thêm biến thể thay vì sửa mặc định.

### F8 — MINOR — Khối "Tìm hiểu thêm" + FAQ (kèm JSON-LD `FAQPage`) lặp ở mọi trang phân trang và trang đã lọc
- Spec không nói khối này chỉ hiện ở trang 1 hay ở mọi trang.
- Đề xuất: chỉ phát JSON-LD `FAQPage` ở trang sạch (trang 1, không lọc); khối hiển thị thì tuỳ chọn. Ghi một câu vào mục "Trang danh sách (khung chung)" (5).

### F9 — MINOR — Quyền xem `address` / `location` của Tin BĐS
- Cho thuê có `access.read: readExactAddress` + `showExactAddress` (`Rentals.ts:192–194`). Trường mới của Tin BĐS không nói rõ là công khai.
- Đề xuất: ghi rõ "`address` / `location` Tin BĐS là công khai (không có cờ ẩn)", hoặc dùng lại cơ chế của Cho thuê. Ghi vào spec + P3-T01.

### F10 — MINOR — Trường hợp biên khi nhận biết voucher
- Tin BĐS bán nhà có kèm ưu đãi (có `offer.endAt`) sẽ dùng thẻ voucher, tức là mất giá và diện tích trên thẻ.
- Đề xuất: ghi rõ quy tắc ưu tiên (vd có `propertyType` / `priceVnd` thì dùng thẻ BĐS + badge ưu đãi). Nếu không đổi thì ghi "chấp nhận".

### F11 — MINOR — Rủi ro p95 khi đếm theo từng chiều cho Cho thuê / Tin BĐS
- Payload Local API không có group-by. Đếm "trừ chính chiều đó" cho tỉnh (~34), danh mục và tiện ích có thể cần nhiều truy vấn `count` cho mỗi request.
- P2-T01 và P3-T02 đã yêu cầu đo và ghi số. Đề xuất ghi thêm phương án dự phòng: SQL tổng hợp qua `payload.db.drizzle` chỉ đọc, hoặc cache theo tag. Ghi residual risk nếu p95 > 500ms.

### F12 — MINOR — Thiếu khoảng / bước của thanh trượt
- Tin BĐS "Mức giá (tỷ)" và "Diện tích", Cho thuê "Giá thuê (triệu/tháng)" và "Diện tích" chưa có min / max / bước và giá trị "không giới hạn". Dự án đã có (0–50+ tỷ, bước 1).
- Ghi vào khối BL-052 để thanh trượt và tham số URL kiểm được.

### F13 — MINOR — Vị trí ô "Xem tất cả N ảnh"
- Ảnh `detail-du-an.webp` đặt chữ này trên **thumbnail đầu (trên cùng)**; change doc + spec + P1-T03 ghi "ảnh cuối". Theo change doc là đúng thứ bậc nguồn.
- Đề xuất: ghi "lệch ảnh: theo change doc" để reviewer không bắt lỗi khi so ảnh.

### F14 — MINOR — Change doc có một mục thuộc BL-054
- "Form ứng tuyển giữ ô 'Lời nhắn'" (mục Chế độ chạy L95) là việc của Tuyển dụng (BL-054). Spec BL-052 và các task không phủ mục này, vậy là đúng.
- Đề xuất: chuyển hoặc chép mục này sang `spec/changes/2026-10-21-news-careers-contact-redesign.md` để không bị mất.

### F15 — MINOR — Đường dẫn trường và cờ chưa chính xác
- Spec / P1-T06 viết `handoverTime`, thực tế là `scale.handoverTime` (`Projects.ts:73–83`).
- Dải Điểm mạnh ở **chi tiết** Dự án dùng cờ nào chưa ghi (spec "nếu bật"). `showProjectStrengths` hiện dành cho `/du-an`.
- Đề xuất: ghi `scale.handoverTime`, và chốt chi tiết Dự án dùng `showProjectStrengths`, chi tiết Cho thuê / Tin BĐS dùng `listingPages.<key>.showStrengths`. P2-T03 / P3-T04 đã giả định như vậy; spec "Chi tiết Cho thuê" chưa nói.

### F16 — MINOR — Ô tích dùng cho lựa chọn đơn
- Tỉnh/thành Cho thuê là "ô tích … một lựa chọn". Về a11y nên dùng nhóm radio (hoặc chip một lựa chọn như "Tình trạng").
- Ghi vào spec / P2-T02 để `CheckboxFacetList` có biến thể `single` dùng role radio.

## 6. Gap list cho builder / loop

| ID | Mức | Loại | Requirement | Task liên quan |
|---|---|---|---|---|
| F1 | MAJOR | PARTIAL | Quyết định 6 (giá từ bảng giá) | P1-T04, P1-T06 + spec mục "Giá dự án" |
| F2 | MAJOR | PLAN | Song song không đụng cùng file | P1-T01..T06, P2-T01/T03, P3-T02/T04 |
| F3 | MAJOR | SCOPE | "Chỉ đổi thân trang danh sách / chi tiết" | P1-T04, P2-T01, P3-T02 + spec mục thẻ |
| F4 | MINOR | PARTIAL | AC2 (trang khu vực) | P2-T02 |
| F5 | MINOR | PARTIAL | AC4 (link cũ / chia sẻ) | P2-T02 |
| F6 | MINOR | PLAN | Song song | P1-T04/T06, P3-T02/T04 |
| F7 | MINOR | RISK | Dọn không phá trang khác / BL-054 | P3-T06, P1-T02 |
| F8 | MINOR | GAP | JSON-LD FAQ danh sách | P1-T02 |
| F9 | MINOR | GAP | Trường địa chỉ Tin BĐS | P3-T01, P3-T04 |
| F10 | MINOR | EDGE | Thẻ voucher | P3-T02 |
| F11 | MINOR | NFR | p95 ≤ 500ms | P2-T01, P3-T02 |
| F12 | MINOR | GAP | Thanh trượt Cho thuê / Tin BĐS | P2-T02, P3-T03 |
| F13 | MINOR | CLARITY | So ảnh design | P1-T03 |
| F14 | MINOR | SCOPE | Mục BL-054 trong doc BL-052 | change doc BL-054 |
| F15 | MINOR | CLARITY | `scale.handoverTime`, cờ Điểm mạnh ở chi tiết | P1-T06, P2-T03, P3-T04 |
| F16 | MINOR | A11Y | Lựa chọn đơn bằng ô tích | P2-T02, P1-T02 |

Thống kê: BLOCKER 0 · MAJOR 3 · MINOR 13. Kết luận **PASS có điều kiện**: sửa F1–F3 (spec / task) trước khi chạy wave 1A. MINOR xử lý trong task tương ứng hoặc gom ở P3-T06.

## Residual risk
- Không chạy verify command (pre-plan, chưa có code mới).
- Không đo p95 thật.
- Ảnh design chỉ xem ở độ phân giải thu nhỏ; chi tiết nhỏ (khoảng cách, cỡ chữ) chưa đối chiếu.
