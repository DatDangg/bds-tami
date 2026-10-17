import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@/components/icons";
import { resolveNavLink } from "@/lib/content/nav-link";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  /** Đường dẫn đã có tiền tố ngôn ngữ. Mục cuối là trang hiện tại nên không render thành link (nhưng vẫn vào JSON-LD). */
  href: string;
}

const LINK_CLASS = "inline-flex min-h-11 items-center hover:text-text hover:underline";

/**
 * Breadcrumb mọi trang trừ trang chủ (design-spec §2.6). `items` là các mục SAU "Trang chủ" (component tự thêm mục đầu
 * theo ngôn ngữ), mục cuối = trang hiện tại. Quá 3 mục thì < md chỉ hiện "← mục cha". Kèm JSON-LD `BreadcrumbList`.
 */
export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  const t = useTranslations("page.breadcrumb");
  const tNav = useTranslations("layout.nav.items");
  const locale = useLocale() as Locale;
  const home: BreadcrumbItem = { label: tNav("home"), href: resolveNavLink("home", locale)?.href ?? "/" };
  const trail = [home, ...items];
  const parent = trail.length > 3 ? trail.at(-2) : undefined;
  // Không có URL gốc thì bỏ JSON-LD thay vì sinh URL tương đối sai.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return (
    <nav aria-label={t("nav")} className={cn("mx-auto w-full max-w-container px-gutter text-small text-text-muted", className)}>
      {parent && (
        <Link href={parent.href} className={cn(LINK_CLASS, "gap-1 md:hidden")}>
          <CaretLeft size={12} aria-hidden="true" />
          <span>{t("backTo", { label: parent.label })}</span>
        </Link>
      )}
      <ol className={cn("flex-wrap items-center", parent ? "hidden md:flex" : "flex")}>
        {trail.map((entry, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${index}-${entry.href}`} className="flex items-center">
              {isLast ? (
                <span aria-current="page" className="inline-flex min-h-11 items-center text-text">
                  {entry.label}
                </span>
              ) : (
                <>
                  <Link href={entry.href} className={LINK_CLASS}>
                    {entry.label}
                  </Link>
                  <CaretRight size={12} aria-hidden="true" className="mx-2 shrink-0" />
                </>
              )}
            </li>
          );
        })}
      </ol>
      {siteUrl && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbJsonLd(trail, siteUrl)) }}
        />
      )}
    </nav>
  );
}
