import type { CollectionSlug } from "payload";

export const CATEGORY_SCOPES = ["rental", "property_post", "news", "project", "job"] as const;
export type CategoryScope = (typeof CATEGORY_SCOPES)[number];

/** Nhãn hiển thị của scope trong admin. */
export const CATEGORY_SCOPE_LABELS: Record<CategoryScope, string> = {
  rental: "Cho thuê",
  property_post: "Tin bất động sản",
  news: "Tin tức",
  project: "Dự án",
  job: "Tuyển dụng",
};

/**
 * Scope → collection nội dung dùng danh mục đó (ERD §2, §4.5-§4.10); mọi collection lưu danh mục ở trường
 * `category`. Collection chưa tồn tại trong config (task nội dung chưa làm) thì guard bỏ qua. Task của từng
 * collection nội dung thêm test chặn xoá cho collection của mình (task layer-4-task-01, AC 6).
 */
export const CATEGORY_SCOPE_COLLECTIONS: Record<CategoryScope, { collection: string; field: string }> = {
  rental: { collection: "rentals", field: "category" },
  property_post: { collection: "property-posts", field: "category" },
  news: { collection: "news", field: "category" },
  project: { collection: "projects", field: "category" },
  job: { collection: "job-postings", field: "category" },
};

export const asCollectionSlug = (slug: string) => slug as CollectionSlug;
