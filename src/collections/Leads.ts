import type { CollectionConfig, Field, FieldAccess, TextField } from "payload";

import { denyAll, isAdmin, isAssignedOrAdmin, ROLES } from "../access";
import { auditContentPurge, auditContentTrash } from "../hooks/audit-content-delete";
import { guardTrashedEdit } from "../hooks/guard-trashed-edit";
import { assignLeadCode } from "../hooks/leads/generate-code";
import { purgeLeadActivities } from "../hooks/leads/lead-activity-hooks";
import { computeAssigneeInactive, recordStatusChange, stampLeadTimestamps } from "../hooks/leads/status-activity";
import { guardAnonymizedCustomerData, syncPhoneNormalized, validatePhone } from "../hooks/leads/sync-phone-normalized";
import { LEAD_LOCALES, LEAD_SOURCES, LEAD_STATUSES, type LeadSource, type LeadStatus } from "../lib/leads/lead-values";

const SOURCE_LABELS: Record<LeadSource, string> = { rental: "Tin cho thuê", property_post: "Đăng tin BĐS", project: "Dự án", contact: "Liên hệ" };
const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  consulting: "Đang tư vấn",
  won: "Đã chốt",
  lost: "Không thành",
  spam: "Spam",
};

/**
 * Dữ liệu khách gửi (PERMISSION §4): sale chỉ đọc, admin sửa được (vd sửa lỗi gõ). Tạo chỉ qua Local API của endpoint công khai
 * (`overrideAccess`, bỏ qua access trường), vì `create` của collection là `denyAll`.
 */
const customerFieldAccess = { update: isAdmin };
/** Dấu và khoá do hệ thống ghi (hook hoặc endpoint công khai bằng Local API): không ai sửa qua API, kể cả admin. */
const systemFieldAccess = { create: denyAll, update: denyAll };
const readOnlyInAdmin = { readOnly: true } as const;
const dateTimeInAdmin = { pickerAppearance: "dayAndTime" } as const;

/** Chỉ admin xem (dấu vết kỹ thuật của form). `ipHash` thì không ai xem qua API, như `job-applications`. */
const adminOnlyRead: FieldAccess = ({ req }) => req.user?.role === ROLES.admin && req.user.active === true;

const selectOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((value) => ({ label: labels[value], value }));

const codeField: TextField = {
  name: "code",
  type: "text",
  required: true,
  unique: true,
  access: systemFieldAccess,
  admin: { readOnly: true, position: "sidebar" },
};

const sourceFields: Field[] = [
  {
    name: "source",
    type: "select",
    required: true,
    index: true,
    options: selectOptions(LEAD_SOURCES, SOURCE_LABELS),
    access: systemFieldAccess,
    admin: { ...readOnlyInAdmin, position: "sidebar" },
  },
  { name: "rental", type: "relationship", relationTo: "rentals", index: true, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "propertyPost", type: "relationship", relationTo: "property-posts", index: true, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "project", type: "relationship", relationTo: "projects", index: true, access: systemFieldAccess, admin: readOnlyInAdmin },
];

const customerFields: Field[] = [
  { name: "fullName", type: "text", required: true, maxLength: 120, access: customerFieldAccess },
  { name: "phone", type: "text", required: true, maxLength: 20, validate: validatePhone, access: customerFieldAccess },
  // Suy ra từ `phone` bởi hook `syncPhoneNormalized`; index đơn cho tra cứu, index tổng hợp (DESC) tạo trong migration.
  { name: "phoneNormalized", type: "text", required: true, index: true, access: systemFieldAccess, admin: { ...readOnlyInAdmin, hidden: true } },
  { name: "email", type: "email", access: customerFieldAccess },
  { name: "message", type: "textarea", maxLength: 2000, access: customerFieldAccess },
  {
    name: "locale",
    type: "select",
    required: true,
    index: true,
    options: LEAD_LOCALES.map((value) => ({ label: value === "vi" ? "Tiếng Việt" : "English", value })),
    access: customerFieldAccess,
  },
];

const statusFields: Field[] = [
  {
    name: "status",
    type: "select",
    required: true,
    index: true,
    defaultValue: "new",
    options: selectOptions(LEAD_STATUSES, STATUS_LABELS),
    admin: { position: "sidebar" },
  },
  {
    name: "lostReason",
    type: "textarea",
    maxLength: 1000,
    // BR-11: chuyển `lost` bắt buộc có lý do (khoảng trắng không tính).
    validate: (value: unknown, { data }: { data?: { status?: unknown } }) =>
      data?.status !== "lost" || (typeof value === "string" && value.trim() !== "") || "Chuyển sang Không thành phải nhập lý do",
    admin: { condition: (data) => data?.status === "lost" },
  },
];

const assignmentFields: Field[] = [
  // Chỉ admin đổi (PERMISSION §4); hoạt động/email/audit khi đổi người phụ trách do task phân công làm (design D6).
  { name: "assignedTo", type: "relationship", relationTo: "staff", index: true, access: { create: isAdmin, update: isAdmin }, admin: { position: "sidebar" } },
  { name: "assignedAt", type: "date", access: { create: isAdmin, update: isAdmin }, admin: { position: "sidebar", date: dateTimeInAdmin } },
  {
    name: "assigneeInactive",
    type: "checkbox",
    virtual: true,
    hooks: { afterRead: [computeAssigneeInactive] },
    access: { read: adminOnlyRead, create: denyAll, update: denyAll },
    admin: { ...readOnlyInAdmin, components: { Field: "/components/admin/LeadAssigneeWarning#LeadAssigneeWarning" } },
  },
];

const trackingFields: Field[] = [
  { name: "firstContactedAt", type: "date", access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
  // Mốc tính hạn lưu 24 tháng (ERD §7); `stampLeadTimestamps` và hook của `lead-activities` ghi.
  { name: "lastActivityAt", type: "date", index: true, access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
  { name: "mergedCount", type: "number", min: 0, defaultValue: 0, access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar" } },
  { name: "consentAt", type: "date", required: true, access: systemFieldAccess, admin: { ...readOnlyInAdmin, date: dateTimeInAdmin } },
  { name: "consentVersion", type: "text", required: true, maxLength: 40, access: systemFieldAccess, admin: readOnlyInAdmin },
  {
    name: "utm",
    type: "group",
    access: systemFieldAccess,
    admin: readOnlyInAdmin,
    fields: ["source", "medium", "campaign", "term", "content"].map((name): Field => ({ name, type: "text", maxLength: 200 })),
  },
  { name: "pageUrl", type: "text", maxLength: 2000, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "referrer", type: "text", maxLength: 2000, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "ipHash", type: "text", access: { read: denyAll, create: denyAll, update: denyAll }, admin: { hidden: true } },
  { name: "userAgent", type: "text", maxLength: 500, access: { read: adminOnlyRead, create: denyAll, update: denyAll }, admin: { ...readOnlyInAdmin, hidden: true } },
  { name: "anonymizedAt", type: "date", access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
  // Cột ảo (không có trong DB): lịch sử chăm sóc hiện ngay trong trang lead; quyền đọc theo `lead-activities`.
  { name: "activities", type: "join", collection: "lead-activities", on: "lead", defaultSort: "-createdAt", defaultLimit: 50 },
];

/**
 * Lead khách để lại (ERD §4.11, FR-ADM-09, PERMISSION §3.3-§4, BR-11/BR-32):
 * - Không ai tạo qua REST/admin (`create: denyAll`); bản ghi do endpoint `POST /api/public/leads` (task sau) tạo bằng Local API
 *   `overrideAccess`, sau Turnstile + rate limit.
 * - Sale chỉ đọc/sửa lead mình được giao (`isAssignedOrAdmin` trả điều kiện lọc ở tầng DB: lead người khác là 404, không lộ
 *   sự tồn tại), và chỉ đổi được `status` + `lostReason`; ghi chú đi qua `lead-activities`. Sale không xoá (kể cả xoá mềm).
 * - SĐT/email thuộc lead nên chỉ admin và sale phụ trách thấy (BR-32); lead chưa giao: chỉ admin.
 * - Admin xoá mềm/khôi phục/xoá hẳn có audit (PERMISSION §6); bản đã xoá mềm chỉ admin sửa. Xuất Excel không thuộc collection này.
 */
export const Leads: CollectionConfig = {
  slug: "leads",
  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "fullName", "source", "status", "assignedTo", "assigneeInactive", "createdAt"],
    listSearchableFields: ["code", "fullName"],
  },
  defaultSort: "-createdAt",
  trash: true,
  access: { read: isAssignedOrAdmin, create: denyAll, update: isAssignedOrAdmin, delete: isAdmin },
  disableDuplicate: true,
  hooks: {
    beforeValidate: [guardTrashedEdit, assignLeadCode, guardAnonymizedCustomerData, syncPhoneNormalized],
    beforeChange: [stampLeadTimestamps],
    afterChange: [auditContentTrash, recordStatusChange],
    beforeDelete: [purgeLeadActivities],
    afterDelete: [auditContentPurge],
  },
  fields: [codeField, ...sourceFields, ...customerFields, ...statusFields, ...assignmentFields, ...trackingFields],
};
