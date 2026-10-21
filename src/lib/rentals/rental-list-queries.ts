import { cache } from "react";
import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, Province, Ward } from "../../payload-types";
import { findPublicBySlug, findPublicList } from "../content/public-queries";
import { relationId } from "../payload/relation-id";
import { projectOptionsQuery } from "../search/rental-search-sql";
import { PostgresRentalSearch, type RentalListingResult, sqlExecutorOf } from "../search/search-service";
import { type RentalFilters, toRentalSearchParams } from "../search/url-params";

/** Danh mục nền ít, tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 100;
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Một tỉnh có tối đa vài trăm phường/xã sau sáp nhập (TP.HCM ~168). */
const WARD_LIMIT = 500;

export interface CategoryOption {
  /** BL-052: khoá của số đếm tab (`RentalListingFacets.category` theo id danh mục cấp 1). */
  id: string;
  slug: string;
  label: string;
  /** 0 = cấp 1, 1 = danh mục con (hiện thụt vào trong ô chọn). */
  depth: 0 | 1;
}

export interface ProvinceOption {
  id: string;
  slug: string;
  name: string;
}

/** Ô "Dự án" (BL-052): dự án công khai có ≥ 1 tin cho thuê còn trống; `slug`/`title` theo ngôn ngữ đang xem. */
export interface ProjectOption {
  slug: string;
  title: string;
}

export interface WardOption {
  slug: string;
  name: string;
}

export interface RentalFilterOptions {
  categories: CategoryOption[];
  provinces: ProvinceOption[];
  /** Phường/xã của TỈNH đang chọn trên URL (rỗng khi chưa chọn tỉnh). */
  wards: WardOption[];
  /** Slug tỉnh mà `wards` thuộc về; bộ lọc chỉ phải tải lại phường khi người dùng đổi sang tỉnh khác. */
  wardsProvince: string | null;
  /** BL-052: dự án cho ô "Dự án" (tham số `project`). */
  projects: ProjectOption[];
}

const RENTAL_CATEGORY_SCOPE: Where = { scope: { equals: "rental" } };

/**
 * Danh mục `rental` theo slug của ngôn ngữ đang xem (S05); `parent` đã populate. Không có / xoá mềm / chưa có bản EN ở `/en` → `null`.
 * `cache()` để trang và `generateMetadata` của cùng một request dùng chung một truy vấn.
 */
export const findRentalCategory = cache((payload: Payload, locale: Locale, slug: string): Promise<Category | null> => {
  return findPublicBySlug<Category>(payload, "categories", locale, slug, { where: RENTAL_CATEGORY_SCOPE, depth: 1 });
});

/** Danh mục `rental` của ngôn ngữ đang xem, xếp cha rồi các con của nó; `/en` chỉ gồm danh mục đã có bản EN. Danh mục con mồ côi (cha ẩn ở ngôn ngữ này) bị bỏ. */
export async function listRentalCategoryOptions(payload: Payload, locale: Locale): Promise<CategoryOption[]> {
  const { docs } = await findPublicList<Category>(payload, "categories", locale, {
    where: RENTAL_CATEGORY_SCOPE,
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
  const named = docs.filter((category) => category.slug && category.name);
  const toOption = (category: Category, depth: 0 | 1): CategoryOption => ({ id: category.id, slug: category.slug ?? "", label: category.name ?? "", depth });
  return named
    .filter((category) => !relationId(category.parent))
    .flatMap((root) => [toOption(root, 0), ...named.filter((child) => relationId(child.parent) === root.id).map((child) => toOption(child, 1))]);
}

/** Phường/xã của một tỉnh theo tên. Danh mục tĩnh công khai nên đọc như khách. */
export async function listWardOptions(payload: Payload, provinceId: string): Promise<WardOption[]> {
  const { docs } = await payload.find({
    collection: "wards",
    where: { province: { equals: provinceId } },
    sort: "name",
    limit: WARD_LIMIT,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { name: true, slug: true },
  });
  return (docs as Array<Pick<Ward, "name" | "slug">>).map((ward) => ({ slug: ward.slug, name: ward.name }));
}

/**
 * Dự án cho ô "Dự án" của `/cho-thue` (BL-052): dự án công khai (ở `/en`: có bản EN) có ≥ 1 tin cho thuê công khai còn trống — chọn dự án nào cũng có kết quả
 * khi chưa lọc gì khác. Một truy vấn SQL, theo tên.
 */
export async function listRentalProjectOptions(payload: Payload, locale: Locale): Promise<ProjectOption[]> {
  const { rows } = await sqlExecutorOf(payload).execute(projectOptionsQuery(locale));
  return rows.map((row) => ({ slug: String(row.slug), title: String(row.title) }));
}

export const toProvinceOptions = (provinces: Province[]): ProvinceOption[] =>
  provinces.map((province) => ({ id: province.id, slug: province.slug, name: province.shortName || province.name }));

/**
 * Bỏ slug danh mục/tỉnh/phường/dự án không tồn tại (link cũ, gõ bừa) để trang hiện danh sách không lọc thay vì "không có kết quả":
 * cùng cách `/du-an` xử lý slug lạ. Phường chỉ kiểm trong các phường của tỉnh đã chọn.
 */
export function dropUnknownSlugs(filters: RentalFilters, options: RentalFilterOptions): RentalFilters {
  const { category, province, ward, project, ...rest } = filters;
  const knownProvince = province !== undefined && options.provinces.some((item) => item.slug === province);
  const knownWard = knownProvince && ward !== undefined && options.wards.some((item) => item.slug === ward);
  return {
    ...rest,
    ...(category !== undefined && options.categories.some((item) => item.slug === category) ? { category } : {}),
    ...(knownProvince ? { province } : {}),
    ...(knownWard ? { ward } : {}),
    ...(project !== undefined && options.projects.some((item) => item.slug === project) ? { project } : {}),
  };
}

/** Một dòng tỉnh có số đếm (ô "Tỉnh/thành" BL-052): chỉ tỉnh có ≥ 1 tin công khai còn trống. */
export interface RentalProvinceFacet extends ProvinceOption {
  /** Khớp mọi bộ lọc khác trừ tỉnh/phường. */
  count: number;
}

/**
 * Tỉnh có tin (từ `facets.provinces`) kèm tên/slug của `provinces` (danh mục tỉnh đã tải, theo `sortOrder`): sắp theo số tin không lọc giảm dần, hoà theo
 * thứ tự của `provinces` (cùng quy ước `/du-an`). Tỉnh không có trong `provinces` bị bỏ.
 */
export function toRentalProvinceFacets(provinces: readonly ProvinceOption[], counts: RentalListingResult["facets"]["provinces"]): RentalProvinceFacet[] {
  const position = new Map(provinces.map((province, index) => [province.id, { province, index }] as const));
  return counts
    .flatMap((entry) => {
      const known = position.get(entry.provinceId);
      return known && entry.total > 0 ? [{ ...known, count: entry.count, total: entry.total }] : [];
    })
    .sort((a, b) => b.total - a.total || a.index - b.index)
    .map(({ province, count }) => ({ ...province, count }));
}

/**
 * Trang danh sách `/cho-thue` (BL-052): một trang lưới (đã bỏ tin nổi bật) + ≤ 5 tin nổi bật (trang 1) + số đếm tab danh mục / tỉnh. Chỉ tin còn trống,
 * 12 tin/trang, ngôn ngữ đang xem. Xem `PostgresRentalSearch.listing`.
 */
export function listRentals(payload: Payload, filters: RentalFilters, locale: Locale): Promise<RentalListingResult> {
  return new PostgresRentalSearch(sqlExecutorOf(payload)).listing(toRentalSearchParams(filters, locale));
}
