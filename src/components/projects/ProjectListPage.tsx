import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
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
import { projectCategoryPath } from "@/components/projects/project-list-metadata";
import { loadProjectListData } from "@/components/projects/project-list-data";
import { toFilterOptions, toFilterParams, toFilterValues } from "@/components/projects/project-list-state";
import { ProjectSortControl } from "@/components/projects/ProjectSortControl";
import { ProjectSpotlightContent } from "@/components/projects/ProjectSpotlightContent";
import { projectCategoryIcon } from "@/components/projects/project-category-icon";
import { publicPath } from "@/lib/content/content-paths";
import type { ListingLearnMoreView } from "@/lib/content/load-listing-page";
import { hasFilterParams, projectQueryString, type RawProjectParams } from "@/lib/projects/project-filters";
import type { ProjectFacets } from "@/lib/projects/project-queries";
import { type ProjectCardData, toProjectCards } from "@/lib/projects/project-view";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

export interface ProjectListPageProps {
  locale: Locale;
  searchParams: RawProjectParams;
  /** Slug danh mục của trang S05 (`/du-an/danh-muc/[category]`); bỏ trống = S02 `/du-an`. Danh mục này bị KHOÁ: `?category=` bị bỏ qua. */
  categorySlug?: string;
}

/** Badge "Bộ lọc": các ô trong thẻ lọc (danh mục là tab, từ khoá là hero, sắp xếp ở hàng kết quả — không tính). */
const ACTIVE_FILTER_SPEC = { single: ["status", "developer"], multi: ["province", "type", "feature"], ranges: [["priceMin", "priceMax"]] } as const;
/** Tham số không có ô trong thẻ lọc: input ẩn của form GET không JS (từ khoá ở hero, sắp xếp ở hàng kết quả; danh mục nằm trong đường dẫn nên không lên URL). */
const HIDDEN_PARAMS = ["q", "sort"];
/** Ảnh thẻ lưới khi có cột lọc trái: ≥ xl ~300px, lg 3 cột trong ~70% khung, md 2 cột. */
const GRID_CARD_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw";

interface TabLabels {
  all: string;
  /** "28 dự án" (số nhiều theo ngôn ngữ). */
  count: (count: number) => string;
}

/** Tab "Tất cả" (`/du-an`) + danh mục cấp 1 (link trang danh mục `/du-an/danh-muc/<slug>`, giữ lọc khác, về trang 1), số đếm "trừ chiều danh mục", icon theo slug. */
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

interface ProjectResultsProps {
  locale: Locale;
  listPath: string;
  /** URL có lọc: trạng thái trống "không tìm thấy" + Xoá bộ lọc thay vì "chưa có dự án". */
  filtered: boolean;
  /** Trang danh mục: trống thật thì nói "trong mục này" + link về `/du-an`. */
  inCategory: boolean;
  projectsPath: string;
  /** Tổng dự án khớp lọc (0 → trạng thái trống). */
  total: number;
  cards: ProjectCardData[];
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  /** Thẻ đầu là ảnh LCP (hero không có ảnh và không có thẻ nổi bật). */
  priorityFirst: boolean;
}

/** Thẻ nổi bật (trang 1, có dự án nổi bật khớp lọc). */
function ProjectSpotlight({ cards }: { cards: ProjectCardData[] }) {
  const t = useTranslations("page.projects");
  return <SpotlightSlider label={t("spotlightLabel")} badge={t("spotlightLabel")} items={cards.map((card) => ({ id: card.id, image: card.cover, content: <ProjectSpotlightContent data={card} /> }))} />;
}

/** Lưới 3 cột + phân trang, hoặc trạng thái trống (có lọc / chưa có dự án). */
function ProjectResults({ locale, listPath, filtered, inCategory, projectsPath, total, cards, page, totalPages, buildHref, priorityFirst }: ProjectResultsProps) {
  const t = useTranslations("page.projects");
  if (total === 0) {
    return filtered ? (
      <EmptyState variant="filtered" title={t("emptyTitle")} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
    ) : (
      <EmptyState variant="empty" title={t(inCategory ? "noProjectsInCategory" : "noProjects")} {...(inCategory ? { backHref: projectsPath } : {})} />
    );
  }
  return (
    <>
      {cards.length > 0 && (
        <section aria-label={t("gridLabel")}>
          <ul data-grid-max-cols="3" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <li key={card.id}>
                {/* Ảnh LCP là ảnh hero; thẻ đầu chỉ ưu tiên khi hero không có ảnh và không có thẻ nổi bật. */}
                <ProjectCard data={card} sizes={GRID_CARD_SIZES} priority={priorityFirst && index === 0} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </>
  );
}

/** Hero (ảnh + chữ `pageHeroes.projects`; trang danh mục: eyebrow "Dự án", tiêu đề + mô tả của danh mục) + breadcrumb (Dự án › cha › danh mục) + ô tìm `q` + "Tìm nhanh". */
function ProjectListHero({ locale, data, listPath, projectsPath, params }: ProjectListHeroProps) {
  const t = useTranslations("page.projects");
  const tNav = useTranslations("layout.nav.items");
  const { hero, content, context, q } = data;
  const category = context?.category;
  const breadcrumb = [
    { label: tNav("projects"), href: projectsPath },
    // Cha không có slug ở locale này thì không có trang để link tới (tránh `/du-an/danh-muc/`).
    ...(context?.parent?.slug ? [{ label: context.parent.name ?? "", href: projectCategoryPath(locale, context.parent.slug) }] : []),
    ...(category ? [{ label: category.name ?? "", href: listPath }] : []),
  ];
  const description = category ? (category.description ?? undefined) : hero.description;
  const eyebrow = category ? tNav("projects") : hero.eyebrow;
  return (
    <ListingHero
      title={category?.name ?? hero.title}
      {...(!category && hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
      {...(eyebrow ? { eyebrow } : {})}
      {...(description ? { description } : {})}
      {...(hero.image ? { image: hero.image } : {})}
      breadcrumb={<Breadcrumb variant="overlay" items={breadcrumb} />}
      search={{ action: listPath, ...(q ? { value: q } : {}), placeholder: t("keywordPlaceholder"), preservedParams: params }}
      quickSearch={content.quickSearch}
    />
  );
}

interface ProjectListHeroProps {
  locale: Locale;
  data: Pick<Awaited<ReturnType<typeof loadProjectListData>>, "hero" | "content" | "context"> & { q: string | undefined };
  listPath: string;
  projectsPath: string;
  params: Record<string, string>;
}

/**
 * S02 `/du-an` và S05 trang danh mục (`categorySlug`) theo design BL-052 (`list-du-an.webp`): hero (ảnh + chữ `pageHeroes.projects`, ô tìm `q`, "Tìm nhanh") → tab danh mục cấp 1 (icon + số) → cột lọc trái
 * (Tình trạng · Tỉnh/thành · Chủ đầu tư · Mức giá · Loại hình · Tiện ích; < lg là Sheet) | thẻ nổi bật (trang 1) → "N dự án phù hợp" + sắp xếp → lưới 3 cột → phân trang
 * → "Tìm hiểu thêm" + FAQ (`listingPages.projects`) → dải Điểm mạnh (cờ `showProjectStrengths`) → banner tư vấn. Lọc / sắp / trang trên `searchParams`
 * (`?province=a,b&status=&q=&developer=&sort=&type=&feature=&priceMin=&priceMax=&page=`); slug / id lạ bị bỏ (không 404); trang vượt số trang → `notFound()`.
 * Danh mục nằm trong đường dẫn: tab link `/du-an/danh-muc/<slug>`; link cũ `/du-an?category=<slug có thật>` → 308 sang đó (giữ tham số khác). Trang danh mục: danh mục không có /
 * chưa có bản EN → `notFound()`; hero dùng tên + mô tả danh mục (không có mô tả thì không hiện mô tả chung của `/du-an`); FAQ JSON-LD chỉ ở `/du-an` sạch.
 */
export async function ProjectListPage({ locale, searchParams: rawParams, categorySlug }: ProjectListPageProps) {
  const { page, searchParams, filters, context, developers, resolved, listing, roots, hero, strengths, content } = await loadProjectListData(locale, rawParams, categorySlug);
  const [t, tOptions] = await Promise.all([
    getTranslations({ locale, namespace: "page.projects" }),
    getTranslations({ locale, namespace: "listingOptions" }),
  ]);

  const projectsPath = publicPath("/du-an", locale);
  const listPath = categorySlug ? projectCategoryPath(locale, categorySlug) : projectsPath;
  const filterParams = toFilterParams(resolved);
  const sortParam = filters.sort ? { sort: filters.sort } : {};
  const current = Object.fromEntries(new URLSearchParams(projectQueryString({ ...filterParams, ...sortParam })));
  const filtered = Object.keys(current).length > 0;
  const cleanPage = !categorySlug && page === 1 && !hasFilterParams(searchParams);
  const tabLabels: TabLabels = { all: t("all"), count: (count) => t("resultTotal", { count }) };
  const tabHref = (category?: string) => `${category ? projectCategoryPath(locale, category) : projectsPath}${projectQueryString({ ...filterParams, ...sortParam })}`;
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
  const buildHref = (target: number) => `${listPath}${projectQueryString({ ...filterParams, ...sortParam, page: target })}`;

  return (
    <ListPendingProvider>
      <ProjectListHero locale={locale} data={{ hero, content, context, q: filters.q }} listPath={listPath} projectsPath={projectsPath} params={current} />
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
        {...(featuredCards.length > 0 ? { spotlight: <ProjectSpotlight cards={featuredCards} /> } : {})}
        {...(listing.totalDocs > 0 ? { sort: <ProjectSortControl {...(filters.sort ? { value: filters.sort } : {})} /> } : {})}
      >
        <ProjectResults
          locale={locale}
          listPath={listPath}
          filtered={filtered}
          inCategory={categorySlug !== undefined}
          projectsPath={projectsPath}
          total={listing.totalDocs}
          cards={cards}
          page={page}
          totalPages={listing.totalPages}
          buildHref={buildHref}
          priorityFirst={!hero.image && featuredCards.length === 0}
        />
      </ProjectListBody>
      <div className="mx-auto w-full max-w-container px-gutter pb-section-tight empty:hidden">
        <LearnMoreFaq learnMore={toLearnMoreContent(content.learnMore)} faqs={content.faqs} emitJsonLd={cleanPage} />
      </div>
      {strengths ? <StrengthsBlock block={strengths} /> : null}
      <ConsultBanner locale={locale} />
    </ListPendingProvider>
  );
}

export { buildProjectListMetadata } from "./project-list-metadata";
