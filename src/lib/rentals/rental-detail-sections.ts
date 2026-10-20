import type { RentalDetailView } from "./rental-view";

/** Mã mục của thanh mục con trang chi tiết cho thuê, theo thứ tự hiển thị (design-spec S07). Thư viện ảnh nằm đầu trang nên không có mục riêng. */
export const RENTAL_SECTION_IDS = ["overview", "terms", "description", "video", "location", "legal"] as const;
export type RentalSectionId = (typeof RENTAL_SECTION_IDS)[number];

/**
 * Mục có dữ liệu mới vào thanh mục con (cùng điều kiện với việc dựng khối trong `RentalDetail`). Tổng quan luôn có: nó chứa tiêu đề tin,
 * thông số chính và chi tiết.
 */
export function visibleRentalSections(view: Pick<RentalDetailView, "hasTerms" | "hasDescription" | "videoUrl" | "map" | "legalNote">): RentalSectionId[] {
  const present: Record<RentalSectionId, boolean> = {
    overview: true,
    terms: view.hasTerms,
    description: view.hasDescription,
    video: view.videoUrl !== null,
    location: view.map !== null,
    legal: view.legalNote !== null,
  };
  return RENTAL_SECTION_IDS.filter((id) => present[id]);
}

/** `id` phần tử của từng mục (đích của thanh mục con và neo `#...`), không dịch theo ngôn ngữ để link chia sẻ dùng được ở cả hai bản. */
export const RENTAL_SECTION_DOM_ID: Record<RentalSectionId, string> = {
  overview: "overview",
  terms: "terms",
  description: "description",
  video: "video",
  location: "location",
  legal: "legal",
};
