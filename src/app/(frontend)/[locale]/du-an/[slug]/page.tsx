import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { buildContact } from "@/components/layout/shell-data";
import { ProjectDetail } from "@/components/projects/ProjectDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTENT_ROUTES } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { populatedMedia } from "@/lib/news/news-view";
import { findProjectListings } from "@/lib/projects/project-listings";
import { toProjectDetailView } from "@/lib/projects/project-detail-view";
import { findOtherProjects, findPublicProjectBySlug } from "@/lib/projects/project-queries";
import { toProjectCards } from "@/lib/projects/project-view";
import { toPostCards } from "@/lib/posts/post-view";
import { toRentalCards } from "@/lib/rentals/rental-view";
import { buildRealEstateListingJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";
import type { Media, Project } from "@/payload-types";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Số ảnh đưa vào JSON-LD `image` (đủ cho Google, không phình HTML). */
const JSON_LD_IMAGE_COUNT = 5;

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ (`dynamicParams` mặc định) — thiếu hàm này
// route có tham số động bị coi là dynamic và không vào cache ISR nên `revalidatePath` của hook lưu dự án không có gì để làm mới.
export function generateStaticParams() {
  return [];
}

/** Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request). */
const loadProject = cache(async (locale: Locale, slug: string) => {
  const payload = await getPayload({ config });
  const doc = await findPublicProjectBySlug(payload, locale, slug);
  if (!doc || !doc.title || !doc.slug) return null;
  const slugs = await findLocalizedSlugs(payload, "projects", doc.id);
  return { payload, doc, slugs };
});

/** Ảnh đầu thư viện còn dùng được (ảnh đã bị xoá thì bỏ qua) làm ảnh OG; `null` → `buildPageMetadata` rơi về logo site. */
function firstGalleryMedia(doc: Project): Media | null {
  return doc.gallery?.flatMap((item) => populatedMedia(item) ?? [])[0] ?? null;
}

/** Hotline chung cho khối form. Global lỗi (DB tắt lúc `next build`) thì không có hotline, trang vẫn dựng (cùng cách `load-shell`). */
async function loadHotline(locale: Locale) {
  try {
    return buildContact(await getSiteSettings(locale)).hotline;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho khối form dự án");
    return undefined;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const loaded = await loadProject(locale, slug);
  if (!loaded) return {};
  const { doc, slugs } = loaded;
  const identity = await loadSiteIdentity(locale);
  const hasEnglish = doc.hasEnglish === true && Boolean(slugs.en);
  return buildPageMetadata({
    locale,
    seo: doc.seo,
    title: doc.title ?? "",
    description: doc.summary,
    image: toOgImage(firstGalleryMedia(doc)),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: {
      vi: publicDetailPath(CONTENT_ROUTES.projects, "vi", slugs.vi ?? doc.slug ?? slug),
      ...(hasEnglish && slugs.en ? { en: publicDetailPath(CONTENT_ROUTES.projects, "en", slugs.en) } : {}),
    },
    hasEnglish,
  });
}

/**
 * S03 Chi tiết dự án. Trang ISR (`revalidate = 60` từ layout; lưu dự án gọi `revalidatePath`). Không có / chưa công khai / thiếu bản EN
 * → 404 (đã chặn sớm ở proxy cho nội dung SSR đầy đủ, `resolve-missing-page.ts`; `notFound()` ở đây là lưới an toàn); slug cũ → 301 ở proxy.
 */
export default async function ProjectDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadProject(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const now = new Date();
  const [relatedDocs, listingDocs, hotline, identity] = await Promise.all([
    findOtherProjects(payload, locale, doc),
    findProjectListings(payload, locale, doc.id, now),
    loadHotline(locale),
    loadSiteIdentity(locale),
  ]);
  const view = toProjectDetailView(doc, locale);
  const ownPath = publicDetailPath(CONTENT_ROUTES.projects, locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const imageUrls = view.gallery.slice(0, JSON_LD_IMAGE_COUNT).flatMap((image) => {
    const url = absoluteUrl(image.sizes?.large?.url ?? image.url ?? "", siteUrl);
    return url ? [url] : [];
  });
  const pageUrl = absoluteUrl(ownPath, siteUrl);
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;

  return (
    <>
      <ProjectDetail doc={doc} view={view} related={toProjectCards(relatedDocs, locale)}
        listings={{ rentals: toRentalCards(listingDocs.rentals, locale), posts: toPostCards(listingDocs.posts, locale, now) }}
        {...(hotline ? { hotline } : {})} ownPath={ownPath} />
      {pageUrl && siteUrl && (
        <JsonLd
          data={buildRealEstateListingJsonLd({
            locale,
            name: view.title,
            url: pageUrl,
            description: view.summary,
            imageUrls,
            datePosted: doc.publishedAt,
            address: [view.address, view.areaLabel].filter(Boolean).join(", ") || null,
            // G26: đơn vị đăng tin (Organization).
            publisher: { name: identity.siteName, siteUrl, ...(logoUrl ? { logoUrl } : {}) },
          })}
        />
      )}
    </>
  );
}
