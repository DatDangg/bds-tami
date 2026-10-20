import "server-only";

import { getTranslations } from "next-intl/server";

import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { PageHeroTextKey } from "../../globals/site-settings/page-heroes";
import type { Locale } from "../../i18n/routing";
import { logger } from "../logger";
import { getSiteSettings } from "./get-globals";
import { type PageBannerKey, type PageHeroView, resolvePageBanner, resolvePageHero } from "./page-banner";

/** Khoá hero → namespace i18n chứa `title`/`description` mặc định của trang đó. */
const DEFAULT_TEXT_NAMESPACE = {
  projects: "page.projects",
  rentals: "page.rentals",
  news: "page.news",
  propertyPosts: "page.posts",
  careers: "page.careers",
  contact: "page.contact",
} as const satisfies Record<PageHeroTextKey, string>;

/**
 * Ảnh banner cho trang con, đọc `site-settings` qua `get-globals` (đã cache theo tag). Global lỗi (DB tắt lúc `next build`)
 * thì ghi log và trả `undefined` → banner chữ, trang không vỡ (cùng cách `site-identity`).
 */
export async function loadPageBanner(locale: Locale, key: PageBannerKey): Promise<MediaImage | undefined> {
  try {
    return resolvePageBanner(await getSiteSettings(locale), key);
  } catch (error) {
    logger.warn({ err: error, key }, "Không đọc được site-settings cho ảnh banner trang con, dùng banner chữ");
    return undefined;
  }
}

/** Hero của trang con (ảnh + chữ). Global lỗi → chỉ chữ mặc định, không ảnh (trang không vỡ). */
export async function loadPageHero(locale: Locale, key: PageHeroTextKey): Promise<PageHeroView> {
  const t = await getTranslations({ locale, namespace: DEFAULT_TEXT_NAMESPACE[key] });
  const defaults = { title: t("title"), description: t("description") };
  try {
    return resolvePageHero(await getSiteSettings(locale), key, defaults);
  } catch (error) {
    logger.warn({ err: error, key }, "Không đọc được site-settings cho hero trang con, dùng chữ mặc định");
    return resolvePageHero(null, key, defaults);
  }
}
