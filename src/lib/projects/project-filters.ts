import type { SalesStatus } from "../../collections/Projects";
import type { RawPageParam } from "../content/pagination";

/** Giá trị thô từ `searchParams` của Next cho danh sách dự án (design-spec S02: `?category=&province=&status=&page=`). */
export interface RawProjectParams {
  page?: RawPageParam;
  category?: string | string[];
  province?: string | string[];
  status?: string | string[];
}

/** Khai đủ khoá để thêm trạng thái mở bán mới ở `Projects.ts` mà quên ở đây là lỗi typecheck. */
const SALES_STATUS_LOOKUP: Record<SalesStatus, true> = { upcoming: true, selling: true, handed_over: true };
export const SALES_STATUS_VALUES = Object.keys(SALES_STATUS_LOOKUP) as SalesStatus[];

const MAX_SLUG_LENGTH = 100;

export interface ProjectFilters {
  /** Slug danh mục từ `?category=` (slug của ngôn ngữ đang xem). */
  categorySlug?: string;
  provinceSlug?: string;
  status?: SalesStatus;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed && trimmed.length <= MAX_SLUG_LENGTH ? trimmed : undefined;
}

/**
 * Bộ lọc hợp lệ từ URL: giá trị rỗng, quá dài hoặc trạng thái lạ bị bỏ (URL gõ bừa không làm vỡ trang, chỉ hiện danh sách không lọc).
 * Slug tỉnh/danh mục được tra ở truy vấn, không tin ở đây.
 */
export function parseProjectFilters(raw: RawProjectParams): ProjectFilters {
  const status = firstValue(raw.status);
  const categorySlug = firstValue(raw.category);
  const provinceSlug = firstValue(raw.province);
  return {
    ...(categorySlug ? { categorySlug } : {}),
    ...(provinceSlug ? { provinceSlug } : {}),
    ...(status && Object.hasOwn(SALES_STATUS_LOOKUP, status) ? { status: status as SalesStatus } : {}),
  };
}

/** URL có tham số lọc nào có giá trị (kể cả giá trị sai; `?province=` rỗng do form gửi "Tất cả" thì không tính) không: trang như vậy là noindex, canonical về trang sạch (design-spec S04). */
export function hasFilterParams(raw: RawProjectParams): boolean {
  return [raw.category, raw.province, raw.status].some((value) => firstValue(value) !== undefined);
}

/** Chuỗi truy vấn theo thứ tự cố định (`category`, `province`, `status`, `page`); trang 1 không kèm `page`. Rỗng thì trả `""`. */
export function projectQueryString(params: { category?: string; province?: string; status?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.province) search.set("province", params.province);
  if (params.status) search.set("status", params.status);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `?${query}` : "";
}
