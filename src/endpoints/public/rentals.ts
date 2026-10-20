import type { Endpoint } from "payload";

import { runPublicPipeline, type PublicPipelineDeps, type ValidationOutcome } from "../_middleware/public-pipeline";
import { NO_STORE_CACHE_CONTROL, PUBLIC_SEARCH_API_CACHE_CONTROL } from "../../lib/http/cache-policy";
import { ok } from "../../lib/http/response";
import { PostgresRentalSearch, type RentalSearchService, sqlExecutorOf } from "../../lib/search/search-service";
import { type RentalSearchParams, rentalSearchParamsSchema } from "../../shared/types/api";

/** Phần của request mà endpoint cần; `Request` chuẩn và `PayloadRequest` đều đáp ứng. */
export interface RentalsRequest {
  url: string;
  headers: Headers;
}

/**
 * Đọc query string -> tham số đã kiểm. Khoá lặp (`?q=a&q=b`) lấy giá trị đầu; khoá lạ bị bỏ qua.
 * Riêng `amenities` (danh sách, API_SPEC §3.3) gộp mọi lần xuất hiện: `?amenities=pool&amenities=gym` ≡ `?amenities=pool,gym`
 * (form không JS của trang `/cho-thue` cũng gửi dạng lặp) — schema tách phẩy, bỏ trùng và lọc theo danh sách.
 */
export function parseRentalSearchParams(url: string): ValidationOutcome<RentalSearchParams> {
  const { searchParams } = new URL(url);
  const raw: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams) if (!(key in raw)) raw[key] = value;
  if ("amenities" in raw) raw.amenities = searchParams.getAll("amenities");
  const parsed = rentalSearchParamsSchema.safeParse(raw);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, details: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) };
}

/**
 * Chuỗi bảo vệ (rate limit 60/phút/IP, không Turnstile) -> kiểm tham số (400) -> `SearchService` -> 200 + `s-maxage=60`.
 * Redis lỗi thì pipeline trả 503 (API_SPEC §2). Chỉ response thành công mới cho CDN cache.
 */
export async function handleRentalsSearch(
  request: RentalsRequest,
  searchService: RentalSearchService,
  pipelineDeps?: PublicPipelineDeps,
): Promise<Response> {
  const result = await runPublicPipeline(
    {
      request: new Request(request.url, { method: "GET", headers: request.headers }),
      endpoint: "rentals",
      turnstile: false,
      validate: () => parseRentalSearchParams(request.url),
    },
    pipelineDeps,
  );
  if (!result.ok) {
    // Lỗi (400/429/503) không bao giờ vào CDN: một 429 bị cache sẽ chặn cả người dùng khác cùng URL.
    result.response.headers.set("Cache-Control", NO_STORE_CACHE_CONTROL);
    return result.response;
  }
  const response = ok(await searchService.search(result.value));
  response.headers.set("Cache-Control", PUBLIC_SEARCH_API_CACHE_CONTROL);
  return response;
}

export const rentalsEndpoint: Endpoint = {
  path: "/public/rentals",
  method: "get",
  handler: (req) => handleRentalsSearch({ url: req.url!, headers: req.headers }, new PostgresRentalSearch(sqlExecutorOf(req.payload))),
};
