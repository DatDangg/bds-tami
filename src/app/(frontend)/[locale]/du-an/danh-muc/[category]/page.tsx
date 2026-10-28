import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProjectListPage, buildProjectListMetadata } from "@/components/projects/ProjectListPage";
import { routing } from "@/i18n/routing";
import type { RawProjectParams } from "@/lib/projects/project-filters";

// Như `/du-an`: bộ lọc + phân trang bằng `searchParams` nên đọc tham số lúc chạy, không ISR (xem ghi chú ở `du-an/page.tsx`).
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; category: string }>;
  searchParams: Promise<RawProjectParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildProjectListMetadata({ locale, searchParams: await searchParams, categorySlug: category });
}

/** S05 Trang danh mục Dự án: dùng lại danh sách S02 với danh mục khoá theo slug (gồm danh mục con). */
export default async function ProjectCategoryPage({ params, searchParams }: PageProps) {
  const { locale, category } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <ProjectListPage locale={locale} searchParams={await searchParams} categorySlug={category} />;
}
