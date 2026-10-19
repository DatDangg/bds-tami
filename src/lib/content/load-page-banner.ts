import "server-only";

import type { MediaImage } from "../../components/media/ResponsiveImage";
import type { Locale } from "../../i18n/routing";
import { logger } from "../logger";
import { getSiteSettings } from "./get-globals";
import { type PageBannerKey, resolvePageBanner } from "./page-banner";

/**
 * Ảnh banner cho trang danh sách, đọc `site-settings` qua `get-globals` (đã cache theo tag). Global lỗi (DB tắt lúc `next build`)
 * thì ghi log và trả `undefined` → banner chữ, trang không vỡ (cùng cách `site-identity`).
 */
export async function loadPageBanner(locale: Locale, key: PageBannerKey): Promise<MediaImage | undefined> {
  try {
    return resolvePageBanner(await getSiteSettings(locale), key);
  } catch (error) {
    logger.warn({ err: error, key }, "Không đọc được site-settings cho ảnh banner trang danh sách, dùng banner chữ");
    return undefined;
  }
}
