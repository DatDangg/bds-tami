import type { CollectionConfig, GlobalConfig } from "payload";

/**
 * Nguồn duy nhất của nhãn tiếng Việt cho mọi collection/global trong admin (BL-015 T02, FR-ADM-19).
 * `COLLECTION_LABELS`/`GLOBAL_LABELS` ở `lib/translation/admin-ui.ts` lấy chuỗi từ đây nhưng chỉ giữ tập khoá có bản dịch
 * (banner dịch lỗi dùng tập khoá đó để truy vấn) — không gộp hai map làm một.
 */
export const ADMIN_COLLECTION_LABELS = {
  staff: { singular: "Nhân viên", plural: "Nhân viên" },
  media: { singular: "Ảnh, tệp", plural: "Thư viện ảnh & tệp" },
  "private-files": { singular: "Tệp CV", plural: "Tệp CV ứng viên" },
  "audit-logs": { singular: "Nhật ký thao tác", plural: "Nhật ký thao tác" },
  "click-events": { singular: "Lượt bấm liên hệ", plural: "Lượt bấm liên hệ" },
  "click-stats-daily": { singular: "Thống kê liên hệ theo ngày", plural: "Thống kê liên hệ theo ngày" },
  "translation-usage": { singular: "Chi phí dịch tự động", plural: "Chi phí dịch tự động" },
  categories: { singular: "Danh mục", plural: "Danh mục" },
  developers: { singular: "Chủ đầu tư", plural: "Chủ đầu tư" },
  provinces: { singular: "Tỉnh/thành", plural: "Tỉnh/thành" },
  wards: { singular: "Phường/xã", plural: "Phường/xã" },
  services: { singular: "Dịch vụ", plural: "Dịch vụ" },
  pages: { singular: "Trang pháp lý", plural: "Trang pháp lý" },
  news: { singular: "Tin tức", plural: "Tin tức" },
  projects: { singular: "Dự án", plural: "Dự án" },
  rentals: { singular: "Tin cho thuê", plural: "Cho thuê" },
  "property-posts": { singular: "Tin bất động sản", plural: "Tin bất động sản" },
  "job-postings": { singular: "Tin tuyển dụng", plural: "Tuyển dụng" },
  "job-applications": { singular: "Hồ sơ ứng tuyển", plural: "Hồ sơ ứng tuyển" },
  leads: { singular: "Lead", plural: "Lead" },
  "lead-activities": { singular: "Hoạt động chăm sóc", plural: "Lịch sử chăm sóc" },
  redirects: { singular: "Chuyển hướng", plural: "Chuyển hướng đường dẫn" },
} as const satisfies Record<string, NonNullable<CollectionConfig["labels"]>>;

export type AdminCollectionSlug = keyof typeof ADMIN_COLLECTION_LABELS;

export const ADMIN_GLOBAL_LABELS = {
  "site-settings": "Cấu hình chung",
  homepage: "Trang chủ",
  header: "Menu đầu trang",
  footer: "Chân trang",
} as const satisfies Record<string, NonNullable<GlobalConfig["label"]>>;

export type AdminGlobalSlug = keyof typeof ADMIN_GLOBAL_LABELS;

/** Giá trị `labels` cho `CollectionConfig`; dùng ở từng collection để không gõ lại chuỗi. */
export function collectionLabels(slug: AdminCollectionSlug): NonNullable<CollectionConfig["labels"]> {
  return ADMIN_COLLECTION_LABELS[slug];
}

/**
 * Tên tiếng Việt của một slug để hiện trong ô/mô tả admin (BL-043): collection → nhãn số ít, rồi global (nhật ký dịch lại
 * của global ghi mã global); slug lạ giữ nguyên, rỗng/không phải chuỗi → `—`.
 */
export function collectionDisplayName(slug: unknown): string {
  if (typeof slug !== "string" || slug === "") return "—";
  if (Object.hasOwn(ADMIN_COLLECTION_LABELS, slug)) return ADMIN_COLLECTION_LABELS[slug as AdminCollectionSlug].singular;
  if (Object.hasOwn(ADMIN_GLOBAL_LABELS, slug)) return ADMIN_GLOBAL_LABELS[slug as AdminGlobalSlug];
  return slug;
}
