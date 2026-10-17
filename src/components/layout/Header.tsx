import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { MagnifyingGlass } from "@/components/icons";
import { resolveNavLink } from "@/lib/content/nav-link";
import type { Locale } from "@/i18n/routing";
import { BrandLogo } from "./BrandLogo";
import { DesktopNav } from "./DesktopNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import type { FooterContactView, NavItemView } from "./shell-data";

/**
 * Đích nút tìm kiếm: danh sách Cho thuê kèm `?q=` (design-spec §2.1, D7). Đường dẫn theo ngôn ngữ lấy từ `pathnames`
 * (vi `/cho-thue?q=`, en `/en/for-rent?q=`). Trang đích tự đọc `q`; ở đây không có ô nhập.
 */
export function searchHrefFor(locale: Locale): string {
  return `${resolveNavLink("rentals", locale)?.href ?? "/"}?q=`;
}

/**
 * Header đặc, dính đầu trang (design-spec §2.1). Thuần hiển thị: nhận view model đã lọc từ layout. Chỉ DesktopNav,
 * MobileMenu, LanguageSwitcher là client. Thứ tự DOM = thứ tự Tab (logo, menu, tìm, ngôn ngữ, nút Menu); `order-*` chỉ đổi
 * vị trí hiển thị ở < xl (tìm bên trái, logo giữa). Biến thể trong suốt trên hero làm ở task trang có hero.
 */
export function Header({ items, contact }: { items: NavItemView[]; contact: FooterContactView }) {
  const t = useTranslations("layout.header");
  const locale = useLocale() as Locale;
  const homeHref = resolveNavLink("home", locale)?.href ?? "/";
  return (
    <header className="sticky top-0 z-(--z-header) bg-surface shadow-sm print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-container items-center gap-4 px-gutter lg:h-18">
        <Link href={homeHref} aria-label={t("home")} className="order-2 inline-flex min-h-11 min-w-11 shrink-0 items-center xl:order-1">
          <BrandLogo />
        </Link>
        <div className="order-2 hidden min-w-0 xl:flex xl:flex-1 xl:justify-center">
          <DesktopNav items={items} />
        </div>
        <div className="order-1 flex flex-1 items-center xl:order-3 xl:flex-none">
          <Link
            href={searchHrefFor(locale)}
            aria-label={t("search")}
            className="inline-flex size-11 items-center justify-center rounded-sm text-text hover:text-accent-text"
          >
            <MagnifyingGlass size={24} aria-hidden="true" />
          </Link>
        </div>
        <div className="order-3 flex flex-1 items-center justify-end gap-2 xl:order-4 xl:flex-none">
          <LanguageSwitcher className="hidden sm:flex" />
          <MobileMenu items={items} contact={contact} />
        </div>
      </div>
    </header>
  );
}
