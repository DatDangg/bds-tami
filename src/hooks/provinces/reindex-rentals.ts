import type { CollectionAfterChangeHook } from "payload";

import { markSearchReindexPending } from "../../fields/search-reindex-pending";
import { reindexRentalsFromHook } from "../../lib/search/reindex-in-hook";

/**
 * Đổi tên tỉnh (`name`, không localized) thì dựng lại `searchText` của các tin thuộc tỉnh đó, cùng transaction với lần lưu tỉnh
 * (ERD §6: tên tỉnh nằm trong `searchText`). Chỉ chạy khi `name` đổi thật (sửa `shortName`/`code`/`slug`/`sortOrder` không tốn gì).
 * Tỉnh có thể có nhiều tin: vượt ngưỡng thì xếp job nền `reindex-rentals-search` (xem `reindexRentalsFromHook`) và doc trả về mang cờ
 * `searchReindexPending` để form tỉnh hiện cảnh báo ngay sau khi lưu, tới khi job xong.
 */
export const reindexRentalsOnProvinceRename: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !req.payload.collections.rentals) return doc;
  if ((previousDoc.name ?? "") === (doc.name ?? "")) return doc;
  const outcome = await reindexRentalsFromHook(req, { provinceId: String(doc.id) }, "provinces");
  return markSearchReindexPending(doc, req, outcome);
};
