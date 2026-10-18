import { createHmac, timingSafeEqual } from "node:crypto";

import type { PayloadRequest } from "payload";

import type { RevalidatePaths } from "../../hooks/revalidate-content";

/**
 * Làm mới cache trang từ process KHÁC Next (job chạy ở container `jobs`, ARCHITECTURE §5.4). Ngoài Next, `revalidatePath` không có tác dụng
 * (thiếu work store), nên job gọi route nội bộ của app (`POST /api/internal/revalidate`) để app tự gọi `revalidatePath`.
 *
 * Xác thực bằng Bearer token dẫn xuất từ `PAYLOAD_SECRET` (cả `app` và `jobs` đều có sẵn): không thêm secret mới phải cấp phát/xoay vòng.
 * Token chỉ dùng cho đúng route này (HMAC với nhãn riêng), nên lộ token không lộ `PAYLOAD_SECRET`. Lớp thứ hai: Nginx trả 404 cho
 * `/api/internal/` ra Internet, job gọi thẳng `INTERNAL_APP_URL` trong mạng Docker. Route chỉ nhận đường dẫn trang công khai `/{vi|en}...`.
 */
export const INTERNAL_REVALIDATE_ROUTE = "/api/internal/revalidate";

/** Trần số đường dẫn mỗi request; client tự chia lô. */
export const MAX_PATHS_PER_REQUEST = 200;
const MAX_BODY_CHARS = 64_000;
const REQUEST_TIMEOUT_MS = 10_000;

const TOKEN_LABEL = "tami:internal-revalidate:v1";

/** Mỗi đoạn là ký tự của một slug đã `encodeURIComponent` (không bắt đầu bằng dấu chấm: chặn `.`/`..`). */
const PUBLIC_PAGE_PATH = /^\/(?:vi|en)(?:\/[A-Za-z0-9_~%-][A-Za-z0-9._~%-]*)*$/;

export function revalidateToken(secret: string): string {
  return createHmac("sha256", secret).update(TOKEN_LABEL).digest("hex");
}

/** So Bearer token theo thời gian hằng (băm SHA-256 hai phía để độ dài bằng nhau). */
export function isValidRevalidateAuth(authorizationHeader: string | null, secret: string): boolean {
  const match = /^Bearer (.+)$/.exec(authorizationHeader ?? "");
  if (!match?.[1]) return false;
  const digest = (value: string) => createHmac("sha256", "compare").update(value).digest();
  return timingSafeEqual(digest(match[1]), digest(revalidateToken(secret)));
}

/** Body hợp lệ = `{ paths: string[] }` ≤ {@link MAX_PATHS_PER_REQUEST}, mỗi phần tử là đường dẫn trang công khai; ngược lại `null`. */
export function parseRevalidateBody(raw: string): string[] | null {
  if (raw.length > MAX_BODY_CHARS) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const paths = (json as { paths?: unknown } | null)?.paths;
  if (!Array.isArray(paths) || paths.length > MAX_PATHS_PER_REQUEST) return null;
  return paths.every((path) => typeof path === "string" && PUBLIC_PAGE_PATH.test(path)) ? (paths as string[]) : null;
}

const NO_STORE = { "Cache-Control": "no-store" };

/** Logic của route (tách khỏi Next để test): 401 sai token, 400 body sai, 200 `{ revalidated }` sau khi gọi `revalidate` cho từng đường dẫn. */
export async function handleInternalRevalidate(
  request: Request,
  deps: { secret: string; revalidate: (path: string) => void },
): Promise<Response> {
  if (!isValidRevalidateAuth(request.headers.get("authorization"), deps.secret)) {
    return new Response("Unauthorized", { status: 401, headers: NO_STORE });
  }
  const paths = parseRevalidateBody(await request.text());
  if (!paths) return new Response("Bad Request", { status: 400, headers: NO_STORE });
  for (const path of paths) deps.revalidate(path);
  return Response.json({ revalidated: paths.length }, { headers: NO_STORE });
}

export interface RevalidateViaAppOptions {
  baseUrl: string;
  secret: string;
  fetchImpl?: typeof fetch;
}

/**
 * `RevalidatePaths` cho job: gọi route nội bộ của app theo lô. Lỗi mạng hoặc HTTP khác 2xx → ném lỗi để Payload Jobs thử lại theo `retries`
 * của task (không nuốt lỗi: nuốt thì job báo thành công dù cache chưa được làm mới).
 */
export function createRevalidateViaApp({ baseUrl, secret, fetchImpl = fetch }: RevalidateViaAppOptions): RevalidatePaths {
  const url = new URL(INTERNAL_REVALIDATE_ROUTE, baseUrl);
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${revalidateToken(secret)}` };
  return async (paths: string[]) => {
    for (let start = 0; start < paths.length; start += MAX_PATHS_PER_REQUEST) {
      const response = await fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ paths: paths.slice(start, start + MAX_PATHS_PER_REQUEST) }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Làm mới cache qua app thất bại: HTTP ${response.status}`);
    }
  };
}

/** Mặc định của job: địa chỉ app trong mạng nội bộ (`INTERNAL_APP_URL`, dev `http://localhost:3000`). Đọc env lúc gọi để test/dev không cần cấu hình trước. */
export const revalidateFromJob: RevalidatePaths = (paths: string[], req: PayloadRequest) => {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret) throw new Error("Thiếu PAYLOAD_SECRET: không làm mới được cache trang từ job");
  const baseUrl = process.env.INTERNAL_APP_URL || "http://localhost:3000";
  req.payload.logger.info({ count: paths.length }, "Job: làm mới cache trang qua app");
  return createRevalidateViaApp({ baseUrl, secret })(paths, req);
};
