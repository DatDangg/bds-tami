import type { CollectionAfterChangeHook } from "payload";

import { reindexRentalSearchText } from "../../lib/search/reindex-rental-search-text";

/**
 * Đổi tên dự án (ở ngôn ngữ đang lưu) thì dựng lại `searchText` của các tin thuộc dự án đó, cùng transaction với lần lưu dự án
 * (ERD §6: tên dự án nằm trong `searchText`). Dự án chỉ có vài chục tin nên làm đồng bộ; nhiều hơn thì dùng lệnh `reindex:rentals-search`.
 */
export const reindexRentalsOnProjectRename: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !req.payload.collections.rentals) return doc;
  if ((previousDoc.title ?? "") === (doc.title ?? "")) return doc;
  await reindexRentalSearchText(req.payload, { projectId: String(doc.id) }, req);
  return doc;
};
