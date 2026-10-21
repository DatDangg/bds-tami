/**
 * Đường dẫn nội bộ an toàn để dùng làm `from`/`to` của `redirects` (chống open redirect). Là MỘT nguồn duy nhất cho cả
 * validator ở collection lẫn bước đọc ở proxy.
 * - Bắt đầu bằng đúng một `/`; ký tự thứ hai không phải `/` hay `\` (trình duyệt/WHATWG URL coi `\` như `/`, nên `/\evil.com`
 *   thành `//evil.com`).
 * - Không có `\`, khoảng trắng hay ký tự điều khiển ở bất kỳ đâu.
 * - Không bắt đầu bằng `/%2F` hay `/%5C` (dạng mã hoá của hai ký tự trên; một số lớp phía trước giải mã rồi mới chuyển tiếp).
 */
const SAFE_INTERNAL_PATH = /^\/(?![/\\]|%2f|%5c)[^\\\s\u0000-\u001f\u007f]*$/i;

export const isSafeInternalPath = (value: unknown): value is string => typeof value === "string" && SAFE_INTERNAL_PATH.test(value);

/** Đích nút do admin nhập (khối "Tìm hiểu thêm" trang danh sách, BL-052): trang trong website (an toàn như trên) hoặc địa chỉ `https://`. */
export function isInternalPathOrHttps(value: unknown): value is string {
  if (isSafeInternalPath(value)) return true;
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
