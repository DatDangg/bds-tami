import type { GlobalAfterReadHook, GlobalConfig, TextFieldSingleValidation, UploadField } from "payload";

import { denyAll, hideFromNonAdmin, isAdmin } from "../access";
import { translationGroup } from "../fields/translation";
import { createRevalidateGlobal, type RevalidateTags } from "../hooks/revalidate-global";
import { detectManualEnglishGlobal } from "../hooks/translation/detect-manual-en";
import { enqueueTranslation } from "../hooks/translation/enqueue-translation";
import { trimText } from "../hooks/trim-text";
import { isHttpUrl } from "../lib/content/nav-link";

const validateHttpUrl: TextFieldSingleValidation = (value) => {
  if (typeof value !== "string" || value.trim() === "") return true;
  return isHttpUrl(value.trim()) ? true : "Địa chỉ phải bắt đầu bằng http:// hoặc https://";
};

const validateGaId: TextFieldSingleValidation = (value) => {
  if (typeof value !== "string" || value.trim() === "") return true;
  return /^G-[A-Z0-9]{4,}$/.test(value.trim()) ? true : "Mã đo lường GA4 có dạng G-XXXXXXXXXX";
};

const SOCIAL_PLATFORMS = ["facebook", "zalo", "youtube", "tiktok", "instagram", "linkedin", "x", "other"] as const;

const adminOnlyRead = { read: isAdmin };

/** Trường nội bộ: chỉ admin đọc (PERMISSION §3.2, BR-08). */
const INTERNAL_FIELDS = ["notificationEmails", "translationGlossary", "translationEnabled"] as const;

/**
 * Field access đã bỏ giá trị của `INTERNAL_FIELDS` với người không phải admin, nhưng Payload vẫn trả `[]` cho trường
 * array bị chặn nên khoá còn lộ ra ở REST/Local API. Hook này xoá hẳn khoá. Đọc hệ thống (`overrideAccess: true`: job,
 * script) vẫn thấy đủ.
 */
export const stripInternalFields: GlobalAfterReadHook = ({ doc, overrideAccess, req }) => {
  if (overrideAccess || isAdmin({ req })) return doc;
  for (const field of INTERNAL_FIELDS) delete doc[field];
  return doc;
};

const imageUpload = (name: string): UploadField => ({
  name,
  type: "upload",
  relationTo: "media",
  filterOptions: { mimeType: { contains: "image/" } },
});

/**
 * Cấu hình chung (ERD §4.15, FR-ADM-08). Khách đọc phần công khai; CHỈ admin ghi (PERMISSION §3.2).
 * Ba trường nội bộ (`notificationEmails`, `translationGlossary`, `translationEnabled`) chỉ admin đọc: field access
 * lọc cả REST lẫn Local API có `overrideAccess: false`. `privacyPolicyVersion` ai cũng đọc (làm `consentVersion` cho form)
 * nhưng không ai sửa tay: hook `pages` ghi bằng `overrideAccess` (BR-30, task services-pages).
 */
export function createSiteSettings(revalidate?: RevalidateTags): GlobalConfig {
  return {
    slug: "site-settings",
    label: "Cấu hình chung",
    admin: { hidden: hideFromNonAdmin },
    access: { read: () => true, update: isAdmin },
    hooks: {
      afterRead: [stripInternalFields],
      beforeChange: [detectManualEnglishGlobal],
      afterChange: [createRevalidateGlobal("site-settings", revalidate), enqueueTranslation.globalAfterChange],
    },
    fields: [
      { name: "siteName", type: "text", localized: true, required: true },
      imageUpload("logo"),
      imageUpload("logoDark"),
      imageUpload("favicon"),
      { name: "hotline", type: "text", admin: { description: "Số hiển thị và gọi từ nút nổi (FR-PUB-12)" } },
      { name: "zaloUrl", type: "text", validate: validateHttpUrl, hooks: { beforeValidate: [trimText] } },
      { name: "fanpageUrl", type: "text", validate: validateHttpUrl, hooks: { beforeValidate: [trimText] } },
      { name: "email", type: "email" },
      { name: "address", type: "text", localized: true },
      { name: "mapLocation", type: "point" },
      {
        name: "socialLinks",
        type: "array",
        fields: [
          {
            name: "platform",
            type: "select",
            required: true,
            options: SOCIAL_PLATFORMS.map((value) => ({ label: value, value })),
          },
          { name: "url", type: "text", required: true, validate: validateHttpUrl, hooks: { beforeValidate: [trimText] } },
        ],
      },
      {
        name: "notificationEmails",
        type: "array",
        access: adminOnlyRead,
        admin: { description: "Email nhận thông báo lead / hồ sơ ứng tuyển (chỉ admin thấy)" },
        fields: [{ name: "email", type: "email", required: true }],
      },
      {
        name: "privacyPolicyVersion",
        type: "text",
        access: { update: denyAll },
        admin: { readOnly: true, description: "Tự cập nhật khi xuất bản chính sách bảo mật (BR-30)" },
      },
      { name: "gaMeasurementId", type: "text", validate: validateGaId },
      {
        name: "translationGlossary",
        type: "array",
        access: adminOnlyRead,
        admin: { description: "Thuật ngữ cố định cho AI dịch (BR-08)" },
        fields: [
          { name: "vi", type: "text", required: true },
          { name: "en", type: "text", required: true },
          { name: "note", type: "text" },
        ],
      },
      {
        name: "translationEnabled",
        type: "checkbox",
        defaultValue: true,
        access: adminOnlyRead,
        admin: { description: "Tắt nhanh dịch tự động (BR-08)" },
      },
      translationGroup(),
    ],
  };
}

export const SiteSettings = createSiteSettings();
