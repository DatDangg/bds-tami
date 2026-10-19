import type { CollectionConfig, Field, FieldAccess, RelationshipFieldSingleValidation, TextField } from "payload";

import { denyAll, isAdmin, isAssignedOrAdmin, ROLES } from "../access";
import { auditContentPurge, auditContentTrash } from "../hooks/audit-content-delete";
import { guardTrashedEdit } from "../hooks/guard-trashed-edit";
import { expandPhoneSearch } from "../hooks/leads/expand-phone-search";
import { assignLeadCode } from "../hooks/leads/generate-code";
import { purgeLeadActivities } from "../hooks/leads/lead-activity-hooks";
import { assigneeId, recordAssignmentChange, stampAssignedAt } from "../hooks/leads/on-assignment-change";
import { computeAssigneeInactive, computeAssigneeName, recordStatusChange, stampLeadTimestamps } from "../hooks/leads/status-activity";
import { guardAnonymizedCustomerData, syncPhoneNormalized, validatePhone } from "../hooks/leads/sync-phone-normalized";
import { collectionLabels } from "../lib/admin/collection-labels";
import { formTabs } from "../lib/admin/form-layout";
import { hideTechnicalListFilters } from "../lib/admin/list-filter";
import { ASSIGNEE_NOT_ASSIGNABLE_MESSAGE, isAssignableSale } from "../lib/leads/assignable-sale";
import { LEAD_LIST_SEARCHABLE_FIELDS, LEAD_LOCALES, LEAD_SOURCES, LEAD_STATUSES, type LeadSource, type LeadStatus } from "../lib/leads/lead-values";
import { isUuid } from "../lib/uuid";
import type { Lead } from "../payload-types";

export const SOURCE_LABELS: Record<LeadSource, string> = { rental: "Tin cho thuê", property_post: "Đăng tin BĐS", project: "Dự án", contact: "Liên hệ" };
export const STATUS_LABELS: Record<LeadStatus, string> = {
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
  label: "Mã lead",
  required: true,
  unique: true,
  access: systemFieldAccess,
  admin: { readOnly: true, position: "sidebar" },
};

const sourceFields: Field[] = [
  {
    name: "source",
    type: "select",
    label: "Nguồn lead",
    required: true,
    index: true,
    options: selectOptions(LEAD_SOURCES, SOURCE_LABELS),
    access: systemFieldAccess,
    admin: readOnlyInAdmin,
  },
  { name: "rental", type: "relationship", label: "Tin cho thuê quan tâm", relationTo: "rentals", index: true, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "propertyPost", type: "relationship", label: "Tin BĐS quan tâm", relationTo: "property-posts", index: true, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "project", type: "relationship", label: "Dự án quan tâm", relationTo: "projects", index: true, access: systemFieldAccess, admin: readOnlyInAdmin },
];

const customerFields: Field[] = [
  { name: "fullName", type: "text", label: "Họ tên khách", required: true, maxLength: 120, access: customerFieldAccess },
  { name: "phone", type: "text", label: "Số điện thoại", required: true, maxLength: 20, validate: validatePhone, access: customerFieldAccess },
  // Suy ra từ `phone` bởi hook `syncPhoneNormalized`; index đơn cho tra cứu, index tổng hợp (DESC) tạo trong migration.
  { name: "phoneNormalized", type: "text", required: true, index: true, access: systemFieldAccess, admin: { ...readOnlyInAdmin, hidden: true } },
  { name: "email", type: "email", label: "Email", access: customerFieldAccess },
  { name: "message", type: "textarea", label: "Lời nhắn của khách", maxLength: 2000, access: customerFieldAccess },
  {
    name: "locale",
    type: "select",
    label: "Ngôn ngữ khách dùng",
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
    label: "Trạng thái",
    required: true,
    index: true,
    defaultValue: "new",
    options: selectOptions(LEAD_STATUSES, STATUS_LABELS),
    admin: { position: "sidebar", components: { Cell: "/components/admin/StatusBadge#StatusBadgeCell" } },
  },
  {
    name: "lostReason",
    type: "textarea",
    label: "Lý do không thành",
    maxLength: 1000,
    // BR-11: chuyển `lost` bắt buộc có lý do (khoảng trắng không tính).
    validate: (value: unknown, { data }: { data?: { status?: unknown } }) =>
      data?.status !== "lost" || (typeof value === "string" && value.trim() !== "") || "Chuyển sang Không thành phải nhập lý do",
    admin: { position: "sidebar", condition: (data) => data?.status === "lost" },
  },
];

/**
 * Chỉ chặn khi người phụ trách ĐỔI sang người không phải sale `active`; bỏ giao (null) và giữ nguyên giá trị cũ (sale đã khoá)
 * vẫn lưu được, để lead cũ còn sửa status. `previousValue` = giá trị trước khi lưu (rỗng khi tạo). Cùng `req` để cùng transaction.
 */
const validateAssignee: RelationshipFieldSingleValidation = async (value, { previousValue, req }) => {
  const nextId = assigneeId(value as Lead["assignedTo"]);
  if (!nextId || nextId === assigneeId(previousValue as Lead["assignedTo"])) return true;
  // Id sai dạng làm Postgres ném lỗi cast ở `findByID` (500): từ chối như người nhận không hợp lệ (400).
  if (!isUuid(nextId)) return ASSIGNEE_NOT_ASSIGNABLE_MESSAGE;
  const staff = await req.payload.findByID({ collection: "staff", id: nextId, depth: 0, overrideAccess: true, req, disableErrors: true });
  return isAssignableSale(staff) || ASSIGNEE_NOT_ASSIGNABLE_MESSAGE;
};

const assignmentFields: Field[] = [
  // Chỉ admin đổi (PERMISSION §4); hoạt động/email/audit/`assignedAt` khi đổi người phụ trách do hook `recordAssignmentChange` làm (design D6).
  {
    name: "assignedTo",
    type: "relationship",
    label: "Sale phụ trách",
    relationTo: "staff",
    index: true,
    access: { create: isAdmin, update: isAdmin },
    filterOptions: { role: { equals: ROLES.sale }, active: { equals: true } },
    validate: validateAssignee,
    admin: { position: "sidebar", components: { Cell: "/components/admin/AssigneeCell#AssigneeCell" } },
  },
  { name: "assignedAt", type: "date", label: "Giao lúc", access: { create: isAdmin, update: isAdmin }, admin: { position: "sidebar", date: dateTimeInAdmin } },
  // Tên sale cho cột danh sách (AssigneeCell): trả sẵn trong dữ liệu dòng để khỏi request client-side "Đang tải..." mỗi dòng.
  {
    name: "assigneeName",
    type: "text",
    label: "Tên sale phụ trách",
    virtual: true,
    hooks: { afterRead: [computeAssigneeName] },
    access: { create: denyAll, update: denyAll },
    admin: { ...readOnlyInAdmin, hidden: true, disableListColumn: true, disableListFilter: true, disableBulkEdit: true },
  },
  {
    name: "assigneeInactive",
    type: "checkbox",
    label: "Sale phụ trách đã bị khoá",
    virtual: true,
    hooks: { afterRead: [computeAssigneeInactive] },
    access: { read: adminOnlyRead, create: denyAll, update: denyAll },
    admin: { ...readOnlyInAdmin, position: "sidebar", components: { Field: "/components/admin/LeadAssigneeWarning#LeadAssigneeWarning" } },
  },
];

const UTM_LABELS: Record<string, string> = { source: "Nguồn (utm_source)", medium: "Kênh (utm_medium)", campaign: "Chiến dịch (utm_campaign)", term: "Từ khoá (utm_term)", content: "Nội dung (utm_content)" };

/** Mốc thời gian + dấu hệ thống ghi: cột phải của form (chỉ đọc). */
const timelineFields: Field[] = [
  { name: "firstContactedAt", type: "date", label: "Liên hệ lần đầu lúc", access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
  // Mốc tính hạn lưu 24 tháng (ERD §7); `stampLeadTimestamps` và hook của `lead-activities` ghi.
  { name: "lastActivityAt", type: "date", label: "Hoạt động gần nhất", index: true, access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
  { name: "mergedCount", type: "number", label: "Số lần khách gửi lại (đã gộp)", min: 0, defaultValue: 0, access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar" } },
  // Dấu "đã nhắc admin lead chưa giao" (job `remind-unassigned-leads`, BR-14): nhắc đúng một lần mỗi lead.
  { name: "remindedAt", type: "date", label: "Đã nhắc phân công lúc", access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
  { name: "anonymizedAt", type: "date", label: "Đã ẩn danh lúc", access: systemFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar", date: dateTimeInAdmin } },
];

const consentFields: Field[] = [
  { name: "consentAt", type: "date", label: "Đồng ý chính sách lúc", required: true, access: systemFieldAccess, admin: { ...readOnlyInAdmin, date: dateTimeInAdmin } },
  { name: "consentVersion", type: "text", label: "Phiên bản chính sách đã đồng ý", required: true, maxLength: 40, access: systemFieldAccess, admin: readOnlyInAdmin },
];

/** Dấu vết nguồn khách đến (tab Nguồn); `ipHash`/`userAgent` ẩn khỏi form. */
const trackingFields: Field[] = [
  {
    name: "utm",
    type: "group",
    label: "Tham số UTM",
    access: systemFieldAccess,
    admin: readOnlyInAdmin,
    fields: ["source", "medium", "campaign", "term", "content"].map((name): Field => ({ name, type: "text", label: UTM_LABELS[name], maxLength: 200 })),
  },
  { name: "pageUrl", type: "text", label: "Trang khách gửi form", maxLength: 2000, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "referrer", type: "text", label: "Trang giới thiệu (referrer)", maxLength: 2000, access: systemFieldAccess, admin: readOnlyInAdmin },
  { name: "ipHash", type: "text", access: { read: denyAll, create: denyAll, update: denyAll }, admin: { hidden: true } },
  { name: "userAgent", type: "text", maxLength: 500, access: { read: adminOnlyRead, create: denyAll, update: denyAll }, admin: { ...readOnlyInAdmin, hidden: true } },
];

// Cột ảo (không có trong DB): lịch sử chăm sóc hiện ngay trong trang lead; quyền đọc theo `lead-activities`.
const activitiesField: Field = { name: "activities", type: "join", label: "Lịch sử chăm sóc", collection: "lead-activities", on: "lead", defaultSort: "-createdAt", defaultLimit: 50 };

/** Trường kỹ thuật/định danh ẩn khỏi "Thêm bộ lọc" (BL-021 #06): tên/SĐT/email đã có ô tìm kiếm riêng; còn lại là dấu hệ thống ghi. Giữ: trạng thái, nguồn, sale, các mốc ngày, UTM. */
const LEAD_HIDDEN_FILTER_PATHS = ["fullName", "phone", "phoneNormalized", "email", "locale", "consentAt", "consentVersion", "pageUrl", "referrer", "mergedCount", "remindedAt", "anonymizedAt"];

/**
 * Lead khách để lại (ERD §4.11, FR-ADM-09, PERMISSION §3.3-§4, BR-11/BR-32):
 * - Không ai tạo qua REST/admin (`create: denyAll`); bản ghi do endpoint `POST /api/public/leads` tạo bằng Local API
 *   `overrideAccess`, sau Turnstile + rate limit.
 * - Sale chỉ đọc/sửa lead mình được giao (`isAssignedOrAdmin` trả điều kiện lọc ở tầng DB: lead người khác là 404, không lộ
 *   sự tồn tại), và chỉ đổi được `status` + `lostReason`; ghi chú đi qua `lead-activities`. Sale không xoá (kể cả xoá mềm).
 * - SĐT/email thuộc lead nên chỉ admin và sale phụ trách thấy (BR-32); lead chưa giao: chỉ admin.
 * - Admin xoá mềm/khôi phục/xoá hẳn có audit (PERMISSION §6); bản đã xoá mềm chỉ admin sửa. Xuất Excel không thuộc collection này.
 */
export const Leads: CollectionConfig = hideTechnicalListFilters({
  slug: "leads",
  labels: collectionLabels("leads"),
  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "fullName", "source", "status", "assignedTo", "createdAt"],
    listSearchableFields: [...LEAD_LIST_SEARCHABLE_FIELDS],
    description: "Khách để lại thông tin từ website; sale chỉ thấy lead được giao, admin phân công và xuất Excel.",
    // Nút xuất Excel (slot beforeListTable: trong lề trang, ngay dưới hàng tìm kiếm/Cột/Bộ lọc) theo bộ lọc đang áp (admin; FR-ADM-10). Slot server chặn thùng rác; chỉ admin thấy, endpoint kiểm quyền lại.
    components: { beforeListTable: ["/components/admin/LeadExportSlot#LeadExportSlot"] },
  },
  defaultSort: "-createdAt",
  trash: true,
  // Truy vấn quét của job `remind-unassigned-leads` (BR-14): `status = new` + `assigned_to_id IS NULL` + `reminded_at IS NULL`, lọc/sắp xếp `created_at`.
  // Khai ở đây để snapshot migration đồng bộ; migration `leads_remind_scan_index`. Các index DESC khác vẫn là SQL tay trong migration `leads`.
  indexes: [{ fields: ["status", "assignedTo", "remindedAt", "createdAt"] }],
  access: { read: isAssignedOrAdmin, create: denyAll, update: isAssignedOrAdmin, delete: isAdmin },
  disableDuplicate: true,
  hooks: {
    beforeOperation: [expandPhoneSearch],
    beforeValidate: [guardTrashedEdit, assignLeadCode, guardAnonymizedCustomerData, syncPhoneNormalized],
    beforeChange: [stampLeadTimestamps, stampAssignedAt],
    afterChange: [auditContentTrash, recordStatusChange, recordAssignmentChange],
    beforeDelete: [purgeLeadActivities],
    afterDelete: [auditContentPurge],
  },
  fields: [
    codeField,
    formTabs([
      { label: "Khách hàng", fields: [...customerFields, ...consentFields] },
      { label: "Nguồn", fields: [...sourceFields, ...trackingFields] },
      { label: "Lịch sử chăm sóc", fields: [activitiesField] },
    ]),
    ...statusFields,
    ...assignmentFields,
    ...timelineFields,
  ],
}, LEAD_HIDDEN_FILTER_PATHS);
