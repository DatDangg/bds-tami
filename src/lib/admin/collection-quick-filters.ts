import type { BasePayload, TypedUser } from "payload";

import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES } from "../../collections/JobApplications";
import { SALES_STATUS_LABELS, SALES_STATUSES } from "../../collections/Projects";
import { startOfVietnamDay } from "../careers/deadline";
import { cond, type QuickFilterGroup } from "./quick-filters";

/** Tối đa chip danh mục trên một danh sách; nhiều hơn thì phần còn lại lọc qua "Lọc nâng cao". */
export const MAX_CATEGORY_CHIPS = 12;

type CategoryScope = "news" | "property_post";

/** `Nháp`/`Xuất bản`; trạng thái khác (ẩn, đã thuê...) chỉ thấy ở `Tất cả`. */
const POST_STATUS_GROUP: QuickFilterGroup = {
  id: "status",
  label: "Trạng thái bài",
  fields: ["status"],
  allLabel: "Tất cả",
  chips: [
    { key: "draft", label: "Nháp", conditions: [cond("status", "equals", "draft")] },
    { key: "published", label: "Xuất bản", conditions: [cond("status", "equals", "published")] },
  ],
};

const SALES_STATUS_GROUP: QuickFilterGroup = {
  id: "salesStatus",
  label: "Tình trạng mở bán",
  fields: ["salesStatus"],
  allLabel: "Tất cả",
  chips: SALES_STATUSES.map((value) => ({ key: value, label: SALES_STATUS_LABELS[value], conditions: [cond("salesStatus", "equals", value)] })),
};

const APPLICATION_STATUS_GROUP: QuickFilterGroup = {
  id: "status",
  label: "Trạng thái",
  fields: ["status"],
  allLabel: "Tất cả",
  chips: APPLICATION_STATUSES.map((value) => ({ key: value, label: APPLICATION_STATUS_LABELS[value], conditions: [cond("status", "equals", value)] })),
};

/**
 * Tuyển dụng: `Đang tuyển` = đã xuất bản và hạn chưa qua, `Hết hạn` = hạn đã qua (mọi trạng thái); cùng mốc đầu ngày giờ VN với danh sách công khai.
 * Cả hai chip thay `status` lẫn `deadline`. `deadline` bắt buộc nên không có nhánh "chưa có hạn". Mốc tính lúc render: qua ngày phải tải lại trang.
 */
export function jobPostingQuickFilterGroup(now: Date): QuickFilterGroup {
  const today = startOfVietnamDay(now).toISOString();
  return {
    id: "deadline",
    label: "Tình trạng",
    fields: ["status", "deadline"],
    allLabel: "Tất cả",
    chips: [
      { key: "open", label: "Đang tuyển", conditions: [cond("status", "equals", "published"), cond("deadline", "greater_than_equal", today)] },
      { key: "expired", label: "Hết hạn", conditions: [cond("deadline", "less_than", today)] },
    ],
  };
}

/** Nhóm "Danh mục": danh mục nào người xem đọc được (quyền người xem), sort `sortOrder`; không có → không có nhóm. Chip = `category equals <id>` (không gồm danh mục con). */
async function categoryQuickFilterGroup(payload: BasePayload, user: TypedUser | null | undefined, scope: CategoryScope): Promise<QuickFilterGroup | undefined> {
  let docs: Array<{ id: number | string; name?: string | null }>;
  try {
    ({ docs } = await payload.find({
      collection: "categories",
      where: { scope: { equals: scope } },
      sort: "sortOrder",
      limit: MAX_CATEGORY_CHIPS,
      pagination: false,
      depth: 0,
      locale: "vi",
      fallbackLocale: false,
      overrideAccess: false,
      user,
    }));
  } catch (error) {
    // Lỗi đọc danh mục không được làm vỡ trang danh sách: bỏ nhóm Danh mục, các chip khác vẫn dùng được.
    payload.logger.error({ err: error, msg: "Không tải được danh mục cho chip lọc nhanh" });
    return undefined;
  }
  if (docs.length === 0) return undefined;
  return {
    id: "category",
    label: "Danh mục",
    fields: ["category"],
    allLabel: "Tất cả",
    chips: docs.map((doc) => ({ key: String(doc.id), label: doc.name ?? String(doc.id), conditions: [cond("category", "equals", String(doc.id))] })),
  };
}

const withCategoryGroup = (category: QuickFilterGroup | undefined): QuickFilterGroup[] => (category ? [POST_STATUS_GROUP, category] : [POST_STATUS_GROUP]);

interface ResolveArgs {
  collectionSlug: string;
  payload: BasePayload;
  user?: TypedUser | null;
  now?: Date;
}

/** Nhóm chip lọc nhanh theo collection (BL-039); collection khác → mảng rỗng (slot không vẽ gì). */
export async function resolveCollectionQuickFilterGroups({ collectionSlug, payload, user, now = new Date() }: ResolveArgs): Promise<QuickFilterGroup[]> {
  switch (collectionSlug) {
    case "projects":
      return [SALES_STATUS_GROUP, POST_STATUS_GROUP];
    case "job-postings":
      return [jobPostingQuickFilterGroup(now)];
    case "job-applications":
      return [APPLICATION_STATUS_GROUP];
    case "news":
      return withCategoryGroup(await categoryQuickFilterGroup(payload, user, "news"));
    case "property-posts":
      return withCategoryGroup(await categoryQuickFilterGroup(payload, user, "property_post"));
    default:
      return [];
  }
}
