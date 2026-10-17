import { Forbidden, type CollectionBeforeValidateHook } from "payload";

import { isAdmin } from "../access";

/**
 * Bản đã xoá mềm chỉ admin được sửa (gồm khôi phục = đặt `deletedAt` về null). Sale chỉ thấy bản của mình
 * trong thùng rác (access `update` lọc theo `author`) nên nếu không chặn ở đây sẽ tự khôi phục được bài mình
 * đã xoá, trái PERMISSION §3.1. Không có user (Local API hệ thống) thì cho qua; có user thì kiểm vai trò kể cả
 * khi `overrideAccess`.
 */
export const guardTrashedEdit: CollectionBeforeValidateHook = ({ originalDoc, operation, req }) => {
  if (operation !== "update" || !originalDoc?.deletedAt || !req.user) return undefined;
  if (!isAdmin({ req })) throw new Forbidden(req.t);
  return undefined;
};
