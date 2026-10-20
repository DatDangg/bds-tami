import type { RentalDetailView } from "./rental-view";

/**
 * Mã mục của thanh mục con trang chi tiết cho thuê, theo thứ tự hiển thị (design-spec S07, mockup `detail-rent`, BL-045 Q7). Ảnh lớn nằm đầu trang nên không có mục riêng.
 * `overview` = Tổng quan (mô tả căn), `details` = Thông tin chi tiết (thông số + điều kiện).
 */
export const RENTAL_SECTION_IDS = ["overview", "details", "amenities", "terms", "video", "location", "legal"] as const;
export type RentalSectionId = (typeof RENTAL_SECTION_IDS)[number];

/**
 * Mục có dữ liệu mới vào thanh mục con (cùng điều kiện với việc dựng khối trong `RentalDetail`). Thông tin chi tiết luôn có: nó chứa mã tin, diện tích,
 * phòng ngủ/WC... Tổng quan chỉ khi có mô tả.
 */
export function visibleRentalSections(
  view: Pick<RentalDetailView, "hasTerms" | "hasDescription" | "videoUrl" | "map" | "legalNote" | "amenities">,
): RentalSectionId[] {
  const present: Record<RentalSectionId, boolean> = {
    overview: view.hasDescription,
    details: true,
    amenities: view.amenities.length > 0,
    terms: view.hasTerms,
    video: view.videoUrl !== null,
    location: view.map !== null,
    legal: view.legalNote !== null,
  };
  return RENTAL_SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích của thanh mục con và neo `#...`), không dịch theo ngôn ngữ để link chia sẻ dùng được ở cả hai bản. */
export const RENTAL_SECTION_DOM_ID: Record<RentalSectionId, string> = {
  overview: "overview",
  details: "details",
  amenities: "amenities",
  terms: "terms",
  video: "video",
  location: "location",
  legal: "legal",
};
