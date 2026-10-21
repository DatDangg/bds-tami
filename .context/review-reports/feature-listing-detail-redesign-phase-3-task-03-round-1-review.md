Agent: reviewer

# Review: feature-listing-detail-redesign, phase-3-task-03, round 1 (BL-052 `/tin-bds` + `/tin-bds/danh-muc/[category]`)

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a6782d3899146efad` (branch `worktree-agent-a6782d3899146efad`, base staging 07d3496). Code chưa commit.
- **Review level:** STRICT
- **Reason:** trang công khai có SEO (canonical/noindex/FAQ JSON-LD), bộ lọc nhiều tham số trên URL, dùng chung component (`PostCard`, `SpotlightSlider`, `FilterSidebar`/`FilterSheet`, `useListingFilterNav`), có thay đổi contract (`PostChip`, props của route).
- **Blast radius:** 2 route `tin-bds` (vi + `/en/property-news`); `PostListPage`/`PostListBody` (giờ là client)/`post-list-state`/`PostSortControl`/`PostSpotlightContent`; `PostCard` (bỏ `variant="feature"`: dùng ở tin liên quan, trang dự án, slider trang chủ `home`); `post-listing.ts` `PostChip` (+`countId`, `slug`); i18n `page.posts.list` vi/en. `CategoryListTemplate` không đổi, vẫn dùng ở News + ProjectDetail. `OffersSlider` trang chủ không đổi (`variant="home"` giữ nguyên).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc không lỗi) |
| `pnpm lint` | PASS: 0 lỗi, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm test` | PASS: 387 file, 3885 test (log có `revalidatePath`/`Failed query` noise từ integration test, exit 0) |
| `pnpm build` | skip, theo chỉ đạo (builder báo PASS) |

## Kiểm theo yêu cầu
- **Tham số qua `parsePostFilters`:** OK. Loader nhận `filters: parsePostFilters(searchParams)`; URL tab/phân trang/sort/form dựng từ `postQueryString(listing.filters)` (đã đối chiếu). Ngoại lệ duy nhất là `?category=` cũ: đọc thô nhưng `slice(0,100)` rồi đối chiếu qua `loadPostCategoryContext` (truy vấn Payload có tham số), slug lạ cho ra `null`. Chấp nhận được.
- **Canonical/noindex:** OK, có test (`PostListPage.test.tsx:294-314`): sạch → index + canonical chính nó (`?page=2`); lọc/q/sort≠newest/`?category=` → `noindex, follow`, canonical trang sạch không `?page`; `sort=newest` vẫn index; trang danh mục có lọc → canonical về danh mục sạch.
- **Trang danh mục:** OK. h1 = tên danh mục, mô tả danh mục, eyebrow "Đăng tin BĐS"; slug không tồn tại → `notFound()` như cũ (test :286).
- **BR-06:** OK. Nổi bật lọc `!isOfferEnded` (`post-queries.ts:185`); thẻ dùng `PostCardData` (không có mã voucher); ưu đãi hết hạn xếp cuối do P3-T02, ở đây không đổi.
- **Form GET không JS:** OK. `FilterSidebar`/`FilterSheet` có `action` + input `name`; hidden `q`/`sort`/`category` (test :206, :215); hero search bỏ `q` trùng (`ListingHero.tsx:60`).
- **Stale/reset:** Ô lọc dùng chung `useListingFilterNav` (ref latest + pendingPatch + `generation` key). `PostSortControl` KHÔNG đi qua `navigate` (xem MINOR-1), giống `RentalSortControl`.
- **a11y:** 1 h1 (hero); tiêu đề thẻ lưới và thẻ nổi bật là h2; tab có `aria-current`; label sort `sr-only` dưới sm; nút nổi bật có `sr-only` tên tin.
- **EN:** OK, test :253 (`/en/property-news`, nhãn tiếng Anh). Ghi chú: JSDoc `PostListPage.tsx` ghi `/en/property-posts`, thực tế là `/en/property-news` (MINOR-4).
- **`variant="feature"`:** đã gỡ hẳn khỏi PostCard; typecheck PASS nên không còn chỗ gọi (các `variant="feature"` còn lại là của `NewsCard`).

## Responsive Checklist Gate (không có browser, xác minh bằng CSS math)
| Mục | KQ | Bằng chứng |
|---|---|---|
| Không scroll ngang | OK | Khung `grid w-full max-w-container px-gutter`; cột phải `min-w-0`; `lg:grid-cols-[16rem_minmax(0,1fr)]` (xl 17.5rem). Ở 375 chỉ 1 cột. Sort `w-full min-w-[11rem]` < 375 − gutter |
| Mobile-first | OK | Chỉ `sm:/md:/lg:/xl:` (min-width) |
| Grid | OK | Lưới 1 → `md` 2 → `lg` 3 cột (375:1, 768:2, 1280:3), trùng `/cho-thue`/`/du-an`. Dải thông số nổi bật 2 → `sm` 3 cột, ô `min-w-0` |
| Typography | OK | Token `text-h3`/`text-small`/`text-xsmall` (rem), không px |
| Media | OK | `ResponsiveImage` + `sizes` riêng cho lưới (`GRID_CARD_SIZES`); slider dùng `SpotlightSlider` có sẵn |
| Touch target | OK | `buttonVariants` / `OptionSelect` / `FilterFacets` dùng chung (≥44px đã duyệt ở P1/P2) |
| Nav/table | N/A / OK | Tab danh mục dùng `ListingCategoryTabs` (cuộn ngang trong khung); < lg lọc nằm trong `FilterSheet` |
| 100vh / reduced-motion / overflow-hidden | OK | Diff không dùng `100vh`, không thêm animation mới, không có `overflow-hidden` che lỗi |

## Skill gates
- aislop: skip, `aislop` chưa cài.
- oxlint (anti-slop): skip, oxlint chưa cấu hình (không có `.oxlintrc.json`). Thay bằng `pnpm lint` + `tsc`: không lỗi mới.
- ocr: skip, `ocr` chưa cài.
- AI-readable: OK. Có 1 dấu hiệu: hàm `PostListPage` khoảng 140 dòng (phần lớn JSX, giống `RentalListPage`). Tên rõ, comment giải thích lý do, không có magic number (`AREA_STEP_M2`, `PROVINCES_VISIBLE`, `GRID_CARD_SIZES` đều đặt tên). 1 < 3 nên không FAIL.
- ai-friendly-web: N/A (task không đụng `llms.txt`/`robots`/`sitemap`; phần noindex/canonical đã kiểm ở trên).
- blitzstrike: skip, không cài/không có môi trường. Đánh giá tay: không XSS (React escape, JSON-LD qua component có sẵn); không SQLi (Payload where); tham số bị chặn độ dài/danh sách cho phép.

## Findings
- **[MINOR-1] Sort không gộp thay đổi lọc đang chờ.** `src/components/posts/PostSortControl.tsx:37` push `listingHref(actionPath, current, {sort})` từ prop `current` của server. Nếu đổi một ô lọc rồi đổi sort trước khi URL kịp đổi, ô lọc vừa chọn bị mất. Ngược lại, `navigate` của ô lọc ngay sau sort cũng bỏ sort. Đây đúng là lỗi đã ghi ở P1-T02/P2-T02 (`RentalSortControl.tsx:37` cũng vậy). Cách sửa: cho `PostListBody` nhận `navigate` rồi truyền vào sort control (render sort bên trong body và gọi `navigate({ sort: sort === DEFAULT ? null : sort })`), hoặc gom vào task dọn MINOR chung P3-T06.
- **[MINOR-2] FAQ JSON-LD vẫn phát trên trang noindex.** `src/components/posts/PostListPage.tsx:590`: `?category=<slug lạ>` cho context `null` và `hasPostFilterParams` không tính `category`, nên `FAQPage` vẫn phát, trong khi metadata (`:612`) đã đặt noindex. Cách sửa: dùng chung điều kiện `filtered` của metadata (`legacyCategorySlug(...) === ""`).
- **[MINOR-3] Canonical của link cũ `?category=<slug hợp lệ>`.** Đang trỏ về `/tin-bds`, nhưng nội dung tương đương `/tin-bds/danh-muc/<slug>`. Nên canonical về trang danh mục, hoặc redirect 308 sang route danh mục. Spec không chặn nên để MINOR.
- **[MINOR-4] JSDoc sai đường dẫn EN.** JSDoc `PostListPage.tsx` ghi `/en/property-posts`, route thật là `/en/property-news` (test :255). Sửa comment.
- **[MINOR-5] Tên hướng lấy từ namespace của trang khác.** Nhãn hướng lấy từ `page.rentalDetail.direction` (`PostListPage.tsx:472`), nối Tin BĐS với namespace chi tiết cho thuê. Nên chuyển sang namespace dùng chung (vd `listingOptions.direction`) nếu đã có.
- **[MINOR-6] `PostListPage` quá giới hạn 50 dòng/hàm.** Hàm dài khoảng 140 dòng. Có thể tách `buildPostListResults` (empty/grid/pagination) và `buildSpotlight` ra helper.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa xác minh responsive thật trên browser ở 375/768/1280 (chỉ dựa trên CSS math + component dùng chung đã duyệt).
- Build không chạy lại (dựa trên báo cáo PASS của builder). `PostListBody` giờ là client component và import `post-filters.ts`; file này chỉ import `shared/listing-options` + type, nên an toàn cho client bundle.

## Verdict
PASS: không có CRITICAL/MAJOR. 6 MINOR, đề xuất gom vào P3-T06.
