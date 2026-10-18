import type { Payload, Where } from "payload";

import { locales, pathnames, type Locale } from "../../i18n/routing";
import { startOfVietnamDay } from "../careers/deadline";
import { LEGAL_PAGE_ROUTES, publicPath, type LegalPageKind } from "../content/content-paths";
import { publicWhere, type PublicCollectionSlug } from "../content/public-queries";
import { buildLocalizedUrls, DOCS_PER_SITEMAP, type SitemapUrl } from "./sitemap-xml";

type PathnameKey = keyof typeof pathnames;

/**
 * Một nhóm sitemap = một collection (hoặc trang tĩnh). `extraWhere` là điều kiện THÊM vào `publicWhere` cho đúng thứ
 * trang chi tiết cho phép index: tin đã thuê (`rented`, trang đặt noindex) và tuyển dụng quá hạn (noindex) bị loại ở truy vấn.
 */
interface CollectionSection {
  collection: PublicCollectionSlug;
  route: PathnameKey;
  /** Tên tham số động của `route` (`slug`, `category`). */
  param: string;
  extraWhere?: (now: Date) => Where;
}

const COLLECTION_SECTIONS = {
  projects: { collection: "projects", route: "/du-an/[slug]", param: "slug" },
  rentals: { collection: "rentals", route: "/cho-thue/[slug]", param: "slug", extraWhere: () => ({ status: { equals: "published" } }) },
  "property-posts": { collection: "property-posts", route: "/tin-bds/[slug]", param: "slug" },
  news: { collection: "news", route: "/tin-tuc/[slug]", param: "slug" },
  "job-postings": {
    collection: "job-postings",
    route: "/tuyen-dung/[slug]",
    param: "slug",
    extraWhere: (now) => ({ deadline: { greater_than_equal: startOfVietnamDay(now).toISOString() } }),
  },
  services: { collection: "services", route: "/dich-vu/[slug]", param: "slug" },
  "categories-news": {
    collection: "categories",
    route: "/tin-tuc/danh-muc/[category]",
    param: "category",
    extraWhere: () => ({ scope: { equals: "news" } }),
  },
  "categories-property-posts": {
    collection: "categories",
    route: "/tin-bds/danh-muc/[category]",
    param: "category",
    extraWhere: () => ({ scope: { equals: "property_post" } }),
  },
  "categories-rentals": {
    collection: "categories",
    route: "/cho-thue/danh-muc/[category]",
    param: "category",
    extraWhere: () => ({ scope: { equals: "rental" } }),
  },
} as const satisfies Record<string, CollectionSection>;

export const STATIC_SECTION = "static";
export type SitemapSection = typeof STATIC_SECTION | keyof typeof COLLECTION_SECTIONS;
export const SITEMAP_SECTIONS: readonly SitemapSection[] = [STATIC_SECTION, ...(Object.keys(COLLECTION_SECTIONS) as (keyof typeof COLLECTION_SECTIONS)[])];

export function isSitemapSection(value: string): value is SitemapSection {
  return (SITEMAP_SECTIONS as readonly string[]).includes(value);
}

/** Trang có route cố định, tồn tại ở cả hai ngôn ngữ (không phụ thuộc bản ghi). Danh sách Cho thuê theo `routing.ts`. */
const STATIC_ROUTES: readonly PathnameKey[] = ["/", "/du-an", "/cho-thue", "/tin-bds", "/tin-tuc", "/tuyen-dung", "/lien-he"];

/** Hình dạng bản ghi khi đọc `locale: "all"`: trường localized là object theo ngôn ngữ. */
interface SitemapDoc {
  slug?: Partial<Record<Locale, string | null>> | null;
  kind?: string | null;
  hasEnglish?: boolean | null;
  updatedAt?: string | null;
  seo?: Partial<Record<Locale, { noindex?: boolean | null } | null>> | null;
}

/** Trang chi tiết dùng `seo.noindex` theo từng ngôn ngữ (nhóm `seo` localized), nên mỗi ngôn ngữ xét riêng. */
function isIndexable(doc: SitemapDoc, locale: Locale): boolean {
  return doc.seo?.[locale]?.noindex !== true;
}

/** URL của một bản ghi: vi luôn có (đã qua `publicWhere` vi); en chỉ khi `hasEnglish` và có slug en. */
export function docUrls(doc: SitemapDoc, route: PathnameKey, param: string, siteUrl: string): SitemapUrl[] {
  const viSlug = doc.slug?.vi;
  const enSlug = doc.hasEnglish === true ? doc.slug?.en : undefined;
  const paths: Partial<Record<Locale, string>> = {};
  if (viSlug && isIndexable(doc, "vi")) paths.vi = publicPath(route, "vi", { [param]: viSlug });
  if (enSlug && isIndexable(doc, "en")) paths.en = publicPath(route, "en", { [param]: enSlug });
  return buildLocalizedUrls(paths, siteUrl, doc.updatedAt ?? undefined);
}

function sectionWhere(section: CollectionSection, now: Date): Where {
  const base = publicWhere(section.collection, "vi");
  return section.extraWhere ? { and: [base, section.extraWhere(now)] } : base;
}

/** Số file sitemap của một nhóm (≥ 1 cho nhóm tĩnh; nhóm collection rỗng = 0 file, không vào index). */
export async function countSectionChunks(payload: Payload, section: SitemapSection, now: Date): Promise<number> {
  if (section === STATIC_SECTION) return 1;
  const config = COLLECTION_SECTIONS[section];
  const { totalDocs } = await payload.count({
    collection: config.collection,
    where: sectionWhere(config, now),
    overrideAccess: false,
    trash: false,
  });
  return Math.ceil(totalDocs / DOCS_PER_SITEMAP);
}

async function staticUrls(payload: Payload, siteUrl: string): Promise<SitemapUrl[]> {
  const urls = STATIC_ROUTES.flatMap((route) =>
    buildLocalizedUrls(Object.fromEntries(locales.map((locale) => [locale, publicPath(route, locale)])), siteUrl),
  );
  const legal = await payload.find({
    collection: "pages",
    where: publicWhere("pages", "vi"),
    locale: "all",
    fallbackLocale: false,
    overrideAccess: false,
    trash: false,
    depth: 0,
    pagination: false,
    select: { kind: true, hasEnglish: true, updatedAt: true },
  });
  for (const page of legal.docs as unknown as SitemapDoc[]) {
    const route = page.kind ? LEGAL_PAGE_ROUTES[page.kind as LegalPageKind] : undefined;
    if (!route) continue;
    const paths: Partial<Record<Locale, string>> = { vi: publicPath(route, "vi") };
    if (page.hasEnglish === true) paths.en = publicPath(route, "en");
    urls.push(...buildLocalizedUrls(paths, siteUrl, page.updatedAt ?? undefined));
  }
  return urls;
}

/** URL của file sitemap thứ `chunk` (bắt đầu từ 1) của một nhóm; chạy như KHÁCH (`overrideAccess: false`), không rơi về tiếng Việt khi thiếu bản en. */
export async function loadSectionUrls(payload: Payload, section: SitemapSection, chunk: number, siteUrl: string, now: Date): Promise<SitemapUrl[]> {
  if (section === STATIC_SECTION) return chunk === 1 ? staticUrls(payload, siteUrl) : [];
  const config = COLLECTION_SECTIONS[section];
  const result = await payload.find({
    collection: config.collection,
    where: sectionWhere(config, now),
    locale: "all",
    fallbackLocale: false,
    overrideAccess: false,
    trash: false,
    depth: 0,
    sort: ["createdAt", "id"],
    page: chunk,
    limit: DOCS_PER_SITEMAP,
    select: { slug: true, hasEnglish: true, updatedAt: true, seo: true },
  });
  return (result.docs as unknown as SitemapDoc[]).flatMap((doc) => docUrls(doc, config.route, config.param, siteUrl));
}

/** `projects-2.xml` → `{ section: "projects", chunk: 2 }`; sai định dạng hoặc chunk < 1 → `null` (nhóm có hợp lệ không do `isSitemapSection` quyết). */
export function parseSitemapFile(file: string): { section: string; chunk: number } | null {
  const match = /^([a-z-]+)-([1-9]\d{0,5})\.xml$/.exec(file);
  return match?.[1] && match[2] ? { section: match[1], chunk: Number(match[2]) } : null;
}
