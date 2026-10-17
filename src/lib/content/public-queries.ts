import type { CollectionSlug, Payload, Where } from "payload";

import { buildPublicWhere, PUBLIC_STATUSES } from "../../access";
import type { Locale } from "../../i18n/routing";
import { type Pagination, parsePagination } from "./pagination";

/**
 * Allowlist collection mà truy vấn công khai được phép nhận. Collection mới (tin tức, dự án...) phải được THÊM VÀO ĐÂY khi
 * có trang công khai; collection nội bộ thêm sau không tự lọt vào. Slug ngoài danh sách là lỗi typecheck.
 */
export type PublicCollectionSlug = Extract<CollectionSlug, "categories" | "developers" | "services" | "pages" | "news" | "projects" | "job-postings" | "rentals">;

/** Collection không có trường `status` (danh mục nền, chủ đầu tư): chỉ cần chưa xoá mềm. */
const COLLECTIONS_WITHOUT_STATUS: ReadonlySet<string> = new Set(["categories", "developers"]);

/**
 * Điều kiện "khách thấy được" của một collection nội dung, và là NƠI DUY NHẤT dựng nó cho truy vấn trang công khai
 * (ERD §1, BR-07): trạng thái công khai (`published`, `rentals` thêm `rented`), chưa xoá mềm, và ở `en` thì `hasEnglish = true`.
 * Phần trạng thái + xoá mềm lấy từ `buildPublicWhere` (cũng là `access.read` của khách), nên hai nơi không lệch nhau.
 * Hẹn giờ `publishedAt ≤ now` (FR-ADM-16) sẽ thêm ở `buildPublicWhere`, tự áp cho cả access lẫn truy vấn.
 */
export function publicWhere(collection: string, locale: Locale): Where {
  const base: Where = COLLECTIONS_WITHOUT_STATUS.has(collection)
    ? { deletedAt: { exists: false } }
    : buildPublicWhere(collection === "rentals" ? PUBLIC_STATUSES.rentals : PUBLIC_STATUSES.default);
  return locale === "en" ? { and: [base, { hasEnglish: { equals: true } }] } : base;
}

/** Truy vấn công khai luôn như KHÁCH (không `user`, `overrideAccess: false`) và không rơi về tiếng Việt khi thiếu bản en. */
function guestReadOptions(collection: PublicCollectionSlug, locale: Locale, depth: number) {
  return {
    collection,
    locale,
    fallbackLocale: false as const,
    overrideAccess: false as const,
    trash: false as const,
    depth,
  };
}

const DEFAULT_DEPTH = 1;

export interface PublicListOptions extends Partial<Pagination> {
  /** Điều kiện thêm (lọc theo danh mục, nổi bật...); luôn được AND với `publicWhere`, không thể nới lỏng nó. */
  where?: Where;
  sort?: string | string[];
  depth?: number;
}

export interface PublicListResult<T> {
  docs: T[];
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Danh sách công khai có phân trang. Mọi trang danh sách gọi hàm này, không gọi `payload.find` trực tiếp.
 * Lưu ý (cũng đúng cho `findPublicBySlug`) khi `depth > 0` ở `/en`: doc liên quan được populate (dự án liên quan, danh mục...)
 * chỉ qua `access.read` của khách (status, xoá mềm), KHÔNG lọc `hasEnglish`. Chữ Việt không lộ (fallback tắt) nhưng doc đó có
 * thể chưa có bản EN: trang phải bỏ doc liên quan có `hasEnglish !== true` trước khi render link/thẻ, nếu không sẽ link tới
 * trang EN 404 hoặc thẻ rỗng tiêu đề.
 */
export async function findPublicList<T = unknown>(
  payload: Payload,
  collection: PublicCollectionSlug,
  locale: Locale,
  options: PublicListOptions = {},
): Promise<PublicListResult<T>> {
  // Kẹp lại phân trang phòng khi gọi thẳng không qua URL.
  const { page, limit } = parsePagination(options.page, options.limit);
  const where: Where = options.where
    ? { and: [publicWhere(collection, locale), options.where] }
    : publicWhere(collection, locale);
  const result = await payload.find({
    ...guestReadOptions(collection, locale, options.depth ?? DEFAULT_DEPTH),
    where,
    sort: options.sort,
    page,
    limit,
  });
  return {
    docs: result.docs as T[],
    page: result.page ?? page,
    limit: result.limit,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };
}

export interface PublicBySlugOptions {
  /** Điều kiện thêm, vd `{ scope: { equals: "news" } }` cho `categories` (slug chỉ duy nhất trong cùng scope). */
  where?: Where;
  depth?: number;
}

/**
 * Một bản ghi công khai theo slug của ĐÚNG ngôn ngữ đang xem (slug vi và en khác nhau). Không có, chưa công khai, đã xoá
 * mềm, hoặc là `en` mà chưa có bản dịch → `null` để trang gọi `notFound()`; không bao giờ trả chữ tiếng Việt ở `/en`.
 */
export async function findPublicBySlug<T = unknown>(
  payload: Payload,
  collection: PublicCollectionSlug,
  locale: Locale,
  slug: string,
  options: PublicBySlugOptions = {},
): Promise<T | null> {
  const conditions: Where[] = [publicWhere(collection, locale), { slug: { equals: slug } }];
  if (options.where) conditions.push(options.where);
  const result = await payload.find({
    ...guestReadOptions(collection, locale, options.depth ?? DEFAULT_DEPTH),
    where: { and: conditions },
    limit: 1,
    pagination: false,
  });
  return (result.docs[0] as T | undefined) ?? null;
}
