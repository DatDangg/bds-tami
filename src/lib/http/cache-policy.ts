/**
 * Chính sách Cache-Control của website (ARCHITECTURE §5.1). Một nơi duy nhất: `next.config.ts` (trang công khai,
 * `/admin`), `[...slug]/route.ts` (mặc định no-store cho REST Payload) và `Media.upload.modifyResponseHeaders` (ảnh)
 * đều lấy giá trị ở đây. Test kiểm bằng header thật (integration + `next start`).
 */

/** Trang công khai: CDN giữ 60s rồi phục vụ bản cũ tối đa 300s trong lúc làm mới (nội dung lên web ≤ 1 phút, BRD §7.2). */
export const PUBLIC_PAGE_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";

/**
 * `GET /api/public/rentals` (API_SPEC §3.3): CDN giữ 60s, không stale-while-revalidate (kết quả theo bộ lọc, ít khi trùng URL).
 * URL gồm `locale` nên cache key tách theo ngôn ngữ; response lỗi (400/429/503) không dùng giá trị này.
 */
export const PUBLIC_SEARCH_API_CACHE_CONTROL = "public, s-maxage=60";

/** `/admin`, `/api/*` (trừ ngoại lệ bên dưới): không bao giờ vào CDN/proxy/trình duyệt. */
export const NO_STORE_CACHE_CONTROL = "no-store";

/**
 * Ngoại lệ G1: ảnh `/api/media/file/*`. Tên file ngẫu nhiên và bất biến (đổi ảnh = file mới), nên cache 1 năm.
 * Storage-s3 không tự đặt Cache-Control, chỉ `upload.modifyResponseHeaders` của collection `media` đặt được.
 */
export const MEDIA_FILE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Đường dẫn trang công khai cho `headers()` của Next: mọi đường dẫn TRỪ `/admin`, `/api`, `/_next`, `/_vercel` và file có
 * đuôi (ảnh trong `public/`, sitemap.xml, robots.txt...); khớp matcher của `src/proxy.ts`. Dùng `[.]` thay cho `\.`:
 * Next/path-to-regexp nuốt dấu `\`, `\.` thành `.` (khớp mọi ký tự) làm cả `/en` bị loại khỏi nhóm công khai.
 */
export const PUBLIC_PAGE_SOURCE = "/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*[.].*).*)";

/**
 * Đường dẫn có đuôi file (robots.txt, sitemap.xml, llms.txt, favicon.ico, ảnh trong `public/`...) TRỪ `/_next`, `/api`,
 * `/admin`, `/_vercel`. Khớp phần bù của `PUBLIC_PAGE_SOURCE` (cùng cách dùng `[.]`).
 */
export const DOTTED_PATH_SOURCE = "/((?!api(?:/|$)|admin(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|sitemap[.]xml(?:/|$)|llms[.]txt(?:/|$)|sitemaps(?:/|$)).*[.].*)";

/**
 * Route handler tự đặt Cache-Control (200/404 ngắn, 503 `no-store`): `/sitemap.xml`, `/llms.txt`, `/sitemaps/*`. Header khai ở
 * `next.config.ts` thắng header của route, nên các path này bị loại khỏi `DOTTED_PATH_SOURCE` (nếu không, `no-store` của 503
 * bị đè thành `s-maxage=60` và CDN giữ lỗi tạm thời). Chỉ còn rule biến thể RSC (`no-store`) áp cho chúng.
 */
export const ROUTE_HANDLER_FILE_SOURCE = "/(sitemap[.]xml|llms[.]txt|sitemaps/.*)";

/**
 * Path có đuôi: CDN giữ ngắn (60s), trình duyệt luôn hỏi lại. Lý do: file `public/` không có hash trong tên, và request
 * tới file chưa tồn tại (robots.txt, sitemap.xml, llms.txt trước khi task SEO thêm) rơi vào `/_not-found` tĩnh mà Next gắn
 * `s-maxage=31536000`; Cloudflare cache theo đuôi file nên 404 sẽ ở lại CDN 1 năm và che file thật deploy sau.
 * `/_next/static/*` (có hash) không thuộc nhóm này nên giữ `immutable` mặc định của Next.
 */
export const DOTTED_PATH_CACHE_CONTROL = "public, max-age=0, s-maxage=60";

/**
 * Biến thể RSC của trang công khai (điều hướng client/prefetch): Next phân biệt chúng với HTML chỉ bằng header request
 * (`RSC`, `Next-Router-*`) hoặc query `_rsc`, còn Cloudflare bỏ qua `Vary` và cache theo URL. Nếu để `public`, một request
 * có `RSC: 1` lúc cache miss sẽ làm CDN lưu 307/flight payload rồi phát cho mọi khách. Nên các biến thể này `no-store`.
 */
const RSC_REQUEST_HEADERS = ["rsc", "next-router-prefetch", "next-router-state-tree", "next-router-segment-prefetch"] as const;

/**
 * Phải đặt SAU rule gốc của `source`: cùng key `Cache-Control` thì rule khai sau ghi đè. Áp cho cả path có đuôi
 * (robots.txt, sitemap.xml, llms.txt do route handler sinh): request kèm `RSC: 1` tới đó cũng không được vào CDN.
 */
function rscVariantNoStoreRules(source: string) {
  const noStore = [{ key: "Cache-Control", value: NO_STORE_CACHE_CONTROL }];
  return [
    ...RSC_REQUEST_HEADERS.map((key) => ({ source, has: [{ type: "header" as const, key }], headers: noStore })),
    { source, has: [{ type: "query" as const, key: "_rsc" }], headers: noStore },
  ];
}

/**
 * Header cho `next.config.ts`. Next giữ Cache-Control đã đặt ở đây cho trang tĩnh/ISR (không ghi đè bằng
 * `s-maxage=31536000`), nhưng header khai ở config THẮNG header do route handler tự đặt, nên KHÔNG khai `/api/*` ở đây
 * (sẽ đè `private, max-age=300` của monitoring-config, `no-store` của health, ảnh immutable): xem `withDefaultNoStore`.
 */
export function cacheControlHeaders() {
  return [
    { source: PUBLIC_PAGE_SOURCE, headers: [{ key: "Cache-Control", value: PUBLIC_PAGE_CACHE_CONTROL }] },
    ...rscVariantNoStoreRules(PUBLIC_PAGE_SOURCE),
    { source: DOTTED_PATH_SOURCE, headers: [{ key: "Cache-Control", value: DOTTED_PATH_CACHE_CONTROL }] },
    ...rscVariantNoStoreRules(DOTTED_PATH_SOURCE),
    ...rscVariantNoStoreRules(ROUTE_HANDLER_FILE_SOURCE),
    { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: NO_STORE_CACHE_CONTROL }] },
  ];
}

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<Response> | Response;

/**
 * Bọc route handler: response chưa có `Cache-Control` thì thêm `no-store` (REST Payload không tự đặt, kể cả 404/500 của
 * file media); response đã có (ảnh `immutable`) giữ nguyên. Mặc định an toàn: JSON có thể chứa dữ liệu theo phiên.
 */
export function withDefaultNoStore<Args extends unknown[]>(handler: RouteHandler<Args>): (...args: Args) => Promise<Response> {
  return async (...args) => {
    const response = await handler(...args);
    if (response.headers.has("Cache-Control")) return response;
    // Tạo Response mới: header của Response.redirect / fetch là immutable. Thân (stream) được chuyển nguyên.
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  };
}
