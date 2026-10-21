/**
 * Danh sách cố định dùng chung cho schema (admin) lẫn bộ lọc / giao diện công khai (BL-052). Nhãn admin tiếng Việt ở đây;
 * nhãn công khai VI/EN ở i18n `listingOptions.propertyType` / `listingOptions.projectFeature`.
 */

/** Loại sản phẩm / loại hình bất động sản: `projects.productTypes`, `property-posts.propertyType`. */
export const PROPERTY_TYPES = ["apartment", "townhouse", "villa", "shophouse", "land", "resort", "condotel", "office"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_ADMIN_LABELS: Record<PropertyType, string> = {
  apartment: "Căn hộ",
  townhouse: "Nhà phố/Liền kề",
  villa: "Biệt thự",
  shophouse: "Shophouse",
  land: "Đất nền",
  resort: "Nghỉ dưỡng",
  condotel: "Condotel",
  office: "Văn phòng",
};

/** Tiện ích nổi bật của dự án dùng cho bộ lọc `/du-an`: `projects.featuredAmenities`. */
export const PROJECT_FEATURES = ["near_school", "near_hospital", "near_mall", "near_metro", "water_view", "pool_gym_spa", "green_park"] as const;
export type ProjectFeature = (typeof PROJECT_FEATURES)[number];

export const PROJECT_FEATURE_ADMIN_LABELS: Record<ProjectFeature, string> = {
  near_school: "Gần trường học",
  near_hospital: "Gần bệnh viện",
  near_mall: "Gần TTTM",
  near_metro: "Gần metro",
  water_view: "View sông/hồ",
  pool_gym_spa: "Hồ bơi, gym, spa",
  green_park: "Công viên cây xanh",
};
