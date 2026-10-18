Agent: reviewer

# Review: build/tami-website, layer-7-task-03 (S07 chi tiết tin cho thuê), round 1

- Worktree: `D:\prj\bds-wt-t03` (branch `wt/l7-t03` tách từ f29176c, chưa commit)
- Task: `tasks/tami-website/layer-7-task-03.md`

## Review level
**STRICT**

## Reason
Trang công khai đọc `staff` và `rentals.location`/`author` bằng `overrideAccess` (vượt field/collection access). Task phải ẩn địa chỉ chính xác, có SEO/JSON-LD/noindex, và sửa file dùng chung (`src/lib/seo/json-ld.ts`, `src/lib/content/resolve-missing-page.ts`, `src/lib/news/news-queries.ts`, `src/lib/projects/project-detail-view.ts`, trang chi tiết dự án `du-an/[slug]/page.tsx`).

## Blast radius
- Route mới `/[locale]/cho-thue/[slug]` (ISR) cùng `src/components/rentals/*` và `src/lib/rentals/*`.
- Dùng chung: `buildRealEstateListingJsonLd` (thêm `publisher`, tuỳ chọn, tương thích ngược), JSON-LD trang dự án S03 (thêm Organization), `MISSING_PAGE_RULES` trong proxy 404 (thêm `/cho-thue/[slug]`), union `findLocalizedSlugs`, export `renderableImage`, `icons.ts` (+`Info`), i18n `page.rentalDetail` (vi/en, mỗi file +98 dòng).
- Dữ liệu: chỉ đọc, không có schema hay migration.

## Verify commands + result (cwd `D:\prj\bds-wt-t03`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS: `● /[locale]/cho-thue/[slug]`, `● /[locale]/du-an/[slug]` |
| `pnpm test` (toàn bộ) | Không kết luận được: 29 file fail do môi trường, `cannot connect to Postgres: the database system is in recovery mode` (Postgres dùng chung bị crash hoặc đang recovery khi chạy). Có thêm `src/lib/contrast.test.ts` fail vì CRLF của worktree (đã biết, ngoài scope). |
| `pnpm test tests/integration/rental-detail-queries.test.ts tests/integration/rentals.test.ts src/lib/rentals src/lib/seo src/lib/content src/app/(frontend)/[locale]/cho-thue src/app/(frontend)/[locale]/du-an` (chạy lại khi DB đã lên) | PASS: 21 file, 250 test |

## Responsive Checklist Gate (375 / 768 / 1280; không có browser nên xác minh bằng CSS math)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Mọi khối đều `mx-auto w-full max-w-container px-gutter`. Carousel tin tương tự < sm dùng `overflow-x-auto` trên `ul` (cuộn trong phần tử, `-mx-gutter` chỉ bù đúng padding của cha). Từ `sm:` bỏ overflow. `min-w-0` trên cột nội dung. |
| Mobile-first / grid | OK | 1 cột ở 375 → `lg:grid-cols-12` (8+4) ở 1280. Thông số: 2 cột ở 375, `md:grid-cols-4` ở 768. Tin tương tự: carousel 80% ở 375, 2 cột ở 768, 4 cột ở 1280. Grid cột cố định theo breakpoint là convention sẵn có của repo (Tailwind), không phải `px` cố định. |
| Thứ tự DOM < lg | OK | header + thông số → aside (giá/sale/form) → chi tiết, đúng mốc 375 của design-spec. |
| Typography | OK | Chỉ dùng token (`text-h2/h3/h4/body/small/price`), `max-w-[68ch]`, không có font-size `px` mới. |
| Media | OK | Thẻ `aspect-[4/3]` có `sizes`. Avatar `sizes="48px"`. Gallery và LazyMap dùng lại component sẵn có. |
| Touch target ≥ 44px | OK | Link thẻ và link chi tiết dùng `min-h-11`. Nút gọi dùng `Button size="lg"`. Thanh dính đáy dùng lại `ProjectStickyCta` (`pb-16 lg:pb-0` chừa chỗ). |
| Viewport / motion | OK | Không có `100vh`, không có animation mới (chỉ hover underline và scroll-snap). `overflow-hidden` chỉ dùng để cắt ảnh. |
| A11y | OK, có ghi chú | Có một `h1`, section có `aria-labelledby`, băng `role="status"`, icon `aria-hidden`. Ghi chú: ở tin rented, `h2` "Căn tương tự đang trống" đứng trước `h1` (làm theo design-spec, xem MINOR-4). |

Residual: chưa đo được contrast của giá "mờ" `text-text-muted` trên `bg-primary-subtle` ở trang rented, và chưa xem render thực tế ở 768. Builder báo đã kiểm 375 không cuộn ngang.

## Skill gates
- aislop: skip, `aislop` chưa cài.
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc.json`/`oxlint.json`). ESLint PASS.
- ocr (open-code-review): skip, `ocr` chưa cài.
- AI-readable: OK, có 2 indicator (ngưỡng FAIL là 3):
  1. `RentalDetail` khoảng 108 dòng, vượt 50.
  2. Chưa cập nhật ARCHITECTURE §5.1 về route rule mới. Builder đã ghi rõ là để primary reconcile.

  Comment trong code giải thích WHY, không có magic number trần (`JSON_LD_IMAGE_COUNT`, `META_DESCRIPTION_LENGTH`, `SIMILAR_RENTALS_COUNT*`).
- ai-friendly-web: N/A. Task không đổi `robots`/`sitemap`/`llms.txt`. Trang rented `noindex, follow` là đúng BR-01.
- blitzstrike: skip, không cài và không có môi trường được phép chạy.

## Kiểm tra theo trọng tâm
- **Địa chỉ/toạ độ:** OK. Khách không nhận `address`/`location` khi `showExactAddress=false` (field access `readExactAddress`; integration test xác nhận cả hai là `undefined`). Toạ độ thật chỉ đi qua `toMap` → `approximateLocation`. `view.map` là thứ duy nhất vào `LazyMap`. Page test cố tình bơm `address`/`location` và vẫn không thấy trong HTML, props hay JSON-LD. `addressLine` của JSON-LD cùng mức chi tiết với trang. `findSimilarRentals` dùng `select` không có `address`/`location`. `RentalDetail` là Server Component, chỉ dùng `doc.id`/`doc.description`, không đẩy `doc` vào client.
- **Sale:** về chức năng thì OK. `select` 4 trường. Sale `active=false`, đã xoá (`NotFound`) hoặc thiếu SĐT → hotline chung, không hiện tên. Nhưng có lỗi lộ dữ liệu qua avatar, xem MAJOR-1.
- **publicWhere:** OK. `findPublicBySlug` lọc `in [published, rented]`, chưa xoá mềm, EN cần `hasEnglish` (integration test: hidden/draft/EN chưa dịch → null). Tin tương tự chỉ lấy `published`. Link dự án ở /en bỏ dự án chưa có EN.
- **Cache/ISR:** OK. Có `generateStaticParams() → []`, `revalidate = 60` ở layout, và collection `rentals` dùng `withContentDefaults({ revalidate })` (hook revalidate sẵn có). Residual: khoá sale (sửa `staff`) không revalidate trang tin, nên tên/SĐT sale đã khoá có thể còn hiện tối đa khoảng 60s cộng một lượt stale. Chấp nhận được với ISR 60s, nhưng nên ghi vào spec/gap.
- **G26:** OK. `publisher` là tuỳ chọn; không truyền thì không có key (unit test). Trang dự án thêm Organization và test S03 đã cập nhật. Điều kiện `pageUrl && siteUrl` không đổi hành vi, vì `absoluteUrl` không có `siteUrl` thì vốn trả rỗng.
- **G27:** OK. `/cho-thue/[slug]` → `rentals`. Danh sách, `/danh-muc/...` và `/en/for-rent/area/...` không bị khớp (test).
- **Rented:** OK. 200, `forceNoindex` (`noindex, follow`), 0 JSON-LD (kể cả breadcrumb `jsonLd={!view.rented}`), badge + băng, form "Nhận tư vấn căn tương tự".
- **Lệch AC (8 so với 4):** chấp nhận, không chặn. Design-spec S07 (nằm trong Requirements của task) ghi "4-8" cho rented; nhánh published vẫn 4. Builder đã tự khai. Cần primary hoặc spec-validator chốt và ghi vào task/gap (MINOR-1).
- **T02 / merge:**
  - Không trùng file với df521df ở `vi.json`/`en.json`/`json-ld.ts`. T02 có sửa `docs/ARCHITECTURE.md` (T03 chưa sửa, nên chỉ cần reconcile tay sau merge).
  - Truy vấn tin tương tự không cần SearchService (where/sort đơn giản qua `findPublicList`, không có từ khoá). Giữ như hiện tại là hợp lý.
  - Trùng khái niệm: T02 có `RentalCard` (DTO API `src/shared/types/api.ts`), T03 có `RentalCardData` cùng component `RentalCard` cục bộ trong `SimilarRentals.tsx` (MINOR-3).
  - Rủi ro conflict thật nằm ở `vi.json`/`en.json` với T04 (nếu T04 thêm key cạnh `page.*`) và ở `.context/runs/*`. Merge xong cần chạy lại `pnpm typecheck && pnpm test`.

## Findings

### [MAJOR-1] Avatar sale được populate bằng `overrideAccess`, nên lộ trường `media.uploadedBy` (chỉ staff được đọc) vào props Client Component / RSC payload công khai
- `src/lib/rentals/rental-queries.ts:85-91`: `findByID({ collection: "staff", depth: 1, overrideAccess: true, select: { …, avatar: true } })`. `select` không thu hẹp doc được populate, và Media không có `defaultPopulate`, nên `avatar` là nguyên doc Media đọc **bỏ qua field access**, kể cả `uploadedBy` (`src/collections/Media.ts:73-77`, `access: { read: isStaff }`, comment ghi "Khách đọc media nhưng không thấy ai upload").
- `src/lib/rentals/rental-view.ts:231` (`renderableImage(contact.avatar)` trả nguyên object) → `src/components/rentals/SaleContactBox.tsx:45` `<ResponsiveImage media={sale.avatar}>`. `ResponsiveImage` là `"use client"`, nên cả object bị serialize vào HTML/RSC: lộ UUID staff đã upload avatar và mọi trường nội bộ khác của Media sau này. Đây đúng là điểm "không lộ trường nội bộ trong props client" mà review phải kiểm. Test không bắt được vì fixture seed `avatar: null` (`tests/integration/rental-detail-queries.test.ts:151`).
- Ghi thêm: `findByID` không truyền `locale`, nên `alt` của avatar luôn là bản vi kể cả ở /en.
- Cách sửa (chọn 1):
  - (a) Đọc staff với `depth: 0`, rồi đọc avatar bằng truy vấn khách: `payload.findByID({ collection: "media", id, overrideAccess: false, locale, depth: 0 })`.
  - (b) Dùng `populate: { media: { url: true, sizes: true, width: true, height: true, mimeType: true, alt: true, filename: true } }`.
  - (c) Trong `toSaleContactView`, map avatar sang `MediaImage` tối thiểu (whitelist trường).

  Thêm test: seed avatar có `uploadedBy`, kiểm props/HTML không chứa `uploadedBy` hay id staff.

### [MINOR-1] Lệch AC "tối đa 4" ở nhánh rented (8), và chưa lọc giá ±30% của design-spec
`src/lib/rentals/rental-queries.ts:9-10,51`. Chấp nhận vì design-spec S07 cho phép 4-8. Nhưng AC đang tick `[x]` dù không khớp từng chữ, nên cần ghi quyết định vào task (sửa câu AC hoặc thêm dòng "Deviation accepted"), và ghi ±30% vào gap register để spec-validator cuối layer xử lý.

### [MINOR-2] Card tin tương tự populate cả thư viện ảnh nhưng chỉ dùng ảnh đầu
`src/lib/rentals/rental-queries.ts:27,52` (`gallery: true`, `depth: 1`): có thể tới 8 tin × n ảnh mỗi request ISR. Có thể chấp nhận vì ISR, nhưng nên cân nhắc lấy ảnh cover theo cơ chế của T02 (`thumbnail`) khi hợp nhất.

### [MINOR-3] Trùng khái niệm card với T02
`RentalCardData` + `RentalCard` cục bộ (`src/lib/rentals/rental-view.ts:178`, `src/components/rentals/SimilarRentals.tsx:10`) song song với `RentalCard` DTO ở `src/shared/types/api.ts` (df521df). Trang danh sách L8 nên dùng một component card chung. Ghi follow-up để gộp, tránh hai định dạng card lệch nhau.

### [MINOR-4] Tin rented có `h2` (tin tương tự) đứng trước `h1`
`src/components/rentals/RentalDetail.tsx:77` (theo design-spec). Có thể giữ, nhưng nên ghi nhận a11y heading order. Có thể dùng `aria-label` cho section và đưa `h1` lên sớm hơn nếu design cho phép.

### [MINOR-5] `RentalDetail` khoảng 108 dòng, vượt ngưỡng 50 dòng mỗi hàm
`src/components/rentals/RentalDetail.tsx:38-145`. Nên tách `RentedBanner`, `RentalGalleryBlock` và cột nội dung phụ.

### [MINOR-6] `src/payload-types.ts` chỉ đổi EOL
`git diff --ignore-cr-at-eol` rỗng. Không đưa vào commit (tránh nhiễu). Doc impact: primary cần reconcile ARCHITECTURE §5.1/§4 (route rule mới) như builder đã ghi.

## Verdict
**FAIL**: còn 1 MAJOR (MAJOR-1: lộ trường `media.uploadedBy` do populate avatar bằng `overrideAccess` vào props của client component trên trang công khai). Sửa MAJOR-1 kèm test rồi review round 2. Các MINOR không chặn PASS, nhưng MINOR-1 cần ghi quyết định trước close-out.
