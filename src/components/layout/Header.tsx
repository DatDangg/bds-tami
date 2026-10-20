import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { MagnifyingGlass } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { resolveNavLink } from "@/lib/content/nav-link";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import { BrandLogo } from "./BrandLogo";
import { DesktopNav } from "./DesktopNav";
import { HeaderFrame } from "./HeaderFrame";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";
import { NavAnchor } from "./NavAnchor";
import type { FooterContactView, LinkView, LogoView, NavItemView } from "./shell-data";

/**
 * Đích nút tìm kiếm: danh sách Cho thuê kèm `?q=` (design-spec §2.1, D7). Đường dẫn theo ngôn ngữ lấy từ `pathnames`
 * (vi `/cho-thue?q=`, en `/en/for-rent?q=`). Trang đích tự đọc `q`; ở đây không có ô nhập.
 */
export function searchHrefFor(locale: Locale): string {
  return `${resolveNavLink("rentals", locale)?.href ?? "/"}?q=`;
}

interface HeaderProps {
  items: NavItemView[];
  contact: FooterContactView;
  logo: LogoView;
  /** Nút CTA từ `header.ctaButton`; không truyền = ẩn (xem `buildCta`). */
  cta?: LinkView;
}

/**
 * Header dính đầu trang: kính mờ sáng, đầu trang là thanh phẳng full-width, đã cuộn mới thành thanh nổi bo tròn (BL-025, `HeaderFrame`, design-spec §2.1). Thuần hiển thị:
 * nhận view model đã lọc từ layout. Chỉ DesktopNav, MobileMenu, LanguageSwitcher là client. Thứ tự DOM = thứ tự Tab (logo, menu ngang,
 * tìm, ngôn ngữ, CTA, nút Menu). `order-*` chỉ đổi vị trí hiển thị ở < xl (tìm bên trái, logo giữa); từ xl là MỘT hàng: logo trái ·
 * menu ngang giữa · tìm + VI|EN + CTA phải, KHÔNG có nút Menu (BL-019; thứ tự Tab ≥ xl: logo, menu ngang, tìm, ngôn ngữ, CTA).
 * Nút Menu chỉ ở < xl và mở menu toàn màn hình.
 * Chỉ dùng logo bản nền sáng (vàng, BL-018): kính luôn sáng nên không còn bản logo trắng ở header. Trên kính chỉ dùng `text-text` (accent-text chỉ ~3:1 khi nền sau kính là đen); hover/focus không đổi màu chữ.
 */
export function Header({ items, contact, logo, cta }: HeaderProps) {
  const t = useTranslations("layout.header");
  const locale = useLocale() as Locale;
  const homeHref = resolveNavLink("home", locale)?.href ?? "/";
  return (
    <HeaderFrame>
      <div className="flex h-16 w-full items-center gap-4 px-3 md:px-5 lg:h-18 lg:px-6 xl:gap-3 xl:px-5 2xl:gap-6">
        <Link href={homeHref} aria-label={t("home")} className="order-2 inline-flex min-h-11 min-w-11 shrink-0 items-center xl:order-1">
          {/* xl: logo ≤ 6rem — đo ở 1265px, logo CMS 120px + CTA 160px + 7 mục EN đã đè menu lên logo/tìm 3px. */}
          <BrandLogo image={logo.onLight} className="xl:max-w-[6rem]" />
        </Link>
        <div className="order-2 hidden min-w-0 xl:flex xl:flex-1 xl:justify-center">
          <DesktopNav items={items} />
        </div>
        <div className="order-1 flex flex-1 items-center xl:order-3 xl:flex-none">
          <Link
            href={searchHrefFor(locale)}
            aria-label={t("search")}
            className="inline-flex size-11 items-center justify-center rounded-full text-text hover:bg-text/10"
          >
            <MagnifyingGlass size={24} aria-hidden="true" />
          </Link>
        </div>
        <div className="order-3 flex flex-1 items-center justify-end gap-2 xl:order-4 xl:flex-none">
          <LanguageSwitcher className="hidden sm:flex" />
          {/* md–lg đệm hẹp hơn để cụm phải (VI|EN + CTA + Menu) ≤ nửa hàng, logo vẫn ở giữa; xl đệm 16px cho hàng 1280px.
              Nhãn CMS dài bị cắt (`truncate`) thay vì đẩy menu đè logo ở 1280; `title` giữ nhãn đầy đủ (< xl menu toàn màn hình
              còn hiện trọn nhãn). */}
          {cta && (
            <NavAnchor link={cta} title={cta.label} className={cn(buttonVariants({ size: "sm" }), "hidden max-w-[10rem] min-h-11 md:inline-flex md:px-3 lg:px-5 xl:px-4")}>
              {/* `truncate` đặt trên span con: text-overflow không áp dụng cho chính flex container. */}
              <span className="truncate">{cta.label}</span>
            </NavAnchor>
          )}
          <MobileMenu items={items} contact={contact} logo={logo} cta={cta} />
        </div>
      </div>
    </HeaderFrame>
  );
}
