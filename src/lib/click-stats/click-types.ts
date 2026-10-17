/** Loại nút liên hệ nổi được ghi lượt bấm (ERD §4.13, API_SPEC §3.4). */
export const CLICK_TYPES = ["hotline", "zalo", "fanpage"] as const;

export type ClickType = (typeof CLICK_TYPES)[number];

/**
 * Collection mà một lượt bấm được phép gắn vào (ERD §3: nhóm danh mục nền + nội dung). Giới hạn để endpoint công khai
 * không sinh dòng rác (collection bịa, collection hệ thống) trong `click-stats-daily`.
 */
export const CLICK_REF_COLLECTIONS = [
  "provinces",
  "wards",
  "categories",
  "developers",
  "projects",
  "rentals",
  "property-posts",
  "news",
  "services",
  "job-postings",
  "pages",
] as const;

export type ClickRefCollection = (typeof CLICK_REF_COLLECTIONS)[number];
