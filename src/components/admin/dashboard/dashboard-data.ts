import type { Payload, SanitizedPermissions, Where } from "payload";

import { hideFromNonAdmin } from "../../../access/hideFromNonAdmin";
import { ADMIN_COLLECTION_LABELS, ADMIN_GLOBAL_LABELS, type AdminCollectionSlug, type AdminGlobalSlug } from "../../../lib/admin/collection-labels";
import { COUNTED_CONTENT_SLUGS, CREATE_SHORTCUT_SLUGS, statCardSpecsFor, type StatCardSpec, type StatIconName } from "./dashboard-queries";

/** Người dùng admin đang xem trang; `collection` bắt buộc để Local API áp quyền như request thật. */
export interface DashboardUser {
  id: string;
  collection: "staff";
  role?: "admin" | "sale" | null;
  fullName?: string | null;
  email?: string | null;
}

export interface DashboardContext {
  payload: Payload;
  user: DashboardUser;
  permissions: SanitizedPermissions;
}

export interface StatCard extends Omit<StatCardSpec, "queries"> {
  count: number;
}

export interface Shortcut {
  slug: string;
  label: string;
  href: string;
}

/** Thẻ thao tác nhanh lớn ở đầu Tổng quan (BL-041). */
export interface QuickAction {
  id: "new-rental" | "assign-leads" | "new-news";
  label: string;
  href: string;
  icon: StatIconName | "plus";
}

export interface WebsiteShortcut {
  slug: AdminGlobalSlug;
  label: string;
  href: string;
}

export interface RecentLead {
  id: string;
  code: string;
  fullName: string;
  source: string;
  status: string;
  assigneeName: string | null;
  isAssigned: boolean;
  createdAt: string;
}

export interface RecentOwnDoc {
  key: string;
  collection: string;
  collectionLabel: string;
  title: string;
  status: string;
  updatedAt: string;
  href: string;
}

export interface DashboardData {
  stats: StatCard[];
  /** Ba thẻ thao tác nhanh (đã lọc theo quyền/vai trò). */
  quickActions: QuickAction[];
  /** "Tạo loại khác": các lối tắt tạo mới còn lại, ngoài các thẻ ở `quickActions`. */
  moreShortcuts: Shortcut[];
  /** Hàng "Sửa website": chỉ admin (rỗng với sale). */
  websiteShortcuts: WebsiteShortcut[];
  recentLeads: RecentLead[] | null;
  recentOwnDocs: RecentOwnDoc[] | null;
}

const RECENT_LIMIT = 5;

/**
 * `getAccessResults` trả `true` hoặc `{ permission: true, where }` khi access trả query constraint (vd sale đọc lead: chỉ lead giao cho mình).
 * Có ràng buộc `where` vẫn là CÓ quyền; `where` được Payload tự nối khi đếm/đọc với `overrideAccess:false`.
 */
function granted(permission: unknown): boolean {
  if (permission === true) return true;
  return typeof permission === "object" && permission !== null && (permission as { permission?: unknown }).permission === true;
}

const canRead = (permissions: SanitizedPermissions, slug: string): boolean => granted(permissions.collections?.[slug]?.read);
const singularOf = (slug: string): string => ADMIN_COLLECTION_LABELS[slug as AdminCollectionSlug]?.singular ?? slug;
const adminRouteOf = (payload: Payload): string => payload.config.routes.admin;

async function countAll(ctx: DashboardContext, queries: StatCardSpec["queries"]): Promise<number> {
  const counts = await Promise.all(
    queries.map(({ collection, where }) =>
      // overrideAccess:false + user: Payload nối thêm ràng buộc quyền đọc của collection vào `where`.
      ctx.payload.count({ collection: collection as "leads", where: where as Where, user: ctx.user, overrideAccess: false }),
    ),
  );
  return counts.reduce((sum, result) => sum + result.totalDocs, 0);
}

/** Chỉ đếm thẻ mà người dùng có quyền `read` MỌI collection của thẻ — không gọi `count` cho collection ngoài quyền. */
export async function loadStatCards(ctx: DashboardContext): Promise<StatCard[]> {
  const specs = statCardSpecsFor(ctx.user.role, ctx.user.id, adminRouteOf(ctx.payload));
  const allowed = specs.filter((spec) => spec.queries.every(({ collection }) => canRead(ctx.permissions, collection)));
  return Promise.all(
    allowed.map(async ({ queries, ...card }) => ({ ...card, count: await countAll(ctx, queries) })),
  );
}

export function buildShortcuts(ctx: DashboardContext): Shortcut[] {
  const adminRoute = adminRouteOf(ctx.payload);
  return CREATE_SHORTCUT_SLUGS.filter((slug) => granted(ctx.permissions.collections?.[slug]?.create)).map((slug) => ({
    slug,
    label: singularOf(slug),
    href: `${adminRoute}/collections/${slug}/create`,
  }));
}

type LeadDoc = {
  id: string;
  code?: string | null;
  fullName?: string | null;
  source?: string | null;
  status?: string | null;
  assignedTo?: string | { fullName?: string | null } | null;
  createdAt: string;
};

/** Lead mới nhất: `select` hẹp (không kéo SĐT/email/lời nhắn); sale chỉ thấy lead giao cho mình nhờ access của collection. */
export async function loadRecentLeads(ctx: DashboardContext): Promise<RecentLead[] | null> {
  if (!canRead(ctx.permissions, "leads")) return null;
  const result = await ctx.payload.find({
    collection: "leads",
    limit: RECENT_LIMIT,
    sort: "-createdAt",
    depth: 1,
    select: { code: true, fullName: true, source: true, status: true, assignedTo: true, createdAt: true },
    populate: { staff: { fullName: true } },
    user: ctx.user,
    overrideAccess: false,
  });
  return (result.docs as LeadDoc[]).map((doc) => ({
    id: doc.id,
    code: doc.code ?? "",
    fullName: doc.fullName ?? "",
    source: doc.source ?? "",
    status: doc.status ?? "",
    isAssigned: Boolean(doc.assignedTo),
    assigneeName: typeof doc.assignedTo === "object" && doc.assignedTo ? (doc.assignedTo.fullName ?? null) : null,
    createdAt: doc.createdAt,
  }));
}

type OwnDoc = { id: string; title?: string | null; status?: string | null; updatedAt: string };

/**
 * "Bài của bạn cập nhật gần đây": hệ thống không lưu người sửa cuối, nên nguồn thật duy nhất là bài mình LÀ TÁC GIẢ
 * (`author`), sắp theo `updatedAt`. 4 truy vấn `find limit 5` rồi gộp — rẻ, đúng quyền, cùng một nghĩa cho admin và sale.
 */
export async function loadRecentOwnDocs(ctx: DashboardContext): Promise<RecentOwnDoc[] | null> {
  const slugs = COUNTED_CONTENT_SLUGS.filter((slug) => canRead(ctx.permissions, slug));
  if (slugs.length === 0) return null;
  const adminRoute = adminRouteOf(ctx.payload);
  const perCollection = await Promise.all(
    slugs.map(async (slug) => {
      const result = await ctx.payload.find({
        collection: slug,
        where: { author: { equals: ctx.user.id } },
        limit: RECENT_LIMIT,
        sort: "-updatedAt",
        depth: 0,
        select: { title: true, status: true, updatedAt: true },
        user: ctx.user,
        overrideAccess: false,
      });
      return (result.docs as OwnDoc[]).map(
        (doc): RecentOwnDoc => ({
          key: `${slug}:${doc.id}`,
          collection: slug,
          collectionLabel: singularOf(slug),
          title: doc.title?.trim() || "(Chưa có tiêu đề)",
          status: doc.status ?? "",
          updatedAt: doc.updatedAt,
          href: `${adminRoute}/collections/${slug}/${doc.id}`,
        }),
      );
    }),
  );
  return perCollection.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, RECENT_LIMIT);
}

/** Thứ tự hàng "Sửa website" (nhãn lấy từ `ADMIN_GLOBAL_LABELS`). */
const WEBSITE_GLOBAL_SLUGS = ["homepage", "header", "footer", "site-settings"] as const satisfies readonly AdminGlobalSlug[];

/** Globals chỉ admin dùng: cùng quy tắc `admin.hidden` của Payload (`hideFromNonAdmin`), không tự viết quy tắc khác. */
export function buildWebsiteShortcuts(ctx: DashboardContext): WebsiteShortcut[] {
  if (hideFromNonAdmin({ user: ctx.user })) return [];
  const adminRoute = adminRouteOf(ctx.payload);
  return WEBSITE_GLOBAL_SLUGS.map((slug) => ({ slug, label: ADMIN_GLOBAL_LABELS[slug], href: `${adminRoute}/globals/${slug}` }));
}

const canCreate = (permissions: SanitizedPermissions, slug: string): boolean => granted(permissions.collections?.[slug]?.create);

/**
 * Thẻ thao tác nhanh: "Phân công lead" chỉ admin (chỉ admin gán `assignedTo`) và lấy số + link từ thẻ đếm "Lead chưa phân công"
 * có sẵn (`stats`) để dùng đúng một điều kiện "mới, chưa giao". Số 0 vẫn hiện thẻ ("0 chưa giao").
 */
export function buildQuickActions(ctx: DashboardContext, stats: StatCard[]): QuickAction[] {
  const adminRoute = adminRouteOf(ctx.payload);
  const unassigned = stats.find((card) => card.id === "leads-unassigned");
  const actions: Array<QuickAction | null> = [
    canCreate(ctx.permissions, "rentals")
      ? { id: "new-rental", label: "Đăng tin cho thuê mới", href: `${adminRoute}/collections/rentals/create`, icon: "plus" }
      : null,
    !hideFromNonAdmin({ user: ctx.user }) && unassigned?.href
      ? { id: "assign-leads", label: `Phân công lead (${unassigned.count} chưa giao)`, href: unassigned.href, icon: "lead" }
      : null,
    canCreate(ctx.permissions, "news")
      ? { id: "new-news", label: "Viết tin tức", href: `${adminRoute}/collections/news/create`, icon: "draft" }
      : null,
  ];
  return actions.filter((action): action is QuickAction => action !== null);
}

const QUICK_ACTION_SLUGS: readonly string[] = ["rentals", "news"];

export async function loadDashboardData(ctx: DashboardContext): Promise<DashboardData> {
  const [stats, recentLeads, recentOwnDocs] = await Promise.all([loadStatCards(ctx), loadRecentLeads(ctx), loadRecentOwnDocs(ctx)]);
  return {
    stats,
    quickActions: buildQuickActions(ctx, stats),
    moreShortcuts: buildShortcuts(ctx).filter((shortcut) => !QUICK_ACTION_SLUGS.includes(shortcut.slug)),
    websiteShortcuts: buildWebsiteShortcuts(ctx),
    recentLeads,
    recentOwnDocs,
  };
}
