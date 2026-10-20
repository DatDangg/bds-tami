import type { StrengthIcon } from "../../globals/homepage/blocks";
import type { SiteSetting } from "../../payload-types";

export interface CareersPerkView {
  icon: StrengthIcon;
  title: string;
  description: string | null;
}

/** Dải ý cần ≥ 2 mục hiển thị được, như dải Điểm mạnh trang chủ. */
const CAREERS_PERKS_MIN_ITEMS = 2;

/**
 * Dải ý trang Tuyển dụng (Q9). Global đọc với `fallbackLocale: false` nên ở `/en` mục chưa có `title` EN bị bỏ, không lấy chữ Việt;
 * còn dưới 2 mục → `null` (ẩn dải). Thuần, không đọc DB.
 */
export function resolveCareersPerks(settings: Pick<SiteSetting, "careersPerks"> | null | undefined): CareersPerkView[] | null {
  const items = (settings?.careersPerks ?? []).flatMap((perk) => {
    const title = perk.title?.trim();
    return title ? [{ icon: perk.icon, title, description: perk.description?.trim() || null }] : [];
  });
  return items.length >= CAREERS_PERKS_MIN_ITEMS ? items : null;
}
