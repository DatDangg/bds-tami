import { sql } from "@payloadcms/db-postgres";

import { normalizeSearchText } from "./normalize";

/** Mọi chữ có dấu của tiếng Việt (chữ thường); bản hoa sinh từ đây. */
const VIETNAMESE_LOWER = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";

/** Bảng `translate()`: mỗi chữ có dấu (thường + hoa) → chữ không dấu đúng như `normalizeSearchText` cho ra. */
export const UNACCENT_FROM = VIETNAMESE_LOWER + VIETNAMESE_LOWER.toUpperCase();
export const UNACCENT_TO = [...UNACCENT_FROM].map((char) => normalizeSearchText(char)).join("");

/**
 * Biểu thức SQL tương đương `normalizeSearchText` (bỏ dấu + chữ thường) cho cột KHÔNG có `search_text` lưu sẵn (Tin tức, BL-054):
 * `lower(translate(x, …))` bằng hàm có sẵn của Postgres — không cần extension `unaccent`, không thêm cột / migration.
 * Chỉ phủ bảng chữ tiếng Việt dựng sẵn (NFC, dạng Payload lưu); khoảng trắng không cần gộp vì từ khoá khớp từng từ bằng `LIKE`.
 */
export function unaccentSql(expression: ReturnType<typeof sql>): ReturnType<typeof sql> {
  return sql`lower(translate(${expression}, ${UNACCENT_FROM}, ${UNACCENT_TO}))`;
}
