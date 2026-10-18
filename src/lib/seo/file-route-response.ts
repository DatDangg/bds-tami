import { DOTTED_PATH_CACHE_CONTROL, NO_STORE_CACHE_CONTROL } from "../http/cache-policy";

/**
 * Response của `/sitemap.xml`, `/sitemaps/*`, `/llms.txt`. Các path này tự đặt Cache-Control (không thuộc rule
 * `DOTTED_PATH_SOURCE` của `next.config.ts`, xem `ROUTE_HANDLER_FILE_SOURCE`): 200/404 giữ CDN ngắn, 503 không bao giờ cache.
 */
export function cachedFileResponse(body: string, contentType: string): Response {
  return new Response(body, { headers: { "Content-Type": contentType, "Cache-Control": DOTTED_PATH_CACHE_CONTROL } });
}

export const notFoundFileResponse = () => new Response("Not found", { status: 404, headers: { "Cache-Control": DOTTED_PATH_CACHE_CONTROL } });

export const unavailableFileResponse = (message: string) =>
  new Response(message, { status: 503, headers: { "Cache-Control": NO_STORE_CACHE_CONTROL } });

/**
 * Các file này không nhận tham số: URL có query (`?x=1`) chỉ có thể là cố né cache CDN để ép truy vấn DB lặp lại,
 * nên trả 404 ngay, trước khi chạm DB.
 */
export function hasQueryString(request: Request): boolean {
  return new URL(request.url).search !== "";
}
