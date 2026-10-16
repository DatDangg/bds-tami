import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ebGaramond, montserrat } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Khung layout: UI thật (header/footer) làm ở các task giao diện sau.
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
  return (
    <html lang={locale} className={`${ebGaramond.variable} ${montserrat.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
