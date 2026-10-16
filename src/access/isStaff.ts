import type { UserArgs } from "./types";

/**
 * Đã đăng nhập và tài khoản còn hoạt động. So sánh `=== true` có chủ đích:
 * giá trị thiếu/sai kiểu coi như khoá (fail closed). Trả boolean nên dùng được cho
 * cả `access.admin` lẫn access collection/field.
 */
export const isStaff = ({ req: { user } }: UserArgs): boolean => user?.active === true;
