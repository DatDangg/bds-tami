import "server-only";

import type { Locale } from "../../i18n/routing";
import type { Media } from "../../payload-types";
import { logger } from "../logger";
import { getSiteSettings } from "./get-globals";

export interface SiteIdentity {
  siteName: string;
  /** Logo đã populate (cho metadata OG mặc định và `publisher.logo` của JSON-LD). */
  logo: Media | null;
}

const FALLBACK_SITE_NAME = "TAMI";

/**
 * Tên + logo site cho metadata/JSON-LD của trang con. Đọc qua `get-globals` (đã cache theo tag). Global lỗi (DB tắt lúc
 * `next build`) thì dùng tên cố định, không làm hỏng trang (cùng cách `load-shell`).
 */
export async function loadSiteIdentity(locale: Locale): Promise<SiteIdentity> {
  try {
    const settings = await getSiteSettings(locale);
    return {
      siteName: settings.siteName?.trim() || FALLBACK_SITE_NAME,
      logo: settings.logo && typeof settings.logo === "object" ? settings.logo : null,
    };
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho metadata, dùng tên cố định");
    return { siteName: FALLBACK_SITE_NAME, logo: null };
  }
}
