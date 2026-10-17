import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { NewsCard } from "@/components/news/NewsCard";
import { ShareButtons } from "@/components/news/ShareButtons";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTENT_ROUTES, publicPath } from "@/lib/content/content-paths";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { formatDate } from "@/lib/format";
import { findLocalizedSlugs, findPublicNewsBySlug, findRelatedNews } from "@/lib/news/news-queries";
import { categoryHref, populatedMedia, toNewsCards, visibleCategory } from "@/lib/news/news-view";
import { estimateReadMinutes } from "@/lib/news/read-time";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ (`dynamicParams` mặc định) — thiếu hàm này
// route có tham số động bị coi là dynamic và không vào cache ISR nên `revalidatePath` không có gì để làm mới.
export function generateStaticParams() {
  return [];
}

/** Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request). */
const loadArticle = cache(async (locale: Locale, slug: string) => {
  const payload = await getPayload({ config });
  const doc = await findPublicNewsBySlug(payload, locale, slug);
  if (!doc || !doc.title || !doc.slug) return null;
  const slugs = await findLocalizedSlugs(payload, "news", doc.id);
  return { payload, doc, slugs };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const loaded = await loadArticle(locale, slug);
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
      vi: publicDetailPath(CONTENT_ROUTES.news, "vi", slugs.vi ?? doc.slug ?? slug),
      ...(hasEnglish && slugs.en ? { en: publicDetailPath(CONTENT_ROUTES.news, "en", slugs.en) } : {}),
    },
    hasEnglish,
    ogType: "article",
  });
}

/** S11 Chi tiết tin tức. Trang ISR (`revalidate = 60` từ layout; lưu bài gọi `revalidatePath`). Bài không có / chưa công khai / thiếu bản EN → 404. */
export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadArticle(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const [t, tRich, tNav, identity, relatedDocs] = await Promise.all([
    getTranslations({ locale, namespace: "page.news" }),
    getTranslations({ locale, namespace: "page.richText" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    loadSiteIdentity(locale),
    findRelatedNews(payload, locale, doc),
  ]);
  const title = doc.title ?? "";
  const category = visibleCategory(doc.category, locale);
  const parentCategory = category ? visibleCategory(category.parent, locale) : null;
  const cover = populatedMedia(doc.cover);
  const related = toNewsCards(relatedDocs, locale);
  const ownPath = publicDetailPath(CONTENT_ROUTES.news, locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const articleUrl = absoluteUrl(ownPath, siteUrl);
  const coverUrl = absoluteUrl(cover?.sizes?.large?.url ?? cover?.url ?? "", siteUrl);
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;
  const tags = (doc.tags ?? []).filter((tag) => tag.trim() !== "");

  return (
    <article>
      <Breadcrumb
        className="py-2"
        items={[
          { label: tNav("news"), href: publicPath("/tin-tuc", locale) },
          ...(parentCategory ? [{ label: parentCategory.name ?? "", href: categoryHref(parentCategory, locale) }] : []),
          ...(category ? [{ label: category.name ?? "", href: categoryHref(category, locale) }] : []),
          { label: title, href: ownPath },
        ]}
      />
      <header className="mx-auto flex w-full max-w-text flex-col gap-4 px-gutter pt-6 pb-8">
        {category && (
          <Link href={categoryHref(category, locale)} className="inline-flex min-h-11 w-fit items-center text-small font-semibold text-accent-text hover:underline">
            {category.name}
          </Link>
        )}
        <h1 className="font-display text-h1 text-balance">{title}</h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-text-muted">
          {doc.publishedAt && <time dateTime={doc.publishedAt}>{formatDate(doc.publishedAt, locale)}</time>}
          <span>{t("readTime", { minutes: estimateReadMinutes(doc.content) })}</span>
        </p>
      </header>
      {cover && (
        <div className="mx-auto w-full max-w-5xl sm:px-gutter">
          <ResponsiveImage media={cover} alt={cover.alt || title} sizes="(min-width: 1024px) 1024px, 100vw" aspectRatio="16/9" priority />
        </div>
      )}
      <div className="mx-auto w-full max-w-text px-gutter py-10">
        <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
      </div>
      <footer className="mx-auto flex w-full max-w-text flex-col gap-6 px-gutter pb-section-tight">
        {tags.length > 0 && (
          <ul aria-label={t("tagsLabel")} className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full border border-border px-3 py-1 text-small text-text-secondary">
                {tag}
              </li>
            ))}
          </ul>
        )}
        <ShareButtons title={title} {...(articleUrl ? { url: articleUrl } : {})} />
      </footer>
      {related.length > 0 && (
        <section aria-labelledby="related-news" className="bg-bg-alt py-section-tight">
          <div className="mx-auto w-full max-w-container px-gutter">
            <h2 id="related-news" className="mb-8 font-display text-h2">
              {t("relatedTitle")}
            </h2>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <NewsCard data={item} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      {articleUrl && (
        <JsonLd
          data={buildArticleJsonLd({
            locale,
            headline: title,
            url: articleUrl,
            description: doc.excerpt,
            ...(coverUrl ? { imageUrls: [coverUrl] } : {}),
            datePublished: doc.publishedAt,
            dateModified: doc.updatedAt,
            publisher: { name: identity.siteName, ...(logoUrl ? { logoUrl } : {}) },
          })}
        />
      )}
    </article>
  );
}
