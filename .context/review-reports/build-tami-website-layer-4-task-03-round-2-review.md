Agent: reviewer

# Review — build/tami-website layer-4-task-03 — round 2

- **Review level:** STRICT
- **Reason:** cache policy dùng chung cho toàn bộ public site (CDN cache key), data-access layer dùng chung cho mọi trang công khai (lọc status/hasEnglish/overrideAccess), shared route wrapper cho REST Payload.
- **Blast radius:** `next.config.ts` `headers()` (mọi response trang + path có đuôi file + `/admin`), `src/lib/http/cache-policy.ts`, `src/app/(payload)/api/[...slug]/route.ts` (toàn bộ REST Payload), `src/collections/Media.ts` (ảnh `/api/media/file/*`), `src/lib/content/public-queries.ts` + `pagination.ts` (mọi trang công khai layer 5–16), Cloudflare cache rule ở layer-6-task-01.

## Verify commands + result (reviewer tự chạy)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK (0 lỗi) |
| `pnpm typecheck` | OK (0 lỗi) |
| `pnpm test` | 73 file / 777 test PASS |
| `pnpm build` | OK |
| `next start -p 3091` + curl (đã dừng process, port free) | xem bảng dưới |

Header đo thật (gửi kèm `Accept-Language: en-US` + `Cookie: NEXT_LOCALE=en`):

| Request | Status | Cache-Control |
|---|---|---|
| `/` | 200 | `public, s-maxage=60, stale-while-revalidate=300` (không redirect theo Accept-Language/cookie) |
| `/en` | 200 | như trên |
| `/vi`, `/vi/du-an`, `/en/du-an` | 301 → `/`, `/du-an`, `/en/projects` | `public, s-maxage=60, swr=300`, không `Set-Cookie` |
| `/robots.txt` | 404 | `public, max-age=0, s-maxage=60` |
| `/en/sitemap.xml`, `/du-an/abc.def`, `/khong-ton-tai` | 404 | `private, no-cache, no-store, max-age=0, must-revalidate` |
| `/brand/tami-logo-gold.png` | 200 | `public, max-age=0, s-maxage=60` |
| `/_next/static/chunks/*` | 200 | `public, max-age=31536000, immutable` |
| `/admin` | 200 | `no-store` |
| `/api/health` | 200 | `no-store` |
| `/api/media/file/x.jpg` | 404 | `no-store` |
| `/` + header `RSC: 1` | **307 → `/?_rsc`** | **`public, s-maxage=60, swr=300`** |
| `/en` + header `RSC: 1` | **307 → `/en?_rsc`** | **`public, s-maxage=60, swr=300`** |
| `/?_rsc` + header `RSC: 1` | 200 `text/x-component` | **`public, s-maxage=60, swr=300`** |
| `/?_rsc` (không header) | 200 `text/html` | `public, s-maxage=60, swr=300` |

## Xác minh các điểm primary yêu cầu

- **MAJOR-1 round 1 (404 path có dấu chấm cache 1 năm): ĐÓNG.** `/robots.txt` 404 giờ `s-maxage=60` (đo thật). Với `max-age=0, s-maxage=60`, CDN tôn trọng origin sẽ giữ 404 tối đa 60s → file thật deploy sau hiện trong ≤ 1 phút, khớp BRD §7.2 / NFR "lên web ≤ 1 phút". Điều kiện còn lại: rule Cloudflare ở layer-6-task-01 không được đặt Edge TTL "ignore origin"/override cho nhóm này (ghi Residual).
- **`/vi` 301 public s-maxage=60: OK.** `routing.ts` có `localeDetection: false`, `localeCookie: false`; đo thật với `Accept-Language: en` + `NEXT_LOCALE=en` → `/` vẫn 200 VI, `/vi*` redirect xác định theo path, không `Set-Cookie`. Cache redirect 60s ở CDN không làm sai locale.
- **Slug có dấu chấm:** `src/lib/slug.ts` + `src/fields/slug.ts:49` ép `[a-z0-9-]` (có test `slug.test.ts:38`), nên không có trang nội dung nào rơi vào `DOTTED_PATH_SOURCE`. `/du-an/abc.def` đo được 404 no-store. OK.
- **`NonPublicCollectionSlug`:** đủ so với `payload-types.ts` hiện tại (staff, media, private-files, audit-logs, click-events, click-stats-daily, payload-kv/jobs/locked-documents/preferences/migrations). Tuy vậy là denylist (xem MINOR-A). Lỡ truyền collection nội bộ thì `overrideAccess: false` + access admin-only vẫn trả rỗng/lỗi where, không lộ dữ liệu.
- **MINOR-1/MINOR-2 round 1:** đã xử lý (JSDoc + ARCH §5.1; kiểu `PublicCollectionSlug`, typecheck pass).

## Responsive Checklist Gate

N/A — diff không đụng route/component/CSS UI (chỉ header HTTP, data-access, collection config).

## Skill gates

- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); `pnpm lint` (eslint) 0 lỗi.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`PUBLIC_PAGE_SOURCE`, `DOTTED_PATH_SOURCE`, `withDefaultNoStore`), hàm ngắn, hằng có tên + JSDoc lý do, ARCHITECTURE §5.1 cập nhật as-built. 0 indicator.
- ai-friendly-web: N/A cho task này (robots/sitemap/llms thuộc task SEO sau); rule DOTTED đã đảm bảo 404 tạm của các file này không che bản thật quá 60s.
- blitzstrike: skip, chưa cài/không có môi trường được phép. Finding MAJOR-1 dưới đây được xác thực bằng request thật vào origin (`next start`), không qua blitzstrike.

## Findings

### [MAJOR-1] Response phụ thuộc request header `RSC` nhận `public, s-maxage=60` → cache poisoning trang công khai trên Cloudflare
- **Vị trí:** `src/lib/http/cache-policy.ts:26` (`PUBLIC_PAGE_SOURCE`) + `:55-60` (`cacheControlHeaders` áp `PUBLIC_PAGE_CACHE_CONTROL` cho mọi response, không phân biệt request RSC); `docs/ARCHITECTURE.md` §5.1 khẳng định "mỗi URL luôn trả cùng một ngôn ngữ, nên CDN cache an toàn" nhưng không xét biến thể RSC.
- **Bằng chứng (đo thật):** `GET /` kèm `RSC: 1` → `307 Location: /?_rsc` với `Cache-Control: public, s-maxage=60, swr=300`; `GET /?_rsc` kèm `RSC: 1` → `200 text/x-component` cũng `public`. Next chỉ phân biệt các biến thể bằng `Vary: rsc, next-router-state-tree, ...`, mà Cloudflare **không tôn trọng `Vary`** (trừ `Accept-Encoding`) — cache key chỉ là URL. Khách ẩn danh gửi `RSC: 1` vào `/` (hoặc `/en`, mọi trang) lúc cache miss → Cloudflare lưu 307 cho key `/` → mọi khách bị chuyển tới `/?_rsc`; gửi tiếp `RSC: 1` vào `/?_rsc` → key đó lưu flight payload → khách thấy text RSC thô thay vì HTML. Lặp lại mỗi 60s (+ swr 300s) được. AC "HTML không phụ thuộc cookie" đúng, nhưng HTML/redirect vẫn phụ thuộc request header — vi phạm tiền đề "CDN cache an toàn" của chính policy task này đặt ra. Không có chỗ nào trong `tasks/**`/ARCHITECTURE nhắc `_rsc`/`RSC`/`Vary` để layer-6-task-01 xử lý.
- **Fix đề xuất (chọn 1, hoặc kết hợp):**
  1. App-level (khuyến nghị, kiểm được bằng test): trong `cacheControlHeaders()` thêm rule sau rule trang công khai, cùng `source: PUBLIC_PAGE_SOURCE` với `has: [{ type: "header", key: "rsc" }]` (và/hoặc `has: [{ type: "query", key: "_rsc" }]`) đặt `Cache-Control: private, no-store` (rule sau thắng rule trước cùng key). Unit test thứ tự/điều kiện `has`; đo lại `next start`: `/` + `RSC: 1` và `/?_rsc` phải ra `private, no-store`, `/` thường vẫn `public, s-maxage=60`.
  2. Nếu chọn xử lý ở CDN: ghi thành AC bắt buộc của `layer-6-task-01` (Cache Rule bypass khi có header `rsc`/`next-router-prefetch`/`next-router-state-tree` hoặc query `_rsc`) + cập nhật ARCHITECTURE §5.1 nêu rõ điều kiện an toàn. Cách này chỉ chấp nhận được nếu có quyết định ghi lại; khuyến nghị vẫn là (1) vì origin không nên phát `public` cho biến thể theo header.

### [MINOR-A] `PublicCollectionSlug` là denylist
- **Vị trí:** `src/lib/content/public-queries.ts:7-21`.
- Collection nội bộ thêm sau này (vd form submissions, leads) sẽ mặc định được phép truyền vào `findPublicList`. Rủi ro thấp vì `overrideAccess: false` + access admin-only. Đề xuất: đổi sang allowlist `PublicCollectionSlug = "categories" | "developers" | ...` (mở rộng khi thêm collection nội dung) hoặc thêm test kiểu khẳng định danh sách non-public khớp `CollectionSlug` hiện có.

### [MINOR-B] File trong `public/` (ảnh brand) `max-age=0`
- **Vị trí:** `src/lib/http/cache-policy.ts:43`.
- Trình duyệt revalidate mỗi lần tải ảnh brand/favicon. Chấp nhận được cho giai đoạn này (builder đã ghi residual); khi có nhiều asset trong `public/` nên tách thư mục có version/hash để cho `immutable`.

## Residual risk
- Cloudflare Cache Rule ở layer-6-task-01 phải "respect origin" cho path có đuôi file và HTML; nếu đặt Edge TTL ghi đè thì 404 robots/sitemap có thể bị giữ quá 60s.
- Khi bật draft mode / live preview (cookie `__prerender_bypass`) hoặc nội dung theo phiên trên trang công khai sau này, rule `public, s-maxage=60` sẽ áp cả response preview → cần rule `has: cookie` → `private, no-store` hoặc bypass CDN theo cookie.
- POST server action tới URL trang công khai cũng nhận header `public` (Cloudflare không cache POST mặc định — rủi ro thấp).
- Hành vi "Cloudflare bỏ qua Vary" lấy theo tài liệu Cloudflare, chưa đo trên CDN thật (chưa có môi trường); phần origin đã đo thật.

## Verdict

❌ **FAIL** — còn 1 MAJOR (MAJOR-1: biến thể RSC của trang công khai được đánh dấu `public` → cache poisoning trên Cloudflare). MAJOR-1 round 1 đã đóng; MINOR-1/2 round 1 đã xử lý.
