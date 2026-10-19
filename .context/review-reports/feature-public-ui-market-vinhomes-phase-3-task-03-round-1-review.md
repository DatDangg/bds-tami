Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-3-task-03 · round 1

## Review level
**STRICT** (task ghi NORMAL nhưng diff đổi `PageBanner`/`CategoryListTemplate` dùng chung, phân trang/canonical, thêm form lead công khai).

## Blast radius
- `PageBanner` thêm prop `overlap` + `data-*`; mọi trang banner compact; `RentalListPage` truyền `overlap`.
- `CategoryListTemplate`: union type `searchBar`, slot `belowContent`, `data-search-overlay`.
- `/tin-tuc`, `/en/news` (mọi trang), `/tin-tuc/danh-muc/*`.
- `listPublicNews` thêm `featuredOnly`; `listChildNewsCategoriesOf` mới; `buildNewsChips` nhận `preloadedRoots`.
- Leads API: `source=contact` từ trang mới; không đổi API/schema.

## Verify commands + result
- `pnpm lint`: 0 error (2 warning cũ `tools/task-dashboard/server.mjs`).
- `pnpm typecheck`: PASS.
- `pnpm test src/components/news src/lib/news src/components/templates src/components/layout src/components/projects src/components/rentals`: 28 files / 270 tests PASS.
- Full test / build: builder 284 files / 3002 PASS, build PASS.

## Điểm kiểm
- `force-dynamic` không đổi (`git diff 1511db5 -- src/app` rỗng; `tin-tuc/page.tsx:10`, `danh-muc/[category]/page.tsx:10`).
- Metadata/canonical/rel: `buildNewsListMetadata` không đổi; test `NewsListPage.test.tsx:181,227-241` (trang 1, trang N, `/en`, danh mục, hreflang, rel=next).
- `/en`: truy vấn mới qua `findPublicList` theo locale (test :190).
- LeadForm: `source="contact"` + `readTurnstileSiteKey()` như `lien-he/page.tsx:84`; API nhận `contact` không cần `sourceId` (`src/shared/types/api.ts:99-100`); 1 `LeadFormSlot` → 1 `id="lead-form"`; không có ở trang danh mục.
- CTA header `#lead-form`: nay cuộn tới form ở `/tin-tuc` — vô hại.
- a11y: h1 → h2 "Tin nổi bật" → h3 thẻ → h2 hàng danh mục → h2 form; "Xem thêm" `aria-label="Xem thêm tin {name}"` 44px; pill "Tất cả" current.
- i18n: `viewMore`, `viewMoreIn`, `consultTitle` VI/EN.
- Truy vấn trang 1: ~13, mỗi truy vấn cố định, không N+1.

## Responsive gate (375/768/1280, đọc class)
Không cuộn ngang OK · mobile-first OK · token chữ OK · ảnh `sizes` 4 cột + featured `priority` OK · vùng chạm 44px OK · tab cuộn ngang < sm OK · bảng/100vh/motion N/A. **PASS**

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK (1 chỉ dấu MINOR-2); ai-friendly-web/blitzstrike N/A.

## Findings
### [MAJOR-1] Bài mà lưới trang 1 cũ hiển thị nay không còn ở danh sách phân trang
`src/components/news/NewsListPage.tsx:250` + `src/lib/news/news-listing.ts:47-49`: `loadNewsListing` vẫn bỏ 4 bài mới nhất và phân trang phần còn lại 12/trang → trang 2 bắt đầu từ bài thứ 17 (test builder `NewsListPage.test.tsx:201`). Trang 1 nay render `NewsHomeBody` thay `listing.items` → bài 5–16 chỉ hiện nếu lọt vào "Tin nổi bật" hoặc 4 bài đầu của một hàng danh mục; bài không danh mục / ngoài 4 bài mỗi danh mục không còn truy cập được qua phân trang (crawler cũng mất link). Vi phạm "trang 2+ giữ lưới phân trang hiện có" / "phân trang không đổi".
Fix A (khuyến nghị, URL/canonical không đổi): trang 1 render `listing.items` thành mục lưới "Tin khác" sau các hàng danh mục, trước phân trang. Fix B: đổi offset (cần duyệt SEO). Thêm test mọi bài n5–n16 xuất hiện ở trang 1 hoặc 2.
### [MINOR-1] Truy vấn thừa trang 1 — `src/lib/news/news-home.ts:722` "newest" (limit 5) lặp "head" (limit 4) của `news-listing.ts:47` → trả `head` limit 5 hoặc truyền vào.
### [MINOR-2] Comment cũ `NewsListing.featured` (`src/lib/news/news-listing.ts:16,50`) — không trang web nào dùng; xoá field hoặc ghi rõ consumer còn cần.

Carry-over P1-T01 (m-b, m-c) và P3-T02 (MINOR-1/2/3): đã đóng.

## Verdict
**FAIL** — MAJOR-1 về builder round 2.
