import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RentalListPage, buildRentalListMetadata } from "@/components/rentals/RentalListPage";
import { routing } from "@/i18n/routing";
import type { RawRentalParams } from "@/lib/search/url-params";

// Như `/cho-thue`: bộ lọc + phân trang bằng `searchParams` nên đọc tham số lúc chạy, không ISR (xem ghi chú ở `cho-thue/page.tsx`).
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<RawRentalParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildRentalListMetadata({ locale, searchParams: await searchParams, categorySlug: category });
}

/** S05 Trang danh mục Cho thuê: dùng lại danh sách S04 với danh mục khoá theo slug (gồm danh mục con). */
export default async function RentalCategoryPage({ params, searchParams }: PageProps) {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <RentalListPage locale={locale} searchParams={await searchParams} categorySlug={category} />;
}
