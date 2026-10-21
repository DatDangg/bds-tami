"use client";

import { useAuth } from "@payloadcms/ui";
import { useEffect, type ReactNode } from "react";

/**
 * Provider admin: ghi vai trò người dùng đang đăng nhập vào `data-admin-role` trên <html> để CSS ẩn/hiện điều khiển theo vai trò
 * (BL-051 A13: "Hiển thị cột"/"Lọc nâng cao" chỉ hiện cho admin, mặc định ẩn để sale không thấy nháy).
 * Chỉ là gọn giao diện: quyền đọc/ghi vẫn do access phía server quyết định. Đổi tài khoản/đăng xuất thì thuộc tính đổi theo `user` mới.
 */
export function AdminRoleAttribute({ children }: { children?: ReactNode }) {
  const role = useAuth().user?.role;

  useEffect(() => {
    const root = document.documentElement;
    if (typeof role === "string" && role) root.dataset.adminRole = role;
    else delete root.dataset.adminRole;
    return () => {
      delete root.dataset.adminRole;
    };
  }, [role]);

  return children;
}
