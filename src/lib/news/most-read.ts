import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { unstable_cache } from "next/cache";
import type { Payload, Where } from "payload";

import { PUBLIC_STATUSES } from "../../access";
import type { Locale } from "../../i18n/routing";
import type { News } from "../../payload-types";
import { findPublicList } from "../content/public-queries";
import { NEWS_MOST_READ_TAG } from "./news-cache-tags";
import { type NewsCardData, toNewsCardData } from "./news-view";
import { vietnamDayStart } from "./view-dedupe";

/** Khối "Đọc nhiều" ở cột phải /tin-tuc (spec BL-054): top 5. */
export const MOST_READ_LIMIT = 5;
/** Cửa sổ tính lượt xem: 30 ngày theo giờ Việt Nam, gồm cả hôm nay. */
export const MOST_READ_WINDOW_DAYS = 30;
/** Cache ngắn (spec: ≤ 1 giờ). Xuất bản / ẩn / xoá bài làm mới ngay qua tag `NEWS_MOST_READ_TAG`. */
const MOST_READ_CACHE_SECONDS = 600;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Cùng thứ tự "mới nhất" của danh sách tin (`news-queries.ts`). */
const NEWEST_SORT = ["-publishedAt", "-createdAt"];
/** Thẻ "Đọc nhiều" chỉ cần mấy trường này: không kéo `content` (richText dài) của bài. */
const CARD_SELECT = { title: true, slug: true, cover: true, publishedAt: true } as const;

export type MostReadNewsItem = Pick<NewsCardData, "id" | "title" | "href" | "cover" | "publishedAt" | "dateLabel">;

/** Mốc bắt đầu cửa sổ: 00:00 giờ VN của ngày cách hôm nay 29 ngày. */
export function mostReadWindowStart(now: Date): Date {
  return new Date(vietnamDayStart(now).getTime() - (MOST_READ_WINDOW_DAYS - 1) * DAY_MS);
}

/**
 * Id bài xếp theo tổng `views` trong cửa sổ (giảm dần, hoà thì bài mới hơn trước). Lọc sơ bộ bài công khai trong SQL để
 * bài đã ẩn không chiếm suất; quyết định cuối vẫn là `findPublicList` ở `findMostReadNews`. Quét theo `day` rồi gộp theo
 * `news_id` (index `news_views_daily_day_idx` / `news_day_idx`).
 */
export async function rankNewsByViews(payload: Payload, locale: Locale, since: Date, limit: number): Promise<string[]> {
  const statuses = sql.join(PUBLIC_STATUSES.default.map((status) => sql`${status}`), sql`, `);
  const english = locale === "en" ? sql` AND n."has_english" = true` : sql``;
  const adapter = payload.db as unknown as PostgresAdapter;
  const result = await adapter.drizzle.execute(sql`
    SELECT v."news_id"::text AS id, SUM(v."views") AS total
    FROM "news_views_daily" v
    JOIN "news" n ON n."id" = v."news_id"
    WHERE v."day" >= ${since.toISOString()} AND n."status" IN (${statuses}) AND n."deleted_at" IS NULL${english}
    GROUP BY v."news_id", n."published_at"
    ORDER BY total DESC, n."published_at" DESC NULLS LAST, v."news_id"
    LIMIT ${limit}
  `);
  return result.rows.map((row) => String(row.id));
}

function listCards(payload: Payload, locale: Locale, where: Where | undefined, limit: number, sort?: string[]): Promise<News[]> {
  return findPublicList<News>(payload, "news", locale, { where, limit, sort, depth: 1, select: CARD_SELECT }).then(
    (result) => result.docs,
  );
}

function toItem(doc: News, locale: Locale): MostReadNewsItem | null {
  const card = toNewsCardData(doc, locale);
  if (!card) return null;
  const { id, title, href, cover, publishedAt, dateLabel } = card;
  return { id, title, href, cover, publishedAt, dateLabel };
}

/** Lấy dư id xếp hạng (và bài bù) gấp đôi: bài bị loại ở `findPublicList` hoặc không dựng được thẻ (thiếu tiêu đề / slug) không làm hụt suất. */
const OVERFETCH_FACTOR = 2;

/**
 * Top `limit` bài đọc nhiều (không cache). Bài xếp hạng được đọc lại qua `findPublicList` (đúng quy tắc công khai, `/en` chỉ bài có
 * bản EN) và giữ thứ tự hạng. Thiếu thì bù bài `isFeatured` mới nhất, rồi bài mới nhất, không trùng. Thẻ rỗng (`toItem` → `null`) bị lọc
 * TRƯỚC khi bù (P1-T03 review MINOR-1) nên vẫn đủ `limit` bài khi có đủ bài công khai.
 */
export async function findMostReadNews(
  payload: Payload,
  locale: Locale,
  options: { limit?: number; now?: Date } = {},
): Promise<MostReadNewsItem[]> {
  const limit = options.limit ?? MOST_READ_LIMIT;
  const items: MostReadNewsItem[] = [];
  const seen = new Set<string>();
  const take = (docs: readonly News[]) => {
    for (const doc of docs) {
      if (items.length >= limit) return;
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      const item = toItem(doc, locale);
      if (item) items.push(item);
    }
  };
  const rankedIds = await rankNewsByViews(payload, locale, mostReadWindowStart(options.now ?? new Date()), limit * OVERFETCH_FACTOR);
  if (rankedIds.length > 0) {
    const byId = new Map((await listCards(payload, locale, { id: { in: rankedIds } }, rankedIds.length)).map((doc) => [doc.id, doc]));
    take(rankedIds.flatMap((id) => byId.get(id) ?? []));
  }
  for (const featuredOnly of [true, false]) {
    if (items.length >= limit) break;
    const conditions: Where[] = [...(featuredOnly ? [{ isFeatured: { equals: true } }] : []), ...(seen.size > 0 ? [{ id: { not_in: [...seen] } }] : [])];
    const where: Where | undefined = conditions.length > 0 ? { and: conditions } : undefined;
    take(await listCards(payload, locale, where, (limit - items.length) * OVERFETCH_FACTOR, NEWEST_SORT));
  }
  return items;
}

/** Khối "Đọc nhiều" cho trang công khai: cache theo (locale, limit), tag `NEWS_MOST_READ_TAG`, tối đa 10 phút. */
export function loadMostReadNews(locale: Locale, limit: number = MOST_READ_LIMIT): Promise<MostReadNewsItem[]> {
  return unstable_cache(
    async () => {
      const [{ getPayload }, { default: config }] = await Promise.all([import("payload"), import("@payload-config")]);
      return findMostReadNews(await getPayload({ config }), locale, { limit });
    },
    ["news-most-read", locale, String(limit)],
    { tags: [NEWS_MOST_READ_TAG], revalidate: MOST_READ_CACHE_SECONDS },
  )();
}
