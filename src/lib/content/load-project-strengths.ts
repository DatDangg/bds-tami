import "server-only";

import type { Locale } from "../../i18n/routing";
import type { Homepage, SiteSetting } from "../../payload-types";
import { type StrengthsView, toStrengths } from "../home/home-view";
import { logger } from "../logger";
import { getHomepage, getSiteSettings } from "./get-globals";

/**
 * Điều kiện hiện dải Điểm mạnh ở `/du-an` (BL-045): khối trang chủ `strengths` chưa tắt, còn ≥ 2 mục ở ngôn ngữ đang xem (`toStrengths`) và cờ
 * `site-settings.showProjectStrengths` không tắt (mặc định bật). Thuần, không đọc DB.
 */
export function resolveProjectStrengths(homepage: Pick<Homepage, "strengths">, settings: Pick<SiteSetting, "showProjectStrengths"> | null | undefined): StrengthsView | null {
  if (settings?.showProjectStrengths === false) return null;
  if (homepage.strengths?.enabled === false) return null;
  return toStrengths(homepage);
}

/** Dải Điểm mạnh cho trang Dự án; đọc global lỗi → không có dải (trang không vỡ). */
export async function loadProjectStrengths(locale: Locale): Promise<StrengthsView | null> {
  try {
    const [homepage, settings] = await Promise.all([getHomepage(locale), getSiteSettings(locale)]);
    return resolveProjectStrengths(homepage, settings);
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được homepage/site-settings cho dải Điểm mạnh trang Dự án, bỏ dải");
    return null;
  }
}
