import config from "@payload-config";
import { notFound, permanentRedirect } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { type ResolvedProjectFilters, toProjectPageQuery } from "@/components/projects/project-list-state";
import { publicPath } from "@/lib/content/content-paths";
import { loadListingPageContent } from "@/lib/content/load-listing-page";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { loadProjectStrengths } from "@/lib/content/load-project-strengths";
import { parsePagination } from "@/lib/content/pagination";
import { visibleCategory } from "@/lib/news/news-view";
import { parseProjectFilters, type RawProjectParams, withoutCategoryParam } from "@/lib/projects/project-filters";
import {
  findProjectCategoryBySlug,
  listChildProjectCategories,
  listDevelopersWithPublicProjects,
  listProvinces,
  listPublicProjects,
  listRootProjectCategories,
} from "@/lib/projects/project-queries";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

/** Phần đọc dữ liệu của S02 `/du-an` (tách khỏi `ProjectListPage`): bộ lọc đã đối chiếu, danh sách + facet, tab danh mục, hero, Điểm mạnh, Tìm hiểu thêm + FAQ. */

/** Danh mục của trang danh mục (S05) hoặc của link cũ `?category=`: bản ghi, cha hiển thị được, id tab cấp 1 cần đánh dấu và id dùng để lọc (danh mục + con của nó). */
export interface CategoryContext {
  slug: string;
  category: Category;
  parent: Category | null;
  rootId: string;
  filterIds: string[];
}

async function loadCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<CategoryContext | null> {
  const category = await findProjectCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Danh mục cấp 1 gồm cả dự án của danh mục con; cấp 2 không có con và tab được đánh dấu là danh mục cha của nó.
  const children = parent ? [] : (await listChildProjectCategories(payload, locale, category.id)).docs;
  return { slug, category, parent, rootId: parent?.id ?? category.id, filterIds: [category.id, ...children.map((child) => child.id)] };
}

/** Query string thô của URL cũ, bỏ `category`: giữ nguyên mọi tham số khác (kể cả `utm_*`, `page`) để 308 không mất ngữ cảnh. */
function queryWithoutCategory(searchParams: RawProjectParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "category" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  const text = query.toString().replaceAll("%2C", ",");
  return text ? `?${text}` : "";
}

/**
 * Đọc + đối chiếu tham số, tải mọi dữ liệu của trang. `categorySlug` (S05 `/du-an/danh-muc/[category]`): danh mục không có → `notFound()`.
 * `/du-an?category=<slug có thật>` (link cũ) → 308 sang trang danh mục, giữ mọi tham số khác; slug lạ bị bỏ (không lọc, không 404). Trang vượt số trang → `notFound()`.
 */
export async function loadProjectListData(locale: Locale, rawParams: RawProjectParams, categorySlug?: string) {
  const searchParams = categorySlug ? withoutCategoryParam(rawParams) : rawParams;
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseProjectFilters(searchParams);
  const payload = await getPayload({ config });
  const legacySlug = categorySlug ? undefined : filters.categorySlug;
  // Link cũ `?category=`: tra danh mục trước, redirect ngay để không tốn các query của cả trang danh sách.
  const legacyContext = legacySlug ? await loadCategoryContext(payload, locale, legacySlug) : null;
  if (legacyContext) permanentRedirect(`${publicPath("/du-an/danh-muc/[category]", locale, { category: legacyContext.category.slug ?? legacyContext.slug })}${queryWithoutCategory(searchParams)}`);
  const [context, provinces, developers, roots, hero, strengths, content] = await Promise.all([
    categorySlug ? loadCategoryContext(payload, locale, categorySlug) : null,
    listProvinces(payload),
    listDevelopersWithPublicProjects(payload, locale),
    listRootProjectCategories(payload, locale),
    loadPageHero(locale, "projects"),
    loadProjectStrengths(locale),
    loadListingPageContent(locale, "projects"),
  ]);
  // Slug tỉnh / id chủ đầu tư lạ bị bỏ (không 500); nhiều tỉnh là OR.
  const resolved: ResolvedProjectFilters = {
    filters,
    provinces: provinces.filter((item) => filters.provinceSlugs?.includes(item.slug)),
    developer: developers.find((item) => item.id === filters.developerId),
    categoryIds: context?.filterIds,
  };
  if (categorySlug && !context) notFound();
  const listing = await listPublicProjects(payload, locale, toProjectPageQuery(resolved, page));
  if (page > 1 && page > listing.totalPages) notFound();
  return { page, searchParams, filters, context, developers, resolved, listing, roots, hero, strengths, content };
}
