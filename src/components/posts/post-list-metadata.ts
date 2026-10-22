import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { publicPath } from "@/lib/content/content-paths";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { hasPostFilterParams, type RawPostParams } from "@/lib/posts/post-filters";
import { loadPostCategoryContext } from "@/lib/posts/post-listing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

/** Tham số của hai route: bộ lọc BL-052 + `category` của link cũ `/tin-bds?category=<slug>` (chỉ có nghĩa ở `/tin-bds`). */
export type RawPostListParams = RawPostParams & { category?: string | string[] };

export interface PostListPageProps {
  locale: Locale;
  searchParams: RawPostListParams;
  /** Slug danh mục (trang S05); bỏ trống = `/tin-bds` (S08). */
  categorySlug?: string;
}

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** `?category=` của link cũ (chỉ ở `/tin-bds`; route danh mục bỏ qua): slug danh mục tin BĐS có thật hoặc rỗng. */
export function legacyCategorySlug(searchParams: RawPostListParams, categorySlug: string | undefined): string {
  return categorySlug ? "" : firstParam(searchParams.category).slice(0, 100);
}

/** Trang `noindex` (metadata) — cũng là điều kiện KHÔNG phát FAQ JSON-LD: có tham số lọc / `q` / `sort` khác mặc định, hoặc `?category=` của link cũ (kể cả slug lạ). */
export function isFilteredList(searchParams: RawPostListParams, categorySlug: string | undefined): boolean {
  return hasPostFilterParams(searchParams) || legacyCategorySlug(searchParams, categorySlug) !== "";
}

/** `/tin-bds?page=2` · trang 1 không kèm tham số. */
function withPage(path: string, page: number): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/**
 * `generateMetadata` của hai trang danh sách. Có tham số lọc / `q` / `sort` khác mặc định (`hasPostFilterParams`) hoặc `?category=` của link cũ → `noindex, follow`
 * + canonical về trang sạch (`/tin-bds` hoặc trang danh mục, không `?page`). `/tin-bds?category=<slug có thật>` → canonical về TRANG DANH MỤC `/tin-bds/danh-muc/<slug>`
 * (slug của ngôn ngữ đang xem, không hreflang — như `/cho-thue?category=`; vẫn noindex). BL-055: URL CHỈ có `category` đã 308 ở `PostListPage` trước khi render
 * nên nhánh canonical này chỉ còn là phòng hờ cho URL kèm tham số khác. Không lọc: canonical chính nó (kèm `?page=n` ở trang ≥ 2).
 * Danh mục không có → metadata rỗng (trang tự `notFound()`).
 */
export async function buildPostListMetadata({ locale, searchParams, categorySlug }: PostListPageProps): Promise<Metadata> {
  const { page } = parsePagination(searchParams.page, undefined);
  const filtered = isFilteredList(searchParams, categorySlug);
  const pageFor = (path: string) => (filtered ? path : withPage(path, page));
  const payload = await getPayload({ config });
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.posts" }), loadSiteIdentity(locale)]);
  const common = { locale, siteName: identity.siteName, defaultImage: identity.logo, forceNoindex: filtered };

  if (!categorySlug) {
    const legacySlug = legacyCategorySlug(searchParams, categorySlug);
    const legacy = legacySlug ? await loadPostCategoryContext(payload, locale, legacySlug) : null;
    if (legacy?.category.slug) {
      const categoryPathFor = (target: Locale) => publicPath("/tin-bds/danh-muc/[category]", target, { category: legacy.category.slug ?? legacySlug });
      return buildPageMetadata({ ...common, title: t("title"), description: t("description"), paths: { vi: categoryPathFor("vi"), en: categoryPathFor("en") }, hasEnglish: false });
    }
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
