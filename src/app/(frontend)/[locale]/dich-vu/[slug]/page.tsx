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
import { DETAIL_ASIDE_CARD_CLASS, DetailLayout } from "@/components/detail/DetailLayout";
import { ConsultBanner } from "@/components/layout/ConsultBanner";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { buildContact } from "@/components/layout/shell-data";
import { Phone } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServiceCard } from "@/components/services/ServiceCard";
import { CONTENT_ROUTES, publicPath } from "@/lib/content/content-paths";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadPageBanner } from "@/lib/content/load-page-banner";
import { publicDetailPath } from "@/lib/content/redirect-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { logger } from "@/lib/logger";
import { findLocalizedSlugs } from "@/lib/news/news-queries";
import { findOtherServices, findPublicServiceBySlug } from "@/lib/services/service-queries";
import { populatedCover, toServiceCards } from "@/lib/services/service-view";
import { buildServiceJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata, toOgImage } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { cn } from "@/lib/utils";
import { routing, type Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Không prerender lúc build (dữ liệu + env đọc lúc chạy); `[]` bật ISR theo yêu cầu cho slug bất kỳ để `revalidatePath` của hook lưu dịch vụ có tác dụng.
export function generateStaticParams() {
  return [];
}

/** Hotline cho thẻ tư vấn. Global lỗi (DB tắt lúc `next build`) thì không có hotline, trang vẫn dựng (cùng cách `load-shell`). */
async function loadHotline(locale: Locale) {
  try {
    return buildContact(await getSiteSettings(locale)).hotline;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho thẻ tư vấn dịch vụ");
    return undefined;
  }
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

  const [t, tRich, identity, otherDocs, defaultBanner, hotline] = await Promise.all([
    getTranslations({ locale, namespace: "page.services" }),
    getTranslations({ locale, namespace: "page.richText" }),
    loadSiteIdentity(locale),
    findOtherServices(payload, locale, doc.id),
    loadPageBanner(locale, "default"),
    loadHotline(locale),
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
  const heroImage = cover ?? defaultBanner;
  const adviceHref = `${publicPath("/lien-he", locale)}?service=${encodeURIComponent(doc.slug ?? slug)}`;

  return (
    <article>
      <DetailLayout
        before={
          <PageHero
            size="short"
            eyebrow={t("eyebrow")}
            title={title}
            {...(doc.summary ? { description: doc.summary } : {})}
            {...(heroImage ? { image: heroImage } : {})}
            breadcrumb={<Breadcrumb variant="overlay" items={[{ label: title, href: ownPath }]} />}
          />
        }
        asideLabelledBy="service-advice-title"
        aside={
          <div className={cn("flex flex-col gap-4", DETAIL_ASIDE_CARD_CLASS)}>
            <h2 id="service-advice-title" className="font-display text-h3">
              {t("adviceTitle")}
            </h2>
            <p className="text-text-secondary">{t("adviceDescription")}</p>
            {hotline && (
              <a href={hotline.telHref} className="inline-flex min-h-11 w-fit items-center gap-2 font-display text-h3 text-accent-text transition-colors hover:text-text">
                <Phone size={22} weight="fill" aria-hidden="true" />
                {hotline.label}
              </a>
            )}
            <Button asChild size="lg" className="w-full">
              <Link href={adviceHref}>{t("adviceCta")}</Link>
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow={t("eyebrow")} title={t("detailTitle")} />
          <RichText data={doc.content} locale={locale} tableLabel={tRich("table")} className="max-w-[68ch]" />
        </div>
      </DetailLayout>
      {others.length > 0 && (
        <section aria-labelledby="other-services" className="bg-surface py-section-tight">
          <div className="mx-auto flex w-full max-w-container flex-col gap-8 px-gutter">
            <SectionHeading id="other-services" title={t("otherTitle")} />
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
      <ConsultBanner locale={locale} actionHref={adviceHref} />
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
