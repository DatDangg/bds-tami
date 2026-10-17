import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicDocument } from "@/components/layout/PublicDocument";
import { routing } from "@/i18n/routing";
import { getSiteUrl, isIndexingAllowed } from "@/lib/seo/site-url";
import "../globals.css";

// Không prerender lúc `next build`: metadata đọc APP_ENV/NEXT_PUBLIC_SITE_URL lúc chạy (image build 1 lần rồi promote staging -> prod),
// nên HTML dựng sẵn sẽ mang robots/canonical sai môi trường. `[]` + `dynamicParams` mặc định = render ở request đầu rồi ISR cache như cũ.
export function generateStaticParams() {
  return [];
}

// Trang công khai là ISR: header/footer đọc từ global (cache theo tag, hook `revalidate-global` làm mới khi lưu).
// `revalidate` là lưới an toàn: nếu lúc build không có DB (CI/Docker) thì trang dựng với menu cố định, tối đa 60s sau
// được dựng lại với dữ liệu thật (ARCHITECTURE §5.1: nội dung mới lên web ≤ 1 phút).
export const revalidate = 60;

/**
 * Mặc định cho mọi trang: ngoài production thì noindex (staging không lên Google, kể cả trang chưa tự gọi `buildPageMetadata`).
 * Không đặt canonical/hreflang ở đây vì trang con sẽ kế thừa sai; từng trang tự khai bằng `buildPageMetadata`.
 */
export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    ...(isIndexingAllowed() ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <PublicDocument locale={locale}>{children}</PublicDocument>;
}
