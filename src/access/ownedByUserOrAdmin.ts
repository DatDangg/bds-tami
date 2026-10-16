import type { Access } from "payload";

import { ROLES } from "./roles";

/**
 * Admin: toàn quyền. Sale đang hoạt động: chỉ bản ghi có `ownerField` trỏ về chính mình
 * (trả query constraint để Payload lọc ở tầng DB, tránh BOLA/IDOR). Còn lại: từ chối.
 */
export function ownedByUserOrAdmin(ownerField: string): Access {
  return ({ req: { user } }) => {
    if (user?.active !== true) return false;
    if (user.role === ROLES.admin) return true;
    if (user.role === ROLES.sale) return { [ownerField]: { equals: user.id } };
    return false;
  };
}
