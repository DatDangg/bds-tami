Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-3-task-03 · round 2

## Review level
**STRICT** — như round 1 (component dùng chung, phân trang/canonical, form lead công khai).

## Blast radius
Như round 1, thêm: `NewsHomeBody` prop `moreItems` + mục "Tin khác"; `NewsListBody` bỏ prop `featured` (caller duy nhất `NewsListPage`); comment `news-listing.ts`. Phân trang, canonical, `force-dynamic`, leads API, schema không đổi.

## Verify commands + result
- `pnpm lint`: 0 error (2 warning cũ).
- `pnpm typecheck`: PASS.
- `pnpm test src/components/news src/lib/news src/components/templates src/components/layout`: 20 files / 154 tests PASS.
- Full test/build: builder 3004 PASS, build PASS.

## Đóng finding round 1
- MAJOR-1 (Fix A): **đóng một phần** — trang 1 render `listing.items` (n5–n16) thành "Tin khác" sau hàng danh mục, trước phân trang; offset/`withPage`/canonical không đổi; test `NewsListPage.test.tsx:170-183` (n5–n20 ở trang 1 hoặc 2 + thứ tự DOM). Còn hở 4 bài mới nhất (MAJOR-1 dưới).
- MINOR-1: chấp nhận (chạy song song, không thêm round-trip).
- MINOR-2: đóng (`news-listing.ts:16` nêu `tests/integration/news.test.ts`).

## Kiểm hồi quy
Heading h1 → h2 (Tin nổi bật / hàng danh mục / Tin khác / Tư vấn nhu cầu) → h3 (test :154); `page.news.moreNews` VI "Tin khác" / EN "More news"; `useId()`, 1 `#lead-form`; không trùng key React; lưới mobile-first.

## Responsive gate (375/768/1280, đọc class)
Không cuộn ngang OK · cột 1/2/3/4 OK · mobile-first OK · token OK · `sizes` + `priority` OK · "Xem thêm" 44px OK · chip cuộn ngang OK. **PASS** (chưa trình duyệt thật).

## Skill gates
aislop/oxlint/ocr skip; AI-readable OK; ai-friendly-web/blitzstrike N/A.

## Findings
### [MAJOR-1] 4 bài mới nhất có thể biến mất khỏi `/tin-tuc` (phần còn lại của MAJOR-1 r1)
`src/lib/news/news-home.ts` (`featuredDocs = [...flagged, ...newest]`) + `src/lib/news/news-listing.ts:47-49`: `loadNewsListing` vẫn bỏ n1–n4 khỏi lưới mọi trang (trước đây hiện qua `listing.featured`). "Tin nổi bật" ưu tiên `isFeatured` rồi mới nhất → ≥ 1 bài cũ được gắn nổi bật thì n4 rơi; ≥ 5 thì n1–n4 rơi. Bài rơi chỉ còn ở hàng danh mục; `News.category` tuỳ chọn và chỉ 6 danh mục gốc có hàng → bài mới nhất không danh mục / danh mục ngoài 6 không xuất hiện ở trang nào. Test chỉ phủ n5–n20.
Fix: trang 1 thêm các bài `listing.featured` chưa có trong `home.lead`/`home.list`/`home.rows` vào đầu `moreItems` (URL/canonical không đổi), hoặc giữ chỗ bài mới nhất trong "Tin nổi bật". Test: ≥ 5 bài cũ nổi bật + n1–n4 không danh mục → mọi bài n1–n20 ở trang 1 hoặc 2.
### [MINOR-1] Một bài có thể hiện 2 lần ở trang 1 (n9 ở "Tin nổi bật" và "Tin khác") — cosmetic; khi sửa MAJOR-1 nên lọc id đã hiện ở "Tin nổi bật".

## Verdict
**FAIL** — MAJOR-1 về builder round 3.
