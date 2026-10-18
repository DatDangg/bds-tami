import type { CollectionAfterChangeHook } from "payload";

import { reindexRentalsFromHook } from "../../lib/search/reindex-in-hook";

/**
 * Đổi tên tỉnh (`name`, không localized) thì dựng lại `searchText` của các tin thuộc tỉnh đó, cùng transaction với lần lưu tỉnh
 * (ERD §6: tên tỉnh nằm trong `searchText`). Chỉ chạy khi `name` đổi thật (sửa `shortName`/`code`/`slug`/`sortOrder` không tốn gì).
 * Tỉnh có thể có nhiều tin: vượt ngưỡng thì hoãn + log, bù bằng `pnpm reindex:rentals-search` (xem `reindexRentalsFromHook`).
 */
export const reindexRentalsOnProvinceRename: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !req.payload.collections.rentals) return doc;
  if ((previousDoc.name ?? "") === (doc.name ?? "")) return doc;
  await reindexRentalsFromHook(req, { provinceId: String(doc.id) }, "provinces");
  return doc;
};
