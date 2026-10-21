import type { CollectionConfig } from "payload";

import { isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";
import { COLLECTION_NAME_ADMIN } from "../components/admin/collection-name-admin";
import { CLICK_TYPE_LABELS, CLICK_TYPES } from "../lib/click-stats/click-types";
import { NO_REF } from "../lib/click-stats/aggregate";

const denyAll = (): boolean => false;

/**
 * Số lượt bấm theo ngày (giờ Việt Nam) cho dashboard (ERD §4.13). Chỉ job `aggregate-click-stats` ghi (Local API).
 * Unique theo bốn cột `(date, type, refCollection, refId)`; `count` là giá trị, không thuộc khoá (ERD ghi "5 cột" nhưng
 * liệt kê cả `count`, vô nghĩa với khoá). `refCollection`/`refId` dùng "" thay NULL để unique index có tác dụng.
 */
export const ClickStatsDaily: CollectionConfig = {
  slug: "click-stats-daily",
  labels: collectionLabels("click-stats-daily"),
  admin: {
    useAsTitle: "type",
    defaultColumns: ["date", "type", "refCollection", "refId", "count"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Số lượt bấm Hotline/Zalo/Fanpage gộp theo ngày (giờ Việt Nam), do hệ thống tổng hợp.",
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  indexes: [{ fields: ["date", "type", "refCollection", "refId"], unique: true }],
  fields: [
    { name: "date", type: "date", label: "Ngày", required: true, index: true, admin: { date: { pickerAppearance: "dayOnly" } } },
    {
      name: "type",
      type: "select",
      label: "Nút được bấm",
      required: true,
      options: CLICK_TYPES.map((value) => ({ label: CLICK_TYPE_LABELS[value], value })),
    },
    { name: "refCollection", type: "text", label: "Loại nội dung", defaultValue: NO_REF, admin: COLLECTION_NAME_ADMIN },
    { name: "refId", type: "text", label: "Mã nội dung", defaultValue: NO_REF },
    { name: "count", type: "number", label: "Số lượt bấm", required: true, min: 0, defaultValue: 0 },
  ],
};
