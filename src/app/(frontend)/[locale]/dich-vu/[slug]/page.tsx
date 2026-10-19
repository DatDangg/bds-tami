import config from "@payload-config";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { cache } from "react";
import { RichText } from "@/components/content/RichText";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CtaBanner } from "@/components/layout/CtaBanner";
import { PageBanner } from "@/components/layout/PageBanner";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServiceCard } from "@/components/services/ServiceCard";
import { CONTENT_ROUTES, publicPath } from "@/lib/content/content-paths";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { findOtherServices, findPublicServiceBySlug } from "@/lib/services/service-queries";
import { populatedCover, toServiceCards } from "@/lib/services/service-view";
import { buildServiceJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ để `revalidatePath` của hook lưu dịch vụ có tác dụng.
export function generateStaticParams() {
  return [];
}

/** Một lần đọc cho cả `generateMetadata` lẫn trang (React `cache` theo request). */
const loadService = cache(async (locale: Locale, slug: string) => {
  const payload = await getPayload({ config });
  const doc = await findPublicServiceBySlug(payload, locale, slug);
  if (!doc || !doc.title || !doc.slug) return null;
  const slugs = await findLocalizedSlugs(payload, "services", doc.id);
  return { payload, doc, slugs };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const loaded = await loadService(locale, slug);
  if (!loaded) return {};
  const { doc, slugs } = loaded;
  const identity = await loadSiteIdentity(locale);
  const hasEnglish = doc.hasEnglish === true && Boolean(slugs.en);
  return buildPageMetadata({
    locale,
    seo: doc.seo,
    title: doc.title ?? "",
    description: doc.summary,
    image: toOgImage(populatedCover(doc.coverImage)),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: {
      vi: publicDetailPath(CONTENT_ROUTES.services, "vi", slugs.vi ?? doc.slug ?? slug),
      ...(hasEnglish && slugs.en ? { en: publicDetailPath(CONTENT_ROUTES.services, "en", slugs.en) } : {}),
    },
    hasEnglish,
  });
}

/** S14 Dịch vụ. Trang ISR (`revalidate = 60` từ layout; lưu dịch vụ gọi `revalidatePath`). Không có / chưa công khai / thiếu bản EN → 404. */
export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loaded = await loadService(locale, slug);
  if (!loaded) notFound();
  const { payload, doc } = loaded;

  const [t, tCta, tRich, identity, otherDocs] = await Promise.all([
    getTranslations({ locale, namespace: "page.services" }),
    getTranslations({ locale, namespace: "page.cta" }),
    getTranslations({ locale, namespace: "page.richText" }),
    loadSiteIdentity(locale),
    findOtherServices(payload, locale, doc.id),
  ]);
  const title = doc.title ?? "";
  const cover = populatedCover(doc.coverImage);
  const others = toServiceCards(otherDocs, locale);
  const ownPath = publicDetailPath(CONTENT_ROUTES.services, locale, doc.slug ?? slug);
  const siteUrl = getSiteUrl();
  const serviceUrl = absoluteUrl(ownPath, siteUrl);
  const coverSrc = cover?.sizes?.large?.url ?? cover?.url;
  const coverUrl = coverSrc ? absoluteUrl(coverSrc, siteUrl) : undefined;
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;
  const adviceHref = `${publicPath("/lien-he", locale)}?service=${encodeURIComponent(doc.slug ?? slug)}`;

  return (
    <article>
      {cover ? (
        <section className="relative isolate flex h-[60svh] items-end overflow-hidden bg-dark-deep lg:h-[70svh]">
          <ResponsiveImage media={cover} sizes="100vw" priority decorative className="absolute inset-0 -z-10" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-dark-deep/80 via-dark-deep/30 to-transparent" />
          <div className="mx-auto flex w-full max-w-container flex-col gap-4 px-gutter pb-10 text-on-dark lg:pb-16">
            <h1 className="font-display text-display text-balance">{title}</h1>
            {doc.summary && <p className="max-w-[60ch] text-lead text-on-dark-muted">{doc.summary}</p>}
          </div>
        </section>
      ) : (
        <PageBanner title={title} description={doc.summary ?? undefined} />
      )}
      <Breadcrumb className="py-2" items={[{ label: title, href: ownPath }]} />
      <div className="mx-auto w-full max-w-text px-gutter py-10">
        <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} />
      </div>
      {others.length > 0 && (
        <section aria-labelledby="other-services" className="bg-bg-alt py-section-tight">
          <div className="mx-auto w-full max-w-container px-gutter">
            <h2 id="other-services" className="mb-8 font-display text-h2">
              {t("otherTitle")}
            </h2>
            <ul className="grid gap-6 md:grid-cols-2">
              {others.map((service) => (
                <li key={service.id}>
                  <ServiceCard data={service} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CtaBanner title={t("ctaTitle", { name: title })} description={t("ctaDescription")} actionLabel={tCta("getAdvice")} actionHref={adviceHref} />
      {serviceUrl && (
        <JsonLd
          data={buildServiceJsonLd({
            locale,
            name: title,
            url: serviceUrl,
            description: doc.summary,
            ...(coverUrl ? { imageUrls: [coverUrl] } : {}),
            provider: { name: identity.siteName, siteUrl: absoluteUrl("/", siteUrl) ?? serviceUrl, ...(logoUrl ? { logoUrl } : {}) },
          })}
        />
      )}
    </article>
  );
}
