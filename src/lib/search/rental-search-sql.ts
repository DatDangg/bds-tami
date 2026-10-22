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
export const escapeLike = (term: string): string => term.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Từ khoá chuẩn hoá giống `searchText` (ERD §6), tách theo khoảng trắng; mọi từ phải xuất hiện (AND). */
export function searchTerms(query: string | undefined): string[] {
  if (!query) return [];
  return normalizeSearchText(query).split(" ").filter(Boolean).slice(0, MAX_SEARCH_TERMS);
}

/** Danh mục theo slug của `locale` cùng danh mục con của nó (tối đa 2 cấp, ERD §4.3); chỉ tính danh mục scope `rental` chưa xoá mềm. */
function categoryCondition(slug: string, locale: string): SqlFragment {
  const matched = sql`SELECT cl."_parent_id" FROM "categories_locales" cl JOIN "categories" t ON t."id" = cl."_parent_id" AND t."scope" = 'rental' AND t."deleted_at" IS NULL WHERE cl."_locale" = ${locale} AND cl."slug" = ${slug}`;
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

/** Phường theo slug TRONG tỉnh đã chọn: slug phường chỉ duy nhất trong tỉnh (ERD §4.2). Không có `province` thì `ward` bị schema API từ chối. */
function wardCondition(ward: string, province: string | undefined): SqlFragment {
  if (province === undefined) return sql`r."ward_id" IN (SELECT "id" FROM "wards" WHERE "slug" = ${ward})`;
  return sql`r."ward_id" IN (SELECT w."id" FROM "wards" w JOIN "provinces" p ON p."id" = w."province_id" WHERE w."slug" = ${ward} AND p."slug" = ${province})`;
}

/** Dự án (bí danh `p`) khách thấy được: cùng nghĩa `publicWhere("projects", locale)` — `published`, chưa xoá mềm, `en` thì `hasEnglish`. */
function publicProjectConditions(locale: string): SqlFragment {
  const statuses = sql.join(PUBLIC_STATUSES.default.map((status) => sql`${status}`), sql`, `);
  const english = locale === "en" ? sql` AND p."has_english" = true` : sql``;
  return sql`p."status" IN (${statuses}) AND p."deleted_at" IS NULL${english}`;
}

/** Tin thuộc dự án CÔNG KHAI có slug (theo `locale`) này; slug không có / dự án chưa công khai → không tin nào khớp. */
function projectCondition(slug: string, locale: string): SqlFragment {
  return sql`r."project_id" IN (SELECT pl."_parent_id" FROM "projects_locales" pl JOIN "projects" p ON p."id" = pl."_parent_id" WHERE pl."_locale" = ${locale} AND pl."slug" = ${slug} AND ${publicProjectConditions(locale)})`;
}

/** Phạm vi tin được liệt kê: công khai; `available` (trang danh sách S04) thì chỉ tin còn trống — tin đã thuê chỉ truy cập bằng URL. */
function scopeConditions(locale: string, available: boolean | undefined): SqlFragment[] {
  const conditions = publicConditions(locale);
  if (available) conditions.push(sql`r."status" = 'published'`);
  return conditions;
}

/**
 * Ô "Dự án" của `/cho-thue` (BL-052): slug + tên (theo `locale`) của dự án công khai có ≥ 1 tin cho thuê công khai CÒN TRỐNG (cùng phạm vi trang danh sách),
 * theo tên. Dự án thiếu slug/tên ở ngôn ngữ này bị bỏ.
 */
export function projectOptionsQuery(locale: string): SqlFragment {
  return sql`SELECT pl."slug", pl."title" FROM "projects" p JOIN "projects_locales" pl ON pl."_parent_id" = p."id" AND pl."_locale" = ${locale}
    WHERE ${publicProjectConditions(locale)} AND COALESCE(pl."slug", '') <> '' AND COALESCE(pl."title", '') <> ''
      AND EXISTS (SELECT 1 ${rentalFrom(locale)} WHERE r."project_id" = p."id" AND ${allOf(scopeConditions(locale, true))})
    ORDER BY pl."title", p."id"`;
}

/** Chiều lọc có số đếm riêng trên trang danh sách (BL-052): khi đếm một chiều, điều kiện của CHÍNH chiều đó bị bỏ. */
export type RentalFacetDimension = "category" | "province" | "amenity";

/**
 * Điều kiện tìm kiếm tách nhóm: `scope` = phạm vi tin được liệt kê (công khai + `available`, không phải "bộ lọc" nên không bao giờ bị bỏ khi đếm);
 * `byDimension` = điều kiện của chiều có số đếm (`province` gồm cả `ward`: phường chỉ có nghĩa trong tỉnh; `amenity` = mọi tiện ích đang chọn, bỏ cả cụm
 * khi đếm tiện ích — cùng quy tắc ô Tiện ích `/du-an`); `other` = mọi bộ lọc còn lại.
 */
export interface RentalConditions {
  scope: SqlFragment[];
  byDimension: Record<RentalFacetDimension, SqlFragment[]>;
  other: SqlFragment[];
}

/** Mọi giá trị người dùng đi qua tham số (`${}`), không có chuỗi nào được nối vào SQL. */
export function rentalConditions(params: RentalSearchParams): RentalConditions {
  const { locale } = params;
  const scope = scopeConditions(locale, params.available);
  const category = params.category ? [categoryCondition(params.category, locale)] : [];
  const province: SqlFragment[] = [];
  if (params.province) province.push(sql`r."province_id" IN (SELECT "id" FROM "provinces" WHERE "slug" = ${params.province})`);
  if (params.ward) province.push(wardCondition(params.ward, params.province));
  const other: SqlFragment[] = [];
  for (const term of searchTerms(params.q)) other.push(sql`rl."search_text" LIKE ${`%${escapeLike(term)}%`}`);
  if (params.project) other.push(projectCondition(params.project, locale));
  if (params.priceMin !== undefined) other.push(sql`r."price_monthly_vnd" >= ${params.priceMin}`);
  if (params.priceMax !== undefined) other.push(sql`r."price_monthly_vnd" <= ${params.priceMax}`);
  if (params.areaMin !== undefined) other.push(sql`r."area_m2" >= ${params.areaMin}`);
  if (params.areaMax !== undefined) other.push(sql`r."area_m2" <= ${params.areaMax}`);
  // `4` nghĩa là 4 phòng ngủ trở lên (API_SPEC §3.3).
  if (params.bedrooms !== undefined) {
    other.push(params.bedrooms >= 4 ? sql`r."bedrooms" >= 4` : sql`r."bedrooms" = ${params.bedrooms}`);
  }
  if (params.furnishing) other.push(sql`r."furnishing" = ${params.furnishing}`);
  // Tin phải có ĐỦ mọi tiện ích (AND): mỗi tiện ích một EXISTS trên bảng hasMany `rentals_amenities` (cột `parent_id`/`value`, index `parent_id` do Payload tạo).
  const amenity = (params.amenities ?? []).map((value) => sql`EXISTS (SELECT 1 FROM "rentals_amenities" ra WHERE ra."parent_id" = r."id" AND ra."value" = ${value})`);
  return { scope, byDimension: { category, province, amenity }, other };
}

/** Bộ lọc (không gồm `scope`) trừ chiều `except`; không chiều nào bị bỏ khi `except` không truyền. */
export function filterConditions(conditions: RentalConditions, except?: RentalFacetDimension): SqlFragment[] {
  const dimensions = (Object.keys(conditions.byDimension) as RentalFacetDimension[]).filter((dimension) => dimension !== except);
  return [...dimensions.flatMap((dimension) => conditions.byDimension[dimension]), ...conditions.other];
}

/** Nối điều kiện bằng AND; rỗng → `true` (dùng được trong `FILTER (WHERE …)`). */
export const allOf = (conditions: readonly SqlFragment[]): SqlFragment => (conditions.length > 0 ? sql.join([...conditions], sql` AND `) : sql`true`);

/** Mệnh đề WHERE đầy đủ (phạm vi + mọi bộ lọc). */
export function rentalWhere(params: RentalSearchParams): SqlFragment {
  const conditions = rentalConditions(params);
  return sql`WHERE ${allOf([...conditions.scope, ...filterConditions(conditions)])}`;
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
