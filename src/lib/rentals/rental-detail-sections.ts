import type { RentalDetailView } from "./rental-view";

/**
 * Mã mục (tab dính) của trang chi tiết cho thuê theo thứ tự hiển thị (BL-052 "Chi tiết Cho thuê", cùng khung chi tiết Dự án): Tổng quan (cạnh cột liên hệ) rồi các dải
 * Vị trí · Tiện ích · Hình ảnh · Điều khoản thuê · Pháp lý. Video là nút trên hero (không còn mục riêng); thông số chính nằm ở thanh thông số + lưới thông tin của Tổng quan.
 */
export const RENTAL_SECTION_IDS = ["overview", "location", "amenities", "gallery", "terms", "legal"] as const;
export type RentalSectionId = (typeof RENTAL_SECTION_IDS)[number];

/** Khối "Hình ảnh" chỉ khi có ≥ 2 ảnh: ảnh 1 đã là nền hero (cùng quy tắc chi tiết Dự án). */
const MIN_GALLERY_IMAGES = 2;

/**
 * Mục có dữ liệu mới vào thanh tab (cùng điều kiện với việc dựng khối trong `RentalDetail`). Tổng quan luôn có: lưới thông tin luôn có mã tin.
 * Vị trí chỉ khi có toạ độ được phép hiện (`map` — đã làm tròn khi ẩn địa chỉ chính xác).
 */
export function visibleRentalSections(
  view: Pick<RentalDetailView, "hasTerms" | "map" | "legalNote" | "amenities" | "gallery">,
): RentalSectionId[] {
  const present: Record<RentalSectionId, boolean> = {
    overview: true,
    location: view.map !== null,
    amenities: view.amenities.length > 0,
    gallery: view.gallery.length >= MIN_GALLERY_IMAGES,
    terms: view.hasTerms,
    legal: view.legalNote !== null,
  };
  return RENTAL_SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích của tab và neo `#...`), không dịch theo ngôn ngữ để link chia sẻ dùng được ở cả hai bản. */
export const RENTAL_SECTION_DOM_ID: Record<RentalSectionId, string> = {
  overview: "overview",
  location: "location",
  amenities: "amenities",
  gallery: "gallery",
  terms: "terms",
  legal: "legal",
};
