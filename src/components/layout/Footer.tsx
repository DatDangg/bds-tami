import { useTranslations } from "next-intl";
import type { ComponentType, CSSProperties } from "react";
import {
  ChatCircleDots,
  FacebookLogo,
  Globe,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from "@/components/icons";
import { BrandLogo } from "./BrandLogo";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { FooterLinkColumn } from "./FooterLinkColumn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { FooterColumnView, LogoView, SocialLinkView } from "./shell-data";

interface FooterProps {
  logo: LogoView;
  columns: FooterColumnView[];
  tagline: string;
  copyright: string;
  socials: SocialLinkView[];
  /** Có cookie tuỳ chọn (GA4) để quản lý; không có thì ẩn nút, tránh control không làm gì. */
  showCookieSettings: boolean;
}

/** Tên thương hiệu không dịch. `other` dùng nhãn i18n chung. */
const SOCIAL_PLATFORMS: Record<string, { name: string; Icon: ComponentType<{ size?: number; "aria-hidden"?: "true" }> }> = {
  facebook: { name: "Facebook", Icon: FacebookLogo },
  zalo: { name: "Zalo", Icon: ChatCircleDots },
  youtube: { name: "YouTube", Icon: YoutubeLogo },
  tiktok: { name: "TikTok", Icon: TiktokLogo },
  instagram: { name: "Instagram", Icon: InstagramLogo },
  linkedin: { name: "LinkedIn", Icon: LinkedinLogo },
  x: { name: "X", Icon: XLogo },
};

/**
 * Chân trang tối dùng chung mọi trang công khai (design-spec §2.4, mockup BL-044): cột trái logo + giới thiệu + mạng xã hội (ô tròn),
 * các cột liên kết (accordion < md), dòng cuối bản quyền trái, ngôn ngữ + cookie phải. Không có cột Liên hệ (Q2): hotline/email/địa chỉ
 * nằm ở nút nổi, menu di động và trang Liên hệ. Nút "lên đầu trang" là `BackToTop` nổi của khung trang, không dựng lại ở đây.
 */
export function Footer({ logo, columns, tagline, copyright, socials, showCookieSettings }: FooterProps) {
  return (
    <footer className="theme-dark-block py-section-tight print:hidden">
      <div className="mx-auto flex w-full max-w-container flex-col gap-10 px-gutter">
        {/* auto-fit không đi chung với track fr (CSS không hợp lệ) nên số cột link truyền qua biến CSS. */}
        <div
          style={{ "--footer-cols": Math.max(columns.length, 1) } as CSSProperties}
          className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.4fr)_repeat(var(--footer-cols),minmax(0,1fr))] md:gap-10"
        >
          <div className="flex flex-col gap-4">
            <BrandLogo tone="on-dark" image={logo.onDark} className="self-start" />
            <p className="max-w-text text-small whitespace-pre-line text-text-secondary">{tagline}</p>
            <SocialLinks socials={socials} variant="circle" />
          </div>
          {/* < md: cột link là accordion (FooterLinkColumn); ≥ md lưới như spec §2.4. */}
          {columns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}
        </div>
        <div className="flex flex-col gap-4 border-t border-dark-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xsmall text-text-muted">{copyright}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <LanguageSwitcher tone="on-dark" />
            {showCookieSettings && (
              <CookieSettingsButton className="inline-flex min-h-11 cursor-pointer items-center text-small text-text-secondary transition-colors duration-(--duration-fast) hover:text-text" />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

/** `circle`: ô tròn 40px viền khối tối (footer, mockup BL-044) trong vùng chạm 44px; `plain`: biểu tượng trần (trang Liên hệ). */
export function SocialLinks({ socials, variant = "plain" }: { socials: SocialLinkView[]; variant?: "plain" | "circle" }) {
  const t = useTranslations("layout.footer");
  if (socials.length === 0) return null;
  const isCircle = variant === "circle";
  return (
    <ul aria-label={t("social")} className={isCircle ? "flex items-center gap-1" : "flex items-center gap-2"}>
      {socials.map((social) => {
        const known = SOCIAL_PLATFORMS[social.platform];
        const Icon = known?.Icon ?? Globe;
        const iconSize = isCircle ? 20 : 24;
        return (
          <li key={social.platform + social.url}>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={known?.name ?? t("socialOther")}
              className="group inline-flex size-11 items-center justify-center text-text-secondary hover:text-text"
            >
              {isCircle ? (
                <span className="inline-flex size-10 items-center justify-center rounded-full border border-dark-border group-hover:border-text-secondary">
                  <Icon size={iconSize} aria-hidden="true" />
                </span>
              ) : (
                <Icon size={iconSize} aria-hidden="true" />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
