import "server-only";

import type { Locale } from "../../i18n/routing";
import { logger } from "../logger";
import { type CareersPerkView, resolveCareersPerks } from "./careers-perks";
import { getSiteSettings } from "./get-globals";

/** Dải ý trang Tuyển dụng ở ngôn ngữ đang xem; global lỗi → `null` (ẩn dải, trang không vỡ). */
export async function loadCareersPerks(locale: Locale): Promise<CareersPerkView[] | null> {
  try {
    return resolveCareersPerks(await getSiteSettings(locale));
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho dải ý trang Tuyển dụng, ẩn dải");
    return null;
  }
}
