import type { StrengthIcon } from "../../globals/homepage/blocks";
import type { SiteSetting } from "../../payload-types";

export interface CareersProcessStep {
  icon: StrengthIcon;
  title: string;
  description: string | null;
}

/** Trần số bước hiển thị: bằng `maxRows` của `site-settings.careersProcess` (dữ liệu cũ / nhập thẳng DB vượt trần không làm vỡ hàng). */
export const CAREERS_PROCESS_MAX_STEPS = 6;

/**
 * Các bước "Quy trình ứng tuyển" trang Tuyển dụng (BL-054, Quyết định 8). Global đọc với `fallbackLocale: false` nên ở `/en` bước thiếu `title` EN
 * bị bỏ (không lấy chữ Việt, BR-07); 0 bước → mảng rỗng (trang ẩn cả khối). Thuần, không đọc DB.
 */
export function resolveCareersProcess(settings: Pick<SiteSetting, "careersProcess"> | null | undefined): CareersProcessStep[] {
  return (settings?.careersProcess ?? [])
    .flatMap((step) => {
      const title = step.title?.trim();
      return title ? [{ icon: step.icon, title, description: step.description?.trim() || null }] : [];
    })
    .slice(0, CAREERS_PROCESS_MAX_STEPS);
}
