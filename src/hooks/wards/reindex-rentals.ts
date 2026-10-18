import type { CollectionAfterChangeHook } from "payload";

import { markSearchReindexPending } from "../../fields/search-reindex-pending";
import { reindexRentalsFromHook } from "../../lib/search/reindex-in-hook";

/** Phần của phường mà `searchText` của tin cho thuê đọc: tên + các tên cũ (ERD §6). */
const wardSearchSource = (ward: { name?: unknown; legacyNames?: Array<{ name?: unknown }> | null }): string =>
  JSON.stringify([ward.name, (ward.legacyNames ?? []).map((legacy) => legacy.name)]);

/**
 * Đổi tên hoặc tên cũ (`legacyNames`) của phường thì dựng lại `searchText` của các tin thuộc phường đó, cùng transaction với lần lưu phường.
 * Chỉ chạy khi nguồn tìm kiếm đổi thật (sửa `code`/`slug`/loại không tốn gì). Làm đồng bộ khi số tin nhỏ; vượt ngưỡng thì xếp job nền `reindex-rentals-search`
 * (`reindexRentalsFromHook`) và doc trả về mang cờ `searchReindexPending` để form hiện cảnh báo ngay sau khi lưu.
 */
export const reindexRentalsOnWardChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== "update" || !previousDoc || !req.payload.collections.rentals) return doc;
  if (wardSearchSource(previousDoc) === wardSearchSource(doc)) return doc;
  const outcome = await reindexRentalsFromHook(req, { wardId: String(doc.id) }, "wards");
  return markSearchReindexPending(doc, req, outcome);
};
