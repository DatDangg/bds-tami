/** Giá trị thô từ `searchParams` của Next: chuỗi, mảng (`?page=1&page=2`) hoặc thiếu. */
export type RawPageParam = string | string[] | number | null | undefined;

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
/** Trần số trang: chặn `?page=99999999` bắt DB quét OFFSET khổng lồ. */
export const MAX_PAGE = 500;

export interface Pagination {
  page: number;
  limit: number;
}

/** Số nguyên dương hợp lệ hoặc `null`. Chuỗi phải toàn chữ số (không nhận "1e9", "0x10", " 5", "-3", "2.5", mảng, NaN, Infinity). */
function toPositiveInteger(value: RawPageParam): number | null {
  const parsed = typeof value === "string" && /^\d{1,15}$/.test(value) ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 1) return null;
  return parsed;
}

/**
 * Tham số phân trang an toàn từ URL: giá trị sai/âm/0/NaN rơi về mặc định (trang 1, `defaultLimit`), giá trị quá lớn
 * bị kẹp về `MAX_PAGE` / `MAX_PAGE_SIZE`. Không bao giờ ném lỗi: URL người dùng gõ bừa không được làm vỡ trang.
 */
export function parsePagination(
  rawPage: RawPageParam,
  rawLimit: RawPageParam,
  defaultLimit: number = DEFAULT_PAGE_SIZE,
): Pagination {
  const page = Math.min(toPositiveInteger(rawPage) ?? 1, MAX_PAGE);
  const limit = Math.min(toPositiveInteger(rawLimit) ?? defaultLimit, MAX_PAGE_SIZE);
  return { page, limit };
}
