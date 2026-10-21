// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockUser: { role?: string } | null = null;
vi.mock("@payloadcms/ui", () => ({ useAuth: () => ({ user: mockUser }) }));

import { AdminRoleAttribute } from "./AdminRoleAttribute";

const role = () => document.documentElement.getAttribute("data-admin-role");

describe("AdminRoleAttribute", () => {
  afterEach(() => {
    mockUser = null;
    document.documentElement.removeAttribute("data-admin-role");
  });

  it("admin: đặt data-admin-role=admin trên <html> và vẫn render children", () => {
    mockUser = { role: "admin" };
    const { getByText } = render(<AdminRoleAttribute><p>nội dung</p></AdminRoleAttribute>);
    expect(role()).toBe("admin");
    expect(getByText("nội dung")).toBeInTheDocument();
  });

  it("sale: đặt data-admin-role=sale (CSS chỉ mở khoá cho admin)", () => {
    mockUser = { role: "sale" };
    render(<AdminRoleAttribute />);
    expect(role()).toBe("sale");
  });

  it("chưa đăng nhập (user null): không có thuộc tính", () => {
    document.documentElement.dataset.adminRole = "admin";
    render(<AdminRoleAttribute />);
    expect(role()).toBeNull();
  });

  it("đổi tài khoản admin -> sale: cập nhật theo user mới, không giữ role cũ", () => {
    mockUser = { role: "admin" };
    const { rerender } = render(<AdminRoleAttribute />);
    expect(role()).toBe("admin");
    mockUser = { role: "sale" };
    rerender(<AdminRoleAttribute />);
    expect(role()).toBe("sale");
    mockUser = null;
    rerender(<AdminRoleAttribute />);
    expect(role()).toBeNull();
  });

  it("unmount: gỡ thuộc tính", () => {
    mockUser = { role: "admin" };
    const { unmount } = render(<AdminRoleAttribute />);
    unmount();
    expect(role()).toBeNull();
  });
});
