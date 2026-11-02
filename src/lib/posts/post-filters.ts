import { DIRECTIONS, HANDOVER_CONDITIONS, PROPERTY_TYPES, type Direction, type HandoverCondition, type PropertyType } from "../../shared/listing-options";
import type { RawPageParam } from "../content/pagination";

/**
 * Tham số URL của danh sách Tin BĐS `/tin-bds` (+ trang danh mục) — BL-052:
 * `?q=&type=&province=&priceMin=&priceMax=&areaMin=&areaMax=&bedrooms=&bathrooms=&direction=&handover=&sort=&page=`.
 * Danh mục đi theo route (`/tin-bds/danh-muc/[category]`), không phải tham số.
 */
export interface RawPostParams {
  page?: RawPageParam;
  q?: string | string[];
  type?: string | string[];
  province?: string | string[];
  priceMin?: string | string[];
  priceMax?: string | string[];
  areaMin?: string | string[];
  areaMax?: string | string[];
  bedrooms?: string | string[];
  bathrooms?: string | string[];
  direction?: string | string[];
  handover?: string | string[];
  sort?: string | string[];
}

const MAX_VALUE_LENGTH = 100;
/** Trần số slug tỉnh nhận từ URL (34 tỉnh/thành; dư để không cắt khi dữ liệu đổi), như `/du-an`. */
const MAX_PROVINCE_SLUGS = 50;

/** Thanh trượt giá: 0 – 50+ tỷ, bước 1 tỷ; 0 = không giới hạn dưới, 50 = không giới hạn trên (đầu ở mép không lên URL). */
export const POST_PRICE_MAX_BILLION = 50;
/** Thanh trượt diện tích: 0 – 500+ m², bước 10; 500 = không giới hạn trên. */
export const POST_AREA_MAX_M2 = 500;
/** Chip "Phòng ngủ": 1, 2, 3, 4+ (4 = từ 4 phòng trở lên). */
export const POST_BEDROOM_VALUES = [1, 2, 3, 4] as const;
export type PostBedrooms = (typeof POST_BEDROOM_VALUES)[number];
/** BL-104: chip "Phòng tắm" cùng giá trị với phòng ngủ (4 = từ 4 phòng tắm trở lên). */
export const POST_BATHROOM_VALUES = POST_BEDROOM_VALUES;
export type PostBathrooms = PostBedrooms;

/** `newest` là mặc định và không lên URL. */
export const POST_SORT_VALUES = ["newest", "price_asc", "price_desc"] as const;
export type PostSortKey = (typeof POST_SORT_VALUES)[number];
export const DEFAULT_POST_SORT: PostSortKey = "newest";

export interface PostFilters {
  /** Từ khoá đã trim (≤ 100 ký tự). */
  q?: string;
  /** Loại hình hợp lệ, theo thứ tự `PROPERTY_TYPES` (OR). */
  types?: PropertyType[];
  /** Slug tỉnh (không trùng, theo chữ cái, OR); trang / truy vấn đối chiếu với danh sách tỉnh, slug lạ bị bỏ. */
  provinceSlugs?: string[];
  /** Tỷ đồng, số nguyên 1–50 (0 = không giới hạn dưới nên không có). */
  priceMin?: number;
  /** Tỷ đồng, số nguyên 0–49 (≥ 50 = không giới hạn trên nên không có). */
  priceMax?: number;
  /** m², số nguyên 1–500. */
  areaMin?: number;
  /** m², số nguyên 0–499. */
  areaMax?: number;
  /** 1–3 = đúng số phòng; 4 = từ 4 phòng trở lên. */
  bedrooms?: PostBedrooms;
  /** 1–3 = đúng số phòng tắm; 4 = từ 4 phòng tắm trở lên. */
  bathrooms?: PostBathrooms;
  /** Hướng nhà hợp lệ, theo thứ tự `DIRECTIONS` (OR). */
  directions?: Direction[];
  /** Tình trạng bàn giao hợp lệ, theo thứ tự `HANDOVER_CONDITIONS` (OR). */
  handovers?: HandoverCondition[];
  /** Chỉ có khi khác mặc định. */
  sort?: PostSortKey;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed && trimmed.length <= MAX_VALUE_LENGTH ? trimmed : undefined;
}

/** Mọi giá trị của tham số nhiều giá trị: tách `a,b` và gộp khoá lặp, bỏ rỗng / quá dài, không trùng. */
function listValues(value: string | string[] | undefined): string[] {
  const parts = (Array.isArray(value) ? value : value === undefined ? [] : [value]).flatMap((item) => item.split(","));
  return [...new Set(parts.map((part) => part.trim()).filter((part) => part.length > 0 && part.length <= MAX_VALUE_LENGTH))];
}

/** Chỉ giữ giá trị thuộc danh sách cố định, theo thứ tự của danh sách (URL ổn định, không phụ thuộc thứ tự bấm). */
function pickKnown<T extends string>(values: readonly string[], known: readonly T[]): T[] {
  return known.filter((item) => values.includes(item));
}

function parseSort(value: string | string[] | undefined): PostSortKey {
  const first = firstValue(value);
  return POST_SORT_VALUES.find((key) => key === first) ?? DEFAULT_POST_SORT;
}

/** Số nguyên không âm (chỉ chữ số), kẹp về ≤ `cap`; khác (thập phân, âm, chữ) → bỏ. */
function parseBounded(value: string | string[] | undefined, cap: number): number | undefined {
  const first = firstValue(value);
  if (!first || !/^\d{1,6}$/.test(first)) return undefined;
  return Math.min(Number(first), cap);
}

/**
 * Khoảng của một thanh trượt (cùng quy tắc giá `/du-an`): kẹp về 0–`cap`, `min > max` thì ĐỔI CHỖ (URL sửa tay vẫn ra khoảng hợp lý),
 * rồi bỏ đầu ở mép (min 0, max `cap`) vì đó là "không giới hạn". `max = 0` (gõ tay, hoặc kéo đầu trên về 0) cũng coi là không giới hạn trên —
 * lọc "giá / diện tích ≤ 0" vô nghĩa và ra trang trống (P3-T02 review r1).
 */
function parseRange(rawMin: string | string[] | undefined, rawMax: string | string[] | undefined, cap: number): { min?: number; max?: number } {
  let min = parseBounded(rawMin, cap);
  let max = parseBounded(rawMax, cap) || undefined;
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min];
  return { ...(min !== undefined && min > 0 ? { min } : {}), ...(max !== undefined && max < cap ? { max } : {}) };
}

/** Số phòng 1–4 (dùng cho phòng ngủ và phòng tắm); khác → bỏ. */
function parseRoomCount(value: string | string[] | undefined): PostBedrooms | undefined {
  const first = firstValue(value);
  return POST_BEDROOM_VALUES.find((count) => String(count) === first);
}

/**
 * Bộ lọc hợp lệ từ URL: giá trị rỗng, quá dài, ngoài danh sách cố định, số sai bị bỏ (URL gõ bừa không làm vỡ trang, không 400/500).
 * Slug tỉnh được đối chiếu ở truy vấn (`loadPostListing`), không tin ở đây.
 */
export function parsePostFilters(raw: RawPostParams): PostFilters {
  const q = firstValue(raw.q);
  const types = pickKnown(listValues(raw.type), PROPERTY_TYPES);
  const provinceSlugs = listValues(raw.province).sort().slice(0, MAX_PROVINCE_SLUGS);
  const price = parseRange(raw.priceMin, raw.priceMax, POST_PRICE_MAX_BILLION);
  const area = parseRange(raw.areaMin, raw.areaMax, POST_AREA_MAX_M2);
  const bedrooms = parseRoomCount(raw.bedrooms);
  const bathrooms = parseRoomCount(raw.bathrooms);
  const directions = pickKnown(listValues(raw.direction), DIRECTIONS);
  const handovers = pickKnown(listValues(raw.handover), HANDOVER_CONDITIONS);
  const sort = parseSort(raw.sort);
  return {
    ...(q ? { q } : {}),
    ...(types.length > 0 ? { types } : {}),
    ...(provinceSlugs.length > 0 ? { provinceSlugs } : {}),
    ...(price.min !== undefined ? { priceMin: price.min } : {}),
    ...(price.max !== undefined ? { priceMax: price.max } : {}),
    ...(area.min !== undefined ? { areaMin: area.min } : {}),
    ...(area.max !== undefined ? { areaMax: area.max } : {}),
    ...(bedrooms !== undefined ? { bedrooms } : {}),
    ...(bathrooms !== undefined ? { bathrooms } : {}),
    ...(directions.length > 0 ? { directions } : {}),
    ...(handovers.length > 0 ? { handovers } : {}),
    ...(sort !== DEFAULT_POST_SORT ? { sort } : {}),
  };
}

/**
 * URL có tham số lọc / `q` nào có giá trị (kể cả giá trị sai; tham số rỗng do form gửi "Tất cả" thì không tính) hoặc `sort` khác mặc định không:
 * trang như vậy là `noindex, follow`, canonical về trang sạch. `sort=newest` hay `sort` lạ không tính; `page` không tính.
 */
export function hasPostFilterParams(raw: RawPostParams): boolean {
  const single = [raw.q, raw.priceMin, raw.priceMax, raw.areaMin, raw.areaMax, raw.bedrooms, raw.bathrooms].some((value) => firstValue(value) !== undefined);
  const multi = [raw.type, raw.province, raw.direction, raw.handover].some((value) => listValues(value).length > 0);
  return single || multi || parseSort(raw.sort) !== DEFAULT_POST_SORT;
}

/**
 * Chuỗi truy vấn theo thứ tự cố định (`q`, `type`, `province`, `priceMin`, `priceMax`, `areaMin`, `areaMax`, `bedrooms`, `bathrooms`, `direction`, `handover`, `sort`, `page`)
 * → cùng bộ lọc luôn cùng URL. Trang 1, `sort=newest`, đầu thanh trượt ở mép không lên URL; dấu phẩy phân cách giữ nguyên (không `%2C`). Rỗng → `""`.
 */
export function postQueryString(filters: PostFilters, page = 1): string {
  const search = new URLSearchParams();
  const set = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  };
  set("q", filters.q);
  set("type", PROPERTY_TYPES.filter((type) => filters.types?.includes(type)).join(","));
  set("province", [...new Set(filters.provinceSlugs ?? [])].sort().join(","));
  if (filters.priceMin !== undefined && filters.priceMin > 0) set("priceMin", filters.priceMin);
  if (filters.priceMax !== undefined && filters.priceMax < POST_PRICE_MAX_BILLION) set("priceMax", filters.priceMax);
  if (filters.areaMin !== undefined && filters.areaMin > 0) set("areaMin", filters.areaMin);
  if (filters.areaMax !== undefined && filters.areaMax < POST_AREA_MAX_M2) set("areaMax", filters.areaMax);
  set("bedrooms", filters.bedrooms);
  set("bathrooms", filters.bathrooms);
  set("direction", DIRECTIONS.filter((direction) => filters.directions?.includes(direction)).join(","));
  set("handover", HANDOVER_CONDITIONS.filter((handover) => filters.handovers?.includes(handover)).join(","));
  if (filters.sort && filters.sort !== DEFAULT_POST_SORT) set("sort", filters.sort);
  if (page > 1) set("page", page);
  const query = search.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}
