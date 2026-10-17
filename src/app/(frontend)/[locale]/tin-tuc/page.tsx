import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { NewsListPage, buildNewsListMetadata } from "@/components/news/NewsListPage";
import { routing } from "@/i18n/routing";

// Phân trang bằng `?page=n` (SEO crawl được) nên trang phải đọc `searchParams` lúc chạy: không ISR (layout đặt `revalidate = 60` + `generateStaticParams`
// khiến đọc `searchParams` ném DYNAMIC_SERVER_USAGE). CDN vẫn giữ HTML theo `Cache-Control` của next.config.ts; trang chi tiết mới là ISR.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildNewsListMetadata({ locale, rawPage: (await searchParams).page });
}

/** S10 Tin tức. */
export default async function NewsIndexPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <NewsListPage locale={locale} rawPage={(await searchParams).page} />;
}
