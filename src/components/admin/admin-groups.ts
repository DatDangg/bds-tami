import type { Config, Plugin } from "payload";

/**
 * Nhóm menu trái của admin theo nghiệp vụ (BL-015 T03, FR-ADM-19, design §2). Nguồn duy nhất cho tên nhóm,
 * thứ tự nhóm và thứ tự mục trong nhóm — dashboard (T04) dùng lại để dựng card nhóm.
 * Không có icon (Payload 3.91 không hỗ trợ icon nav qua config; chốt design Q4).
 * `private-files` và `lead-activities` vẫn khai báo ở đây nhưng `admin.hidden: true` nên không hiện trong menu (BL-041).
 */
/** Nhóm cuối của menu, mặc định thu gọn (NavAdvancedCollapse). */
export const ADVANCED_NAV_GROUP_LABEL = "Nâng cao";

export const ADMIN_NAV_GROUPS = [
  { label: "Khách hàng", collections: ["leads", "lead-activities", "newsletter-subscribers"], globals: [] },
  { label: "Nội dung", collections: ["projects", "rentals", "property-posts", "news", "services", "pages"], globals: [] },
  { label: "Tuyển dụng", collections: ["job-postings", "job-applications"], globals: [] },
  { label: "Thư viện", collections: ["media", "private-files"], globals: [] },
  { label: "Dữ liệu nền", collections: ["categories", "developers"], globals: [] },
  { label: "Website", collections: ["redirects"], globals: ["site-settings", "homepage", "header", "footer"] },
  { label: "Hệ thống", collections: ["staff"], globals: [] },
  // Mục kỹ thuật/hiếm dùng (BL-041): nhóm cuối, mặc định thu gọn (NavAdvancedCollapse).
  { label: ADVANCED_NAV_GROUP_LABEL, collections: ["provinces", "wards", "audit-logs", "click-events", "click-stats-daily", "news-views-daily", "translation-usage"], globals: [] },
] as const satisfies readonly { label: string; collections: readonly string[]; globals: readonly string[] }[];

export type AdminNavGroupLabel = (typeof ADMIN_NAV_GROUPS)[number]["label"];

type EntityKind = "collections" | "globals";

function navPosition(kind: EntityKind, slug: string): { group: AdminNavGroupLabel; index: number } | undefined {
  for (const [groupIndex, group] of ADMIN_NAV_GROUPS.entries()) {
    const itemIndex = (group[kind] as readonly string[]).indexOf(slug);
    if (itemIndex >= 0) return { group: group.label, index: groupIndex * 100 + itemIndex };
  }
  return undefined;
}

function assignGroupsAndSort<T extends { slug: string; admin?: { group?: unknown } }>(kind: EntityKind, entities: T[]): T[] {
  const placed = entities.map((entity) => {
    const position = navPosition(kind, entity.slug);
    if (!position) throw new Error(`Mục admin "${entity.slug}" chưa có trong ADMIN_NAV_GROUPS (src/components/admin/admin-groups.ts).`);
    return { entity: { ...entity, admin: { ...entity.admin, group: position.group } }, index: position.index };
  });
  return placed.sort((a, b) => a.index - b.index).map(({ entity }) => entity);
}

/**
 * Gán `admin.group` và sắp lại `collections`/`globals`. Phải là plugin đứng CUỐI: plugin redirects nối collection
 * `redirects` vào cuối mảng, nên sắp trong `buildConfig` không đủ. Payload tạo nhóm theo thứ tự xuất hiện đầu tiên của
 * `[...collections, ...globals]`, trong nhóm thì collection đứng trước global (không đổi được bằng config).
 * Chỉ đổi metadata hiển thị — không đụng schema/DB. Slug lạ -> throw để không có mục rơi vào nhóm mặc định.
 */
export const adminNavGroupsPlugin: Plugin = (config: Config): Config => ({
  ...config,
  collections: assignGroupsAndSort("collections", config.collections ?? []),
  globals: assignGroupsAndSort("globals", config.globals ?? []),
});
