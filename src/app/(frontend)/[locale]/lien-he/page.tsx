import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ContactCards } from "@/components/contact/ContactCards";
import { JoinTeamBanner } from "@/components/contact/JoinTeamBanner";
import { OfficeSystem } from "@/components/contact/OfficeSystem";
import { LeadFormSlot } from "@/components/forms/LeadFormSlot";
import { LeadForm } from "@/components/leads/LeadForm";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { publicPath } from "@/lib/content/content-paths";
import { buildContactPageView } from "@/lib/content/contact-view";
import { getSiteSettings } from "@/lib/content/get-globals";
import { loadPageHero } from "@/lib/content/load-page-banner";
import { resolvePageBanner } from "@/lib/content/page-banner";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { readTurnstileSiteKey } from "@/lib/leads/turnstile-site-key";
import { logger } from "@/lib/logger";
import { buildOrganizationJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { cn } from "@/lib/utils";
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
 * S15 Liên hệ (BL-054, design `lien-he`): hero `pageHeroes.contact` → 4 thẻ nổi đè mép dưới hero (Hotline / Email / Zalo OA / Giờ làm việc, thẻ thiếu dữ liệu ẩn)
 * → [form lead `source=contact` | "Hệ thống văn phòng" (tab + bản đồ + thẻ văn phòng; `offices` trống → 1 văn phòng từ trường cũ)] → banner "Gia nhập TAMI HOMES".
 * Không banner tư vấn (BL-045). Trang không đọc `searchParams` nên giữ ISR; `site-settings` đổi thì tag làm mới.
 */
export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tNav, settings, identity, hero] = await Promise.all([
    getTranslations({ locale, namespace: "page.contact.v2" }),
    getTranslations({ locale, namespace: "layout.nav.items" }),
    readSettings(locale),
    loadSiteIdentity(locale),
    loadPageHero(locale, "contact"),
  ]);
  const { contact, socials, cards, offices } = buildContactPageView(settings, t("fallbackOfficeName", { siteName: identity.siteName }));
  const hasCards = Object.keys(cards).length > 0;
  const careersImage = resolvePageBanner(settings, "careers");
  const siteUrl = getSiteUrl();
  const turnstileSiteKey = readTurnstileSiteKey();
  const logoUrl = identity.logo?.url ? absoluteUrl(identity.logo.url, siteUrl) : undefined;

  return (
    <>
      <PageHero
        size="short"
        overlap={hasCards}
        title={hero.title}
        {...(hero.titleAccent ? { titleAccent: hero.titleAccent } : {})}
        {...(hero.eyebrow ? { eyebrow: hero.eyebrow } : {})}
        {...(hero.description ? { description: hero.description } : {})}
        {...(hero.image ? { image: hero.image } : {})}
        breadcrumb={<Breadcrumb variant="overlay" items={[{ label: tNav("contact"), href: publicPath("/lien-he", locale) }]} />}
      />
      {hasCards && (
        <div className="relative z-10 mx-auto -mt-16 w-full max-w-container px-gutter md:-mt-[88px]">
          <ContactCards cards={cards} />
        </div>
      )}
      {/* Thứ tự DOM = thứ tự đọc/Tab: form → văn phòng; < lg văn phòng xuống sau form. */}
      <div className={cn("mx-auto grid w-full max-w-container items-start gap-6 px-gutter pb-section-tight lg:gap-8", hasCards ? "pt-8 md:pt-10" : "pt-section-tight", offices.length > 0 && "lg:grid-cols-2")}>
        <LeadFormSlot eyebrow={t("formEyebrow")} title={t("formTitle")} className="rounded-xl bg-surface p-5 shadow-md md:p-8 lg:p-8">
          <LeadForm source="contact" layout="contact" submitLabel={t("formSubmit")} {...(turnstileSiteKey ? { turnstileSiteKey } : {})} />
        </LeadFormSlot>
        {offices.length > 0 && <OfficeSystem offices={offices} />}
      </div>
      <div className="pb-section-tight">
        <JoinTeamBanner href={publicPath("/tuyen-dung", locale)} {...(careersImage ? { image: careersImage } : {})} />
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
