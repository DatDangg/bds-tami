const COMBINING_MARKS = /\p{M}/gu;

/**
 * Chuẩn hoá chuỗi để tìm kiếm không dấu (ERD §6): tương đương `unaccent(lower(x))` của Postgres
 * rồi gộp khoảng trắng. Dùng cho cả `searchText` lúc lưu và từ khoá lúc tìm để hai phía luôn khớp.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
