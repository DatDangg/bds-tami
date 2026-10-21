import config from "@payload-config";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { PendingLink } from "@/components/layout/PendingRegion";
import { ListFilterRow } from "@/components/listing/ListSearchBar";
import { ActiveFilters, useActiveFilterChips } from "@/components/rentals/ActiveFilters";
import { RentalCard } from "@/components/rentals/RentalCard";
import { RentalFilters } from "@/components/rentals/RentalFilters";
import { RentalSortControl } from "@/components/rentals/RentalSortControl";
import { RentalListNavigationProvider } from "@/components/rentals/RentalListNavigation";
import { categoryPath, type RentalListPageProps, withoutCategory } from "@/components/rentals/rental-list-metadata";
import { CategoryChipList, CategoryListTemplate } from "@/components/templates/CategoryListTemplate";
import { publicPath } from "@/lib/content/content-paths";
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
} from "@/lib/rentals/rental-list-queries";
import { searchCardToRentalCardData } from "@/lib/rentals/rental-view";
import {
  parseRentalFilters,
  type RawRentalParams,
  type RentalFilters as RentalFilterValues,
  rentalListQueryString,
} from "@/lib/search/url-params";
import type { RentalListingResult } from "@/lib/search/search-service";
import type { Locale } from "@/i18n/routing";

/** Tải danh mục + tỉnh + dự án (BL-052) + phường (của tỉnh trên URL) và bỏ slug lạ khỏi bộ lọc. Phường chỉ tải khi URL có tỉnh hợp lệ. */
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
 * S04 Danh sách Cho thuê (`/cho-thue`, `/en/for-rent`) và S05 trang danh mục (`categorySlug`) trên `CategoryListTemplate` (BL-045): hero (chữ + ảnh admin; trang danh mục: eyebrow "Cho thuê",
 * tiêu đề + mô tả của danh mục) → thẻ lọc nổi (`RentalFilters`) → hàng "N căn" + "Đang lọc" + sắp xếp → lưới → phân trang → banner tư vấn. Server render qua `SearchService` (một truy vấn SQL cho cả trang),
 * bộ lọc client đổi URL. Trang vượt số trang → `notFound()`. Slug danh mục/tỉnh/phường lạ bị bỏ qua. Đọc `searchParams` nên render theo request (không ISR);
 * CDN giữ HTML theo `Cache-Control` của `next.config.ts`.
 * Trang danh mục: danh mục không có / xoá mềm / chưa có bản EN → `notFound()`; tin lọc theo danh mục + con của nó; hero, breadcrumb, đường dẫn
 * bộ lọc/phân trang/"Xoá bộ lọc" đều là của trang danh mục.
 */
export async function RentalListPage({ locale, searchParams, categorySlug }: RentalListPageProps) {
  const parsed = parseRentalFilters(searchParams);
  const [{ payload, options, filters }, t, tNav, hero] = await Promise.all([
    loadFilterContext(locale, categorySlug ? withoutCategory(parsed) : parsed),
    getTranslations({ locale, namespace: "page.rentals" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    loadPageHero(locale, "rentals"),
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
  // Tạm tới P2-T02 (khung danh sách mới): tin nổi bật (chỉ trang 1, đã bị loại khỏi lưới) đặt đầu lưới để không biến mất khỏi trang.
  const cards = [...(result?.featured ?? []), ...(result?.items ?? [])].map((item) => searchCardToRentalCardData(item, locale));
  const parent = category ? visibleCategory(category.parent, locale) : null;
  const breadcrumb = [
    { label: tNav("rentals"), href: rentalsPath },
    ...(parent ? [{ label: parent.name ?? "", href: categoryPath(locale, parent.slug ?? "") }] : []),
    ...(category ? [{ label: category.name ?? "", href: listPath }] : []),
  ];
  const chips = categoryChips(withoutCategory(filters), options, categorySlug ?? filters.category, locale, t("all"));
  const heroTitle = category?.name ?? hero.title;
  const heroDescription = category ? (category.description ?? undefined) : hero.description;
  const heroEyebrow = category ? tNav("rentals") : hero.eyebrow;

  return (
    <RentalListNavigationProvider actionPath={listPath} filters={filters}>
      <CategoryListTemplate
        title={heroTitle}
        {...(!category && hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
        {...(heroEyebrow ? { eyebrow: heroEyebrow } : {})}
        {...(heroDescription ? { description: heroDescription } : {})}
        {...(hero.image ? { bannerImage: hero.image } : {})}
        breadcrumb={breadcrumb}
        filterCard={
          <RentalFilters
            filters={filters}
            options={options}
            fixedCategory={categorySlug}
            focusSearch={isSearchEntry(searchParams)}
            categoryRow={
              <ListFilterRow label={t("fields.category")}>
                <nav aria-label={t("categoriesLabel")}>
                  <CategoryChipList chips={chips} scroll />
                </nav>
              </ListFilterRow>
            }
          />
        }
        {...(result
          ? {
              resultText: (
                <>
                  {t("resultTotal", { count: result.total })} <span className="text-small font-normal text-text-secondary">{t("resultSuffix")}</span>
                </>
              ),
            }
          : {})}
        resultExtras={<ActiveFilters filters={filters} options={options} listPath={listPath} />}
        {...(result && result.total > 0 ? { sort: <RentalSortControl /> } : {})}
        parentListHref={rentalsPath}
        isEmpty={!result || result.total === 0}
        emptyState={
          result ? (
            <EmptyResults filters={filters} options={options} listPath={listPath} locale={locale} query={filters.q} inCategory={category !== null} rentalsPath={rentalsPath} />
          ) : (
            <ListError retryHref={`${listPath}${rentalListQueryString(filters)}`} title={t("error.title")} retry={t("error.retry")} />
          )
        }
        pagination={{ page: result?.page ?? 1, totalPages: result?.totalPages ?? 1, buildHref }}
        consultBanner={<ConsultBanner locale={locale} />}
      >
        <section aria-label={t("gridLabel")} className="flex flex-col gap-6">
          {filters.q && <h2 className="font-display text-h3">{t("resultsFor", { query: filters.q })}</h2>}
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => (
              <li key={card.id}>
                <RentalCard data={card} headingLevel={2} priority={index === 0} />
              </li>
            ))}
          </ul>
        </section>
      </CategoryListTemplate>
    </RentalListNavigationProvider>
  );
}

interface EmptyResultsProps {
  filters: RentalFilterValues;
  options: RentalFilterOptions;
  listPath: string;
  locale: Locale;
  query: string | undefined;
  /** Trang danh mục: trống thật thì nói "trong mục này" + link về `/cho-thue`. */
  inCategory: boolean;
  rentalsPath: string;
}

/** Trạng thái trống: có lọc → "Chưa có kết quả" + tối đa 3 gợi ý bỏ bớt điều kiện (design-spec §3.9); không lọc → chưa có tin nào. */
function EmptyResults({ filters, options, listPath, locale, query, inCategory, rentalsPath }: EmptyResultsProps) {
  const t = useTranslations("page.rentals");
  const filtering = rentalListQueryString({ ...filters, page: 1 }) !== "";
  return (
    <section aria-label={t("gridLabel")} className="flex flex-col gap-6">
      {query && <h2 className="font-display text-h3">{t("resultsFor", { query })}</h2>}
      {filtering ? (
        <FilteredEmpty filters={filters} options={options} listPath={listPath} locale={locale} title={t("empty.title")} />
      ) : (
        <EmptyState variant="empty" title={t(inCategory ? "empty.noListingsInCategory" : "empty.noListings")} {...(inCategory ? { backHref: rentalsPath } : {})} />
      )}
    </section>
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
