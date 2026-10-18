import type { Payload, Where } from "payload";

import type { Locale } from "../../i18n/routing";
import type { Category, Province, Ward } from "../../payload-types";
import { findPublicList } from "../content/public-queries";
import { relationId } from "../payload/relation-id";
import { PostgresRentalSearch, sqlExecutorOf } from "../search/search-service";
import { type RentalFilters, toRentalSearchParams } from "../search/url-params";
import type { RentalSearchResult } from "../../shared/types/api";

/** Danh mục nền ít, tối đa 2 cấp (ERD §4.3). */
const CATEGORY_LIMIT = 100;
const CATEGORY_SORT = ["sortOrder", "createdAt"];
/** Một tỉnh có tối đa vài trăm phường/xã sau sáp nhập (TP.HCM ~168). */
const WARD_LIMIT = 500;

export interface CategoryOption {
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
}

const RENTAL_CATEGORY_SCOPE: Where = { scope: { equals: "rental" } };

/** Danh mục `rental` của ngôn ngữ đang xem, xếp cha rồi các con của nó; `/en` chỉ gồm danh mục đã có bản EN. Danh mục con mồ côi (cha ẩn ở ngôn ngữ này) bị bỏ. */
export async function listRentalCategoryOptions(payload: Payload, locale: Locale): Promise<CategoryOption[]> {
  const { docs } = await findPublicList<Category>(payload, "categories", locale, {
    where: RENTAL_CATEGORY_SCOPE,
    sort: CATEGORY_SORT,
    limit: CATEGORY_LIMIT,
    depth: 0,
  });
  const named = docs.filter((category) => category.slug && category.name);
  const toOption = (category: Category, depth: 0 | 1): CategoryOption => ({ slug: category.slug ?? "", label: category.name ?? "", depth });
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

export const toProvinceOptions = (provinces: Province[]): ProvinceOption[] =>
  provinces.map((province) => ({ id: province.id, slug: province.slug, name: province.shortName || province.name }));

/**
 * Bỏ slug danh mục/tỉnh/phường không tồn tại (link cũ, gõ bừa) để trang hiện danh sách không lọc thay vì "không có kết quả":
 * cùng cách `/du-an` xử lý slug lạ. Phường chỉ kiểm trong các phường của tỉnh đã chọn.
 */
export function dropUnknownSlugs(filters: RentalFilters, options: RentalFilterOptions): RentalFilters {
  const { category, province, ward, ...rest } = filters;
  const knownProvince = province !== undefined && options.provinces.some((item) => item.slug === province);
  const knownWard = knownProvince && ward !== undefined && options.wards.some((item) => item.slug === ward);
  return {
    ...rest,
    ...(category !== undefined && options.categories.some((item) => item.slug === category) ? { category } : {}),
    ...(knownProvince ? { province } : {}),
    ...(knownWard ? { ward } : {}),
  };
}

/** Kết quả trang S04 qua `SearchService` (một truy vấn SQL cho cả trang): chỉ tin còn trống, 12 tin/trang, ngôn ngữ đang xem. */
export function searchRentals(payload: Payload, filters: RentalFilters, locale: Locale): Promise<RentalSearchResult> {
  return new PostgresRentalSearch(sqlExecutorOf(payload)).search(toRentalSearchParams(filters, locale));
}
