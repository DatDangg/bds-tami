import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { loadShell } from "@/components/layout/load-shell";
import { PublicShell } from "@/components/layout/PublicShell";
import { ebGaramond, montserrat } from "@/lib/fonts";
import type { Locale } from "@/i18n/routing";

/**
 * Tài liệu HTML của website công khai (`<html>` + font + khung header/footer) cho một ngôn ngữ. Dùng chung cho
 * `[locale]/layout.tsx` và `app/not-found.tsx` (locale sai ở layout, URL ngoài nhánh ngôn ngữ) để 404 luôn có nội dung trong HTML server.
 */
export async function PublicDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
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
