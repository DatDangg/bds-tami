import {
  type RentalAmenity,
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
  /** Tiện ích phải có đủ (AND); thứ tự theo `RENTAL_AMENITIES`. */
  amenities?: RentalAmenity[];
  sort: RentalSort;
  page: number;
}

/** `searchParams` của Next / `Object.fromEntries(URLSearchParams)`. */
export type RawRentalParams = Record<string, string | string[] | undefined>;

/** Thứ tự khoá khi dựng query string (cố định để URL ổn định, dễ cache/so sánh). */
const QUERY_KEYS = ["q", "category", "province", "ward", "priceMin", "priceMax", "areaMin", "areaMax", "bedrooms", "furnishing", "amenities", "sort", "page"] as const;
type QueryKey = (typeof QUERY_KEYS)[number];

const DEFAULT_SORT: RentalSort = "newest";

/**
 * Giá trị của một khoá đã qua đúng schema của API: sai kiểu/ngoài khoảng/rỗng -> `undefined` (bị bỏ, không làm vỡ trang).
 * Khoá lặp lấy giá trị đầu, trừ `amenities` nhận cả mảng (form không JS gửi `amenities=a&amenities=b`; schema gộp với dạng `a,b`).
 */
function readParam(raw: RawRentalParams, key: QueryKey): unknown {
  const value = key === "amenities" || !Array.isArray(raw[key]) ? raw[key] : raw[key][0];
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
    amenities: read("amenities") as RentalFilters["amenities"],
  };
  const present = Object.entries(optionals).filter(([, value]) => value !== undefined && value !== "");
  return {
    ...(Object.fromEntries(present) as Partial<RentalFilters>),
    sort: (read("sort") as RentalSort | undefined) ?? DEFAULT_SORT,
    page: (read("page") as number | undefined) ?? 1,
  };
}

/** Query string (`?q=...&province=...`) theo thứ tự cố định; giá trị mặc định (sort `newest`, trang 1), ô trống và mảng rỗng không xuất hiện; `amenities` ghi `a,b`; không có gì thì `""`. */
export function rentalListQueryString(filters: RentalFilters, override: Partial<RentalFilters> = {}): string {
  const merged = { ...filters, ...override };
  const search = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = merged[key];
    if (value === undefined || value === "") continue;
    if (key === "sort" && value === DEFAULT_SORT) continue;
    if (key === "page" && value === 1) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Mỗi tiện ích đếm 1 để huy hiệu khớp số chip "Đang lọc" (mỗi tiện ích một chip bỏ riêng). */
const amenityCount = (filters: RentalFilters): number => filters.amenities?.length ?? 0;

/** Số điều kiện lọc đang bật (nút "Bộ lọc (n)"): khoảng giá/diện tích tính một, mỗi tiện ích tính một, sắp xếp và trang không tính. */
export function activeFilterCount(filters: RentalFilters): number {
  const priced = filters.priceMin !== undefined || filters.priceMax !== undefined;
  const sized = filters.areaMin !== undefined || filters.areaMax !== undefined;
  const singles = [filters.q, filters.category, filters.province, filters.ward, filters.bedrooms, filters.furnishing];
  return singles.filter((value) => value !== undefined).length + (priced ? 1 : 0) + (sized ? 1 : 0) + amenityCount(filters);
}

/** Mốc giá gợi ý (VNĐ/tháng) của ô "Khoảng giá" trên băng tìm kiếm: < 5tr, 5-10tr, 10-20tr, > 20tr. */
export const PRICE_HINT_RANGES = [
  { key: "under5", min: undefined, max: 5_000_000 },
  { key: "from5to10", min: 5_000_000, max: 10_000_000 },
  { key: "from10to20", min: 10_000_000, max: 20_000_000 },
  { key: "over20", min: 20_000_000, max: undefined },
] as const;

/**
 * Mốc diện tích (m²) của ô "Diện tích" (BL-044 ô tìm kiếm trang chủ, BL-045 thẻ lọc Cho thuê): chọn mốc → cặp `areaMin`/`areaMax`. Một hằng cho cả hai nơi
 * (`HeroSearch` re-export tên cũ).
 */
export const AREA_HINT_RANGES = [
  { key: "under30", min: undefined, max: 30 },
  { key: "from30to50", min: 30, max: 50 },
  { key: "from50to80", min: 50, max: 80 },
  { key: "from80to120", min: 80, max: 120 },
  { key: "over120", min: 120, max: undefined },
] as const;

/** Khoảng giá tự nhập: có min/max nhưng cặp đó không trùng mốc nào (ô giá trong thẻ lọc chỉ hiện "Khoảng giá tuỳ chọn"; trường tự nhập nằm trong Sheet/Popover). */
function hasCustomPriceRange(filters: RentalFilters): boolean {
  if (filters.priceMin === undefined && filters.priceMax === undefined) return false;
  return !PRICE_HINT_RANGES.some((hint) => hint.min === filters.priceMin && hint.max === filters.priceMax);
}

/** Khoảng diện tích tự nhập: như `hasCustomPriceRange`, đối chiếu với `AREA_HINT_RANGES`. */
function hasCustomAreaRange(filters: RentalFilters): boolean {
  if (filters.areaMin === undefined && filters.areaMax === undefined) return false;
  return !AREA_HINT_RANGES.some((hint) => hint.min === filters.areaMin && hint.max === filters.areaMax);
}

/**
 * Số lọc đang bật TRONG Popover/Sheet "Bộ lọc" (huy hiệu trên nút; BL-045): Phường + Khoảng giá TỰ NHẬP + Khoảng diện tích TỰ NHẬP (mỗi loại một). Tỉnh, mốc giá, mốc diện tích,
 * phòng ngủ, nội thất, tiện ích là ô trên thẻ lọc nên không tính; từ khoá, danh mục cũng không.
 */
export function secondaryFilterCount(filters: RentalFilters): number {
  return (filters.ward !== undefined ? 1 : 0) + (hasCustomPriceRange(filters) ? 1 : 0) + (hasCustomAreaRange(filters) ? 1 : 0);
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
