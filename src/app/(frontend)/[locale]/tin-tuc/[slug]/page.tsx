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
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { NewsArticleSidebar } from "@/components/news/NewsArticleSidebar";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsTocDisclosure } from "@/components/news/NewsToc";
import { ShareButtons } from "@/components/news/ShareButtons";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTENT_ROUTES, publicPath } from "@/lib/content/content-paths";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { collectTocHeadings } from "@/lib/content/section-headings";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { formatDate } from "@/lib/format";
import { loadMentionedProjects } from "@/lib/news/mentioned-projects";
import { findLocalizedSlugs, findPublicNewsBySlug, findRelatedNews, LATEST_NEWS_COUNT, listPublicNews } from "@/lib/news/news-queries";
import { categoryHref, populatedMedia, toNewsCards, visibleCategory } from "@/lib/news/news-view";
import { estimateReadMinutes } from "@/lib/news/read-time";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";

/** id đã dùng trên trang chi tiết tin tức, mục lục không được trùng. */
const PAGE_RESERVED_IDS = ["related-news", "latest-news", "article-consult", "main", "floating-contact-actions"];

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

/**
 * S11 Chi tiết tin tức theo mockup `article` (BL-045): KHÔNG dùng `DetailLayout`. Nền `--color-bg`, breadcrumb `plain`, lưới ≥ lg `[bài][cột phải 22rem]`
 * (đầu bài canh trái → ảnh bìa → mục lục thu gọn → nội dung → tags + chia sẻ; cột phải "Bài viết mới" + thẻ tư vấn dính khi cuộn), cuối trang
 * "Bài viết liên quan" trên nền trắng rồi banner tư vấn. Trang ISR (`revalidate = 60` từ layout; lưu bài gọi `revalidatePath`). Bài không có / chưa công khai / thiếu bản EN → 404.
 */
export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadArticle(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const [t, tDetail, tRich, tNav, identity, relatedDocs, latestResult, mentionedProjects] = await Promise.all([
    getTranslations({ locale, namespace: "page.news" }),
    getTranslations({ locale, namespace: "page.newsDetail" }),
    getTranslations({ locale, namespace: "page.richText" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    loadSiteIdentity(locale),
    findRelatedNews(payload, locale, doc),
    listPublicNews(payload, locale, { page: 1, limit: LATEST_NEWS_COUNT, excludeIds: [doc.id] }),
    loadMentionedProjects(payload, locale, doc.content),
  ]);
  const title = doc.title ?? "";
  const category = visibleCategory(doc.category, locale);
  const parentCategory = category ? visibleCategory(category.parent, locale) : null;
  const cover = populatedMedia(doc.cover);
  const related = toNewsCards(relatedDocs, locale);
  const latest = toNewsCards(latestResult.docs, locale);
  const ownPath = publicDetailPath(CONTENT_ROUTES.news, locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const articleUrl = absoluteUrl(ownPath, siteUrl);
  const coverUrl = absoluteUrl(cover?.sizes?.large?.url ?? cover?.url ?? "", siteUrl);
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;
  // id có sẵn trên trang (khối Tin liên quan, cột phải + khung chung PublicShell: `main` là đích skip-link, nút liên hệ nổi): heading trùng chữ sẽ được thêm hậu tố.
  const tocHeadings = collectTocHeadings(doc.content, PAGE_RESERVED_IDS);
  const tags = (doc.tags ?? []).filter((tag) => tag.trim() !== "");
  const tocLabel = t("tocTitle");

  return (
    <article className="bg-bg">
      <Breadcrumb
        variant="plain"
        className="pt-6"
        items={[
          { label: tNav("news"), href: publicPath("/tin-tuc", locale) },
          ...(parentCategory ? [{ label: parentCategory.name ?? "", href: categoryHref(parentCategory, locale) }] : []),
          ...(category ? [{ label: category.name ?? "", href: categoryHref(category, locale) }] : []),
          { label: title, href: ownPath },
        ]}
      />
      <div className="mx-auto grid w-full max-w-container gap-10 px-gutter pb-section-tight lg:grid-cols-[minmax(0,48rem)_22rem] lg:justify-between lg:gap-12">
        <div className="min-w-0">
          <header className="flex flex-col items-start gap-3 pt-8 pb-8 text-left lg:pt-14">
            {category && (
              <Link
                href={categoryHref(category, locale)}
                className="inline-flex min-h-11 w-fit items-center text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase transition-colors hover:text-text"
              >
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
            <div className="mb-8 overflow-hidden rounded-[20px]">
              <ResponsiveImage media={cover} alt={cover.alt || title} sizes="(min-width: 1280px) 768px, (min-width: 1024px) 60vw, 100vw" aspectRatio="2/1" priority />
            </div>
          )}
          {tocHeadings.length > 0 && <NewsTocDisclosure headings={tocHeadings} label={tocLabel} />}
          <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" headingIds={tocHeadings.map((heading) => heading.id)} mentionedProjects={mentionedProjects} />
          <footer className="mt-8 flex flex-col gap-6">
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
        </div>
        <NewsArticleSidebar latest={latest} contactHref={publicPath("/lien-he", locale)} />
      </div>
      {related.length > 0 && (
        <section aria-labelledby="related-news" className="bg-surface py-section-tight">
          <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter">
            <SectionHeading id="related-news" eyebrow={tDetail("relatedEyebrow")} title={tDetail("relatedTitle")} titleAccent={tDetail("relatedAccent")} />
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <NewsCard data={item} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <ConsultBanner locale={locale} />
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
