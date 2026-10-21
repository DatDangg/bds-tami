import config from "@payload-config";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { StrengthsBlock } from "@/components/home/StrengthsBlock";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { Pagination } from "@/components/layout/Pagination";
import { ListPendingProvider, PendingLink } from "@/components/layout/PendingRegion";
import { LearnMoreFaq } from "@/components/listing/LearnMoreFaq";
import { ListingCategoryTabs } from "@/components/listing/ListingCategoryTabs";
import { ListingHero } from "@/components/listing/ListingHero";
import { countActiveFilters } from "@/components/listing/listing-params";
import { SpotlightSlider } from "@/components/listing/SpotlightSlider";
import { FocusListingSearch } from "@/components/rentals/FocusListingSearch";
import { RentalCard } from "@/components/rentals/RentalCard";
import { RentalListBody } from "@/components/rentals/RentalListBody";
import { RentalSortControl } from "@/components/rentals/RentalSortControl";
import { RentalSpotlightContent } from "@/components/rentals/RentalSpotlightContent";
import { categoryPath, type RentalListPageProps, withoutCategory } from "@/components/rentals/rental-list-metadata";
import { buildCategoryTabs, RENTAL_ACTIVE_FILTER_SPEC, toCurrentParams, toFilterOptions, toFilterValues, toPreservedParams } from "@/components/rentals/rental-list-state";
import { useActiveFilterChips } from "@/components/rentals/use-active-filter-chips";
import { publicPath } from "@/lib/content/content-paths";
import { loadListingPageContent, type ListingLearnMoreView } from "@/lib/content/load-listing-page";
import { loadListingStrengths } from "@/lib/content/load-listing-strengths";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { logger } from "@/lib/logger";
import { visibleCategory } from "@/lib/news/news-view";
import { listProvinces } from "@/lib/projects/project-queries";
import {
  dropUnknownSlugs,
  findRentalCategory,
  listRentalCategoryOptions,
  listRentalProjectOptions,
  listRentals,
  listWardOptions,
  type RentalFilterOptions,
  toProvinceOptions,
  toRentalProvinceFacets,
} from "@/lib/rentals/rental-list-queries";
import { type RentalCardData, searchCardToRentalCardData } from "@/lib/rentals/rental-view";
import { parseRentalFilters, type RawRentalParams, type RentalFilters as RentalFilterValues, rentalListQueryString } from "@/lib/search/url-params";
import type { RentalListingResult } from "@/lib/search/search-service";
import type { Locale } from "@/i18n/routing";
import type { Category } from "@/payload-types";

/** Ảnh thẻ lưới khi có cột lọc trái (như `/du-an`): ≥ xl ~300px, lg 3 cột trong ~70% khung, md 2 cột. */
const GRID_CARD_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw";

/** Tải danh mục + tỉnh + dự án + phường (của tỉnh trên URL) và bỏ slug lạ khỏi bộ lọc. Phường chỉ tải khi URL có tỉnh hợp lệ. */
async function loadFilterContext(locale: Locale, parsed: RentalFilterValues) {
  const payload = await getPayload({ config });
  const [categories, provinceDocs, projects] = await Promise.all([listRentalCategoryOptions(payload, locale), listProvinces(payload), listRentalProjectOptions(payload, locale)]);
  const provinces = toProvinceOptions(provinceDocs);
  const province = provinces.find((item) => item.slug === parsed.province);
  const wards = province ? await listWardOptions(payload, province.id) : [];
  const options: RentalFilterOptions = { categories, provinces, wards, wardsProvince: province?.slug ?? null, projects };
  return { payload, options, filters: dropUnknownSlugs(parsed, options) };
}

/** Lỗi truy vấn không làm sập cả trang: bộ lọc vẫn hiện, khung kết quả báo lỗi + "Thử lại" (design-spec S04 "Lỗi API"). */
async function trySearch(payload: Awaited<ReturnType<typeof getPayload>>, filters: RentalFilterValues, locale: Locale): Promise<RentalListingResult | null> {
  try {
    return await listRentals(payload, filters, locale);
  } catch (error) {
    logger.error({ err: error }, "Không tải được danh sách tin cho thuê");
    return null;
  }
}

/** `?q=` có mặt nhưng rỗng: link từ nút tìm kiếm của header (`searchHrefFor`), người dùng chưa gõ gì. */
function isSearchEntry(searchParams: RawRentalParams): boolean {
  const q = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  return q !== undefined && q.trim() === "";
}

function toLearnMoreContent(view: ListingLearnMoreView | null) {
  if (!view) return null;
  return { eyebrow: view.eyebrow ?? null, title: view.title, titleAccent: view.titleAccent ?? null, description: view.description ?? null, image: view.image ?? null, videoUrl: view.videoUrl ?? null, cta: view.cta ?? null };
}

/** Đọc + đối chiếu tham số, tải bộ lọc / danh mục / kết quả / hero / Tìm hiểu thêm / Điểm mạnh. Danh mục (S05) không có hoặc trang vượt số trang → `notFound()`. */
async function loadRentalListData(locale: Locale, searchParams: RawRentalParams, categorySlug: string | undefined) {
  const parsed = parseRentalFilters(searchParams);
  const [{ payload, options, filters }, hero, content, strengths] = await Promise.all([
    loadFilterContext(locale, categorySlug ? withoutCategory(parsed) : parsed),
    loadPageHero(locale, "rentals"),
    loadListingPageContent(locale, "rentals"),
    loadListingStrengths(locale, "rentals"),
  ]);
  const category = categorySlug ? await findRentalCategory(payload, locale, categorySlug) : null;
  if (categorySlug && !category) notFound();
  // `filters` = thứ hiện trên URL/bộ lọc (S05: không có `category`, nó nằm trong đường dẫn); gửi SearchService thì thêm danh mục của đường dẫn.
  const result = await trySearch(payload, categorySlug ? { ...filters, category: categorySlug } : filters, locale);
  if (result && filters.page > 1 && filters.page > result.totalPages) notFound();
  return { parsed, options, filters, category, result, hero, content, strengths };
}

/**
 * S04 `/cho-thue` (`/en/for-rent`) và S05 trang danh mục (`categorySlug`) theo khung danh sách BL-052 (cùng `/du-an`): hero (ảnh + chữ `pageHeroes.rentals`; trang danh mục:
 * eyebrow "Cho thuê", tiêu đề + mô tả của danh mục) + ô tìm `q` + "Tìm nhanh" (`listingPages.rentals`) → tab danh mục cấp 1 (link route danh mục, số đếm) → cột lọc trái
 * (< lg là Sheet) | thẻ nổi bật (trang 1) → "N căn phù hợp" + sắp xếp → lưới 3 cột → phân trang → "Tìm hiểu thêm" + FAQ → dải Điểm mạnh (cờ `showStrengths`) → banner tư vấn.
 * Link cũ `/cho-thue?category=<slug>` (ô tìm kiếm trang chủ) vẫn lọc theo danh mục đó và đánh dấu tab của nó. Slug danh mục/tỉnh/phường/dự án lạ bị bỏ; trang vượt số trang
 * → `notFound()`. Trang danh mục: danh mục không có / xoá mềm / chưa có bản EN → `notFound()`. Đọc `searchParams` nên render theo request (không ISR).
 */
export async function RentalListPage({ locale, searchParams, categorySlug }: RentalListPageProps) {
  const { parsed, options, filters, category, result, hero, content, strengths } = await loadRentalListData(locale, searchParams, categorySlug);
  const t = await getTranslations({ locale, namespace: "page.rentals" });

  const rentalsPath = publicPath("/cho-thue", locale);
  const listPath = categorySlug ? categoryPath(locale, categorySlug) : rentalsPath;
  const current = toCurrentParams(filters);
  const otherFilters = rentalListQueryString({ ...withoutCategory(filters), page: 1 });
  const tabs = buildCategoryTabs({
    options,
    facets: result?.facets ?? null,
    currentSlug: categorySlug ?? filters.category,
    allLabel: t("all"),
    countLabel: (count) => t("resultTotal", { count }),
    href: (slug) => `${slug ? categoryPath(locale, slug) : rentalsPath}${otherFilters}`,
  });
  const provinceFacets = toRentalProvinceFacets(options.provinces, result?.facets.provinces ?? []);
  const featuredCards = (result?.featured ?? []).map((item) => searchCardToRentalCardData(item, locale));
  const cards = (result?.items ?? []).map((item) => searchCardToRentalCardData(item, locale));

  return (
    <ListPendingProvider>
      <RentalListHero hero={hero} category={category} locale={locale} listPath={listPath} rentalsPath={rentalsPath} query={filters.q} current={current} quickSearch={content.quickSearch} />
      {isSearchEntry(searchParams) && <FocusListingSearch />}
      <ListingCategoryTabs label={t("categoriesLabel")} tabs={tabs} />
      <RentalListBody
        path={listPath}
        current={current}
        values={toFilterValues(filters)}
        options={toFilterOptions(options, provinceFacets, filters.province, result?.facets.amenities ?? null)}
        preservedParams={toPreservedParams(current)}
        activeCount={countActiveFilters(current, RENTAL_ACTIVE_FILTER_SPEC)}
        clearHref={listPath}
        {...(result ? { countLabel: t("resultTotal", { count: result.total }) } : {})}
        {...(featuredCards.length > 0 ? { spotlight: <RentalSpotlight cards={featuredCards} /> } : {})}
        {...(result && result.total > 0 ? { sort: <RentalSortControl value={filters.sort} /> } : {})}
      >
        {!result ? (
          <ListError retryHref={`${listPath}${rentalListQueryString(filters)}`} title={t("error.title")} retry={t("error.retry")} />
        ) : result.total === 0 ? (
          <EmptyResults filters={filters} options={options} listPath={listPath} locale={locale} inCategory={category !== null} rentalsPath={rentalsPath} />
        ) : (
          <RentalGrid cards={cards} priorityFirst={!hero.image && featuredCards.length === 0} page={result.page} totalPages={result.totalPages} buildHref={(page) => `${listPath}${rentalListQueryString(filters, { page })}`} />
        )}
      </RentalListBody>
      {/* FAQ JSON-LD chỉ ở trang sạch `/cho-thue` (trang 1, URL không tham số nào — kể cả slug lạ bị bỏ, để không lệch noindex của metadata): trang danh mục cũng hiện khối nhưng không phát lặp `FAQPage`. */}
      <div className="mx-auto w-full max-w-container px-gutter pb-section-tight empty:hidden">
        <LearnMoreFaq learnMore={toLearnMoreContent(content.learnMore)} faqs={content.faqs} emitJsonLd={!categorySlug && rentalListQueryString(parsed) === ""} />
      </div>
      {strengths ? <StrengthsBlock block={strengths} /> : null}
      <ConsultBanner locale={locale} />
    </ListPendingProvider>
  );
}

interface RentalListHeroProps {
  hero: Awaited<ReturnType<typeof loadPageHero>>;
  /** Trang danh mục (S05): eyebrow "Cho thuê", tiêu đề + mô tả của danh mục, breadcrumb thêm danh mục cha + danh mục. */
  category: Category | null;
  locale: Locale;
  listPath: string;
  rentalsPath: string;
  query: string | undefined;
  current: Record<string, string>;
  quickSearch: string[];
}

/** Hero (ảnh + chữ `pageHeroes.rentals`; trang danh mục dùng chữ của danh mục) + breadcrumb + ô tìm `q` + "Tìm nhanh". */
function RentalListHero({ hero, category, locale, listPath, rentalsPath, query, current, quickSearch }: RentalListHeroProps) {
  const t = useTranslations("page.rentals");
  const tNav = useTranslations("layout.nav.items");
  const parent = category ? visibleCategory(category.parent, locale) : null;
  const breadcrumb = [
    { label: tNav("rentals"), href: rentalsPath },
    ...(parent ? [{ label: parent.name ?? "", href: categoryPath(locale, parent.slug ?? "") }] : []),
    ...(category ? [{ label: category.name ?? "", href: listPath }] : []),
  ];
  const description = category ? (category.description ?? undefined) : hero.description;
  const eyebrow = category ? tNav("rentals") : hero.eyebrow;
  return (
    <ListingHero
      title={category?.name ?? hero.title}
      {...(!category && hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
      {...(eyebrow ? { eyebrow } : {})}
      {...(description ? { description } : {})}
      {...(hero.image ? { image: hero.image } : {})}
      breadcrumb={<Breadcrumb variant="overlay" items={breadcrumb} />}
      search={{ action: listPath, ...(query ? { value: query } : {}), placeholder: t("fields.qPlaceholder"), preservedParams: current }}
      quickSearch={quickSearch}
    />
  );
}

/** Thẻ nổi bật (trang 1): tin `isFeatured` còn trống khớp lọc. */
function RentalSpotlight({ cards }: { cards: RentalCardData[] }) {
  const t = useTranslations("page.rentals");
  return <SpotlightSlider label={t("spotlight.label")} badge={t("spotlight.label")} items={cards.map((card) => ({ id: card.id, image: card.cover, content: <RentalSpotlightContent data={card} /> }))} />;
}

interface RentalGridProps {
  cards: RentalCardData[];
  /** Thẻ đầu là ảnh LCP (hero không có ảnh và không có thẻ nổi bật). */
  priorityFirst: boolean;
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

/** Lưới 3 cột (tiêu đề thẻ `h2`) + phân trang. */
function RentalGrid({ cards, priorityFirst, page, totalPages, buildHref }: RentalGridProps) {
  const t = useTranslations("page.rentals");
  return (
    <>
      {cards.length > 0 && (
        <section aria-label={t("gridLabel")}>
          <ul data-grid-max-cols="3" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <li key={card.id}>
                {/* Ảnh LCP là ảnh hero; thẻ đầu chỉ ưu tiên khi hero không có ảnh và không có thẻ nổi bật. */}
                <RentalCard data={card} headingLevel={2} imageSizes={GRID_CARD_SIZES} priority={priorityFirst && index === 0} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </>
  );
}

interface EmptyResultsProps {
  filters: RentalFilterValues;
  options: RentalFilterOptions;
  listPath: string;
  locale: Locale;
  /** Trang danh mục: trống thật thì nói "trong mục này" + link về `/cho-thue`. */
  inCategory: boolean;
  rentalsPath: string;
}

/** Số gợi ý "bỏ bớt điều kiện" tối đa (design-spec §3.9). */
const MAX_SUGGESTIONS = 3;

/** Trạng thái trống: có lọc → "Không tìm thấy" + Xoá bộ lọc + Nhận tư vấn + tối đa 3 gợi ý bỏ điều kiện; không lọc → chưa có tin nào. */
function EmptyResults({ filters, options, listPath, locale, inCategory, rentalsPath }: EmptyResultsProps) {
  const t = useTranslations("page.rentals");
  const chips = useActiveFilterChips({ filters, options, listPath, limit: MAX_SUGGESTIONS });
  if (rentalListQueryString({ ...filters, page: 1 }) === "") {
    return <EmptyState variant="empty" title={t(inCategory ? "empty.noListingsInCategory" : "empty.noListings")} {...(inCategory ? { backHref: rentalsPath } : {})} />;
  }
  return (
    <div className="flex flex-col items-center gap-2">
      <EmptyState variant="filtered" title={t("empty.title")} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
      <ul className="flex flex-wrap justify-center gap-3" data-testid="empty-suggestions">
        {chips.map((chip) => (
          <li key={chip.kind}>
            <PendingLink href={chip.href} scroll={false} className="inline-flex min-h-11 items-center text-small font-semibold underline underline-offset-4">
              {chip.name}
            </PendingLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListError({ retryHref, title, retry }: { retryHref: string; title: string; retry: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-sm bg-error-subtle p-6">
      <p className="font-semibold">{title}</p>
      <PendingLink href={retryHref} className="inline-flex min-h-11 items-center text-small font-semibold underline underline-offset-4">
        {retry}
      </PendingLink>
    </div>
  );
}

export { buildRentalListMetadata } from "./rental-list-metadata";
