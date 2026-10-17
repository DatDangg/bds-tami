import type { Access } from "payload";

/**
 * Đọc công khai cho collection không có `status` (danh mục nền, chủ đầu tư; PERMISSION §3.2): khách thấy mọi bản
 * chưa xoá mềm (lọc `deletedAt` để khách không đọc được thùng rác qua `?trash=true`), staff đang hoạt động thấy tất cả,
 * tài khoản khoá không thấy gì.
 */
export const readUnlessTrashed: Access = ({ req: { user } }) => {
  if (!user) return { deletedAt: { exists: false } };
  return user.active === true;
};
