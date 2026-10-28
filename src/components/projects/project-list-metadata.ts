import config from "@payload-config";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPayload } from "payload";
import { publicPath } from "@/lib/content/content-paths";
import { parsePagination } from "@/lib/content/pagination";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { hasFilterParams, type RawProjectParams, withoutCategoryParam } from "@/lib/projects/project-filters";
import { findProjectCategoryBySlug } from "@/lib/projects/project-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { Locale } from "@/i18n/routing";

const CATEGORY_ROUTE = "/du-an/danh-muc/[category]";

/** Đường dẫn công khai của trang danh mục Dự án (S05) theo ngôn ngữ; `slug` là slug của CHÍNH ngôn ngữ đó. */
export const projectCategoryPath = (locale: Locale, slug: string) => publicPath(CATEGORY_ROUTE, locale, { category: slug });

interface ProjectMetadataInput {
  locale: Locale;
  searchParams: RawProjectParams;
  /** Slug danh mục của trang S05; bỏ trống = S02 `/du-an`. */
  categorySlug?: string;
}

/** S02: không tra danh mục (slug `?category=` có thật đã 308 sang S05 trước khi render, slug lạ bị bỏ) nên không lặp truy vấn của trang. */
async function listMetadata({ locale, searchParams }: ProjectMetadataInput): Promise<Metadata> {
  const { page } = parsePagination(searchParams.page, undefined);
  const filtered = hasFilterParams(searchParams);
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.projects" }), loadSiteIdentity(locale)]);
  const pathFor = (target: Locale) => {
    const path = publicPath("/du-an", target);
    return !filtered && page > 1 ? `${path}?page=${page}` : path;
  };
  return buildPageMetadata({
    locale,
    siteName: identity.siteName,
    defaultImage: identity.logo,
    forceNoindex: filtered,
    title: t("title"),
    description: t("description"),
    paths: { vi: pathFor("vi"), en: pathFor("en") },
    hasEnglish: true,
  });
}

/** S05: title "<Tên danh mục> – Dự án", mô tả + `seo` từ danh mục (không mô tả → mô tả `/du-an`), canonical chính nó (+ `?page=n`), hreflang chỉ khi danh mục có bản EN. */
async function categoryMetadata({ locale, searchParams, categorySlug = "" }: ProjectMetadataInput): Promise<Metadata> {
  const params = withoutCategoryParam(searchParams);
  const payload = await getPayload({ config });
  const category = await findProjectCategoryBySlug(payload, locale, categorySlug);
  if (!category) return {};
  const [t, identity, slugs] = await Promise.all([
    getTranslations({ locale, namespace: "page.projects" }),
    loadSiteIdentity(locale),
    findLocalizedSlugs(payload, "categories", category.id),
  ]);
  const { page } = parsePagination(params.page, undefined);
  const noindex = hasFilterParams(params);
  const pathFor = (target: Locale, slug: string) => {
    const path = projectCategoryPath(target, slug);
    return !noindex && page > 1 ? `${path}?page=${page}` : path;
  };
  return buildPageMetadata({
    locale,
    siteName: identity.siteName,
    defaultImage: identity.logo,
    seo: category.seo,
    forceNoindex: noindex,
    title: `${category.name ?? categorySlug} – ${t("title")}`,
    description: category.description ?? t("description"),
    paths: { vi: pathFor("vi", slugs.vi ?? category.slug ?? categorySlug), ...(slugs.en ? { en: pathFor("en", slugs.en) } : {}) },
    hasEnglish: category.hasEnglish === true && Boolean(slugs.en) && !noindex,
  });
}

/**
 * `generateMetadata` của `/du-an` (S02) và trang danh mục (S05). Có tham số lọc (`province`, `status`, `q`, `developer`, `type`, `feature`, `priceMin`, `priceMax`,
 * `sort` khác mặc định; S02 thêm `category`) → `noindex, follow` và canonical về trang sạch (`/du-an` hoặc trang danh mục); không lọc: canonical là chính nó
 * (kèm `?page=n` ở trang ≥ 2). Trang danh mục không có danh mục → `{}` (page trả 404).
 */
export function buildProjectListMetadata(input: ProjectMetadataInput): Promise<Metadata> {
  return input.categorySlug === undefined ? listMetadata(input) : categoryMetadata(input);
}
