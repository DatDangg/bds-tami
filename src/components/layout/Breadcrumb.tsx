import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@/components/icons";
import { resolveNavLink } from "@/lib/content/nav-link";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getSiteUrl } from "@/lib/seo/site-url";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  /** Đường dẫn đã có tiền tố ngôn ngữ. Mục cuối là trang hiện tại nên không render thành link (nhưng vẫn vào JSON-LD). */
  href: string;
}

/**
 * `default`: kiểu cũ (trang chưa chuyển sang hero mới). `overlay`: nằm trên ảnh hero, khung viên thuốc chỉ bao chữ (`.crumb-glass`, BL-045 #1);
 * vùng chứa (container + vị trí) do `PageHero` lo. `plain`: trang không có ảnh hero, chữ muted trong container, ngăn bằng `›`.
 */
export type BreadcrumbVariant = "default" | "overlay" | "plain";

const LINK_CLASS = "inline-flex min-h-11 items-center transition-colors hover:text-accent-text";
const OVERLAY_LINK_CLASS = "inline-flex min-h-11 items-center transition-colors hover:text-primary focus-visible:outline-on-dark";
/** Khung kính chỉ bao chữ; 12px < md như mockup. Chiều cao do `min-h-11` của link (chạm ≥ 44px). */
const PILL_CLASS = "crumb-glass inline-flex max-w-full rounded-full px-3 text-on-dark md:px-[18px]";

function Separator({ variant }: { variant: BreadcrumbVariant }) {
  if (variant === "default") return <CaretRight size={12} aria-hidden="true" className="mx-2 shrink-0" />;
  return (
    <span aria-hidden="true" className="mx-2 shrink-0">
      ›
    </span>
  );
}

/**
 * Breadcrumb mọi trang trừ trang chủ (design-spec §2.6). `items` là các mục SAU "Trang chủ" (component tự thêm mục đầu
 * theo ngôn ngữ), mục cuối = trang hiện tại. Quá 3 mục thì < md chỉ hiện "← mục cha". Kèm JSON-LD `BreadcrumbList` (`jsonLd={false}` cho trang không được có dữ liệu có cấu trúc, vd tin tuyển dụng hết hạn).
 */
export function Breadcrumb({ items, className, jsonLd = true, variant = "default" }: { items: BreadcrumbItem[]; className?: string; jsonLd?: boolean; variant?: BreadcrumbVariant }) {
  const t = useTranslations("page.breadcrumb");
  const tNav = useTranslations("layout.nav.items");
  const locale = useLocale() as Locale;
  const home: BreadcrumbItem = { label: tNav("home"), href: resolveNavLink("home", locale)?.href ?? "/" };
  const trail = [home, ...items];
  const parent = trail.length > 3 ? trail.at(-2) : undefined;
  // Không có URL gốc (lúc build, hoặc chưa cấu hình) thì bỏ JSON-LD thay vì sinh URL sai. Đọc lúc chạy, không nhúng lúc build.
  const siteUrl = getSiteUrl();
  const overlay = variant === "overlay";
  const linkClass = overlay ? OVERLAY_LINK_CLASS : LINK_CLASS;

  return (
    <nav
      aria-label={t("nav")}
      className={cn(overlay ? "w-fit max-w-full text-small" : "mx-auto w-full max-w-container px-gutter text-small text-text-muted", className)}
    >
      {parent && (
        <Link href={parent.href} className={cn(linkClass, "gap-1 md:hidden", overlay && PILL_CLASS)}>
          <CaretLeft size={12} aria-hidden="true" />
          <span>{t("backTo", { label: parent.label })}</span>
        </Link>
      )}
      <ol className={cn("flex-wrap items-center", parent ? "hidden md:flex" : "flex", overlay && cn(PILL_CLASS, "w-fit"))}>
        {trail.map((entry, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${index}-${entry.href}`} className="flex items-center">
              {isLast ? (
                <span aria-current="page" className={cn("inline-flex min-h-11 items-center", overlay ? "font-semibold text-on-dark" : "text-text")}>
                  {entry.label}
                </span>
              ) : (
                <>
                  <Link href={entry.href} className={linkClass}>
                    {entry.label}
                  </Link>
                  <Separator variant={variant} />
                </>
              )}
            </li>
          );
        })}
      </ol>
      {jsonLd && siteUrl && <JsonLd data={buildBreadcrumbJsonLd(trail, siteUrl)} />}
    </nav>
  );
}
