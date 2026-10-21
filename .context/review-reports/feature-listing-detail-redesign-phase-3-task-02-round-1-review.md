Agent: reviewer

# Review — feature-listing-detail-redesign · phase-3-task-02 · round 1

- Task: `tasks/feature-listing-detail-redesign/phase-3-task-02.md` (BL-052): dữ liệu danh sách Tin BĐS (lọc / đếm / nổi bật / sắp xếp) + thẻ BĐS / voucher
- Worktree: `D:\prj\bds\.claude\worktrees\agent-a780d52efbdc5ce09` (branch `worktree-agent-a780d52efbdc5ce09`, base staging `1f51ecd`), code chưa commit
- Review level: **STRICT**
- Reason: query công khai mới (quét + lọc + đếm trong bộ nhớ), tham số URL mới (parser), thẻ dùng chung `PostCard` đổi mặc định (ảnh hưởng trang chủ, tin liên quan, trang dự án), BR-06 (thứ tự + badge ưu đãi hết hạn), xoá API nội bộ `listPublicPosts` / `findFeaturedPost`.

## Blast radius
- `src/lib/posts/post-queries.ts` (`listPublicPostListing` thay `listPublicPosts` + `findFeaturedPost`; `POST_CARD_FIELDS` thêm `province`, `ward`, `propertyType`, `areaM2`, `bedrooms`, nên mọi nơi dùng nó cũng đổi: `home-queries.ts`, `project-listings.ts`, `findRelatedPosts`)
- Mới: `src/lib/posts/post-filters.ts`, `src/lib/posts/post-list-facets.ts`; đổi `post-listing.ts`, `post-view.ts` (`PostCardData` thêm `kind`, `hasOffer`, `propertyType`, `placeLabel`, `areaM2`, `bedrooms`)
- `src/components/posts/PostCard.tsx`: mặc định `listing`; nơi gọi đã grep:
  - `OffersSlider.tsx:36`: `variant="home"`, giữ thẻ cũ, đúng spec "trang chủ giữ biến thể"
  - `RelatedPosts.tsx:19` và `ProjectListings.tsx:56`: không truyền variant nên sang `listing`. Đúng spec dòng 43: thẻ "Tin liên quan" / thẻ trong trang chi tiết dùng thẻ mới.
  - `PostListBody.tsx` (lưới + `feature`)
- `listPublicPosts` / `findFeaturedPost`: không còn ai gọi trong `src/` và `tests/`. Chỉ còn một comment cũ (xem MINOR-1).
- Route `/tin-bds` chưa đọc tham số mới (P3-T03 nối). `PostListPage.tsx:44` vẫn gọi `loadPostListing` không có `filters`, nên hành vi công khai hiện tại = không lọc.
- Có chồng file với P3-T04 (`agent-ad1fa201ce0555c06`):
  - `src/i18n/messages/vi.json` + `en.json`: cả hai thêm namespace ở **cuối file**, gần như chắc chắn xung đột text khi merge, primary gộp tay.
  - `src/payload-types.ts`: chỉ EOL.
  - Không chồng: `RelatedPosts.tsx`, `PostDetail.tsx`, `post-detail-sections.ts`, `PostContactBox.tsx`, route `tin-bds/[slug]`, `post-components.test.tsx` (P3-T04 không sửa file này; task này có sửa). `post-view.ts` chỉ task này sửa.
  - P3-T04 dựng `related` qua `toPostCards` (không tạo `PostCardData` bằng tay), nên field mới không làm vỡ typecheck của P3-T04. Phần render thẻ trong test chi tiết của P3-T04 sau merge chưa kiểm được → Residual risk.

## Verify commands + result (chạy trong worktree, `.env.local` → DB `tami_wt52_p1t05`, redis 11)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0; 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs`, ngoài diff) |
| `pnpm test` (toàn bộ) | 381/385 file PASS, 3783 test PASS. 4 file integration FAIL khi chạy chung: `access`, `jobs-email`, `media-upload`, `session-refresh`, đều ngoài diff. `property-posts.test.ts` PASS |
| Chạy riêng 4 file trên + `property-posts.test.ts` | Cả 5 PASS (25 / 5 / 20 / 5 / 27 test). Lỗi khi chạy chung là timeout `beforeAll`, không phải regression |
| `vitest run src/lib/posts src/components/posts src/components/home` | 21 file / 182 test PASS |
| `pnpm build` | skip (builder báo PASS; primary cho bỏ). Chưa xác minh độc lập |

Log `Invariant: static generation store missing in revalidatePath(...)` trong test là log có sẵn từ hook revalidate chạy ngoài Next. Không làm test fail.

## Kiểm riêng theo yêu cầu

1. **Chỉ tin công khai vào quét và đếm: OK.** `scanPublicPosts` và `cardsByIds` đều đi qua `findPublicList` (published, chưa xoá mềm, `/en` chỉ tin `hasEnglish`). `computePostFacets(scanned, …)` đếm trên đúng tập đã quét. Integration test có "/en chỉ gồm bài có bản EN; bài nháp không bao giờ xuất hiện" cho `listPublicPostListing` (`docs`, `featured`, `totalDocs`).
2. **Parse tham số an toàn: OK.**
   - Mỗi giá trị dài tối đa 100 ký tự.
   - Số chỉ nhận `^\d{1,6}$`, kẹp về trần; `min > max` thì đổi chỗ; đầu ở mép bị bỏ.
   - Danh sách cố định qua `pickKnown`; `sort` lạ trả về mặc định; `bedrooms` ngoài 1..4 bị bỏ.
   - Slug tỉnh: tối đa 50, rồi đối chiếu `listProvinces` ở `loadPostListing`; slug lạ bị bỏ, không lọc thành rỗng.
   - Không có SQL động; từ khoá so sánh trong bộ nhớ sau `normalizeSearchText`.
3. **Đếm faceted: OK.**
   - `computePostFacets` dùng `postMatcher(predicates, except)` cho từng chiều: danh mục, loại hình, hướng, bàn giao, tỉnh.
   - Danh mục tính cả danh mục cha (cho tab cấp 1).
   - Chip đơn chọn Phòng ngủ và thanh trượt KHÔNG đếm, đúng quyết định user ở `phase-2-task-04.md`.
   - Danh sách tỉnh cùng cách `/du-an` (`project-list-facets.ts:145`).
   - Integration test kiểm `type.counts` / `provinces.count` khi đang lọc type + tỉnh.
4. **BR-06: OK.**
   - Thứ tự: `orderPosts` đưa tin ưu đãi đã kết thúc xuống cuối ở mọi kiểu sắp; trong mỗi nhóm giữ mới nhất trước nhờ sort ổn định; sắp theo giá thì tin không giá nằm cuối.
   - Nổi bật chỉ lấy `isFeatured && !isOfferEnded`, tối đa 5, chỉ ở trang 1, bị loại khỏi lưới ở mọi trang; `totalDocs` gồm cả tin nổi bật.
   - Thẻ voucher hết hạn: ảnh mờ, trạng thái "Đã kết thúc", vẫn là link. `PostCardData` **không có** trường mã voucher, nên thẻ không thể lộ mã.
5. **`PostCard` đổi mặc định:** xem Blast radius. Không thấy chỗ vỡ hay lệch design.
   - `home-queries.ts` dùng `POST_CARD_FIELDS`, nay populate thêm tỉnh / phường: payload nặng hơn một chút, vô hại.
   - `project-listings.ts` dùng `depth: 1`, nên `placeLabel` có dữ liệu.
6. **Ngày EN:** `formatDate` dùng `en-US` nên ra MM/DD/YYYY; task ghi `dd/MM/yyyy`. Đây là quy ước sẵn có toàn site (thẻ trang chủ trước đây cũng vậy), không phải regression → MINOR-2.
7. **Trần 1000:** `SCAN_MAX_PAGES = 20` × `MAX_PAGE_SIZE`, có `payload.logger.warn` khi còn trang sau ở trang 20. Quyết định và trần ghi trong JSDoc.

## Responsive Checklist Gate (diff có đụng UI: `PostCard` listing, `PostListBody`)
Không có browser. Kiểm bằng class/CSS; phạm vi chỉ phần đổi trong diff.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Thân thẻ `min-w-0`; tag, thông số, mũi tên dùng `flex-wrap`; dòng hạn dùng `truncate`; vị trí qua `CardPin`. Lưới giữ `grid-cols-1 sm:2 lg:3 xl:4` |
| Mobile-first (`min-width`) | OK | Chỉ dùng tiền tố `sm:` / `lg:` / `xl:` của Tailwind |
| Grid không cột cố định | OK | Lưới cũ không đổi (breakpoint cột, quy ước của repo); thẻ `h-full` co theo ô |
| Container không fixed px | OK | Không thêm width px |
| Font-size rem / token | OK | `text-small`, `text-xsmall`, `text-body` (token) |
| Heading fluid | N/A | Tiêu đề thẻ dùng `CARD_TITLE_CLASS` sẵn có |
| Media (`aspect-ratio`, `sizes`) | OK | `aspect-[11/10]` + `ResponsiveImage` có `sizes` mặc định hoặc ghi đè; không ảnh thì có icon placeholder |
| Touch target ≥ 44×44 | OK | Cả thẻ là MỘT link (vùng bấm lớn) |
| Nav / table | N/A | Không đổi |
| `100vh` | N/A | Không dùng |
| `prefers-reduced-motion` | N/A | Không thêm animation (zoom ảnh dùng `CARD_IMAGE_ZOOM` sẵn có) |
| Không che lỗi bằng `overflow:hidden` | OK | `overflow-hidden` chỉ ở khung ảnh (cắt ảnh zoom), có sẵn từ trước |

Residual: chưa đo pixel thật ở 375 / 768 / 1280.

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` không có |
| oxlint (anti-slop) | skip, oxlint not configured | Không có `.oxlintrc.json`. ESLint PASS 0 error thay thế |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` không có |
| AI-readable | OK | Mọi file trong diff ≤ 300 dòng (`post-queries.ts` 248, `PostCard.tsx` 211, `post-view.ts` 220, `post-list-facets.ts` 194, `post-filters.ts` 173, `post-listing.ts` 111). Hàm ≤ 50 dòng (`PropertyBody` ~46). Hằng có tên (`SCAN_MAX_PAGES`, `POST_FEATURED_LIMIT`, `BEDROOMS_OPEN_ENDED`, …); comment nói WHY. Chỉ có 1 indicator nhẹ: comment cũ, MINOR-1. Dưới ngưỡng 3 |
| ai-friendly-web | N/A | Không đổi route, robots hay sitemap (route nối ở P3-T03) |
| blitzstrike | skip | Không có môi trường hay công cụ được phép. Đã soát tay input parsing ở mục 2 |

## Findings

**CRITICAL:** không có.

**MAJOR:** không có.

**MINOR**
1. **[MINOR-1]** `src/lib/posts/post-queries.ts:214`: JSDoc `findRelatedPosts` còn nhắc "`listPublicPosts` không dùng được ở đây…", nhưng hàm này đã bị xoá. Fix: sửa câu, nhắc `listPublicPostListing` hoặc bỏ đoạn so sánh.
2. **[MINOR-2]** `src/lib/posts/post-view.ts` (`endLabel: formatDate(endAt, locale)`) + `src/lib/format.ts:5` (`en: "en-US"`): hạn ưu đãi ở `/en` ra MM/DD/YYYY, còn task/spec ghi `dd/MM/yyyy`. Đây là quy ước sẵn có toàn site, không phải regression của task. Fix nếu muốn khớp spec: truyền `en-GB` riêng cho hạn ưu đãi, hoặc ghi rõ trong spec rằng `/en` theo định dạng Mỹ. Cần user hoặc spec chốt; không chặn task.
3. **[MINOR-3]** `src/components/posts/PostCard.tsx:84-88` (`ListingOfferBadge`) + `:154` (`VoucherBody`): voucher đã hết hạn hiện "Đã kết thúc" **hai lần** (badge trên ảnh và viên trạng thái), nên trình đọc màn hình đọc lặp. Fix: với `kind === "voucher"` thì badge ảnh chỉ hiện `endingSoon` / "Ưu đãi", bỏ `ended` (viên trạng thái đã nói); hoặc đặt `aria-hidden` cho một trong hai.
4. **[MINOR-4]** `src/lib/posts/post-filters.ts:103` + `post-list-facets.ts:109-118`: URL gõ tay `priceMax=0` / `areaMax=0` vẫn được giữ, và vì chỉ giá trị > 0 mới khớp khoảng nên trang ra rỗng. Không crash, không lỗi bảo mật; thanh trượt UI có thể không tạo ra giá trị này. Fix tuỳ chọn: coi `max === 0` là bỏ, hoặc để P3-T03 ghi rõ hành vi.
5. **[MINOR-5]** Merge note: P3-T02 và P3-T04 cùng thêm namespace ở cuối `vi.json` / `en.json` (`postCard` và namespace của P3-T04), nên sẽ xung đột text khi merge. Primary gộp tay (đúng quy ước song song) rồi chạy lại `pnpm test` phần `src/components/posts` + `tin-bds/[slug]`.

## Residual risk
- p95 248ms do builder báo, reviewer không đo. Mỗi request `/tin-bds` quét tuần tự tới 20 truy vấn (≤ 1000 tin) cộng 1 truy vấn thẻ, không cache. Khi số tin tăng nên theo dõi log cảnh báo trần và độ trễ.
- `pnpm build` không chạy lại.
- Sau khi merge với P3-T04: test chi tiết tin BĐS render `RelatedPosts` bằng thẻ `listing`. Assert cũ về thẻ (vd ngày đăng) chưa kiểm được trên nhánh gộp.
- Responsive chưa đo bằng browser.

## Verdict
**PASS**: không có CRITICAL hay MAJOR. Có 5 MINOR, chuyển builder hoặc task sau tuỳ primary. MINOR-2 cần user hoặc spec chốt.
