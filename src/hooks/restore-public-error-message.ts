import { APIError } from "payload";
import type { AfterErrorHook, AfterErrorResult, ErrorResult } from "payload";

type FieldErrorEntry = { path: string; message: string };

function hasFieldErrors(data: unknown): boolean {
  const errors = (data as { errors?: unknown } | null | undefined)?.errors;
  return Array.isArray(errors) && errors.length > 0 && errors.every((entry) => typeof (entry as Partial<FieldErrorEntry>)?.path === "string" && typeof (entry as Partial<FieldErrorEntry>)?.message === "string");
}

/**
 * Khôi phục `data.errors` của lỗi validate theo ô (BL-119). Build production có nhiều bản sao `payload`: `formatErrors` kiểm `instanceof`
 * lệch bản sao nên bỏ `data` → form admin không gắn lỗi vào ô mà hiện toast gom. Nhận diện theo hình dạng (duck-typing), không `instanceof`.
 */
function restoreValidationData(error: unknown, result: ErrorResult | undefined): AfterErrorResult | undefined {
  const candidate = error as { status?: number; isPublic?: boolean; data?: unknown; message?: unknown } | null | undefined;
  if (candidate?.status !== 400 || candidate.isPublic !== true || !hasFieldErrors(candidate.data)) return;
  if (typeof candidate.message !== "string") return;
  const first = result?.errors?.[0] as { data?: unknown } | undefined;
  if (first?.data != null) return;
  return { response: { ...result, errors: [{ name: "ValidationError", data: candidate.data as Record<string, unknown>, message: candidate.message }] } };
}

/**
 * Khôi phục thông báo của `APIError` công khai ở build production (BL-093).
 * `ExtendableError` của Payload gán `name = constructor.name`; minify làm tên lớp thành "" nên
 * `formatErrors` (lỗi không có `data`, `name` rỗng) rơi về "An unknown error occurred." và mất chữ tiếng Việt.
 * Hook chỉ xét đúng ca đó, nên lỗi 500/không public (không lộ message nội bộ), lỗi có `data`
 * (ValidationError) và lỗi còn `name` giữ nguyên. Không trả `status`: giữ mã HTTP của `routeError`.
 * Chỉ phủ đường REST (nơi Payload gọi `afterError`), là đường duy nhất trả lỗi cho UI admin.
 */
export const restorePublicErrorMessage: AfterErrorHook = ({ error, result }) => {
  const validation = restoreValidationData(error, result);
  if (validation) return validation;
  if (!(error instanceof APIError)) return;
  if (error.name || error.isPublic !== true || error.data != null) return;
  if (typeof error.message !== "string" || error.message === "") return;
  return { response: { ...result, errors: [{ message: error.message }] } };
};
