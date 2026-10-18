Agent: reviewer

# Review: build/tami-website, layer-8-task-05, round 2

Worktree: `D:\prj\bds-wt8-t05` (chưa commit). Task: `tasks/tami-website/layer-8-task-05.md` (sitemap.xml + alternates, robots.txt, llms.txt).
Round 1: FAIL (M1 + MINOR m1–m6), xem `build-tami-website-layer-8-task-05-round-1-review.md`.

## Review level: STRICT
**Lý do:** route công khai đọc DB (có thể lộ URL chưa công khai), robots production quyết định index toàn site, và lượt này sửa `src/lib/http/cache-policy.ts`, file áp Cache-Control cho toàn site qua `next.config.ts` `headers()`.

## Blast radius
- Mới: `src/app/{sitemap.xml,sitemaps/[file],llms.txt}/route.ts`, `src/lib/seo/{file-route-response,sitemap-data,sitemap-routes,sitemap-xml,llms-route,llms-txt}.ts` + test, `tests/integration/sitemap-{jobs,rentals}.test.ts`.
- Sửa: `src/lib/http/cache-policy.ts` (+test). Ảnh hưởng mọi response có rule `headers()`: trang công khai, path có đuôi file (`/robots.txt`, `/favicon.ico`, `public/*`), `/admin`, biến thể RSC. Ngoài ra `src/lib/seo/robots.ts`, `src/app/robots.ts`, `docs/ARCHITECTURE.md` §5.
- Ngoài phạm vi: CDN Cloudflare, crawler thật.

## Verify commands + kết quả (cwd `D:\prj\bds-wt8-t05`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 1768/1768 test PASS, 166/167 file. File lỗi duy nhất là `src/lib/contrast.test.ts` (lỗi CRLF đã biết, không thuộc diff này) |
| `pnpm build` | PASS (exit 0). `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/sitemaps/[file]` đều ƒ (dynamic) |
| `pnpm install --frozen-lockfile` | skip: không đổi dependency |

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ route handler XML/text, robots, cache header).

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, chưa cấu hình oxlint. ESLint PASS.
- ocr: skip, chưa cài `ocr`.
- AI-readable: OK. File dưới 160 dòng, hàm dưới 50 dòng, hằng có tên, comment giải thích WHY, ARCH §5 đã cập nhật. Có 1 comment cũ không còn đúng (m8), dưới ngưỡng 3 indicator.
- ai-friendly-web: OK. Có `llms.txt`, `robots.txt` (AI crawler cùng nhóm với `*`, có `Sitemap:`), `sitemap.xml` index.
- blitzstrike: skip, chưa cài và không có môi trường được phép. Đã soát tĩnh: path traversal ở `[file]` bị regex chặn, query string bị chặn trước DB.

## Kiểm các fix của round 1
- **M1 (đã đóng, cho mọi nhóm):** `sitemap-data.ts:142` giờ `select: { slug, hasEnglish, updatedAt, seo: true }` cho mọi `COLLECTION_SECTIONS` (projects, rentals, property-posts, news, job-postings, services, categories-news, categories-property-posts), nên `isIndexable` (`:70`) xét `seo.<locale>.noindex` cho từng ngôn ngữ ở mọi nhóm. Test integration `sitemap-rentals.test.ts:147` phủ danh mục noindex ở cả hai / chỉ vi / chỉ en. Rentals (`:126`) và jobs (`:84`) cũng có case noindex. Nhóm static: trang pháp lý không dùng `seo` khi dựng metadata (`LegalPage.tsx:17-30` không truyền `seo`), nên sitemap không xét noindex là đúng với trang thật.
- **m2:** index dùng `Promise.all` (`sitemap-routes.ts:24`). `hasQueryString` trả 404 trước DB cho `/sitemap.xml`, `/sitemaps/*`, `/llms.txt`. Có test (`sitemap-routes.test.ts:69,95`).
- **m3:** `DOTTED_PATH_SOURCE` loại `sitemap[.]xml(?:/|$)`, `llms[.]txt(?:/|$)`, `sitemaps(?:/|$)`. Rà regex:
  - `/robots.txt`, `/favicon.ico`, `/brand/*.png`, `/en/robots.txt` vẫn khớp DOTTED (có test), nên robots.txt vẫn nhận `public, max-age=0, s-maxage=60` và RSC `no-store` như cũ.
  - Lookahead chỉ khớp ở đầu path, kèm `/` hoặc `$`, nên `/sitemap.xml.bak`, `/sitemaps-x.png`, `/en/sitemap.xml` vẫn thuộc DOTTED. Không path nào khác bị rơi khỏi rule.
  - `PUBLIC_PAGE_SOURCE` và `/admin` giữ nguyên. Rule RSC mới (`ROUTE_HANDLER_FILE_SOURCE`) nằm sau các rule gốc và chỉ set `no-store`, nên không nới cache cho path nào.
  - Route tự đặt header: 200/404 `public, max-age=0, s-maxage=60`, 503 `no-store` (`file-route-response.ts`). Có test header ở `sitemap-routes.test.ts:34,59,66,79,100`. Builder báo đã đo `next start`, reviewer chưa xác minh độc lập (xem Residual risk).
- **m4:** `INDEXABLE_WHERE = { "seo.noindex": { not_equals: true } }` dùng trong `llms-route.ts:27`. Có test integration giữ bản ghi chưa đặt `seo`, tức null vẫn qua (`sitemap-jobs.test.ts:90`).
- **m5:** `sitemap-routes.test.ts` phủ nhóm lạ, chunk 0, sai đuôi, chuỗi mã hoá, chunk vượt số file, nhóm rỗng, `static-2`, thiếu URL, lỗi DB, query string, 200.

## Đánh giá 404 khi có query string
- Googlebot/Bingbot đọc sitemap đúng URL khai trong `robots.txt`/Search Console và không tự thêm query, nên crawler hợp lệ không bị ảnh hưởng. `/sitemap.xml?` (dấu `?` trống) có `search === ""` nên vẫn phục vụ bình thường.
- `?_rsc=` thì bị 404, và rule RSC ép `no-store`. Vô hại.
- Trường hợp bị ảnh hưởng: link do người hoặc tool gắn tracking, ví dụ ChatGPT tự thêm `?utm_source=chatgpt.com` vào link nó trích, hoặc admin tự submit `sitemap.xml?v=2` lên GSC. Các trường hợp này nhận 404. Không phải crawler chính nên chỉ là MINOR (m7).

## Findings

### [MINOR] m7: Query string trả 404 thay vì chuyển về URL sạch
- `src/lib/seo/file-route-response.ts:20-22`, cùng các chỗ gọi `sitemap-routes.ts:18,37` và `llms-route.ts:43`.
- Người mở `llms.txt?utm_source=...` hoặc sitemap submit kèm `?v=` sẽ nhận 404.
- **Đề xuất:** trả `301` về path không có query, kèm `Cache-Control: public, max-age=0, s-maxage=60`. Cách này cũng không chạm DB, CDN vẫn cache được, mà không làm hỏng link. Có thể để follow-up. Route `/llms.txt` chưa có test riêng cho nhánh query/503, nên thêm khi sửa.

### [MINOR] m8: Comment và ARCH cũ vẫn ghi sitemap/llms thuộc DOTTED_PATH_SOURCE
- `src/lib/http/cache-policy.ts:26-27` và `:33-34` vẫn ghi DOTTED gồm `sitemap.xml`, `llms.txt`, và mô tả "khớp phần bù của PUBLIC_PAGE_SOURCE". Câu này không còn đúng: 3 path này giờ không thuộc nhóm nào.
- `docs/ARCHITECTURE.md`, bullet as-built layer-4-task-03, vẫn liệt kê `/sitemap.xml`, `/llms.txt` trong `DOTTED_PATH_SOURCE`, mâu thuẫn với bullet L8-T05 mới.
- **Sửa:** cập nhật 2 comment và thêm ghi chú "(từ L8-T05: trừ sitemap/llms, xem bên dưới)" vào bullet L4-T03.

### [MINOR] m9: Path nhiều đoạn dưới `/sitemaps/` không còn rule TTL ngắn
- Ví dụ `/sitemaps/a/b.xml` không khớp route `[file]` nên rơi vào `/_not-found`. Theo ARCH, Next gắn `s-maxage=31536000` cho trang này, và path đó giờ không thuộc DOTTED nữa.
- Không có URL hợp lệ nào ở đó và không chạm DB, nên chỉ ghi nhận. Nếu muốn chặt hơn, đổi lookahead thành `sitemaps/[^/]+$` để path nhiều đoạn vẫn thuộc DOTTED.

### [MINOR] m1 (từ round 1, còn mở): thứ tự merge với L8-T03
- `/cho-thue` có trong static (`sitemap-data.ts:58`) và llms.txt (`llms-route.ts:61`). Trang danh sách này do L8-T03 làm, ở worktree khác. Cần merge L8-T03 trước, hoặc ghi ràng buộc vào journal/progress.

### [MINOR] m6 (từ round 1, còn mở): `src/payload-types.ts` modified, chỉ đổi line ending
- Không đưa file này vào commit của task.

Không có CRITICAL/MAJOR.

## Residual risk
- Reviewer không chạy `next start`/CDN. Header thực tế (503 `no-store`, 404/200 `s-maxage=60`, robots giữ header) chỉ xác minh qua test unit, regex `path-to-regexp` và số đo builder báo.
- `publishedAt > now` (hẹn giờ) chưa lọc, như round 1 (Notes của task để sau).
- Mỗi lần CDN miss, file con sitemap vẫn tốn 3 truy vấn và tải tối đa 20.000 doc. Query string đã bị chặn nên không còn né cache bằng query. Rate limit ở Cloudflare vẫn nên có.

## Verdict: PASS
M1 đã đóng cho mọi nhóm và có test integration. Thay đổi `cache-policy.ts` chỉ rút đúng 3 path, robots.txt và các trang khác giữ nguyên header. Verify PASS (contrast CRLF đã biết). Các MINOR m1, m6–m9 không chặn: m1 và m6 cần xử lý lúc commit/merge, m7–m9 sửa cùng lượt nếu rẻ hoặc để follow-up.
