import type { RawPageParam } from "../content/pagination";
import { firstValue } from "../projects/project-filters";

/** Giá trị thô từ `searchParams` của Next cho danh sách tuyển dụng (design-spec S12: chip danh mục + tỉnh làm việc, `?category=&province=&page=`). */
export interface RawJobParams {
  page?: RawPageParam;
  category?: string | string[];
  province?: string | string[];
}

export interface JobFilters {
  /** Slug danh mục `job` từ `?category=` (slug của ngôn ngữ đang xem). */
  categorySlug?: string;
  provinceSlug?: string;
}

/** Bộ lọc hợp lệ từ URL: giá trị rỗng/quá dài bị bỏ; slug được tra ở truy vấn, không tin ở đây. */
export function parseJobFilters(raw: RawJobParams): JobFilters {
  const categorySlug = firstValue(raw.category);
  const provinceSlug = firstValue(raw.province);
  return { ...(categorySlug ? { categorySlug } : {}), ...(provinceSlug ? { provinceSlug } : {}) };
}

/** URL có tham số lọc nào có giá trị không: trang đó `noindex, follow` + canonical về `/tuyen-dung` sạch (như `/du-an`). */
export function hasJobFilterParams(raw: RawJobParams): boolean {
  return [raw.category, raw.province].some((value) => firstValue(value) !== undefined);
}

/** Chuỗi truy vấn theo thứ tự cố định (`category`, `province`, `page`); trang 1 không kèm `page`. Rỗng thì trả `""`. */
export function jobQueryString(params: { category?: string; province?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.province) search.set("province", params.province);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `?${query}` : "";
}
