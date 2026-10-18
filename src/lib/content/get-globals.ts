import "server-only";

import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Footer, Header, Homepage, SiteSetting } from "../../payload-types";
import { globalCacheTag, type PublicGlobalSlug } from "./global-cache";
import { readPublicGlobal } from "./read-global";

/** Thời gian cache tối đa khi không có ai lưu global (ARCHITECTURE §5.1: nội dung mới lên web ≤ 1 phút). */
const CACHE_SECONDS = 60;

/** Cache theo (global, locale) nhưng gắn MỘT tag theo global: lưu global làm mới cả vi và en (hook `revalidate-global`). */
function cachedGlobal<T extends PublicGlobalSlug>(slug: T) {
  return (locale: Locale) =>
    unstable_cache(
      async () => readPublicGlobal(await getPayload({ config }), slug, locale),
      ["global", slug, locale],
      { tags: [globalCacheTag(slug)], revalidate: CACHE_SECONDS },
    )();
}

export const getSiteSettings: (locale: Locale) => Promise<SiteSetting> = cachedGlobal("site-settings");
export const getHeader: (locale: Locale) => Promise<Header> = cachedGlobal("header");
export const getFooter: (locale: Locale) => Promise<Footer> = cachedGlobal("footer");
export const getHomepage: (locale: Locale) => Promise<Homepage> = cachedGlobal("homepage");
