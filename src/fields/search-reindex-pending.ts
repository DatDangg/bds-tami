import type { CheckboxField, FieldHook, PayloadRequest } from "payload";

import { denyAll, isAdmin } from "../access";
import { REINDEX_RENTALS_SEARCH_SLUG, type ReindexScopeKind } from "../lib/search/reindex-job-input";

/** Id các bản ghi (cùng loại) đang có job reindex chờ hoặc chạy; tra 1 lần cho cả request (danh sách admin nhiều dòng) và nhớ trong `req.context`. */
async function pendingReindexIds(req: PayloadRequest, scope: ReindexScopeKind): Promise<Set<string>> {
  const cache = (req.context.searchReindexPending ??= new Map<string, Set<string>>()) as Map<string, Set<string>>;
  const cached = cache.get(scope);
  if (cached) return cached;
  const found = await req.payload.find({
    collection: "payload-jobs",
    // Không lọc `processing`: job đang chạy vẫn là "đang dựng lại". Job lỗi cuối (hasError) không còn là chờ; `completedAt` thường không có vì job xong bị xoá.
    where: { and: [{ taskSlug: { equals: REINDEX_RENTALS_SEARCH_SLUG } }, { completedAt: { exists: false } }, { hasError: { not_equals: true } }, { "input.scope": { equals: scope } }] },
    limit: 0,
    depth: 0,
    pagination: false,
    select: { input: true },
    overrideAccess: true,
    req,
  });
  const ids = new Set<string>();
  for (const job of found.docs) {
    const id = (job.input as { id?: unknown } | undefined)?.id;
    if (typeof id === "string") ids.add(id);
  }
  cache.set(scope, ids);
  return ids;
}

/** Cờ "tin thuộc bản ghi này đang được dựng lại chỉ mục ở chế độ nền" (cột ảo, chỉ admin có giá trị; khách/sale đọc được collection nhưng không thấy gì và không tốn truy vấn). */
export const computeSearchReindexPending =
  (scope: ReindexScopeKind): FieldHook =>
  async ({ data, originalDoc, req }) => {
    // Cùng điều kiện với access `read` của field (admin đang hoạt động) để giá trị không bao giờ tính ra rồi bị access cắt.
    if (!isAdmin({ req })) return undefined;
    const id = (data ?? originalDoc)?.id;
    // Một số config test chỉ nạp một phần collection (không có Payload Jobs) → không có hàng đợi thì không có gì đang chờ.
    if (id === undefined || id === null || !req.payload.collections["payload-jobs"]) return false;
    return (await pendingReindexIds(req, scope)).has(String(id));
  };

/**
 * Gắn cờ `searchReindexPending: true` vào doc mà hook afterChange trả về khi lần lưu vừa xếp job nền. Cần vì Payload chạy afterRead của field
 * (tính cờ từ bảng job) TRƯỚC afterChange của collection (nơi xếp job), và form admin dựng lại từ chính doc trả về của lần lưu — không gắn thì
 * admin không thấy cảnh báo ngay sau khi bấm Lưu, chỉ thấy khi tải lại trang. Chỉ gắn cho admin (cùng điều kiện access `read` của field).
 */
export function markSearchReindexPending<T extends object>(doc: T, req: PayloadRequest, outcome: unknown): T {
  if (outcome !== "queued" || !isAdmin({ req })) return doc;
  return { ...doc, searchReindexPending: true };
}

/**
 * Field ảo cho form tỉnh/phường/dự án: hiện cảnh báo (component `SearchReindexPendingWarning`) khi có job `reindex-rentals-search` đang chờ/chạy cho chính bản ghi
 * (sau lần lưu đổi tên vượt `SYNC_REINDEX_LIMIT`). Không có cột DB, không ghi được; đặt đầu form để admin thấy ngay sau khi lưu (`markSearchReindexPending`).
 */
export function searchReindexPendingField(scope: ReindexScopeKind): CheckboxField {
  return {
    name: "searchReindexPending",
    type: "checkbox",
    label: "Đang dựng lại chỉ mục tìm kiếm",
    virtual: true,
    hooks: { afterRead: [computeSearchReindexPending(scope)] },
    access: { read: ({ req }) => isAdmin({ req }), create: denyAll, update: denyAll },
    admin: { readOnly: true, components: { Field: "/components/admin/SearchReindexPendingWarning#SearchReindexPendingWarning" } },
  };
}
