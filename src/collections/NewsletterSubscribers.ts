import type { CollectionConfig, FieldHook } from "payload";

import { denyAll, isAdmin, ROLES } from "../access";
import { adminDate } from "../fields/admin-date";
import { collectionLabels } from "../lib/admin/collection-labels";

export const NEWSLETTER_STATUSES = ["active", "unsubscribed"] as const;
export type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number];

export const NEWSLETTER_STATUS_LABELS: Record<NewsletterStatus, string> = {
  active: "Đang nhận",
  unsubscribed: "Đã huỷ",
};

/** Bằng chứng đồng ý: không ai sửa tay sau khi tạo (kể cả admin). Payload bỏ giá trị gửi lên cho field này khi update không `overrideAccess`. */
const lockedAfterCreate = { update: denyAll };

/** Nhãn ngôn ngữ đăng ký: dùng chung cho ô chọn trong admin và cột "Ngôn ngữ" của file Excel (`newsletter-export`). */
export const LOCALE_LABELS = { vi: "Tiếng Việt", en: "Tiếng Anh" } as const;

/** Email lưu dạng đã cắt khoảng trắng + chữ thường để unique chặn được bản trùng khác hoa/thường. */
export const normalizeEmail: FieldHook = ({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value);

/**
 * Người đăng ký "Bản tin thị trường" (BL-054). Dữ liệu cá nhân: chỉ admin đọc / sửa trạng thái / xoá; sale không thấy.
 * Không ai tạo qua REST: form công khai `POST /api/public/newsletter` (P1-T04) ghi bằng Local API sau khi kiểm consent + Turnstile.
 * Trường consent / nguồn là bằng chứng đồng ý: field access `update: denyAll` (khoá cả REST lẫn Local API không `overrideAccess`,
 * như `site-settings.privacyPolicyVersion`), admin chỉ đổi được `status`; endpoint công khai cập nhật bằng `overrideAccess`.
 */
export const NewsletterSubscribers: CollectionConfig = {
  slug: "newsletter-subscribers",
  labels: collectionLabels("newsletter-subscribers"),
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "locale", "status", "createdAt"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Email khách đăng ký nhận bản tin thị trường trên website. Chỉ đổi được trạng thái nhận.",
    // Nút "Xuất Excel" theo bộ lọc trạng thái đang áp (chỉ admin; collection không có thùng rác nên không cần slot server như lead).
    components: { beforeListTable: ["/components/admin/NewsletterExportButton#NewsletterExportButton"] },
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
      access: lockedAfterCreate,
      hooks: { beforeValidate: [normalizeEmail] },
      admin: { readOnly: true },
    },
    {
      name: "locale",
      type: "select",
      label: "Ngôn ngữ",
      required: true,
      defaultValue: "vi",
      access: lockedAfterCreate,
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
    { name: "consentAt", type: "date", label: "Thời điểm đồng ý", access: lockedAfterCreate, admin: { readOnly: true, date: adminDate("dayAndTime") } },
    { name: "privacyPolicyVersion", type: "text", label: "Phiên bản chính sách bảo mật", access: lockedAfterCreate, admin: { readOnly: true } },
    { name: "sourcePath", type: "text", label: "Trang đăng ký", access: lockedAfterCreate, admin: { readOnly: true } },
  ],
};
