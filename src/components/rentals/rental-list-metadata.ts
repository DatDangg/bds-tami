import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayload, type Payload } from "payload";
import { publicPath } from "@/lib/content/content-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { findRentalCategory } from "@/lib/rentals/rental-list-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { hasNarrowingParams, parseRentalFilters, type RawRentalParams, type RentalFilters as RentalFilterValues, rentalListQueryString } from "@/lib/search/url-params";
import type { Category } from "@/payload-types";
import type { Locale } from "@/i18n/routing";

export interface RentalListPageProps {
  locale: Locale;
  searchParams: RawRentalParams;
  /** Slug danh mục của trang S05 (`/cho-thue/danh-muc/[category]`); bỏ trống = S04 `/cho-thue`. Danh mục này bị KHOÁ: không có ô lọc danh mục, `?category=` bị bỏ qua. */
  categorySlug?: string;
}

const CATEGORY_ROUTE = "/cho-thue/danh-muc/[category]";

export function withoutCategory(filters: RentalFilterValues): RentalFilterValues {
  const next = { ...filters };
  delete next.category;
  return next;
}

export const categoryPath = (locale: Locale, slug: string) => publicPath(CATEGORY_ROUTE, locale, { category: slug });

async function lookupCategory(locale: Locale, slug: string) {
  const payload = await getPayload({ config });
  const category = await findRentalCategory(payload, locale, slug);
  return category ? { payload, category } : null;
}

interface MetadataContext {
  common: { locale: Locale; siteName: string; defaultImage: Parameters<typeof buildPageMetadata>[0]["defaultImage"] };
  t: Awaited<ReturnType<typeof getTranslations>>;
  noindex: boolean;
  query: string;
}

/** S04 không (hoặc không hợp lệ) danh mục. Slug tỉnh khác nhau theo ngôn ngữ: trang lọc tỉnh không khai hreflang (hasEnglish=false), chỉ canonical về chính nó. */
function rootMetadata({ common, t, noindex, query }: MetadataContext): Metadata {
  const pathFor = (target: Locale) => `${publicPath("/cho-thue", target)}${query}`;
  return buildPageMetadata({
    ...common,
    forceNoindex: noindex,
    title: t("title"),
    description: t("description"),
    paths: { vi: pathFor("vi"), en: pathFor("en") },
    hasEnglish: !query.includes("province="),
  });
}

/** S04 có `?category=<slug có thật>`: canonical về trang danh mục (slug trên URL là slug của ngôn ngữ đang xem), không khai hreflang. */
function categoryCanonicalMetadata({ common, t, noindex, query }: MetadataContext, category: Category): Metadata {
  const ownSlug = category.slug ?? "";
  const pathFor = (target: Locale) => `${categoryPath(target, ownSlug)}${query}`;
  return buildPageMetadata({
    ...common,
    forceNoindex: noindex,
    title: t("title"),
    description: t("description"),
    paths: { vi: pathFor("vi"), en: pathFor("en") },
    hasEnglish: false,
  });
}

/** S05: canonical chính nó, title/meta/`seo` từ danh mục, hreflang chỉ khi danh mục có bản EN (slug EN khác slug VI). */
async function categoryPageMetadata({ common, t, noindex, query }: MetadataContext, payload: Payload, category: Category, categorySlug: string): Promise<Metadata> {
  const slugs = await findLocalizedSlugs(payload, "categories", category.id);
  const pathFor = (target: Locale, targetSlug: string) => `${categoryPath(target, targetSlug)}${query}`;
  return buildPageMetadata({
    ...common,
    seo: category.seo,
    forceNoindex: noindex,
    title: category.name ?? t("title"),
    description: category.description,
    paths: { vi: pathFor("vi", slugs.vi ?? category.slug ?? categorySlug), ...(slugs.en ? { en: pathFor("en", slugs.en) } : {}) },
    hasEnglish: category.hasEnglish === true && Boolean(slugs.en) && !noindex,
  });
}

/**
 * `generateMetadata` của `/cho-thue` (design-spec S04) và trang danh mục (S05).
 * S04: trang gốc, trang chỉ lọc MỘT danh mục hoặc MỘT tỉnh: index; tổ hợp lọc sâu hơn hoặc đổi sắp xếp: `noindex, follow` và canonical về trang gốc sạch.
 * `?category=<slug đã có>`: canonical về TRANG DANH MỤC (quyết định: canonical chứ không 301, vì URL cũ/chia sẻ vẫn mở được và bộ lọc khác vẫn dùng được);
 * slug lạ bị trang bỏ qua nên coi như không có danh mục. S05: indexable, canonical chính nó (kèm `?page=n`), title/meta/`seo.noindex` từ danh mục,
 * hreflang chỉ khi danh mục có bản EN; thêm bộ lọc ngoài `page` → noindex + canonical về trang danh mục sạch.
 */
export async function buildRentalListMetadata({ locale, searchParams, categorySlug }: RentalListPageProps): Promise<Metadata> {
  const parsed = parseRentalFilters(searchParams);
  const slug = categorySlug ?? parsed.category;
  const found = slug ? await lookupCategory(locale, slug) : null;
  if (categorySlug && !found) return {};
  const category = found?.category ?? null;
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.rentals" }), loadSiteIdentity(locale)]);
  // Danh mục hợp lệ nằm trong đường dẫn nên rời khỏi query; danh mục lạ (chỉ ở S04) bị trang bỏ qua.
  const filters = withoutCategory(parsed);
  const noindex = hasNarrowingParams(category ? { ...filters, category: category.slug ?? "" } : filters);
  const context: MetadataContext = {
    common: { locale, siteName: identity.siteName, defaultImage: identity.logo },
    t,
    noindex,
    query: noindex ? "" : rentalListQueryString(filters),
  };
  if (!found || !category) return rootMetadata(context);
  if (categorySlug === undefined) return categoryCanonicalMetadata(context, category);
  return categoryPageMetadata(context, found.payload, category, categorySlug);
}
