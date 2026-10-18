import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
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
import type { FooterColumnView, FooterContactView, LogoView, SocialLinkView } from "./shell-data";

interface FooterProps {
  logo: LogoView;
  columns: FooterColumnView[];
  tagline: string;
  copyright: string;
  contact: FooterContactView;
  socials: SocialLinkView[];
  /** Có cookie tuỳ chọn (GA4) để quản lý; không có thì ẩn nút, tránh control không làm gì. */
  showCookieSettings: boolean;
}

/** Tên thương hiệu không dịch. `other` dùng nhãn i18n chung. */
const SOCIAL_PLATFORMS: Record<string, { name: string; icon: ReactElement }> = {
  facebook: { name: "Facebook", icon: <FacebookLogo size={24} aria-hidden="true" /> },
  zalo: { name: "Zalo", icon: <ChatCircleDots size={24} aria-hidden="true" /> },
  youtube: { name: "YouTube", icon: <YoutubeLogo size={24} aria-hidden="true" /> },
  tiktok: { name: "TikTok", icon: <TiktokLogo size={24} aria-hidden="true" /> },
  instagram: { name: "Instagram", icon: <InstagramLogo size={24} aria-hidden="true" /> },
  linkedin: { name: "LinkedIn", icon: <LinkedinLogo size={24} aria-hidden="true" /> },
  x: { name: "X", icon: <XLogo size={24} aria-hidden="true" /> },
};

/** Chân trang tối (design-spec §2.4): logo + giới thiệu, các cột liên kết + liên hệ, dòng cuối (bản quyền, mạng xã hội, ngôn ngữ, cookie). */
export function Footer({ logo, columns, tagline, copyright, contact, socials, showCookieSettings }: FooterProps) {
  const hasContact = Boolean(contact.hotline ?? contact.email ?? contact.address);
  return (
    <footer className="theme-dark-block py-section-tight print:hidden">
      <div className="mx-auto flex w-full max-w-container flex-col gap-10 px-gutter">
        <div className="flex flex-col gap-4">
          <BrandLogo tone="on-dark" image={logo.onDark} className="self-start" />
          <p className="max-w-text text-small whitespace-pre-line text-text-secondary">{tagline}</p>
        </div>
        {/* < md: cột link là accordion (FooterLinkColumn), cột Liên hệ luôn mở; ≥ md lưới auto-fit như spec §2.4. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] md:gap-8">
          {columns.map((column) => (
            <FooterLinkColumn key={column.title} column={column} />
          ))}
          {hasContact && <FooterContact contact={contact} />}
        </div>
        <div className="flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-xsmall text-text-muted">{copyright}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <SocialLinks socials={socials} />
            <LanguageSwitcher />
            {showCookieSettings && (
              <CookieSettingsButton className="inline-flex min-h-11 cursor-pointer items-center text-small text-text-secondary underline-offset-4 hover:text-text hover:underline" />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterContact({ contact }: { contact: FooterContactView }) {
  const t = useTranslations("layout.footer");
  return (
    <div className="flex flex-col gap-3">
      {/* Cột Liên hệ luôn mở ở mọi breakpoint (spec §2.4); < md canh hàng với nút tiêu đề 44px của các cột accordion. */}
      <h2 className="flex min-h-11 items-center text-eyebrow font-semibold tracking-[0.12em] text-accent-text uppercase md:min-h-0">{t("contact")}</h2>
      <ul className="flex flex-col gap-1 text-small text-text-secondary">
        {contact.hotline && (
          <li>
            <a href={contact.hotline.telHref} className="inline-flex min-h-11 items-center hover:text-text hover:underline">
              {t("hotline")}: {contact.hotline.label}
            </a>
          </li>
        )}
        {contact.email && (
          <li>
            <a href={`mailto:${contact.email}`} className="inline-flex min-h-11 items-center break-all hover:text-text hover:underline">
              {contact.email}
            </a>
          </li>
        )}
        {contact.address && <li className="py-2">{contact.address}</li>}
      </ul>
    </div>
  );
}

export function SocialLinks({ socials }: { socials: SocialLinkView[] }) {
  const t = useTranslations("layout.footer");
  if (socials.length === 0) return null;
  return (
    <ul aria-label={t("social")} className="flex items-center gap-2">
      {socials.map((social) => {
        const known = SOCIAL_PLATFORMS[social.platform];
        return (
          <li key={social.platform + social.url}>
            <a
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={known?.name ?? t("socialOther")}
              className="inline-flex size-11 items-center justify-center text-text-secondary hover:text-text"
            >
              {known?.icon ?? <Globe size={24} aria-hidden="true" />}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
