import type { GlobalAfterChangeHook, PayloadRequest } from "payload";

import { locales } from "../../i18n/routing";
import { internalPath } from "../../lib/content/content-paths";
import { globalCacheTag } from "../../lib/content/global-cache";
import { type RevalidatePaths, revalidateWithNext } from "../revalidate-content";
import { type RevalidateTags, revalidateTagsWithNext } from "../revalidate-global";

export const HOMEPAGE_GLOBAL_SLUG = "homepage";

export interface HomepageRevalidators {
  tags?: RevalidateTags;
  paths?: RevalidatePaths;
}

/** Trang chủ vi + en (đường dẫn nội bộ `/vi`, `/en`, xem `internalPath`). */
export const homepagePaths = (): string[] => locales.map((locale) => internalPath("/", locale));

/**
 * Làm mới trang chủ cả vi và en: tag `global:homepage` (dữ liệu global đọc qua `unstable_cache`, đã populate quan hệ)
 * và đường dẫn `/vi`, `/en` (cache trang). Dùng chung cho lưu global `homepage` và lưu `services`.
 */
export async function revalidateHomepage(req: PayloadRequest, revalidators: HomepageRevalidators = {}): Promise<void> {
  const { tags = revalidateTagsWithNext, paths = revalidateWithNext } = revalidators;
  await tags([globalCacheTag(HOMEPAGE_GLOBAL_SLUG)], req);
  await paths(homepagePaths(), req);
}

/** Hook `afterChange` của global `homepage`: lưu → làm mới `/` và `/en`. */
export function createRevalidateHomepageGlobal(revalidators?: HomepageRevalidators): GlobalAfterChangeHook {
  return async ({ doc, req }) => {
    await revalidateHomepage(req, revalidators);
    return doc;
  };
}
