import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { PostListBody } from "@/components/posts/PostListBody";
import { CategoryListTemplate } from "@/components/templates/CategoryListTemplate";
import { publicPath } from "@/lib/content/content-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { parsePagination, type RawPageParam } from "@/lib/content/pagination";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { buildPostChips, loadPostCategoryContext, loadPostListing, postCategoryFilterIds } from "@/lib/posts/post-listing";
import { postCategoryHref } from "@/lib/posts/post-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

interface PostListPageProps {
  locale: Locale;
  rawPage: RawPageParam;
  /** Slug danh mục (trang S05); bỏ trống = `/tin-bds` (S08). */
  categorySlug?: string;
}

/** `/tin-bds?page=2` · trang 1 không kèm tham số (canonical sạch, không trùng nội dung). */
function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/**
 * Dữ liệu + bố cục S08 (`/tin-bds`) và S05 (`/tin-bds/danh-muc/[category]`): cùng `CategoryListTemplate`. Danh mục không tồn tại (hoặc chưa có
 * bản EN ở `/en`) và trang vượt số trang → `notFound()`. Trang đọc `searchParams` nên render theo request (không ISR); CDN giữ theo `Cache-Control`.
 * "Bây giờ" là lúc render: nhãn "Đã kết thúc" đúng theo `isOfferEnded`, và job `expire-offers` 00:05 làm mới cache CDN/ISR của chi tiết.
 */
export async function PostListPage({ locale, rawPage, categorySlug }: PostListPageProps) {
  const { page } = parsePagination(rawPage, undefined);
  const payload = await getPayload({ config });
  const context = categorySlug ? await loadPostCategoryContext(payload, locale, categorySlug) : null;
  if (categorySlug && !context) notFound();

  const [listing, t, tNav] = await Promise.all([
    loadPostListing(payload, locale, { page, now: new Date(), ...(context ? { categoryIds: postCategoryFilterIds(context) } : {}) }),
    getTranslations({ locale, namespace: "page.posts" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
  ]);
  if (listing.outOfRange) notFound();
  const chips = await buildPostChips(payload, locale, t("all"), context);

  const listPath = publicPath("/tin-bds", locale);
  const ownPath = context ? postCategoryHref(context.category, locale) : listPath;
  const breadcrumb = [
    { label: tNav("property-posts"), href: listPath },
    ...(context?.parent ? [{ label: context.parent.name ?? "", href: postCategoryHref(context.parent, locale) }] : []),
    ...(context ? [{ label: context.category.name ?? "", href: ownPath }] : []),
  ];

  return (
    <CategoryListTemplate
      title={context?.category.name ?? t("title")}
      description={context ? (context.category.description ?? undefined) : t("description")}
      breadcrumb={breadcrumb}
      chips={chips.length > 0 ? chips : undefined}
      chipsLabel={t("tabsLabel")}
      scrollChips
      parentListHref={listPath}
      isEmpty={listing.isEmpty}
      pagination={{ page, totalPages: listing.totalPages, buildHref: (n) => withPage(ownPath, n) }}
    >
      <PostListBody featured={listing.featured} items={listing.items} />
    </CategoryListTemplate>
  );
}

/** `generateMetadata` của hai trang danh sách. Danh mục không có thì trả metadata rỗng (trang tự `notFound()`). */
export async function buildPostListMetadata({ locale, rawPage, categorySlug }: PostListPageProps): Promise<Metadata> {
  const { page } = parsePagination(rawPage, undefined);
  const payload = await getPayload({ config });
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.posts" }), loadSiteIdentity(locale)]);
  const common = { locale, siteName: identity.siteName, defaultImage: identity.logo };

  if (!categorySlug) {
    return buildPageMetadata({
      ...common,
      title: t("title"),
      description: t("description"),
      paths: { vi: withPage(publicPath("/tin-bds", "vi"), page), en: withPage(publicPath("/tin-bds", "en"), page) },
      hasEnglish: true,
    });
  }
  const context = await loadPostCategoryContext(payload, locale, categorySlug);
  if (!context) return {};
  const { category } = context;
  const slugs = await findLocalizedSlugs(payload, "categories", category.id);
  const hasEnglish = category.hasEnglish === true && Boolean(slugs.en);
  const pathFor = (target: Locale, slug: string) => withPage(publicPath("/tin-bds/danh-muc/[category]", target, { category: slug }), page);
  return buildPageMetadata({
    ...common,
    seo: category.seo,
    title: category.name ?? t("title"),
    description: category.description,
    paths: { vi: pathFor("vi", slugs.vi ?? category.slug ?? categorySlug), ...(hasEnglish && slugs.en ? { en: pathFor("en", slugs.en) } : {}) },
    hasEnglish,
  });
}
