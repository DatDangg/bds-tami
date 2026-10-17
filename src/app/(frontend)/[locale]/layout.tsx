import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { loadShell } from "@/components/layout/load-shell";
import { PublicShell } from "@/components/layout/PublicShell";
import { ebGaramond, montserrat } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Trang công khai là ISR: header/footer đọc từ global (cache theo tag, hook `revalidate-global` làm mới khi lưu).
// `revalidate` là lưới an toàn: nếu lúc build không có DB (CI/Docker) thì trang dựng với menu cố định, tối đa 60s sau
// được dựng lại với dữ liệu thật (ARCHITECTURE §5.1: nội dung mới lên web ≤ 1 phút).
export const revalidate = 60;

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
  const shell = await loadShell(locale);
  return (
    <html lang={locale} className={`${ebGaramond.variable} ${montserrat.variable}`}>
      <body>
        <NextIntlClientProvider>
          <PublicShell shell={shell}>{children}</PublicShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
