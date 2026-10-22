import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";
import { COLLECTION_NAME_ADMIN } from "../components/admin/collection-name-admin";
import { AUDIT_ACTIONS, type AuditAction } from "../lib/audit/actions";

const denyAll = (): boolean => false;

const ACTION_LABELS: Record<AuditAction, string> = {
  "lead.assign": "Phân công lead",
  "lead.export": "Xuất Excel lead",
  "content.delete": "Chuyển nội dung vào thùng rác",
  "content.restore": "Khôi phục nội dung",
  "content.purge": "Xoá vĩnh viễn nội dung",
  "staff.create": "Tạo tài khoản",
  "staff.reset_password": "Đặt lại mật khẩu",
  "staff.update_role": "Đổi vai trò",
  "staff.deactivate": "Khoá tài khoản",
  "staff.activate": "Mở lại tài khoản",
  "staff.delete": "Xoá tài khoản",
  "auth.login_failed": "Đăng nhập thất bại",
  "application.view_cv": "Xem CV ứng viên",
  "content.retranslate": "Dịch lại nội dung",
  "content.approve_translation": "Duyệt bản dịch",
  "system.data_retention": "Dọn dữ liệu hết hạn (hệ thống)",
  "newsletter.export": "Xuất Excel bản tin",
};

/**
 * Nhật ký thao tác (ERD §4.13, PERMISSION §3.4/§6): chỉ thêm, chỉ admin đọc.
 * Không ai tạo/sửa/xoá qua API, kể cả admin: bản ghi chỉ sinh từ `writeAuditLog` (Local API, `overrideAccess`)
 * trong code server. Việc dọn bản cũ hơn 24 tháng (ERD §4.15) là job hệ thống riêng, không đi qua access này.
 */
export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  labels: collectionLabels("audit-logs"),
  admin: {
    useAsTitle: "summary",
    defaultColumns: ["createdAt", "action", "actor", "summary"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Dấu vết các thao tác nhạy cảm (chỉ đọc, giữ 24 tháng).",
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
    { name: "actor", type: "relationship", label: "Người thực hiện", relationTo: "staff", index: true },
    {
      name: "action",
      type: "select",
      label: "Hành động",
      required: true,
      index: true,
      options: AUDIT_ACTIONS.map((value) => ({ label: ACTION_LABELS[value], value })),
    },
    { name: "collection", type: "text", label: "Loại dữ liệu", admin: COLLECTION_NAME_ADMIN },
    { name: "docId", type: "text", label: "Mã bản ghi" },
    { name: "summary", type: "text", label: "Tóm tắt", required: true },
    // Dữ liệu trước/sau; `writeAuditLog` đã lọc khoá nhạy cảm (mật khẩu, token...).
    { name: "meta", type: "json", label: "Chi tiết kỹ thuật" },
    { name: "ipHash", type: "text", label: "IP (đã ẩn danh)" },
  ],
};
