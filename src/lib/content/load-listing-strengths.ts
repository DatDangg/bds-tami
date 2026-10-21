import "server-only";

import type { ListingPageKey } from "../../globals/site-settings/listing-pages";
import type { Locale } from "../../i18n/routing";
import type { StrengthsView } from "../home/home-view";
import { logger } from "../logger";
import { getHomepage, getSiteSettings } from "./get-globals";
import { resolveListingPageContent } from "./load-listing-page";
import { resolveProjectStrengths } from "./load-project-strengths";

/**
 * Dải Điểm mạnh theo cờ của màn (BL-052: `/du-an` → `showProjectStrengths`, Cho thuê / Tin BĐS → `listingPages.*.showStrengths`; áp cho cả danh sách lẫn chi tiết).
 * Cùng điều kiện khối trang chủ như `/du-an` (`resolveProjectStrengths`: khối chưa tắt, ≥ 2 mục ở ngôn ngữ đang xem). Đọc global lỗi → không có dải (trang không vỡ).
 */
export async function loadListingStrengths(locale: Locale, key: ListingPageKey): Promise<StrengthsView | null> {
  try {
    const [homepage, settings] = await Promise.all([getHomepage(locale), getSiteSettings(locale)]);
    const { showStrengths } = resolveListingPageContent(settings, key);
    return resolveProjectStrengths(homepage, { showProjectStrengths: showStrengths });
  } catch (error) {
    logger.warn({ err: error, key }, "Không đọc được homepage/site-settings cho dải Điểm mạnh, bỏ dải");
    return null;
  }
}
