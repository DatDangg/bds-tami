import { sql } from "@payloadcms/db-postgres";

import { PUBLIC_STATUSES } from "../../access/publishedOnly";
import type { RentalSearchParams, RentalSort } from "../../shared/types/api";
import { normalizeSearchText } from "./normalize";

export type SqlFragment = ReturnType<typeof sql>;

/** Số từ tối đa của `q` được dùng để lọc: mỗi từ là một `LIKE` trên index trigram, chặn truy vấn quá tốn. */
const MAX_SEARCH_TERMS = 8;

/** Mệnh đề FROM chung cho đếm và lấy trang: bản ghi + dòng ngôn ngữ đang xem. */
export const rentalFrom = (locale: string): SqlFragment =>
  sql`FROM "rentals" r JOIN "rentals_locales" rl ON rl."_parent_id" = r."id" AND rl."_locale" = ${locale}`;

/** Thoát `\`, `%`, `_` để từ khoá người dùng nhập là chữ thường, không phải ký tự đại diện của `LIKE`. */
const escapeLike = (term: string): string => term.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Từ khoá chuẩn hoá giống `searchText` (ERD §6), tách theo khoảng trắng; mọi từ phải xuất hiện (AND). */
export function searchTerms(query: string | undefined): string[] {
  if (!query) return [];
  return normalizeSearchText(query).split(" ").filter(Boolean).slice(0, MAX_SEARCH_TERMS);
}

/** Danh mục theo slug của `locale` cùng danh mục con của nó (tối đa 2 cấp, ERD §4.3); chỉ tính danh mục scope `rental` chưa xoá mềm. */
function categoryCondition(slug: string, locale: string): SqlFragment {
  const matched = sql`SELECT cl."_parent_id" FROM "categories_locales" cl JOIN "categories" t ON t."id" = cl."_parent_id" AND t."scope" = 'rental' WHERE cl."_locale" = ${locale} AND cl."slug" = ${slug}`;
  return sql`r."category_id" IN (SELECT c."id" FROM "categories" c WHERE c."deleted_at" IS NULL AND c."scope" = 'rental' AND (c."id" IN (${matched}) OR c."parent_id" IN (${matched})))`;
}

/**
 * Điều kiện "khách thấy được" của tin cho thuê. PHẢI cùng nghĩa với `publicWhere("rentals", locale)`
 * (`src/lib/content/public-queries.ts`): cùng `PUBLIC_STATUSES.rentals`, chưa xoá mềm, `en` thì `hasEnglish`.
 * Test `rental-search.test.ts` đối chiếu hai bên; khi `buildPublicWhere` thêm điều kiện (hẹn giờ `publishedAt`) phải thêm vào đây.
 */
function publicConditions(locale: string): SqlFragment[] {
  const statuses = sql.join(PUBLIC_STATUSES.rentals.map((status) => sql`${status}`), sql`, `);
  const conditions = [sql`r."status" IN (${statuses})`, sql`r."deleted_at" IS NULL`];
  if (locale === "en") conditions.push(sql`r."has_english" = true`);
  return conditions;
}

/** Mệnh đề WHERE đầy đủ. Mọi giá trị người dùng đi qua tham số (`${}`), không có chuỗi nào được nối vào SQL. */
export function rentalWhere(params: RentalSearchParams): SqlFragment {
  const { locale } = params;
  const conditions = publicConditions(locale);
  for (const term of searchTerms(params.q)) conditions.push(sql`rl."search_text" LIKE ${`%${escapeLike(term)}%`}`);
  if (params.category) conditions.push(categoryCondition(params.category, locale));
  if (params.province) conditions.push(sql`r."province_id" IN (SELECT "id" FROM "provinces" WHERE "slug" = ${params.province})`);
  if (params.ward) conditions.push(sql`r."ward_id" IN (SELECT "id" FROM "wards" WHERE "slug" = ${params.ward})`);
  if (params.priceMin !== undefined) conditions.push(sql`r."price_monthly_vnd" >= ${params.priceMin}`);
  if (params.priceMax !== undefined) conditions.push(sql`r."price_monthly_vnd" <= ${params.priceMax}`);
  if (params.areaMin !== undefined) conditions.push(sql`r."area_m2" >= ${params.areaMin}`);
  if (params.areaMax !== undefined) conditions.push(sql`r."area_m2" <= ${params.areaMax}`);
  // `4` nghĩa là 4 phòng ngủ trở lên (API_SPEC §3.3).
  if (params.bedrooms !== undefined) {
    conditions.push(params.bedrooms >= 4 ? sql`r."bedrooms" >= 4` : sql`r."bedrooms" = ${params.bedrooms}`);
  }
  if (params.furnishing) conditions.push(sql`r."furnishing" = ${params.furnishing}`);
  return sql`WHERE ${sql.join(conditions, sql` AND `)}`;
}

/**
 * ORDER BY theo `sort` (giá trị đã kiểm bởi zod, chọn từ bảng cố định). Tin thương lượng không có giá nên xếp cuối ở cả hai chiều giá;
 * `id` chốt thứ tự để phân trang không lặp/sót. `alias` là hằng nội bộ ("r" hoặc "page"), không phải đầu vào người dùng.
 */
export function rentalOrderBy(sort: RentalSort, alias: "r" | "page"): SqlFragment {
  const col = (name: string) => sql.raw(`${alias}."${name}"`);
  const newest = sql`${col("published_at")} DESC NULLS LAST, ${col("id")} DESC`;
  if (sort === "price_asc") return sql`ORDER BY ${col("price_monthly_vnd")} ASC NULLS LAST, ${newest}`;
  if (sort === "price_desc") return sql`ORDER BY ${col("price_monthly_vnd")} DESC NULLS LAST, ${newest}`;
  return sql`ORDER BY ${newest}`;
}
