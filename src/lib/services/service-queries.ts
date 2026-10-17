import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Service } from "../../payload-types";
import { findPublicBySlug, findPublicList } from "../content/public-queries";

/** "Dịch vụ khác" của S14: 2 dịch vụ còn lại (design-spec S14). */
export const OTHER_SERVICES_COUNT = 2;
const SERVICE_SORT = ["sortOrder", "createdAt"];

/** Dịch vụ công khai theo slug của ngôn ngữ đang xem; `coverImage` đã populate. */
export function findPublicServiceBySlug(payload: Payload, locale: Locale, slug: string): Promise<Service | null> {
  return findPublicBySlug<Service>(payload, "services", locale, slug, { depth: 1 });
}

/** Tối đa 2 dịch vụ công khai khác (theo `sortOrder`), loại dịch vụ đang xem. `/en` chỉ gồm dịch vụ đã có bản EN (qua `publicWhere`). */
export async function findOtherServices(payload: Payload, locale: Locale, currentId: string): Promise<Service[]> {
  const { docs } = await findPublicList<Service>(payload, "services", locale, {
    where: { id: { not_equals: currentId } },
    sort: SERVICE_SORT,
    limit: OTHER_SERVICES_COUNT,
    depth: 1,
  });
  return docs;
}
