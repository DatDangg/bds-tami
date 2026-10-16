import type { ApiError, ApiSuccess } from "@/shared/types/api";

/** Response thành công theo API_SPEC §2: `{ success: true, data }`. */
export function ok<T>(data: T, status = 200): Response {
  if (!Number.isInteger(status) || status < 200 || status > 299) {
    throw new RangeError(`ok() cần mã thành công 2xx, nhận ${status}`);
  }
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, { status });
}

/** Response lỗi theo API_SPEC §2: `{ success: false, error, details }`; `status` phải là 4xx/5xx. */
export function fail(status: number, error: string, details: unknown[] = []): Response {
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    throw new RangeError(`fail() cần mã lỗi 4xx/5xx, nhận ${status}`);
  }
  const body: ApiError = { success: false, error, details };
  return Response.json(body, { status });
}
