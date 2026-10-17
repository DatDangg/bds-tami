import config from "@payload-config";
import type { Where } from "payload";
import { getPayload } from "payload";

import { type Locale, locales } from "../../i18n/routing";
import type { pathnames } from "../../i18n/routing";
import { logger } from "../logger";
import { LEGAL_PAGE_ROUTES, publicPath } from "./content-paths";
import { findPublicBySlug, findPublicOne, type PublicCollectionSlug } from "./public-queries";
import { normalizeRedirectSource } from "./redirect-paths";

type PathnameKey = keyof typeof pathnames;

/**
 * Trang động có slug mà `proxy.ts` kiểm tra tồn tại TRƯỚC khi vào page. Lý do (ARCHITECTURE §5.1, layer-6-task-03): Next 16 không SSR
 * được `notFound()` ném từ page (HTML server chỉ là shell `__next_error__` rỗng, nội dung chỉ hiện sau hydrate), còn URL không
 * khớp route nào thì Next dựng 404 SSR đầy đủ. Nên slug không có / chưa công khai / thiếu bản EN được rewrite sang đường dẫn không
 * route nào khớp ở proxy. Page vẫn gọi `notFound()` làm lưới an toàn (race giữa kiểm tra và render). Trang chi tiết mới (dự án,
 * cho thuê, tuyển dụng...) THÊM quy tắc vào đây khi làm trang của nó.
 */
interface MissingPageRule {
  key: PathnameKey;
  /** Tên tham số động trong `key` (`[slug]`, `[category]`). Bỏ trống = route cố định không slug (trang pháp lý): chỉ cần `where`. */
  param?: string;
  collection: PublicCollectionSlug;
  /** Điều kiện thêm, cùng điều kiện page dùng (vd `scope` của danh mục). */
  where?: Where;
}

export const MISSING_PAGE_RULES: readonly MissingPageRule[] = [
  { key: "/tin-tuc/[slug]", param: "slug", collection: "news" },
  { key: "/tin-tuc/danh-muc/[category]", param: "category", collection: "categories", where: { scope: { equals: "news" } } },
  { key: "/dich-vu/[slug]", param: "slug", collection: "services" },
  { key: LEGAL_PAGE_ROUTES.privacy, collection: "pages", where: { kind: { equals: "privacy" } } },
  { key: LEGAL_PAGE_ROUTES.terms, collection: "pages", where: { kind: { equals: "terms" } } },
];

const PLACEHOLDER = "SLUGPLACEHOLDER";

const escapeRegex = (value: string): string => value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

/**
 * Mỗi (quy tắc, ngôn ngữ) → regex khớp URL công khai: `/tin-tuc/<slug>`, `/en/news/<slug>`... (một đoạn, không `/` trong slug);
 * quy tắc không có `param` khớp đúng URL cố định (`/chinh-sach-bao-mat`, `/en/privacy-policy`).
 */
const MATCHERS = MISSING_PAGE_RULES.flatMap((rule) =>
  locales.map((locale) => {
    const pattern = escapeRegex(publicPath(rule.key, locale, rule.param ? { [rule.param]: PLACEHOLDER } : {}));
    return { rule, locale, regex: new RegExp(`^${rule.param ? pattern.replace(PLACEHOLDER, "([^/]+)") : pattern}$`) };
  }),
);

export interface MatchedPage {
  rule: MissingPageRule;
  locale: Locale;
  /** Rỗng với route cố định (không có slug). */
  slug: string;
}

/** URL công khai có thuộc một trang động cần kiểm tra không (và slug/ngôn ngữ của nó). Slug sai mã hoá (`%E0%A4%A`) coi là không có. */
export function matchDynamicPage(pathname: string): MatchedPage | null {
  const path = normalizeRedirectSource(pathname);
  for (const { rule, locale, regex } of MATCHERS) {
    const found = regex.exec(path);
    if (!found) continue;
    if (!rule.param) return { rule, locale, slug: "" };
    if (!found[1]) continue;
    try {
      return { rule, locale, slug: decodeURIComponent(found[1]) };
    } catch {
      return { rule, locale, slug: "" };
    }
  }
  return null;
}

/** Quá hạn này coi như "có" (page tự xử lý): DB chậm không được làm trang chờ theo. */
export const MISSING_LOOKUP_TIMEOUT_MS = 400;
/** Trang có: cache bằng độ trễ CDN. Trang chưa có: ngắn để bài mới xuất bản không bị chặn lâu. */
export const EXISTS_CACHE_TTL_MS = 60_000;
export const MISSING_CACHE_TTL_MS = 10_000;
const CACHE_MAX_ENTRIES = 1000;

const cache = new Map<string, { missing: boolean; expiresAt: number }>();

/** Chỉ dùng cho test. */
export const clearMissingPageCache = (): void => cache.clear();

function remember(pathname: string, missing: boolean): void {
  // Bot quét đường dẫn ngẫu nhiên không được làm phình bộ nhớ: đầy thì xoá hết.
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
  cache.set(pathname, { missing, expiresAt: Date.now() + (missing ? MISSING_CACHE_TTL_MS : EXISTS_CACHE_TTL_MS) });
}

async function pageExists(match: MatchedPage): Promise<boolean> {
  const { rule, locale, slug } = match;
  if (rule.param && !slug) return false;
  const payload = await getPayload({ config });
  const doc = rule.param
    ? await findPublicBySlug(payload, rule.collection, locale, slug, { depth: 0, ...(rule.where ? { where: rule.where } : {}) })
    : await findPublicOne(payload, rule.collection, locale, rule.where ?? {}, { depth: 0 });
  return doc !== null;
}

/**
 * Dùng trong `proxy.ts`: ngôn ngữ của trang nếu URL là trang động CHẮC CHẮN không tồn tại (để proxy rewrite sang 404 SSR đầy đủ),
 * ngược lại `null` (có, không phải trang động, hoặc không kiểm tra được: lỗi/quá hạn DB ghi log rồi để page tự xử lý, không cache).
 */
export async function resolveMissingPage(pathname: string): Promise<Locale | null> {
  const match = matchDynamicPage(pathname);
  if (!match) return null;
  const key = normalizeRedirectSource(pathname);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.missing ? match.locale : null;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const lookup = pageExists(match);
    lookup.catch(() => undefined); // nếu hết giờ trước, lỗi muộn không thành unhandled rejection
    const timeout = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), MISSING_LOOKUP_TIMEOUT_MS);
    });
    const exists = await Promise.race([lookup, timeout]);
    if (exists === "timeout") {
      logger.warn({ pathname, timeoutMs: MISSING_LOOKUP_TIMEOUT_MS }, "Kiểm tra trang tồn tại quá hạn, để page tự xử lý");
      return null;
    }
    remember(key, !exists);
    return exists ? null : match.locale;
  } catch (error) {
    logger.error({ err: error, pathname }, "Không kiểm tra được trang tồn tại, để page tự xử lý");
    return null;
  } finally {
    clearTimeout(timer);
  }
}
