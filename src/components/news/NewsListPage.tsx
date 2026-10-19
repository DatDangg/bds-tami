import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { NewsHomeBody } from "@/components/news/NewsHomeBody";
import { NewsListBody } from "@/components/news/NewsListBody";
import { CategoryListTemplate } from "@/components/templates/CategoryListTemplate";
import { publicPath } from "@/lib/content/content-paths";
import { loadPageBanner } from "@/lib/content/load-page-banner";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { parsePagination, type RawPageParam } from "@/lib/content/pagination";
import { buildNewsChips, categoryFilterIds, loadNewsCategoryContext, loadNewsListing } from "@/lib/news/news-listing";
import { buildMoreNews, loadNewsHome } from "@/lib/news/news-home";
import { findLocalizedSlugs, listRootNewsCategories } from "@/lib/news/news-queries";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
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
 * Dữ liệu + bố cục S10 (`/tin-tuc`) và S05 (`/tin-tuc/danh-muc/[category]`): cùng `CategoryListTemplate` (banner gọn). Trang 1 của `/tin-tuc`
 * là "Tin nổi bật" + mỗi danh mục một hàng + "Tin khác" (= bài mới nhất bị loại khỏi lưới + lưới phân trang của trang 1, trừ bài đã hiện ở trên; `NewsHomeBody`); trang 2+ và trang danh mục là lưới 4 cột có phân trang. Phân trang/canonical không đổi.
 * `/tin-tuc` (mọi trang) có form "Tư vấn nhu cầu" cuối trang. Danh mục không tồn tại (hoặc chưa có bản EN ở `/en`) và trang vượt số trang
 * → `notFound()`. Trang đọc `searchParams` nên render theo request (không ISR); CDN vẫn giữ theo `Cache-Control` của `next.config.ts`.
 */
export async function NewsListPage({ locale, rawPage, categorySlug }: NewsListPageProps) {
  const { page } = parsePagination(rawPage, undefined);
  const payload = await getPayload({ config });
  const context = categorySlug ? await loadNewsCategoryContext(payload, locale, categorySlug) : null;
  if (categorySlug && !context) notFound();

  // Danh mục cấp 1 dùng chung cho hàng tab và các hàng theo danh mục của trang 1: tải một lần, hàng bắt đầu dựng ngay khi có.
  const rootsPromise = context ? Promise.resolve(undefined) : listRootNewsCategories(payload, locale).then((result) => result.docs);
  const homePromise = !context && page === 1 ? rootsPromise.then((roots) => loadNewsHome(payload, locale, roots ?? [])) : Promise.resolve(null);
  const [listing, t, tNav, bannerImage, roots, home] = await Promise.all([
    loadNewsListing(payload, locale, { page, ...(context ? { categoryIds: categoryFilterIds(context) } : {}) }),
    getTranslations({ locale, namespace: "page.news" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    loadPageBanner(locale, "news"),
    rootsPromise,
    homePromise,
  ]);
  if (listing.outOfRange) notFound();
  const chips = await buildNewsChips(payload, locale, t("all"), context, roots);
  const turnstileSiteKey = readTurnstileSiteKey();

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
      bannerImage={bannerImage}
      compactBanner
      breadcrumb={breadcrumb}
      chips={chips.length > 0 ? chips : undefined}
      chipsLabel={t("tabsLabel")}
      scrollChips
      parentListHref={listPath}
      isEmpty={listing.isEmpty}
      pagination={{ page, totalPages: listing.totalPages, buildHref: (n) => withPage(ownPath, n) }}
      belowContent={context ? undefined : <ConsultSection title={t("consultTitle")} turnstileSiteKey={turnstileSiteKey} />}
    >
      {home ? <NewsHomeBody home={home} moreItems={buildMoreNews(home, listing.featured, listing.items)} /> : <NewsListBody items={listing.items} />}
    </CategoryListTemplate>
  );
}

/** Form "Tư vấn nhu cầu" cuối `/tin-tuc` (nguồn `contact`, cùng LeadForm của trang Liên hệ): nền sáng, form trong thẻ trắng bo 20px. */
function ConsultSection({ title, turnstileSiteKey }: { title: string; turnstileSiteKey: string | undefined }) {
  return (
    <div className="bg-bg-alt px-gutter py-section-tight">
      <LeadFormSlot title={title} className="mx-auto max-w-2xl rounded-xl border border-border bg-surface">
        <LeadForm source="contact" {...(turnstileSiteKey ? { turnstileSiteKey } : {})} />
      </LeadFormSlot>
    </div>
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
