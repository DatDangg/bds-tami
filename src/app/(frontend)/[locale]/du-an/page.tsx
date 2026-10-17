import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProjectListPage, buildProjectListMetadata } from "@/components/projects/ProjectListPage";
import { routing } from "@/i18n/routing";
import type { RawProjectParams } from "@/lib/projects/project-filters";

// Lọc + phân trang bằng `searchParams` (`?category=&province=&status=&page=`) nên trang đọc tham số lúc chạy: không ISR (layout đặt
// `revalidate = 60` + `generateStaticParams` khiến đọc `searchParams` ném DYNAMIC_SERVER_USAGE). CDN vẫn giữ HTML theo `Cache-Control` của next.config.ts.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<RawProjectParams>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return buildProjectListMetadata({ locale, searchParams: await searchParams });
}

/** S02 Danh sách dự án. */
export default async function ProjectsIndexPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <ProjectListPage locale={locale} searchParams={await searchParams} />;
}
