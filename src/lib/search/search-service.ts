import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import type { RentalCard, RentalSearchParams, RentalSearchResult } from "../../shared/types/api";
import { rentalFrom, rentalOrderBy, rentalWhere, type SqlFragment } from "./rental-search-sql";

/**
 * Cổng tìm kiếm (ERD §6, ARCHITECTURE §9.1): chỉ đổi implementation khi chuyển sang OpenSearch, không đổi chỗ gọi.
 */
export interface SearchService<Params, Result> {
  search(params: Params): Promise<Result>;
}

export type RentalSearchService = SearchService<RentalSearchParams, RentalSearchResult>;

/** Phần của drizzle mà service dùng; tách ra để test và bench truyền được pool riêng. */
export interface SqlExecutor {
  execute(query: SqlFragment): Promise<{ rows: Record<string, unknown>[] }>;
}

/** Drizzle của adapter Payload đáp ứng `SqlExecutor` (kiểu trả về của `execute` phụ thuộc driver nên cần ép một lần ở đây). */
export function sqlExecutorOf(payload: Payload): SqlExecutor {
  return (payload.db as unknown as { drizzle: SqlExecutor }).drizzle;
}

const toNumber = (value: unknown): number | null => (value === null || value === undefined ? null : Number(value));
const toIso = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
};

function toCard(row: Record<string, unknown>): RentalCard {
  const card: RentalCard = {
    id: String(row.id),
    code: String(row.code),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    status: row.status as RentalCard["status"],
    thumbnail: row.thumbnail_url ? { url: String(row.thumbnail_url), alt: row.thumbnail_alt ? String(row.thumbnail_alt) : null } : null,
    priceMonthlyVnd: toNumber(row.price_monthly_vnd),
    priceNegotiable: row.price_negotiable === true,
    areaM2: Number(row.area_m2),
    bedrooms: toNumber(row.bedrooms),
    bathrooms: toNumber(row.bathrooms),
    furnishing: (row.furnishing as RentalCard["furnishing"]) ?? null,
    province: { name: String(row.province_name), slug: String(row.province_slug) },
    ward: { name: String(row.ward_name), slug: String(row.ward_slug) },
    publishedAt: toIso(row.published_at),
  };
  // Địa chỉ chỉ rời DB khi tin bật `showExactAddress` (SQL trả NULL ở trường hợp còn lại).
  if (typeof row.address === "string") card.address = row.address;
  return card;
}

/**
 * `SearchService` cho tin cho thuê trên Postgres: lọc theo cột có index (ERD §5), từ khoá bằng `LIKE` trên `search_text` (GIN trigram).
 * SQL thô tham số hoá thay vì `payload.find`: một truy vấn lấy cả trang + khu vực + ảnh đại diện, không N+1.
 * Quy tắc công khai nằm ở `publicConditions` (đối chiếu với `publicWhere`).
 */
export class PostgresRentalSearch implements RentalSearchService {
  constructor(private readonly db: SqlExecutor) {}

  async search(params: RentalSearchParams): Promise<RentalSearchResult> {
    const where = rentalWhere(params);
    const [total, items] = await Promise.all([this.count(params, where), this.fetchPage(params, where)]);
    return { items, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
  }

  private async count(params: RentalSearchParams, where: SqlFragment): Promise<number> {
    const result = await this.db.execute(sql`SELECT count(*)::int AS total ${rentalFrom(params.locale)} ${where}`);
    return Number(result.rows[0]?.total ?? 0);
  }

  private async fetchPage(params: RentalSearchParams, where: SqlFragment): Promise<RentalCard[]> {
    const { locale, limit, page, sort } = params;
    const offset = (page - 1) * limit;
    const result = await this.db.execute(sql`
      WITH page AS (
        SELECT r."id", r."code", r."status", r."price_monthly_vnd", r."price_negotiable", r."area_m2", r."bedrooms", r."bathrooms",
               r."furnishing", r."province_id", r."ward_id", r."published_at", rl."title", rl."slug",
               CASE WHEN r."show_exact_address" THEN r."address" END AS "address"
        ${rentalFrom(locale)} ${where} ${rentalOrderBy(sort, "r")} LIMIT ${limit} OFFSET ${offset}
      )
      SELECT page.*, p."name" AS province_name, p."slug" AS province_slug, w."name" AS ward_name, w."slug" AS ward_slug,
             cover."url" AS thumbnail_url, cover."alt" AS thumbnail_alt
      FROM page
      JOIN "provinces" p ON p."id" = page."province_id"
      JOIN "wards" w ON w."id" = page."ward_id"
      LEFT JOIN LATERAL (
        SELECT COALESCE(m."sizes_card_url", m."url") AS url, ml."alt" AS alt
        FROM "rentals_rels" rr
        JOIN "media" m ON m."id" = rr."media_id"
        LEFT JOIN "media_locales" ml ON ml."_parent_id" = m."id" AND ml."_locale" = ${locale}
        WHERE rr."parent_id" = page."id" AND rr."path" = 'gallery'
        ORDER BY rr."order" ASC LIMIT 1
      ) cover ON true
      ${rentalOrderBy(sort, "page")}`);
    return result.rows.map(toCard);
  }
}
