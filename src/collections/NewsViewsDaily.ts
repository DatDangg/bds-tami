import type { CollectionConfig } from "payload";

import { denyAll, isAdmin, ROLES } from "../access";
import { collectionLabels } from "../lib/admin/collection-labels";

/**
 * Lượt xem tin tức theo ngày (BL-054, khối "Đọc nhiều"). Mỗi bài một dòng mỗi ngày giờ Việt Nam: `day` là mốc 00:00 giờ VN của ngày đó.
 * Unique `(news, day)` để endpoint `POST /api/public/news-views` cộng dồn bằng upsert nguyên tử (SQL / Local API, P1-T03).
 * Chỉ admin đọc; không ai tạo / sửa / xoá qua API. Không lưu IP / User-Agent.
 */
export const NewsViewsDaily: CollectionConfig = {
  slug: "news-views-daily",
  labels: collectionLabels("news-views-daily"),
  admin: {
    defaultColumns: ["day", "news", "views"],
    hidden: ({ user }) => user?.role !== ROLES.admin,
    description: "Số lượt xem từng tin tức theo ngày (giờ Việt Nam), do hệ thống ghi; dùng cho khối \"Đọc nhiều\".",
  },
  access: { read: isAdmin, create: denyAll, update: denyAll, delete: denyAll },
  disableDuplicate: true,
  defaultSort: "-day",
  indexes: [{ fields: ["news", "day"], unique: true }],
  fields: [
    { name: "news", type: "relationship", label: "Tin tức", relationTo: "news", required: true, index: true },
    { name: "day", type: "date", label: "Ngày", required: true, index: true, admin: { date: { pickerAppearance: "dayOnly" } } },
    { name: "views", type: "number", label: "Lượt xem", required: true, min: 0, defaultValue: 0 },
  ],
};
