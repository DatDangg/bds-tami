import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const supportedLocales = ["vi", "en"];

// Placeholder: định tuyến i18n (next-intl) và UI làm ở task layer-1 riêng.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!supportedLocales.includes(locale)) notFound();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
