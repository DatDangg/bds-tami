Agent: reviewer

# Review: build/tami-website, layer-7-task-03 (S07 chi tiết tin cho thuê), round 2

- Worktree: `D:\prj\bds-wt-t03` (HEAD f29176c, chưa commit)
- Task: `tasks/tami-website/layer-7-task-03.md` (mục "Sửa review round 1")
- Round 1: `.context/review-reports/build-tami-website-layer-7-task-03-round-1-review.md` (FAIL vì MAJOR-1)

## Review level
**STRICT**

## Reason
Trang công khai vẫn đọc `staff` và `rentals.author/location` bằng `overrideAccess`. Round 1 FAIL vì lộ dữ liệu (`media.uploadedBy`) vào props của Client Component. Task cũng sửa file dùng chung (json-ld, resolve-missing-page, news-queries, project-detail-view).

## Blast radius
Không đổi so với round 1. Gồm route `/[locale]/cho-thue/[slug]`, `src/components/rentals/*`, `src/lib/rentals/*` và các file dùng chung: `buildRealEstateListingJsonLd` (`publisher` tuỳ chọn), JSON-LD trang dự án, `MISSING_PAGE_RULES`, union `findLocalizedSlugs`, export `renderableImage`, `icons.ts`, i18n `page.rentalDetail`. Không có schema hay migration. Round 2 chỉ đụng `rental-queries.ts`, `rental-view.ts`, `RentalDetail.tsx` và test.

## Verify commands + result (cwd `D:\prj\bds-wt-t03`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm build` | PASS (exit 0): `● /[locale]/cho-thue/[slug]` |
| `pnpm test` | 1599/1599 test PASS. 149/150 file PASS. Fail duy nhất là `src/lib/contrast.test.ts`, lỗi CRLF đã biết của worktree, ngoài scope. |
| `git diff --ignore-cr-at-eol -- src/payload-types.ts` | Rỗng, tức file chỉ đổi EOL (MINOR-6 vẫn đúng: không stage file này). |

## Kiểm MAJOR-1 và các đường dữ liệu server → client/RSC
| Đường dữ liệu | Kết quả | Bằng chứng |
|---|---|---|
| Sale (tên, SĐT) | OK | `rental-queries.ts:111-117`: `staff` đọc ở `depth: 0`, `select` 4 trường. Bỏ ngay `active`. View chỉ có `name/phoneLabel/telHref/avatar` (`rental-view.ts:233-237`). |
| Avatar sale | OK, đã đóng | `findPublicAvatar` (`rental-queries.ts:128-136`) đọc với `overrideAccess: false`, `locale`, `depth: 0`, nên `uploadedBy` bị field access chặn. Đã có thêm lớp whitelist `toPublicImage` (`rental-view.ts:216-219`): chỉ giữ `url/alt/width/sizes`. Integration test (`tests/integration/rental-detail-queries.test.ts:158-174`) seed `uploaded_by_id = saleId`, rồi kiểm không có `uploadedBy`, `JSON.stringify` không chứa saleId, alt vi/en đúng. Unit test `rental-view.test.ts:148-152` cũng kiểm. |
| Gallery trang chi tiết (vào `Gallery` client) | OK | Lấy từ `findPublicBySlug` (`public-queries.ts:29-35`: `overrideAccess: false`), có locale. Doc media được populate như khách, nên `uploadedBy` không có. Các trường còn lại là metadata ảnh công khai. Gallery không qua whitelist, nhưng không còn trường nào chỉ staff được đọc. |
| Tin tương tự | OK | `findPublicList` + `select` thẻ (không có address/location). `withCoverImages` (`rental-queries.ts:61-80`) dùng 2 truy vấn cố định `overrideAccess: false` (rentals `id in`, media `id in`). Ảnh vào thẻ đi qua `toPublicImage`. |
| Bản đồ | OK | Chỉ `view.map` vào `LazyMap`. Khi ẩn địa chỉ thì dùng `approximateLocation` (`rental-view.ts:130-137`). Toạ độ thật đọc qua `findRentalPrivateFields` và không đi ra khỏi `toRentalDetailView`. |
| JSON-LD | OK | `address = view.addressLine` (có số nhà chỉ khi `showExactAddress`), ảnh là URL, `publisher` lấy từ identity. Tin rented không có JSON-LD. |
| `doc` vào `RentalDetail` | OK | Kiểu `Pick<Rental,"id"\|"description">`. `doc.description` đi vào `RichText` (server), `doc.id` đi vào `ClickRefMarker`. Cả hai đều công khai. |

## Kiểm whitelist có làm hỏng `ResponsiveImage` không
OK. Kiểu `MediaImage` (`ResponsiveImage.tsx:10-14`) chỉ có `url/alt/width/sizes{thumb,card,large}`. `listCandidates` dựng srcset từ `sizes.*.url/width`, nếu thiếu thì lấy `url/width`. Whitelist giữ đủ các trường đó. Component dùng `fill` trong khung có kích thước (`aspect-[4/3]` cho thẻ, khung 48px cho avatar), nên không cần `height` và không ảnh hưởng CLS.

## Số truy vấn / N+1
OK. Tin tương tự cần 3 truy vấn cố định (list, gallery ids, covers), không phụ thuộc số thẻ. Sale cần 2 truy vấn chạy tuần tự sau `Promise.all` (staff → media). Đây là waterfall nhỏ, không phải N+1.

## Responsive Checklist Gate (375 / 768 / 1280; không có browser nên xác minh bằng CSS math)
Round 2 không đổi class layout. Chỉ tách `RentedBanner` và `RentalLongSections` thành component riêng, markup và class vẫn giữ nguyên.
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | `max-w-container px-gutter`. Carousel < sm cuộn bên trong `ul` (`SimilarRentals.tsx:57`). Cột nội dung có `min-w-0`. |
| Mobile-first / grid | OK | 1 cột ở mobile, `lg:grid-cols-12` ở desktop. Thẻ: carousel 80% ở 375, 2 cột ở 768, 4 cột ở 1280. |
| Typography | OK | Chỉ dùng token (`text-h2/h3/h4/small`). |
| Media | OK | Thẻ dùng `aspect-[4/3]` + `sizes`. Avatar `sizes="48px"`. |
| Touch target | OK | Link thẻ `min-h-11`. |
| Viewport / motion | OK | Không có `100vh`, không có animation mới. |
| A11y | OK | Có một `h1`, section có `aria-labelledby`. h2 đứng trước h1 ở tin rented là theo design-spec (đã ghi quyết định ở MINOR-4). |

Residual: chưa đo render thật ở 768, và chưa đo contrast của giá mờ ở trang rented (giống round 1).

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, chưa cấu hình oxlint. ESLint PASS.
- ocr: skip, chưa cài `ocr`.
- AI-readable: OK, có 2 indicator (dưới ngưỡng FAIL là 3): `RentalDetail` khoảng 68 dòng (`RentalDetail.tsx:94-162`, vẫn > 50 nhưng đã giảm từ 108); ARCHITECTURE §5.1 chưa reconcile route rule mới (để primary làm lúc close-out). Comment trong code giải thích WHY, các hằng số đều có tên.
- ai-friendly-web: N/A, task không đổi robots/sitemap/llms.txt.
- blitzstrike: skip, chưa cài và không có môi trường được phép chạy.

## Findings

### [MINOR-1] Ảnh bìa thẻ tin tương tự chỉ lấy `gallery[0]`
`rental-queries.ts:71`. Nếu ảnh đầu bị xoá (FK null) hoặc không phải ảnh, thẻ hiện placeholder thay vì lùi sang ảnh kế tiếp như bản round 1. Comment có ghi rõ hành vi này, nên chấp nhận được. Nếu muốn sửa: lấy id đầu tiên còn hợp lệ trong `gallery`.

### [MINOR-2] Truy vấn ảnh bìa không truyền `locale`
`rental-queries.ts:74`. `alt` theo locale mặc định. Hiện không ảnh hưởng vì ảnh thẻ là `decorative` (`alt=""`). Chỉ cần lưu ý nếu sau này bỏ `decorative`.

### [MINOR-3] `RentalDetail` khoảng 68 dòng, vẫn > 50
`RentalDetail.tsx:94-162`. Đã cải thiện so với round 1. Có thể tách tiếp phần header/gallery nếu cần, không chặn PASS.

### Các MINOR round 1 ghi trong task file
Đã ghi vào task file. MINOR-1 (8 tin tương tự / gap giá ±30%) đang chờ spec-validator. MINOR-3 (gộp RentalCard với T02) là follow-up ở L8. MINOR-4 giữ theo design-spec. MINOR-6 không stage `payload-types.ts`. Không chặn PASS.

## Verdict
**PASS**: MAJOR-1 đã đóng thật, có hai lớp chặn (truy vấn với quyền khách và whitelist trường), kèm integration test có seed `uploaded_by_id` và unit test. Rà các đường dữ liệu sale, ảnh, tin tương tự, bản đồ, JSON-LD không thấy trường chỉ staff được đọc hay toạ độ/địa chỉ chính xác bị lộ. Lint, typecheck và build PASS; test 1599/1599 PASS (chỉ còn fail `contrast.test.ts` do CRLF, đã biết). Không có CRITICAL hay MAJOR mới.
