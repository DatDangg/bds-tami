import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ContactDetails } from "@/components/contact/ContactDetails";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageBanner } from "@/components/layout/PageBanner";
import { LazyMap } from "@/components/media/LazyMap";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicPath } from "@/lib/content/content-paths";
import { buildContactPageView } from "@/lib/content/contact-view";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadSiteIdentity } from "@/lib/content/site-identity";
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

  const [t, tNav, settings, identity] = await Promise.all([
    getTranslations({ locale, namespace: "page.contact" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    readSettings(locale),
    loadSiteIdentity(locale),
  ]);
  const { contact, socials, mapLocation } = buildContactPageView(settings);
  const siteUrl = getSiteUrl();
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;

  return (
    <>
      <PageBanner title={t("title")} description={t("description")} />
      <Breadcrumb className="py-2" items={[{ label: tNav("contact"), href: publicPath("/lien-he", locale) }]} />
      {/* Thứ tự DOM = thứ tự đọc/Tab ở 375: thông tin → form → bản đồ; từ lg 2 cột 5/7 (form cao qua 2 hàng bên phải). */}
      <div className="mx-auto grid w-full max-w-container gap-10 px-gutter pt-6 pb-section-tight lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-5 lg:row-start-1">
          <ContactDetails contact={contact} socials={socials} />
        </div>
        <div className="lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
          <LeadFormSlot title={t("formTitle")} fallback={<p className="text-body text-text-secondary">{t("formFallback")}</p>} />
        </div>
        {mapLocation && (
          <div className="lg:col-span-5 lg:row-start-2">
            <LazyMap location={mapLocation} label={t("mapLabel")} />
          </div>
        )}
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
