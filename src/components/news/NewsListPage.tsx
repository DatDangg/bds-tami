import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { NewsListBody } from "@/components/news/NewsListBody";
import { CategoryListTemplate } from "@/components/templates/CategoryListTemplate";
import { publicPath } from "@/lib/content/content-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { parsePagination, type RawPageParam } from "@/lib/content/pagination";
import { buildNewsChips, categoryFilterIds, loadNewsCategoryContext, loadNewsListing } from "@/lib/news/news-listing";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { categoryHref } from "@/lib/news/news-view";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

interface NewsListPageProps {
  locale: Locale;
  rawPage: RawPageParam;
  /** Slug danh mục (trang S05); bỏ trống = `/tin-tuc` (S10). */
  categorySlug?: string;
}

/** `/tin-tuc?page=2` · trang 1 không kèm tham số (canonical sạch, không trùng nội dung). */
function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/**
 * Dữ liệu + bố cục S10 (`/tin-tuc`) và S05 (`/tin-tuc/danh-muc/[category]`): cùng `CategoryListTemplate`. Danh mục không tồn tại
 * (hoặc chưa có bản EN ở `/en`) và trang vượt số trang → `notFound()`. Trang đọc `searchParams` nên render theo request
 * (không ISR); CDN vẫn giữ theo `Cache-Control` của `next.config.ts`.
 */
export async function NewsListPage({ locale, rawPage, categorySlug }: NewsListPageProps) {
  const { page } = parsePagination(rawPage, undefined);
  const payload = await getPayload({ config });
  const context = categorySlug ? await loadNewsCategoryContext(payload, locale, categorySlug) : null;
  if (categorySlug && !context) notFound();

  const [listing, t, tNav] = await Promise.all([
    loadNewsListing(payload, locale, { page, ...(context ? { categoryIds: categoryFilterIds(context) } : {}) }),
    getTranslations({ locale, namespace: "page.news" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
  ]);
  if (listing.outOfRange) notFound();
  const chips = await buildNewsChips(payload, locale, t("all"), context);

  const listPath = publicPath("/tin-tuc", locale);
  const ownPath = context ? categoryHref(context.category, locale) : listPath;
  const breadcrumb = [
    { label: tNav("news"), href: listPath },
    ...(context?.parent ? [{ label: context.parent.name ?? "", href: categoryHref(context.parent, locale) }] : []),
    ...(context ? [{ label: context.category.name ?? "", href: ownPath }] : []),
  ];

  return (
    <CategoryListTemplate
      title={context?.category.name ?? t("title")}
      description={context ? (context.category.description ?? undefined) : t("description")}
      breadcrumb={breadcrumb}
      chips={chips.length > 0 ? chips : undefined}
      parentListHref={listPath}
      isEmpty={listing.isEmpty}
      pagination={{ page, totalPages: listing.totalPages, buildHref: (n) => withPage(ownPath, n) }}
    >
      <NewsListBody featured={listing.featured} items={listing.items} />
    </CategoryListTemplate>
  );
}

/** `generateMetadata` của hai trang danh sách. Danh mục không có thì trả metadata rỗng (trang tự `notFound()`). */
export async function buildNewsListMetadata({ locale, rawPage, categorySlug }: NewsListPageProps): Promise<Metadata> {
  const { page } = parsePagination(rawPage, undefined);
  const payload = await getPayload({ config });
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.news" }), loadSiteIdentity(locale)]);
  const common = { locale, siteName: identity.siteName, defaultImage: identity.logo };

  if (!categorySlug) {
    return buildPageMetadata({
      ...common,
      title: t("title"),
      description: t("description"),
      paths: { vi: withPage(publicPath("/tin-tuc", "vi"), page), en: withPage(publicPath("/tin-tuc", "en"), page) },
      hasEnglish: true,
    });
  }
  const context = await loadNewsCategoryContext(payload, locale, categorySlug);
  if (!context) return {};
  const { category } = context;
  const slugs = await findLocalizedSlugs(payload, "categories", category.id);
  const hasEnglish = category.hasEnglish === true && Boolean(slugs.en);
  const pathFor = (target: Locale, slug: string) => withPage(publicPath("/tin-tuc/danh-muc/[category]", target, { category: slug }), page);
  return buildPageMetadata({
    ...common,
    seo: category.seo,
    title: category.name ?? t("title"),
    description: category.description,
    paths: { vi: pathFor("vi", slugs.vi ?? category.slug ?? categorySlug), ...(hasEnglish && slugs.en ? { en: pathFor("en", slugs.en) } : {}) },
    hasEnglish,
  });
}
