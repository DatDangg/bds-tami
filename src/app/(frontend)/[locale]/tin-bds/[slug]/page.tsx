import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { buildContact } from "@/components/layout/shell-data";
import { PostDetail } from "@/components/posts/PostDetail";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTENT_ROUTES } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { populatedMedia } from "@/lib/news/news-view";
import { findPublicPostBySlug, findRelatedPosts, findRelatedTargets } from "@/lib/posts/post-queries";
import { toPostCards, toPostDetailView, toPostOfferView } from "@/lib/posts/post-view";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ — thiếu hàm này route có tham số động bị coi là
// dynamic và không vào cache ISR nên `revalidatePath` (hook lưu bài, job `expire-offers`) không có gì để làm mới.
export function generateStaticParams() {
  return [];
}

/** Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request). */
const loadPost = cache(async (locale: Locale, slug: string) => {
  const payload = await getPayload({ config });
  const doc = await findPublicPostBySlug(payload, locale, slug);
  if (!doc || !doc.title || !doc.slug) return null;
  const slugs = await findLocalizedSlugs(payload, "property-posts", doc.id);
  return { payload, doc, slugs };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const loaded = await loadPost(locale, slug);
  if (!loaded) return {};
  const { doc, slugs } = loaded;
  const identity = await loadSiteIdentity(locale);
  const hasEnglish = doc.hasEnglish === true && Boolean(slugs.en);
  return buildPageMetadata({
    locale,
    seo: doc.seo,
    title: doc.title ?? "",
    description: doc.excerpt,
    image: toOgImage(populatedMedia(doc.cover)),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: {
      vi: publicDetailPath(CONTENT_ROUTES["property-posts"], "vi", slugs.vi ?? doc.slug ?? slug),
      ...(hasEnglish && slugs.en ? { en: publicDetailPath(CONTENT_ROUTES["property-posts"], "en", slugs.en) } : {}),
    },
    hasEnglish,
  });
}

/** Hotline chung cho vùng form lead khi chưa có form. Global lỗi (DB tắt lúc `next build`) thì không có hotline, trang vẫn dựng. */
async function loadHotline(locale: Locale) {
  try {
    return buildContact(await getSiteSettings(locale)).hotline;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho trang chi tiết Đăng tin BĐS");
    return undefined;
  }
}

/**
 * S09 Chi tiết bài Đăng tin BĐS. ISR (`revalidate = 60` từ layout; lưu bài và job `expire-offers` 00:05 gọi `revalidatePath`). "Bây giờ" là lúc dựng
 * trang nên nhãn "Đã kết thúc" theo `isOfferEnded`. Bài không có / chưa công khai / thiếu bản EN → 404 (chặn sớm ở proxy cho nội dung SSR đầy đủ,
 * `resolve-missing-page.ts`; `notFound()` là lưới an toàn); slug cũ → 301 ở proxy. Bài ưu đãi đã kết thúc VẪN mở (BR-06) nhưng không có mã voucher.
 */
export default async function PostDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadPost(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const now = new Date();
  const [relatedDocs, targets, hotline, identity] = await Promise.all([
    findRelatedPosts(payload, locale, doc, now),
    findRelatedTargets(payload, locale, doc),
    loadHotline(locale),
    loadSiteIdentity(locale),
  ]);
  const tLead = await getTranslations({ locale, namespace: "page.posts.leadForm" });
  const view = toPostDetailView(doc, locale);
  const ownPath = publicDetailPath(CONTENT_ROUTES["property-posts"], locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const pageUrl = absoluteUrl(ownPath, siteUrl);
  const coverUrl = view.cover ? absoluteUrl(view.cover.sizes?.large?.url ?? view.cover.url ?? "", siteUrl) : undefined;
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;

  return (
    <>
      <PostDetail
        doc={doc}
        view={view}
        offer={toPostOfferView(doc, locale, now, targets)}
        related={toPostCards(relatedDocs, locale, now)}
        {...(hotline ? { hotline } : {})}
        ownPath={ownPath}
        {...(pageUrl ? { shareUrl: pageUrl } : {})}
        consultBanner={<ConsultBanner locale={locale} actionHref="#lead-form" {...(hotline ? { secondary: { label: tLead("callHotline", { phone: hotline.label }), href: hotline.telHref } } : {})} />}
      />
      {pageUrl && (
        <JsonLd
          data={buildArticleJsonLd({
            locale,
            headline: view.title,
            url: pageUrl,
            description: doc.excerpt,
            ...(coverUrl ? { imageUrls: [coverUrl] } : {}),
            datePublished: doc.publishedAt,
            dateModified: doc.updatedAt,
            publisher: { name: identity.siteName, ...(logoUrl ? { logoUrl } : {}) },
          })}
        />
      )}
    </>
  );
}
