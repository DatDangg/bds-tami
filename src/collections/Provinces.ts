import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from "payload";

import { isAdmin } from "../access";

/** Còn phường/xã thuộc tỉnh thì chặn xoá bằng thông báo rõ ràng (FK sẽ chỉ báo lỗi NOT NULL khó hiểu). */
const blockDeleteWhileHasWards: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({ collection: "wards", where: { province: { equals: id } }, overrideAccess: true, req });
  if (totalDocs > 0) {
    throw new APIError(`Không xoá được tỉnh/thành đang có ${totalDocs} phường/xã. Hãy xoá hoặc chuyển các phường/xã trước.`, 409, undefined, true);
  }
};

/**
 * Tỉnh/thành sau 01/07/2025 (ERD §4.2, LGL-01): 34 bản ghi do `pnpm seed` nạp (`seed/geo.ts`), `code` = mã BNV 2 số.
 * Danh mục tĩnh công khai: khách/sale chỉ đọc, chỉ admin ghi (PERMISSION §3.2). Tên riêng tiếng Việt nên không
 * localized; không có status/soft delete (hook `beforeDelete` chặn xoá khi còn phường tham chiếu).
 */
export const Provinces: CollectionConfig = {
  slug: "provinces",
  admin: { useAsTitle: "name", defaultColumns: ["name", "code", "shortName", "sortOrder"] },
  defaultSort: "sortOrder",
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeDelete: [blockDeleteWhileHasWards] },
  fields: [
    { name: "code", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "shortName", type: "text" },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "sortOrder", type: "number", defaultValue: 0, index: true },
  ],
};
