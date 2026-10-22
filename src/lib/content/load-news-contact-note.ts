import "server-only";

import type { Locale } from "../../i18n/routing";
import { logger } from "../logger";
import { getSiteSettings } from "./get-globals";

/**
 * Chữ khung liên hệ cuối bài tin tức do admin nhập (`site-settings.newsDetail.contactNote`, BL-062) cho ngôn ngữ đang xem.
 * Rỗng / chỉ khoảng trắng / global lỗi → `undefined` (trang dùng câu mặc định i18n). Đọc qua `get-globals` (cache tag `site-settings`, `fallbackLocale: false`
 * nên `/en` không lấy chữ tiếng Việt — BR-07).
 */
export async function loadNewsContactNote(locale: Locale): Promise<string | undefined> {
  try {
    const settings = await getSiteSettings(locale);
    return settings.newsDetail?.contactNote?.trim() || undefined;
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho khung liên hệ cuối bài tin tức, dùng câu mặc định");
    return undefined;
  }
}
