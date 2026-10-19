import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// StatusBadge (dùng ở dashboard) import LinkedCell → @payloadcms/ui kéo file .css mà Node không nạp được; dashboard chỉ dùng phần badge.
vi.mock("@payloadcms/ui", () => ({ useListDrawerContext: () => ({}), useConfig: () => ({ config: { routes: { admin: "/admin" } } }), Link: () => null }));

import type { NavGroupCard, RecentLead, RecentOwnDoc, Shortcut, StatCard } from "./dashboard-data";
import { DashboardHeader } from "./DashboardHeader";
import { NavGroupCards } from "./NavGroupCards";
import { RecentLeadsCard, RecentOwnDocsCard } from "./RecentLists";
import { StatCards } from "./StatCards";

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
  const shortcuts: Shortcut[] = [{ slug: "news", label: "Tin tức", href: "/admin/collections/news/create" }];

  it("lời chào theo giờ + tên + ngày, menu Tạo mới liệt kê lối tắt", () => {
    render(<DashboardHeader name="Minh" now={NOW} shortcuts={shortcuts} />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Chào buổi sáng, Minh");
    expect(screen.getByText("Thứ Hai, 19/10/2026")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tin tức", hidden: true }).getAttribute("href")).toBe("/admin/collections/news/create");
  });

  it("không có quyền tạo nào -> không có nút Tạo mới", () => {
    render(<DashboardHeader name="Minh" now={NOW} shortcuts={[]} />);
    expect(screen.queryByText("Tạo mới")).toBeNull();
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

describe("NavGroupCards", () => {
  it("mỗi nhóm một card liệt kê mục", () => {
    const groups: NavGroupCard[] = [{ label: "Khách hàng", items: [{ label: "Lead khách hàng", href: "/admin/collections/leads" }] }];
    render(<NavGroupCards groups={groups} />);
    const nav = screen.getByRole("navigation", { name: "Khách hàng" });
    expect(within(nav).getByRole("link", { name: "Lead khách hàng" }).getAttribute("href")).toBe("/admin/collections/leads");
  });

  it("rỗng -> không render", () => {
    const { container } = render(<NavGroupCards groups={[]} />);
    expect(container.textContent).toBe("");
  });
});
