import { Forbidden, type CollectionAfterChangeHook, type CollectionBeforeDeleteHook, type CollectionBeforeValidateHook, type PayloadRequest } from "payload";

import { isAdmin, isStaff } from "../../access";
import { MANUAL_ACTIVITY_TYPES, type LeadActivityType } from "../../lib/leads/lead-values";
import type { LeadActivity } from "../../payload-types";

/** Cờ trong `req.context`: hệ thống đang tự ghi activity (đổi status, phân công, gộp lead…), không phải người dùng thêm tay. */
const SYSTEM_ACTIVITY_FLAG = "systemActivity";

export const isSystemActivity = (req: PayloadRequest): boolean => req.context[SYSTEM_ACTIVITY_FLAG] === true;

/** Chạy `write` với cờ "hệ thống ghi"; luôn trả cờ về giá trị cũ sau đó để không rò sang lần ghi khác của cùng request. */
export async function asSystemActivity<T>(req: PayloadRequest, write: () => Promise<T>): Promise<T> {
  const previous = req.context[SYSTEM_ACTIVITY_FLAG];
  req.context[SYSTEM_ACTIVITY_FLAG] = true;
  try {
    return await write();
  } finally {
    req.context[SYSTEM_ACTIVITY_FLAG] = previous;
  }
}

/**
 * Người dùng (API/admin) chỉ thêm `note`/`call`, và sale chỉ trên lead được giao (đọc lead bằng quyền của chính họ, cùng transaction).
 * Kiểm ở hook chứ không ở access `create`: Payload dò quyền cho admin UI bằng access không kèm dữ liệu form, nên access phải
 * trả `true` cho staff. Hệ thống tự ghi thì bọc bằng `asSystemActivity`.
 */
export const guardManualActivity: CollectionBeforeValidateHook<LeadActivity> = async ({ data, operation, req }) => {
  if (operation !== "create" || isSystemActivity(req)) return data;
  if (!isStaff({ req }) || !MANUAL_ACTIVITY_TYPES.includes(data?.type as LeadActivityType)) throw new Forbidden(req.t);
  if (isAdmin({ req })) return data;
  const leadId: unknown = data?.lead;
  if (typeof leadId !== "string") throw new Forbidden(req.t);
  const lead = await req.payload.findByID({ collection: "leads", id: leadId, depth: 0, req, overrideAccess: false, disableErrors: true });
  if (!lead) throw new Forbidden(req.t);
  return data;
};

/**
 * Lịch sử phải ghi đúng người và đúng lúc (ERD §4.11): có người dùng trong request thì `actor` luôn là họ (không tin giá trị gửi
 * lên), và `createdAt`/`updatedAt` luôn do hệ thống đặt (Payload mặc định cho phép ghi đè lúc tạo). Hệ thống (không có user,
 * vd form công khai gộp lead) để trống `actor`.
 */
export const stampActivityActor: CollectionBeforeValidateHook<LeadActivity> = ({ data, operation, req }) => {
  if (!data || operation !== "create") return data;
  const trusted = { ...data };
  delete trusted.createdAt;
  delete trusted.updatedAt;
  return { ...trusted, actor: req.user?.collection === "staff" ? req.user.id : trusted.actor };
};

/**
 * Mỗi hoạt động mới đẩy `lastActivityAt` của lead (mốc tính hạn lưu 24 tháng, ERD §7). Cùng transaction với activity.
 * Bỏ qua `status_change`: lead tự đặt `lastActivityAt` khi đổi status (`stampLeadTimestamps`), không cần lưu lead lần hai.
 */
export const touchLeadLastActivity: CollectionAfterChangeHook<LeadActivity> = async ({ doc, operation, req }) => {
  if (operation !== "create" || doc.type === "status_change") return doc;
  const leadId = typeof doc.lead === "object" ? doc.lead.id : doc.lead;
  await req.payload.update({
    collection: "leads",
    id: leadId,
    data: { lastActivityAt: doc.createdAt },
    req,
    overrideAccess: true,
    depth: 0,
    trash: true,
  });
  return doc;
};

/**
 * Xoá hẳn lead (chỉ admin) thì xoá luôn lịch sử của nó, cùng transaction. Cột `lead_activities.lead_id` NOT NULL nhưng FK do
 * Payload sinh là `ON DELETE SET NULL` nên không dọn trước thì DB từ chối xoá lead. Là đường xoá duy nhất của `lead-activities`
 * (access `delete` luôn từ chối), nên lịch sử không bị xoá lẻ.
 */
export const purgeLeadActivities: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({ collection: "lead-activities", where: { lead: { equals: id } }, req, overrideAccess: true });
};
