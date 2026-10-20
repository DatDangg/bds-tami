import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { LazyMap } from "@/components/media/LazyMap";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicPath } from "@/lib/content/content-paths";
import { buildContactPageView } from "@/lib/content/contact-view";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { logger } from "@/lib/logger";
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { routing, type Locale } from "@/i18n/routing";
import type { SiteSetting } from "@/payload-types";

interface PageProps {
  params: Promise<{ locale: string }>;
}

async function readSettings(locale: Locale): Promise<SiteSetting | null> {
  try {
    return await getSiteSettings(locale);
  } catch (error) {
    // DB tắt lúc `next build`: trang vẫn dựng, không có thông tin liên hệ (cùng cách `load-shell`).
    logger.warn({ err: error }, "Không đọc được site-settings cho trang Liên hệ");
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, identity] = await Promise.all([getTranslations({ locale, namespace: "page.contact" }), loadSiteIdentity(locale)]);
  return buildPageMetadata({
    locale,
    title: t("title"),
    description: t("description"),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: { vi: publicPath("/lien-he", "vi"), en: publicPath("/lien-he", "en") },
    hasEnglish: true,
  });
}

/**
 * S15 Liên hệ: thông tin từ `site-settings`, vùng chừa form lead, bản đồ lười (ẩn khi chưa có `mapLocation`).
 * Trang không đọc `searchParams` (form tự đọc `?service=` ở client khi được ráp) nên giữ ISR; `site-settings` đổi thì tag làm mới.
 */
export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tNav, settings, identity, hero] = await Promise.all([
    getTranslations({ locale, namespace: "page.contact" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    readSettings(locale),
    loadSiteIdentity(locale),
    loadPageHero(locale, "contact"),
  ]);
  const { contact, socials, mapLocation } = buildContactPageView(settings);
  const siteUrl = getSiteUrl();
  const turnstileSiteKey = readTurnstileSiteKey();
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;

  return (
    <>
      <PageHero
        size="short"
        title={hero.title}
        {...(hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
        {...(hero.eyebrow ? { eyebrow: hero.eyebrow } : {})}
        {...(hero.description ? { description: hero.description } : {})}
        {...(hero.image ? { image: hero.image } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={[{ label: tNav("contact"), href: publicPath("/lien-he", locale) }]} />}
      />
      {/* Mockup `.contact`: thông tin trái, thẻ form trắng nổi phải (1 : 1,2); bản đồ bo 20px dưới cả hai. Thứ tự DOM = thứ tự đọc/Tab: thông tin → form → bản đồ. */}
      <div className="mx-auto flex w-full max-w-container flex-col gap-10 px-gutter py-section-tight">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-col gap-8">
            <SectionHeading eyebrow={t("officeEyebrow")} title={t("officeTitle")} titleAccent={t("officeTitleAccent")} />
            <ContactDetails contact={contact} socials={socials} />
          </div>
          <LeadFormSlot title={t("formTitle")} className="rounded-xl bg-surface p-6 shadow-md md:p-8 lg:p-8">
            <LeadForm source="contact" {...(turnstileSiteKey ? { turnstileSiteKey } : {})} />
          </LeadFormSlot>
        </div>
        {mapLocation && <LazyMap location={mapLocation} label={t("mapLabel")} aspectRatio="16/7" className="[&>[role=region]]:rounded-xl" />}
      </div>
      {siteUrl && (
        <JsonLd
          data={buildOrganizationJsonLd({
            name: identity.siteName,
            siteUrl,
            ...(logoUrl ? { logoUrl } : {}),
            sameAs: socials.map((social) => social.url),
            telephone: contact.hotline?.label ?? null,
            email: contact.email ?? null,
            address: contact.address ?? null,
          })}
        />
      )}
    </>
  );
}
