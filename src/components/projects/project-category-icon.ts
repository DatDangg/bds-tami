import { BuildingApartment, BuildingOffice, Buildings, City, HouseLine, Island, MapTrifold, Storefront } from "@/components/icons";
import type { ListingTabIcon } from "@/components/listing/ListingCategoryTabs";

/**
 * Icon tab danh mục `/du-an` (BL-052): danh mục không có trường icon nên đoán theo slug (cả slug VI lẫn EN) — khớp từ khoá đầu tiên,
 * không khớp → `Buildings` (icon chung, cũng là icon "Tất cả"). Thêm danh mục mới tên lạ chỉ rơi về icon chung, không vỡ.
 * Khớp theo ĐOẠN slug (giữa các dấu `-`), không theo chuỗi con: "shophouse" không rơi vào "house", "island" không rơi vào "land". Đoạn EN số nhiều (`apartments`) bỏ `s` cuối.
 */
const ICON_BY_KEYWORD: readonly (readonly [readonly string[], ListingTabIcon])[] = [
  [["can-ho", "chung-cu", "apartment", "condo"], BuildingApartment],
  [["do-thi", "urban", "township"], City],
  [["nha-pho", "biet-thu", "lien-ke", "villa", "townhouse", "house"], HouseLine],
  [["nghi-duong", "resort"], Island],
  [["dat-nen", "land"], MapTrifold],
  [["shophouse", "thuong-mai", "commercial"], Storefront],
  [["van-phong", "office"], BuildingOffice],
];

export function projectCategoryIcon(slug: string | null | undefined): ListingTabIcon {
  const segments = (slug ?? "").toLowerCase().split("-").map((segment) => (segment.length > 3 && segment.endsWith("s") ? segment.slice(0, -1) : segment));
  const value = `-${segments.join("-")}-`;
  return ICON_BY_KEYWORD.find(([keywords]) => keywords.some((keyword) => value.includes(`-${keyword}-`)))?.[1] ?? Buildings;
}
