import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";
import { CLICK_TYPE_LABELS, CLICK_TYPES } from "../lib/click-stats/click-types";

const denyAll = (): boolean => false;

/**
 * Lượt bấm Hotline/Zalo/Fanpage (ERD §4.13): chỉ admin đọc, không ai tạo/sửa/xoá qua API.
 * Bản ghi do endpoint `POST /api/public/click-events` tạo bằng Local API (`overrideAccess`); job
 * `aggregate-click-stats` gộp vào `click-stats-daily` rồi xoá bản cũ hơn 90 ngày.
 */
export const ClickEvents: CollectionConfig = {
  slug: "click-events",
  labels: collectionLabels("click-events"),
  admin: {
    useAsTitle: "pagePath",
    defaultColumns: ["createdAt", "type", "pagePath"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Từng lượt bấm nút Hotline/Zalo/Fanpage trên website (giữ 90 ngày rồi gộp thành thống kê ngày).",
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  fields: [
    {
      name: "type",
      type: "select",
      label: "Nút được bấm",
      required: true,
      index: true,
      options: CLICK_TYPES.map((value) => ({ label: CLICK_TYPE_LABELS[value], value })),
    },
    { name: "pagePath", type: "text", label: "Trang được bấm", required: true },
    { name: "refCollection", type: "text", label: "Loại nội dung" },
    { name: "refId", type: "text", label: "Mã nội dung" },
    // Dấu "đã gộp vào click-stats-daily": job chỉ cộng các bản chưa có dấu và chỉ xoá các bản đã có dấu,
    // nên chạy lại không cộng trùng và không mất lượt bấm chưa gộp.
    {
      name: "aggregatedAt",
      type: "date",
      label: "Ngày gộp thống kê",
      index: true,
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
};
