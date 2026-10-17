import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { PageBanner } from "@/components/layout/PageBanner";
import { Button } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { Locale } from "@/i18n/routing";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const QUICK_LINKS = ["projects", "news", "contact"] as const;

/**
 * 404 theo ngôn ngữ đang xem (design-spec S17): nằm trong nhánh `[locale]` nên giữ header/footer và đúng `/` hay `/en`.
 * Next tự trả status 404. Dòng "có bản tiếng Việt" ở EN chưa làm: chưa có cách xác định bản VI tương ứng từ đây.
 */
export default function NotFoundPage() {
  const t = useTranslations("page.notFound");
  const tNav = useTranslations("layout.nav.items");
  const locale = useLocale() as Locale;
  const href = (key: Parameters<typeof resolveNavLink>[0]) => resolveNavLink(key, locale)?.href ?? "/";
  return (
    <>
      <PageBanner title={t("title")} description={t("description")} watermark="404">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="dark">
            <Link href={href("home")}>{t("backHome")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={href("rentals")}>{t("browseRentals")}</Link>
          </Button>
        </div>
      </PageBanner>
      <nav aria-label={t("quickLinks")} className="mx-auto w-full max-w-container px-gutter py-6">
        <ul className="flex flex-wrap gap-x-6">
          {QUICK_LINKS.map((key) => (
            <li key={key}>
              <Link href={href(key)} className="inline-flex min-h-11 min-w-11 items-center justify-center text-small text-text-secondary hover:text-text hover:underline">
                {tNav(key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
