import config from "@payload-config";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageBanner } from "@/components/layout/PageBanner";
import { Pagination } from "@/components/layout/Pagination";
import { PendingLink } from "@/components/layout/PendingRegion";
import { ActiveFilters, useActiveFilterChips } from "@/components/rentals/ActiveFilters";
import { RentalCard } from "@/components/rentals/RentalCard";
import { RentalFilters } from "@/components/rentals/RentalFilters";
import { RentalSortControl } from "@/components/rentals/RentalSortControl";
import { RentalPendingRegion, RentalListNavigationProvider } from "@/components/rentals/RentalListNavigation";
import { categoryPath, type RentalListPageProps, withoutCategory } from "@/components/rentals/rental-list-metadata";
import { publicPath } from "@/lib/content/content-paths";
import { loadPageBanner } from "@/lib/content/load-page-banner";
import { logger } from "@/lib/logger";
import { visibleCategory } from "@/lib/news/news-view";
import { listProvinces } from "@/lib/projects/project-queries";
import {
  dropUnknownSlugs,
  findRentalCategory,
  listRentalCategoryOptions,
  listWardOptions,
  type RentalFilterOptions,
  searchRentals,
  toProvinceOptions,
} from "@/lib/rentals/rental-list-queries";
import { searchCardToRentalCardData } from "@/lib/rentals/rental-view";
import {
  parseRentalFilters,
  type RawRentalParams,
  type RentalFilters as RentalFilterValues,
  rentalListQueryString,
} from "@/lib/search/url-params";
import type { RentalSearchResult } from "@/shared/types/api";
import type { Locale } from "@/i18n/routing";

/** Tải danh mục + tỉnh + phường (của tỉnh trên URL) và bỏ slug lạ khỏi bộ lọc. Phường chỉ tải khi URL có tỉnh hợp lệ. */
async function loadFilterContext(locale: Locale, parsed: RentalFilterValues) {
  const payload = await getPayload({ config });
  const [categories, provinceDocs] = await Promise.all([listRentalCategoryOptions(payload, locale), listProvinces(payload)]);
  const provinces = toProvinceOptions(provinceDocs);
  const province = provinces.find((item) => item.slug === parsed.province);
  const wards = province ? await listWardOptions(payload, province.id) : [];
  const options: RentalFilterOptions = { categories, provinces, wards, wardsProvince: province?.slug ?? null };
  return { payload, options, filters: dropUnknownSlugs(parsed, options) };
}

/** Lỗi truy vấn không làm sập cả trang: bộ lọc vẫn hiện, khung kết quả báo lỗi + "Thử lại" (design-spec S04 "Lỗi API"). */
async function trySearch(payload: Awaited<ReturnType<typeof getPayload>>, filters: RentalFilterValues, locale: Locale): Promise<RentalSearchResult | null> {
  try {
    return await searchRentals(payload, filters, locale);
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

/**
 * Chip loại hình: "Tất cả" (`/cho-thue`) + danh mục cấp 1, mỗi chip là link tới TRANG DANH MỤC (S05) và giữ các bộ lọc khác, về trang 1.
 * Chip của danh mục cha sáng cả khi đang ở một danh mục con của nó. `filters` không mang `category` (nó nằm trong đường dẫn).
 */
function categoryChips(filters: RentalFilterValues, options: RentalFilterOptions, currentSlug: string | undefined, locale: Locale, allLabel: string) {
  const roots = options.categories.filter((item) => item.depth === 0);
  // `categories` xếp cha rồi các con của nó: danh mục cấp 1 gần nhất ở trước mục đang chọn là cha (hoặc chính nó).
  const currentIndex = options.categories.findIndex((item) => item.slug === currentSlug);
  const currentRoot = options.categories.slice(0, currentIndex + 1).reverse().find((item) => item.depth === 0);
  const query = rentalListQueryString({ ...filters, page: 1 });
  return [
    { label: allLabel, href: `${publicPath("/cho-thue", locale)}${query}`, current: currentSlug === undefined },
    ...roots.map((root) => ({ label: root.label, href: `${categoryPath(locale, root.slug)}${query}`, current: currentRoot?.slug === root.slug })),
  ];
}

/**
 * S04 Danh sách Cho thuê (`/cho-thue`, `/en/for-rent`) và S05 trang danh mục (`categorySlug`): server render qua `SearchService` (một truy vấn SQL cho cả trang), bộ lọc client đổi URL.
 * Trang vượt số trang → `notFound()`. Slug danh mục/tỉnh/phường lạ bị bỏ qua. Đọc `searchParams` nên render theo request (không ISR);
 * CDN giữ HTML theo `Cache-Control` của `next.config.ts`.
 * Trang danh mục: danh mục không có / xoá mềm / chưa có bản EN → `notFound()`; tin lọc theo danh mục + con của nó; banner, breadcrumb, đường dẫn
 * bộ lọc/phân trang/"Xoá tất cả" đều là của trang danh mục.
 */
export async function RentalListPage({ locale, searchParams, categorySlug }: RentalListPageProps) {
  const parsed = parseRentalFilters(searchParams);
  const [{ payload, options, filters }, t, tNav, bannerImage] = await Promise.all([
    loadFilterContext(locale, categorySlug ? withoutCategory(parsed) : parsed),
    getTranslations({ locale, namespace: "page.rentals" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    loadPageBanner(locale, "rentals"),
  ]);
  const category = categorySlug ? await findRentalCategory(payload, locale, categorySlug) : null;
  if (categorySlug && !category) notFound();
  // `filters` = thứ hiện trên URL/bộ lọc (S05: không có `category`, nó nằm trong đường dẫn); `searchFilters` = thứ gửi SearchService.
  const searchFilters: RentalFilterValues = categorySlug ? { ...filters, category: categorySlug } : filters;
  const result = await trySearch(payload, searchFilters, locale);
  if (result && filters.page > 1 && filters.page > result.totalPages) notFound();

  const rentalsPath = publicPath("/cho-thue", locale);
  const listPath = categorySlug ? categoryPath(locale, categorySlug) : rentalsPath;
  const buildHref = (page: number) => `${listPath}${rentalListQueryString(filters, { page })}`;
  const cards = result?.items.map((item) => searchCardToRentalCardData(item, locale)) ?? [];
  const parent = category ? visibleCategory(category.parent, locale) : null;
  const breadcrumb = [
    { label: tNav("rentals"), href: rentalsPath },
    ...(parent ? [{ label: parent.name ?? "", href: categoryPath(locale, parent.slug ?? "") }] : []),
    ...(category ? [{ label: category.name ?? "", href: listPath }] : []),
  ];
  // Danh mục khoá nên bỏ khỏi ô lọc (S05); ô lọc của S04 giữ nguyên.
  const filterOptions: RentalFilterOptions = categorySlug ? { ...options, categories: [] } : options;

  return (
    <>
      <PageBanner
        size="compact"
        title={category?.name ?? t("title")}
        description={category ? (category.description ?? undefined) : t("description")}
        image={bannerImage}
      />
      <RentalListNavigationProvider actionPath={listPath} filters={filters}>
        {/* Băng tìm kiếm đè 3rem lên mép dưới banner (PageBanner compact chừa đúng 3rem). */}
        <div className="relative z-10 mx-auto -mt-12 w-full max-w-container px-gutter">
          <RentalFilters filters={filters} options={filterOptions} fixedCategory={categorySlug} focusSearch={isSearchEntry(searchParams)} />
        </div>
        <Breadcrumb items={breadcrumb} className="py-2" />
        <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-gutter pt-2 pb-section-tight">
          <nav aria-label={t("categoriesLabel")}>
            <ul className="-my-1 flex snap-x snap-mandatory gap-2 overflow-x-auto py-1 pr-8 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pr-0">
              {categoryChips(withoutCategory(filters), options, categorySlug ?? filters.category, locale, t("all")).map((chip) => (
                <li key={chip.href} className="shrink-0 snap-start sm:shrink">
                  <PendingLink
                    href={chip.href}
                    aria-current={chip.current ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-small font-semibold ${chip.current ? "border-dark bg-dark text-on-dark" : "border-border text-text hover:border-input-border"}`}
                  >
                    {chip.label}
                  </PendingLink>
                </li>
              ))}
            </ul>
          </nav>
          <ActiveFilters filters={filters} options={filterOptions} listPath={listPath} />
          <RentalPendingRegion className="flex flex-col gap-6">
            {result ? (
              <ResultList
                result={result}
                cards={cards}
                filters={filters}
                options={filterOptions}
                listPath={listPath}
                locale={locale}
                query={filters.q}
                inCategory={category !== null}
                rentalsPath={rentalsPath}
                buildHref={buildHref}
              />
            ) : (
              <ListError retryHref={`${listPath}${rentalListQueryString(filters)}`} title={t("error.title")} retry={t("error.retry")} />
            )}
          </RentalPendingRegion>
        </div>
      </RentalListNavigationProvider>
    </>
  );
}

interface ResultListProps {
  result: RentalSearchResult;
  cards: ReturnType<typeof searchCardToRentalCardData>[];
  filters: RentalFilterValues;
  options: RentalFilterOptions;
  listPath: string;
  locale: Locale;
  query: string | undefined;
  buildHref: (page: number) => string;
  /** Trang danh mục: trống thật thì nói "trong mục này" + link về `/cho-thue`. */
  inCategory: boolean;
  rentalsPath: string;
}

/** Số kết quả (aria-live) + lưới thẻ + phân trang, hoặc trạng thái trống kèm tối đa 3 gợi ý bỏ bớt điều kiện (design-spec §3.9). */
function ResultList({ result, cards, filters, options, listPath, locale, query, buildHref, inCategory, rentalsPath }: ResultListProps) {
  const t = useTranslations("page.rentals");
  const filtering = rentalListQueryString({ ...filters, page: 1 }) !== "";
  return (
    <>
      <section aria-label={t("gridLabel")} className="flex flex-col gap-6">
        {query && <h2 className="font-display text-h3">{t("resultsFor", { query })}</h2>}
        <div className="flex items-center justify-between gap-4">
          <p role="status" aria-live="polite" className="text-small text-text-secondary">
            {t("resultCount", { count: result.total })}
          </p>
          {result.total > 0 && <RentalSortControl />}
        </div>
        {result.total === 0 ? (
          filtering ? (
            <FilteredEmpty filters={filters} options={options} listPath={listPath} locale={locale} title={t("empty.title")} />
          ) : (
            <EmptyState variant="empty" title={t(inCategory ? "empty.noListingsInCategory" : "empty.noListings")} {...(inCategory ? { backHref: rentalsPath } : {})} />
          )
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => (
              <li key={card.id}>
                <RentalCard data={card} headingLevel={2} priority={index === 0} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <Pagination page={result.page} totalPages={result.totalPages} buildHref={buildHref} />
    </>
  );
}

interface FilteredEmptyProps {
  filters: RentalFilterValues;
  options: RentalFilterOptions;
  listPath: string;
  locale: Locale;
  title: string;
}

const MAX_SUGGESTIONS = 3;

function FilteredEmpty({ filters, options, listPath, locale, title }: FilteredEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <EmptyState variant="filtered" title={title} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
      <Suggestions filters={filters} options={options} listPath={listPath} />
    </div>
  );
}

/** "Bỏ <điều kiện>" cho vài điều kiện lọc đầu tiên: mỗi gợi ý là link thật tới URL đã bỏ điều kiện đó. */
function Suggestions({ filters, options, listPath }: { filters: RentalFilterValues; options: RentalFilterOptions; listPath: string }) {
  const chips = useActiveFilterChips({ filters, options, listPath, limit: MAX_SUGGESTIONS });
  return (
    <ul className="flex flex-wrap justify-center gap-3" data-testid="empty-suggestions">
      {chips.map((chip) => (
        <li key={chip.kind}>
          <PendingLink href={chip.href} scroll={false} className="inline-flex min-h-11 items-center text-small font-semibold underline underline-offset-4">
            {chip.name}
          </PendingLink>
        </li>
      ))}
    </ul>
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
