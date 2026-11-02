import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { PUBLIC_STATUSES } from "../../access";
import type { Locale } from "../../i18n/routing";
import { escapeLike, phraseRegex, searchTerms } from "../search/rental-search-sql";
import { unaccentSql } from "../search/unaccent-sql";

/** Trần số bài khớp `q` / `tag` được phân trang (id đưa vào `IN`); vượt thì phần cũ nhất bị cắt và có cảnh báo trong log. */
export const NEWS_FILTER_MAX_IDS = 1000;
/** Số chip tối đa của khối "Chủ đề" (spec BL-054). */
export const NEWS_TOP_TAGS_LIMIT = 12;

const adapterOf = (payload: Payload) => payload.db as unknown as PostgresAdapter;

/**
 * Bài công khai (bí danh `n`) ở mức SQL: cùng nghĩa `publicWhere("news", locale)` — trạng thái công khai, chưa xoá mềm, `/en` thì `hasEnglish`
 * (như `rankNewsByViews`) + hẹn giờ (BL-091): `published_at` trống hoặc ≤ `now`. Chỉ để lọc sơ bộ: kết quả cuối vẫn đi qua `findPublicList` (`listPublicNews`), nên lệch ở đây không lộ bài nào.
 */
function publicNewsSql(locale: Locale, now: Date) {
  const statuses = sql.join(PUBLIC_STATUSES.default.map((status) => sql`${status}`), sql`, `);
  const english = locale === "en" ? sql` AND n."has_english" = true` : sql``;
  return sql`n."status" IN (${statuses}) AND n."deleted_at" IS NULL AND (n."published_at" IS NULL OR n."published_at" <= ${now.toISOString()}::timestamptz)${english}`;
}

/** ≥ 2 từ (BL-103): ngoài `LIKE` từng từ, cả cụm phải liền nhau đúng thứ tự, từ đầu ở đầu từ (cùng `phraseRegex` của Cho thuê). 1 từ: giữ substring. */
function phraseConditions(haystack: ReturnType<typeof unaccentSql>, terms: readonly string[]) {
  const phrase = phraseRegex(terms);
  return phrase === undefined ? [] : [sql`${haystack} ~ ${phrase}`];
}

/**
 * Id bài khớp từ khoá `q` (tiêu đề + tóm tắt của ngôn ngữ đang xem, không dấu; mọi từ phải có, ≥ 2 từ thì cả cụm liền nhau ở đầu từ (BL-103) — cùng `searchTerms` / `LIKE` / `phraseRegex` của tìm kiếm cho thuê,
 * phía cột bỏ dấu bằng `unaccentSql`, không thêm cột / migration) VÀ có thẻ `tag` (khớp đúng chuỗi). Không có `q` lẫn `tag` → `null` (không lọc).
 * `categoryIds` (trang danh mục: danh mục + con) lọc ngay trong SQL, TRƯỚC trần, để bài ngoài danh mục không chiếm chỗ trong `NEWS_FILTER_MAX_IDS`.
 * Thứ tự trả về: (1) không có `q` lẫn `tag` → `null` (kể cả khi có `categoryIds`; nơi gọi tự lọc danh mục qua `listPublicNews`); (2) có lọc và
 * `categoryIds` là mảng rỗng → `[]` (danh mục không có bài, không truy vấn); (3) còn lại → id khớp.
 * Mới nhất trước, tối đa `NEWS_FILTER_MAX_IDS`. Mọi giá trị người dùng đi qua tham số SQL.
 */
export async function findFilteredNewsIds(
  payload: Payload,
  locale: Locale,
  filters: { q?: string | undefined; tag?: string | undefined; categoryIds?: readonly string[] | undefined },
  now: Date = new Date(),
): Promise<string[] | null> {
  const terms = searchTerms(filters.q);
  if (terms.length === 0 && !filters.tag) return null;
  if (filters.categoryIds?.length === 0) return [];
  const haystack = unaccentSql(sql`coalesce(nl."title", '') || ' ' || coalesce(nl."excerpt", '')`);
  const conditions = [
    publicNewsSql(locale, now),
    ...(filters.categoryIds ? [sql`n."category_id"::text IN (${sql.join(filters.categoryIds.map((id) => sql`${id}`), sql`, `)})`] : []),
    ...terms.map((term) => sql`${haystack} LIKE ${`%${escapeLike(term)}%`}`),
    ...phraseConditions(haystack, terms),
    ...(filters.tag ? [sql`EXISTS (SELECT 1 FROM "news_texts" t WHERE t."parent_id" = n."id" AND t."path" = 'tags' AND btrim(t."text") = ${filters.tag})`] : []),
  ];
  const result = await adapterOf(payload).drizzle.execute(sql`
    SELECT n."id"::text AS id
    FROM "news" n JOIN "news_locales" nl ON nl."_parent_id" = n."id" AND nl."_locale" = ${locale}
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY n."published_at" DESC NULLS LAST, n."created_at" DESC, n."id"
    LIMIT ${NEWS_FILTER_MAX_IDS + 1}
  `);
  const ids = result.rows.map((row) => String(row.id));
  if (ids.length <= NEWS_FILTER_MAX_IDS) return ids;
  payload.logger.warn({ cap: NEWS_FILTER_MAX_IDS }, "Lọc tin tức chạm trần: bài cũ hơn không được phân trang");
  return ids.slice(0, NEWS_FILTER_MAX_IDS);
}

/**
 * Khối "Chủ đề" (BL-054): ≤ `NEWS_TOP_TAGS_LIMIT` thẻ dùng nhiều nhất trong bài công khai (nhiều bài trước, hoà theo chữ). Chỉ `/vi`:
 * `news.tags` chưa có bản EN (BR-07) nên `/en` luôn rỗng (khối ẩn).
 */
export async function listTopNewsTags(payload: Payload, locale: Locale, now: Date = new Date()): Promise<string[]> {
  if (locale === "en") return [];
  const result = await adapterOf(payload).drizzle.execute(sql`
    SELECT btrim(t."text") AS tag, COUNT(DISTINCT t."parent_id") AS uses
    FROM "news_texts" t JOIN "news" n ON n."id" = t."parent_id"
    WHERE t."path" = 'tags' AND btrim(coalesce(t."text", '')) <> '' AND ${publicNewsSql(locale, now)}
    GROUP BY btrim(t."text")
    ORDER BY uses DESC, tag
    LIMIT ${NEWS_TOP_TAGS_LIMIT}
  `);
  return result.rows.map((row) => String(row.tag));
}
