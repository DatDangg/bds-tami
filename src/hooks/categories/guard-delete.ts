import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
} from "payload";

import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";
import { asCollectionSlug, CATEGORY_SCOPE_COLLECTIONS, type CategoryScope } from "./scope-collections";

const conflict = (message: string) => new APIError(message, 409, undefined, true);

/** Có ít nhất một bản ghi (kể cả đã xoá mềm) khớp `where`? Chỉ cần biết có hay không nên `limit: 1`. */
async function exists(req: PayloadRequest, collection: string, where: Record<string, unknown>): Promise<boolean> {
  const result = await preserveRequestLocale(req, () =>
    req.payload.find({
      collection: asCollectionSlug(collection),
      where: where as never,
      trash: true,
      depth: 0,
      limit: 1,
      pagination: false,
      select: { id: true } as never,
      overrideAccess: true,
      req,
    }),
  );
  return result.docs.length > 0;
}

/**
 * Chặn xoá danh mục còn danh mục con hoặc còn nội dung dùng (FR-ADM-06). Đếm cả bản đã xoá mềm vì xoá hẳn danh
 * mục sẽ để lại `category` trỏ vào bản ghi không còn. Collection nội dung chưa có trong config thì bỏ qua.
 */
export async function assertCategoryUnused(req: PayloadRequest, id: string | number, scope: CategoryScope): Promise<void> {
  if (await exists(req, "categories", { parent: { equals: id } })) {
    throw conflict("Không xoá được danh mục đang có danh mục con. Hãy xoá hoặc chuyển danh mục con trước.");
  }
  const usage = CATEGORY_SCOPE_COLLECTIONS[scope];
  if (!usage || !(usage.collection in req.payload.collections)) return;
  if (await exists(req, usage.collection, { [usage.field]: { equals: id } })) {
    throw conflict("Không xoá được danh mục đang có nội dung sử dụng. Hãy chuyển nội dung sang danh mục khác trước.");
  }
}

/** Xoá hẳn (admin): `beforeDelete` không nhận bản ghi nên đọc lại để lấy `scope`. */
export const guardCategoryHardDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const category = await preserveRequestLocale(req, () =>
    req.payload.findByID({
      collection: "categories",
      id,
      trash: true,
      depth: 0,
      select: { scope: true },
      overrideAccess: true,
      req,
    }),
  );
  await assertCategoryUnused(req, id, category.scope);
};

/** Xoá mềm = đặt `deletedAt` qua update (không đi qua `beforeDelete`), nên chặn ở đây với cùng quy tắc. */
export const guardCategorySoftDelete: CollectionBeforeValidateHook = async ({ data, originalDoc, operation, req }) => {
  const isTrashing = operation === "update" && data?.deletedAt != null && !originalDoc?.deletedAt;
  if (isTrashing && originalDoc) await assertCategoryUnused(req, originalDoc.id, originalDoc.scope);
  return data;
};
