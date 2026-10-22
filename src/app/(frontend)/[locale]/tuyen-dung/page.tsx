import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { JobListPage, buildJobListMetadata } from "@/components/careers/JobListPage";
import { routing } from "@/i18n/routing";
import type { RawJobParams } from "@/lib/careers/job-filters";

// Lọc + phân trang bằng `searchParams` (`?category=&province=&q=&page=`) nên trang đọc tham số lúc chạy: không ISR (layout đặt `revalidate = 60` +
// `generateStaticParams` khiến đọc `searchParams` ném DYNAMIC_SERVER_USAGE). Nhờ vậy bộ lọc `deadline >= hôm nay` được tính lại mỗi lần CDN
// hết `s-maxage=60` (next.config.ts), không dính HTML cũ qua nửa đêm.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawJobParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildJobListMetadata({ locale, searchParams: await searchParams });
}

/** S12 Tuyển dụng. */
export default async function CareersIndexPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <JobListPage locale={locale} searchParams={await searchParams} />;
}
