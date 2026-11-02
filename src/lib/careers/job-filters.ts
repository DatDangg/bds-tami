import type { RawPageParam } from "../content/pagination";
import { firstValue } from "../projects/project-filters";
import { normalizeSearchText } from "../search/normalize";

/** Giá trị thô từ `searchParams` của Next cho danh sách tuyển dụng (chip danh mục + tỉnh làm việc + từ khoá, `?category=&province=&q=&page=`). */
export interface RawJobParams {
  page?: RawPageParam;
  category?: string | string[];
  province?: string | string[];
  q?: string | string[];
}

export interface JobFilters {
  /** Slug danh mục `job` từ `?category=` (slug của ngôn ngữ đang xem). */
  categorySlug?: string;
  provinceSlug?: string;
  /** Từ khoá tìm theo tên vị trí (BL-054), đã cắt khoảng trắng hai đầu; > 100 ký tự bị bỏ như mọi tham số. */
  q?: string;
}

/** Bộ lọc hợp lệ từ URL: giá trị rỗng/quá dài bị bỏ; slug được tra ở truy vấn, không tin ở đây. */
export function parseJobFilters(raw: RawJobParams): JobFilters {
  const categorySlug = firstValue(raw.category);
  const provinceSlug = firstValue(raw.province);
  const q = firstValue(raw.q);
  return { ...(categorySlug ? { categorySlug } : {}), ...(provinceSlug ? { provinceSlug } : {}), ...(q ? { q } : {}) };
}

/** URL có tham số lọc / tìm nào có giá trị không: trang đó `noindex, follow` + canonical về `/tuyen-dung` sạch (như `/du-an`). */
export function hasJobFilterParams(raw: RawJobParams): boolean {
  return [raw.category, raw.province, raw.q].some((value) => firstValue(value) !== undefined);
}

/** Chuỗi truy vấn theo thứ tự cố định (`category`, `province`, `q`, `page`); trang 1 không kèm `page`. Rỗng thì trả `""`. */
export function jobQueryString(params: { category?: string; province?: string; q?: string; page?: number }): string {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.province) search.set("province", params.province);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Số từ tối đa của `q` được xét (như ô tìm `/cho-thue`). */
const MAX_KEYWORD_TERMS = 8;

const escapeRegExp = (term: string): string => term.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

/** ≥ 2 từ (BL-103): các từ liền nhau đúng thứ tự, cách nhau bởi ký tự không phải chữ/số, từ đầu ở đầu từ (như `phraseRegex` phía SQL). */
const phrasePattern = (terms: readonly string[]): RegExp =>
  new RegExp(`(?:^|[^\\p{L}\\p{N}])${terms.map(escapeRegExp).join("[^\\p{L}\\p{N}]+")}`, "u");

/**
 * Khớp từ khoá với tên vị trí theo kiểu không dấu (`normalizeSearchText`, cùng quy tắc `searchText` ERD §6): 1 từ là chuỗi con; ≥ 2 từ (BL-103) cả cụm liền nhau đúng thứ tự ở đầu từ,
 * không phân biệt hoa thường / dấu / "đ". Từ khoá rỗng khớp mọi tên. Thuần, dùng ở `listOpenJobs` (lọc trên tập đã quét, không thêm cột).
 */
export function matchesJobKeyword(title: string | null | undefined, q: string | undefined): boolean {
  const terms = q ? normalizeSearchText(q).split(" ").filter(Boolean).slice(0, MAX_KEYWORD_TERMS) : [];
  if (terms.length === 0) return true;
  const haystack = normalizeSearchText(title ?? "");
  if (terms.length === 1) return haystack.includes(terms[0] as string);
  return phrasePattern(terms).test(haystack);
}
