import config from "@payload-config";
import { getPayload } from "payload";

import type { Locale } from "../../i18n/routing";
import { publicPath } from "../content/content-paths";
import { findPublicBySlug, findPublicOne } from "../content/public-queries";
import { MISSING_PAGE_RULES } from "../content/resolve-missing-page";
import { findLocalizedSlugs } from "../news/news-queries";
import { fallbackCounterpartPath, parsePublicPath, staticCounterpartPath } from "./counterpart-url";

type SlugCollection = Parameters<typeof findLocalizedSlugs>[1];

const SLUG_COLLECTIONS: ReadonlySet<string> = new Set<SlugCollection>(["news", "categories", "services", "projects", "job-postings", "rentals", "property-posts"]);

function isSlugCollection(collection: string): collection is SlugCollection {
  return SLUG_COLLECTIONS.has(collection);
}

/**
 * URL công khai của cùng trang ở ngôn ngữ `target` (FR-PUB-18): bản ghi có bản dịch → chi tiết tương ứng; chưa có (hoặc slug lạ,
 * không phải trang đã khai) → danh sách/trang chủ ngôn ngữ kia. Kết quả LUÔN do server dựng từ `pathnames` + slug trong DB,
 * không bao giờ phản chiếu input, nên không thể thành open redirect.
 */
export async function resolveCounterpartPath(pathname: string, target: Locale): Promise<string> {
  const parsed = parsePublicPath(pathname);
  if (!parsed) return publicPath("/", target);
  const direct = staticCounterpartPath(parsed, target);
  if (direct) return direct;
  const fallback = fallbackCounterpartPath(parsed.key, target);
  const rule = MISSING_PAGE_RULES.find((candidate) => candidate.key === parsed.key);
  if (!rule) return fallback;
  const payload = await getPayload({ config });
  // Trang pháp lý: route cố định, tra theo `kind`; bản EN chỉ khi `hasEnglish` (admin có thể tắt khi bản dịch chờ duyệt lại).
  if (!rule.param) {
    const page = await findPublicOne<{ hasEnglish?: boolean | null }>(payload, rule.collection, parsed.locale, rule.where ?? {}, { depth: 0 });
    if (!page || (target === "en" && page.hasEnglish !== true)) return fallback;
    return publicPath(parsed.key, target);
  }
  const param = rule.param;
  const slug = parsed.params[param];
  if (!slug || !isSlugCollection(rule.collection)) return fallback;
  const doc = await findPublicBySlug<{ id: string; hasEnglish?: boolean | null }>(payload, rule.collection, parsed.locale, slug, {
    depth: 0,
    ...(rule.where ? { where: rule.where } : {}),
  });
  if (!doc) return fallback;
  // BR-07: bản EN chỉ tồn tại khi `hasEnglish` bật VÀ có slug EN (cùng điều kiện hreflang ở từng trang).
  if (target === "en" && doc.hasEnglish !== true) return fallback;
  const targetSlug = (await findLocalizedSlugs(payload, rule.collection, doc.id))[target];
  return targetSlug ? publicPath(parsed.key, target, { [param]: targetSlug }) : fallback;
}
