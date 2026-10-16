import type { CollectionConfig } from "payload";

/** Tài khoản nội bộ đăng nhập /admin. Vai trò + quyền bổ sung ở layer sau (ERD §staff). */
export const Staff: CollectionConfig = {
  slug: "staff",
  admin: { useAsTitle: "email" },
  auth: true,
  fields: [],
};
