import type { CollectionAfterChangeHook } from "payload";

import { markSearchReindexPending } from "../../fields/search-reindex-pending";
import { reindexRentalsFromHook } from "../../lib/search/reindex-in-hook";

/**
 * Đổi tên dự án (ở ngôn ngữ đang lưu) thì dựng lại `searchText` của các tin thuộc dự án đó, cùng transaction với lần lưu dự án
 * (ERD §6: tên dự án nằm trong `searchText`). Dự án thường chỉ có vài chục tin nên làm đồng bộ; vượt ngưỡng thì xếp job nền `reindex-rentals-search`
 * (`reindexRentalsFromHook`) và doc trả về mang cờ `searchReindexPending` để form hiện cảnh báo ngay sau khi lưu.
 */
export const reindexRentalsOnProjectRename: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !req.payload.collections.rentals) return doc;
  if ((previousDoc.title ?? "") === (doc.title ?? "")) return doc;
  const outcome = await reindexRentalsFromHook(req, { projectId: String(doc.id) }, "projects");
  return markSearchReindexPending(doc, req, outcome);
};
