import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home/HomePage";
import { publicPath } from "@/lib/content/content-paths";
import { loadSiteIdentity } from "@/lib/content/site-identity";
import { loadHomepageSeo } from "@/lib/home/load-home";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [t, identity, seo] = await Promise.all([getTranslations({ locale, namespace: "page.home" }), loadSiteIdentity(locale), loadHomepageSeo(locale)]);
  return buildPageMetadata({
    locale,
    seo,
    title: t("title"),
    description: t("description"),
    siteName: identity.siteName,
    defaultImage: identity.logo,
    paths: { vi: publicPath("/", "vi"), en: publicPath("/", "en") },
    hasEnglish: true,
  });
}

/** S01 Trang chủ. Không đọc `searchParams` nên giữ ISR (`revalidate` ở layout); lưu `homepage`/dịch vụ làm mới theo tag (ERD §4.15). */
export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <HomePage locale={locale} />;
}
