import type { CollectionBeforeOperationHook } from "payload";

import { expandLeadPhoneSearch } from "../../lib/leads/phone-search";

/**
 * Danh sách admin ghép ô tìm kiếm thành `where: { or: [{ code: { like } }, { phone: { like } }, …] }` (`mergeListSearchAndWhere` của Payload);
 * hook này (Payload gọi `read` cho find/findByID, chỉ find có `where`) thêm nhánh `phoneNormalized` để gõ SĐT dạng nào cũng ra lead. Chỉ đọc (read/count), không ghi.
 */
export const expandPhoneSearch: CollectionBeforeOperationHook = ({ args, operation }) => {
  if ((operation !== "read" && operation !== "count") || !args || typeof args !== "object" || !("where" in args)) return args;
  const where = expandLeadPhoneSearch((args as { where?: Parameters<typeof expandLeadPhoneSearch>[0] }).where);
  return { ...args, where };
};
