import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { AUDIT_ACTIONS } from "../lib/audit/actions";

const denyAll = (): boolean => false;

/**
 * Nhật ký thao tác (ERD §4.13, PERMISSION §3.4/§6): chỉ thêm, chỉ admin đọc.
 * Không ai tạo/sửa/xoá qua API, kể cả admin: bản ghi chỉ sinh từ `writeAuditLog` (Local API, `overrideAccess`)
 * trong code server. Việc dọn bản cũ hơn 24 tháng (ERD §4.15) là job hệ thống riêng, không đi qua access này.
 */
export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "summary",
    defaultColumns: ["createdAt", "action", "actor", "summary"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
  },
  access: {
    read: isAdmin,
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  disableDuplicate: true,
  // Tra cứu theo đối tượng ("ai đã làm gì với bản ghi này"); `createdAt` đã có index mặc định cho danh sách mới nhất.
  indexes: [{ fields: ["collection", "docId"] }],
  fields: [
    { name: "actor", type: "relationship", relationTo: "staff", index: true },
    {
      name: "action",
      type: "select",
      required: true,
      index: true,
      options: AUDIT_ACTIONS.map((value) => ({ label: value, value })),
    },
    { name: "collection", type: "text" },
    { name: "docId", type: "text" },
    { name: "summary", type: "text", required: true },
    // Dữ liệu trước/sau; `writeAuditLog` đã lọc khoá nhạy cảm (mật khẩu, token...).
    { name: "meta", type: "json" },
    { name: "ipHash", type: "text" },
  ],
};
