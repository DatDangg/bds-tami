# Agent: reviewer — feature-listing-followups · phase-1-task-01 · round-1

- **Review level:** STRICT
- **Reason:** đổi hành vi URL công khai (308 cho link cũ `?category=`) ở 2 màn vi+en → SEO / URL chia sẻ cũ / route công khai; thêm parse tham số `/du-an`. Task file yêu cầu STRICT.
- **Branch:** `staging`, chưa commit. Chỉ review các file thuộc task (file dirty khác trong working tree bỏ qua theo chỉ dẫn).

## Blast radius
- `src/components/posts/PostListPage.tsx` (`/tin-bds`, `/en/property-news` + route danh mục dùng chung component) — redirect đặt trong `loadPostListData`.
- `src/components/rentals/RentalListPage.tsx` (`/cho-thue`, `/en/for-rent` + S05) — hàm mới `redirectLegacyCategoryOnly` gọi đầu `loadRentalListData`.
- Helper mới dùng chung `src/lib/content/legacy-category.ts` (`legacyCategoryOnly`).
- `src/lib/projects/project-filters.ts` `parsePriceRange` — dùng bởi `/du-an` (`parseProjectFilters`); không đụng `GET /api/public/rentals`.
- Chú thích `post-list-metadata.ts` / `rental-list-metadata.ts` (không đổi logic metadata).
- `docs/API_SPEC.md` §3.9 / §3.10 / §3.11 (as-built). Không đụng `SPECIFICATIONS.md` / `spec/**` / intent docs (đã xác nhận qua `git status`).

## Verify commands + result (`.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `npx eslint <10 file scope>` | PASS (0 lỗi, exit 0) — coi `pnpm lint` PASS theo scope (`.local-seed/*` git-ignored đỏ sẵn, ngoài scope) |
| `pnpm test -- legacy-category.test.ts PostListPage.test.tsx RentalListPage.test.tsx project-filters.test.ts` | PASS — 4 file / 80 test |
| `pnpm build` | skip (tuỳ chọn; builder báo PASS, typecheck + lint + test đủ cho diff không đổi route/config) |
| `curl -sI http://127.0.0.1:3000/...` (dev server đang chạy, DB local) | `/tin-bds?category=tin-bds` → **308** `location: /tin-bds/danh-muc/tin-bds` · `/tin-bds?category=tin-bds&q=` → **308** · `/tin-bds?category=tin-bds&page=2` → 200 · `/cho-thue?category=can-ho-dich-vu` → **308** `location: /cho-thue/danh-muc/can-ho-dich-vu` · `/cho-thue?category=khong-co-slug` → 200 · `/tin-bds/danh-muc/tin-bds?category=tin-bds` → 200 · `/du-an?priceMax=0` → 200 |

## Acceptance check (theo task § Quyết định)
1. **308 chỉ khi URL "chỉ có `category`"** — `legacy-category.ts:17-23`: lấy giá trị đầu, trim, ≤ 100 ký tự; khoá khác (kể cả khoá lạ `utm_*`) mang giá trị không rỗng → `null`; khoá rỗng/khoảng trắng/`undefined`/`[""]` không tính. Unit test 4 case phủ đủ (page/q/sort/province/utm; `q=""`; 101 ký tự). OK.
2. **Slug phải tồn tại ở locale đang xem** — posts: `PostListPage.tsx:133-136` chỉ redirect khi `context` (từ `loadPostCategoryContext(payload, locale, slug)`) khác null; rentals: `RentalListPage.tsx:85-92` dùng `findRentalCategory(payload, locale, slug)` (`rental-list-queries.ts:61`, scope `RENTAL_CATEGORY_SCOPE`, `findPublicBySlug` theo locale). Slug lạ / chưa có bản EN → không redirect, không 404 (test `khong-co`, `nha-pho` ở `/en`; curl 200). OK.
3. **Đích đúng theo locale** — posts: `postCategoryHref(context.category, locale)` = `publicPath("/tin-bds/danh-muc/[category]", …)`; rentals: `categoryPath(locale, category.slug ?? slug)` = `publicPath(CATEGORY_ROUTE, …)`. Test khẳng định `/tin-bds/danh-muc/voucher`, `/en/property-news/category/voucher`, `/cho-thue/danh-muc/can-ho`, `/en/for-rent/category/can-ho`. OK.
4. **Route danh mục có `?category=` không redirect** — posts: điều kiện `!categorySlug`; rentals: `categorySlug ? null : …`. Test + curl 200. OK.
5. **Redirect trước khi tải listing** — posts: `permanentRedirect` ở :136 trước `Promise.all` (:137) — test `loadPostListing` not called; rentals: `await redirectLegacyCategoryOnly` dòng đầu `loadRentalListData` (:96), trước `parseRentalFilters`/`loadFilterContext` — test `search` not called. Chi phí thêm: 1 lượt `findRentalCategory` (có `cache()`), chỉ khi URL chỉ có `category`. OK.
6. **Không open redirect** — đích luôn là `publicPath` (pathname cố định trong `pathnames[key][locale]`, slug đi qua `encodeURIComponent`, `content-paths.ts:76-80`); hơn nữa slug dùng để redirect là slug trong DB (`context.category.slug` / `category.slug`) chứ không phải chuỗi user gửi. `//evil`, `http://` không thể lọt vì luôn có prefix path cố định. OK.
7. **C-4 `/du-an` `priceMax=0`** — `project-filters.ts:102` `parseBillion(rawMax) || undefined`; `min>max` đổi chỗ chỉ khi cả hai có giá trị (dòng 103 giữ nguyên). Test mới 3 case + test cũ `{priceMin:"60",priceMax:"10"}`→`{priceMin:10}` giữ PASS; bỏ đúng assertion cũ `{ priceMax: 0 }`. OK.
8. **Doc** — `docs/API_SPEC.md` §3.9/§3.10/§3.11 khớp code (chỉ có `category` → 308; kèm tham số → lọc + canonical; slug lạ → bỏ). Không sửa `SPECIFICATIONS.md`/`spec/**`. `docs/DESIGN.md` / `design-spec.md` giữ (mô tả màn hình vẫn đúng cho URL kèm tham số) — chấp nhận `no doc impact` ngoài API_SPEC; spec-publisher ghi spec delta.
9. **Chất lượng** — không `as any`; `legacyCategoryOnly(searchParams: object)` + kiểm kiểu runtime hợp lý vì `RawPostListParams`/`RawRentalParams` là interface không index signature; mock `permanentRedirect` ném `NEXT_REDIRECT` giống Next, assert `rejects.toThrow` + `toHaveBeenCalledWith` đích + không tải listing → test có ý nghĩa; diff tối thiểu, không drive-by refactor; test cũ đổi thành "kèm tham số" giữ nguyên assertion lọc/tab/hidden input.

## Responsive Checklist Gate
**N/A** — diff không đụng markup/CSS/route UI (chỉ redirect server-side, parse tham số, chú thích, test, doc).

## Skill gates
| Gate | Kết quả |
|---|---|
| `aislop scan --changes --json` | skip, aislop not installed |
| `oxlint` (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`) — thay bằng `npx eslint` scope: 0 lỗi |
| `ocr` (open-code-review) | skip, ocr not installed |
| AI-readable | OK — tên rõ (`legacyCategoryOnly`, `redirectLegacyCategoryOnly`, `firstText`), hàm ≤ 10 dòng, magic number `100` đặt hằng `MAX_SLUG_LENGTH`, comment giải thích WHY (BL-055 C-1/C-4), chỉ 1 tầng helper; không đổi luồng chính cần README/ARCHITECTURE. 0 indicator. |
| ai-friendly-web | N/A — không đổi `llms.txt`/`robots.txt`/`sitemap.xml`; 308 là tín hiệu SEO đúng chuẩn, không chặn crawler |
| blitzstrike | skip, không cài / không môi trường pentest; đã kiểm thủ công open-redirect qua code (mục 6) |

## Findings
Không có CRITICAL / MAJOR.

- **[MINOR]** `src/components/posts/PostListPage.tsx:133-136` vs `src/lib/content/legacy-category.ts:19-20` — hai hàm chuẩn hoá slug hơi khác nhau: `legacyCategorySlug` (`post-list-metadata.ts:29-30`) `slice(0,100)` không trim; `legacyCategoryOnly` trim và >100 → `null`. Với slug có khoảng trắng bao quanh hoặc >100 ký tự, kết quả chỉ là "không redirect, lọc như cũ" (fail-safe, không sai hành vi), nên không chặn. Đề xuất (task riêng / khi tiện): cho `legacyCategorySlug` dùng `firstText` của helper mới để một nguồn sự thật.
- **[MINOR]** `src/components/rentals/RentalListPage.tsx:88-89` — `getPayload` + `findRentalCategory` gọi riêng trước `loadFilterContext`; `getPayload` là singleton và `findRentalCategory` có `cache()` nên không truy vấn lặp trong request, nhưng chỉ dedupe nếu `loadFilterContext` gọi với cùng `(payload, locale, slug)`. Đã ghi ở Residual của builder; chấp nhận.

## Residual risk
- Chưa kiểm 308 thật ở `/en` trên dev server (DB local không có danh mục bản EN); nhánh EN chỉ được unit test (`/en/property-news/category/voucher`, `/en/for-rent/category/can-ho`) — đường dẫn lấy từ `routing.ts` thật qua `publicPath`, rủi ro thấp.
- `pnpm build` không chạy lại trong review (builder báo PASS).

## Verdict
✅ **PASS** — tất cả acceptance có evidence (test + curl trên dev server), không CRITICAL/MAJOR. Sẵn sàng close-out: spec-publisher ghi spec delta (as-built `SPECIFICATIONS.md:45,48,59`) + commit (chỉ add file thuộc task, working tree có file dirty ngoài scope).
