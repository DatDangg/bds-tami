import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { CLICK_TYPES } from "../lib/click-stats/click-types";

const denyAll = (): boolean => false;

/**
 * Lượt bấm Hotline/Zalo/Fanpage (ERD §4.13): chỉ admin đọc, không ai tạo/sửa/xoá qua API.
 * Bản ghi do endpoint `POST /api/public/click-events` tạo bằng Local API (`overrideAccess`); job
 * `aggregate-click-stats` gộp vào `click-stats-daily` rồi xoá bản cũ hơn 90 ngày.
 */
export const ClickEvents: CollectionConfig = {
  slug: "click-events",
  admin: {
    useAsTitle: "pagePath",
    defaultColumns: ["createdAt", "type", "pagePath"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      index: true,
      options: CLICK_TYPES.map((value) => ({ label: value, value })),
    },
    { name: "pagePath", type: "text", required: true },
    { name: "refCollection", type: "text" },
    { name: "refId", type: "text" },
    // Dấu "đã gộp vào click-stats-daily": job chỉ cộng các bản chưa có dấu và chỉ xoá các bản đã có dấu,
    // nên chạy lại không cộng trùng và không mất lượt bấm chưa gộp.
    {
      name: "aggregatedAt",
      type: "date",
      index: true,
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
};
