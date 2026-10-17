import { ROLES } from "./roles";

/** `admin.hidden` cho mục chỉ admin dùng (vd globals cấu hình): sale không thấy trong menu admin (PERMISSION §3.2). */
export const hideFromNonAdmin = ({ user }: { user?: { role?: string | null } | null }): boolean => user?.role !== ROLES.admin;
