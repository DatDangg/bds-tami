Agent: reviewer

# Review: feature-public-ui-market-vinhomes · Phase 2 close-out (validator D1–D4) · round 1
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** NORMAL
- **Reason:** thay đổi nhỏ: 1 hook thu hẹp revalidate, 2 factory collection bỏ tham số tuỳ chọn không dùng, đối chiếu docs. Không đổi auth/schema/migration/API. Hook dùng chung cho `news` + `rentals` và sai cache có thể phục vụ dữ liệu cũ nên kiểm tiền đề cache đầu-cuối thay vì FAST.
- **Blast radius:** `src/hooks/homepage/revalidate-homepage-on-service.ts` (`createRevalidateHomepageOnListing`), `src/collections/News.ts`, `Rentals.ts`, test `revalidate-homepage-on-unpublish.test.ts`, ISR trang chủ `/vi` `/en`; docs `docs/DESIGN.md`, `docs/ERD.md` §4.12/§4.15, design-spec S01, task log. Tag `global:homepage` (thanh thông báo ở layout mọi route) không còn bị lưu tin tức/cho thuê invalidate — đúng chủ đích. Hook dịch vụ, dự án/ưu đãi, global trang chủ không đổi.

## Kiểm tiền đề D4
- `unstable_cache` chỉ ở `src/lib/content/get-globals.ts:18` (`cachedGlobal`, tag `global:homepage`, 60s); repo không có `'use cache'`/`cacheTag`.
- `loadHomePage` (`src/lib/home/load-home.ts:60-72`) chỉ đọc global qua `getHomepage(locale)` (có cache); bản ghi khối qua `loadHomeDocs` (không cache).
- `home-queries.ts`: tin tức `selectedIds(homepage.news?.posts)` lấy id rồi đọc lại trực tiếp `findSelected<News>` (dòng 116), fallback `findPublicList` (120); cho thuê đọc lại danh mục `findSelectedRentalCategories` (137), tin qua `PostgresRentalSearch` (128). Không đọc dữ liệu quan hệ đã populate trong global cache.
- **Kết luận: tiền đề đúng** — revalidate path `/vi` `/en` là đủ; invalidate tag trước đây thừa và làm mới ISR toàn site.
- Điều kiện kích hoạt không đổi (afterChange khi doc hoặc bản trước đã xuất bản + hiển thị; afterDelete khi bản xoá đã xuất bản). Test phủ publish, sửa khi đang hiện, ẩn, xoá mềm, xuất bản → đã thuê, xoá cứng, 3 case không làm gì; assert chính xác `toEqual(["/vi", "/en"])`.
- Không caller nào truyền tham số thứ 2 cho `createNews`/`createRentals` (grep `src` + `tests`); typecheck PASS.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | 0 error, 2 warning cũ |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/hooks src/lib` | 102 files, 1056/1056 PASS |
| `pnpm vitest run tests/integration/{homepage,rentals,news}.test.ts` (`tami_wt_bl020`) | 3 files, 90/90 PASS |

## Docs D1–D3 vs code
D1 `docs/DESIGN.md` dòng trang chủ (thanh thông báo, ô tìm kiếm + chip, slider thẻ 464×600 kính mờ, thứ tự theo `blockOrder`) và dòng Announcement Bar (toàn site: lưu global trang chủ, dịch vụ đã xuất bản, gỡ xuất bản dự án/tin BĐS — khớp `createRevalidateHomepageOnService`/`OnUnpublish` dòng 10–41; chỉ `/` `/en`: lưu tin cho thuê/tin tức) ✅. D2 design-spec S01 (khối 3 slider thẻ không eyebrow, khối 5 slider thẻ, ngân sách eyebrow 0/3) ✅. D3 ERD §4.12 thêm `ctaBanner.image`; §4.15 tiêu đề tuỳ chọn rentals/news (`home-view.ts:21`), header nổi thay ghi chú cũ, UI P2-T04 đã dựng, hook listing chỉ path ✅ (chỉ as-built). File cấm không đụng.

## Responsive gate: N/A (chỉ hook server + docs)

## Skill gates
aislop skip · oxlint skip (ESLint 0 error) · ocr skip · AI-readable OK (0 chỉ báo) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
- **[MINOR]** `tasks/feature-public-ui-market-vinhomes/phase-2-task-05.md` (D4): lý do "hook global/service/unpublish giữ tag vì dữ liệu đọc qua cache tag" không chính xác — dự án, ưu đãi, dịch vụ cũng đọc trực tiếp theo id (`home-queries.ts` dòng 78/100/105); chỉ global được cache theo tag. Hành vi vẫn đúng (tag thừa ở hook dịch vụ/gỡ xuất bản, cần ở hook global). Chú thích `src/hooks/homepage/revalidate-homepage.ts:20` ("đã populate quan hệ") cũng gây hiểu nhầm. → **Primary đã sửa câu trong task log** + ghi đề xuất follow-up bỏ tag ở 2 hook đó.
- **[MINOR]** (ngoài phạm vi) đổi tên danh mục cho thuê → nhãn tab trang chủ cũ tới hết ISR 60s; chưa kiểm hook `categories` có revalidate trang chủ không (như trước thay đổi này).

## Verdict: PASS
