import type { Access, CollectionConfig, Field } from "payload";

import { denyAll, isStaff, ROLES } from "../access";
import { guardManualActivity, isSystemActivity, stampActivityActor, touchLeadLastActivity } from "../hooks/leads/lead-activity-hooks";
import { LEAD_ACTIVITY_TYPES, LEAD_STATUSES, MANUAL_ACTIVITY_TYPES, type LeadActivityType } from "../lib/leads/lead-values";

const TYPE_LABELS: Record<LeadActivityType, string> = {
  note: "Ghi chú",
  call: "Cuộc gọi",
  status_change: "Đổi trạng thái",
  assignment: "Phân công",
  merged: "Gộp lead",
  email_sent: "Đã gửi email",
};

/** Sale chỉ thấy hoạt động của lead mình được giao (lọc ở tầng DB qua quan hệ `lead`). Lead người khác → danh sách rỗng / 404. */
const readOwnLeadActivities: Access = ({ req: { user } }) => {
  if (user?.active !== true) return false;
  if (user.role === ROLES.admin) return true;
  return user.role === ROLES.sale ? { "lead.assignedTo": { equals: user.id } } : false;
};

/**
 * Staff đang hoạt động được tạo. Admin UI dò quyền này không kèm dữ liệu form nên không kiểm theo `data` ở đây; "chỉ note/call"
 * và "sale chỉ lead được giao" nằm ở hook `guardManualActivity` (403).
 */
const addManualActivity: Access = ({ req }) => isStaff({ req });

const systemOnly = { create: denyAll, update: denyAll };
const readOnlyInAdmin = { readOnly: true } as const;

const fields: Field[] = [
  { name: "lead", type: "relationship", relationTo: "leads", required: true, index: true },
  {
    name: "type",
    type: "select",
    required: true,
    options: LEAD_ACTIVITY_TYPES.map((value) => ({ label: TYPE_LABELS[value], value })),
    // Mặc định "Ghi chú" để form admin thêm nhanh; hệ thống ghi các loại khác.
    defaultValue: "note",
    // Thu hẹp lựa chọn trên form admin; hệ thống ghi (cờ `asSystemActivity`) cần đủ loại để qua validate của select.
    filterOptions: ({ options, req }) =>
      isSystemActivity(req) ? options : options.filter((option) => MANUAL_ACTIVITY_TYPES.includes((typeof option === "string" ? option : option.value) as LeadActivityType)),
  },
  {
    name: "content",
    type: "textarea",
    maxLength: 2000,
    validate: (value: unknown, { data }: { data?: { type?: unknown } }) =>
      !MANUAL_ACTIVITY_TYPES.includes(data?.type as LeadActivityType) || (typeof value === "string" && value.trim() !== "") || "Nội dung là bắt buộc",
  },
  ...(["fromStatus", "toStatus"] as const).map(
    (name): Field => ({
      name,
      type: "select",
      options: LEAD_STATUSES.map((value) => ({ label: value, value })),
      access: systemOnly,
      admin: readOnlyInAdmin,
    }),
  ),
  ...(["fromAssignee", "toAssignee"] as const).map(
    (name): Field => ({ name, type: "relationship", relationTo: "staff", access: systemOnly, admin: readOnlyInAdmin }),
  ),
  // Luôn là người đang thao tác (hook `stampActivityActor`); trống = hệ thống.
  { name: "actor", type: "relationship", relationTo: "staff", index: true, access: systemOnly, admin: readOnlyInAdmin },
];

/**
 * Lịch sử chăm sóc lead (ERD §4.11, PERMISSION §3.3): chỉ thêm, không sửa, không xoá, kể cả admin. Người dùng chỉ thêm `note`/`call`;
 * `status_change`/`assignment`/`merged`/`email_sent` do hook/endpoint ghi bằng Local API. Dọn theo hạn lưu đi cùng việc ẩn danh lead.
 */
export const LeadActivities: CollectionConfig = {
  slug: "lead-activities",
  admin: { useAsTitle: "type", defaultColumns: ["lead", "type", "content", "actor", "createdAt"], hidden: ({ user }) => user?.active !== true },
  defaultSort: "-createdAt",
  access: { read: readOwnLeadActivities, create: addManualActivity, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  hooks: { beforeValidate: [guardManualActivity, stampActivityActor], afterChange: [touchLeadLastActivity] },
  fields,
};
