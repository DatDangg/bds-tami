import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let mockPathname = "/admin";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
vi.mock("@payloadcms/ui", () => ({
  useConfig: () => ({ config: { routes: { admin: "/admin" } } }),
  Link: ({ children, className, href, id }: React.ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a className={className} href={href} id={id}>
      {children}
    </a>
  ),
}));

import { NavDashboardLink } from "./NavDashboardLink";

afterEach(() => {
  mockPathname = "/admin";
});

describe("NavDashboardLink", () => {
  it.each(["/admin", "/admin/"])("đang ở dashboard (%s) -> không link, có vạch indicator", (pathname) => {
    mockPathname = pathname;
    const { container } = render(<NavDashboardLink />);
    const item = container.querySelector("#nav-dashboard");
    expect(item?.tagName).toBe("DIV");
    expect(item?.className).toBe("nav__link");
    expect(item?.querySelector(".nav__link-indicator")).not.toBeNull();
    expect(screen.getByText("Tổng quan")).toBeTruthy();
  });

  it("ở màn khác -> link về admin route, không indicator", () => {
    mockPathname = "/admin/collections/rentals";
    const { container } = render(<NavDashboardLink />);
    const item = container.querySelector("#nav-dashboard");
    expect(item?.tagName).toBe("A");
    expect(item?.getAttribute("href")).toBe("/admin");
    expect(item?.className).toBe("nav__link");
    expect(item?.querySelector(".nav__link-indicator")).toBeNull();
    expect(screen.getByText("Tổng quan")).toBeTruthy();
  });
});
