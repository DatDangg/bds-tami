import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// StatusBadge (dùng ở dashboard) import LinkedCell → @payloadcms/ui kéo file .css mà Node không nạp được; dashboard chỉ dùng phần badge.
vi.mock("@payloadcms/ui", () => ({ useListDrawerContext: () => ({}), useConfig: () => ({ config: { routes: { admin: "/admin" } } }), Link: () => null }));

import type { QuickAction, RecentLead, RecentOwnDoc, Shortcut, StatCard, WebsiteShortcut } from "./dashboard-data";
import { DashboardHeader } from "./DashboardHeader";
import { QuickActions } from "./QuickActions";
import { RecentLeadsCard, RecentOwnDocsCard } from "./RecentLists";
import { StatCards } from "./StatCards";
import { WebsiteShortcuts } from "./WebsiteShortcuts";

const NOW = new Date("2026-10-19T03:00:00Z");

const card = (overrides: Partial<StatCard>): StatCard => ({ id: "leads-new", label: "Lead mới", hint: "Trạng thái Mới", icon: "lead", count: 7, ...overrides });

describe("StatCards", () => {
  it("thẻ có href là link; thẻ gộp không phải link; huy hiệu 'Cần giao' chỉ khi số > 0", () => {
    render(
      <StatCards
        cards={[
          card({ href: "/admin/collections/leads?where" }),
          card({ id: "leads-unassigned", label: "Lead chưa phân công", count: 3, warnWhenPositive: true, href: "/admin/collections/leads?x" }),
          card({ id: "content-visible", label: "Nội dung đang hiển thị", count: 1234 }),
          card({ id: "zero", label: "Không có", count: 0, warnWhenPositive: true }),
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: /^Lead mới/ }).getAttribute("href")).toBe("/admin/collections/leads?where");
    expect(screen.queryByRole("link", { name: /Nội dung đang hiển thị/ })).toBeNull();
    expect(screen.getAllByText("Cần giao")).toHaveLength(1);
    expect(screen.getByText(/1\.234/)).toBeTruthy();
  });

  it("không có thẻ nào -> không render gì", () => {
    const { container } = render(<StatCards cards={[]} />);
    expect(container.textContent).toBe("");
  });
});

describe("DashboardHeader", () => {
  it("lời chào theo giờ + tên + ngày", () => {
    render(<DashboardHeader name="Minh" now={NOW} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Chào buổi sáng, Minh");
    expect(screen.getByText("Thứ Hai, 19/10/2026")).toBeTruthy();
  });
});

describe("QuickActions", () => {
  const actions: QuickAction[] = [
    { id: "new-rental", label: "Đăng tin cho thuê mới", href: "/admin/collections/rentals/create", icon: "plus" },
    { id: "assign-leads", label: "Phân công lead (3 chưa giao)", href: "/admin/collections/leads?x", icon: "lead" },
  ];
  const more: Shortcut[] = [{ slug: "projects", label: "Dự án", href: "/admin/collections/projects/create" }];

  it("thẻ thao tác là link; 'Tạo loại khác' liệt kê lối tắt còn lại", () => {
    render(<QuickActions actions={actions} moreShortcuts={more} />);
    expect(screen.getByRole("link", { name: "Đăng tin cho thuê mới" }).getAttribute("href")).toBe("/admin/collections/rentals/create");
    expect(screen.getByRole("link", { name: "Phân công lead (3 chưa giao)" }).getAttribute("href")).toBe("/admin/collections/leads?x");
    expect(screen.getByText("Tạo loại khác")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dự án", hidden: true }).getAttribute("href")).toBe("/admin/collections/projects/create");
  });

  it("không còn lối tắt phụ -> không có 'Tạo loại khác'; không có gì -> không render", () => {
    const { container, unmount } = render(<QuickActions actions={actions} moreShortcuts={[]} />);
    expect(screen.queryByText("Tạo loại khác")).toBeNull();
    unmount();
    const empty = render(<QuickActions actions={[]} moreShortcuts={[]} />);
    expect(empty.container.textContent).toBe("");
    expect(container).toBeTruthy();
  });
});

describe("WebsiteShortcuts", () => {
  it("hàng Sửa website liệt kê globals", () => {
    const shortcuts: WebsiteShortcut[] = [{ slug: "homepage", label: "Trang chủ", href: "/admin/globals/homepage" }];
    render(<WebsiteShortcuts shortcuts={shortcuts} />);
    expect(screen.getByRole("navigation", { name: "Sửa website" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Trang chủ" }).getAttribute("href")).toBe("/admin/globals/homepage");
  });

  it("rỗng (sale) -> không render", () => {
    const { container } = render(<WebsiteShortcuts shortcuts={[]} />);
    expect(container.textContent).toBe("");
  });
});

describe("RecentLists", () => {
  const lead = (overrides: Partial<RecentLead>): RecentLead => ({
    id: "l1",
    code: "LD-1",
    fullName: "Nguyễn Thị Lan",
    source: "rental",
    status: "new",
    assigneeName: null,
    isAssigned: false,
    createdAt: "2026-10-19T02:52:00Z",
    ...overrides,
  });

  it("admin thấy huy hiệu 'Chưa phân công' cho lead mới chưa giao; sale thì không", () => {
    const leads = [lead({}), lead({ id: "l2", fullName: "Trần Văn Hùng", isAssigned: true, assigneeName: "Hoà", status: "consulting" })];
    const { unmount } = render(<RecentLeadsCard leads={leads} now={NOW} isAdmin adminRoute="/admin" />);
    expect(screen.getAllByText("Chưa phân công")).toHaveLength(1);
    expect(screen.getByText(/Sale: Hoà/)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("Lead mới nhất");
    unmount();
    render(<RecentLeadsCard leads={leads} now={NOW} isAdmin={false} adminRoute="/admin" />);
    expect(screen.queryByText("Chưa phân công")).toBeNull();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toContain("Lead được giao gần đây");
  });

  it("danh sách lead trống và bài trống có thông báo", () => {
    render(<RecentLeadsCard leads={[]} now={NOW} isAdmin adminRoute="/admin" />);
    render(<RecentOwnDocsCard docs={[]} now={NOW} />);
    expect(screen.getByText("Chưa có lead nào.")).toBeTruthy();
    expect(screen.getByText("Bạn chưa có bài nào.")).toBeTruthy();
  });

  it("bài của bạn: tiêu đề link + nhãn loại + badge trạng thái", () => {
    const docs: RecentOwnDoc[] = [
      { key: "news:1", collection: "news", collectionLabel: "Tin tức", title: "Thị trường quý III", status: "draft", updatedAt: "2026-10-19T02:40:00Z", href: "/admin/collections/news/1" },
    ];
    render(<RecentOwnDocsCard docs={docs} now={NOW} />);
    expect(screen.getByRole("link", { name: "Thị trường quý III" }).getAttribute("href")).toBe("/admin/collections/news/1");
    expect(screen.getByText("Nháp")).toBeTruthy();
    expect(screen.getByText(/Tin tức · 20 phút trước/)).toBeTruthy();
  });
});
