import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { ArrowRight } from "@/components/icons";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { NewsArticleBody, NewsArticleTags } from "@/components/news/NewsArticle";
import { NewsArticleContactNote } from "@/components/news/NewsArticleContactNote";
import { NewsArticleHero } from "@/components/news/NewsArticleHero";
import { NewsArticleSidebar } from "@/components/news/NewsArticleSidebar";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsTocDisclosure } from "@/components/news/NewsToc";
import { NewsViewBeacon } from "@/components/news/NewsViewBeacon";
import { JsonLd } from "@/components/seo/JsonLd";
import { CONTENT_ROUTES, publicPath } from "@/lib/content/content-paths";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { collectTocHeadings } from "@/lib/content/section-headings";
import { loadNewsContactNote } from "@/lib/content/load-news-contact-note";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { loadMentionedProjects } from "@/lib/news/mentioned-projects";
import { findLocalizedSlugs, findPublicNewsBySlug, findRelatedNews } from "@/lib/news/news-queries";
import { categoryHref, populatedMedia, toNewsCards, visibleCategory } from "@/lib/news/news-view";
import { estimateReadMinutes } from "@/lib/news/read-time";
import { buildArticleJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";

/** id đã dùng trên trang chi tiết tin tức, mục lục không được trùng. */
const PAGE_RESERVED_IDS = ["related-news", "article-consult", "main", "floating-contact-actions"];

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
 * S11 Chi tiết tin tức theo design `chi-tiet-tin-tuc-v2.webp` (BL-062, thay BL-054): KHÔNG dùng `DetailLayout`. Nền `--color-bg`. Hero ảnh bìa toàn chiều ngang
 * (`NewsArticleHero`: breadcrumb kính, chip danh mục, `h1`, sapo, tác giả + ngày + phút đọc, chia sẻ) → lưới thân bài ≥ lg `[cột trái 15rem][bài]` (KHÔNG `items-start` để ô trái
 * cao bằng hàng): cột bài = (< lg: mục lục gập) → nội dung (`news-prose`) → khung liên hệ cuối bài (chữ admin / mặc định) → "Thẻ:" (ẩn ở `/en`); cột trái dính =
 * "Mục lục" (chỉ khi có heading) + thẻ "Tư vấn miễn phí" (`NewsArticleSidebar`, khung dính BL-061). "Bài viết liên quan" (≤ 3 thẻ `related` + "Xem tất cả tin tức") và banner
 * tư vấn nằm NGOÀI lưới nên cột trái thôi dính trước chúng. Gửi lượt xem (`NewsViewBeacon`, client) — trang vẫn ISR (`revalidate = 60` từ layout; lưu bài gọi `revalidatePath`;
 * chữ khung liên hệ đi qua cache tag `site-settings`). Bài không có / chưa công khai / thiếu bản EN → 404.
 */
export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadArticle(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const [t, tDetail, tRich, tNav, identity, relatedDocs, mentionedProjects, contactNote] = await Promise.all([
    getTranslations({ locale, namespace: "page.news" }),
    getTranslations({ locale, namespace: "page.newsDetail.v2" }),
    getTranslations({ locale, namespace: "page.richText" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    loadSiteIdentity(locale),
    findRelatedNews(payload, locale, doc),
    loadMentionedProjects(payload, locale, doc.content),
    loadNewsContactNote(locale),
  ]);
  const title = doc.title ?? "";
  const category = visibleCategory(doc.category, locale);
  const parentCategory = category ? visibleCategory(category.parent, locale) : null;
  const cover = populatedMedia(doc.cover);
  const related = toNewsCards(relatedDocs, locale);
  const ownPath = publicDetailPath(CONTENT_ROUTES.news, locale, doc.slug ?? slug);
  const listPath = publicPath("/tin-tuc", locale);
  const siteUrl = getSiteUrl();
  const articleUrl = absoluteUrl(ownPath, siteUrl);
  const coverUrl = absoluteUrl(cover?.sizes?.large?.url ?? cover?.url ?? "", siteUrl);
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;
  // id có sẵn trên trang (khối Tin liên quan, thẻ tư vấn + khung chung PublicShell: `main` là đích skip-link, nút liên hệ nổi): heading trùng chữ sẽ được thêm hậu tố.
  const tocHeadings = collectTocHeadings(doc.content, PAGE_RESERVED_IDS);
  // Tags chưa có bản EN (spec-validation F2): `/en` ẩn cả dòng "Thẻ:".
  const tags = locale === "en" ? [] : (doc.tags ?? []).filter((tag) => tag.trim() !== "");
  const tocLabel = t("tocTitle");

  return (
    <article className="bg-bg">
      <NewsViewBeacon newsId={doc.id} />
      <NewsArticleHero
        title={title}
        excerpt={doc.excerpt}
        cover={cover}
        category={category ? { name: category.name ?? "", href: categoryHref(category, locale) } : null}
        publishedAt={doc.publishedAt}
        readMinutes={estimateReadMinutes(doc.content)}
        locale={locale}
        shareUrl={articleUrl ?? undefined}
        breadcrumb={
          <Breadcrumb
            variant="overlay"
            items={[
              { label: tNav("news"), href: listPath },
              ...(parentCategory ? [{ label: parentCategory.name ?? "", href: categoryHref(parentCategory, locale) }] : []),
              ...(category ? [{ label: category.name ?? "", href: categoryHref(category, locale) }] : []),
              { label: title, href: ownPath },
            ]}
          />
        }
      />
      <div className="mx-auto grid w-full max-w-container gap-x-12 px-gutter pt-8 pb-section-tight lg:grid-cols-[15rem_minmax(0,1fr)] lg:pt-10">
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">
          {tocHeadings.length > 0 && <NewsTocDisclosure headings={tocHeadings} label={tocLabel} />}
          <NewsArticleBody content={doc.content} locale={locale} tableLabel={tRich("table")} headingIds={tocHeadings.map((heading) => heading.id)} mentionedProjects={mentionedProjects} />
          <NewsArticleContactNote text={contactNote} contactHref={`${publicPath("/lien-he", locale)}#lead-form`} />
          <NewsArticleTags tags={tags} listPath={listPath} />
        </div>
        <NewsArticleSidebar headings={tocHeadings} tocLabel={tocLabel} contactHref={publicPath("/lien-he", locale)} className="mt-10 lg:col-start-1 lg:row-start-1 lg:mt-0" />
      </div>
      {related.length > 0 && (
        <section aria-labelledby="related-news" className="bg-surface py-section-tight">
          <div className="mx-auto flex w-full max-w-container flex-col gap-6 px-gutter">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-left">
              <h2 id="related-news" className="text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase">
                {tDetail("related")}
              </h2>
              <Link href={listPath} className="inline-flex min-h-11 items-center gap-2 text-small font-semibold text-text transition-colors hover:text-accent-text">
                {tDetail("viewAll")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id} className="min-w-0">
                  <NewsCard data={item} variant="related" headingLevel="h3" />
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
