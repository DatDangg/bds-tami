import type { Where } from "payload";

import { buildPublicWhere, PUBLIC_STATUSES } from "../../../access/publishedOnly";
import { ROLES } from "../../../access/roles";

/** Bốn loại nội dung có `status` + `author` mà thẻ "đang hiển thị / bản nháp / bài của tôi" đếm. */
export const COUNTED_CONTENT_SLUGS = ["projects", "rentals", "property-posts", "news"] as const;

/**
 * Lối tắt "Tạo mới": danh sách CỐ ĐỊNH (không lặp mọi collection, vì sale có quyền tạo "Lịch sử chăm sóc" — design N3),
 * rồi lọc theo quyền `create` của người đăng nhập.
 */
export const CREATE_SHORTCUT_SLUGS = ["projects", "rentals", "property-posts", "news", "job-postings", "services", "pages"] as const;

export type StatIconName = "lead" | "alert" | "progress" | "applicant" | "draft" | "visible";

export interface StatCountQuery {
  collection: string;
  where: Where;
}

export interface StatCardSpec {
  id: string;
  label: string;
  hint: string;
  icon: StatIconName;
  /** Cộng dồn các truy vấn `count`; người dùng phải có quyền `read` mọi collection trong đây thì thẻ mới hiện. */
  queries: StatCountQuery[];
  /** Danh sách lọc sẵn khi bấm thẻ; chỉ có khi thẻ đếm đúng một collection. */
  href?: string;
  /** Hiện huy hiệu "Cần giao" khi số > 0. */
  warnWhenPositive?: boolean;
}

interface Condition {
  field: string;
  operator: "equals" | "in" | "exists";
  value: string | string[] | boolean;
}

/** `/admin/collections/<slug>?where[and][i][field][op]=value` — định dạng admin Payload đọc để lọc sẵn danh sách. */
export function buildFilteredListHref(adminRoute: string, slug: string, conditions: Condition[]): string {
  const params = new URLSearchParams();
  conditions.forEach(({ field, operator, value }, index) => {
    const key = `where[and][${index}][${field}][${operator}]`;
    if (Array.isArray(value)) value.forEach((item, itemIndex) => params.append(`${key}[${itemIndex}]`, item));
    else params.append(key, String(value));
  });
  return `${adminRoute}/collections/${slug}?${params.toString()}`;
}

function publishedWhere(slug: string): Where {
  return buildPublicWhere(slug === "rentals" ? PUBLIC_STATUSES.rentals : PUBLIC_STATUSES.default);
}

/** Thẻ gộp 4 loại nội dung: mỗi loại một truy vấn `count`. `ownerId` rỗng = không lọc tác giả (admin). */
function contentQueries(whereFor: (slug: string) => Where, ownerId?: string): StatCountQuery[] {
  return COUNTED_CONTENT_SLUGS.map((collection) => {
    const base = whereFor(collection);
    return { collection, where: ownerId ? { and: [base, { author: { equals: ownerId } }] } : base };
  });
}

// `count` mặc định bỏ bản xoá mềm (chứng minh bằng test integration), nên không thêm điều kiện `deletedAt`.
const draftWhere = (): Where => ({ status: { equals: "draft" } });

function adminCards(adminRoute: string): StatCardSpec[] {
  const newLead: Condition = { field: "status", operator: "equals", value: "new" };
  return [
    {
      id: "leads-new",
      label: "Lead mới",
      hint: "Trạng thái Mới",
      icon: "lead",
      queries: [{ collection: "leads", where: { status: { equals: "new" } } }],
      href: buildFilteredListHref(adminRoute, "leads", [newLead]),
    },
    {
      id: "leads-unassigned",
      label: "Lead chưa phân công",
      hint: "Mới, chưa có người phụ trách",
      icon: "alert",
      queries: [{ collection: "leads", where: { and: [{ status: { equals: "new" } }, { assignedTo: { exists: false } }] } }],
      href: buildFilteredListHref(adminRoute, "leads", [newLead, { field: "assignedTo", operator: "exists", value: false }]),
      warnWhenPositive: true,
    },
    {
      id: "applications-new",
      label: "Hồ sơ ứng tuyển mới",
      hint: "Trạng thái Mới",
      icon: "applicant",
      queries: [{ collection: "job-applications", where: { status: { equals: "new" } } }],
      href: buildFilteredListHref(adminRoute, "job-applications", [newLead]),
    },
    {
      id: "content-visible",
      label: "Nội dung đang hiển thị",
      hint: "Dự án · cho thuê · tin BĐS · tin tức",
      icon: "visible",
      queries: contentQueries(publishedWhere),
    },
  ];
}

function saleCards(adminRoute: string, userId: string): StatCardSpec[] {
  return [
    {
      id: "leads-new",
      label: "Lead mới được giao",
      hint: "Trạng thái Mới",
      icon: "lead",
      // Quyền đọc `leads` của sale đã giới hạn ở lead giao cho mình; không thêm điều kiện `assignedTo` ở đây.
      queries: [{ collection: "leads", where: { status: { equals: "new" } } }],
      href: buildFilteredListHref(adminRoute, "leads", [{ field: "status", operator: "equals", value: "new" }]),
    },
    {
      id: "leads-processing",
      label: "Lead đang chăm sóc",
      hint: "Đã liên hệ + Đang tư vấn",
      icon: "progress",
      queries: [{ collection: "leads", where: { status: { in: ["contacted", "consulting"] } } }],
      href: buildFilteredListHref(adminRoute, "leads", [{ field: "status", operator: "in", value: ["contacted", "consulting"] }]),
    },
    {
      id: "drafts-mine",
      label: "Bản nháp của tôi",
      hint: "Chưa xuất bản",
      icon: "draft",
      // Sale đọc được mọi bài nội dung nên phải lọc tác giả rõ ràng (design N1).
      queries: contentQueries(draftWhere, userId),
    },
    {
      id: "content-visible",
      label: "Bài của tôi đang đăng",
      hint: "Dự án · cho thuê · tin BĐS · tin tức",
      icon: "visible",
      queries: contentQueries(publishedWhere, userId),
    },
  ];
}

/** Bộ thẻ theo vai trò (design §3.2, Q1). Vai trò ngoài admin được coi như sale (tập thẻ hẹp hơn = an toàn hơn). */
export function statCardSpecsFor(role: string | null | undefined, userId: string, adminRoute: string): StatCardSpec[] {
  return role === ROLES.admin ? adminCards(adminRoute) : saleCards(adminRoute, userId);
}
