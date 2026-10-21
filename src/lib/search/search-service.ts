import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

import { RENTAL_AMENITIES, type RentalAmenity, type RentalCard, type RentalSearchParams, type RentalSearchResult } from "../../shared/types/api";
import { allOf, filterConditions, type RentalConditions, rentalConditions, rentalFrom, rentalOrderBy, rentalWhere, type SqlFragment } from "./rental-search-sql";

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
    category: row.category_name && row.category_slug ? { name: String(row.category_name), slug: String(row.category_slug) } : null,
    publishedAt: toIso(row.published_at),
  };
  // Địa chỉ chỉ rời DB khi tin bật `showExactAddress` (SQL trả NULL ở trường hợp còn lại).
  if (typeof row.address === "string") card.address = row.address;
  return card;
}

/** Số thẻ tối đa của slider nổi bật đầu lưới `/cho-thue` (BL-052, cùng trần với `/du-an`). */
export const RENTAL_FEATURED_LIMIT = 5;

/** Số đếm theo một chiều: `counts[id]` = số tin khớp MỌI bộ lọc khác trừ chiều này; `all` = số khớp khi bỏ hẳn chiều này ("Tất cả"). */
export interface RentalFacetCounts {
  all: number;
  counts: Record<string, number>;
}

/** Một tỉnh có ≥ 1 tin trong phạm vi (công khai, còn trống ở trang danh sách): `count` theo bộ lọc trừ tỉnh/phường, `total` khi không lọc gì. */
export interface RentalProvinceCount {
  provinceId: string;
  count: number;
  total: number;
}

export interface RentalListingFacets {
  /** Theo id danh mục CẤP 1 (tin ở danh mục con tính vào cha) — tab; `all` = tab "Tất cả". */
  category: RentalFacetCounts;
  /** Chỉ tỉnh có ≥ 1 tin trong phạm vi; thứ tự không xác định (nơi gọi sắp theo `total`). */
  provinces: RentalProvinceCount[];
  /** Đủ mọi tiện ích (0 nếu không có tin): số tin khớp mọi bộ lọc trừ CẢ chiều tiện ích và có tiện ích đó (ô tích AND, cùng quy tắc `/du-an`). */
  amenities: Record<RentalAmenity, number>;
}

/**
 * Kết quả trang danh sách `/cho-thue` (BL-052). `items` = một trang lưới trên phần còn lại SAU KHI bỏ tin nổi bật; `total` = MỌI tin khớp
 * (gồm nổi bật — "N phù hợp"); `totalPages` tính trên phần còn lại.
 */
export interface RentalListingResult extends RentalSearchResult {
  /** ≤ `RENTAL_FEATURED_LIMIT` tin `isFeatured` khớp bộ lọc, mới nhất trước (không theo `sort`); chỉ có ở trang 1 (trang khác rỗng, nhưng vẫn bị loại khỏi lưới). */
  featured: RentalCard[];
  facets: RentalListingFacets;
}


/**
 * Id tin nổi bật của bộ lọc: `isFeatured`, mới nhất trước, tối đa `RENTAL_FEATURED_LIMIT`. Dùng làm truy vấn con (`r.id NOT IN (…)`) để lưới loại chúng ngay
 * trong cùng truy vấn trang — bí danh `r`/`rl` bên trong che bí danh ngoài nên `where` dùng lại nguyên văn.
 */
const featuredIdsQuery = (locale: string, where: SqlFragment): SqlFragment =>
  sql`SELECT r."id" ${rentalFrom(locale)} ${where} AND r."is_featured" = true ${rentalOrderBy("newest", "r")} LIMIT ${RENTAL_FEATURED_LIMIT}`;

/**
 * `SearchService` cho tin cho thuê trên Postgres: lọc theo cột có index (ERD §5), từ khoá bằng `LIKE` trên `search_text` (GIN trigram).
 * SQL thô tham số hoá thay vì `payload.find`: một truy vấn lấy cả trang + khu vực + ảnh đại diện, không N+1.
 * Quy tắc công khai nằm ở `publicConditions` (đối chiếu với `publicWhere`).
 */
export class PostgresRentalSearch implements RentalSearchService {
  constructor(private readonly db: SqlExecutor) {}

  async search(params: RentalSearchParams): Promise<RentalSearchResult> {
    const where = rentalWhere(params);
    const [{ total }, items] = await Promise.all([this.count(params, where), this.fetchRows(params, where, params.sort)]);
    return { items, total, page: params.page, totalPages: Math.ceil(total / params.limit) };
  }

  /**
   * Trang danh sách `/cho-thue` (BL-052): 4 truy vấn song song — đếm (tổng + số nổi bật), trang lưới ĐÃ loại tin nổi bật (truy vấn con nên lưới không
   * lặp thẻ nổi bật ở MỌI trang), thẻ nổi bật (chỉ trang 1), số đếm theo chiều (một lượt quét `GROUPING SETS` + một truy vấn đếm tiện ích).
   * `total` gồm cả tin nổi bật; `totalPages` tính trên phần còn lại.
   */
  async listing(params: RentalSearchParams): Promise<RentalListingResult> {
    const where = rentalWhere(params);
    const gridWhere = sql`${where} AND r."id" NOT IN (${featuredIdsQuery(params.locale, where)})`;
    const featuredWhere = sql`${where} AND r."is_featured" = true`;
    const [{ total, featured: featuredCount }, items, featured, facets] = await Promise.all([
      this.count(params, where),
      this.fetchRows(params, gridWhere, params.sort),
      params.page === 1 ? this.fetchRows({ ...params, page: 1, limit: RENTAL_FEATURED_LIMIT }, featuredWhere, "newest") : Promise.resolve([]),
      this.facets(params),
    ]);
    return { items, total, page: params.page, totalPages: Math.ceil((total - featuredCount) / params.limit), featured, facets };
  }

  /** Tổng số tin khớp + số tin nổi bật sẽ hiện (≤ `RENTAL_FEATURED_LIMIT`). */
  private async count(params: RentalSearchParams, where: SqlFragment): Promise<{ total: number; featured: number }> {
    const result = await this.db.execute(
      sql`SELECT count(*)::int AS total, LEAST(count(*) FILTER (WHERE r."is_featured" = true), ${RENTAL_FEATURED_LIMIT})::int AS featured ${rentalFrom(params.locale)} ${where}`,
    );
    return { total: Number(result.rows[0]?.total ?? 0), featured: Number(result.rows[0]?.featured ?? 0) };
  }

  /**
   * Số đếm theo chiều trong MỘT lượt quét các tin thuộc phạm vi (công khai + còn trống): mỗi tin mang hai cờ "khớp mọi bộ lọc trừ danh mục" và
   * "khớp mọi bộ lọc trừ tỉnh/phường", rồi `GROUPING SETS` gom theo danh mục cấp 1 (cha nếu tin ở danh mục con — tối đa 2 cấp, ERD §4.3; danh mục
   * xoá mềm không tính), theo tỉnh và tổng. `total` theo tỉnh = số tin trong phạm vi (không lọc).
   */
  private async facets(params: RentalSearchParams): Promise<RentalListingFacets> {
    const conditions = rentalConditions(params);
    const [result, amenities] = await Promise.all([this.groupedCounts(params, conditions), this.amenityCounts(params, conditions)]);
    return { ...toFacets(result.rows), amenities };
  }

  private groupedCounts(params: RentalSearchParams, conditions: RentalConditions) {
    return this.db.execute(sql`
      SELECT GROUPING(x."root_id") AS by_root, GROUPING(x."province_id") AS by_province, x."root_id", x."province_id",
             count(*)::int AS total,
             count(*) FILTER (WHERE x."no_category")::int AS without_category,
             count(*) FILTER (WHERE x."no_province")::int AS without_province
      FROM (
        SELECT COALESCE(rc."parent_id", rc."id") AS "root_id", r."province_id",
               (${allOf(filterConditions(conditions, "category"))}) AS "no_category",
               (${allOf(filterConditions(conditions, "province"))}) AS "no_province"
        ${rentalFrom(params.locale)}
        LEFT JOIN "categories" rc ON rc."id" = r."category_id" AND rc."deleted_at" IS NULL
        WHERE ${allOf(conditions.scope)}
      ) x
      GROUP BY GROUPING SETS ((x."root_id"), (x."province_id"), ())`);
  }

  /**
   * Số đếm ô Tiện ích: tin khớp phạm vi + mọi bộ lọc trừ chiều tiện ích, nối bảng hasMany `rentals_amenities` (index `parent_id`) rồi gom theo giá trị.
   * Truy vấn riêng (song song lượt `GROUPING SETS`) vì phép nối nhân dòng theo số tiện ích của tin; `DISTINCT` phòng giá trị lặp.
   */
  private async amenityCounts(params: RentalSearchParams, conditions: RentalConditions): Promise<Record<RentalAmenity, number>> {
    const result = await this.db.execute(sql`
      SELECT ra."value" AS "amenity", count(DISTINCT r."id")::int AS "count"
      ${rentalFrom(params.locale)}
      JOIN "rentals_amenities" ra ON ra."parent_id" = r."id"
      WHERE ${allOf([...conditions.scope, ...filterConditions(conditions, "amenity")])}
      GROUP BY ra."value"`);
    return toAmenityCounts(result.rows);
  }

  /** Thẻ của các tin khớp `where`, một trang theo `params.page`/`limit`, sắp theo `sort`. */
  private async fetchRows(params: RentalSearchParams, where: SqlFragment, sort: RentalSearchParams["sort"]): Promise<RentalCard[]> {
    const { locale, limit, page } = params;
    const offset = (page - 1) * limit;
    const englishCategory = locale === "en" ? sql` AND c."has_english" = true` : sql``;
    const result = await this.db.execute(sql`
      WITH page AS (
        SELECT r."id", r."code", r."status", r."price_monthly_vnd", r."price_negotiable", r."area_m2", r."bedrooms", r."bathrooms",
               r."furnishing", r."province_id", r."ward_id", r."category_id", r."published_at", rl."title", rl."slug",
               CASE WHEN r."show_exact_address" THEN r."address" END AS "address"
        ${rentalFrom(locale)} ${where} ${rentalOrderBy(sort, "r")} LIMIT ${limit} OFFSET ${offset}
      )
      SELECT page.*, p."name" AS province_name, p."slug" AS province_slug, w."name" AS ward_name, w."slug" AS ward_slug,
             cat."name" AS category_name, cat."slug" AS category_slug,
             cover."url" AS thumbnail_url, cover."alt" AS thumbnail_alt
      FROM page
      JOIN "provinces" p ON p."id" = page."province_id"
      JOIN "wards" w ON w."id" = page."ward_id"
      LEFT JOIN LATERAL (
        SELECT cl."name", cl."slug"
        FROM "categories" c
        JOIN "categories_locales" cl ON cl."_parent_id" = c."id" AND cl."_locale" = ${locale}
        WHERE c."id" = page."category_id" AND c."deleted_at" IS NULL${englishCategory}
      ) cat ON true
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

/**
 * Hàng `GROUPING SETS` → số đếm. `GROUPING(col) = 0` nghĩa là hàng gom THEO cột đó; cả hai = 1 là hàng tổng. Tin không có danh mục (hoặc danh mục
 * xoá mềm) chỉ góp vào "Tất cả". Thuần để test được.
 */
export function toFacets(rows: readonly Record<string, unknown>[]): Omit<RentalListingFacets, "amenities"> {
  const facets: Omit<RentalListingFacets, "amenities"> = { category: { all: 0, counts: {} }, provinces: [] };
  for (const row of rows) {
    const byRoot = Number(row.by_root) === 0;
    const byProvince = Number(row.by_province) === 0;
    if (byRoot) {
      if (row.root_id) facets.category.counts[String(row.root_id)] = Number(row.without_category);
    } else if (byProvince) {
      if (row.province_id) facets.provinces.push({ provinceId: String(row.province_id), count: Number(row.without_province), total: Number(row.total) });
    } else {
      facets.category.all = Number(row.without_category);
    }
  }
  return facets;
}

/** Hàng `amenity`/`count` → đủ mọi tiện ích (thiếu = 0); giá trị ngoài `RENTAL_AMENITIES` (dữ liệu cũ) bị bỏ. Thuần để test được. */
export function toAmenityCounts(rows: readonly Record<string, unknown>[]): Record<RentalAmenity, number> {
  const counts = Object.fromEntries(RENTAL_AMENITIES.map((amenity) => [amenity, 0])) as Record<RentalAmenity, number>;
  for (const row of rows) {
    const amenity = String(row.amenity);
    if (Object.hasOwn(counts, amenity)) counts[amenity as RentalAmenity] = Number(row.count);
  }
  return counts;
}
