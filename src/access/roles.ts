/** Nguồn duy nhất của tên vai trò (PERMISSION §1). Không viết chuỗi 'admin'/'sale' ở nơi khác. */
export const ROLES = {
  admin: "admin",
  sale: "sale",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: readonly Role[] = [ROLES.admin, ROLES.sale];

/** Vai trò mặc định khi tạo tài khoản: quyền thấp nhất. */
export const DEFAULT_ROLE: Role = ROLES.sale;
