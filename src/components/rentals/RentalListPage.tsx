import config from "@payload-config";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageBanner } from "@/components/layout/PageBanner";
import { Pagination } from "@/components/layout/Pagination";
import { ActiveFilters, useActiveFilterChips } from "@/components/rentals/ActiveFilters";
import { RentalCard } from "@/components/rentals/RentalCard";
import { RentalFilters } from "@/components/rentals/RentalFilters";
import { PendingRegion, RentalListNavigationProvider } from "@/components/rentals/RentalListNavigation";
import { publicPath } from "@/lib/content/content-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { listProvinces } from "@/lib/projects/project-queries";
import {
  dropUnknownSlugs,
  listRentalCategoryOptions,
  listWardOptions,
  type RentalFilterOptions,
  searchRentals,
  toProvinceOptions,
} from "@/lib/rentals/rental-list-queries";
import { searchCardToRentalCardData } from "@/lib/rentals/rental-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  hasNarrowingParams,
  parseRentalFilters,
  type RawRentalParams,
  type RentalFilters as RentalFilterValues,
  rentalListQueryString,
} from "@/lib/search/url-params";
import type { RentalSearchResult } from "@/shared/types/api";
import type { Locale } from "@/i18n/routing";

interface RentalListPageProps {
  locale: Locale;
  searchParams: RawRentalParams;
}

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

/** Chip loại hình: "Tất cả" + danh mục cấp 1, giữ các bộ lọc khác, về trang 1. Chip của danh mục cha sáng cả khi đang lọc một danh mục con của nó. */
function categoryChips(filters: RentalFilterValues, options: RentalFilterOptions, listPath: string, allLabel: string) {
  const roots = options.categories.filter((item) => item.depth === 0);
  // `categories` xếp cha rồi các con của nó: danh mục cấp 1 gần nhất ở trước mục đang chọn là cha (hoặc chính nó).
  const currentIndex = options.categories.findIndex((item) => item.slug === filters.category);
  const currentRoot = options.categories.slice(0, currentIndex + 1).reverse().find((item) => item.depth === 0);
  const hrefFor = (category: string | undefined) => {
    const next: RentalFilterValues = { ...filters, page: 1 };
    if (category) next.category = category;
    else delete next.category;
    return `${listPath}${rentalListQueryString(next)}`;
  };
  return [
    { label: allLabel, href: hrefFor(undefined), current: filters.category === undefined },
    ...roots.map((root) => ({ label: root.label, href: hrefFor(root.slug), current: currentRoot?.slug === root.slug })),
  ];
}

/**
 * S04 Danh sách Cho thuê (`/cho-thue`, `/en/for-rent`): server render qua `SearchService` (một truy vấn SQL cho cả trang), bộ lọc client đổi URL.
 * Trang vượt số trang → `notFound()`. Slug danh mục/tỉnh/phường lạ bị bỏ qua. Đọc `searchParams` nên render theo request (không ISR);
 * CDN giữ HTML theo `Cache-Control` của `next.config.ts`.
 */
export async function RentalListPage({ locale, searchParams }: RentalListPageProps) {
  const parsed = parseRentalFilters(searchParams);
  const [{ payload, options, filters }, t, tNav] = await Promise.all([
    loadFilterContext(locale, parsed),
    getTranslations({ locale, namespace: "page.rentals" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
  ]);
  const result = await trySearch(payload, filters, locale);
  if (result && filters.page > 1 && filters.page > result.totalPages) notFound();

  const listPath = publicPath("/cho-thue", locale);
  const buildHref = (page: number) => `${listPath}${rentalListQueryString(filters, { page })}`;
  const cards = result?.items.map((item) => searchCardToRentalCardData(item, locale)) ?? [];

  return (
    <>
      <PageBanner title={t("title")} description={t("description")} />
      <Breadcrumb items={[{ label: tNav("rentals"), href: listPath }]} className="py-2" />
      <RentalListNavigationProvider actionPath={listPath}>
        <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-gutter pt-4 pb-section-tight">
          <nav aria-label={t("categoriesLabel")}>
            <ul className="-my-1 flex snap-x snap-mandatory gap-2 overflow-x-auto py-1 pr-8 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pr-0">
              {categoryChips(filters, options, listPath, t("all")).map((chip) => (
                <li key={chip.href} className="shrink-0 snap-start sm:shrink">
                  <Link
                    href={chip.href}
                    aria-current={chip.current ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-small font-semibold ${chip.current ? "border-dark bg-dark text-on-dark" : "border-border text-text hover:border-input-border"}`}
                  >
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <RentalFilters filters={filters} options={options} focusSearch={isSearchEntry(searchParams)} />
          <ActiveFilters filters={filters} options={options} listPath={listPath} />
          <PendingRegion className="flex flex-col gap-6">
            {result ? (
              <ResultList
                result={result}
                cards={cards}
                filters={filters}
                options={options}
                listPath={listPath}
                locale={locale}
                query={filters.q}
                buildHref={buildHref}
              />
            ) : (
              <ListError retryHref={`${listPath}${rentalListQueryString(filters)}`} title={t("error.title")} retry={t("error.retry")} />
            )}
          </PendingRegion>
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
}

/** Số kết quả (aria-live) + lưới thẻ + phân trang, hoặc trạng thái trống kèm tối đa 3 gợi ý bỏ bớt điều kiện (design-spec §3.9). */
function ResultList({ result, cards, filters, options, listPath, locale, query, buildHref }: ResultListProps) {
  const t = useTranslations("page.rentals");
  const filtering = rentalListQueryString({ ...filters, page: 1 }) !== "";
  return (
    <>
      <section aria-label={t("gridLabel")} className="flex flex-col gap-6">
        {query && <h2 className="font-display text-h3">{t("resultsFor", { query })}</h2>}
        <p role="status" aria-live="polite" className="text-small text-text-secondary">
          {t("resultCount", { count: result.total })}
        </p>
        {result.total === 0 ? (
          filtering ? (
            <FilteredEmpty filters={filters} options={options} listPath={listPath} locale={locale} title={t("empty.title")} />
          ) : (
            <EmptyState variant="empty" title={t("empty.noListings")} />
          )
        ) : (
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
          <Link href={chip.href} scroll={false} className="inline-flex min-h-11 items-center text-small font-semibold underline underline-offset-4">
            {chip.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ListError({ retryHref, title, retry }: { retryHref: string; title: string; retry: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-sm bg-error-subtle p-6">
      <p className="font-semibold">{title}</p>
      <Link href={retryHref} className="inline-flex min-h-11 items-center text-small font-semibold underline underline-offset-4">
        {retry}
      </Link>
    </div>
  );
}

/**
 * `generateMetadata` của `/cho-thue` (design-spec S04). Trang gốc, trang chỉ lọc MỘT danh mục hoặc MỘT tỉnh: index, canonical là chính nó
 * (kèm `?page=n`). Tổ hợp lọc sâu hơn hoặc đổi sắp xếp: `noindex, follow` và canonical về trang gốc sạch. Không tra danh mục/tỉnh nên không
 * lặp truy vấn của trang; slug lạ chỉ làm trang noindex-hoặc-index theo tham số thô.
 */
export async function buildRentalListMetadata({ locale, searchParams }: RentalListPageProps): Promise<Metadata> {
  const filters = parseRentalFilters(searchParams);
  const noindex = hasNarrowingParams(filters);
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.rentals" }), loadSiteIdentity(locale)]);
  const query = noindex ? "" : rentalListQueryString(filters);
  // Slug danh mục/tỉnh khác nhau theo ngôn ngữ: trang lọc không khai hreflang (hasEnglish=false), chỉ canonical về chính nó.
  const filtered = query.includes("category=") || query.includes("province=");
  const pathFor = (target: Locale) => `${publicPath("/cho-thue", target)}${query}`;
  return buildPageMetadata({
    locale,
    siteName: identity.siteName,
    defaultImage: identity.logo,
    forceNoindex: noindex,
    title: t("title"),
    description: t("description"),
    paths: { vi: pathFor("vi"), en: pathFor("en") },
    hasEnglish: !filtered,
  });
}
