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

import type { QuickAction, RecentLead, StatCard, WebsiteShortcut } from "./dashboard-data";
import { QuickActions } from "./QuickActions";
import { RecentLeadsCard } from "./RecentLists";
import { StatCards } from "./StatCards";
import { WebsiteShortcuts } from "./WebsiteShortcuts";

const NOW = new Date("2026-10-19T03:00:00Z");

describe("link nội bộ dashboard dùng next/link (không tải lại toàn trang)", () => {
  it("StatCards", () => {
    const cards: StatCard[] = [{ id: "leads-new", label: "Lead mới", hint: "h", icon: "lead", count: 1, href: "/admin/collections/leads" }];
    render(<StatCards cards={cards} />);
    expect(screen.getByRole("link", { name: /^Lead mới/ }).getAttribute("data-next-link")).toBe("true");
  });

  it("QuickActions (thẻ + Tạo loại khác)", () => {
    const actions: QuickAction[] = [{ id: "new-news", label: "Viết tin tức", href: "/admin/collections/news/create", icon: "draft" }];
    render(<QuickActions actions={actions} moreShortcuts={[{ slug: "projects", label: "Dự án", href: "/admin/collections/projects/create" }]} />);
    expect(screen.getByRole("link", { name: "Viết tin tức" }).getAttribute("data-next-link")).toBe("true");
    expect(screen.getByRole("link", { name: "Dự án", hidden: true }).getAttribute("data-next-link")).toBe("true");
  });

  it("WebsiteShortcuts", () => {
    const shortcuts: WebsiteShortcut[] = [{ slug: "footer", label: "Chân trang", href: "/admin/globals/footer" }];
    render(<WebsiteShortcuts shortcuts={shortcuts} />);
    expect(screen.getByRole("link", { name: "Chân trang" }).getAttribute("data-next-link")).toBe("true");
  });

  it("RecentLeadsCard", () => {
    const lead: RecentLead = { id: "l1", code: "LD-1", fullName: "Nguyễn Thị Lan", source: "rental", status: "new", assigneeName: null, isAssigned: false, createdAt: "2026-10-19T02:52:00Z" };
    render(<RecentLeadsCard leads={[lead]} now={NOW} isAdmin adminRoute="/admin" />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link.getAttribute("data-next-link")).toBe("true");
  });
});
