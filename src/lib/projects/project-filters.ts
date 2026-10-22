import type { SalesStatus } from "../../collections/Projects";
import { PROJECT_FEATURES, PROPERTY_TYPES, type ProjectFeature, type PropertyType } from "../../shared/listing-options";
import type { RawPageParam } from "../content/pagination";

/**
 * Giá trị thô từ `searchParams` của Next cho danh sách dự án
 * (`?category=&province=&status=&q=&developer=&sort=&type=&feature=&priceMin=&priceMax=&page=`; BL-045 + BL-052).
 */
export interface RawProjectParams {
  page?: RawPageParam;
  category?: string | string[];
  /** BL-052: nhiều slug (`a,b` hoặc khoá lặp), OR. Link cũ một slug vẫn chạy. */
  province?: string | string[];
  status?: string | string[];
  /** BL-045: từ khoá, id chủ đầu tư, sắp xếp. */
  q?: string | string[];
  developer?: string | string[];
  sort?: string | string[];
  /** BL-052: loại sản phẩm (`PROPERTY_TYPES`, OR), tiện ích nổi bật (`PROJECT_FEATURES`, AND), khoảng giá đơn vị tỷ đồng. */
  type?: string | string[];
  feature?: string | string[];
  priceMin?: string | string[];
  priceMax?: string | string[];
}

/** Khai đủ khoá để thêm trạng thái mở bán mới ở `Projects.ts` mà quên ở đây là lỗi typecheck. */
const SALES_STATUS_LOOKUP: Record<SalesStatus, true> = { upcoming: true, selling: true, handed_over: true };
export const SALES_STATUS_VALUES = Object.keys(SALES_STATUS_LOOKUP) as SalesStatus[];

const MAX_SLUG_LENGTH = 100;
/** Trần số slug tỉnh nhận từ URL (34 tỉnh/thành; dư để không cắt khi dữ liệu đổi): URL gõ bừa hàng nghìn giá trị không đi xuống truy vấn. */
const MAX_PROVINCE_SLUGS = 50;

/** Thanh trượt giá `/du-an`: 0 – 50+ tỷ, bước 1 tỷ; 0 = không giới hạn dưới, 50 = không giới hạn trên (đầu ở mép không lên URL). */
export const PROJECT_PRICE_MAX_BILLION = 50;

/** Sắp xếp danh sách dự án (BL-045). `newest` là mặc định và không lên URL. */
export const PROJECT_SORT_VALUES = ["newest", "price_asc", "price_desc"] as const;
export type ProjectSortKey = (typeof PROJECT_SORT_VALUES)[number];
export const DEFAULT_PROJECT_SORT: ProjectSortKey = "newest";

export interface ProjectFilters {
  /** Slug danh mục từ `?category=` (slug của ngôn ngữ đang xem). */
  categorySlug?: string;
  /** Slug tỉnh (không trùng, theo thứ tự chữ cái); trang phải đối chiếu với danh sách tỉnh, slug lạ bị bỏ. */
  provinceSlugs?: string[];
  status?: SalesStatus;
  /** Từ khoá đã trim (≤ 100 ký tự). */
  q?: string;
  /** Id chủ đầu tư thô từ `?developer=`; trang phải đối chiếu với danh sách chủ đầu tư công khai trước khi lọc. */
  developerId?: string;
  /** Chỉ có khi khác mặc định (`price_asc` | `price_desc`). */
  sort?: ProjectSortKey;
  /** Loại sản phẩm hợp lệ, theo thứ tự `PROPERTY_TYPES`. */
  types?: PropertyType[];
  /** Tiện ích nổi bật hợp lệ, theo thứ tự `PROJECT_FEATURES`. */
  features?: ProjectFeature[];
  /** Tỷ đồng, số nguyên 1–50 (0 = không giới hạn dưới nên không có). */
  priceMin?: number;
  /** Tỷ đồng, số nguyên 0–49 (≥ 50 = không giới hạn trên nên không có). */
  priceMax?: number;
}

export function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed && trimmed.length <= MAX_SLUG_LENGTH ? trimmed : undefined;
}

/** Mọi giá trị của một tham số nhiều giá trị: tách `a,b` và gộp khoá lặp, bỏ rỗng / quá dài, không trùng. */
function listValues(value: string | string[] | undefined): string[] {
  const parts = (Array.isArray(value) ? value : value === undefined ? [] : [value]).flatMap((item) => item.split(","));
  const cleaned = parts.map((part) => part.trim()).filter((part) => part.length > 0 && part.length <= MAX_SLUG_LENGTH);
  return [...new Set(cleaned)];
}

/** Chỉ giữ giá trị thuộc danh sách cố định, theo thứ tự của danh sách (URL ổn định, không phụ thuộc thứ tự bấm). */
function pickKnown<T extends string>(values: readonly string[], known: readonly T[]): T[] {
  return known.filter((item) => values.includes(item));
}

/** Giá trị lạ hoặc thiếu → `newest`. */
function parseSort(value: string | string[] | undefined): ProjectSortKey {
  const first = firstValue(value);
  return PROJECT_SORT_VALUES.find((key) => key === first) ?? DEFAULT_PROJECT_SORT;
}

/** Số nguyên không âm (chỉ chữ số), kẹp về ≤ 50; khác (số thập phân, âm, chữ) → bỏ. */
function parseBillion(value: string | string[] | undefined): number | undefined {
  const first = firstValue(value);
  if (!first || !/^\d{1,6}$/.test(first)) return undefined;
  return Math.min(Number(first), PROJECT_PRICE_MAX_BILLION);
}

/**
 * Khoảng giá (tỷ) từ URL: kẹp về 0–50, `priceMin > priceMax` thì ĐỔI CHỖ (người dùng sửa tay URL vẫn ra khoảng hợp lý thay vì rỗng),
 * rồi bỏ đầu ở mép (min 0, max 50) vì đó là "không giới hạn". `max = 0` (gõ tay, hoặc kéo đầu trên về 0) cũng coi là không giới hạn trên —
 * lọc "giá ≤ 0" vô nghĩa và ra trang trống (cùng quy tắc `/tin-bds` `post-filters.ts`; BL-055 C-4).
 */
export function parsePriceRange(rawMin: string | string[] | undefined, rawMax: string | string[] | undefined): { priceMin?: number; priceMax?: number } {
  let min = parseBillion(rawMin);
  let max = parseBillion(rawMax) || undefined;
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  return {
    ...(min !== undefined && min > 0 ? { priceMin: min } : {}),
    ...(max !== undefined && max < PROJECT_PRICE_MAX_BILLION ? { priceMax: max } : {}),
  };
}

/**
 * Bộ lọc hợp lệ từ URL: giá trị rỗng, quá dài, trạng thái / loại sản phẩm / tiện ích lạ bị bỏ (URL gõ bừa không làm vỡ trang, không 400/500).
 * Slug tỉnh/danh mục và id chủ đầu tư được tra ở trang/truy vấn, không tin ở đây.
 */
export function parseProjectFilters(raw: RawProjectParams): ProjectFilters {
  const status = firstValue(raw.status);
  const categorySlug = firstValue(raw.category);
  const provinceSlugs = listValues(raw.province).sort().slice(0, MAX_PROVINCE_SLUGS);
  const q = firstValue(raw.q);
  const developerId = firstValue(raw.developer);
  const sort = parseSort(raw.sort);
  const types = pickKnown(listValues(raw.type), PROPERTY_TYPES);
  const features = pickKnown(listValues(raw.feature), PROJECT_FEATURES);
  return {
    ...(categorySlug ? { categorySlug } : {}),
    ...(provinceSlugs.length > 0 ? { provinceSlugs } : {}),
    ...(status && Object.hasOwn(SALES_STATUS_LOOKUP, status) ? { status: status as SalesStatus } : {}),
    ...(q ? { q } : {}),
    ...(developerId ? { developerId } : {}),
    ...(sort !== DEFAULT_PROJECT_SORT ? { sort } : {}),
    ...(types.length > 0 ? { types } : {}),
    ...(features.length > 0 ? { features } : {}),
    ...parsePriceRange(raw.priceMin, raw.priceMax),
  };
}

/**
 * URL có tham số lọc nào có giá trị (kể cả giá trị sai; `?province=` rỗng do form gửi "Tất cả" thì không tính) hoặc `sort` khác mặc định không:
 * trang như vậy là noindex, canonical về trang sạch (design-spec S04). `sort=newest` hay `sort` lạ không tính.
 */
export function hasFilterParams(raw: RawProjectParams): boolean {
  const single = [raw.category, raw.status, raw.q, raw.developer, raw.priceMin, raw.priceMax].some((value) => firstValue(value) !== undefined);
  const multi = [raw.province, raw.type, raw.feature].some((value) => listValues(value).length > 0);
  return single || multi || parseSort(raw.sort) !== DEFAULT_PROJECT_SORT;
}

export interface ProjectQueryParams {
  category?: string;
  /** Một slug (link cũ) hoặc nhiều slug. */
  province?: string | readonly string[];
  status?: string;
  q?: string;
  developer?: string;
  sort?: string;
  type?: readonly string[];
  feature?: readonly string[];
  /** Tỷ đồng; 0 (min) và ≥ 50 (max) là mép, không lên URL. */
  priceMin?: number;
  priceMax?: number;
  page?: number;
}

/** Nối nhiều giá trị bằng dấu phẩy, không trùng; `order` cho thứ tự cố định (danh sách cố định), không có thì theo chữ cái. */
function joinValues(values: string | readonly string[] | undefined, order?: readonly string[]): string {
  const unique = [...new Set(typeof values === "string" ? [values] : (values ?? []))].filter(Boolean);
  const sorted = order ? order.filter((item) => unique.includes(item)) : unique.sort();
  return sorted.join(",");
}

/**
 * Chuỗi truy vấn theo thứ tự cố định (`category`, `province`, `status`, `q`, `developer`, `sort`, `type`, `feature`, `priceMin`, `priceMax`, `page`) và
 * giá trị nhiều phần tử theo thứ tự cố định (tỉnh theo chữ cái, loại / tiện ích theo danh sách) → cùng bộ lọc luôn cùng URL. Trang 1, `sort=newest`,
 * giá ở mép không lên URL. Dấu phẩy phân cách giữ nguyên (không `%2C`). Rỗng thì trả `""`.
 */
export function projectQueryString(params: ProjectQueryParams): string {
  const search = new URLSearchParams();
  const set = (key: string, value: string | undefined) => {
    if (value) search.set(key, value);
  };
  set("category", params.category);
  set("province", joinValues(params.province));
  set("status", params.status);
  set("q", params.q);
  set("developer", params.developer);
  if (params.sort && params.sort !== DEFAULT_PROJECT_SORT) search.set("sort", params.sort);
  set("type", joinValues(params.type, PROPERTY_TYPES));
  set("feature", joinValues(params.feature, PROJECT_FEATURES));
  if (params.priceMin !== undefined && params.priceMin > 0) search.set("priceMin", String(params.priceMin));
  if (params.priceMax !== undefined && params.priceMax < PROJECT_PRICE_MAX_BILLION) search.set("priceMax", String(params.priceMax));
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}
