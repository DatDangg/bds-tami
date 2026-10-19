import type { GlobalAfterReadHook, GlobalConfig, TextFieldSingleValidation, UploadField } from "payload";

import { denyAll, hideFromNonAdmin, isAdmin } from "../access";
import { translationGroup } from "../fields/translation";
import { createRevalidateGlobal, type RevalidateTags } from "../hooks/revalidate-global";
import { detectManualEnglishGlobal } from "../hooks/translation/detect-manual-en";
import { enqueueTranslation } from "../hooks/translation/enqueue-translation";
import { trimText } from "../hooks/trim-text";
import { ADMIN_GLOBAL_LABELS } from "../lib/admin/collection-labels";
import { formTabs } from "../lib/admin/form-layout";
import { textRowLabel } from "../lib/admin/row-label";
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
const SOCIAL_PLATFORM_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  facebook: "Facebook",
  zalo: "Zalo",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  other: "Khác",
};

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

const imageUpload = (name: string, label: string): UploadField => ({
  name,
  type: "upload",
  label,
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
    label: ADMIN_GLOBAL_LABELS["site-settings"],
    admin: { hidden: hideFromNonAdmin, description: "Thông tin công ty, liên hệ, mạng xã hội, email nhận thông báo và cài đặt dịch tự động." },
    access: { read: () => true, update: isAdmin },
    hooks: {
      afterRead: [stripInternalFields],
      beforeChange: [detectManualEnglishGlobal],
      afterChange: [createRevalidateGlobal("site-settings", revalidate), enqueueTranslation.globalAfterChange],
    },
    fields: [
      formTabs([
        {
          label: "Thông tin công ty",
          fields: [
            { name: "siteName", type: "text", label: "Tên website", localized: true, required: true },
            imageUpload("logo", "Logo"),
            imageUpload("logoDark", "Logo trên nền tối"),
            imageUpload("favicon", "Favicon"),
            { name: "address", type: "text", label: "Địa chỉ công ty", localized: true },
            { name: "mapLocation", type: "point", label: "Toạ độ bản đồ" },
          ],
        },
        {
          label: "Liên hệ & mạng xã hội",
          fields: [
            { name: "hotline", type: "text", label: "Hotline", admin: { description: "Số hiển thị và gọi từ nút nổi (FR-PUB-12)" } },
            { name: "zaloUrl", type: "text", label: "Link Zalo", validate: validateHttpUrl, hooks: { beforeValidate: [trimText] } },
            { name: "fanpageUrl", type: "text", label: "Link Fanpage", validate: validateHttpUrl, hooks: { beforeValidate: [trimText] } },
            { name: "email", type: "email", label: "Email liên hệ" },
            {
              name: "socialLinks",
              type: "array",
              label: "Mạng xã hội",
              labels: { singular: "Mạng xã hội", plural: "Mạng xã hội" },
              admin: { components: { RowLabel: textRowLabel({ field: "platform", fallback: "Mạng xã hội", valueLabels: SOCIAL_PLATFORM_LABELS }) } },
              fields: [
                {
                  name: "platform",
                  type: "select",
                  label: "Nền tảng",
                  required: true,
                  options: SOCIAL_PLATFORMS.map((value) => ({ label: SOCIAL_PLATFORM_LABELS[value], value })),
                },
                { name: "url", type: "text", label: "Đường dẫn", required: true, validate: validateHttpUrl, hooks: { beforeValidate: [trimText] } },
              ],
            },
          ],
        },
        {
          label: "Email nhận thông báo",
          fields: [
            {
              name: "notificationEmails",
              type: "array",
              label: "Email nhận thông báo",
              labels: { singular: "Email", plural: "Email" },
              access: adminOnlyRead,
              admin: { description: "Email nhận thông báo lead / hồ sơ ứng tuyển (chỉ admin thấy)", components: { RowLabel: textRowLabel({ field: "email", fallback: "Email" }) } },
              fields: [{ name: "email", type: "email", label: "Email", required: true }],
            },
          ],
        },
        {
          label: "Dịch tự động",
          fields: [
            {
              name: "translationEnabled",
              type: "checkbox",
              label: "Bật dịch tự động",
              defaultValue: true,
              access: adminOnlyRead,
              admin: { description: "Tắt nhanh dịch tự động (BR-08)" },
            },
            {
              name: "translationGlossary",
              type: "array",
              label: "Thuật ngữ dịch cố định",
              labels: { singular: "Thuật ngữ", plural: "Thuật ngữ" },
              access: adminOnlyRead,
              admin: { description: "Thuật ngữ cố định cho AI dịch (BR-08)", components: { RowLabel: textRowLabel({ field: "vi", fallback: "Thuật ngữ" }) } },
              fields: [
                { name: "vi", type: "text", label: "Tiếng Việt", required: true },
                { name: "en", type: "text", label: "Tiếng Anh", required: true },
                { name: "note", type: "text", label: "Ghi chú" },
              ],
            },
            translationGroup(),
          ],
        },
        {
          label: "Kỹ thuật",
          fields: [
            { name: "gaMeasurementId", type: "text", label: "Mã đo lường Google Analytics (GA4)", validate: validateGaId, admin: { description: "Dạng G-XXXXXXXXXX" } },
            {
              name: "privacyPolicyVersion",
              type: "text",
              label: "Phiên bản chính sách bảo mật",
              access: { update: denyAll },
              admin: { readOnly: true, description: "Tự cập nhật khi xuất bản chính sách bảo mật (BR-30)" },
            },
          ],
        },
      ]),
    ],
  };
}

export const SiteSettings = createSiteSettings();
