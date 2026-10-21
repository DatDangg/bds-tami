/** Alt dự phòng khi tên file gốc không có nghĩa (UUID, toàn số, rỗng). */
export const FALLBACK_IMAGE_ALT = "Hình ảnh";

/** Khoá `req.context` mà `createUploadGuard` ghi tên file gốc vào trước khi đổi thành UUID; hook alt đọc lại. */
export const ORIGINAL_UPLOAD_NAME_KEY = "originalUploadName";

const MAX_ALT_LENGTH = 120;
const UUID_PATTERN = /^[0-9a-f]{8}[\s-]?[0-9a-f]{4}[\s-]?[0-9a-f]{4}[\s-]?[0-9a-f]{4}[\s-]?[0-9a-f]{12}$/i;

/**
 * Tên file người dùng tải lên → câu mô tả ngắn cho `alt`: bỏ thư mục + đuôi, `-`/`_`/`.` → khoảng trắng, gộp khoảng trắng.
 * Tên không có chữ cái (toàn số) hoặc là UUID → "Hình ảnh" (còn hơn một chuỗi vô nghĩa).
 */
export function altFromFilename(filename: unknown): string {
  if (typeof filename !== "string") return FALLBACK_IMAGE_ALT;
  const baseName = filename.split(/[\\/]/).pop() ?? "";
  const withoutExtension = baseName.replace(/\.[A-Za-z0-9]{1,5}$/, "");
  const spaced = withoutExtension.replace(/[-_.]+/g, " ").replace(/\s+/g, " ").trim();
  if (spaced === "" || UUID_PATTERN.test(spaced) || !/\p{L}/u.test(spaced)) return FALLBACK_IMAGE_ALT;
  return spaced.slice(0, MAX_ALT_LENGTH).trim();
}
