import type { SalesStatus } from "../../collections/Projects";
import type { RawPageParam } from "../content/pagination";

/** Giá trị thô từ `searchParams` của Next cho danh sách dự án (design-spec S02: `?category=&province=&status=&q=&developer=&sort=&page=`). */
export interface RawProjectParams {
  page?: RawPageParam;
  category?: string | string[];
  province?: string | string[];
  status?: string | string[];
  /** BL-045: từ khoá, id chủ đầu tư, sắp xếp. */
  q?: string | string[];
  developer?: string | string[];
  sort?: string | string[];
}

/** Khai đủ khoá để thêm trạng thái mở bán mới ở `Projects.ts` mà quên ở đây là lỗi typecheck. */
const SALES_STATUS_LOOKUP: Record<SalesStatus, true> = { upcoming: true, selling: true, handed_over: true };
export const SALES_STATUS_VALUES = Object.keys(SALES_STATUS_LOOKUP) as SalesStatus[];

const MAX_SLUG_LENGTH = 100;

/** Sắp xếp danh sách dự án (BL-045). `newest` là mặc định và không lên URL. */
export const PROJECT_SORT_VALUES = ["newest", "price_asc", "price_desc"] as const;
export type ProjectSortKey = (typeof PROJECT_SORT_VALUES)[number];
export const DEFAULT_PROJECT_SORT: ProjectSortKey = "newest";

export interface ProjectFilters {
  /** Slug danh mục từ `?category=` (slug của ngôn ngữ đang xem). */
  categorySlug?: string;
  provinceSlug?: string;
  status?: SalesStatus;
  /** Từ khoá đã trim (≤ 100 ký tự). */
  q?: string;
  /** Id chủ đầu tư thô từ `?developer=`; trang phải đối chiếu với danh sách chủ đầu tư công khai trước khi lọc. */
  developerId?: string;
  /** Chỉ có khi khác mặc định (`price_asc` | `price_desc`). */
  sort?: ProjectSortKey;
}

export function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed && trimmed.length <= MAX_SLUG_LENGTH ? trimmed : undefined;
}

/** Giá trị lạ hoặc thiếu → `newest`. */
function parseSort(value: string | string[] | undefined): ProjectSortKey {
  const first = firstValue(value);
  return PROJECT_SORT_VALUES.find((key) => key === first) ?? DEFAULT_PROJECT_SORT;
}

/**
 * Bộ lọc hợp lệ từ URL: giá trị rỗng, quá dài hoặc trạng thái lạ bị bỏ (URL gõ bừa không làm vỡ trang, chỉ hiện danh sách không lọc).
 * Slug tỉnh/danh mục và id chủ đầu tư được tra ở trang/truy vấn, không tin ở đây.
 */
export function parseProjectFilters(raw: RawProjectParams): ProjectFilters {
  const status = firstValue(raw.status);
  const categorySlug = firstValue(raw.category);
  const provinceSlug = firstValue(raw.province);
  const q = firstValue(raw.q);
  const developerId = firstValue(raw.developer);
  const sort = parseSort(raw.sort);
  return {
    ...(categorySlug ? { categorySlug } : {}),
    ...(provinceSlug ? { provinceSlug } : {}),
    ...(status && Object.hasOwn(SALES_STATUS_LOOKUP, status) ? { status: status as SalesStatus } : {}),
    ...(q ? { q } : {}),
    ...(developerId ? { developerId } : {}),
    ...(sort !== DEFAULT_PROJECT_SORT ? { sort } : {}),
  };
}

/**
 * URL có tham số lọc nào có giá trị (kể cả giá trị sai; `?province=` rỗng do form gửi "Tất cả" thì không tính) hoặc `sort` khác mặc định không:
 * trang như vậy là noindex, canonical về trang sạch (design-spec S04). `sort=newest` hay `sort` lạ không tính.
 */
export function hasFilterParams(raw: RawProjectParams): boolean {
  const hasValue = [raw.category, raw.province, raw.status, raw.q, raw.developer].some((value) => firstValue(value) !== undefined);
  return hasValue || parseSort(raw.sort) !== DEFAULT_PROJECT_SORT;
}

/** Chuỗi truy vấn theo thứ tự cố định (`category`, `province`, `status`, `q`, `developer`, `sort`, `page`); trang 1 và `sort=newest` không lên URL. Rỗng thì trả `""`. */
export function projectQueryString(params: {
  category?: string;
  province?: string;
  status?: string;
  q?: string;
  developer?: string;
  sort?: string;
  page?: number;
}): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.province) search.set("province", params.province);
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.developer) search.set("developer", params.developer);
  if (params.sort && params.sort !== DEFAULT_PROJECT_SORT) search.set("sort", params.sort);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `?${query}` : "";
}
