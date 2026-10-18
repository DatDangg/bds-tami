import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, FieldHook } from "payload";

import type { Lead } from "../../payload-types";
import { asSystemActivity } from "./lead-activity-hooks";

/**
 * Dấu thời gian do hệ thống ghi (access chặn client sửa, nên đọc `data` ở `beforeChange` là giá trị của hệ thống):
 * - `lastActivityAt` = lúc tạo, và mỗi lần `status` đổi (hoạt động ghi chú/gọi/phân công cập nhật ở hook của `lead-activities`);
 * - `firstContactedAt` = lần đầu `status` rời `new` (ERD §4.11); giữ nguyên các lần sau, kể cả khi quay lại `new`.
 */
export const stampLeadTimestamps: CollectionBeforeChangeHook<Lead> = ({ data, originalDoc, operation }) => {
  const now = new Date().toISOString();
  if (operation === "create") return { ...data, lastActivityAt: data.lastActivityAt ?? now };
  const statusChanged = data.status !== undefined && data.status !== originalDoc?.status;
  if (!statusChanged) return data;
  const firstContactedAt = originalDoc?.firstContactedAt ?? (originalDoc?.status === "new" ? now : undefined);
  return { ...data, lastActivityAt: now, ...(firstContactedAt ? { firstContactedAt } : {}) };
};

/**
 * Đổi `status` → đúng 1 activity `status_change` (ERD §4.11), cùng transaction với lần lưu lead (`req`): lưu lead lỗi thì
 * không còn activity mồ côi. `actor` = người đổi (trống nếu hệ thống). Không ghi PII vào activity, chỉ trạng thái và lý do.
 */
export const recordStatusChange: CollectionAfterChangeHook<Lead> = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || previousDoc.status === doc.status) return doc;
  await asSystemActivity(req, () =>
    req.payload.create({
      collection: "lead-activities",
      data: {
        lead: doc.id,
        type: "status_change",
        fromStatus: previousDoc.status,
        toStatus: doc.status,
        content: doc.status === "lost" ? doc.lostReason : undefined,
        actor: req.user?.collection === "staff" ? req.user.id : undefined,
      },
      req,
      overrideAccess: true,
      depth: 0,
    }),
  );
  return doc;
};

/**
 * Cờ "sale phụ trách đã bị khoá" (cột ảo, chỉ admin thấy, ERD §4.11 + FR-ADM-09). `assignedTo` có thể là id hoặc đã populate
 * tuỳ `depth`; kết quả tra cứu được nhớ trong `req.context` để danh sách nhiều lead cùng sale chỉ tốn 1 truy vấn.
 */
export const computeAssigneeInactive: FieldHook<Lead> = async ({ data, originalDoc, req }) => {
  if (req.user?.role !== "admin") return undefined;
  const assignee = (data ?? originalDoc)?.assignedTo;
  if (!assignee) return false;
  if (typeof assignee === "object") return assignee.active === false;
  const cache = (req.context.assigneeActive ??= new Map<string, boolean>()) as Map<string, boolean>;
  if (!cache.has(assignee)) {
    const staff = await req.payload.findByID({ collection: "staff", id: assignee, depth: 0, overrideAccess: true, req, disableErrors: true });
    cache.set(assignee, staff?.active !== false);
  }
  return cache.get(assignee) === false;
};
