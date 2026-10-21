import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { StrengthsBlock } from "@/components/home/StrengthsBlock";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { Pagination } from "@/components/layout/Pagination";
import { ListPendingProvider } from "@/components/layout/PendingRegion";
import { LearnMoreFaq } from "@/components/listing/LearnMoreFaq";
import { ListingCategoryTabs, type ListingCategoryTab } from "@/components/listing/ListingCategoryTabs";
import { ListingHero } from "@/components/listing/ListingHero";
import { countActiveFilters } from "@/components/listing/listing-params";
import { SpotlightSlider } from "@/components/listing/SpotlightSlider";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectListBody } from "@/components/projects/ProjectListBody";
import { type ResolvedProjectFilters, toFilterOptions, toFilterParams, toFilterValues, toProjectPageQuery } from "@/components/projects/project-list-state";
import { ProjectSortControl } from "@/components/projects/ProjectSortControl";
import { ProjectSpotlightContent } from "@/components/projects/ProjectSpotlightContent";
import { projectCategoryIcon } from "@/components/projects/project-category-icon";
import { publicPath } from "@/lib/content/content-paths";
import { loadListingPageContent, type ListingLearnMoreView } from "@/lib/content/load-listing-page";
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
  type ProjectFacets,
} from "@/lib/projects/project-queries";
import { toProjectCards } from "@/lib/projects/project-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

interface ProjectListPageProps {
  locale: Locale;
  searchParams: RawProjectParams;
}

/** Danh mục đang lọc bằng `?category=`: slug, id tab cấp 1 cần đánh dấu và id dùng để lọc (danh mục + con của nó). */
interface CategoryContext {
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

/** Badge "Bộ lọc": các ô trong thẻ lọc (danh mục là tab, từ khoá là hero, sắp xếp ở hàng kết quả — không tính). */
const ACTIVE_FILTER_SPEC = { single: ["status", "developer"], multi: ["province", "type", "feature"], ranges: [["priceMin", "priceMax"]] } as const;
/** Tham số không có ô trong thẻ lọc: input ẩn của form GET không JS (danh mục là tab, từ khoá ở hero, sắp xếp ở hàng kết quả). */
const HIDDEN_PARAMS = ["category", "q", "sort"];
/** Ảnh thẻ lưới khi có cột lọc trái: ≥ xl ~300px, lg 3 cột trong ~70% khung, md 2 cột. */
const GRID_CARD_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw";

interface TabLabels {
  all: string;
  /** "28 dự án" (số nhiều theo ngôn ngữ). */
  count: (count: number) => string;
}

/** Tab "Tất cả" + danh mục cấp 1 (link `?category=` giữ lọc khác, về trang 1), số đếm "trừ chiều danh mục", icon theo slug. */
function buildTabs(roots: Category[], facets: ProjectFacets, labels: TabLabels, href: (category?: string) => string, currentRootId?: string): ListingCategoryTab[] {
  const named = roots.filter((root) => root.slug && root.name);
  if (named.length === 0) return [];
  return [
    { key: "all", href: href(), label: labels.all, countLabel: labels.count(facets.category.all), current: currentRootId === undefined },
    ...named.map((root) => ({
      key: root.id,
      href: href(root.slug ?? ""),
      label: root.name ?? "",
      countLabel: labels.count(facets.category.counts[root.id] ?? 0),
      icon: projectCategoryIcon(root.slug),
      current: root.id === currentRootId,
    })),
  ];
}

function toLearnMoreContent(view: ListingLearnMoreView | null) {
  if (!view) return null;
  return { eyebrow: view.eyebrow ?? null, title: view.title, titleAccent: view.titleAccent ?? null, description: view.description ?? null, image: view.image ?? null, videoUrl: view.videoUrl ?? null, cta: view.cta ?? null };
}

/**
 * S02 `/du-an` theo design BL-052 (`list-du-an.webp`): hero (ảnh + chữ `pageHeroes.projects`, ô tìm `q`, "Tìm nhanh") → tab danh mục cấp 1 (icon + số) → cột lọc trái
 * (Tình trạng · Tỉnh/thành · Chủ đầu tư · Mức giá · Loại hình · Tiện ích; < lg là Sheet) | thẻ nổi bật (trang 1) → "N dự án phù hợp" + sắp xếp → lưới 3 cột → phân trang
 * → "Tìm hiểu thêm" + FAQ (`listingPages.projects`) → dải Điểm mạnh (cờ `showProjectStrengths`) → banner tư vấn. Lọc / sắp / trang trên `searchParams`
 * (`?category=&province=a,b&status=&q=&developer=&sort=&type=&feature=&priceMin=&priceMax=&page=`); slug / id lạ bị bỏ (không 404); trang vượt số trang → `notFound()`.
 */
export async function ProjectListPage({ locale, searchParams }: ProjectListPageProps) {
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseProjectFilters(searchParams);
  const payload = await getPayload({ config });
  const [context, provinces, developers, t, tNav, tOptions, roots, hero, strengths, content] = await Promise.all([
    filters.categorySlug ? loadCategoryContext(payload, locale, filters.categorySlug) : null,
    listProvinces(payload),
    listDevelopersWithPublicProjects(payload, locale),
    getTranslations({ locale, namespace: "page.projects" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    getTranslations({ locale, namespace: "listingOptions" }),
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

  const listPath = publicPath("/du-an", locale);
  const filterParams = toFilterParams(resolved);
  const categoryParam = context ? { category: context.slug } : {};
  const sortParam = filters.sort ? { sort: filters.sort } : {};
  const current = Object.fromEntries(new URLSearchParams(projectQueryString({ ...categoryParam, ...filterParams, ...sortParam })));
  const filtered = Object.keys(current).length > 0;
  const cleanPage = page === 1 && !hasFilterParams(searchParams);
  const tabLabels: TabLabels = { all: t("all"), count: (count) => t("resultTotal", { count }) };
  const tabHref = (category?: string) => `${listPath}${projectQueryString({ ...(category ? { category } : {}), ...filterParams, ...sortParam })}`;
  const tabs = buildTabs(roots.docs, listing.facets, tabLabels, tabHref, context?.rootId);
  const options = toFilterOptions({
    facets: listing.facets,
    selectedProvinces: resolved.provinces,
    developers,
    typeLabel: (value) => tOptions(`propertyType.${value}`),
    featureLabel: (value) => tOptions(`projectFeature.${value}`),
  });
  const featuredCards = toProjectCards(listing.featured, locale);
  const cards = toProjectCards(listing.docs, locale);
  const buildHref = (target: number) => `${listPath}${projectQueryString({ ...categoryParam, ...filterParams, ...sortParam, page: target })}`;

  return (
    <ListPendingProvider>
      <ListingHero
        title={hero.title}
        {...(hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
        {...(hero.eyebrow ? { eyebrow: hero.eyebrow } : {})}
        {...(hero.description ? { description: hero.description } : {})}
        {...(hero.image ? { image: hero.image } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={[{ label: tNav("projects"), href: listPath }]} />}
        search={{ action: listPath, ...(filters.q ? { value: filters.q } : {}), placeholder: t("keywordPlaceholder"), preservedParams: current }}
        quickSearch={content.quickSearch}
      />
      <ListingCategoryTabs label={t("tabsLabel")} tabs={tabs} />
      <ProjectListBody
        path={listPath}
        current={current}
        values={toFilterValues(resolved)}
        options={options}
        preservedParams={Object.fromEntries(Object.entries(current).filter(([key]) => HIDDEN_PARAMS.includes(key)))}
        activeCount={countActiveFilters(current, ACTIVE_FILTER_SPEC)}
        clearHref={listPath}
        countLabel={t("resultTotal", { count: listing.totalDocs })}
        {...(featuredCards.length > 0
          ? {
              spotlight: (
                <SpotlightSlider
                  label={t("spotlightLabel")}
                  badge={t("spotlightLabel")}
                  items={featuredCards.map((card) => ({ id: card.id, image: card.cover, content: <ProjectSpotlightContent data={card} /> }))}
                />
              ),
            }
          : {})}
        {...(listing.totalDocs > 0 ? { sort: <ProjectSortControl actionPath={listPath} {...(filters.sort ? { value: filters.sort } : {})} params={{ ...categoryParam, ...filterParams }} /> } : {})}
      >
        {listing.totalDocs === 0 ? (
          filtered ? (
            <EmptyState variant="filtered" title={t("emptyTitle")} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
          ) : (
            <EmptyState variant="empty" title={t("noProjects")} />
          )
        ) : (
          <>
            {cards.length > 0 && (
              <section aria-label={t("gridLabel")}>
                <ul data-grid-max-cols="3" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {cards.map((card, index) => (
                    <li key={card.id}>
                      {/* Ảnh LCP là ảnh hero; thẻ đầu chỉ ưu tiên khi hero không có ảnh và không có thẻ nổi bật. */}
                      <ProjectCard data={card} sizes={GRID_CARD_SIZES} priority={index === 0 && !hero.image && featuredCards.length === 0} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <Pagination page={page} totalPages={listing.totalPages} buildHref={buildHref} />
          </>
        )}
      </ProjectListBody>
      <div className="mx-auto w-full max-w-container px-gutter pb-section-tight empty:hidden">
        <LearnMoreFaq learnMore={toLearnMoreContent(content.learnMore)} faqs={content.faqs} emitJsonLd={cleanPage} />
      </div>
      {strengths ? <StrengthsBlock block={strengths} /> : null}
      <ConsultBanner locale={locale} />
    </ListPendingProvider>
  );
}

/**
 * `generateMetadata` của `/du-an`. Có tham số lọc (`category`, `province`, `status`, `q`, `developer`, `type`, `feature`, `priceMin`, `priceMax`, `sort` khác mặc định)
 * → `noindex, follow` và canonical về trang sạch `/du-an`; không lọc: canonical là chính nó (kèm `?page=n` ở trang ≥ 2). Không tra danh mục nên không lặp truy vấn của trang.
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
