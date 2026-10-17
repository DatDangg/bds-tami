import type { Payload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { PublicGlobalSlug } from "./global-cache";

/**
 * Đọc global như KHÁCH: `overrideAccess: false` và không truyền `user`, nên field access ẩn `notificationEmails`,
 * `translationGlossary`, `translationEnabled`. Không đổi sang `overrideAccess: true`: kết quả được cache và đưa vào
 * server/client component, một trường bí mật lọt vào đây sẽ ra HTML công khai. Không rơi về tiếng Việt khi thiếu bản
 * en (BR-07). Tách khỏi `get-globals` (cần Next + `@payload-config`) để test được với Payload dựng riêng.
 */
export function readPublicGlobal<T extends PublicGlobalSlug>(payload: Payload, slug: T, locale: Locale) {
  return payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 1, overrideAccess: false });
}
