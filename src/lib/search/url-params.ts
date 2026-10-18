import {
  type RentalSearchParams,
  type RentalSort,
  rentalSearchParamsSchema,
} from "../../shared/types/api";

/**
 * Tham số URL của trang `/cho-thue` (design-spec §3.5, nguồn sự thật là URL). Tên khoá TRÙNG `GET /api/public/rentals` (API_SPEC §3.3)
 * để link chia sẻ dùng được ở cả hai nơi; `locale`/`limit` không nằm trên URL trang. Module thuần: server (trang) và client
 * (bộ lọc) cùng dùng nên một URL luôn được hiểu giống nhau.
 */
export const RENTAL_LIST_PAGE_SIZE = 12;

export interface RentalFilters {
  q?: string;
  category?: string;
  province?: string;
  ward?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedrooms?: number;
  furnishing?: NonNullable<RentalSearchParams["furnishing"]>;
  sort: RentalSort;
  page: number;
}

/** `searchParams` của Next / `Object.fromEntries(URLSearchParams)`. */
export type RawRentalParams = Record<string, string | string[] | undefined>;

/** Thứ tự khoá khi dựng query string (cố định để URL ổn định, dễ cache/so sánh). */
const QUERY_KEYS = ["q", "category", "province", "ward", "priceMin", "priceMax", "areaMin", "areaMax", "bedrooms", "furnishing", "sort", "page"] as const;
type QueryKey = (typeof QUERY_KEYS)[number];

const DEFAULT_SORT: RentalSort = "newest";

/** Giá trị của một khoá đã qua đúng schema của API: sai kiểu/ngoài khoảng/rỗng -> `undefined` (bị bỏ, không làm vỡ trang). */
function readParam(raw: RawRentalParams, key: QueryKey): unknown {
  const value = Array.isArray(raw[key]) ? raw[key][0] : raw[key];
  if (value === undefined) return undefined;
  const parsed = rentalSearchParamsSchema.shape[key].safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

const orderedPair = (low: number | undefined, high: number | undefined): [number | undefined, number | undefined] =>
  low !== undefined && high !== undefined && low > high ? [high, low] : [low, high];

/**
 * Bộ lọc hợp lệ từ URL. Mỗi tham số được kiểm RIÊNG bằng schema của API: tham số lạ hoặc giá trị sai bị bỏ qua (khác API trả 400, trang
 * công khai không được 400 vì một link cũ). Hai luật chéo: phường chỉ có nghĩa khi kèm tỉnh (slug phường chỉ duy nhất trong tỉnh,
 * API_SPEC §3.3); khoảng min > max được đảo lại. Slug danh mục/tỉnh/phường có tồn tại không do nơi gọi đối chiếu với dữ liệu.
 */
export function parseRentalFilters(raw: RawRentalParams): RentalFilters {
  const read = (key: QueryKey) => readParam(raw, key);
  const province = read("province") as string | undefined;
  const ward = province ? (read("ward") as string | undefined) : undefined;
  const [priceMin, priceMax] = orderedPair(read("priceMin") as number | undefined, read("priceMax") as number | undefined);
  const [areaMin, areaMax] = orderedPair(read("areaMin") as number | undefined, read("areaMax") as number | undefined);
  const optionals: Partial<RentalFilters> = {
    q: read("q") as string | undefined,
    category: read("category") as string | undefined,
    province,
    ward,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    bedrooms: read("bedrooms") as number | undefined,
    furnishing: read("furnishing") as RentalFilters["furnishing"],
  };
  const present = Object.entries(optionals).filter(([, value]) => value !== undefined && value !== "");
  return {
    ...(Object.fromEntries(present) as Partial<RentalFilters>),
    sort: (read("sort") as RentalSort | undefined) ?? DEFAULT_SORT,
    page: (read("page") as number | undefined) ?? 1,
  };
}

/** Query string (`?q=...&province=...`) theo thứ tự cố định; giá trị mặc định (sort `newest`, trang 1) và ô trống không xuất hiện; không có gì thì `""`. */
export function rentalListQueryString(filters: RentalFilters, override: Partial<RentalFilters> = {}): string {
  const merged = { ...filters, ...override };
  const search = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = merged[key];
    if (value === undefined || value === "") continue;
    if (key === "sort" && value === DEFAULT_SORT) continue;
    if (key === "page" && value === 1) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Số điều kiện lọc đang bật (nút "Bộ lọc (n)"): khoảng giá/diện tích tính một, sắp xếp và trang không tính. */
export function activeFilterCount(filters: RentalFilters): number {
  const priced = filters.priceMin !== undefined || filters.priceMax !== undefined;
  const sized = filters.areaMin !== undefined || filters.areaMax !== undefined;
  const singles = [filters.q, filters.category, filters.province, filters.ward, filters.bedrooms, filters.furnishing];
  return singles.filter((value) => value !== undefined).length + (priced ? 1 : 0) + (sized ? 1 : 0);
}

/**
 * Trang này có nên `noindex, follow` không (design-spec S04, tránh trùng lặp): trang gốc, trang chỉ lọc MỘT danh mục hoặc MỘT tỉnh
 * (kèm `page`) vẫn index; mọi tổ hợp sâu hơn (từ khoá, phường, giá, diện tích, phòng ngủ, nội thất, danh mục + tỉnh) hoặc đổi sắp xếp thì không.
 */
export function hasNarrowingParams(filters: RentalFilters): boolean {
  if (filters.sort !== DEFAULT_SORT) return true;
  const { category, province, ...rest } = filters;
  if (category !== undefined && province !== undefined) return true;
  return activeFilterCount({ ...rest, sort: DEFAULT_SORT, page: 1 }) > 0;
}

/** Tham số cho `SearchService` (cùng kiểu với API): thêm ngôn ngữ đang xem, cỡ trang cố định 12 và chỉ tin còn trống (`available`, S04). */
export function toRentalSearchParams(filters: RentalFilters, locale: "vi" | "en"): RentalSearchParams {
  return rentalSearchParamsSchema.parse({ ...filters, locale, limit: RENTAL_LIST_PAGE_SIZE, available: true });
}

/** Đường dẫn `GET /api/public/rentals` chỉ để ĐẾM kết quả của bộ lọc (nút "Xem n tin" của Sheet): cùng bộ lọc, `limit=1`, tin còn trống. */
export function rentalCountApiPath(filters: RentalFilters, locale: "vi" | "en"): string {
  const search = new URLSearchParams(rentalListQueryString({ ...filters, sort: DEFAULT_SORT, page: 1 }).slice(1));
  search.set("locale", locale);
  search.set("limit", "1");
  search.set("available", "true");
  return `/api/public/rentals?${search.toString()}`;
}
