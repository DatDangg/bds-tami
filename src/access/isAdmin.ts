import type { UserArgs } from "./types";

import { ROLES } from "./roles";

/** Admin đang hoạt động. Tài khoản khoá (`active = false`) mất mọi quyền, kể cả admin. */
export const isAdmin = ({ req: { user } }: UserArgs): boolean =>
  user?.active === true && user.role === ROLES.admin;
