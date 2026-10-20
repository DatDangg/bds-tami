import type { CollectionConfig } from "payload";

import { isAdmin } from "../access";
import { searchReindexPendingField } from "../fields/search-reindex-pending";
import { blockDeleteWhileHasRentals } from "../hooks/wards/guard-delete";
import { reindexRentalsOnWardChange } from "../hooks/wards/reindex-rentals";
import { collectionLabels } from "../lib/admin/collection-labels";
import { textRowLabel } from "../lib/admin/row-label";

export const WARD_TYPES = ["phuong", "xa", "dac_khu"] as const;
export type WardType = (typeof WARD_TYPES)[number];

const WARD_TYPE_LABELS: Record<WardType, string> = { phuong: "Phường", xa: "Xã", dac_khu: "Đặc khu" };

/**
 * Phường/xã/đặc khu sau 01/07/2025 (ERD §4.2, LGL-01), `code` = mã TMS 8 số. `legacyNames` là tên đơn vị cũ
 * ("Phường Bến Nghé, Quận 1") để tìm kiếm. Slug duy nhất trong cùng tỉnh: DB giữ UNIQUE (`province`, `slug`).
 * Khách/sale chỉ đọc, chỉ admin ghi; hook `beforeDelete` chặn xoá phường còn tin cho thuê tham chiếu (409). Không localized, không status/soft delete (như `provinces`).
 * Đổi tên/tên cũ dựng lại `searchText` của tin thuộc phường (hook `afterChange`); nhiều tin thì job nền + cảnh báo trên form (`searchReindexPendingField`).
 */
export const Wards: CollectionConfig = {
  slug: "wards",
  labels: collectionLabels("wards"),
  admin: { useAsTitle: "name", defaultColumns: ["name", "province", "type", "code"], description: "Phường/xã/đặc khu sau sáp nhập 01/07/2025; kèm tên cũ để tìm kiếm." },
  defaultSort: "name",
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeDelete: [blockDeleteWhileHasRentals], afterChange: [reindexRentalsOnWardChange] },
  indexes: [{ fields: ["province", "slug"], unique: true }],
  fields: [
    searchReindexPendingField("ward"),
    { name: "province", type: "relationship", label: "Tỉnh/thành", relationTo: "provinces", required: true, index: true },
    { name: "code", type: "text", label: "Mã đơn vị hành chính", required: true, unique: true, index: true },
    { name: "name", type: "text", label: "Tên", required: true },
    {
      name: "type",
      type: "select",
      label: "Loại đơn vị",
      required: true,
      options: WARD_TYPES.map((value) => ({ label: WARD_TYPE_LABELS[value], value })),
    },
    { name: "slug", type: "text", label: "Đường dẫn", required: true },
    {
      name: "legacyNames",
      type: "array",
      label: "Tên cũ",
      labels: { singular: "Tên cũ", plural: "Tên cũ" },
      admin: { description: "Tên đơn vị cũ trước 01/07/2025, dùng cho tìm kiếm.", components: { RowLabel: textRowLabel({ field: "name", fallback: "Tên cũ" }) } },
      fields: [{ name: "name", type: "text", label: "Tên đơn vị cũ", required: true }],
    },
  ],
};
