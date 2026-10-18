import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig } from "payload";

import { isAdmin } from "../access";

/** Bảng tham chiếu tỉnh bằng khoá ngoại NOT NULL: còn bản ghi (kể cả xoá mềm) thì chặn xoá bằng thông báo rõ ràng thay vì lỗi 500. */
const REFERENCING_COLLECTIONS = [
  { slug: "wards", label: "phường/xã" },
  { slug: "rentals", label: "tin cho thuê" },
  { slug: "projects", label: "dự án" },
  { slug: "property-posts", label: "tin đăng BĐS" },
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
 * localized; không có status/soft delete (hook `beforeDelete` chặn xoá khi còn phường/tin cho thuê/dự án tham chiếu).
 */
export const Provinces: CollectionConfig = {
  slug: "provinces",
  admin: { useAsTitle: "name", defaultColumns: ["name", "code", "shortName", "sortOrder"] },
  defaultSort: "sortOrder",
  access: { read: () => true, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeDelete: [blockDeleteWhileReferenced] },
  fields: [
    { name: "code", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "shortName", type: "text" },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "sortOrder", type: "number", defaultValue: 0, index: true },
  ],
};
