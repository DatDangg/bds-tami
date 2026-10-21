import config from "@payload-config";
import { useTranslations } from "next-intl";
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
import { isFilteredList, legacyCategorySlug, type PostListPageProps, type RawPostListParams } from "@/components/posts/post-list-metadata";
import { buildPostTabs, POST_ACTIVE_FILTER_SPEC, toCurrentParams, toFilterOptions, toFilterValues, toPreservedParams, toQueryString } from "@/components/posts/post-list-state";
import { publicPath } from "@/lib/content/content-paths";
import { loadListingPageContent, type ListingLearnMoreView } from "@/lib/content/load-listing-page";
import { loadListingStrengths } from "@/lib/content/load-listing-strengths";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { parsePagination } from "@/lib/content/pagination";
import { listProvinces } from "@/lib/projects/project-queries";
import { parsePostFilters, postQueryString } from "@/lib/posts/post-filters";
import { buildPostChips, loadPostCategoryContext, loadPostListing, postCategoryFilterIds, type PostCategoryContext } from "@/lib/posts/post-listing";
import { type PostCardData, postCategoryHref } from "@/lib/posts/post-view";
import type { Locale } from "@/i18n/routing";

/** Ảnh thẻ lưới khi có cột lọc trái (như `/du-an`, `/cho-thue`): ≥ xl ~300px, lg 3 cột trong ~70% khung, md 2 cột. */
const GRID_CARD_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 22vw, (min-width: 768px) 50vw, 100vw";

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

interface PostListHeroProps {
  hero: Awaited<ReturnType<typeof loadPageHero>>;
  /** Trang danh mục (S05): eyebrow "Đăng tin BĐS", tên + mô tả danh mục, breadcrumb thêm danh mục cha + danh mục. Link cũ `?category=` → `null`. */
  routeContext: PostCategoryContext | null;
  locale: Locale;
  listPath: string;
  postsPath: string;
  query: string | undefined;
  current: Record<string, string>;
  quickSearch: string[];
}

/** Hero (ảnh + chữ `pageHeroes.propertyPosts`; trang danh mục dùng chữ của danh mục) + breadcrumb + ô tìm `q` + "Tìm nhanh". */
function PostListHero({ hero, routeContext, locale, listPath, postsPath, query, current, quickSearch }: PostListHeroProps) {
  const t = useTranslations("page.posts");
  const tNav = useTranslations("layout.nav.items");
  const breadcrumb = [
    { label: tNav("property-posts"), href: postsPath },
    ...(routeContext?.parent ? [{ label: routeContext.parent.name ?? "", href: postCategoryHref(routeContext.parent, locale) }] : []),
    ...(routeContext ? [{ label: routeContext.category.name ?? "", href: listPath }] : []),
  ];
  const description = routeContext ? (routeContext.category.description ?? undefined) : hero.description;
  const eyebrow = routeContext ? t("title") : hero.eyebrow;
  return (
    <ListingHero
      title={routeContext?.category.name ?? hero.title}
      {...(!routeContext && hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
      {...(eyebrow ? { eyebrow } : {})}
      {...(description ? { description } : {})}
      {...(hero.image ? { image: hero.image } : {})}
      breadcrumb={<Breadcrumb variant="overlay" items={breadcrumb} />}
      search={{ action: listPath, ...(query ? { value: query } : {}), placeholder: t("list.keywordPlaceholder"), preservedParams: current }}
      quickSearch={quickSearch}
    />
  );
}

/** Thẻ nổi bật (trang 1, ≤ 5 tin `isFeatured` còn hiệu lực khớp lọc). */
function PostSpotlight({ cards }: { cards: PostCardData[] }) {
  const t = useTranslations("page.posts.list.spotlight");
  return <SpotlightSlider label={t("label")} badge={t("label")} items={cards.map((card) => ({ id: card.id, image: card.cover, content: <PostSpotlightContent data={card} /> }))} />;
}

interface PostGridProps {
  cards: PostCardData[];
  /** Thẻ đầu là ảnh LCP (hero không có ảnh và không có thẻ nổi bật). */
  priorityFirst: boolean;
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

/** Lưới 3 cột thẻ BĐS / voucher (tiêu đề thẻ `h2`) + phân trang. */
function PostGrid({ cards, priorityFirst, page, totalPages, buildHref }: PostGridProps) {
  const t = useTranslations("page.posts");
  return (
    <>
      {cards.length > 0 && (
        <section aria-label={t("gridLabel")}>
          <ul data-grid-max-cols="3" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <li key={card.id}>
                {/* Ảnh LCP là ảnh hero; thẻ đầu chỉ ưu tiên khi hero không có ảnh và không có thẻ nổi bật. */}
                <PostCard data={card} headingLevel="h2" imageSizes={GRID_CARD_SIZES} priority={priorityFirst && index === 0} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </>
  );
}

/** Danh mục (route hoặc link cũ) → danh sách + facet + nổi bật → tab + tên tỉnh đang chọn; hero / Tìm hiểu thêm / Điểm mạnh. Danh mục route không có / vượt số trang → `notFound()`. */
async function loadPostListData(locale: Locale, searchParams: RawPostListParams, categorySlug: string | undefined, allLabel: string) {
  const { page } = parsePagination(searchParams.page, undefined);
  const payload = await getPayload({ config });
  const context = await loadContext(payload, locale, categorySlug, legacyCategorySlug(searchParams, categorySlug));
  if (categorySlug && !context) notFound();
  const [listing, hero, content, strengths] = await Promise.all([
    loadPostListing(payload, locale, { page, now: new Date(), filters: parsePostFilters(searchParams), ...(context ? { categoryIds: postCategoryFilterIds(context) } : {}) }),
    loadPageHero(locale, "propertyPosts"),
    loadListingPageContent(locale, "propertyPosts"),
    loadListingStrengths(locale, "propertyPosts"),
  ]);
  if (listing.outOfRange) notFound();
  const [chips, provinceNames] = await Promise.all([buildPostChips(payload, locale, allLabel, context), selectedProvinceNames(payload, listing.filters.provinceSlugs)]);
  return { page, context, listing, chips, provinceNames, hero, content, strengths };
}

/**
 * S08 `/tin-bds` (`/en/property-news`) và S05 trang danh mục (`categorySlug`) theo khung danh sách BL-052 (cùng `/du-an`, `/cho-thue`): hero (ảnh + chữ
 * `pageHeroes.propertyPosts`; trang danh mục: eyebrow "Đăng tin BĐS", tên + mô tả danh mục) + ô tìm `q` + "Tìm nhanh" (`listingPages.propertyPosts`) → tab danh mục
 * (link route danh mục, số đếm) → cột lọc trái (< lg là Sheet) | thẻ nổi bật (trang 1, ≤ 5 tin `isFeatured` còn hiệu lực khớp lọc) → "N tin phù hợp" + sắp xếp
 * → lưới 3 cột thẻ BĐS / voucher → phân trang → "Tìm hiểu thêm" + FAQ → dải Điểm mạnh (cờ `showStrengths`) → banner tư vấn. Không form lead.
 * Link cũ `/tin-bds?category=<slug>` vẫn lọc theo danh mục đó + đánh dấu tab. Giá trị lạ bị bỏ (không 400/500); danh mục không có / chưa có bản EN ở `/en`
 * và trang vượt số trang → `notFound()`. Đọc `searchParams` nên render theo request (không ISR); "bây giờ" là lúc render (nhãn "Đã kết thúc" đúng `isOfferEnded`).
 */
export async function PostListPage({ locale, searchParams, categorySlug }: PostListPageProps) {
  const [t, tOptions] = await Promise.all([getTranslations({ locale, namespace: "page.posts" }), getTranslations({ locale, namespace: "listingOptions" })]);
  const { page, context, listing, chips, provinceNames, hero, content, strengths } = await loadPostListData(locale, searchParams, categorySlug, t("all"));
  // Danh mục của link cũ chỉ lọc + đánh dấu tab; hero / breadcrumb / đường dẫn vẫn của `/tin-bds`.
  const routeContext = categorySlug ? context : null;

  const postsPath = publicPath("/tin-bds", locale);
  const listPath = routeContext ? postCategoryHref(routeContext.category, locale) : postsPath;
  const filterQuery = postQueryString(listing.filters);
  const current = toCurrentParams(filterQuery, context && !routeContext ? (context.category.slug ?? undefined) : undefined);
  const countLabel = (count: number) => t("list.resultTotal", { count });
  const tabs = buildPostTabs({ chips, facets: listing.facets, countLabel, query: filterQuery });
  const options = toFilterOptions(listing.facets, provinceNames, {
    type: (value) => tOptions(`propertyType.${value}`),
    direction: (value) => tOptions(`direction.${value}`),
    handover: (value) => tOptions(`handoverCondition.${value}`),
  });
  const filtered = filterQuery !== "";

  return (
    <ListPendingProvider>
      <PostListHero hero={hero} routeContext={routeContext} locale={locale} listPath={listPath} postsPath={postsPath} query={listing.filters.q} current={current} quickSearch={content.quickSearch} />
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
        {...(listing.featured.length > 0 ? { spotlight: <PostSpotlight cards={listing.featured} /> } : {})}
        {...(listing.totalDocs > 0 ? { sort: <PostSortControl {...(current.sort ? { value: current.sort } : {})} /> } : {})}
      >
        {listing.isEmpty ? (
          filtered ? (
            <EmptyState variant="filtered" title={t("list.emptyTitle")} clearFiltersHref={listPath} adviceHref={publicPath("/lien-he", locale)} />
          ) : (
            <EmptyState variant="empty" title={t(context ? "empty.noPostsInCategory" : "empty.noPosts")} {...(context ? { backHref: postsPath } : {})} />
          )
        ) : (
          <PostGrid cards={listing.items} priorityFirst={!hero.image && listing.featured.length === 0} page={page} totalPages={listing.totalPages} buildHref={(target) => `${listPath}${toQueryString(current, target)}`} />
        )}
      </PostListBody>
      {/* FAQ JSON-LD chỉ ở trang sạch `/tin-bds` (trang 1, không lọc, cùng điều kiện noindex của metadata): trang danh mục cũng hiện khối nhưng không phát lặp `FAQPage`. */}
      <div className="mx-auto w-full max-w-container px-gutter pb-section-tight empty:hidden">
        <LearnMoreFaq learnMore={toLearnMoreContent(content.learnMore)} faqs={content.faqs} emitJsonLd={!categorySlug && page === 1 && !isFilteredList(searchParams, categorySlug)} />
      </div>
      {strengths ? <StrengthsBlock block={strengths} /> : null}
      <ConsultBanner locale={locale} />
    </ListPendingProvider>
  );
}

export { buildPostListMetadata, type RawPostListParams } from "./post-list-metadata";
