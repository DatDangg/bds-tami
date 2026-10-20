import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from "payload";

import { isAdmin } from "../access";
import { searchReindexPendingField } from "../fields/search-reindex-pending";
import { reindexRentalsOnProvinceRename } from "../hooks/provinces/reindex-rentals";
import { collectionLabels } from "../lib/admin/collection-labels";

/** Bảng tham chiếu tỉnh bằng khoá ngoại NOT NULL: còn bản ghi (kể cả xoá mềm) thì chặn xoá bằng thông báo rõ ràng thay vì lỗi 500. */
const REFERENCING_COLLECTIONS = [
  { slug: "wards", label: "phường/xã" },
  { slug: "rentals", label: "tin cho thuê" },
  { slug: "projects", label: "dự án" },
  { slug: "property-posts", label: "tin bất động sản" },
] as const;

const blockDeleteWhileReferenced: CollectionBeforeDeleteHook = async ({ id, req }) => {
  for (const { slug, label } of REFERENCING_COLLECTIONS) {
    // Một số config test chỉ nạp một phần collection.
    if (!req.payload.collections[slug]) continue;
    const { totalDocs } = await req.payload.count({
      collection: slug,
      where: { province: { equals: id } },
      trash: slug !== "wards",
      overrideAccess: true,
      req,
    });
    if (totalDocs > 0) {
      throw new APIError(`Không xoá được tỉnh/thành đang có ${totalDocs} ${label}. Hãy xoá hoặc chuyển các ${label} trước.`, 409, undefined, true);
    }
  }
};

/**
 * Tỉnh/thành sau 01/07/2025 (ERD §4.2, LGL-01): 34 bản ghi do `pnpm seed` nạp (`seed/geo.ts`), `code` = mã BNV 2 số.
 * Danh mục tĩnh công khai: khách/sale chỉ đọc, chỉ admin ghi (PERMISSION §3.2). Tên riêng tiếng Việt nên không
 * localized; không có status/soft delete (hook `beforeDelete` chặn xoá khi còn phường/tin cho thuê/dự án tham chiếu). Đổi `name` dựng lại `searchText` của tin thuộc tỉnh (hook `afterChange`, ERD §6);
 * nhiều tin thì job nền + cảnh báo trên form (`searchReindexPendingField`).
 */
export const Provinces: CollectionConfig = {
  slug: "provinces",
  labels: collectionLabels("provinces"),
  admin: { useAsTitle: "name", defaultColumns: ["name", "code", "shortName", "sortOrder"], description: "34 tỉnh/thành sau sáp nhập 01/07/2025 (danh mục nền)." },
  defaultSort: "sortOrder",
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeDelete: [blockDeleteWhileReferenced], afterChange: [reindexRentalsOnProvinceRename] },
  fields: [
    searchReindexPendingField("province"),
    { name: "code", type: "text", label: "Mã tỉnh/thành", required: true, unique: true, index: true },
    { name: "name", type: "text", label: "Tên", required: true },
    { name: "shortName", type: "text", label: "Tên viết tắt", admin: { description: "Vd: TP.HCM" } },
    { name: "slug", type: "text", label: "Đường dẫn", required: true, unique: true, index: true },
    { name: "sortOrder", type: "number", label: "Thứ tự hiển thị", defaultValue: 0, index: true },
  ],
};
