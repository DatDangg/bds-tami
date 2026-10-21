import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PostListPage, buildPostListMetadata, type RawPostListParams } from "@/components/posts/PostListPage";
import { routing } from "@/i18n/routing";

// Lọc / sắp / phân trang trên `searchParams` (SEO crawl được) nên trang phải đọc `searchParams` lúc chạy: không ISR (layout đặt `revalidate = 60` + `generateStaticParams`
// khiến đọc `searchParams` ném DYNAMIC_SERVER_USAGE). CDN vẫn giữ HTML theo `Cache-Control` của next.config.ts; trang chi tiết mới là ISR.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<RawPostListParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildPostListMetadata({ locale, searchParams: await searchParams, categorySlug: category });
}

/** S05 Trang danh mục Đăng tin BĐS. */
export default async function PostCategoryPage({ params, searchParams }: PageProps) {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <PostListPage locale={locale} searchParams={await searchParams} categorySlug={category} />;
}
