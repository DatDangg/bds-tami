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
import { ListingCategoryTabs } from "@/components/listing/ListingCategoryTabs";
import { ListingHero } from "@/components/listing/ListingHero";
import { countActiveFilters } from "@/components/listing/listing-params";
import { SpotlightSlider } from "@/components/listing/SpotlightSlider";
import { PostCard } from "@/components/posts/PostCard";
import { PostListBody } from "@/components/posts/PostListBody";
import { PostSortControl } from "@/components/posts/PostSortControl";
import { PostSpotlightContent } from "@/components/posts/PostSpotlightContent";
import { buildPostTabs, POST_ACTIVE_FILTER_SPEC, toCurrentParams, toFilterOptions, toFilterValues, toPreservedParams, toQueryString } from "@/components/posts/post-list-state";
import { publicPath } from "@/lib/content/content-paths";
import { loadListingPageContent, type ListingLearnMoreView } from "@/lib/content/load-listing-page";
import { loadListingStrengths } from "@/lib/content/load-listing-strengths";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { listProvinces } from "@/lib/projects/project-queries";
import { hasPostFilterParams, parsePostFilters, postQueryString, type RawPostParams } from "@/lib/posts/post-filters";
import { buildPostChips, loadPostCategoryContext, loadPostListing, postCategoryFilterIds, type PostCategoryContext } from "@/lib/posts/post-listing";
import { postCategoryHref } from "@/lib/posts/post-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

/** Tham số của hai route: bộ lọc BL-052 + `category` của link cũ `/tin-bds?category=<slug>` (chỉ có nghĩa ở `/tin-bds`). */
export type RawPostListParams = RawPostParams & { category?: string | string[] };

interface PostListPageProps {
  locale: Locale;
  searchParams: RawPostListParams;
  /** Slug danh mục (trang S05); bỏ trống = `/tin-bds` (S08). */
  categorySlug?: string;
}

/** Ảnh thẻ lưới khi có cột lọc trái (như `/du-an`, `/cho-thue`): ≥ xl ~300px, lg 3 cột trong ~70% khung, md 2 cột. */
const GRID_CARD_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw";

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** `?category=` của link cũ (chỉ ở `/tin-bds`; route danh mục bỏ qua): slug danh mục tin BĐS có thật hoặc rỗng. */
function legacyCategorySlug(searchParams: RawPostListParams, categorySlug: string | undefined): string {
  return categorySlug ? "" : firstParam(searchParams.category).slice(0, 100);
}

function toLearnMoreContent(view: ListingLearnMoreView | null) {
  if (!view) return null;
  return { eyebrow: view.eyebrow ?? null, title: view.title, titleAccent: view.titleAccent ?? null, description: view.description ?? null, image: view.image ?? null, videoUrl: view.videoUrl ?? null, cta: view.cta ?? null };
}

/** Danh mục của trang: route danh mục, hoặc `?category=` của link cũ ở `/tin-bds` (slug lạ → `null`, trang không lọc danh mục). */
async function loadContext(payload: Payload, locale: Locale, categorySlug: string | undefined, legacySlug: string): Promise<PostCategoryContext | null> {
  const slug = categorySlug ?? legacySlug;
  return slug ? loadPostCategoryContext(payload, locale, slug) : null;
}

/** Tên tỉnh đang chọn (đã đối chiếu) cho ô tích của tỉnh không còn tin trong phạm vi quét. Không chọn tỉnh → không truy vấn. */
async function selectedProvinceNames(payload: Payload, slugs: readonly string[] | undefined) {
  if (!slugs?.length) return [];
  return (await listProvinces(payload)).filter((item) => slugs.includes(item.slug)).map((item) => ({ slug: item.slug, name: item.shortName || item.name }));
}

/**
 * S08 `/tin-bds` (`/en/property-posts`) và S05 trang danh mục (`categorySlug`) theo khung danh sách BL-052 (cùng `/du-an`, `/cho-thue`): hero (ảnh + chữ
 * `pageHeroes.propertyPosts`; trang danh mục: eyebrow "Đăng tin BĐS", tên + mô tả danh mục) + ô tìm `q` + "Tìm nhanh" (`listingPages.propertyPosts`) → tab danh mục
 * (link route danh mục, số đếm) → cột lọc trái (< lg là Sheet) | thẻ nổi bật (trang 1, ≤ 5 tin `isFeatured` còn hiệu lực khớp lọc) → "N tin phù hợp" + sắp xếp
 * → lưới 3 cột thẻ BĐS / voucher → phân trang → "Tìm hiểu thêm" + FAQ → dải Điểm mạnh (cờ `showStrengths`) → banner tư vấn. Không form lead.
 * Link cũ `/tin-bds?category=<slug>` vẫn lọc theo danh mục đó + đánh dấu tab. Giá trị lạ bị bỏ (không 400/500); danh mục không có / chưa có bản EN ở `/en`
 * và trang vượt số trang → `notFound()`. Đọc `searchParams` nên render theo request (không ISR); "bây giờ" là lúc render (nhãn "Đã kết thúc" đúng `isOfferEnded`).
 */
export async function PostListPage({ locale, searchParams, categorySlug }: PostListPageProps) {
  const { page } = parsePagination(searchParams.page, undefined);
  const legacySlug = legacyCategorySlug(searchParams, categorySlug);
  const payload = await getPayload({ config });
  const context = await loadContext(payload, locale, categorySlug, legacySlug);
  if (categorySlug && !context) notFound();
  // Danh mục của link cũ chỉ lọc + đánh dấu tab; hero / breadcrumb / đường dẫn vẫn của `/tin-bds`.
  const routeContext = categorySlug ? context : null;

  const [listing, t, tNav, tOptions, tDirection, hero, content, strengths] = await Promise.all([
    loadPostListing(payload, locale, { page, now: new Date(), filters: parsePostFilters(searchParams), ...(context ? { categoryIds: postCategoryFilterIds(context) } : {}) }),
    getTranslations({ locale, namespace: "page.posts" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    getTranslations({ locale, namespace: "listingOptions" }),
    getTranslations({ locale, namespace: "page.rentalDetail.direction" }),
    loadPageHero(locale, "propertyPosts"),
    loadListingPageContent(locale, "propertyPosts"),
    loadListingStrengths(locale, "propertyPosts"),
  ]);
  if (listing.outOfRange) notFound();
  const [chips, provinceNames] = await Promise.all([buildPostChips(payload, locale, t("all"), context), selectedProvinceNames(payload, listing.filters.provinceSlugs)]);

  const postsPath = publicPath("/tin-bds", locale);
  const listPath = routeContext ? postCategoryHref(routeContext.category, locale) : postsPath;
  const filterQuery = postQueryString(listing.filters);
  const current = toCurrentParams(filterQuery, context && !routeContext ? (context.category.slug ?? undefined) : undefined);
  const countLabel = (count: number) => t("list.resultTotal", { count });
  const tabs = buildPostTabs({ chips, facets: listing.facets, countLabel, query: filterQuery });
  const options = toFilterOptions(listing.facets, provinceNames, {
    type: (value) => tOptions(`propertyType.${value}`),
    direction: (value) => tDirection(value),
    handover: (value) => tOptions(`handoverCondition.${value}`),
  });
  const filtered = filterQuery !== "";
  const breadcrumb = [
    { label: tNav("property-posts"), href: postsPath },
    ...(routeContext?.parent ? [{ label: routeContext.parent.name ?? "", href: postCategoryHref(routeContext.parent, locale) }] : []),
    ...(routeContext ? [{ label: routeContext.category.name ?? "", href: listPath }] : []),
  ];
  const heroDescription = routeContext ? (routeContext.category.description ?? undefined) : hero.description;
  const heroEyebrow = routeContext ? t("title") : hero.eyebrow;

  return (
    <ListPendingProvider>
      <ListingHero
        title={routeContext?.category.name ?? hero.title}
        {...(!routeContext && hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
        {...(heroEyebrow ? { eyebrow: heroEyebrow } : {})}
        {...(heroDescription ? { description: heroDescription } : {})}
        {...(hero.image ? { image: hero.image } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={breadcrumb} />}
        search={{ action: listPath, ...(listing.filters.q ? { value: listing.filters.q } : {}), placeholder: t("list.keywordPlaceholder"), preservedParams: current }}
        quickSearch={content.quickSearch}
      />
      <ListingCategoryTabs label={t("tabsLabel")} tabs={tabs} />
      <PostListBody
        path={listPath}
        current={current}
        values={toFilterValues(listing.filters)}
        options={options}
        preservedParams={toPreservedParams(current)}
        activeCount={countActiveFilters(current, POST_ACTIVE_FILTER_SPEC)}
        clearHref={listPath}
        countLabel={countLabel(listing.totalDocs)}
        {...(listing.featured.length > 0
          ? {
              spotlight: (
                <SpotlightSlider
                  label={t("list.spotlight.label")}
                  badge={t("list.spotlight.label")}
                  items={listing.featured.map((card) => ({ id: card.id, image: card.cover, content: <PostSpotlightContent data={card} /> }))}
                />
              ),
            }
          : {})}
        {...(listing.totalDocs > 0 ? { sort: <PostSortControl actionPath={listPath} current={current} /> } : {})}
      >
        {listing.isEmpty ? (
          filtered ? (
            <EmptyState variant="filtered" title={t("list.emptyTitle")} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
          ) : (
            <EmptyState variant="empty" title={t(context ? "empty.noPostsInCategory" : "empty.noPosts")} {...(context ? { backHref: postsPath } : {})} />
          )
        ) : (
          <>
            {listing.items.length > 0 && (
              <section aria-label={t("gridLabel")}>
                <ul data-grid-max-cols="3" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {listing.items.map((card, index) => (
                    <li key={card.id}>
                      {/* Ảnh LCP là ảnh hero; thẻ đầu chỉ ưu tiên khi hero không có ảnh và không có thẻ nổi bật. */}
                      <PostCard data={card} headingLevel="h2" imageSizes={GRID_CARD_SIZES} priority={index === 0 && !hero.image && listing.featured.length === 0} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <Pagination page={page} totalPages={listing.totalPages} buildHref={(target) => `${listPath}${toQueryString(current, target)}`} />
          </>
        )}
      </PostListBody>
      {/* FAQ JSON-LD chỉ ở trang sạch `/tin-bds` (trang 1, không lọc): trang danh mục cũng hiện khối nhưng không phát lặp `FAQPage`. */}
      <div className="mx-auto w-full max-w-container px-gutter pb-section-tight empty:hidden">
        <LearnMoreFaq learnMore={toLearnMoreContent(content.learnMore)} faqs={content.faqs} emitJsonLd={!context && page === 1 && !hasPostFilterParams(searchParams)} />
      </div>
      {strengths ? <StrengthsBlock block={strengths} /> : null}
      <ConsultBanner locale={locale} />
    </ListPendingProvider>
  );
}

/** `/tin-bds?page=2` · trang 1 không kèm tham số. */
function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/**
 * `generateMetadata` của hai trang danh sách. Có tham số lọc / `q` / `sort` khác mặc định (`hasPostFilterParams`) hoặc `?category=` của link cũ → `noindex, follow`
 * + canonical về trang sạch (`/tin-bds` hoặc trang danh mục, không `?page`). Không lọc: canonical chính nó (kèm `?page=n` ở trang ≥ 2). Danh mục không có → metadata rỗng (trang tự `notFound()`).
 */
export async function buildPostListMetadata({ locale, searchParams, categorySlug }: PostListPageProps): Promise<Metadata> {
  const { page } = parsePagination(searchParams.page, undefined);
  const filtered = hasPostFilterParams(searchParams) || legacyCategorySlug(searchParams, categorySlug) !== "";
  const pageFor = (path: string) => (filtered ? path : withPage(path, page));
  const payload = await getPayload({ config });
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.posts" }), loadSiteIdentity(locale)]);
  const common = { locale, siteName: identity.siteName, defaultImage: identity.logo, forceNoindex: filtered };

  if (!categorySlug) {
    return buildPageMetadata({
      ...common,
      title: t("title"),
      description: t("description"),
      paths: { vi: pageFor(publicPath("/tin-bds", "vi")), en: pageFor(publicPath("/tin-bds", "en")) },
      hasEnglish: true,
    });
  }
  const context = await loadPostCategoryContext(payload, locale, categorySlug);
  if (!context) return {};
  const { category } = context;
  const slugs = await findLocalizedSlugs(payload, "categories", category.id);
  const hasEnglish = category.hasEnglish === true && Boolean(slugs.en);
  const pathFor = (target: Locale, slug: string) => pageFor(publicPath("/tin-bds/danh-muc/[category]", target, { category: slug }));
  return buildPageMetadata({
    ...common,
    seo: category.seo,
    title: category.name ?? t("title"),
    description: category.description,
    paths: { vi: pathFor("vi", slugs.vi ?? category.slug ?? categorySlug), ...(hasEnglish && slugs.en ? { en: pathFor("en", slugs.en) } : {}) },
    hasEnglish,
  });
}
