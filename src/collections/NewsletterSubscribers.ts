import type { CollectionConfig, FieldHook } from "payload";

import { denyAll, isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";

export const NEWSLETTER_STATUSES = ["active", "unsubscribed"] as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];

export const NEWSLETTER_STATUS_LABELS: Record<NewsletterStatus, string> = {
  active: "Đang nhận",
  unsubscribed: "Đã huỷ",
};

const LOCALE_LABELS = { vi: "Tiếng Việt", en: "Tiếng Anh" } as const;

/** Email lưu dạng đã cắt khoảng trắng + chữ thường để unique chặn được bản trùng khác hoa/thường. */
export const normalizeEmail: FieldHook = ({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

/**
 * Người đăng ký "Bản tin thị trường" (BL-054). Dữ liệu cá nhân: chỉ admin đọc / sửa trạng thái / xoá; sale không thấy.
 * Không ai tạo qua REST: form công khai `POST /api/public/newsletter` (P1-T04) ghi bằng Local API sau khi kiểm consent + Turnstile.
 * Trường consent / nguồn chỉ đọc ở admin (bằng chứng đồng ý), chỉ `status` sửa tay.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: "newsletter-subscribers",
  labels: collectionLabels("newsletter-subscribers"),
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "locale", "status", "createdAt"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Email khách đăng ký nhận bản tin thị trường trên website. Chỉ đổi được trạng thái nhận.",
  },
  access: { read: isAdmin, create: denyAll, update: isAdmin, delete: isAdmin },
  disableDuplicate: true,
  defaultSort: "-createdAt",
  fields: [
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [normalizeEmail] },
      admin: { readOnly: true },
    },
    {
      name: "locale",
      type: "select",
      label: "Ngôn ngữ",
      required: true,
      defaultValue: "vi",
      options: (["vi", "en"] as const).map((value) => ({ label: LOCALE_LABELS[value], value })),
      admin: { readOnly: true },
    },
    {
      name: "status",
      type: "select",
      label: "Trạng thái",
      required: true,
      defaultValue: "active",
      index: true,
      options: NEWSLETTER_STATUSES.map((value) => ({ label: NEWSLETTER_STATUS_LABELS[value], value })),
    },
    { name: "consentAt", type: "date", label: "Thời điểm đồng ý", admin: { readOnly: true, date: { pickerAppearance: "dayAndTime" } } },
    { name: "privacyPolicyVersion", type: "text", label: "Phiên bản chính sách bảo mật", admin: { readOnly: true } },
    { name: "sourcePath", type: "text", label: "Trang đăng ký", admin: { readOnly: true } },
  ],
};
