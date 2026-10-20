import type { Payload, Where } from "payload";

import type { SalesStatus } from "../../collections/Projects";
import type { Locale } from "../../i18n/routing";
import type { Category, Developer, Project, Province } from "../../payload-types";
import { MAX_PAGE_SIZE } from "../content/pagination";
import { relationId } from "../payload/relation-id";
import { normalizeSearchText } from "../search/normalize";
import type { ProjectSortKey } from "./project-filters";
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
  /** Từ khoá (BL-045): khớp không dấu tên dự án + địa chỉ / tỉnh / phường. Rỗng = không lọc. */
  q?: string;
  /** Id chủ đầu tư ĐÃ đối chiếu với danh sách chủ đầu tư công khai. */
  developerId?: string;
  /** `newest` (mặc định) | `price_asc` | `price_desc` (theo `priceFromVnd`, trống xếp cuối). */
  sort?: ProjectSortKey;
}

/** Trường tối thiểu để khớp từ khoá / xếp theo giá; tỉnh + phường populate ở depth 1. */
const PROJECT_SCAN_FIELDS = { title: true, address: true, province: true, ward: true, priceFromVnd: true } as const;
/** Quét tối đa 20 trang x 50 = 1000 dự án; vượt thì phần sau không được tìm/sắp (dự án công khai thực tế chỉ vài chục). */
const SCAN_MAX_PAGES = 20;
const SCAN_PAGE_SIZE = MAX_PAGE_SIZE;

function emptyPage(page: number): PublicListResult<Project> {
  return { docs: [], page, limit: PROJECT_PAGE_SIZE, totalDocs: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false };
}

function relationName(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const { name } = value as { name?: unknown };
  return typeof name === "string" ? name : "";
}

/** Chuỗi tìm kiếm không dấu của một dự án: tên + địa chỉ + phường + tỉnh (cùng `normalizeSearchText` với từ khoá). */
function projectSearchText(project: Project): string {
  return normalizeSearchText([project.title, project.address, relationName(project.ward), relationName(project.province)].filter(Boolean).join(" "));
}

/** Giá tăng/giảm, dự án chưa có giá luôn cuối; hoà thì giữ thứ tự mới nhất sẵn có (`Array.sort` ổn định). */
function compareByPrice(direction: "price_asc" | "price_desc") {
  return (a: Project, b: Project): number => {
    const left = a.priceFromVnd ?? null;
    const right = b.priceFromVnd ?? null;
    if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
    return direction === "price_asc" ? left - right : right - left;
  };
}

/** Quét mọi dự án công khai khớp `where` (đã mới nhất trước) để lọc từ khoá / xếp theo giá ở bộ nhớ: không thêm cột `searchText`, và Postgres đặt NULL đầu khi DESC nên không xếp "trống cuối" bằng SQL được. */
async function scanPublicProjects(payload: Payload, locale: Locale, where: Where | undefined): Promise<Project[]> {
  const all: Project[] = [];
  for (let page = 1; page <= SCAN_MAX_PAGES; page += 1) {
    const result = await findPublicList<Project>(payload, "projects", locale, {
      ...(where ? { where } : {}),
      sort: PROJECT_SORT,
      page,
      limit: SCAN_PAGE_SIZE,
      depth: 1,
      select: PROJECT_SCAN_FIELDS,
    });
    all.push(...result.docs);
    if (!result.hasNextPage) break;
    if (page === SCAN_MAX_PAGES) {
      payload.logger.warn({ cap: SCAN_MAX_PAGES * SCAN_PAGE_SIZE }, "Quét dự án chạm trần: kết quả từ khoá/sắp giá bị cắt, cần cột searchText + migration");
    }
  }
  return all;
}

/** Trang `page` của danh sách id đã lọc/sắp: lấy đủ trường thẻ rồi xếp lại đúng thứ tự id. */
async function pageOfScannedProjects(payload: Payload, locale: Locale, ids: string[], page: number): Promise<PublicListResult<Project>> {
  const totalDocs = ids.length;
  const totalPages = Math.ceil(totalDocs / PROJECT_PAGE_SIZE);
  const pageIds = ids.slice((page - 1) * PROJECT_PAGE_SIZE, page * PROJECT_PAGE_SIZE);
  if (pageIds.length === 0) return { ...emptyPage(page), totalDocs, totalPages };
  const { docs } = await findPublicList<Project>(payload, "projects", locale, {
    where: { id: { in: pageIds } },
    limit: PROJECT_PAGE_SIZE,
    depth: 1,
    select: PROJECT_CARD_FIELDS,
  });
  const byId = new Map(docs.map((doc) => [doc.id, doc]));
  return {
    docs: pageIds.flatMap((id) => byId.get(id) ?? []),
    page,
    limit: PROJECT_PAGE_SIZE,
    totalDocs,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Một trang dự án công khai (mới xuất bản trước). Mọi điều kiện đi qua `findPublicList` nên luôn kèm `publicWhere`
 * (đã xuất bản, chưa xoá mềm, `/en` chỉ dự án `hasEnglish`). `depth: 1` populate ảnh `gallery`, tỉnh và danh mục cho thẻ; `select` chỉ lấy trường thẻ cần.
 * Có từ khoá hoặc sắp theo giá thì đi đường quét bộ nhớ (`scanPublicProjects`); còn lại một truy vấn SQL phân trang như cũ.
 */
export async function listPublicProjects(payload: Payload, locale: Locale, query: ProjectPageQuery): Promise<PublicListResult<Project>> {
  const conditions: Where[] = [
    ...(query.categoryIds ? [{ category: { in: [...query.categoryIds] } }] : []),
    ...(query.provinceId ? [{ province: { equals: query.provinceId } }] : []),
    ...(query.salesStatus ? [{ salesStatus: { equals: query.salesStatus } }] : []),
    ...(query.developerId ? [{ developer: { equals: query.developerId } }] : []),
  ];
  const where: Where | undefined = conditions.length > 0 ? { and: conditions } : undefined;
  const keyword = query.q ? normalizeSearchText(query.q) : "";
  const priceSort = query.sort === "price_asc" || query.sort === "price_desc" ? query.sort : undefined;

  if (!keyword && !priceSort) {
    return findPublicList<Project>(payload, "projects", locale, {
      ...(where ? { where } : {}),
      sort: PROJECT_SORT,
      page: query.page,
      limit: PROJECT_PAGE_SIZE,
      depth: 1,
      select: PROJECT_CARD_FIELDS,
    });
  }
  const scanned = await scanPublicProjects(payload, locale, where);
  const matched = keyword ? scanned.filter((project) => projectSearchText(project).includes(keyword)) : scanned;
  const ordered = priceSort ? [...matched].sort(compareByPrice(priceSort)) : matched;
  return pageOfScannedProjects(payload, locale, ordered.map((project) => project.id), query.page);
}

/**
 * Chủ đầu tư CÓ dự án công khai (ô "Chủ đầu tư" của `/du-an`), theo `sortOrder`. Id lấy từ dự án công khai của ngôn ngữ đang xem rồi
 * đi qua `findPublicList` của `developers` (`/en` chỉ chủ đầu tư có bản EN).
 */
export async function listDevelopersWithPublicProjects(payload: Payload, locale: Locale): Promise<Developer[]> {
  const ids = new Set<string>();
  for (let page = 1; page <= SCAN_MAX_PAGES; page += 1) {
    const result = await findPublicList<Project>(payload, "projects", locale, {
      where: { developer: { exists: true } },
      page,
      limit: SCAN_PAGE_SIZE,
      depth: 0,
      select: { developer: true },
    });
    for (const project of result.docs) {
      const id = relationId(project.developer);
      if (id) ids.add(id);
    }
    if (!result.hasNextPage) break;
  }
  if (ids.size === 0) return [];
  const { docs } = await findPublicList<Developer>(payload, "developers", locale, {
    where: { id: { in: [...ids] } },
    sort: ["sortOrder", "createdAt"],
    // Đúng số id vừa gom: không cắt cứng, để `?developer=<id>` hợp lệ không bị bỏ khi có nhiều chủ đầu tư.
    limit: ids.size,
    depth: 0,
  });
  return docs;
}

/** Dự án công khai theo slug của ngôn ngữ đang xem; `depth: 1` populate ảnh (gallery, mặt bằng, tài liệu), tỉnh, phường, chủ đầu tư, danh mục. */
export function findPublicProjectBySlug(payload: Payload, locale: Locale, slug: string): Promise<Project | null> {
  return findPublicBySlug<Project>(payload, "projects", locale, slug, { depth: 1 });
}

/** Số thẻ "Dự án khác" cuối trang chi tiết (design-spec S03 khối 12). */
export const OTHER_PROJECTS_COUNT = 3;

/**
 * Tối đa 3 dự án CÙNG tỉnh hoặc CÙNG loại hình, mới nhất trước, loại dự án hiện tại. Đi qua `findPublicList` nên chỉ dự án công khai
 * (và `/en` chỉ dự án có bản EN). Thiếu cả tỉnh lẫn danh mục thì không có dự án liên quan.
 */
export async function findOtherProjects(payload: Payload, locale: Locale, current: Pick<Project, "id" | "province" | "category">): Promise<Project[]> {
  const provinceId = relationId(current.province);
  const categoryId = relationId(current.category);
  const related: Where[] = [
    ...(provinceId ? [{ province: { equals: provinceId } }] : []),
    ...(categoryId ? [{ category: { equals: categoryId } }] : []),
  ];
  if (related.length === 0) return [];
  const { docs } = await findPublicList<Project>(payload, "projects", locale, {
    where: { and: [{ or: related }, { id: { not_equals: current.id } }] },
    sort: PROJECT_SORT,
    limit: OTHER_PROJECTS_COUNT,
    depth: 1,
    select: PROJECT_CARD_FIELDS,
  });
  return docs;
}
