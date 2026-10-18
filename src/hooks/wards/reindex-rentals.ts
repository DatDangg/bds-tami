import type { CollectionAfterChangeHook } from "payload";

import { reindexRentalSearchText } from "../../lib/search/reindex-rental-search-text";

/** Phần của phường mà `searchText` của tin cho thuê đọc: tên + các tên cũ (ERD §6). */
const wardSearchSource = (ward: { name?: unknown; legacyNames?: Array<{ name?: unknown }> | null }): string =>
  JSON.stringify([ward.name, (ward.legacyNames ?? []).map((legacy) => legacy.name)]);

/**
 * Đổi tên hoặc tên cũ (`legacyNames`) của phường thì dựng lại `searchText` của các tin thuộc phường đó, cùng transaction với lần lưu phường.
 * Chỉ chạy khi nguồn tìm kiếm đổi thật (sửa `code`/`slug`/loại không tốn gì). Số tin theo phường nhỏ nên làm đồng bộ.
 */
export const reindexRentalsOnWardChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !req.payload.collections.rentals) return doc;
  if (wardSearchSource(previousDoc) === wardSearchSource(doc)) return doc;
  await reindexRentalSearchText(req.payload, { wardId: String(doc.id) }, req);
  return doc;
};
