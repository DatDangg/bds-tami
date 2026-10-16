import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { CLICK_TYPES } from "../lib/click-stats/click-types";
import { NO_REF } from "../lib/click-stats/aggregate";

const denyAll = (): boolean => false;

/**
 * Số lượt bấm theo ngày (giờ Việt Nam) cho dashboard (ERD §4.13). Chỉ job `aggregate-click-stats` ghi (Local API).
 * Unique theo bốn cột `(date, type, refCollection, refId)`; `count` là giá trị, không thuộc khoá (ERD ghi "5 cột" nhưng
 * liệt kê cả `count`, vô nghĩa với khoá). `refCollection`/`refId` dùng "" thay NULL để unique index có tác dụng.
 */
export const ClickStatsDaily: CollectionConfig = {
  slug: "click-stats-daily",
  admin: {
    useAsTitle: "type",
    defaultColumns: ["date", "type", "refCollection", "refId", "count"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  indexes: [{ fields: ["date", "type", "refCollection", "refId"], unique: true }],
  fields: [
    { name: "date", type: "date", required: true, index: true, admin: { date: { pickerAppearance: "dayOnly" } } },
    {
      name: "type",
      type: "select",
      required: true,
      options: CLICK_TYPES.map((value) => ({ label: value, value })),
    },
    { name: "refCollection", type: "text", defaultValue: NO_REF },
    { name: "refId", type: "text", defaultValue: NO_REF },
    { name: "count", type: "number", required: true, min: 0, defaultValue: 0 },
  ],
};
