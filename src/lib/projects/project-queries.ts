import type { Payload, Where } from "payload";

import type { SalesStatus } from "../../collections/Projects";
import type { Locale } from "../../i18n/routing";
import type { Category, Project, Province } from "../../payload-types";
import { findPublicBySlug, findPublicList, type PublicListResult } from "../content/public-queries";

/** 12 dự án/trang (design-spec S02). */
export const PROJECT_PAGE_SIZE = 12;

const PROJECT_SORT = ["-publishedAt", "-createdAt"];
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Danh mục nền ít, tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 50;
/** 34 tỉnh/thành sau sáp nhập; dư để không cắt khi dữ liệu đổi. */
const PROVINCE_LIMIT = 100;

/** Trường thẻ dự án dùng: bỏ `overview`, pháp lý, chính sách... (richText dài) khỏi truy vấn danh sách. */
const PROJECT_CARD_FIELDS = { title: true, slug: true, salesStatus: true, province: true, category: true, priceFromVnd: true, gallery: true } as const;

const PROJECT_CATEGORY_SCOPE: Where = { scope: { equals: "project" } };

/** Danh mục `project` cấp 1 của một ngôn ngữ (chip Loại hình của S02). `/en` chỉ gồm danh mục đã có bản EN. */
export function listRootProjectCategories(payload: Payload, locale: Locale): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [PROJECT_CATEGORY_SCOPE, { parent: { exists: false } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục con (cấp 2) của một danh mục `project`. */
export function listChildProjectCategories(payload: Payload, locale: Locale, parentId: string): Promise<PublicListResult<Category>> {
  return findPublicList<Category>(payload, "categories", locale, {
    where: { and: [PROJECT_CATEGORY_SCOPE, { parent: { equals: parentId } }] },
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
}

/** Danh mục `project` theo slug của ngôn ngữ đang xem (slug chỉ duy nhất trong cùng scope). `parent` đã populate. */
export function findProjectCategoryBySlug(payload: Payload, locale: Locale, slug: string): Promise<Category | null> {
  return findPublicBySlug<Category>(payload, "categories", locale, slug, { where: PROJECT_CATEGORY_SCOPE, depth: 1 });
}

/**
 * Tỉnh/thành cho ô lọc, theo thứ tự `sortOrder`. Danh mục tĩnh công khai (`access.read` mở), đọc như khách; không có
 * xoá mềm/`hasEnglish` nên không đi qua `findPublicList`. Tên riêng tiếng Việt giữ nguyên ở `/en`.
 */
export async function listProvinces(payload: Payload): Promise<Province[]> {
  const result = await payload.find({
    collection: "provinces",
    sort: "sortOrder",
    limit: PROVINCE_LIMIT,
    pagination: false,
    depth: 0,
    overrideAccess: false,
  });
  return result.docs;
}

export interface ProjectPageQuery {
  page: number;
  /** Lọc theo các danh mục này (danh mục + con của nó). Bỏ trống = mọi danh mục. */
  categoryIds?: readonly string[];
  provinceId?: string;
  salesStatus?: SalesStatus;
}

/**
 * Một trang dự án công khai (mới xuất bản trước). Mọi điều kiện đi qua `findPublicList` nên luôn kèm `publicWhere`
 * (đã xuất bản, chưa xoá mềm, `/en` chỉ dự án `hasEnglish`). `depth: 1` populate ảnh `gallery`, tỉnh và danh mục cho thẻ; `select` chỉ lấy trường thẻ cần.
 */
export function listPublicProjects(payload: Payload, locale: Locale, query: ProjectPageQuery): Promise<PublicListResult<Project>> {
  const conditions: Where[] = [
    ...(query.categoryIds ? [{ category: { in: [...query.categoryIds] } }] : []),
    ...(query.provinceId ? [{ province: { equals: query.provinceId } }] : []),
    ...(query.salesStatus ? [{ salesStatus: { equals: query.salesStatus } }] : []),
  ];
  return findPublicList<Project>(payload, "projects", locale, {
    ...(conditions.length > 0 ? { where: { and: conditions } } : {}),
    sort: PROJECT_SORT,
    page: query.page,
    limit: PROJECT_PAGE_SIZE,
    depth: 1,
    select: PROJECT_CARD_FIELDS,
  });
}
