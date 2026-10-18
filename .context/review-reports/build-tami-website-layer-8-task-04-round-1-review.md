Agent: reviewer

# Review — build/tami-website · layer-8-task-04 · round 1

Trang Đăng tin BĐS: danh sách S08, trang danh mục S05, chi tiết S09. Worktree `D:\prj\bds-wt8-t04`, branch `wt/l8-t04` từ ece17d8, chưa commit.

## Review level: STRICT

**Reason:** đây là trang công khai đọc dữ liệu có quan hệ (dự án, tin cho thuê, danh mục) và có nguy cơ lộ dữ liệu (mã voucher của bài hết hạn, trường nội bộ của media). Task cũng sửa file dùng chung: `src/lib/content/offer-status.ts`, `src/lib/content/resolve-missing-page.ts` (proxy 404 cho mọi trang động) và `src/lib/news/news-queries.ts`. Task file ghi NORMAL, nhưng vì đụng file dùng chung nên nâng lên STRICT.

**Blast radius:**
- Route mới: `/[locale]/tin-bds`, `/tin-bds/[slug]`, `/tin-bds/danh-muc/[category]`.
- Thư mục mới: `src/lib/posts/*`, `src/components/posts/*`.
- File dùng chung, chỉ thêm, không đổi hành vi của chỗ đang gọi:
  - `offerEndedWhere` mới trong `offer-status.ts`.
  - 2 rule mới trong `MISSING_PAGE_RULES`. Proxy chạy cho mọi request; rule mới chỉ khớp prefix `/tin-bds/...` và `/en/property-news/...`.
  - Union `findLocalizedSlugs` thêm `"property-posts"`.
- i18n: thêm namespace `page.posts` (vi/en).
- `docs/ARCHITECTURE.md`: thêm as-built.
- Không đụng schema, không có migration.

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 159 file, 1732 test (exit 0). Log `revalidatePath ... static generation store missing` là cảnh báo đã có từ trước của các test integration hook, không phải lỗi. |
| `pnpm build` | PASS. Bảng route có `/[locale]/tin-bds/[slug]` (ISR, nằm trong `dynamicRoutes` của `prerender-manifest.json`). `/tin-bds` không có trong prerender-manifest (force-dynamic), giống hệt `/tin-tuc`. `/tin-bds/danh-muc/[category]` là ƒ. |
| `pnpm install --frozen-lockfile` | skip: lockfile không đổi |

## Kiểm theo yêu cầu đặc biệt

- **Không lộ trường nội bộ — OK**
  - Client Component chỉ nhận dữ liệu đã whitelist: `Gallery`, `ResponsiveImage`, `ShareButtons`, `CopyVoucherButton`.
  - Ảnh qua `toPublicImage` (`post-view.ts:28-31`), chỉ giữ `url/alt/width/sizes`, nên không lọt `uploadedBy`.
  - `PostDetail` và `OfferBox` là Server Component. `doc` chỉ dùng để lấy `content` cho `RichText`; doc thô không được serialize vào RSC payload.
  - JSON-LD `Article` chỉ có headline, url, description, ảnh, ngày và publisher; không có `author`, không có voucher.
  - Bài hết hạn có `voucherCode: null` ở view (`post-view.ts:152`), nên mã không vào HTML hay RSC. Test `page.test.tsx:88-97` assert `innerHTML` không chứa mã.
- **`isOfferEnded` là nguồn duy nhất — OK**
  - Badge và view dùng `isOfferEnded` (`post-view.ts:19,142`).
  - Truy vấn dùng `offerNotEndedWhere`/`offerEndedWhere`; test mới (`offer-status.test.ts:65-74`) chứng minh `offerEndedWhere` khớp `isOfferEnded` với mọi tổ hợp now/endAt.
  - `daysUntilDeadline` chỉ dùng để đếm số ngày còn lại, không quyết định "đã kết thúc".
- **Phân trang hai nhóm — OK**
  - Nối theo trang trong `post-queries.ts:88-107`: `totalPages = activePages + endedPages`.
  - Không trùng, không thiếu: hai nhóm là phần bù chính xác của nhau, sort giống nhau, offset theo trang độc lập.
  - `?page` vượt số trang → `outOfRange` → `notFound()` (`PostListPage.tsx:45`).
  - Bài nổi bật bị loại khỏi lưới ở mọi trang của `/tin-bds` và chỉ hiện ở trang 1.
  - Có test integration (`property-posts.test.ts:240-276`): trang 1 nhóm còn hạn, trang 2 nhóm đã kết thúc, trang 3 rỗng, mốc 00:00 VN, `excludeIds`, nổi bật không chọn bài đã kết thúc.
- **publicWhere + EN — OK**
  - Mọi truy vấn đi qua `findPublicList`/`findPublicBySlug`: bài, danh mục, bài liên quan, dự án và tin cho thuê liên quan.
  - Danh mục cha đã populate được lọc qua `visibleCategory`.
  - Có test: `/en` rỗng khi bài không có bản EN, bài nháp bị loại, `findPublicPostBySlug` ở en trả null.
- **ISR/cache + revalidate — OK**
  - Chi tiết là ISR (`generateStaticParams → []`, `revalidate=60` từ layout), có trong manifest.
  - Danh sách và danh mục là `force-dynamic`, giống `/tin-tuc`.
  - Hook `revalidate-category.ts:18` đã trỏ đúng `/tin-bds` và `/tin-bds/danh-muc/[category]`; trang danh mục mới khớp đường dẫn mà hook làm mới.
- **G27 — OK**
  - 2 rule mới: `property-posts` và `categories` scope `property_post`.
  - Có test khớp vi/en và test rằng trang danh sách không bị khớp.
- **Lệch design-spec:**
  - Voucher: chấp nhận cách làm hiện tại (AC và BR-06 an toàn hơn).
  - Nút chia sẻ, banner ảnh: chấp nhận nhưng cần ghi gap. Xem MINOR-2 và MINOR-3.

## Responsive Checklist Gate (diff có đụng UI)

Không có browser nên kiểm bằng class Tailwind và CSS math ở các mốc 375/640/768/1024/1280/1536.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Container dùng `max-w-*` + `w-full` + `px-gutter`. Chip dùng `scrollChips` (template dùng chung, cuộn trong vùng riêng). Thẻ có `min-w-0`. Ô mã voucher nằm trong `flex-wrap`. |
| Mobile-first | OK | Chỉ dùng prefix `sm:`/`lg:` (min-width). |
| Grid | OK | Lưới 1 cột ở 375, `sm:grid-cols-2` ở 640, `lg:grid-cols-3` ở 1024, khớp bảng S08. Bài nổi bật dọc ở < lg, `lg:grid-cols-12` 7/5 ở ≥ lg. |
| Container không cố định px | OK | `max-w-text`, `max-w-5xl`, `max-w-container`. Ảnh bìa tràn viền ở 375 (`sm:px-gutter`). |
| Typography | OK | Token `text-h1/h2/h3/h4/body/small` (theo design tokens, rem/clamp). Không có px mới. |
| Media | OK | `ResponsiveImage` có `aspectRatio` (16/9 bìa, 16/10 thẻ, 1/1 thẻ liên quan) và `sizes`. Bìa có `priority`. |
| Touch target ≥ 44px | OK | Link thẻ, link danh mục, hotline, nút Sao chép (`min-h-11 min-w-11`), `summary` điều khoản, thẻ liên quan: tất cả `min-h-11`. |
| Nav/table mobile | N/A | Nav là shell dùng chung. Bảng trong RichText dùng vùng cuộn của component dùng chung. |
| 100vh | OK | Không dùng. |
| prefers-reduced-motion | OK | Hiệu ứng zoom ảnh có `motion-reduce:*` (`PostCard.tsx:20`). |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở khung ảnh (để zoom). |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: không nằm trong verify commands được phép chạy |
| oxlint (anti-slop) | skip: oxlint chưa cấu hình (không có `.oxlintrc*`). ESLint PASS. |
| ocr (open-code-review) | skip: ocr chưa cài / không được phép chạy |
| AI-readable | OK: 0 indicator đáng kể. File ≤ 189 dòng, hàm ≤ 50 dòng, tên rõ, hằng có tên (`POST_PAGE_SIZE`, `OFFER_ENDING_SOON_DAYS`), comment giải thích WHY, đã cập nhật ARCHITECTURE as-built. |
| ai-friendly-web | N/A cho task này: llms/robots/sitemap thuộc task sitemap của layer 8 |
| blitzstrike | skip: không có môi trường/tool. Trang chỉ đọc, không có input ngoài slug và `?page` (đã qua `parsePagination`). |

## Findings

Không có CRITICAL hay MAJOR.

**[MINOR-1] Bài liên quan bỏ sót bài đã kết thúc khi nhóm còn hạn có ít bài** — `src/lib/posts/post-queries.ts:127-132`
- Vấn đề: `findRelatedPosts` lấy `listPublicPosts(page: 1)`. Hai nhóm được nối theo trang, nên khi danh mục có từ 1 bài còn hạn trở lên (sau khi loại bài hiện tại), trang 1 chỉ gồm bài còn hạn.
- Ví dụ: 1 bài còn hạn + 5 bài đã kết thúc → chỉ hiện 1 thẻ. Design-spec S09 bước 7 yêu cầu 3 thẻ, và docstring ghi "bài đã kết thúc vẫn có thể gợi ý nhưng xếp sau".
- Fix: khi `docs.length < 3`, lấy thêm từ nhóm `offerEndedWhere` (limit = phần còn thiếu); hoặc chạy 2 truy vấn limit 3 rồi nối. Thêm unit/integration test cho trường hợp này.

**[MINOR-2] Nút chia sẻ lệch S09** — `src/components/posts/PostDetail.tsx:91-93`
- Vấn đề: S09 bước 2 đặt nút chia sẻ ở đầu bài. Hiện tại nút nằm ở `footer` sau form lead. Builder cũng đã ghi chưa làm Web Share API ở 375 và nút dính ≥ xl.
- Không chặn PASS (UX phụ, builder đã ghi ở "Quyết định builder"), nhưng cần ghi vào gap register / đề xuất task follow-up để spec-validator cuối layer không coi là bỏ sót. Nếu không có lý do giữ vị trí footer, đề xuất chuyển vào `header`.

**[MINOR-3] Lệch design-spec về voucher hết hạn và banner ảnh chưa được ghi gap chính thức** — `.context/design-spec.md:449`, `:612`
- Voucher: S09 ghi "mã gạch ngang" khi hết hạn; bản build ẩn hẳn mã (`post-view.ts:152`). Reviewer đồng ý với cách làm hiện tại vì nó khớp AC "mã voucher ẩn khi đã kết thúc" và không lộ mã còn dùng được. Nhưng design-spec (intent doc) cần được reconcile qua người duyệt hoặc ghi gap, không để hai nguồn mâu thuẫn.
- Banner: chưa dùng `pageBanners.propertyPosts`. Design-spec §612 cho phép dùng banner chữ làm fallback, nên chỉ cần ghi gap.

## Residual risk

- Responsive mới xác minh bằng class/CSS math, chưa đo `scrollWidth` thật trên browser.
- Chưa kiểm thực tế cache `x-nextjs-cache` HIT/MISS và rewrite 404 của proxy bằng `next start` (reviewer không chạy app). Phần này dựa vào build manifest + unit test `resolve-missing-page`.
- `RichText` (dùng chung, từ L6) render node upload bằng media đã populate; ngoài scope diff, không audit lại.

## Verdict: ✅ PASS

Không có CRITICAL hay MAJOR. 3 MINOR là follow-up, không chặn: MINOR-1 nên sửa trong task này nếu builder còn round, hoặc ghi follow-up; MINOR-2 và MINOR-3 ghi gap cho spec-validator cuối layer 8.
