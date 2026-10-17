import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { buildLegalMetadata, LegalPage } from "@/components/legal/LegalPage";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return hasLocale(routing.locales, locale) ? buildLegalMetadata(locale, "privacy") : {};
}

/** S16 Chính sách bảo mật (`pages.kind = privacy`). ISR: hook lưu trang gọi `revalidatePath`. */
export default async function PrivacyPolicyPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <LegalPage locale={locale} kind="privacy" />;
}
