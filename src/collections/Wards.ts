import type { CollectionConfig } from "payload";

import { isAdmin } from "../access";
import { blockDeleteWhileHasRentals } from "../hooks/wards/guard-delete";
import { reindexRentalsOnWardChange } from "../hooks/wards/reindex-rentals";

export const WARD_TYPES = ["phuong", "xa", "dac_khu"] as const;
export type WardType = (typeof WARD_TYPES)[number];

const WARD_TYPE_LABELS: Record<WardType, string> = { phuong: "Phường", xa: "Xã", dac_khu: "Đặc khu" };

/**
 * Phường/xã/đặc khu sau 01/07/2025 (ERD §4.2, LGL-01), `code` = mã TMS 8 số. `legacyNames` là tên đơn vị cũ
 * ("Phường Bến Nghé, Quận 1") để tìm kiếm. Slug duy nhất trong cùng tỉnh: DB giữ UNIQUE (`province`, `slug`).
 * Khách/sale chỉ đọc, chỉ admin ghi; hook `beforeDelete` chặn xoá phường còn tin cho thuê tham chiếu (409). Không localized, không status/soft delete (như `provinces`).
 */
export const Wards: CollectionConfig = {
  slug: "wards",
  admin: { useAsTitle: "name", defaultColumns: ["name", "province", "type", "code"] },
  defaultSort: "name",
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeDelete: [blockDeleteWhileHasRentals], afterChange: [reindexRentalsOnWardChange] },
  indexes: [{ fields: ["province", "slug"], unique: true }],
  fields: [
    { name: "province", type: "relationship", relationTo: "provinces", required: true, index: true },
    { name: "code", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    {
      name: "type",
      type: "select",
      required: true,
      options: WARD_TYPES.map((value) => ({ label: WARD_TYPE_LABELS[value], value })),
    },
    { name: "slug", type: "text", required: true },
    {
      name: "legacyNames",
      type: "array",
      admin: { description: "Tên đơn vị cũ trước 01/07/2025, dùng cho tìm kiếm." },
      fields: [{ name: "name", type: "text", required: true }],
    },
  ],
};
