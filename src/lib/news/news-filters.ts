import type { Locale } from "../../i18n/routing";
import { searchTerms } from "../search/rental-search-sql";

/**
 * Tham số URL của `/tin-tuc` và trang danh mục tin (BL-054): `?q=&tag=&sort=&page=`. Thuần (dùng được ở Server lẫn test),
 * giá trị lạ bị bỏ — URL gõ bừa không làm vỡ trang.
 */
export interface RawNewsParams {
  q?: string | string[];
  tag?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}

export const NEWS_SORT_VALUES = ["newest", "oldest"] as const;
export type NewsSortKey = (typeof NEWS_SORT_VALUES)[number];
export const DEFAULT_NEWS_SORT: NewsSortKey = "newest";

/** Cùng trần độ dài ô tìm của `ListingHero` (`maxLength=100`); giá trị dài hơn coi như không có. */
const MAX_VALUE_LENGTH = 100;

export interface NewsFilters {
  /** Từ khoá đã cắt khoảng trắng; chỉ có khi còn ít nhất một từ sau chuẩn hoá (`searchTerms`). */
  q?: string;
  /** Một thẻ, khớp đúng chuỗi. Không bao giờ có ở `/en` (tags chưa có bản EN — spec BL-054, BR-07). */
  tag?: string;
  sort: NewsSortKey;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  const trimmed = first?.trim();
  return trimmed && trimmed.length <= MAX_VALUE_LENGTH ? trimmed : undefined;
}

export function parseNewsFilters(raw: RawNewsParams, locale: Locale): NewsFilters {
  const q = firstValue(raw.q);
  const tag = locale === "en" ? undefined : firstValue(raw.tag);
  const sort = NEWS_SORT_VALUES.find((value) => value === firstValue(raw.sort)) ?? DEFAULT_NEWS_SORT;
  return { ...(q && searchTerms(q).length > 0 ? { q } : {}), ...(tag ? { tag } : {}), sort };
}

/** Danh sách đang lọc / tìm / sắp khác mặc định: ẩn khối nổi bật, hiện "N bài viết", và metadata `noindex, follow` + canonical sạch. */
export function isFilteredNews(filters: NewsFilters): boolean {
  return filters.q !== undefined || filters.tag !== undefined || filters.sort !== DEFAULT_NEWS_SORT;
}

/** Chuỗi truy vấn thứ tự cố định `q`, `tag`, `sort`, `page`; mặc định (`sort=newest`, trang 1) không lên URL. Rỗng → `""`. */
export function newsQueryString(filters: NewsFilters, page = 1): string {
  const search = new URLSearchParams();
  if (filters.q) search.set("q", filters.q);
  if (filters.tag) search.set("tag", filters.tag);
  if (filters.sort !== DEFAULT_NEWS_SORT) search.set("sort", filters.sort);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Tham số đang có hiệu lực dạng phẳng (giữ khi gửi ô tìm / đổi sắp xếp). */
export function newsCurrentParams(filters: NewsFilters): Record<string, string> {
  return {
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.tag ? { tag: filters.tag } : {}),
    ...(filters.sort !== DEFAULT_NEWS_SORT ? { sort: filters.sort } : {}),
  };
}
