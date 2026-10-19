import type { CollectionConfig, EmailFieldValidation, Field } from "payload";
import { email as validateEmail } from "payload/shared";

import { denyAll, isAdmin, ROLES } from "../access";
import { auditApplicationPurge, deleteApplicationCv } from "../hooks/job-applications/delete-cv-and-audit";
import { collectionLabels } from "../lib/admin/collection-labels";

export const APPLICATION_STATUSES = ["new", "reviewing", "interview", "hired", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "Mới",
  reviewing: "Đang xem xét",
  interview: "Phỏng vấn",
  hired: "Đã tuyển",
  rejected: "Từ chối",
};

/**
 * Dữ liệu do ứng viên gửi (và dấu hệ thống): chỉ đọc trong admin, không ai sửa qua API (kể cả admin), kể cả khi quyền tạo
 * bị bỏ qua. Endpoint công khai và job `data-retention` ghi bằng Local API `overrideAccess: true`, vốn bỏ qua access trường.
 */
const submittedFieldAccess = { create: denyAll, update: denyAll };
const readOnlyInAdmin = { readOnly: true } as const;

/**
 * `email` là NOT NULL (G23) nên hồ sơ đã ẩn danh mang giá trị thay thế (`ANONYMIZED_PLACEHOLDER`, không phải địa chỉ email): bỏ qua kiểm định dạng khi `anonymizedAt` đã đặt.
 */
const validateApplicantEmail: EmailFieldValidation = (value, options) =>
  Boolean((options.data as { anonymizedAt?: unknown } | undefined)?.anonymizedAt) || validateEmail(value, options);

const submittedFields: Field[] = [
  { name: "fullName", type: "text", label: "Họ tên ứng viên", required: true, maxLength: 120, access: submittedFieldAccess, admin: readOnlyInAdmin },
  { name: "phone", type: "text", label: "Số điện thoại", required: true, maxLength: 20, access: submittedFieldAccess, admin: readOnlyInAdmin },
  { name: "email", type: "email", label: "Email", required: true, validate: validateApplicantEmail, access: submittedFieldAccess, admin: readOnlyInAdmin },
  { name: "message", type: "textarea", label: "Thư giới thiệu", maxLength: 2000, access: submittedFieldAccess, admin: readOnlyInAdmin },
  {
    name: "cv",
    type: "upload",
    label: "CV",
    relationTo: "private-files",
    // Bắt buộc cho tới khi hồ sơ bị ẩn danh (`data-retention` xoá CV rồi đặt `anonymizedAt`); vì vậy cột DB cho phép NULL.
    validate: (value: unknown, { data }: { data?: { anonymizedAt?: unknown } }) =>
      Boolean(value) || Boolean(data?.anonymizedAt) || "CV là bắt buộc",
    access: submittedFieldAccess,
    admin: readOnlyInAdmin,
  },
  {
    name: "cvDownload",
    type: "ui",
    label: "Tải CV",
    admin: { components: { Field: "/components/admin/CvDownloadButton#CvDownloadButton" } },
  },
  { name: "consentAt", type: "date", label: "Đồng ý chính sách lúc", required: true, access: submittedFieldAccess, admin: { ...readOnlyInAdmin, date: { pickerAppearance: "dayAndTime" } } },
  { name: "consentVersion", type: "text", label: "Phiên bản chính sách đã đồng ý", required: true, maxLength: 40, access: submittedFieldAccess, admin: readOnlyInAdmin },
  {
    name: "locale",
    type: "select",
    label: "Ngôn ngữ ứng viên dùng",
    required: true,
    options: [
      { label: "Tiếng Việt", value: "vi" },
      { label: "English", value: "en" },
    ],
    access: submittedFieldAccess,
    admin: readOnlyInAdmin,
  },
];

/**
 * Hồ sơ ứng tuyển (ERD §4.10, FR-ADM-05, PERMISSION §3.3). Dữ liệu cá nhân của ứng viên, nên:
 * - Chỉ admin đọc/sửa/xoá; sale và khách bị 403. Không ai tạo qua REST (`create: denyAll`, kể cả admin): bản ghi do endpoint
 *   `POST /api/public/job-applications` (task sau) tạo bằng Local API `overrideAccess`, sau khi kiểm Turnstile + rate limit.
 * - Admin chỉ đổi `status` và `note`; mọi trường khách gửi là chỉ đọc (`submittedFields`).
 * - `ipHash` không trả ra qua API/admin (`read: denyAll`): chỉ để chống lạm dụng, ghi bằng Local API.
 * - Không bật `trash`, `versions`, nhân bản: tránh sinh thêm bản sao dữ liệu cá nhân. Hết hạn lưu (12 tháng, ERD §7) do job
 *   `data-retention` ẩn danh (đặt `anonymizedAt`, xoá CV) bằng Local API.
 */
export const JobApplications: CollectionConfig = {
  slug: "job-applications",
  labels: collectionLabels("job-applications"),
  admin: {
    useAsTitle: "fullName",
    defaultColumns: ["fullName", "jobPosting", "status", "createdAt"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Hồ sơ ứng viên nộp qua website (chỉ admin xem); tự ẩn danh sau 12 tháng.",
  },
  defaultSort: "-createdAt",
  access: { read: isAdmin, create: denyAll, update: isAdmin, delete: isAdmin },
  disableDuplicate: true,
  // Xoá hàng loạt tắt: rollback "CV lỗi thì giữ hồ sơ" chỉ đảm bảo cho xoá từng bản ghi. Audit chạy trước, xoá CV (S3, không hoàn tác) chạy cuối.
  disableBulkDelete: true,
  hooks: { afterDelete: [auditApplicationPurge, deleteApplicationCv] },
  fields: [
    { name: "jobPosting", type: "relationship", label: "Vị trí ứng tuyển", relationTo: "job-postings", required: true, index: true, access: submittedFieldAccess, admin: readOnlyInAdmin },
    ...submittedFields,
    {
      name: "status",
      type: "select",
      label: "Trạng thái",
      required: true,
      index: true,
      defaultValue: "new",
      options: APPLICATION_STATUSES.map((value) => ({ label: APPLICATION_STATUS_LABELS[value], value })),
      admin: { position: "sidebar", components: { Cell: "/components/admin/StatusBadge#StatusBadgeCell" } },
    },
    { name: "note", type: "textarea", label: "Ghi chú nội bộ", maxLength: 2000, admin: { description: "Ghi chú nội bộ, ứng viên không thấy." } },
    { name: "ipHash", type: "text", access: { read: denyAll, create: denyAll, update: denyAll }, admin: { hidden: true } },
    { name: "anonymizedAt", type: "date", label: "Đã ẩn danh lúc", access: submittedFieldAccess, admin: { ...readOnlyInAdmin, position: "sidebar" } },
  ],
};
