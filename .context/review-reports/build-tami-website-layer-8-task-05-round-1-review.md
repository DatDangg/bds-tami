Agent: reviewer

# Review: build/tami-website, layer-8-task-05, round 1

Worktree: `D:\prj\bds-wt8-t05` (branch `wt/l8-t05` từ ce01ba1, chưa commit)
Task: `tasks/tami-website/layer-8-task-05.md` (sitemap.xml vi+en alternates, robots.txt, llms.txt)

## Review level: STRICT
**Lý do:** route công khai đọc DB, có thể làm lộ URL/slug nội dung chưa công khai; robots production quyết định việc index toàn site; task tự đặt mức STRICT; cross-cutting (cache policy, SEO).

## Blast radius
- Mới: `src/app/sitemap.xml/route.ts`, `src/app/sitemaps/[file]/route.ts`, `src/app/llms.txt/route.ts`, `src/lib/seo/{sitemap-data,sitemap-routes,sitemap-xml,llms-route,llms-txt}.ts` + test.
- Sửa: `src/lib/seo/robots.ts`, `src/app/robots.ts`, `docs/ARCHITECTURE.md` §5.
- Đọc qua: `publicWhere` (`src/lib/content/public-queries.ts`), `startOfVietnamDay`, `publicPath`, `getSiteUrl`, cache rule `DOTTED_PATH_SOURCE` (đã khớp `/sitemaps/*.xml`), proxy matcher (bỏ qua path có dấu chấm, nên next-intl không chặn route).
- Ngoài phạm vi: crawler Google/AI, CDN Cloudflare.

## Verify commands + kết quả (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test -- src/lib/seo tests/integration/sitemap-*.test.ts` | PASS: 9 file, 59 test |
| `pnpm test` (toàn bộ) | 1743/1743 test PASS; 1 file lỗi khi nạp là `src/lib/contrast.test.ts` (lỗi CRLF đã biết, không liên quan diff này) |
| `pnpm build` | PASS: `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/sitemaps/[file]` đều là ƒ (dynamic) |
| `pnpm install --frozen-lockfile` | skip: không đổi dependency |

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ route handler trả XML/text và robots).

## Skill gates
- aislop: skip (chưa cài `aislop`).
- oxlint (anti-slop): skip (chưa cấu hình oxlint, không có `.oxlintrc.json`). ESLint PASS.
- ocr (open-code-review): skip (chưa cài `ocr`).
- AI-readable: OK. File mới đều dưới 160 dòng, hàm dưới 50 dòng, tên rõ, comment giải thích WHY (luật nhóm robots, giới hạn 20.000/50.000), hằng có tên (`DOCS_PER_SITEMAP`, `SITEMAP_URL_LIMIT`, `LATEST_PER_COLLECTION`), đã cập nhật ARCHITECTURE §5. Không có indicator nào.
- ai-friendly-web: OK. Có `llms.txt` (H1, blockquote, H2 kèm link thật), `robots.txt` (cho phép GPTBot/ClaudeBot/PerplexityBot/Google-Extended/CCBot/anthropic-ai, gộp chung nhóm với `*`) và `sitemap.xml` index.
- blitzstrike: skip (chưa cài, không có môi trường được phép). Đã soát tĩnh phần path traversal/DoS ở dưới.

## Đã kiểm (đạt)
- **Điều kiện công khai:** mọi nhóm dựng `where` bằng `publicWhere(collection, "vi")` dùng chung, `extraWhere` chỉ thu hẹp thêm (`and`). Truy vấn có `overrideAccess: false`, `trash: false`, `fallbackLocale: false`. Rentals thêm `status = published` nên loại `rented`. Job-postings dùng `deadline >= startOfVietnamDay(now)`, đúng phủ định của `isPastDeadline`; `deadline` bắt buộc nên không mất tin thiếu hạn. Allowlist nhóm là map hằng trong code, collection nội bộ (staff, leads...) không lọt vào được.
- **EN:** chỉ khi `hasEnglish === true` và có slug en, đúng với trang `/en` (`publicWhere` en thêm `hasEnglish`).
- **hreflang:** khi có cả hai ngôn ngữ, mỗi `<url>` mang đủ bộ vi/en/x-default (= vi), đối xứng. Chỉ có một ngôn ngữ thì không có alternates. Namespace `xhtml` đúng.
- **`[file]`:** regex `^([a-z-]+)-([1-9]\d{0,5})\.xml$` chặn `..`, `/`, ký tự mã hoá, chunk 0 và số trên 6 chữ số; nhóm phải nằm trong allowlist, nếu không trả 404 trước khi chạm DB. Chunk vượt số file thật thì 404 (chỉ tốn 1 câu `count`). Nhóm static với chunk > 1 thì 404.
- **XML escape:** đủ 5 ký tự. Slug do `slug.ts` ép về `[a-z0-9-]`, `new URL` mã hoá phần còn lại.
- **Giới hạn:** 20.000 bản ghi/file nhân tối đa 2 URL vẫn dưới 50.000; `renderUrlset` ném lỗi nếu vượt. Phân trang ổn định theo `createdAt, id`.
- **robots:** staging/dev chỉ có `Disallow: /`, không khai `Sitemap`. Production `Allow: /`, `Allow: /api/media/file/` (giữ ngoại lệ follow-up L5-T08), `Disallow: /admin`, `/api/`; `Sitemap:` chỉ khai khi biết site URL. Không chặn `/_next/` (JS/CSS/ảnh tối ưu).
- **lastmod** = `updatedAt`.

## Findings

### [MAJOR] M1: Danh mục có `seo.noindex` vẫn được đưa vào sitemap (vi phạm AC "loại `seo.noindex`")
- `src/lib/seo/sitemap-data.ts:142`: `select: { ..., ...(config.collection === "categories" ? {} : { seo: true }) }` bỏ `seo` riêng cho categories, nên `isIndexable` (`:70-72`) luôn trả `true` với danh mục.
- Nhưng `categories` CÓ trường `seo` (`withContentDefaults` không omit `seo`; `Categories.ts:66` chỉ omit status/publishedAt/author/isFeatured), và trang danh mục thật sự dùng nó để đặt noindex: `src/components/news/NewsListPage.tsx:95` và `src/components/posts/PostListPage.tsx:97` truyền `seo: category.seo` vào metadata (`shouldNoindex` ở `metadata.ts:99`).
- Hệ quả: admin bật noindex cho một danh mục thì trang có `noindex`, nhưng sitemap vẫn khai URL đó. Google Search Console sẽ báo lỗi "Submitted URL marked noindex", trái AC1 và mô tả as-built trong ARCHITECTURE ("loại `seo.noindex` theo từng ngôn ngữ").
- **Cách sửa:** chọn `seo: true` cho mọi nhóm (bỏ điều kiện riêng của categories). Thêm test integration: danh mục news có `seo.noindex` (vi, và riêng en) không xuất hiện trong `categories-news`.

### [MINOR] m1: `/cho-thue` trong static và llms.txt trỏ tới trang chưa có trong nhánh
- `src/lib/seo/sitemap-data.ts:58` và `src/lib/seo/llms-route.ts:67`: trang danh sách Cho thuê do L8-T03 làm (đang ở worktree khác). Nếu nhánh này merge và deploy trước L8-T03, sitemap và llms.txt sẽ khai một URL 404.
- **Cách xử lý:** merge L8-T03 trước L8-T05, hoặc ghi ràng buộc thứ tự merge vào journal/progress.

### [MINOR] m2: Hiệu năng truy vấn
- `src/lib/seo/sitemap-routes.ts:23-26`: index chạy 8 câu `count` tuần tự, nên gom bằng `Promise.all`.
- File con chạy 1 `count` cộng 1 `find` phân trang (Payload tự chạy thêm count nữa), tức 3 truy vấn, kèm tải tối đa 20.000 doc `locale: "all"`. Có CDN 60s nên chấp nhận được, nhưng query string lạ (`?x=...`) sẽ né cache CDN. Tạm chấp nhận, ghi vào residual risk (rate limit ở Cloudflare).

### [MINOR] m3: Header `Cache-Control: no-store` của response 503 không có tác dụng
- `sitemap-routes.ts:13`, `llms-route.ts:43,89`: theo ARCHITECTURE §5, header khai ở `next.config.ts` (`DOTTED_PATH_SOURCE`: `s-maxage=60`) thắng header route tự đặt, nên 503 vẫn bị CDN giữ tối đa 60s. Hậu quả nhỏ, nhưng nên bỏ header gây hiểu nhầm hoặc ghi chú lại.

### [MINOR] m4: llms.txt không loại doc có `seo.noindex`
- `src/lib/seo/llms-route.ts:24-36`: lấy 5 doc mới nhất qua `findPublicList` mà không xét `seo.noindex`. Nội dung vẫn công khai nên không phải rò rỉ, nhưng không nhất quán với sitemap. Nên lọc `seo.noindex` (vi) cho đồng bộ.

### [MINOR] m5: Thiếu test cho các nhánh 404 của route file
- `sitemapFileResponse` (`sitemap-routes.ts:35-50`) chưa có test cho: nhóm lạ trả 404, chunk vượt số file trả 404, `static-2.xml` trả 404, thiếu site URL trả 503. Nên bổ sung test unit hoặc integration.

### [MINOR] m6: `src/payload-types.ts` hiện là modified nhưng không có diff nội dung
- `git diff --stat` không liệt kê file này, tức chỉ đổi line ending. Không đưa vào commit của task này.

## Residual risk
- Chưa kiểm hành vi thật trên `next start`/CDN (reviewer không chạy app). Builder báo smoke OK, chưa xác minh độc lập.
- Hẹn giờ `publishedAt > now` chưa được lọc. Task Notes ghi để sau (qua `buildPublicWhere`), và sitemap sẽ tự nhận thay đổi đó.
- Có thể làm tốn DB bằng cách thêm query string để né cache CDN (m2). Đề xuất rate limit cho `/sitemaps/*` ở Cloudflare.

## Verdict: FAIL
Còn 1 MAJOR (M1). Builder sửa M1 kèm test. Các MINOR nên sửa cùng lượt nếu rẻ (m2 gom `Promise.all`, m5 test 404); m1 cần chốt thứ tự merge với L8-T03.
