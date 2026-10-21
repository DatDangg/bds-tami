import config from "@payload-config";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { type ResolvedProjectFilters, toProjectPageQuery } from "@/components/projects/project-list-state";
import { loadListingPageContent } from "@/lib/content/load-listing-page";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { loadProjectStrengths } from "@/lib/content/load-project-strengths";
import { parsePagination } from "@/lib/content/pagination";
import { visibleCategory } from "@/lib/news/news-view";
import { parseProjectFilters, type RawProjectParams } from "@/lib/projects/project-filters";
import {
  findProjectCategoryBySlug,
  listChildProjectCategories,
  listDevelopersWithPublicProjects,
  listProvinces,
  listPublicProjects,
  listRootProjectCategories,
} from "@/lib/projects/project-queries";
import type { Locale } from "@/i18n/routing";

/** Phần đọc dữ liệu của S02 `/du-an` (tách khỏi `ProjectListPage`): bộ lọc đã đối chiếu, danh sách + facet, tab danh mục, hero, Điểm mạnh, Tìm hiểu thêm + FAQ. */

/** Danh mục đang lọc bằng `?category=`: slug, id tab cấp 1 cần đánh dấu và id dùng để lọc (danh mục + con của nó). */
export interface CategoryContext {
  slug: string;
  rootId: string;
  filterIds: string[];
}

async function loadCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<CategoryContext | null> {
  const category = await findProjectCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Danh mục cấp 1 gồm cả dự án của danh mục con; cấp 2 không có con và tab được đánh dấu là danh mục cha của nó.
  const children = parent ? [] : (await listChildProjectCategories(payload, locale, category.id)).docs;
  return { slug, rootId: parent?.id ?? category.id, filterIds: [category.id, ...children.map((child) => child.id)] };
}

/** Đọc + đối chiếu tham số, tải mọi dữ liệu của trang; trang vượt số trang → `notFound()`. */
export async function loadProjectListData(locale: Locale, searchParams: RawProjectParams) {
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseProjectFilters(searchParams);
  const payload = await getPayload({ config });
  const [context, provinces, developers, roots, hero, strengths, content] = await Promise.all([
    filters.categorySlug ? loadCategoryContext(payload, locale, filters.categorySlug) : null,
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
  const listing = await listPublicProjects(payload, locale, toProjectPageQuery(resolved, page));
  if (page > 1 && page > listing.totalPages) notFound();
  return { page, filters, context, developers, resolved, listing, roots, hero, strengths, content };
}
