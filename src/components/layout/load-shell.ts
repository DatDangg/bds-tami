import "server-only";

import { getTranslations } from "next-intl/server";
import { getFooter, getHeader, getSiteSettings } from "@/lib/content/get-globals";
import { type PageLinkKey, resolveNavLink } from "@/lib/content/nav-link";
import { logger } from "@/lib/logger";
import type { Locale } from "@/i18n/routing";
import {
  buildConsent,
  buildContact,
  buildCta,
  buildFloatingContact,
  buildFooterColumns,
  buildLogo,
  buildNavItems,
  buildSocialLinks,
  type FooterColumnView,
  fixedMenuItems,
  type LinkView,
  MAIN_MENU_KEYS,
  type MainMenuKey,
  type ShellView,
} from "./shell-data";

/** Một global lỗi (DB tắt, lúc `next build` không có DB) không được làm hỏng cả trang: dùng nội dung cố định và ghi log. */
async function readOrNull<T>(name: string, read: () => Promise<T>): Promise<T | null> {
  try {
    return await read();
  } catch (error) {
    logger.warn({ err: error, global: name }, "Không đọc được global cho khung trang, dùng nội dung cố định");
    return null;
  }
}

/**
 * Dữ liệu khung trang (header/footer) cho một ngôn ngữ. Đọc qua `get-globals` (server-only, `unstable_cache` gắn tag
 * `global:<slug>`, đọc như khách nên không có trường nội bộ) rồi lọc còn view model hiển thị. KHÔNG đọc cookies()/headers():
 * HTML trang công khai phải giống nhau cho mọi khách để CDN cache được.
 */
export async function loadShell(locale: Locale): Promise<ShellView> {
  const [header, footer, settings, t] = await Promise.all([
    readOrNull("header", () => getHeader(locale)),
    readOrNull("footer", () => getFooter(locale)),
    readOrNull("site-settings", () => getSiteSettings(locale)),
    getTranslations({ locale, namespace: "layout" }),
  ]);

  const menuLabels = Object.fromEntries(MAIN_MENU_KEYS.map((key) => [key, t(`nav.items.${key}`)])) as Record<MainMenuKey, string>;
  const fixedColumns: FooterColumnView[] = [
    { title: t("footer.columns.explore"), links: fixedLinks(locale, ["projects", "rentals", "news"], (key) => t(`nav.items.${key}`)) },
    {
      title: t("footer.columns.about"),
      links: [
        ...fixedLinks(locale, ["careers", "contact"], (key) => t(`nav.items.${key}`)),
        ...fixedLinks(locale, ["privacy-policy", "terms-of-use"], (key) => t(`footer.links.${key}`)),
      ],
    },
  ];

  return {
    navItems: header ? buildNavItems(header.navItems, locale, menuLabels) : fixedMenuItems(locale, menuLabels),
    cta: buildCta(header?.ctaButton, locale),
    // `readPublicGlobal` đọc depth 1 nên `logo`/`logoDark` đã là doc media (url + kích thước); chưa populate thì logo tĩnh.
    logo: buildLogo(settings),
    contact: buildContact(settings),
    floatingContact: buildFloatingContact(settings),
    consent: buildConsent(settings),
    footer: {
      columns: buildFooterColumns(footer?.columns, locale, fixedColumns),
      tagline: footer?.contactBlock?.trim() || t("footer.tagline"),
      copyright: footer?.copyright?.trim() || t("footer.copyright"),
      socials: buildSocialLinks(settings?.socialLinks),
    },
  };
}

function fixedLinks(locale: Locale, keys: PageLinkKey[], label: (key: PageLinkKey) => string): LinkView[] {
  return keys.map((key) => ({ label: label(key), href: resolveNavLink(key, locale)?.href ?? "/", external: false }));
}
