import { type CollectionBeforeValidateHook, type PayloadRequest, ValidationError } from "payload";

import { preserveRequestLocale } from "../../lib/payload/preserve-request-locale";

type Id = string | number;

/** `parent` có thể là id hoặc bản ghi đã populate (depth > 0). */
function toId(value: unknown): Id | null {
  if (value == null) return null;
  if (typeof value === "object") return toId((value as { id?: unknown }).id);
  return typeof value === "string" || typeof value === "number" ? value : null;
}

async function hasChildren(req: PayloadRequest, id: Id): Promise<boolean> {
  const result = await preserveRequestLocale(req, () =>
    req.payload.find({
      collection: "categories",
      where: { parent: { equals: id } },
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

/** Trả lý do `parent` không hợp lệ, hoặc `null` nếu hợp lệ. */
async function findParentProblem(
  req: PayloadRequest,
  parentId: Id,
  scope: unknown,
  selfId: Id | undefined,
): Promise<string | null> {
  if (selfId !== undefined && String(parentId) === String(selfId)) return "Danh mục không thể là cha của chính nó.";
  const parent = await preserveRequestLocale(req, () =>
    req.payload.findByID({
      collection: "categories",
      id: parentId,
      trash: true,
      depth: 0,
      select: { scope: true, parent: true, deletedAt: true },
      overrideAccess: true,
      req,
      disableErrors: true,
    }),
  );
  if (!parent) return "Danh mục cha không tồn tại.";
  // Đọc với `trash: true` để phân biệt "không tồn tại"; cha trong thùng rác bị ẩn với khách còn con thì không.
  if (parent.deletedAt) return "Danh mục cha đang ở thùng rác.";
  if (parent.scope !== scope) return "Danh mục cha phải cùng loại nội dung (scope) với danh mục con.";
  if (toId(parent.parent) !== null) return "Chỉ hỗ trợ tối đa 2 cấp: danh mục cha đã là danh mục con của danh mục khác.";
  // Gắn một danh mục đang có con vào cha khác sẽ đẩy các con xuống cấp 3.
  if (selfId !== undefined && (await hasChildren(req, selfId))) {
    return "Danh mục đang có danh mục con nên không thể trở thành danh mục con (tối đa 2 cấp).";
  }
  return null;
}

/** Cây danh mục (ERD §4.3): `parent` cùng `scope` với con và tối đa 2 cấp. */
export const validateCategoryTree: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const parentId = toId(data && "parent" in data ? data.parent : originalDoc?.parent);
  if (parentId === null) return data;
  const scope = data?.scope ?? originalDoc?.scope;
  const problem = await findParentProblem(req, parentId, scope, originalDoc?.id);
  if (problem) throw new ValidationError({ collection: "categories", errors: [{ path: "parent", message: problem }] });
  return data;
};
