import "server-only";

import type { Locale } from "../../i18n/routing";
import { logger } from "../logger";
import { type CareersProcessStep, resolveCareersProcess } from "./careers-process";
import { getSiteSettings } from "./get-globals";

/** "Quy trình ứng tuyển" ở ngôn ngữ đang xem; global lỗi → rỗng (ẩn khối, trang không vỡ). */
export async function loadCareersProcess(locale: Locale): Promise<CareersProcessStep[]> {
  try {
    return resolveCareersProcess(await getSiteSettings(locale));
  } catch (error) {
    logger.warn({ err: error }, "Không đọc được site-settings cho Quy trình ứng tuyển, ẩn khối");
    return [];
  }
}
