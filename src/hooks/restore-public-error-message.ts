import { APIError } from "payload";
import type { AfterErrorHook } from "payload";

/**
 * Khôi phục thông báo của `APIError` công khai ở build production (BL-093).
 * `ExtendableError` của Payload gán `name = constructor.name`; minify làm tên lớp thành "" nên
 * `formatErrors` (lỗi không có `data`, `name` rỗng) rơi về "An unknown error occurred." và mất chữ tiếng Việt.
 * Hook chỉ xét đúng ca đó, nên lỗi 500/không public (không lộ message nội bộ), lỗi có `data`
 * (ValidationError) và lỗi còn `name` giữ nguyên. Không trả `status`: giữ mã HTTP của `routeError`.
 * Chỉ phủ đường REST (nơi Payload gọi `afterError`), là đường duy nhất trả lỗi cho UI admin.
 */
export const restorePublicErrorMessage: AfterErrorHook = ({ error, result }) => {
  if (!(error instanceof APIError)) return;
  if (error.name || error.isPublic !== true || error.data != null) return;
  if (typeof error.message !== "string" || error.message === "") return;
  return { response: { ...result, errors: [{ message: error.message }] } };
};
