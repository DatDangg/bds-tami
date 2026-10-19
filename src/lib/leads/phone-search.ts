import type { Where } from "payload";

import { normalizePhone } from "../phone";

/**
 * Ô tìm kiếm danh sách Leads khớp SĐT dù khách/nhân viên gõ dạng nào: `phone` lưu nguyên văn người nhập
 * (`0956 789 012`), nên `like` trên `phone` chỉ khớp đúng chuỗi gõ. Khi từ khoá chuẩn hoá được về E.164 thì thêm nhánh
 * `phoneNormalized equals +84…` vào mọi nhóm `or` đang tìm `phone like <từ khoá>`.
 *
 * Hàm thuần, không đụng tới access: `where` sau khi mở rộng vẫn bị Payload AND với điều kiện `isAssignedOrAdmin` (sale chỉ thấy lead được giao).
 */
export function expandLeadPhoneSearch(where: Where | undefined): Where | undefined {
  if (!where) return where;
  return expandNode(where);
}

function expandNode(node: Where): Where {
  const next: Where = { ...node };
  if (Array.isArray(node.and)) next.and = node.and.map(expandNode);
  if (Array.isArray(node.or)) {
    const conditions = node.or.map(expandNode);
    const normalized = findPhoneSearchTerm(conditions);
    next.or = normalized ? [...conditions, { phoneNormalized: { equals: normalized } }] : conditions;
  }
  return next;
}

/** E.164 của từ khoá nếu nhóm `or` có điều kiện lá `{ phone: { like: <từ khoá> } }` và từ khoá là SĐT hợp lệ. */
function findPhoneSearchTerm(conditions: Where[]): string | null {
  for (const condition of conditions) {
    const phone = condition.phone;
    if (typeof phone !== "object" || phone === null || !("like" in phone) || typeof phone.like !== "string") continue;
    const normalized = normalizePhone(phone.like);
    if (normalized) return normalized;
  }
  return null;
}
