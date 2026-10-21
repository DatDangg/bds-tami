/**
 * Helper thuần cho tham số URL của trang danh sách (BL-052): đọc/ghi tham số nhiều giá trị, dựng URL mới khi đổi một ô lọc, đếm số lọc đang bật (badge "Bộ lọc").
 * Không biết gì về Dự án / Cho thuê / Tin BĐS: trang truyền danh sách giá trị hợp lệ và tên tham số. Dùng được cả ở Server lẫn Client Component.
 */

/** Giá trị một tham số như Next đưa vào `searchParams`: thiếu, một chuỗi, hoặc mảng khi khoá lặp (form GET không JS gửi `a=x&a=y`). */
export type RawParamValue = string | string[] | undefined;
export type RawListingParams = Record<string, RawParamValue>;

/** Một thay đổi: chuỗi / mảng = đặt giá trị mới; `null`, `""`, mảng rỗng = bỏ tham số. */
export type ListingParamPatch = Record<string, string | readonly string[] | null>;

/** Tham số không bao giờ giữ lại khi đổi bộ lọc: đổi lọc luôn về trang 1. */
const RESET_ON_CHANGE = ["page"];

/**
 * Đọc tham số nhiều giá trị: nhận cả `a,b` lẫn khoá lặp (`a&a`), cắt khoảng trắng, bỏ giá trị rỗng / trùng.
 * Có `allowed` → bỏ giá trị lạ và xếp theo thứ tự của `allowed` (URL ổn định bất kể thứ tự chọn); không có → giữ thứ tự xuất hiện đầu tiên.
 */
export function parseMultiValue(raw: RawParamValue, allowed?: readonly string[]): string[] {
  if (raw === undefined) return [];
  const parts = (Array.isArray(raw) ? raw : [raw]).flatMap((value) => value.split(",")).map((value) => value.trim());
  const unique = [...new Set(parts.filter((value) => value !== ""))];
  if (!allowed) return unique;
  return allowed.filter((value) => unique.includes(value));
}

/** Ghi tham số nhiều giá trị: `a,b` (rỗng → `""` để `listingHref` bỏ khoá). */
export function serializeMultiValue(values: readonly string[]): string {
  return values.join(",");
}

/** Giá trị đầu tiên của tham số (khoá lặp lấy giá trị đầu), đã cắt khoảng trắng; rỗng → `""`. */
export function firstParam(raw: RawParamValue): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? "";
}

function toParamString(value: RawParamValue | readonly string[] | null): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return serializeMultiValue(parseMultiValue([...value]));
}

/**
 * URL mới của trang danh sách sau khi đổi một / vài tham số: giữ mọi tham số khác (thứ tự khoá như hiện có, khoá mới nối cuối),
 * bỏ `page`, bỏ tham số rỗng; mảng ghi `a,b` (dấu phẩy không mã hoá). `path` đã có tiền tố ngôn ngữ (vd `/en/du-an`). Không còn tham số → chỉ `path`.
 */
export function listingHref(path: string, current: RawListingParams, patch: ListingParamPatch = {}): string {
  const merged: Record<string, RawParamValue | readonly string[] | null> = { ...current, ...patch };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (RESET_ON_CHANGE.includes(key)) continue;
    const text = toParamString(value);
    if (text !== "") query.set(key, text);
  }
  // Dấu phẩy phân cách nhiều giá trị giữ nguyên (`a,b`, không `%2C`) như `projectQueryString`: link chia sẻ dễ đọc, cùng bộ lọc cùng dạng.
  const search = query.toString().replaceAll("%2C", ",");
  return search ? `${path}?${search}` : path;
}

/** Cách đếm của badge "Bộ lọc": `single` = 1 nếu có giá trị; `multi` = số giá trị; `range` = cặp min/max tính là 1 nếu có ít nhất một đầu. */
export interface ActiveFilterSpec {
  single?: readonly string[];
  multi?: readonly string[];
  ranges?: readonly (readonly [string, string])[];
}

/** Số lọc đang bật để hiện trên badge nút "Bộ lọc" (< lg). Chỉ đếm các khoá trang khai trong `spec` (từ khoá / sắp xếp / trang không tính). */
export function countActiveFilters(params: RawListingParams, spec: ActiveFilterSpec): number {
  const has = (key: string) => firstParam(params[key]) !== "";
  const single = (spec.single ?? []).filter(has).length;
  const multi = (spec.multi ?? []).reduce((sum, key) => sum + parseMultiValue(params[key]).length, 0);
  const ranges = (spec.ranges ?? []).filter(([min, max]) => has(min) || has(max)).length;
  return single + multi + ranges;
}
