import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// Link mock đánh dấu data-next-link: nếu ai đó đổi lại <a href> thường (điều hướng toàn trang → toast "Fetching user failed") thì test fail.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} data-next-link="true" {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@payloadcms/ui", () => ({ useListDrawerContext: () => ({}), useConfig: () => ({ config: { routes: { admin: "/admin" } } }), Link: () => null }));

import type { NavGroupCard, RecentLead, StatCard } from "./dashboard-data";
import { DashboardHeader } from "./DashboardHeader";
import { NavGroupCards } from "./NavGroupCards";
import { RecentLeadsCard } from "./RecentLists";
import { StatCards } from "./StatCards";

const NOW = new Date("2026-10-19T03:00:00Z");

describe("link nội bộ dashboard dùng next/link (không tải lại toàn trang)", () => {
  it("StatCards", () => {
    const cards: StatCard[] = [{ id: "leads-new", label: "Lead mới", hint: "h", icon: "lead", count: 1, href: "/admin/collections/leads" }];
    render(<StatCards cards={cards} />);
    expect(screen.getByRole("link", { name: /^Lead mới/ }).getAttribute("data-next-link")).toBe("true");
  });

  it("NavGroupCards", () => {
    const groups: NavGroupCard[] = [{ label: "Khách hàng", items: [{ label: "Lead", href: "/admin/collections/leads" }] }];
    render(<NavGroupCards groups={groups} />);
    expect(screen.getByRole("link", { name: "Lead" }).getAttribute("data-next-link")).toBe("true");
  });

  it("DashboardHeader shortcuts", () => {
    render(<DashboardHeader name="Minh" now={NOW} shortcuts={[{ slug: "news", label: "Tin tức", href: "/admin/collections/news/create" }]} />);
    expect(screen.getByRole("link", { name: "Tin tức", hidden: true }).getAttribute("data-next-link")).toBe("true");
  });

  it("RecentLeadsCard", () => {
    const lead: RecentLead = { id: "l1", code: "LD-1", fullName: "Nguyễn Thị Lan", source: "rental", status: "new", assigneeName: null, isAssigned: false, createdAt: "2026-10-19T02:52:00Z" };
    render(<RecentLeadsCard leads={[lead]} now={NOW} isAdmin adminRoute="/admin" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link.getAttribute("data-next-link")).toBe("true");
  });
});
