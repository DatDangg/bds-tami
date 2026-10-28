import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload, type Payload } from "payload";
import { useId } from "react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { EmptyState } from "@/components/layout/EmptyState";
import { Pagination } from "@/components/layout/Pagination";
import { ListPendingProvider } from "@/components/layout/PendingRegion";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { LeadForm } from "@/components/leads/LeadForm";
import { ListingHero } from "@/components/listing/ListingHero";
import { NewsListBody } from "@/components/news/NewsListBody";
import { NewsMostRead } from "@/components/news/NewsMostRead";
import { NewsSortControl } from "@/components/news/NewsSortControl";
import { NewsTopics } from "@/components/news/NewsTopics";
import { NewsletterSignup } from "@/components/news/NewsletterSignup";
import { CategoryChipList } from "@/components/templates/CategoryListTemplate";
import { publicPath } from "@/lib/content/content-paths";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { loadMostReadNews, type MostReadNewsItem } from "@/lib/news/most-read";
import { isFilteredNews, newsCurrentParams, newsQueryString, parseNewsFilters, type RawNewsParams } from "@/lib/news/news-filters";
import { buildNewsChips, categoryFilterIds, loadNewsCategoryContext, loadNewsListing } from "@/lib/news/news-listing";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { listTopNewsTags } from "@/lib/news/news-search";
import { categoryHref } from "@/lib/news/news-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

interface NewsListPageProps {
  locale: Locale;
  searchParams: RawNewsParams;
  /** Slug danh mục (trang S05); bỏ trống = `/tin-tuc` (S10). */
  categorySlug?: string;
}

/** `/tin-tuc?page=2` · trang 1 không kèm tham số (canonical sạch, không trùng nội dung). */
function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/** Khối phụ của cột phải (Được quan tâm nhiều, Chủ đề) lỗi DB → ẩn khối, không vỡ trang (P1-T03 review); lỗi vẫn vào log. */
async function orEmpty<T>(payload: Payload, label: string, load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch (error) {
    payload.logger.error({ err: error }, `Không tải được khối ${label} của /tin-tuc`);
    return [];
  }
}

/** Danh mục (route) → danh sách + chip + hero + cột phải, song song. Danh mục không có / chưa có bản EN và trang vượt số trang → `notFound()`. */
async function loadNewsListData(locale: Locale, searchParams: RawNewsParams, categorySlug: string | undefined, allLabel: string) {
  const { page } = parsePagination(searchParams.page, undefined);
  const filters = parseNewsFilters(searchParams, locale);
  const payload = await getPayload({ config });
  const context = categorySlug ? await loadNewsCategoryContext(payload, locale, categorySlug) : null;
  if (categorySlug && !context) notFound();
  const [listing, hero, chips, mostRead, topTags] = await Promise.all([
    loadNewsListing(payload, locale, { page, filters, ...(context ? { categoryIds: categoryFilterIds(context) } : {}) }),
    loadPageHero(locale, "news"),
    buildNewsChips(payload, locale, allLabel, context),
    orEmpty<MostReadNewsItem>(payload, "Được quan tâm nhiều", () => loadMostReadNews(locale)),
    orEmpty<string>(payload, "Chủ đề", () => listTopNewsTags(payload, locale)),
  ]);
  if (listing.outOfRange) notFound();
  return { page, filters, context, listing, hero, chips, mostRead, topTags };
}

/**
 * S10 `/tin-tuc` và S05 `/tin-tuc/danh-muc/[category]` theo design `tin-tuc.webp` (BL-054): hero danh sách (`ListingHero`, ảnh + chữ `pageHeroes.news`; trang danh mục:
 * tên + mô tả danh mục) + ô tìm `q` (không hàng "Tìm nhanh") → chip danh mục (link, `aria-current`) → khối nổi bật (trang 1, không lọc) → "Bài viết mới nhất" + sắp xếp
 * → lưới 3 cột → phân trang | cột phải "Bản tin thị trường" / "Được quan tâm nhiều" / "Chủ đề" (`/en` ẩn) → form "Tư vấn nhu cầu" (chỉ `/tin-tuc`, không ở danh mục) → banner tư vấn.
 * Có `q` / `tag` / `sort=oldest` → ẩn khối nổi bật, hiện "N bài viết phù hợp" + trạng thái trống có nút xoá lọc. Đọc `searchParams` nên render theo request (không ISR).
 */
export async function NewsListPage({ locale, searchParams, categorySlug }: NewsListPageProps) {
  const [t, tV2, tNav] = await Promise.all([
    getTranslations({ locale, namespace: "page.news" }),
    getTranslations({ locale, namespace: "page.news.v2" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
  ]);
  const { page, filters, context, listing, hero, chips, mostRead, topTags } = await loadNewsListData(locale, searchParams, categorySlug, t("all"));
  const turnstileSiteKey = readTurnstileSiteKey();
  const filtered = isFilteredNews(filters);
  const current = newsCurrentParams(filters);

  const listPath = publicPath("/tin-tuc", locale);
  const ownPath = context ? categoryHref(context.category, locale) : listPath;
  const breadcrumb = [
    { label: tNav("news"), href: listPath },
    ...(context?.parent ? [{ label: context.parent.name ?? "", href: categoryHref(context.parent, locale) }] : []),
    ...(context ? [{ label: context.category.name ?? "", href: ownPath }] : []),
  ];
  // Trang danh mục: tiêu đề/mô tả của danh mục, eyebrow = tên trang; `/tin-tuc`: chữ hero admin nhập.
  const heroText = context
    ? { title: context.category.name ?? hero.title, eyebrow: t("title"), description: context.category.description ?? undefined, titleAccent: undefined }
    : hero;
  const emptyState = !listing.isEmpty ? undefined : filtered ? (
    <EmptyState variant="filtered" title={tV2("emptyTitle")} description={tV2("emptyDescription")} clearFiltersHref={ownPath} />
  ) : (
    <EmptyState variant="empty" {...(context ? { backHref: listPath } : {})} />
  );

  return (
    <ListPendingProvider>
      <ListingHero
        title={heroText.title}
        {...(heroText.titleAccent ? { titleAccent: heroText.titleAccent } : {})}
        {...(heroText.eyebrow ? { eyebrow: heroText.eyebrow } : {})}
        {...(heroText.description ? { description: heroText.description } : {})}
        {...(hero.image ? { image: hero.image } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={breadcrumb} />}
        search={{ action: ownPath, ...(filters.q ? { value: filters.q } : {}), placeholder: tV2("searchPlaceholder"), preservedParams: current }}
      />
      <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter pt-6 pb-section-tight">
        {chips.length > 0 && (
          <nav aria-label={t("tabsLabel")} className="border-b border-border pb-4">
            <CategoryChipList chips={chips} scroll />
          </nav>
        )}
        <NewsListBody
          featured={listing.featured}
          items={listing.items}
          {...(filtered ? { resultLabel: tV2("resultTotal", { count: listing.totalDocs }) } : {})}
          {...(listing.isEmpty && !filtered ? {} : { sort: <NewsSortControl path={ownPath} current={current} value={filters.sort} /> })}
          {...(emptyState ? { emptyState } : {})}
          pagination={<Pagination page={page} totalPages={listing.totalPages} buildHref={(target) => `${ownPath}${newsQueryString(filters, target)}`} />}
          sidebar={
            <>
              <NewsletterSignup {...(turnstileSiteKey ? { turnstileSiteKey } : {})} />
              <NewsMostRead items={mostRead} />
              <NewsTopics tags={topTags} listPath={listPath} currentTag={filters.tag} />
            </>
          }
        />
      </div>
      {context ? null : <ConsultSection title={t("consultTitle")} turnstileSiteKey={turnstileSiteKey} />}
      <ConsultBanner locale={locale} />
    </ListPendingProvider>
  );
}

/**
 * Form "Tư vấn nhu cầu" cuối `/tin-tuc` (nguồn `contact`, cùng LeadForm của trang Liên hệ): thẻ trắng bo 20px rộng tối đa 42rem canh giữa khung nội dung (BL-098), đầu khối canh trái (`SectionHeading`).
 * `id="lead-form"` giữ làm đích cuộn như `LeadFormSlot`.
 */
function ConsultSection({ title, turnstileSiteKey }: { title: string; turnstileSiteKey: string | undefined }) {
  const headingId = useId();
  return (
    <section id="lead-form" aria-labelledby={headingId} className="mx-auto w-full max-w-container scroll-mt-[calc(var(--sticky-top)+1rem)] px-gutter pb-section-tight">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-border bg-surface p-6 lg:p-8">
        <SectionHeading id={headingId} title={title} />
        <LeadForm source="contact" {...(turnstileSiteKey ? { turnstileSiteKey } : {})} />
      </div>
    </section>
  );
}

/**
 * `generateMetadata` của hai trang danh sách. Có `q` / `tag` / `sort` khác mặc định (`isFilteredNews`; `/en` bỏ qua `tag`) → `noindex, follow` + canonical về trang sạch
 * (không `?page`), cùng quy tắc lọc BL-052. Không lọc: canonical chính nó (kèm `?page=n` ở trang ≥ 2). Danh mục không có → metadata rỗng (trang tự `notFound()`).
 */
export async function buildNewsListMetadata({ locale, searchParams, categorySlug }: NewsListPageProps): Promise<Metadata> {
  const { page } = parsePagination(searchParams.page, undefined);
  const filtered = isFilteredNews(parseNewsFilters(searchParams, locale));
  const pageFor = (path: string) => (filtered ? path : withPage(path, page));
  const payload = await getPayload({ config });
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.news" }), loadSiteIdentity(locale)]);
  const common = { locale, siteName: identity.siteName, defaultImage: identity.logo, forceNoindex: filtered };

  if (!categorySlug) {
    return buildPageMetadata({
      ...common,
      title: t("title"),
      description: t("description"),
      paths: { vi: pageFor(publicPath("/tin-tuc", "vi")), en: pageFor(publicPath("/tin-tuc", "en")) },
      hasEnglish: true,
    });
  }
  const context = await loadNewsCategoryContext(payload, locale, categorySlug);
  if (!context) return {};
  const { category } = context;
  const slugs = await findLocalizedSlugs(payload, "categories", category.id);
  const hasEnglish = category.hasEnglish === true && Boolean(slugs.en);
  const pathFor = (target: Locale, slug: string) => pageFor(publicPath("/tin-tuc/danh-muc/[category]", target, { category: slug }));
  return buildPageMetadata({
    ...common,
    seo: category.seo,
    title: category.name ?? t("title"),
    description: category.description,
    paths: { vi: pathFor("vi", slugs.vi ?? category.slug ?? categorySlug), ...(hasEnglish && slugs.en ? { en: pathFor("en", slugs.en) } : {}) },
    hasEnglish,
  });
}
