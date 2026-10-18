import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RentalListPage, buildRentalListMetadata } from "@/components/rentals/RentalListPage";
import { routing } from "@/i18n/routing";
import type { RawRentalParams } from "@/lib/search/url-params";

// Lọc + phân trang bằng `searchParams` (design-spec §3.5) nên trang đọc tham số lúc chạy: không ISR (layout đặt `revalidate = 60` +
// `generateStaticParams` khiến đọc `searchParams` ném DYNAMIC_SERVER_USAGE). CDN vẫn giữ HTML theo `Cache-Control` của next.config.ts.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawRentalParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildRentalListMetadata({ locale, searchParams: await searchParams });
}

/** S04 Danh sách Cho thuê. */
export default async function RentalsIndexPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <RentalListPage locale={locale} searchParams={await searchParams} />;
}
