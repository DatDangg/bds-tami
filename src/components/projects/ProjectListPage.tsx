import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { StrengthsBlock } from "@/components/home/StrengthsBlock";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { PendingLink } from "@/components/layout/PendingRegion";
import { ListFilterRow } from "@/components/listing/ListSearchBar";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { ProjectSortControl } from "@/components/projects/ProjectSortControl";
import { CategoryChipList, CategoryListTemplate, type CategoryChip } from "@/components/templates/CategoryListTemplate";
import { publicPath } from "@/lib/content/content-paths";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { loadProjectStrengths } from "@/lib/content/load-project-strengths";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { visibleCategory } from "@/lib/news/news-view";
import { hasFilterParams, parseProjectFilters, projectQueryString, type RawProjectParams } from "@/lib/projects/project-filters";
import {
  findProjectCategoryBySlug,
  listChildProjectCategories,
  listDevelopersWithPublicProjects,
  listProvinces,
  listPublicProjects,
  listRootProjectCategories,
} from "@/lib/projects/project-queries";
import { toProjectCards } from "@/lib/projects/project-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

interface ProjectListPageProps {
  locale: Locale;
  searchParams: RawProjectParams;
}

/** Danh mục đang lọc bằng `?category=`: slug, id chip cấp 1 cần đánh dấu và id dùng để lọc (danh mục + con của nó). */
interface CategoryContext {
  slug: string;
  rootId: string;
  filterIds: string[];
}

async function loadCategoryContext(payload: Payload, locale: Locale, slug: string): Promise<CategoryContext | null> {
  const category = await findProjectCategoryBySlug(payload, locale, slug);
  if (!category) return null;
  const parent = visibleCategory(category.parent, locale);
  // Danh mục cấp 1 gồm cả dự án của danh mục con; cấp 2 không có con và chip được đánh dấu là danh mục cha của nó.
  const children = parent ? [] : (await listChildProjectCategories(payload, locale, category.id)).docs;
  return { slug, rootId: parent?.id ?? category.id, filterIds: [category.id, ...children.map((child) => child.id)] };
}

/** Chip Loại hình (design-spec S02): "Tất cả" + danh mục cấp 1, link `?category=` giữ tỉnh/trạng thái/từ khoá/chủ đầu tư/sắp xếp đang lọc và về trang 1. */
function buildChips(roots: Category[], listPath: string, allLabel: string, carry: { province?: string; status?: string; q?: string; developer?: string; sort?: string }, currentRootId?: string): CategoryChip[] {
  const named = roots.filter((root) => root.slug && root.name);
  if (named.length === 0) return [];
  return [
    { label: allLabel, href: `${listPath}${projectQueryString(carry)}`, current: currentRootId === undefined },
    ...named.map((root) => ({
      label: root.name ?? "",
      href: `${listPath}${projectQueryString({ category: root.slug ?? "", ...carry })}`,
      current: root.id === currentRootId,
    })),
  ];
}

/**
 * Dữ liệu + bố cục S02 (`/du-an`, lọc `?category=&province=&status=&q=&developer=&sort=&page=`) trên `CategoryListTemplate` (BL-045): hero (chữ + ảnh admin) → thẻ lọc nổi → hàng "N dự án" + sắp xếp
 * → lưới → phân trang → dải Điểm mạnh (tuỳ cờ) → banner tư vấn. Slug danh mục / tỉnh / id chủ đầu tư lạ bị bỏ qua (hiện danh sách không lọc, không 404); trang vượt số trang → `notFound()`.
 * Đọc `searchParams` nên render theo request (không ISR); CDN giữ theo `Cache-Control` của `next.config.ts`.
 */
export async function ProjectListPage({ locale, searchParams }: ProjectListPageProps) {
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseProjectFilters(searchParams);
  const payload = await getPayload({ config });
  const [context, provinces, developers, t, tNav, roots, hero, strengths] = await Promise.all([
    filters.categorySlug ? loadCategoryContext(payload, locale, filters.categorySlug) : null,
    listProvinces(payload),
    listDevelopersWithPublicProjects(payload, locale),
    getTranslations({ locale, namespace: "page.projects" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    listRootProjectCategories(payload, locale),
    loadPageHero(locale, "projects"),
    loadProjectStrengths(locale),
  ]);
  const province = provinces.find((item) => item.slug === filters.provinceSlug);
  // Id lạ (không có dự án công khai) bị bỏ qua, không 500.
  const developer = developers.find((item) => item.id === filters.developerId);
  const listing = await listPublicProjects(payload, locale, {
    page,
    ...(context ? { categoryIds: context.filterIds } : {}),
    ...(province ? { provinceId: province.id } : {}),
    ...(filters.status ? { salesStatus: filters.status } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    ...(developer ? { developerId: developer.id } : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
  });
  if (page > 1 && page > listing.totalPages) notFound();

  const listPath = publicPath("/du-an", locale);
  const filterParams = {
    ...(province ? { province: province.slug } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q ? { q: filters.q } : {}),
    ...(developer ? { developer: developer.id } : {}),
  };
  const carry = { ...filterParams, ...(filters.sort ? { sort: filters.sort } : {}) };
  const filtersActive = Boolean(province || filters.status || context || filters.q || developer || filters.sort);
  const buildHref = (target: number) => `${listPath}${projectQueryString({ ...(context ? { category: context.slug } : {}), ...carry, page: target })}`;
  const chips = buildChips(roots.docs, listPath, t("all"), carry, context?.rootId);

  return (
    <CategoryListTemplate
      title={hero.title}
      {...(hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
      {...(hero.eyebrow ? { eyebrow: hero.eyebrow } : {})}
      {...(hero.description ? { description: hero.description } : {})}
      {...(hero.image ? { bannerImage: hero.image } : {})}
      breadcrumb={[{ label: tNav("projects"), href: listPath }]}
      filterCard={
        <ProjectFilters
          // `key` theo bộ lọc trên URL: URL đổi từ ngoài (chip, "Xoá bộ lọc", sắp xếp, back) thì các ô nạp lại.
          key={`${province?.slug ?? ""}|${filters.status ?? ""}|${developer?.id ?? ""}|${filters.q ?? ""}|${filters.sort ?? ""}`}
          actionPath={listPath}
          provinces={provinces.map((item) => ({ slug: item.slug, name: item.shortName || item.name }))}
          developers={developers.flatMap((item) => (item.name ? [{ id: item.id, name: item.name }] : []))}
          {...(province ? { selectedProvince: province.slug } : {})}
          {...(filters.status ? { selectedStatus: filters.status } : {})}
          {...(developer ? { selectedDeveloper: developer.id } : {})}
          {...(filters.q ? { query: filters.q } : {})}
          {...(filters.sort ? { sort: filters.sort } : {})}
          {...(context ? { hiddenCategory: context.slug } : {})}
          {...(chips.length > 0
            ? {
                categoryRow: (
                  <ListFilterRow label={t("categoriesLabel")}>
                    <nav aria-label={t("categoriesLabel")}>
                      <CategoryChipList chips={chips} scroll />
                    </nav>
                  </ListFilterRow>
                ),
              }
            : {})}
        />
      }
      resultText={
        <>
          {t("resultTotal", { count: listing.totalDocs })} <span className="text-small font-normal text-text-secondary">{t("resultSuffix")}</span>
        </>
      }
      // Hết kết quả thì nút xoá nằm ở EmptyState, tránh hai link trùng tên.
      resultExtras={
        filtersActive && listing.totalDocs > 0 ? (
          <PendingLink href={listPath} className="inline-flex min-h-11 items-center text-small font-semibold underline underline-offset-4">
            {t("clear")}
          </PendingLink>
        ) : null
      }
      sort={<ProjectSortControl actionPath={listPath} {...(filters.sort ? { value: filters.sort } : {})} params={{ ...(context ? { category: context.slug } : {}), ...filterParams }} />}
      emptyState={
        filtersActive ? (
          <EmptyState variant="filtered" title={t("emptyTitle")} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
        ) : (
          <EmptyState variant="empty" title={t("noProjects")} />
        )
      }
      parentListHref={listPath}
      isEmpty={listing.totalDocs === 0}
      pagination={{ page, totalPages: listing.totalPages, buildHref }}
      belowContent={strengths ? <StrengthsBlock block={strengths} /> : undefined}
      consultBanner={<ConsultBanner locale={locale} />}
    >
      <section aria-label={t("gridLabel")}>
        <ul data-grid-max-cols="4" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {toProjectCards(listing.docs, locale).map((card, index) => (
            <li key={card.id}>
              <ProjectCard data={card} priority={index === 0} />
            </li>
          ))}
        </ul>
      </section>
    </CategoryListTemplate>
  );
}

/**
 * `generateMetadata` của `/du-an`. Có tham số lọc (`?category=`, `province`, `status`, `q`, `developer`, `sort` khác mặc định) → `noindex, follow` và canonical về trang
 * sạch `/du-an` (design-spec S04); không lọc: canonical là chính nó (kèm `?page=n` ở trang ≥ 2, như danh sách tin). Không tra
 * danh mục nên không lặp truy vấn của trang.
 */
export async function buildProjectListMetadata({ locale, searchParams }: ProjectListPageProps): Promise<Metadata> {
  const { page } = parsePagination(searchParams.page, undefined);
  const filtered = hasFilterParams(searchParams);
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.projects" }), loadSiteIdentity(locale)]);
  const pathFor = (target: Locale) => {
    const path = publicPath("/du-an", target);
    return !filtered && page > 1 ? `${path}?page=${page}` : path;
  };
  return buildPageMetadata({
    locale,
    siteName: identity.siteName,
    defaultImage: identity.logo,
    forceNoindex: filtered,
    title: t("title"),
    description: t("description"),
    paths: { vi: pathFor("vi"), en: pathFor("en") },
    hasEnglish: true,
  });
}
